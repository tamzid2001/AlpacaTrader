import type { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import type { User } from '@shared/schema';

// Enhanced role hierarchy
const ROLE_HIERARCHY = {
  'user': 0,
  'moderator': 1,
  'admin': 2,
  'superadmin': 3
};

// Resource permissions matrix
const PERMISSIONS = {
  // User permissions
  'user': {
    'profile': ['read', 'update'],
    'csv': ['create', 'read', 'update', 'delete'],
    'courses': ['read', 'enroll'],
    'quiz': ['take', 'view_results'],
    'support': ['create', 'read_own'],
    'sharing': ['create', 'read_own', 'update_own', 'delete_own']
  },
  
  // Moderator permissions (inherits user + adds)
  'moderator': {
    'content': ['create', 'read', 'update', 'delete'],
    'support': ['read_all', 'update', 'resolve'],
    'courses': ['create', 'update'],
    'users': ['read', 'moderate']
  },
  
  // Admin permissions (inherits moderator + adds)
  'admin': {
    'users': ['create', 'read', 'update', 'approve', 'suspend'],
    'system': ['read', 'configure'],
    'audit': ['read'],
    'analytics': ['read'],
    'security': ['read', 'configure']
  },
  
  // Superadmin permissions (inherits admin + adds)
  'superadmin': {
    'system': ['read', 'configure', 'delete', 'backup', 'restore'],
    'users': ['create', 'read', 'update', 'delete', 'impersonate'],
    'audit': ['read', 'export', 'delete'],
    'security': ['read', 'configure', 'override'],
    'database': ['read', 'update', 'delete', 'migrate']
  }
};

// Check if user has specific permission
export function hasPermission(
  userRole: string, 
  resource: string, 
  action: string
): boolean {
  // Get user's role level
  const userLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY];
  if (userLevel === undefined) return false;
  
  // Check permissions at user's level and all higher levels
  for (const [role, level] of Object.entries(ROLE_HIERARCHY)) {
    if (level >= userLevel) {
      const rolePermissions = PERMISSIONS[role as keyof typeof PERMISSIONS] as any;
      if (rolePermissions && rolePermissions[resource]?.includes(action)) {
        return true;
      }
    }
  }
  
  return false;
}

// Middleware factory for resource-level authorization
export const authorize = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as any;
      
      if (!user?.claims?.sub) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'You must be logged in to access this resource.'
        });
      }
      
      // Get user's current role from database
      const userData = await storage.getUser(user.claims.sub);
      if (!userData) {
        return res.status(401).json({ 
          error: 'User not found',
          message: 'Your user account could not be found.'
        });
      }
      
      // Check if user is approved
      if (!userData.isApproved && userData.role !== 'superadmin') {
        return res.status(403).json({
          error: 'Account pending approval',
          message: 'Your account is pending approval. Please contact an administrator.'
        });
      }
      
      // Check permissions
      if (!hasPermission(userData.role, resource, action)) {
        // Log unauthorized access attempt
        await storage.createAuthAuditLog({
          userId: user.claims.sub,
          action: 'failed_login',
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('User-Agent'),
          success: false,
          failureReason: `Insufficient permissions for ${resource}:${action}`,
          sessionId: req.sessionID,
          riskScore: 4,
          metadata: JSON.stringify({ resource, action, userRole: userData.role })
        });
        
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `You don't have permission to ${action} ${resource}.`,
          required: `${resource}:${action}`,
          userRole: userData.role
        });
      }
      
      // Attach user data to request for use in handlers
      req.userData = userData;
      
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({
        error: 'Authorization check failed',
        message: 'An error occurred while checking permissions.'
      });
    }
  };
};

// Resource ownership check (for "own" resources)
export const checkOwnership = (resourceIdParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as any;
      const userData = req.userData;
      const resourceId = req.params[resourceIdParam];
      
      if (!user?.claims?.sub || !userData) {
        return res.status(401).json({ 
          error: 'Authentication required' 
        });
      }
      
      // Admins and superadmins can access any resource
      if (['admin', 'superadmin'].includes((userData as User).role)) {
        return next();
      }
      
      // Check ownership based on resource type
      let isOwner = false;
      
      // You can expand this based on your resource types
      if (req.path.includes('/csv/')) {
        const csvUpload = await storage.getCsvUpload(resourceId);
        isOwner = csvUpload?.userId === user.claims.sub;
      } else if (req.path.includes('/shared-results/')) {
        const sharedResult = await storage.getSharedResult(resourceId);
        isOwner = sharedResult?.userId === user.claims.sub;
      } else if (req.path.includes('/users/')) {
        isOwner = resourceId === user.claims.sub;
      }
      
      if (!isOwner) {
        await storage.createAuthAuditLog({
          userId: user.claims.sub,
          action: 'failed_login',
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('User-Agent'),
          success: false,
          failureReason: 'Attempted to access resource not owned',
          sessionId: req.sessionID,
          riskScore: 6,
          metadata: JSON.stringify({ resourceId, resourceType: req.path })
        });
        
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only access your own resources.'
        });
      }
      
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        error: 'Ownership check failed'
      });
    }
  };
};

// Admin-only middleware (simplified)
export const requireAdmin = authorize('users', 'read');

// Moderator or higher middleware
export const requireModerator = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as any;
  
  if (!user?.claims?.sub) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const userData = await storage.getUser(user.claims.sub);
  if (!userData) {
    return res.status(401).json({ error: 'User not found' });
  }
  
  const userLevel = ROLE_HIERARCHY[userData.role as keyof typeof ROLE_HIERARCHY];
  if (userLevel < ROLE_HIERARCHY.moderator) {
    return res.status(403).json({
      error: 'Insufficient permissions',
      message: 'Moderator access required.'
    });
  }
  
  req.userData = userData;
  next();
};

// Superadmin-only middleware
export const requireSuperadmin = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as any;
  
  if (!user?.claims?.sub) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const userData = await storage.getUser(user.claims.sub);
  if (!userData || userData.role !== 'superadmin') {
    return res.status(403).json({
      error: 'Insufficient permissions',
      message: 'Superadmin access required.'
    });
  }
  
  req.userData = userData;
  next();
};

// Get user's effective permissions
export async function getUserPermissions(userId: string) {
  const userData = await storage.getUser(userId);
  if (!userData) return [];
  
  const userLevel = ROLE_HIERARCHY[userData.role as keyof typeof ROLE_HIERARCHY];
  const effectivePermissions: string[] = [];
  
  // Collect all permissions from user's level and below
  for (const [role, level] of Object.entries(ROLE_HIERARCHY)) {
    if (level >= userLevel) {
      const rolePermissions = PERMISSIONS[role as keyof typeof PERMISSIONS];
      for (const [resource, actions] of Object.entries(rolePermissions)) {
        actions.forEach(action => {
          const permission = `${resource}:${action}`;
          if (!effectivePermissions.includes(permission)) {
            effectivePermissions.push(permission);
          }
        });
      }
    }
  }
  
  return effectivePermissions;
}