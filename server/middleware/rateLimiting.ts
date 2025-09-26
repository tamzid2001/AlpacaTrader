import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { storage } from '../storage';

// Store for progressive back-off tracking
const attemptCounts = new Map<string, { count: number, lastAttempt: number }>();
const lockedAccounts = new Map<string, number>(); // userId -> unlock timestamp

// Get client identifier (IP + User Agent hash for better tracking)
function getClientId(req: Request): string {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  return `${ip}:${Buffer.from(userAgent).toString('base64').slice(0, 16)}`;
}

// Check if account is locked
export function isAccountLocked(userId: string): boolean {
  const unlockTime = lockedAccounts.get(userId);
  if (!unlockTime) return false;
  
  if (Date.now() > unlockTime) {
    lockedAccounts.delete(userId);
    return false;
  }
  return true;
}

// Lock account for progressive duration
export function lockAccount(userId: string, attempts: number): void {
  // Progressive lockout: 5min, 15min, 1hr, 24hr
  const lockDurations = [5 * 60 * 1000, 15 * 60 * 1000, 60 * 60 * 1000, 24 * 60 * 60 * 1000];
  const duration = lockDurations[Math.min(attempts - 5, lockDurations.length - 1)];
  
  lockedAccounts.set(userId, Date.now() + duration);
}

// Progressive delay for repeated attempts from same client
export function getProgressiveDelay(clientId: string): number {
  const attempts = attemptCounts.get(clientId);
  if (!attempts) return 0;
  
  // Progressive delays: 1s, 2s, 4s, 8s, 16s (max)
  const delay = Math.min(Math.pow(2, attempts.count - 1) * 1000, 16000);
  return delay;
}

// Track authentication attempt
export function trackAuthAttempt(clientId: string, success: boolean): void {
  if (success) {
    attemptCounts.delete(clientId);
    return;
  }
  
  const existing = attemptCounts.get(clientId);
  const now = Date.now();
  
  if (existing && (now - existing.lastAttempt) < 15 * 60 * 1000) {
    // Increment count if within 15-minute window
    attemptCounts.set(clientId, { count: existing.count + 1, lastAttempt: now });
  } else {
    // Reset count if outside window
    attemptCounts.set(clientId, { count: 1, lastAttempt: now });
  }
}

// Authentication rate limiter (strict)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again later. If you continue to have issues, contact support.',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => getClientId(req),
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Please try again later. If you continue to have issues, contact support.',
      retryAfter: 15 * 60
    });
  },
});

// API rate limiter (more permissive)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many API requests',
    message: 'Please slow down your requests.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => getClientId(req),
  skip: (req: Request) => {
    // Skip rate limiting for authenticated users with higher limits
    if (req.isAuthenticated?.()) {
      return false; // Still apply limit but with higher threshold
    }
    return false;
  }
});

// Stricter limiter for sensitive operations
export const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 requests per hour for sensitive operations
  message: {
    error: 'Too many sensitive operation attempts',
    message: 'This action is rate limited for security. Please try again later.',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => getClientId(req),
});

// Progressive back-off middleware
export const progressiveBackoff = async (req: Request, res: Response, next: any) => {
  const clientId = getClientId(req);
  const delay = getProgressiveDelay(clientId);
  
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  next();
};

// Account lockout check middleware
export const checkAccountLock = async (req: Request, res: Response, next: any) => {
  const user = req.user as any;
  
  if (user?.claims?.sub && isAccountLocked(user.claims.sub)) {
    // Log the lockout attempt
    await storage.createAuthAuditLog({
      userId: user.claims.sub,
      action: 'failed_login',
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      success: false,
      failureReason: 'account_locked',
      sessionId: req.sessionID,
      riskScore: 8,
      metadata: { reason: 'Account temporarily locked due to suspicious activity' }
    });
    
    return res.status(423).json({
      error: 'Account temporarily locked',
      message: 'Your account has been temporarily locked due to security concerns. Please contact support if this continues.',
      code: 'ACCOUNT_LOCKED'
    });
  }
  
  next();
};

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  const fifteenMinutesAgo = now - 15 * 60 * 1000;
  
  // Clean up old attempt counts
  for (const [clientId, data] of Array.from(attemptCounts.entries())) {
    if (data.lastAttempt < fifteenMinutesAgo) {
      attemptCounts.delete(clientId);
    }
  }
  
  // Clean up expired account locks
  for (const [userId, unlockTime] of Array.from(lockedAccounts.entries())) {
    if (now > unlockTime) {
      lockedAccounts.delete(userId);
    }
  }
}, 5 * 60 * 1000); // Run cleanup every 5 minutes