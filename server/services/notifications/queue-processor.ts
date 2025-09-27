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
   * Process an individual notification with user preference checking
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

      // Check user email preferences before processing
      if (notification.userId) {
        const notificationType = this.mapNotificationTypeToInApp(notification.metadata?.type);
        const shouldSendEmail = await storage.shouldSendEmailNotification(notification.userId, notificationType);
        
        if (!shouldSendEmail) {
          // User has disabled email notifications for this type
          await storage.updateNotificationQueueStatus(notification.id, 'skipped', new Date(), 'User preferences disabled email notifications');
          await this.logEvent(notification.id, 'skipped', {
            reason: 'user_preferences_disabled',
            notificationType
          });
          console.log(`⏭️ Notification skipped (user preferences): ${notification.id} for ${notification.recipient}`);
          
          // Create in-app notification instead if user allows it
          if (await storage.shouldSendInAppNotification(notification.userId, notificationType)) {
            await this.createInAppNotificationFromQueue(notification, notificationType);
          }
          
          return;
        }

        // Check email frequency preference
        const preferences = await storage.getUserNotificationPreferences(notification.userId);
        if (preferences && preferences.emailFrequency !== 'instant') {
          // Handle digest batching
          await this.handleDigestBatching(notification, preferences);
          return;
        }
      }

      // Proceed with immediate email sending
      await this.sendImmediateEmail(notification);

    } catch (error: any) {
      console.error(`❌ Error processing notification ${notification.id}:`, error.message);
      await this.handleNotificationError(notification, error);
    }
  }

  /**
   * Send email immediately (instant notifications)
   */
  private async sendImmediateEmail(notification: NotificationQueue): Promise<void> {
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

      // Also create in-app notification if user allows
      if (notification.userId) {
        const notificationType = this.mapNotificationTypeToInApp(notification.metadata?.type);
        if (await storage.shouldSendInAppNotification(notification.userId, notificationType)) {
          await this.createInAppNotificationFromQueue(notification, notificationType);
        }
      }
    } else {
      throw new Error('Email sending failed');
    }
  }

  /**
   * Handle digest batching for non-instant notifications
   */
  private async handleDigestBatching(notification: NotificationQueue, preferences: any): Promise<void> {
    try {
      // Mark notification as batched for digest
      await storage.updateNotificationQueueStatus(notification.id, 'batched', new Date(), 'Batched for digest email');
      
      await this.logEvent(notification.id, 'batched', {
        emailFrequency: preferences.emailFrequency,
        digestTime: preferences.digestEmailTime,
        weeklyDigestDay: preferences.weeklyDigestDay
      });

      console.log(`📦 Notification batched for digest: ${notification.id} (frequency: ${preferences.emailFrequency})`);

      // Create in-app notification immediately if allowed
      if (notification.userId) {
        const notificationType = this.mapNotificationTypeToInApp(notification.metadata?.type);
        if (await storage.shouldSendInAppNotification(notification.userId, notificationType)) {
          await this.createInAppNotificationFromQueue(notification, notificationType);
        }
      }

    } catch (error: any) {
      console.error(`❌ Error batching notification for digest:`, error);
      throw error;
    }
  }

  /**
   * Create in-app notification from queue notification
   */
  private async createInAppNotificationFromQueue(notification: NotificationQueue, notificationType: string): Promise<void> {
    try {
      if (!notification.userId) return;

      const metadata = notification.metadata || {};
      const payload = notification.payload || {};

      await storage.createInAppNotification({
        userId: notification.userId,
        title: payload.subject || 'Notification',
        message: payload.message || payload.html || '',
        type: notificationType,
        category: this.getNotificationCategory(notificationType),
        priority: this.getNotificationPriority(notification.priority || 0),
        actionUrl: metadata.actionUrl,
        actionText: metadata.actionText || 'View Details',
        actionType: metadata.actionType || 'navigate',
        sourceSystem: metadata.sourceSystem || 'system',
        sourceId: metadata.sourceId,
        metadata: {
          ...metadata,
          originalNotificationId: notification.id,
          emailNotificationId: notification.id
        }
      });

      await this.logEvent(notification.id, 'in_app_created', {
        notificationType,
        userId: notification.userId
      });

    } catch (error: any) {
      console.warn(`⚠️ Failed to create in-app notification from queue notification ${notification.id}:`, error.message);
    }
  }

  /**
   * Map queue notification type to in-app notification type
   */
  private mapNotificationTypeToInApp(queueType?: string): any {
    switch (queueType) {
      case 'price_alert':
      case 'market_data':
        return 'market_alert';
      case 'course_update':
        return 'course_update';
      case 'productivity':
      case 'reminder':
        return 'productivity_reminder';
      case 'share_invitation':
        return 'share_invitation';
      case 'admin':
        return 'admin_notification';
      case 'system':
      default:
        return 'system_update';
    }
  }

  /**
   * Get notification category based on type
   */
  private getNotificationCategory(notificationType: string): any {
    switch (notificationType) {
      case 'market_alert':
        return 'info';
      case 'course_update':
        return 'info';
      case 'productivity_reminder':
        return 'warning';
      case 'share_invitation':
        return 'info';
      case 'admin_notification':
        return 'info';
      case 'system_update':
      default:
        return 'success';
    }
  }

  /**
   * Get notification priority based on queue priority
   */
  private getNotificationPriority(queuePriority: number): any {
    if (queuePriority >= 8) return 'urgent';
    if (queuePriority >= 5) return 'high';
    if (queuePriority >= 2) return 'normal';
    return 'low';
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
   * Process daily digest emails
   */
  async processDailyDigests(): Promise<{ success: boolean; processedUsers: number; totalNotifications: number }> {
    try {
      console.log('📧 Processing daily digest emails...');

      // Get all users with daily email frequency preference
      const allUsers = await storage.getAllUsers();
      let processedUsers = 0;
      let totalNotifications = 0;

      for (const user of allUsers) {
        const preferences = await storage.getUserNotificationPreferences(user.id);
        
        if (preferences && preferences.emailFrequency === 'daily') {
          // Check if it's the right time to send digest for this user
          const now = new Date();
          const digestTime = preferences.digestEmailTime || '09:00';
          const [digestHour, digestMinute] = digestTime.split(':').map(Number);
          
          // Allow 1-hour window for digest delivery
          const currentHour = now.getHours();
          if (currentHour >= digestHour && currentHour <= digestHour + 1) {
            const digestResult = await this.sendDailyDigest(user.id);
            if (digestResult.sent) {
              processedUsers++;
              totalNotifications += digestResult.notificationCount;
            }
          }
        }
      }

      console.log(`✅ Daily digest processing complete: ${processedUsers} users, ${totalNotifications} notifications`);
      
      return {
        success: true,
        processedUsers,
        totalNotifications
      };
    } catch (error: any) {
      console.error('❌ Error processing daily digests:', error);
      return {
        success: false,
        processedUsers: 0,
        totalNotifications: 0
      };
    }
  }

  /**
   * Process weekly digest emails
   */
  async processWeeklyDigests(): Promise<{ success: boolean; processedUsers: number; totalNotifications: number }> {
    try {
      console.log('📧 Processing weekly digest emails...');

      // Get all users with weekly email frequency preference
      const allUsers = await storage.getAllUsers();
      let processedUsers = 0;
      let totalNotifications = 0;

      const now = new Date();
      const currentDay = now.toLocaleLowerCase() as any; // monday, tuesday, etc.

      for (const user of allUsers) {
        const preferences = await storage.getUserNotificationPreferences(user.id);
        
        if (preferences && preferences.emailFrequency === 'weekly' && preferences.weeklyDigestDay === currentDay) {
          const digestTime = preferences.digestEmailTime || '09:00';
          const [digestHour, digestMinute] = digestTime.split(':').map(Number);
          
          // Allow 1-hour window for digest delivery
          const currentHour = now.getHours();
          if (currentHour >= digestHour && currentHour <= digestHour + 1) {
            const digestResult = await this.sendWeeklyDigest(user.id);
            if (digestResult.sent) {
              processedUsers++;
              totalNotifications += digestResult.notificationCount;
            }
          }
        }
      }

      console.log(`✅ Weekly digest processing complete: ${processedUsers} users, ${totalNotifications} notifications`);
      
      return {
        success: true,
        processedUsers,
        totalNotifications
      };
    } catch (error: any) {
      console.error('❌ Error processing weekly digests:', error);
      return {
        success: false,
        processedUsers: 0,
        totalNotifications: 0
      };
    }
  }

  /**
   * Send daily digest email for a user
   */
  private async sendDailyDigest(userId: string): Promise<{ sent: boolean; notificationCount: number }> {
    try {
      // Get batched notifications from the last 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const batchedNotifications = await storage.getBatchedNotificationsForUser(userId, yesterday);

      if (batchedNotifications.length === 0) {
        console.log(`📭 No batched notifications for daily digest: ${userId}`);
        return { sent: false, notificationCount: 0 };
      }

      const user = await storage.getUser(userId);
      if (!user || !user.email) {
        console.warn(`⚠️ User not found or no email for digest: ${userId}`);
        return { sent: false, notificationCount: 0 };
      }

      // Generate digest email content
      const digestContent = await this.generateDigestEmail(user, batchedNotifications, 'daily');

      // Send digest email
      const emailSent = await sendEmail(user.email, digestContent, {
        type: 'daily_digest',
        userId: userId,
        notificationId: `daily_digest_${Date.now()}`
      });

      if (emailSent) {
        // Mark notifications as sent in digest
        for (const notification of batchedNotifications) {
          await storage.updateNotificationQueueStatus(notification.id, 'sent_in_digest', new Date(), 'Sent as part of daily digest');
          await this.logEvent(notification.id, 'sent_in_digest', {
            digestType: 'daily',
            digestDate: new Date().toISOString()
          });
        }

        console.log(`✅ Daily digest sent to ${user.email} with ${batchedNotifications.length} notifications`);
        return { sent: true, notificationCount: batchedNotifications.length };
      }

      return { sent: false, notificationCount: batchedNotifications.length };
    } catch (error: any) {
      console.error(`❌ Error sending daily digest for user ${userId}:`, error);
      return { sent: false, notificationCount: 0 };
    }
  }

  /**
   * Send weekly digest email for a user
   */
  private async sendWeeklyDigest(userId: string): Promise<{ sent: boolean; notificationCount: number }> {
    try {
      // Get batched notifications from the last 7 days
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const batchedNotifications = await storage.getBatchedNotificationsForUser(userId, lastWeek);

      if (batchedNotifications.length === 0) {
        console.log(`📭 No batched notifications for weekly digest: ${userId}`);
        return { sent: false, notificationCount: 0 };
      }

      const user = await storage.getUser(userId);
      if (!user || !user.email) {
        console.warn(`⚠️ User not found or no email for digest: ${userId}`);
        return { sent: false, notificationCount: 0 };
      }

      // Generate digest email content
      const digestContent = await this.generateDigestEmail(user, batchedNotifications, 'weekly');

      // Send digest email
      const emailSent = await sendEmail(user.email, digestContent, {
        type: 'weekly_digest',
        userId: userId,
        notificationId: `weekly_digest_${Date.now()}`
      });

      if (emailSent) {
        // Mark notifications as sent in digest
        for (const notification of batchedNotifications) {
          await storage.updateNotificationQueueStatus(notification.id, 'sent_in_digest', new Date(), 'Sent as part of weekly digest');
          await this.logEvent(notification.id, 'sent_in_digest', {
            digestType: 'weekly',
            digestDate: new Date().toISOString()
          });
        }

        console.log(`✅ Weekly digest sent to ${user.email} with ${batchedNotifications.length} notifications`);
        return { sent: true, notificationCount: batchedNotifications.length };
      }

      return { sent: false, notificationCount: batchedNotifications.length };
    } catch (error: any) {
      console.error(`❌ Error sending weekly digest for user ${userId}:`, error);
      return { sent: false, notificationCount: 0 };
    }
  }

  /**
   * Generate digest email content
   */
  private async generateDigestEmail(user: any, notifications: any[], digestType: 'daily' | 'weekly'): Promise<{ subject: string; html: string; text: string }> {
    const userName = user.firstName || user.email || 'User';
    const timeframe = digestType === 'daily' ? 'past 24 hours' : 'past week';
    const count = notifications.length;
    
    const subject = `📋 Your ${digestType} digest: ${count} notification${count !== 1 ? 's' : ''} from PropFarming Pro`;
    
    // Group notifications by type
    const groupedNotifications: Record<string, any[]> = {};
    notifications.forEach(notification => {
      const type = notification.metadata?.type || 'general';
      if (!groupedNotifications[type]) {
        groupedNotifications[type] = [];
      }
      groupedNotifications[type].push(notification);
    });

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${digestType.charAt(0).toUpperCase() + digestType.slice(1)} Digest</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f7f9fc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 30px; }
          .greeting { font-size: 18px; margin-bottom: 20px; color: #333; }
          .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .summary h2 { margin: 0 0 10px 0; color: #667eea; }
          .notification-group { margin: 20px 0; }
          .notification-group h3 { color: #333; font-size: 16px; font-weight: 600; margin: 0 0 10px 0; padding: 10px; background: #f8f9fa; border-radius: 6px; }
          .notification-item { padding: 15px; margin: 10px 0; border-left: 4px solid #667eea; background: #f8f9fa; border-radius: 0 6px 6px 0; }
          .notification-item .title { font-weight: 600; color: #333; margin-bottom: 5px; }
          .notification-item .message { color: #666; font-size: 14px; }
          .notification-item .time { color: #999; font-size: 12px; margin-top: 5px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
          .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 0; }
          .unsubscribe { margin-top: 20px; font-size: 12px; color: #999; }
          .unsubscribe a { color: #667eea; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 ${digestType.charAt(0).toUpperCase() + digestType.slice(1)} Digest</h1>
            <p>PropFarming Pro</p>
          </div>
          <div class="content">
            <div class="greeting">
              Hello ${userName}! 👋
            </div>
            
            <div class="summary">
              <h2>${count} notifications from the ${timeframe}</h2>
              <p>Here's what happened while you were away:</p>
            </div>

            ${Object.entries(groupedNotifications).map(([type, typeNotifications]) => `
              <div class="notification-group">
                <h3>${this.getTypeDisplayName(type)} (${typeNotifications.length})</h3>
                ${typeNotifications.map(notification => `
                  <div class="notification-item">
                    <div class="title">${notification.payload?.subject || 'Notification'}</div>
                    <div class="message">${notification.payload?.message || notification.payload?.html || ''}</div>
                    <div class="time">📅 ${new Date(notification.scheduledAt || notification.createdAt).toLocaleString()}</div>
                  </div>
                `).join('')}
              </div>
            `).join('')}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.BASE_URL || 'https://your-app.repl.co'}/notifications" class="btn">
                📱 View All Notifications
              </a>
            </div>
          </div>
          <div class="footer">
            <p>This ${digestType} digest was sent to ${user.email}</p>
            <div class="unsubscribe">
              <a href="${process.env.BASE_URL || 'https://your-app.repl.co'}/settings/notifications">Manage notification preferences</a> | 
              <a href="${process.env.BASE_URL || 'https://your-app.repl.co'}/unsubscribe?token=${user.id}">Unsubscribe</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
${digestType.charAt(0).toUpperCase() + digestType.slice(1)} Digest - PropFarming Pro

Hello ${userName}!

You have ${count} notifications from the ${timeframe}:

${Object.entries(groupedNotifications).map(([type, typeNotifications]) => 
  `${this.getTypeDisplayName(type)} (${typeNotifications.length}):\n${typeNotifications.map(notification => 
    `- ${notification.payload?.subject || 'Notification'}\n  ${notification.payload?.message || ''}\n  ${new Date(notification.scheduledAt || notification.createdAt).toLocaleString()}`
  ).join('\n')}`
).join('\n\n')}

Manage your notification preferences: ${process.env.BASE_URL || 'https://your-app.repl.co'}/settings/notifications
Unsubscribe: ${process.env.BASE_URL || 'https://your-app.repl.co'}/unsubscribe?token=${user.id}
    `;

    return { subject, html, text };
  }

  /**
   * Get user-friendly type display name
   */
  private getTypeDisplayName(type: string): string {
    switch (type) {
      case 'price_alert':
      case 'market_data':
        return '📊 Market Alerts';
      case 'course_update':
        return '🎓 Course Updates';
      case 'productivity':
      case 'reminder':
        return '✅ Productivity Reminders';
      case 'share_invitation':
        return '🤝 Share Invitations';
      case 'admin':
        return '👨‍💼 Admin Notifications';
      case 'system':
        return '⚙️ System Updates';
      default:
        return '📋 General Notifications';
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