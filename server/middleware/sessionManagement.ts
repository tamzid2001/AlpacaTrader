import session from 'express-session';
import connectPg from 'connect-pg-simple';
import type { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { randomBytes } from 'crypto';

// Make concurrent sessions configurable with a reasonable default
const MAX_CONCURRENT_SESSIONS = parseInt(process.env.MAX_CONCURRENT_SESSIONS || '10', 10); // Increased from 3 to 10 for multi-device support
const SESSION_IDLE_TIMEOUT = parseInt(process.env.SESSION_IDLE_TIMEOUT || String(30 * 60 * 1000), 10); // 30 minutes default
const SESSION_ABSOLUTE_TIMEOUT = parseInt(process.env.SESSION_ABSOLUTE_TIMEOUT || String(24 * 60 * 60 * 1000), 10); // 24 hours default
const ALLOW_IP_CHANGES = process.env.ALLOW_IP_CHANGES === 'true'; // Allow IP changes for mobile users

// Enhanced session store configuration
export function createSessionStore() {
  const pgStore = connectPg(session);
  
  return new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: SESSION_ABSOLUTE_TIMEOUT / 1000, // Convert to seconds
    tableName: 'sessions',
    pruneSessionInterval: 15 * 60, // Prune expired sessions every 15 minutes
    errorLog: (error: Error) => {
      console.error('Session store error:', error);
    }
  });
}

// Enhanced session configuration
export function getEnhancedSessionConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: createSessionStore(),
    resave: false,
    saveUninitialized: false,
    rolling: true, // Sliding session expiration
    name: 'sessionId', // Hide default session name
    cookie: {
      httpOnly: true,
      secure: isProduction, // Only secure in production (HTTPS required)
      maxAge: SESSION_ABSOLUTE_TIMEOUT,
      sameSite: isProduction ? 'strict' : 'lax',
    },
    genid: () => {
      // Generate cryptographically strong session IDs
      return randomBytes(32).toString('hex');
    }
  });
}

// Session security middleware
export const sessionSecurity = async (req: Request, res: Response, next: NextFunction) => {
  // Check for session hijacking indicators
  if (req.session && req.isAuthenticated?.()) {
    const currentIP = req.ip || req.socket.remoteAddress;
    const currentUserAgent = req.get('User-Agent');
    const user = req.user as any;
    
    // Store initial session metadata
    if (!req.session.securityMetadata) {
      req.session.securityMetadata = {
        initialIP: currentIP,
        initialUserAgent: currentUserAgent,
        createdAt: Date.now(),
        lastActivity: Date.now()
      };
    }
    
    const metadata = req.session.securityMetadata;
    
    // Check for suspicious activity
    let suspiciousActivity = false;
    let riskScore = 0;
    let reasons: string[] = [];
    
    // IP address change detection - more lenient for multi-device users
    if (metadata.initialIP !== currentIP && !ALLOW_IP_CHANGES) {
      // Only flag as suspicious if IP changes are not allowed
      suspiciousActivity = true;
      riskScore += 2; // Reduced from 5 to 2 for less aggressive detection
      reasons.push('IP address changed');
    }
    
    // User agent change detection - more lenient for multi-device users
    if (metadata.initialUserAgent !== currentUserAgent) {
      // Only flag minor risk for user agent changes (different devices have different agents)
      suspiciousActivity = true;
      riskScore += 1; // Reduced from 3 to 1 for multi-device support
      reasons.push('User agent changed');
    }
    
    // Session age check
    const sessionAge = Date.now() - metadata.createdAt;
    if (sessionAge > SESSION_ABSOLUTE_TIMEOUT) {
      suspiciousActivity = true;
      riskScore += 8;
      reasons.push('Session exceeded maximum age');
    }
    
    // Idle timeout check
    const idleTime = Date.now() - metadata.lastActivity;
    if (idleTime > SESSION_IDLE_TIMEOUT) {
      suspiciousActivity = true;
      riskScore += 6;
      reasons.push('Session idle timeout exceeded');
    }
    
    // Log suspicious activity
    if (suspiciousActivity) {
      await storage.createAuthAuditLog({
        userId: user.claims?.sub,
        action: 'session_hijack_attempt',
        ipAddress: currentIP || 'unknown',
        userAgent: currentUserAgent,
        success: false,
        failureReason: reasons.join(', '),
        sessionId: req.sessionID,
        riskScore,
        metadata: { reasons, sessionAge, idleTime }
      });
      
      // Terminate session only if risk is very high (raised threshold for multi-device support)
      if (riskScore >= 10) { // Increased from 8 to 10
        req.logout(() => {
          req.session?.destroy(() => {
            res.status(401).json({
              error: 'Session terminated',
              message: 'Your session has been terminated for security reasons. Please log in again.',
              code: 'SESSION_HIJACK_DETECTED'
            });
          });
        });
        return;
      }
    }
    
    // Update last activity
    metadata.lastActivity = Date.now();
    
    // Add session remaining time to response headers
    const remainingTime = Math.max(0, SESSION_ABSOLUTE_TIMEOUT - sessionAge);
    res.setHeader('X-Session-Remaining', Math.floor(remainingTime / 1000));
  }
  
  next();
};

