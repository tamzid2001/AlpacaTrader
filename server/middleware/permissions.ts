import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { ResourceType, Permission } from '@shared/schema';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        claims: {
          sub: string;
          email: string;
          first_name?: string;
          last_name?: string;
        };
      };
    }
  }
}

/**
 * Permission checking middleware
 * Checks if user has specific permission on a resource
 */
export const requirePermission = (resourceType: ResourceType, permission: Permission) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const resourceId = req.params.id || req.params.resourceId || req.params.fileId || req.params.courseId;
      
      if (!userId || !resourceId) {
        return res.status(401).json({ error: 'Unauthorized - missing user or resource ID' });
      }
      
      // Check user permission
      const hasPermission = await storage.checkPermission(userId, resourceType, resourceId, permission);
      
      if (hasPermission) {
        return next();
      }
      
      // Check if user is owner
      const isOwner = await checkResourceOwnership(userId, resourceType, resourceId);
      if (isOwner) {
        return next(); // Owner has all permissions
      }
      
      // Check for valid share link
      const shareToken = req.query.shareToken || req.headers['x-share-token'];
      if (shareToken && typeof shareToken === 'string') {
        const shareLink = await storage.getShareLink(shareToken);
        if (shareLink && shareLink.permissions.includes(permission)) {
          await storage.incrementShareLinkAccess(shareLink.id);
          return next();
        }
      }
      
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission,
        resourceType,
        resourceId 
      });
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Internal server error during permission check' });
    }
  };
};

/**
 * Resource ownership middleware
 * Checks if user owns the resource
 */
export const requireOwnership = (resourceType: ResourceType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const resourceId = req.params.id || req.params.resourceId || req.params.fileId || req.params.courseId;
      
      if (!userId || !resourceId) {
        return res.status(401).json({ error: 'Unauthorized - missing user or resource ID' });
      }
      
      const isOwner = await checkResourceOwnership(userId, resourceType, resourceId);
      if (!isOwner) {
        return res.status(403).json({ error: 'Resource access denied - ownership required' });
      }
      
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({ error: 'Internal server error during ownership check' });
    }
  };
};

/**
 * Multiple permissions middleware
 * Checks if user has any of the specified permissions
 */
export const requireAnyPermission = (resourceType: ResourceType, permissions: Permission[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const resourceId = req.params.id || req.params.resourceId || req.params.fileId || req.params.courseId;
      
      if (!userId || !resourceId) {
        return res.status(401).json({ error: 'Unauthorized - missing user or resource ID' });
      }
      
      // Check if user has any of the required permissions
      for (const permission of permissions) {
        const hasPermission = await storage.checkPermission(userId, resourceType, resourceId, permission);
        if (hasPermission) {
          return next();
        }
      }
      
      // Check if user is owner
      const isOwner = await checkResourceOwnership(userId, resourceType, resourceId);
      if (isOwner) {
        return next(); // Owner has all permissions
      }
      
      // Check for valid share link
      const shareToken = req.query.shareToken || req.headers['x-share-token'];
      if (shareToken && typeof shareToken === 'string') {
        const shareLink = await storage.getShareLink(shareToken);
        if (shareLink && shareLink.permissions.some(p => permissions.includes(p))) {
          await storage.incrementShareLinkAccess(shareLink.id);
          return next();
        }
      }
      
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permissions,
        resourceType,
        resourceId 
      });
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Internal server error during permission check' });
    }
  };
};

/**
 * Share link access middleware
 * Allows access via valid share links
 */
export const allowShareLinkAccess = (resourceType: ResourceType, permission: Permission) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const shareToken = req.query.shareToken || req.headers['x-share-token'];
      
      if (!shareToken || typeof shareToken !== 'string') {
        return res.status(401).json({ error: 'Share token required' });
      }
      
      const shareLink = await storage.getShareLink(shareToken);
      if (!shareLink) {
        return res.status(404).json({ error: 'Invalid or expired share link' });
      }
      
      if (!shareLink.permissions.includes(permission)) {
        return res.status(403).json({ 
          error: 'Share link does not grant required permission',
          required: permission,
          available: shareLink.permissions 
        });
      }
      
      // Verify resource type matches
      const resourceId = req.params.id || req.params.resourceId || req.params.fileId || req.params.courseId;
      if (shareLink.resourceType !== resourceType || shareLink.resourceId !== resourceId) {
        return res.status(403).json({ error: 'Share link not valid for this resource' });
      }
      
      // Increment access count
      await storage.incrementShareLinkAccess(shareLink.id);
      
      // Add share link info to request
      req.shareLink = shareLink;
      
      next();
    } catch (error) {
      console.error('Share link access error:', error);
      res.status(500).json({ error: 'Internal server error during share link validation' });
    }
  };
};

/**
 * Team permission middleware
 * Checks if user has permission through team membership
 */
export const requireTeamPermission = (resourceType: ResourceType, permission: Permission) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const resourceId = req.params.id || req.params.resourceId || req.params.fileId || req.params.courseId;
      
      if (!userId || !resourceId) {
        return res.status(401).json({ error: 'Unauthorized - missing user or resource ID' });
      }
      
      // Check direct permission first
      const hasDirectPermission = await storage.checkPermission(userId, resourceType, resourceId, permission);
      if (hasDirectPermission) {
        return next();
      }
      
      // Check team permissions
      const userTeams = await storage.getUserTeams(userId);
      for (const team of userTeams) {
        const hasTeamPermission = await storage.checkPermission(team.id, resourceType, resourceId, permission);
        if (hasTeamPermission) {
          return next();
        }
      }
      
      return res.status(403).json({ 
        error: 'Insufficient permissions - no team access',
        required: permission,
        resourceType,
        resourceId 
      });
    } catch (error) {
      console.error('Team permission check error:', error);
      res.status(500).json({ error: 'Internal server error during team permission check' });
    }
  };
};

/**
 * Helper function to check resource ownership
 */
async function checkResourceOwnership(userId: string, resourceType: ResourceType, resourceId: string): Promise<boolean> {
  try {
    let resource;
    
    switch (resourceType) {
      case 'csv':
        resource = await storage.getCsvUpload(resourceId);
        return resource?.userId === userId;
      case 'course':
        resource = await storage.getCourse(resourceId);
        return resource?.ownerId === userId;
      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking resource ownership:', error);
    return false;
  }
}

/**
 * Middleware to ensure user can access their own resources
 */
export const requireSelfAccess = (userIdParam: string = 'userId') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUserId = req.user?.id || req.user?.claims?.sub;
      const targetUserId = req.params[userIdParam];
      
      if (!currentUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      if (currentUserId !== targetUserId) {
        return res.status(403).json({ error: 'Access denied - can only access own resources' });
      }
      
      next();
    } catch (error) {
      console.error('Self access check error:', error);
      res.status(500).json({ error: 'Internal server error during self access check' });
    }
  };
};

/**
 * Admin-only middleware
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id || req.user?.claims?.sub;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Internal server error during admin check' });
  }
};

// Type augmentation for share link info
declare global {
  namespace Express {
    interface Request {
      shareLink?: {
        id: string;
        resourceType: ResourceType;
        resourceId: string;
        permissions: Permission[];
        accessCount: number;
      };
    }
  }
}