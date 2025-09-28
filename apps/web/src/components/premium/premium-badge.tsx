import { Badge } from "@/components/ui/badge";
import { EnhancedIcon } from "@/components/icons/enhanced-icon";
import type { PremiumTier } from "@shared/schema";

interface PremiumBadgeProps {
  tier?: string | null;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export function PremiumBadge({ tier, size = "md", showIcon = true }: PremiumBadgeProps) {
  if (!tier) {
    return (
      <Badge variant="secondary" data-testid="badge-standard">
        <EnhancedIcon name="User" size={12} className="mr-1" />
        Standard
      </Badge>
    );
  }

  const getBadgeConfig = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "basic":
        return {
          label: "Premium Basic",
          icon: "Shield",
          className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200",
          testId: "badge-premium-basic"
        };
      case "advanced":
        return {
          label: "Premium Advanced",
          icon: "ShieldCheck",
          className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200",
          testId: "badge-premium-advanced"
        };
      case "professional":
        return {
          label: "Premium Professional",
          icon: "Crown",
          className: "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-300",
          testId: "badge-premium-professional"
        };
      default:
        return {
          label: "Premium",
          icon: "Star",
          className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border-indigo-200",
          testId: "badge-premium"
        };
    }
  };

  const config = getBadgeConfig(tier);
  const iconSize = size === "sm" ? 10 : size === "md" ? 12 : 14;

  return (
    <Badge
      className={config.className}
      data-testid={config.testId}
    >
      {showIcon && (
        <EnhancedIcon 
          name={config.icon as any} 
          size={iconSize} 
          className="mr-1" 
        />
      )}
      {config.label}
    </Badge>
  );
}

interface PremiumStatusIndicatorProps {
  isPremium: boolean;
  tier?: string | null;
  status?: string | null;
  className?: string;
}

export function PremiumStatusIndicator({ 
  isPremium, 
  tier, 
  status, 
  className = "" 
}: PremiumStatusIndicatorProps) {
  if (!isPremium) {
    return (
      <div className={`flex items-center space-x-2 ${className}`} data-testid="status-standard">
        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        <span className="text-sm text-muted-foreground">Standard</span>
      </div>
    );
  }

  const getStatusColor = () => {
    switch (status?.toLowerCase()) {
      case "trial":
        return "bg-yellow-400";
      case "premium":
      case "premium_plus":
        return "bg-green-400";
      case "expired":
        return "bg-red-400";
      default:
        return "bg-blue-400";
    }
  };

  const getStatusText = () => {
    switch (status?.toLowerCase()) {
      case "trial":
        return "Premium Trial";
      case "premium":
        return "Premium Active";
      case "premium_plus":
        return "Premium Plus";
      case "expired":
        return "Premium Expired";
      default:
        return "Premium";
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`} data-testid="status-premium">
      <div className={`w-2 h-2 ${getStatusColor()} rounded-full animate-pulse`}></div>
      <span className="text-sm font-medium">{getStatusText()}</span>
      <PremiumBadge tier={tier} size="sm" showIcon={false} />
    </div>
  );
}