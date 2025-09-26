import type { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import type { InsertAuthAuditLog } from '@shared/schema';

// Risk scoring system
export function calculateRiskScore(req: Request, action: string, success: boolean): number {
  let score = 0;
  
  // Base score for action type
  const actionScores = {
    'login': success ? 1 : 3,
    'logout': 1,
    'failed_login': 5,
    'session_expired': 2,
    'session_hijack_attempt': 9,
    'token_refresh': success ? 1 : 4,
    'account_locked': 8
  };
  
  score += actionScores[action as keyof typeof actionScores] || 0;
  
  // Time-based risk (login attempts outside business hours)
  const hour = new Date().getHours();
  if (action === 'login' && (hour < 6 || hour > 22)) {
    score += 2;
  }
  
  // Geographic risk (if IP geolocation were available)
  // This could be enhanced with IP geolocation services
  
  // User agent risk (suspicious or missing user agents)
  const userAgent = req.get('User-Agent');
  if (!userAgent || userAgent.length < 10) {
    score += 2;
  }
  
  // Frequency risk (rapid successive attempts)
  // This could be enhanced by checking recent audit logs
  
  return Math.min(score, 10); // Cap at 10
}

// Create audit log entry
export async function createAuditLog(
  req: Request,
  action: string,
  success: boolean,
  userId?: string,
  failureReason?: string,
  additionalMetadata?: any
): Promise<void> {
  try {
    const riskScore = calculateRiskScore(req, action, success);
    
    const auditData: InsertAuthAuditLog = {
      userId: userId || null,
      action: action as any, // Cast to enum type
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent'),
      success,
      failureReason,
      sessionId: req.sessionID,
      riskScore,
      metadata: additionalMetadata ? JSON.stringify(additionalMetadata) : null
    };
    
    await storage.createAuthAuditLog(auditData);
    
    // Alert on high-risk events
    if (riskScore >= 7) {
      console.warn(`High-risk security event detected:`, {
        action,
        userId,
        riskScore,
        ip: auditData.ipAddress,
        failureReason
      });
      
      // In production, this could trigger alerts to security team
      // await sendSecurityAlert(auditData);
    }
    
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging failures shouldn't break the application
  }
}

// Middleware to automatically audit authentication events
export const auditAuthEvent = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Intercept response to determine success/failure
    res.send = function(body) {
      const statusCode = res.statusCode;
      const success = statusCode >= 200 && statusCode < 400;
      
      // Extract user ID if available
      const user = req.user as any;
      const userId = user?.claims?.sub;
      
      // Determine failure reason from response
      let failureReason: string | undefined;
      if (!success) {
        try {
          const bodyObj = typeof body === 'string' ? JSON.parse(body) : body;
          failureReason = bodyObj?.error || bodyObj?.message || `HTTP ${statusCode}`;
        } catch {
          failureReason = `HTTP ${statusCode}`;
        }
      }
      
      // Create audit log (async, don't wait)
      createAuditLog(req, action, success, userId, failureReason).catch(console.error);
      
      return originalSend.call(this, body);
    };
    
    res.json = function(obj) {
      const statusCode = res.statusCode;
      const success = statusCode >= 200 && statusCode < 400;
      
      const user = req.user as any;
      const userId = user?.claims?.sub;
      
      let failureReason: string | undefined;
      if (!success) {
        failureReason = obj?.error || obj?.message || `HTTP ${statusCode}`;
      }
      
      createAuditLog(req, action, success, userId, failureReason, obj).catch(console.error);
      
      return originalJson.call(this, obj);
    };
    
    next();
  };
};

// Middleware to check for suspicious patterns
export const detectSuspiciousActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ip = req.ip || req.socket.remoteAddress;
    const timeWindow = 15 * 60 * 1000; // 15 minutes
    
    if (ip) {
      // Check for rapid failed attempts from same IP
      const recentFailures = await storage.getRecentFailedAttempts(ip, timeWindow);
      
      if (recentFailures.length >= 5) {
        // Log suspicious activity
        await createAuditLog(
          req,
          'failed_login',
          false,
          undefined,
          'suspicious_activity_detected',
          { 
            recentFailures: recentFailures.length,
            pattern: 'rapid_failed_attempts'
          }
        );
        
        // Could implement additional measures like CAPTCHA requirement
        res.setHeader('X-Requires-Captcha', 'true');
      }
      
      // Check for unusual user agent patterns
      const userAgent = req.get('User-Agent');
      if (userAgent && (
        userAgent.includes('bot') ||
        userAgent.includes('crawler') ||
        userAgent.includes('spider') ||
        userAgent.length > 500
      )) {
        await createAuditLog(
          req,
          'failed_login',
          false,
          undefined,
          'suspicious_user_agent',
          { userAgent }
        );
      }
    }
    
  } catch (error) {
    console.error('Error in suspicious activity detection:', error);
    // Don't block the request
  }
  
  next();
};

// Audit middleware for sensitive operations
export const auditSensitiveOperation = (operation: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    const userId = user?.claims?.sub;
    
    if (userId) {
      await createAuditLog(
        req,
        operation,
        true, // Assume success unless response indicates otherwise
        userId,
        undefined,
        {
          operation,
          resourcePath: req.path,
          method: req.method,
          body: req.body
        }
      );
    }
    
    next();
  };
};

// Security monitoring dashboard data
export async function getSecurityMetrics(timeRange: number = 24 * 60 * 60 * 1000) {
  try {
    const metrics = await storage.getSecurityMetrics(timeRange);
    
    return {
      totalEvents: metrics.totalEvents,
      failedLogins: metrics.failedLogins,
      successfulLogins: metrics.successfulLogins,
      suspiciousEvents: metrics.suspiciousEvents,
      highRiskEvents: metrics.highRiskEvents,
      topRiskIPs: metrics.topRiskIPs,
      recentAlerts: metrics.recentAlerts
    };
  } catch (error) {
    console.error('Error getting security metrics:', error);
    throw error;
  }
}