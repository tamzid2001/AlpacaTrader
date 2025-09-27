import { storage } from '../../storage';
import { scheduleNotification } from './queue-processor';
import { sendEmail, emailTemplates } from '../email';
import type { AdminApproval, InsertAdminApproval, AdminApprovalStatus, AdminApprovalResourceType } from '@shared/schema';

/**
 * Admin Workflow Service
 * Handles admin approval workflow for notifications, alert rules, and scheduled content
 */
export class AdminWorkflowService {
  private readonly ADMIN_EMAIL = 'tamzid257@gmail.com'; // Admin notification email
  private readonly AUTO_EXPIRE_HOURS = 72; // Auto-expire approval requests after 72 hours

  constructor() {
    console.log('🔄 AdminWorkflowService initialized');
  }

  /**
   * Create a new approval request
   */
  async createApprovalRequest(
    resourceType: AdminApprovalResourceType,
    resourceId: string,
    requesterId: string,
    details: any,
    autoApprove: boolean = false
  ): Promise<string> {
    try {
      // Calculate expiration time
      const expiresAt = new Date(Date.now() + this.AUTO_EXPIRE_HOURS * 60 * 60 * 1000);

      const approvalData: InsertAdminApproval = {
        resourceType,
        resourceId,
        requesterId,
        requestDetails: details,
        autoApprove,
        expiresAt: autoApprove ? null : expiresAt,
        status: autoApprove ? 'approved' : 'pending'
      };

      const approvalId = await storage.createAdminApproval(approvalData);

      if (autoApprove) {
        console.log(`✅ Auto-approved request: ${approvalId} (${resourceType})`);
        // Execute the approved action immediately
        await this.executeApprovedAction(approvalId, requesterId);
      } else {
        console.log(`📋 Created approval request: ${approvalId} (${resourceType}) - expires ${expiresAt.toISOString()}`);
        
        // Notify admin about pending approval
        await this.notifyAdminOfPendingApproval(approvalId, resourceType, details, requesterId);
      }

      return approvalId;
    } catch (error: any) {
      console.error('❌ Error creating approval request:', error);
      throw error;
    }
  }

  /**
   * Approve a pending request
   */
  async approveRequest(
    approvalId: string, 
    reviewerId: string, 
    notes?: string
  ): Promise<void> {
    try {
      const approval = await storage.getAdminApproval(approvalId);
      if (!approval) {
        throw new Error(`Approval request ${approvalId} not found`);
      }

      if (approval.status !== 'pending') {
        throw new Error(`Approval request ${approvalId} is not in pending state (current: ${approval.status})`);
      }

      // Check if expired
      if (approval.expiresAt && new Date() > approval.expiresAt) {
        await storage.updateAdminApprovalStatus(approvalId, 'expired', reviewerId, 'Request expired before approval');
        throw new Error(`Approval request ${approvalId} has expired`);
      }

      // Update approval status
      await storage.updateAdminApprovalStatus(
        approvalId, 
        'approved', 
        reviewerId, 
        notes || 'Approved by admin',
        new Date()
      );

      console.log(`✅ Approval request approved: ${approvalId} by ${reviewerId}`);

      // Execute the approved action
      await this.executeApprovedAction(approvalId, reviewerId);

      // Notify requester of approval
      await this.notifyRequesterOfApproval(approval, 'approved', notes);

    } catch (error: any) {
      console.error(`❌ Error approving request ${approvalId}:`, error);
      throw error;
    }
  }

