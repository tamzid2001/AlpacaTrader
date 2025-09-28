import { forwardRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

// Enhanced Icon Props
export interface EnhancedIconProps {
  // Icon identification
  name: string;
  
  // Styling
  size?: number | string;
  color?: string;
  className?: string;
  
  // Advanced styling
  strokeWidth?: number;
  fill?: string;
  opacity?: number;
  
  // Accessibility
  'aria-label'?: string;
  'aria-hidden'?: boolean;
  role?: string;
  
  // Behavior
  loading?: boolean;
  fallback?: React.ReactNode;
  onClick?: () => void;
  onKeyDown?: (e: any) => void;
  
  // Animation
  animate?: 'none' | 'spin' | 'pulse' | 'bounce';
  
  // Data attributes
  'data-testid'?: string;
}

// Enhanced Icon Component with simplified icon loading
export const EnhancedIcon = forwardRef<HTMLElement, EnhancedIconProps>(
  ({
    name,
    size = 24,
    color,
    className,
    strokeWidth,
    fill,
    opacity,
    'aria-label': ariaLabel,
    'aria-hidden': ariaHidden,
    role,
    loading: externalLoading,
    fallback,
    onClick,
    onKeyDown,
    animate = 'none',
    'data-testid': testId,
    ...props
  }, ref) => {
    
    // Animation classes
    const animationClasses = useMemo(() => {
      switch (animate) {
        case 'spin':
          return 'animate-spin';
        case 'pulse':
          return 'animate-pulse';
        case 'bounce':
          return 'animate-bounce';
        default:
          return '';
      }
    }, [animate]);

    // Icon props
    const iconProps = useMemo(() => {
      const props: Record<string, any> = {
        size,
        className: cn(animationClasses, className),
      };
      
      if (color) props.color = color;
      if (strokeWidth) props.strokeWidth = strokeWidth;
      if (fill) props.fill = fill;
      if (opacity) props.opacity = opacity;
      if (onClick) props.onClick = onClick;
      if (onKeyDown) props.onKeyDown = onKeyDown;
      if (testId) props['data-testid'] = testId;
      if (ariaLabel) props['aria-label'] = ariaLabel;
      if (ariaHidden) props['aria-hidden'] = ariaHidden;
      if (role) props.role = role;
      
      return props;
    }, [
      size, 
      color, 
      strokeWidth, 
      fill, 
      opacity, 
      onClick, 
      onKeyDown,
      testId,
      animationClasses,
      className,
      ariaLabel,
      ariaHidden,
      role
    ]);

    // Loading state
    if (externalLoading) {
      return (
        <Skeleton
          className={cn("inline-block", animationClasses, className)}
          style={{ width: size, height: size }}
          data-testid={testId ? `${testId}-loading` : undefined}
        />
      );
    }

    // Get icon from lucide-react
    const IconComponent = (LucideIcons as any)[name];
    
    // Error state
    if (!IconComponent) {
      if (fallback) {
        return <>{fallback}</>;
      }
      
      return (
        <AlertTriangle
          {...iconProps}
          className={cn("text-destructive", iconProps.className)}
          data-testid={testId ? `${testId}-error` : undefined}
          aria-label={`Icon not found: ${name}`}
        />
      );
    }

    // Render the icon
    return <IconComponent {...iconProps} {...props} />;
  }
);

EnhancedIcon.displayName = 'EnhancedIcon';

// Utility component for common icon sizes
export function SmallIcon(props: Omit<EnhancedIconProps, 'size'>) {
  return <EnhancedIcon size={16} {...props} />;
}

export function MediumIcon(props: Omit<EnhancedIconProps, 'size'>) {
  return <EnhancedIcon size={24} {...props} />;
}

export function LargeIcon(props: Omit<EnhancedIconProps, 'size'>) {
  return <EnhancedIcon size={32} {...props} />;
}

// Utility component for animated icons
export function SpinningIcon(props: Omit<EnhancedIconProps, 'animate'>) {
  return <EnhancedIcon animate="spin" {...props} />;
}

export function PulsingIcon(props: Omit<EnhancedIconProps, 'animate'>) {
  return <EnhancedIcon animate="pulse" {...props} />;
}

// Icon with click handler
export function ClickableIcon({ onClick, ...props }: EnhancedIconProps & { onClick: () => void }) {
  return (
    <EnhancedIcon
      {...props}
      onClick={onClick}
      className={cn("cursor-pointer hover:opacity-75 transition-opacity", props.className)}
      role="button"
      onKeyDown={(e: any) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    />
  );
}

// Status icons with semantic colors
export function SuccessIcon(props: Omit<EnhancedIconProps, 'color' | 'name'>) {
  return <EnhancedIcon name="Check" color="rgb(34 197 94)" {...props} />;
}

export function ErrorIcon(props: Omit<EnhancedIconProps, 'color' | 'name'>) {
  return <EnhancedIcon name="X" color="rgb(239 68 68)" {...props} />;
}

export function WarningIcon(props: Omit<EnhancedIconProps, 'color' | 'name'>) {
  return <EnhancedIcon name="AlertTriangle" color="rgb(251 191 36)" {...props} />;
}

export function InfoIcon(props: Omit<EnhancedIconProps, 'color' | 'name'>) {
  return <EnhancedIcon name="Info" color="rgb(59 130 246)" {...props} />;
}

// Navigation icons
export function HomeIcon(props: Omit<EnhancedIconProps, 'name'>) {
  return <EnhancedIcon name="Home" {...props} />;
}

export function DashboardIcon(props: Omit<EnhancedIconProps, 'name'>) {
  return <EnhancedIcon name="LayoutDashboard" {...props} />;
}

export function SettingsIcon(props: Omit<EnhancedIconProps, 'name'>) {
  return <EnhancedIcon name="Settings" {...props} />;
}

export function UserIcon(props: Omit<EnhancedIconProps, 'name'>) {
  return <EnhancedIcon name="User" {...props} />;
}

export function SearchIcon(props: Omit<EnhancedIconProps, 'name'>) {
  return <EnhancedIcon name="Search" {...props} />;
}

// Action icons
export function EditIcon(props: Omit<EnhancedIconProps, 'name'>) {
  return <EnhancedIcon name="Edit" {...props} />;
}

export function DeleteIcon(props: Omit<EnhancedIconProps, 'name'>) {
  return <EnhancedIcon name="Trash2" {...props} />;
}

export function SaveIcon(props: Omit<EnhancedIconProps, 'name'>) {
  return <EnhancedIcon name="Save" {...props} />;
}

export function DownloadIcon(props: Omit<EnhancedIconProps, 'name'>) {
  return <EnhancedIcon name="Download" {...props} />;
}

export function UploadIcon(props: Omit<EnhancedIconProps, 'name'>) {
  return <EnhancedIcon name="Upload" {...props} />;
}

export function ShareIcon(props: Omit<EnhancedIconProps, 'name'>) {
  return <EnhancedIcon name="Share2" {...props} />;
}

// Chart and analytics icons
export function ChartIcon(props: Omit<EnhancedIconProps, 'name'>) {
  return <EnhancedIcon name="BarChart3" {...props} />;
}

export function TrendingIcon(props: Omit<EnhancedIconProps, 'name'>) {
  return <EnhancedIcon name="TrendingUp" {...props} />;
}

export function AnalyticsIcon(props: Omit<EnhancedIconProps, 'name'>) {
  return <EnhancedIcon name="LineChart" {...props} />;
}

// File and document icons
export function FileIcon(props: Omit<EnhancedIconProps, 'name'>) {
  return <EnhancedIcon name="File" {...props} />;
}

export function CSVIcon(props: Omit<EnhancedIconProps, 'name'>) {
  return <EnhancedIcon name="FileSpreadsheet" {...props} />;
}

export function PDFIcon(props: Omit<EnhancedIconProps, 'name'>) {
  return <EnhancedIcon name="FileText" {...props} />;
}

// Media icons
export function VideoIcon(props: Omit<EnhancedIconProps, 'name'>) {
  return <EnhancedIcon name="Video" {...props} />;
}

export function ImageIcon(props: Omit<EnhancedIconProps, 'name'>) {
  return <EnhancedIcon name="Image" {...props} />;
}

export function MusicIcon(props: Omit<EnhancedIconProps, 'name'>) {
  return <EnhancedIcon name="Music" {...props} />;
}