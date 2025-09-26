import type { User } from '@shared/schema';

declare global {
  namespace Express {
    interface Request {
      userData?: User;
    }
    
    interface SessionData {
      securityMetadata?: {
        initialIP?: string;
        initialUserAgent?: string;
        createdAt: number;
        lastActivity: number;
      };
    }
  }
}

export {};