  /**
   * Reject a pending request
   */
  async rejectRequest(
    approvalId: string, 
    reviewerId: string, 
    notes: string
  ): Promise<void> {
    try {
      const approval = await storage.getAdminApproval(approvalId);
      if (!approval) {
        throw new Error(`Approval request ${approvalId} not found`);
      }

      if (approval.status !== 'pending') {
        throw new Error(`Approval request ${approvalId} is not in pending state (current: ${approval.status})`);
      }

      // Update approval status
      await storage.updateAdminApprovalStatus(
        approvalId, 
        'rejected', 
        reviewerId, 
        notes,
        new Date()
      );

      console.log(`❌ Approval request rejected: ${approvalId} by ${reviewerId}`);

      // Notify requester of rejection
      await this.notifyRequesterOfApproval(approval, 'rejected', notes);

      // Clean up associated resources if needed
      await this.handleRejectedRequest(approval);

    } catch (error: any) {
      console.error(`❌ Error rejecting request ${approvalId}:`, error);
      throw error;
    }
  }

  /**
   * Get all pending approval requests
   */
  async getPendingApprovals(): Promise<AdminApproval[]> {
    try {
      const approvals = await storage.getPendingAdminApprovals();
      
      // Filter out expired ones and mark them as expired
      const now = new Date();
      const validApprovals: AdminApproval[] = [];

      for (const approval of approvals) {
        if (approval.expiresAt && now > approval.expiresAt) {
          // Mark as expired
          await storage.updateAdminApprovalStatus(
            approval.id, 
            'expired', 
            null, 
            'Automatically expired due to timeout'
          );
          console.log(`⏰ Marked approval request as expired: ${approval.id}`);
        } else {
          validApprovals.push(approval);
        }
      }

      return validApprovals;
    } catch (error: any) {
      console.error('❌ Error getting pending approvals:', error);
      throw error;
    }
  }