// Concurrent session management
export const manageConcurrentSessions = async (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated?.()) {
    const user = req.user as any;
    const userId = user.claims?.sub;
    
    if (userId) {
      try {
        // Get user's active sessions
        const activeSessions = await storage.getUserActiveSessions(userId);
        
        // Only revoke sessions if significantly over the limit (grace period for multi-device)
        if (activeSessions.length >= MAX_CONCURRENT_SESSIONS) {
          // Filter out the current session to avoid self-revocation
          const otherSessions = activeSessions.filter(s => s.sid !== req.sessionID);
          
          if (otherSessions.length >= MAX_CONCURRENT_SESSIONS) {
            // Only revoke if we still have too many after excluding current session
            const sessionsToRevoke = otherSessions
              .sort((a, b) => new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime())
              .slice(0, otherSessions.length - MAX_CONCURRENT_SESSIONS + 1); // Revoke just enough to stay under limit
            
            // Revoke only the necessary sessions
            for (const session of sessionsToRevoke) {
              try {
                await storage.revokeUserSession(session.sid, 'concurrent_limit_exceeded');
                
                // Log session revocation with more context
                await storage.createAuthAuditLog({
                  userId,
                  action: 'session_expired',
                  ipAddress: req.ip || 'unknown',
                  userAgent: req.get('User-Agent'),
                  success: true,
                  failureReason: `Concurrent session limit (${MAX_CONCURRENT_SESSIONS}) exceeded`,
                  sessionId: session.sid,
                  riskScore: 1, // Reduced from 2 to 1 as this is normal behavior
                  metadata: { 
                    reason: 'concurrent_limit',
                    totalSessions: activeSessions.length,
                    maxAllowed: MAX_CONCURRENT_SESSIONS,
                    revokedSessionId: session.sid
                  }
                });
              } catch (revokeError) {
                console.error(`Failed to revoke session ${session.sid}:`, revokeError);
                // Continue with other revocations even if one fails
              }
            }
          }
        }
        
        // Update current session activity
        await storage.updateSessionActivity(req.sessionID, {
          userId,
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('User-Agent')
        });
        
      } catch (error) {
        console.error('Error managing concurrent sessions:', error);
        // Log the error but don't block the request
        try {
          await storage.createAuthAuditLog({
            userId,
            action: 'session_management_error',
            ipAddress: req.ip || 'unknown',
            userAgent: req.get('User-Agent'),
            success: false,
            failureReason: 'Session management error',
            sessionId: req.sessionID,
            riskScore: 0,
            metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
          });
        } catch (logError) {
          console.error('Failed to log session management error:', logError);
        }
        // Don't block the request for session management errors
      }
    }
  }
  
  next();
};

// Session cleanup worker
export function startSessionCleanup() {
  const cleanup = async () => {
    try {
      // Clean up expired sessions
      await storage.cleanupExpiredSessions();
      
      // Clean up revoked sessions older than 24 hours
      await storage.cleanupOldRevokedSessions();
      
      console.log('Session cleanup completed');
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  };
  
  // Run cleanup every hour
  setInterval(cleanup, 60 * 60 * 1000);
  
  // Run initial cleanup after 5 minutes
  setTimeout(cleanup, 5 * 60 * 1000);
}

// Session info middleware for debugging (development only)
export const sessionInfo = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development' && req.session) {
    console.log('Session info:', {
      id: req.sessionID,
      authenticated: req.isAuthenticated?.(),
      userId: (req.user as any)?.claims?.sub,
      metadata: req.session.securityMetadata
    });
  }
  next();
};