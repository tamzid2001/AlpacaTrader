import { storage } from '../../storage';
import { sendEmail, emailTemplates } from '../email';
import type { NotificationQueue, NotificationEvent, InsertNotificationQueue, InsertNotificationEvent } from '@shared/schema';

/**
 * Notification Queue Processor Service
 * Handles background processing of notification queue with retry logic and priority management
 */
export class NotificationQueueProcessor {
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly PROCESSING_INTERVAL_MS = 30 * 1000; // 30 seconds
  private readonly MAX_CONCURRENT_JOBS = 5;
  private readonly RETRY_DELAYS = [1000, 5000, 15000]; // Exponential backoff: 1s, 5s, 15s
  private isProcessing = false;

  constructor() {
    console.log('🔄 NotificationQueueProcessor initialized');
  }

  /**
   * Start background queue processing
   */
  start(): void {
    if (this.processingInterval) {
      console.log('⚠️ Notification queue processor already running');
      return;
    }

    console.log(`🚀 Starting notification queue processor (${this.PROCESSING_INTERVAL_MS / 1000}s intervals)`);
    
    // Run initial check
    this.processQueue();
    
    // Set up recurring processing
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, this.PROCESSING_INTERVAL_MS);
    
    console.log('✅ Notification queue processor started successfully');
  }

  /**
   * Stop background queue processing
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('🛑 Notification queue processor stopped');
    }
  }

  /**
   * Process pending notifications from the queue
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      console.log('⏭️ Queue processing already in progress, skipping');
      return;
    }

    this.isProcessing = true;

    try {
      console.log('🔍 Processing notification queue...');

      // Get pending notifications ordered by priority and scheduled time
      const pendingNotifications = await storage.getPendingNotifications(this.MAX_CONCURRENT_JOBS);

      if (pendingNotifications.length === 0) {
        console.log('📝 No pending notifications to process');
        return;
      }

      console.log(`📬 Processing ${pendingNotifications.length} notifications`);

      // Process each notification
      const processingPromises = pendingNotifications.map(notification => 
        this.processNotification(notification)
      );

      await Promise.allSettled(processingPromises);

      console.log(`✅ Completed processing notification queue batch`);
    } catch (error: any) {
      console.error('❌ Error processing notification queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process an individual notification
   */
  private async processNotification(notification: NotificationQueue): Promise<void> {
    try {
      // Log processing start
      await this.logEvent(notification.id, 'processing', {
        attempt: notification.attempts + 1,
        maxAttempts: notification.maxAttempts
      });

      // Update status to processing
      await storage.updateNotificationQueueStatus(notification.id, 'processing');

      // Get template if specified
      let emailContent;
      if (notification.templateId) {
        const template = await storage.getNotificationTemplate(notification.templateId);
        if (!template) {
          throw new Error(`Template ${notification.templateId} not found`);
        }
        emailContent = await this.renderTemplate(template, notification.payload);
      } else {
        // Use payload directly
        emailContent = {
          subject: notification.payload.subject || 'Notification',
          html: notification.payload.html || notification.payload.message || '',
          text: notification.payload.text
        };
      }

      // Send email
      const emailSent = await sendEmail(notification.recipient, emailContent, {
        type: notification.metadata?.type || 'general',
        userId: notification.userId,
        notificationId: notification.id
      });

      if (emailSent) {
        // Mark as sent
        await storage.updateNotificationQueueStatus(notification.id, 'sent', new Date());
        await this.logEvent(notification.id, 'sent', {
          recipient: notification.recipient,
          subject: emailContent.subject
        });
        console.log(`✅ Notification sent: ${emailContent.subject} to ${notification.recipient}`);
      } else {
        throw new Error('Email sending failed');
      }

    } catch (error: any) {
      console.error(`❌ Error processing notification ${notification.id}:`, error.message);
      await this.handleNotificationError(notification, error);
    }
  }

  /**
   * Handle notification processing error with retry logic
   */
  private async handleNotificationError(notification: NotificationQueue, error: Error): Promise<void> {
    const newAttempts = notification.attempts + 1;
    
    if (newAttempts >= notification.maxAttempts) {
      // Max attempts reached, mark as failed
      await storage.updateNotificationQueueStatus(
        notification.id, 
        'failed', 
        undefined, 
        error.message,
        newAttempts
      );
      await this.logEvent(notification.id, 'failed', {
        error: error.message,
        finalAttempt: newAttempts,
        maxAttempts: notification.maxAttempts
      });
      console.error(`❌ Notification ${notification.id} failed permanently after ${newAttempts} attempts`);
    } else {
      // Schedule retry with exponential backoff
      const retryDelay = this.RETRY_DELAYS[Math.min(newAttempts - 1, this.RETRY_DELAYS.length - 1)];
      const retryAt = new Date(Date.now() + retryDelay);
      
      await storage.scheduleNotificationRetry(
        notification.id,
        retryAt,
        error.message,
        newAttempts
      );
      
      await this.logEvent(notification.id, 'retry_scheduled', {
        error: error.message,
        attempt: newAttempts,
        retryAt: retryAt.toISOString(),
        retryDelayMs: retryDelay
      });
      
      console.log(`🔄 Notification ${notification.id} scheduled for retry in ${retryDelay}ms (attempt ${newAttempts}/${notification.maxAttempts})`);
    }
  }

  /**
   * Render template with variables
   */
  private async renderTemplate(template: any, payload: any): Promise<{subject: string, html: string, text?: string}> {
    try {
      let subject = template.subject;
      let html = template.htmlTemplate;
      let text = template.textTemplate;

      // Replace template variables with payload values
      const variables = payload.variables || {};
      
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        const stringValue = String(value);
        
        subject = subject.replace(new RegExp(placeholder, 'g'), stringValue);
        html = html.replace(new RegExp(placeholder, 'g'), stringValue);
        if (text) {
          text = text.replace(new RegExp(placeholder, 'g'), stringValue);
        }
      }

      return { subject, html, text };
    } catch (error: any) {
      console.error('❌ Error rendering template:', error);
      throw new Error(`Template rendering failed: ${error.message}`);
    }
  }

  /**
   * Schedule a new notification
   */
  async scheduleNotification(notification: InsertNotificationQueue): Promise<string> {
    try {
      const notificationId = await storage.createNotificationQueue(notification);
      
      await this.logEvent(notificationId, 'created', {
        type: notification.metadata?.type || 'unknown',
        recipient: notification.recipient,
        scheduledAt: notification.scheduledAt?.toISOString() || 'now',
        priority: notification.priority || 0
      });

      console.log(`📅 Notification scheduled: ${notificationId} for ${notification.recipient}`);
      return notificationId;
    } catch (error: any) {
      console.error('❌ Error scheduling notification:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string, reason?: string): Promise<void> {
    try {
      await storage.updateNotificationQueueStatus(notificationId, 'cancelled', undefined, reason);
      
      await this.logEvent(notificationId, 'cancelled', {
        reason: reason || 'No reason provided'
      });

      console.log(`🚫 Notification cancelled: ${notificationId}`);
    } catch (error: any) {
      console.error(`❌ Error cancelling notification ${notificationId}:`, error);
      throw error;
    }
  }

  /**
   * Get queue processing status
   */
  getStatus(): {
    running: boolean;
    isProcessing: boolean;
    intervalMs: number;
    maxConcurrentJobs: number;
  } {
    return {
      running: this.processingInterval !== null,
      isProcessing: this.isProcessing,
      intervalMs: this.PROCESSING_INTERVAL_MS,
      maxConcurrentJobs: this.MAX_CONCURRENT_JOBS
    };
  }

  /**
   * Process failed notifications for retry
   */
  async retryFailedNotifications(): Promise<{
    retried: number;
    skipped: number;
  }> {
    try {
      console.log('🔄 Retrying failed notifications...');
      
      const failedNotifications = await storage.getRetryableNotifications();
      let retried = 0;
      let skipped = 0;

      for (const notification of failedNotifications) {
        if (notification.attempts < notification.maxAttempts) {
          // Reset to pending for retry
          await storage.updateNotificationQueueStatus(notification.id, 'pending');
          await this.logEvent(notification.id, 'retry_initiated', {
            previousAttempts: notification.attempts
          });
          retried++;
        } else {
          skipped++;
        }
      }

      console.log(`✅ Retry process complete: ${retried} retried, ${skipped} skipped`);
      return { retried, skipped };
    } catch (error: any) {
      console.error('❌ Error retrying failed notifications:', error);
      throw error;
    }
  }

  /**
   * Log notification event for audit trail
   */
  private async logEvent(
    notificationId: string, 
    event: string, 
    details?: any
  ): Promise<void> {
    try {
      const eventData: InsertNotificationEvent = {
        notificationId,
        event,
        details: details || {},
        userAgent: 'NotificationQueueProcessor',
        ipAddress: 'internal'
      };

      await storage.createNotificationEvent(eventData);
    } catch (error: any) {
      // Don't fail notification processing due to logging errors
      console.warn(`⚠️ Failed to log event ${event} for notification ${notificationId}:`, error.message);
    }
  }

  /**
   * Manual processing trigger for testing
   */
  async triggerManualProcessing(): Promise<{ success: boolean; message: string; processed: number }> {
    try {
      const initialPending = await storage.getPendingNotifications(100);
      const initialCount = initialPending.length;
      
      await this.processQueue();
      
      const remainingPending = await storage.getPendingNotifications(100);
      const processed = initialCount - remainingPending.length;
      
      return {
        success: true,
        message: `Manual processing completed`,
        processed
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Manual processing failed: ${error.message}`,
        processed: 0
      };
    }
  }
}

// Export singleton instance
export const notificationQueueProcessor = new NotificationQueueProcessor();

// Export utility functions
export async function scheduleNotification(notification: InsertNotificationQueue): Promise<string> {
  return notificationQueueProcessor.scheduleNotification(notification);
}

export async function cancelNotification(notificationId: string, reason?: string): Promise<void> {
  return notificationQueueProcessor.cancelNotification(notificationId, reason);
}

export function startNotificationQueueProcessor(): void {
  return notificationQueueProcessor.start();
}

export function stopNotificationQueueProcessor(): void {
  return notificationQueueProcessor.stop();
}

export function getNotificationQueueStatus() {
  return notificationQueueProcessor.getStatus();
}