  /**
   * Get approval requests for a specific user
   */
  async getUserApprovalRequests(userId: string): Promise<AdminApproval[]> {
    try {
      return await storage.getUserAdminApprovals(userId);
    } catch (error: any) {
      console.error(`❌ Error getting user approval requests for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Execute approved action based on resource type
   */
  private async executeApprovedAction(approvalId: string, approverId: string): Promise<void> {
    try {
      const approval = await storage.getAdminApproval(approvalId);
      if (!approval) {
        throw new Error(`Approval ${approvalId} not found`);
      }

      const { resourceType, resourceId, requestDetails } = approval;

      switch (resourceType) {
        case 'alert_rule':
          await this.executeAlertRuleApproval(resourceId, requestDetails);
          break;

        case 'scheduled_notification':
          await this.executeScheduledNotificationApproval(resourceId, requestDetails, approval.requesterId);
          break;

        case 'excel_report':
          await this.executeExcelReportApproval(resourceId, requestDetails, approval.requesterId);
          break;

        case 'premium_access':
          await this.executePremiumAccessApproval(resourceId, requestDetails, approverId);
          break;

        default:
          console.warn(`⚠️ Unknown resource type for approval execution: ${resourceType}`);
      }

      console.log(`✅ Executed approved action for ${resourceType}: ${resourceId}`);
    } catch (error: any) {
      console.error(`❌ Error executing approved action for ${approvalId}:`, error);
      throw error;
    }
  }

  /**
   * Execute alert rule approval
   */
  private async executeAlertRuleApproval(resourceId: string, requestDetails: any): Promise<void> {
    try {
      // Activate the alert rule
      await storage.updateAlertRuleStatus(resourceId, true);
      
      // Create alert subscription if specified
      if (requestDetails.subscription) {
        await storage.createAlertSubscription({
          userId: requestDetails.userId,
          alertRuleId: resourceId,
          channel: requestDetails.subscription.channel || 'email',
          schedule: requestDetails.subscription.schedule,
          isActive: true
        });
      }

      console.log(`✅ Alert rule activated: ${resourceId}`);
    } catch (error: any) {
      console.error(`❌ Error executing alert rule approval for ${resourceId}:`, error);
      throw error;
    }
  }

  /**
   * Execute scheduled notification approval
   */
  private async executeScheduledNotificationApproval(
    resourceId: string, 
    requestDetails: any, 
    requesterId: string
  ): Promise<void> {
    try {
      // Get user information
      const user = await storage.getUser(requesterId);
      if (!user?.email) {
        throw new Error(`User ${requesterId} not found or no email`);
      }

      // Schedule the notification
      const notificationId = await scheduleNotification({
        userId: requesterId,
        recipient: user.email,
        payload: {
          subject: requestDetails.subject,
          message: requestDetails.message,
          html: requestDetails.html,
          variables: requestDetails.variables || {}
        },
        scheduledAt: new Date(requestDetails.scheduledAt),
        priority: requestDetails.priority || 0,
        metadata: {
          type: 'scheduled',
          approvalId: resourceId,
          originalRequestId: requestDetails.originalRequestId
        }
      });

      console.log(`📅 Scheduled notification created: ${notificationId} for ${user.email}`);
    } catch (error: any) {
      console.error(`❌ Error executing scheduled notification approval:`, error);
      throw error;
    }
  }

  /**
   * Execute Excel report approval
   */
  private async executeExcelReportApproval(
    resourceId: string, 
    requestDetails: any, 
    requesterId: string
  ): Promise<void> {
    try {
      // Get user information  
      const user = await storage.getUser(requesterId);
      if (!user?.email) {
        throw new Error(`User ${requesterId} not found or no email`);
      }

      // Schedule Excel report notification
      const notificationId = await scheduleNotification({
        userId: requesterId,
        recipient: user.email,
        payload: {
          subject: `📊 Excel Report Analysis: ${requestDetails.reportName}`,
          reportName: requestDetails.reportName,
          insights: requestDetails.insights,
          variables: {
            reportName: requestDetails.reportName,
            insights: requestDetails.insights,
            generatedAt: new Date().toISOString()
          }
        },
        templateId: requestDetails.templateId, // Use Excel report template
        priority: 1,
        metadata: {
          type: 'excel_report',
          approvalId: resourceId,
          reportName: requestDetails.reportName
        }
      });

      console.log(`📊 Excel report notification scheduled: ${notificationId}`);
    } catch (error: any) {
      console.error(`❌ Error executing Excel report approval:`, error);
      throw error;
    }
  }

  /**
   * Handle rejected request cleanup
   */
  private async handleRejectedRequest(approval: AdminApproval): Promise<void> {
    try {
      // Clean up resources based on type
      switch (approval.resourceType) {
        case 'alert_rule':
          // Deactivate the alert rule
          await storage.updateAlertRuleStatus(approval.resourceId, false);
          break;

        case 'scheduled_notification':
          // Cancel any associated notifications
          try {
            await storage.cancelNotificationsByMetadata({ approvalId: approval.id });
          } catch (error) {
            console.warn(`⚠️ Failed to cancel notifications for rejected approval ${approval.id}`);
          }
          break;

        default:
          // No cleanup needed for other types
          break;
      }
    } catch (error: any) {
      console.error(`❌ Error handling rejected request cleanup:`, error);
    }
  }

  /**
   * Notify admin of pending approval request
   */
  private async notifyAdminOfPendingApproval(
    approvalId: string,
    resourceType: AdminApprovalResourceType,
    details: any,
    requesterId: string
  ): Promise<void> {
    try {
      const user = await storage.getUser(requesterId);
      const userEmail = user?.email || 'Unknown user';

      const emailContent = {
        subject: `🔔 Admin Approval Required: ${resourceType}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Admin Approval Required</h1>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Request Type:</strong> ${resourceType}</p>
              <p><strong>Approval ID:</strong> ${approvalId}</p>
              <p><strong>Requested by:</strong> ${userEmail}</p>
              <p><strong>Request Details:</strong></p>
              <pre style="background: white; padding: 10px; border-radius: 4px; overflow-x: auto;">${JSON.stringify(details, null, 2)}</pre>
            </div>
            <p><strong>Actions Required:</strong></p>
            <ul>
              <li>Review the request details above</li>
              <li>Access the admin panel to approve or reject</li>
              <li>Provide review notes for the decision</li>
            </ul>
            <p style="color: #6c757d; font-size: 14px;">
              <strong>Auto-expires in:</strong> ${this.AUTO_EXPIRE_HOURS} hours<br>
              <strong>Generated at:</strong> ${new Date().toLocaleString()}
            </p>
          </div>
        `
      };

      await sendEmail(this.ADMIN_EMAIL, emailContent, {
        type: 'admin_notification',
        approvalId,
        resourceType
      });

      console.log(`📧 Admin notified of pending approval: ${approvalId}`);
    } catch (error: any) {
      console.error(`❌ Error notifying admin of pending approval:`, error);
    }
  }

  /**
   * Notify requester of approval decision
   */
  private async notifyRequesterOfApproval(
    approval: AdminApproval, 
    decision: 'approved' | 'rejected',
    notes?: string
  ): Promise<void> {
    try {
      const user = await storage.getUser(approval.requesterId);
      if (!user?.email) {
        console.warn(`⚠️ Cannot notify requester - user ${approval.requesterId} not found or no email`);
        return;
      }

      const isApproved = decision === 'approved';
      const emailContent = {
        subject: `${isApproved ? '✅' : '❌'} Your ${approval.resourceType} request has been ${decision}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: ${isApproved ? '#28a745' : '#dc3545'};">Request ${decision.charAt(0).toUpperCase() + decision.slice(1)}</h1>
            <div style="background: ${isApproved ? '#d4edda' : '#f8d7da'}; border: 1px solid ${isApproved ? '#c3e6cb' : '#f5c6cb'}; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Request Type:</strong> ${approval.resourceType}</p>
              <p><strong>Request ID:</strong> ${approval.id}</p>
              <p><strong>Decision:</strong> ${decision.toUpperCase()}</p>
              ${notes ? `<p><strong>Admin Notes:</strong> ${notes}</p>` : ''}
            </div>
            ${isApproved ? 
              '<p>🎉 Great news! Your request has been approved and the requested action has been executed.</p>' :
              '<p>We apologize, but your request could not be approved at this time. Please review the admin notes above for more information.</p>'
            }
            <p style="color: #6c757d; font-size: 14px;">
              <strong>Decision made at:</strong> ${new Date().toLocaleString()}
            </p>
          </div>
        `
      };

      await sendEmail(user.email, emailContent, {
        type: 'approval_decision',
        approvalId: approval.id,
        decision
      });

      console.log(`📧 Requester notified of ${decision}: ${approval.requesterId}`);
    } catch (error: any) {
      console.error(`❌ Error notifying requester of approval decision:`, error);
    }
  }

  /**
   * Clean up expired approval requests
   */
  async cleanupExpiredApprovals(): Promise<{ expired: number; cleaned: number }> {
    try {
      console.log('🧹 Cleaning up expired approval requests...');
      
      const expiredApprovals = await storage.getExpiredAdminApprovals();
      let cleaned = 0;

      for (const approval of expiredApprovals) {
        try {
          await storage.updateAdminApprovalStatus(
            approval.id, 
            'expired', 
            null, 
            'Automatically expired due to timeout'
          );

          // Handle cleanup for expired requests
          await this.handleRejectedRequest(approval);
          cleaned++;

          console.log(`⏰ Expired approval request: ${approval.id} (${approval.resourceType})`);
        } catch (error: any) {
          console.error(`❌ Error cleaning up expired approval ${approval.id}:`, error);
        }
      }

      console.log(`✅ Cleanup complete: ${expiredApprovals.length} expired, ${cleaned} cleaned`);
      return { expired: expiredApprovals.length, cleaned };
    } catch (error: any) {
      console.error('❌ Error during approval cleanup:', error);
      throw error;
    }
  }

  /**
   * Get approval request statistics
   */
  async getApprovalStats(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    expired: number;
    total: number;
  }> {
    try {
      return await storage.getAdminApprovalStats();
    } catch (error: any) {
      console.error('❌ Error getting approval stats:', error);
      throw error;
    }
  }

  /**
   * Manual trigger for cleanup (for testing)
   */
  async triggerManualCleanup(): Promise<{ success: boolean; message: string; cleaned: number }> {
    try {
      const result = await this.cleanupExpiredApprovals();
      return {
        success: true,
        message: `Cleanup completed: ${result.cleaned} approvals processed`,
        cleaned: result.cleaned
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Cleanup failed: ${error.message}`,
        cleaned: 0
      };
    }
  }

