import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { authorize, requireAdmin, requireSuperadmin, getUserPermissions } from "../middleware/authorization";
import { sensitiveLimiter } from "../middleware/rateLimiting";
import { getSecurityMetrics } from "../middleware/authAudit";

export function registerSecurityRoutes(app: Express) {
  // Session Management Endpoints
  
  // Get user's active sessions
  app.get("/api/security/sessions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getUserActiveSessions(userId);
      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Revoke a specific session
  app.delete("/api/security/sessions/:sessionId", 
    isAuthenticated, 
    sensitiveLimiter,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { sessionId } = req.params;
        
        // Verify session belongs to user
        const sessions = await storage.getUserActiveSessions(userId);
        const sessionExists = sessions.some(s => s.sid === sessionId);
        
        if (!sessionExists) {
          return res.status(404).json({ error: "Session not found" });
        }
        
        await storage.revokeUserSession(sessionId, 'user_requested');
        
        // Log the session revocation
        await storage.createAuthAuditLog({
          userId,
          action: 'logout',
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('User-Agent'),
          success: true,
          sessionId: req.sessionID,
          riskScore: 1,
          metadata: JSON.stringify({ revokedSessionId: sessionId, reason: 'user_requested' })
        });
        
        res.json({ message: "Session revoked successfully" });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

  // Revoke all sessions (except current)
  app.delete("/api/security/sessions", 
    isAuthenticated, 
    sensitiveLimiter,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const currentSessionId = req.sessionID;
        
        // Get all active sessions
        const sessions = await storage.getUserActiveSessions(userId);
        const otherSessions = sessions.filter(s => s.sid !== currentSessionId);
        
        // Revoke all other sessions
        for (const session of otherSessions) {
          await storage.revokeUserSession(session.sid, 'user_revoked_all');
        }
        
        // Log the bulk session revocation
        await storage.createAuthAuditLog({
          userId,
          action: 'logout',
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('User-Agent'),
          success: true,
          sessionId: req.sessionID,
          riskScore: 2,
          metadata: JSON.stringify({ 
            reason: 'user_revoked_all_sessions', 
            sessionsRevoked: otherSessions.length 
          })
        });
        
        res.json({ 
          message: `${otherSessions.length} sessions revoked successfully`,
          revokedCount: otherSessions.length
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

  // Get user's permissions
  app.get("/api/security/permissions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const permissions = await getUserPermissions(userId);
      res.json({ permissions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin/Security Endpoints

  // Get authentication audit logs (admin only)
  app.get("/api/security/audit-logs", 
    isAuthenticated,
    authorize('audit', 'read'),
    async (req, res) => {
      try {
        const { userId, limit = 100 } = req.query;
        const logs = await storage.getAuthAuditLogs(
          userId as string, 
          parseInt(limit as string)
        );
        res.json(logs);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

  // Get security metrics dashboard (admin only)
  app.get("/api/security/metrics", 
    isAuthenticated,
    authorize('security', 'read'),
    async (req, res) => {
      try {
        const { timeRange = 24 * 60 * 60 * 1000 } = req.query; // Default 24 hours
        const metrics = await getSecurityMetrics(parseInt(timeRange as string));
        res.json(metrics);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

  // Force revoke user sessions (admin only)
  app.delete("/api/security/admin/users/:userId/sessions", 
    isAuthenticated,
    requireAdmin,
    sensitiveLimiter,
    async (req: any, res) => {
      try {
        const { userId } = req.params;
        const adminUserId = req.user.claims.sub;
        
        const revokedCount = await storage.revokeAllUserSessions(userId, 'admin_action');
        
        // Log the admin action
        await storage.createAuthAuditLog({
          userId: adminUserId,
          action: 'logout',
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('User-Agent'),
          success: true,
          sessionId: req.sessionID,
          riskScore: 3,
          metadata: JSON.stringify({ 
            targetUserId: userId,
            reason: 'admin_forced_session_revocation',
            sessionsRevoked: revokedCount
          })
        });
        
        res.json({ 
          message: `Revoked ${revokedCount} sessions for user ${userId}`,
          revokedCount
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

  // System security status (superadmin only)
  app.get("/api/security/system-status", 
    isAuthenticated,
    requireSuperadmin,
    async (req, res) => {
      try {
        const metrics = await getSecurityMetrics(7 * 24 * 60 * 60 * 1000); // 7 days
        
        const systemStatus = {
          securityLevel: metrics.highRiskEvents > 10 ? 'HIGH_RISK' : 
                        metrics.suspiciousEvents > 5 ? 'ELEVATED' : 'NORMAL',
          metrics,
          recommendations: [],
          timestamp: new Date().toISOString()
        };
        
        // Add security recommendations
        if (metrics.failedLogins > 50) {
          systemStatus.recommendations.push('Consider implementing CAPTCHA for repeated failed logins');
        }
        if (metrics.topRiskIPs.length > 5) {
          systemStatus.recommendations.push('Review and potentially block high-risk IP addresses');
        }
        if (metrics.highRiskEvents > 5) {
          systemStatus.recommendations.push('Investigate recent high-risk security events');
        }
        
        res.json(systemStatus);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });
}