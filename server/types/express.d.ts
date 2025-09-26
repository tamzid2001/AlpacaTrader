import type { User } from '@shared/schema';

// Extend express-session module
declare module 'express-session' {
  interface SessionData {
    securityMetadata?: {
      initialIP?: string;
      initialUserAgent?: string;
      createdAt: number;
      lastActivity: number;
    };
  }
}

declare global {
  namespace Express {
    interface Request {
      userData?: User;
    }
  }
}

export {};