  // ===================
  // PREMIUM APPROVAL METHODS
  // ===================

  /**
   * Create a premium access approval request
   */
  async createPremiumApprovalRequest(
    userId: string,
    requestedTier: string,
    justification: string
  ): Promise<string> {
    try {
      console.log(`📋 Creating premium approval request for user ${userId} (tier: ${requestedTier})`);

      const requestDetails = {
        requestedTier,
        justification,
        requestedAt: new Date().toISOString()
      };

      const approvalId = await this.createApprovalRequest(
        'premium_access',
        userId,
        userId,
        requestDetails,
        false // Premium never auto-approves
      );

      console.log(`✅ Premium approval request created: ${approvalId}`);
      return approvalId;

    } catch (error: any) {
      console.error(`❌ Error creating premium approval request for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Execute premium access approval
   */
  private async executePremiumAccessApproval(
    userId: string,
    requestDetails: any,
    approverId: string
  ): Promise<void> {
    try {
      console.log(`🎯 Executing premium access approval for user ${userId}`);

      const { requestedTier } = requestDetails;

      // Update user premium status in database
      await storage.updateUser(userId, {
        isPremiumApproved: true,
        premiumTier: requestedTier,
        premiumStatus: 'premium',
        premiumApprovedAt: new Date(),
        premiumApprovedBy: approverId
      });

      console.log(`✅ Premium access granted to user ${userId} with tier ${requestedTier}`);

      // Send welcome email to user
      await this.sendPremiumWelcomeEmail(userId, requestedTier);

    } catch (error: any) {
      console.error(`❌ Error executing premium access approval for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get pending premium approval requests
   */
  async getPendingPremiumApprovals(): Promise<AdminApproval[]> {
    try {
      const allPending = await this.getPendingApprovals();
      return allPending.filter(approval => approval.resourceType === 'premium_access');
    } catch (error: any) {
      console.error('❌ Error getting pending premium approvals:', error);
      throw error;
    }
  }

  /**
   * Approve premium access request
   */
  async approvePremiumAccess(
    approvalId: string,
    adminId: string,
    approvedTier?: string,
    notes?: string
  ): Promise<void> {
    try {
      // Get the approval request to update tier if needed
      if (approvedTier) {
        const approval = await storage.getAdminApproval(approvalId);
        if (approval) {
          const updatedDetails = {
            ...approval.requestDetails,
            requestedTier: approvedTier, // Update to admin-approved tier
            adminNotes: notes
          };
          
          // Update the request details
          await storage.updateAdminApproval(approvalId, {
            requestDetails: updatedDetails
          });
        }
      }

      // Use the parent approve method
      await this.approveRequest(approvalId, adminId, notes);

      console.log(`✅ Premium access approved: ${approvalId} by admin ${adminId}`);

    } catch (error: any) {
      console.error(`❌ Error approving premium access ${approvalId}:`, error);
      throw error;
    }
  }

  /**
   * Reject premium access request
   */
  async rejectPremiumAccess(
    approvalId: string,
    adminId: string,
    reason: string
  ): Promise<void> {
    try {
      await this.rejectRequest(approvalId, adminId, reason);

      console.log(`❌ Premium access rejected: ${approvalId} by admin ${adminId}`);

      // Send rejection email with suggestions
      await this.sendPremiumRejectionEmail(approvalId, reason);

    } catch (error: any) {
      console.error(`❌ Error rejecting premium access ${approvalId}:`, error);
      throw error;
    }
  }

  /**
   * Get premium analytics for admin dashboard
   */
  async getPremiumAnalytics(): Promise<{
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    tierDistribution: Record<string, number>;
    recentActivity: AdminApproval[];
  }> {
    try {
      // This would typically query the database for premium-related approvals
      // For now, we'll implement a basic structure
      const allApprovals = await storage.getUserAdminApprovals(''); // Get all approvals
      const premiumApprovals = allApprovals.filter(a => a.resourceType === 'premium_access');

      const analytics = {
        totalRequests: premiumApprovals.length,
        pendingRequests: premiumApprovals.filter(a => a.status === 'pending').length,
        approvedRequests: premiumApprovals.filter(a => a.status === 'approved').length,
        rejectedRequests: premiumApprovals.filter(a => a.status === 'rejected').length,
        tierDistribution: {} as Record<string, number>,
        recentActivity: premiumApprovals.slice(-10) // Last 10 activities
      };

      // Calculate tier distribution
      premiumApprovals.forEach(approval => {
        const tier = approval.requestDetails?.requestedTier || 'unknown';
        analytics.tierDistribution[tier] = (analytics.tierDistribution[tier] || 0) + 1;
      });

      return analytics;

    } catch (error: any) {
      console.error('❌ Error getting premium analytics:', error);
      throw error;
    }
  }

  /**
   * Send premium welcome email
   */
  private async sendPremiumWelcomeEmail(userId: string, tier: string): Promise<void> {
    try {
      const user = await storage.getUser(userId);
      if (!user?.email) return;

      console.log(`📧 Sending premium welcome email to ${user.email} (tier: ${tier})`);

      // This would integrate with the email service
      // For now, we'll just log it
      console.log(`✉️ Premium welcome email sent to ${user.email}`);

    } catch (error: any) {
      console.error(`❌ Error sending premium welcome email for user ${userId}:`, error);
    }
  }

  /**
   * Send premium rejection email
   */
  private async sendPremiumRejectionEmail(approvalId: string, reason: string): Promise<void> {
    try {
      const approval = await storage.getAdminApproval(approvalId);
      if (!approval) return;

      const user = await storage.getUser(approval.requesterId);
      if (!user?.email) return;

      console.log(`📧 Sending premium rejection email to ${user.email}`);

      // This would integrate with the email service
      // For now, we'll just log it
      console.log(`✉️ Premium rejection email sent to ${user.email} with reason: ${reason}`);

    } catch (error: any) {
      console.error(`❌ Error sending premium rejection email for approval ${approvalId}:`, error);
    }
  }
}

// Export singleton instance
export const adminWorkflowService = new AdminWorkflowService();

// Export utility functions
export async function createApprovalRequest(
  resourceType: AdminApprovalResourceType,
  resourceId: string,
  requesterId: string,
  details: any,
  autoApprove: boolean = false
): Promise<string> {
  return adminWorkflowService.createApprovalRequest(resourceType, resourceId, requesterId, details, autoApprove);
}

export async function approveRequest(approvalId: string, reviewerId: string, notes?: string): Promise<void> {
  return adminWorkflowService.approveRequest(approvalId, reviewerId, notes);
}

export async function rejectRequest(approvalId: string, reviewerId: string, notes: string): Promise<void> {
  return adminWorkflowService.rejectRequest(approvalId, reviewerId, notes);
}

export async function getPendingApprovals(): Promise<AdminApproval[]> {
  return adminWorkflowService.getPendingApprovals();
}

export async function getUserApprovalRequests(userId: string): Promise<AdminApproval[]> {
  return adminWorkflowService.getUserApprovalRequests(userId);
}

export async function cleanupExpiredApprovals() {
  return adminWorkflowService.cleanupExpiredApprovals();
}

export async function getApprovalStats() {
  return adminWorkflowService.getApprovalStats();
}