import session from 'express-session';
import connectPg from 'connect-pg-simple';
import type { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { randomBytes } from 'crypto';

const MAX_CONCURRENT_SESSIONS = 3;
const SESSION_IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const SESSION_ABSOLUTE_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

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
    
    // IP address change detection
    if (metadata.initialIP !== currentIP) {
      suspiciousActivity = true;
      riskScore += 5;
      reasons.push('IP address changed');
    }
    
    // User agent change detection
    if (metadata.initialUserAgent !== currentUserAgent) {
      suspiciousActivity = true;
      riskScore += 3;
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
      
      // Terminate session if risk is too high
      if (riskScore >= 8) {
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
        
        // If at session limit, revoke oldest session
        if (activeSessions.length >= MAX_CONCURRENT_SESSIONS) {
          const oldestSession = activeSessions
            .sort((a, b) => new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime())[0];
          
          await storage.revokeUserSession(oldestSession.sid, 'concurrent_limit_exceeded');
          
          // Log session revocation
          await storage.createAuthAuditLog({
            userId,
            action: 'session_expired',
            ipAddress: req.ip || 'unknown',
            userAgent: req.get('User-Agent'),
            success: true,
            failureReason: 'Concurrent session limit exceeded',
            sessionId: oldestSession.sid,
            riskScore: 2,
            metadata: { reason: 'concurrent_limit' }
          });
        }
        
        // Update current session activity
        await storage.updateSessionActivity(req.sessionID, {
          userId,
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('User-Agent')
        });
        
      } catch (error) {
        console.error('Error managing concurrent sessions:', error);
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