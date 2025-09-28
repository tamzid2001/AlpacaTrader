import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnhancedIcon } from "@/components/icons/enhanced-icon";
import { PremiumBadge } from "./premium-badge";
import type { PremiumTier } from "@shared/schema";

interface PremiumFeatureProps {
  children: React.ReactNode;
  requiredTier?: PremiumTier;
  userTier?: string | null;
  isPremium?: boolean;
  fallback?: React.ReactNode;
  featureName?: string;
  description?: string;
}

export function PremiumFeature({
  children,
  requiredTier = "basic",
  userTier,
  isPremium = false,
  fallback,
  featureName = "Premium Feature",
  description = "This feature is available to premium members only."
}: PremiumFeatureProps) {
  const tierHierarchy = { basic: 1, advanced: 2, professional: 3 };
  const requiredLevel = tierHierarchy[requiredTier] || 1;
  const userLevel = tierHierarchy[userTier as PremiumTier] || 0;
  
  const hasAccess = isPremium && userLevel >= requiredLevel;

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Card className="relative overflow-hidden" data-testid="premium-feature-gate">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-50"></div>
      <CardContent className="p-6 text-center relative">
        <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <EnhancedIcon name="Lock" size={32} className="text-white" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2" data-testid="text-feature-title">
          {featureName}
        </h3>
        
        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
          {description}
        </p>

        <div className="flex items-center justify-center space-x-2 mb-4">
          <span className="text-sm text-muted-foreground">Requires:</span>
          <PremiumBadge tier={requiredTier} size="sm" />
        </div>

        {!isPremium ? (
          <div className="space-y-3">
            <Button className="w-full" data-testid="button-request-premium">
              <EnhancedIcon name="Crown" size={16} className="mr-2" />
              Request Premium Access
            </Button>
            <p className="text-xs text-muted-foreground">
              Premium access requires admin approval
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <Button variant="outline" className="w-full" data-testid="button-upgrade-tier">
              <EnhancedIcon name="ArrowUp" size={16} className="mr-2" />
              Upgrade to {requiredTier} Tier
            </Button>
            <p className="text-xs text-muted-foreground">
              Contact admin to upgrade your premium tier
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PremiumUpgradePromptProps {
  featureName?: string;
  requiredTier?: PremiumTier;
  compact?: boolean;
}

export function PremiumUpgradePrompt({
  featureName = "This feature",
  requiredTier = "basic",
  compact = false
}: PremiumUpgradePromptProps) {
  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800" data-testid="premium-upgrade-compact">
        <div className="flex items-center space-x-2">
          <EnhancedIcon name="Crown" size={16} className="text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-medium">Premium Feature</span>
        </div>
        <Button size="sm" data-testid="button-upgrade-compact">
          Upgrade
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-amber-200 dark:border-amber-800" data-testid="premium-upgrade-full">
      <CardContent className="p-6 text-center">
        <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
          <EnhancedIcon name="Crown" size={24} className="text-white" />
        </div>
        
        <h3 className="font-semibold mb-2">
          {featureName} requires Premium
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4">
          Unlock advanced features and enhanced learning experience with Premium access.
        </p>

        <div className="flex items-center justify-center space-x-2 mb-4">
          <span className="text-xs text-muted-foreground">Required tier:</span>
          <PremiumBadge tier={requiredTier} size="sm" />
        </div>

        <Button className="w-full" data-testid="button-request-premium-full">
          <EnhancedIcon name="Crown" size={16} className="mr-2" />
          Request Premium Access
        </Button>
      </CardContent>
    </Card>
  );
}

interface PremiumCourseCardOverlayProps {
  isPremiumCourse: boolean;
  userHasAccess: boolean;
}

export function PremiumCourseCardOverlay({
  isPremiumCourse,
  userHasAccess
}: PremiumCourseCardOverlayProps) {
  if (!isPremiumCourse || userHasAccess) {
    return null;
  }

  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg" data-testid="premium-course-overlay">
      <div className="text-center text-white">
        <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
          <EnhancedIcon name="Lock" size={20} className="text-white" />
        </div>
        <p className="text-sm font-medium">Premium Course</p>
        <p className="text-xs opacity-90">Premium access required</p>
      </div>
    </div>
  );
}