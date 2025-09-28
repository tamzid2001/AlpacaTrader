import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { type VariantProps } from "class-variance-authority"
import { EnhancedIcon, type EnhancedIconProps } from "@/components/icons/enhanced-icon"
import IconPicker from "@/components/icons/icon-picker"
import { IconMetadata } from "@/types/icons"
import { cn } from "@/lib/utils"
import { buttonVariants } from "./button-variants"

export interface EnhancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Accessible label for screen readers */
  'aria-label'?: string
  /** Description for complex buttons */
  'aria-describedby'?: string
  /** Loading state for async operations */
  loading?: boolean
  
  // Icon-related props
  /** Icon name to display */
  icon?: string
  /** Icon library (defaults to 'lucide') */
  iconLibrary?: string
  /** Icon position relative to text */
  iconPosition?: 'left' | 'right' | 'top' | 'bottom'
  /** Custom icon size (defaults based on button size) */
  iconSize?: number
  /** Custom icon color */
  iconColor?: string
  /** Icon-only button (hides text, shows icon only) */
  iconOnly?: boolean
  /** Show icon picker on click (for admin/design mode) */
  showIconPicker?: boolean
  /** Callback when icon is selected via picker */
  onIconSelect?: (icon: IconMetadata) => void
  /** Icon animation */
  iconAnimate?: 'none' | 'spin' | 'pulse' | 'bounce'
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading, 
    children,
    disabled,
    icon,
    iconLibrary = 'lucide',
    iconPosition = 'left',
    iconSize,
    iconColor,
    iconOnly = false,
    showIconPicker = false,
    onIconSelect,
    iconAnimate = 'none',
    onClick,
    ...props 
  }, ref) => {
    const [showPicker, setShowPicker] = React.useState(false);
    const isDisabled = disabled || loading;
    
    // Determine icon size based on button size
    const getIconSize = () => {
      if (iconSize) return iconSize;
      switch (size) {
        case 'sm': return 14;
        case 'lg': return 20;
        case 'icon': return 16;
        default: return 16;
      }
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (showIconPicker) {
        e.preventDefault();
        setShowPicker(true);
      } else {
        onClick?.(e);
      }
    };

    const handleIconSelect = (selectedIcon: IconMetadata) => {
      onIconSelect?.(selectedIcon);
      setShowPicker(false);
    };

    // When using asChild, we need to ensure single child for Slot component
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          disabled={isDisabled}
          aria-disabled={isDisabled}
          onClick={handleClick}
          {...props}
        >
          {children}
        </Slot>
      )
    }

    // Render icon if provided
    const renderIcon = () => {
      if (!icon && !loading) return null;
      
      if (loading) {
        return (
          <EnhancedIcon
            name="Loader2"
            library="lucide"
            size={getIconSize()}
            color={iconColor}
            animate="spin"
            aria-hidden="true"
          />
        );
      }

      return (
        <EnhancedIcon
          name={icon!}
          library={iconLibrary}
          size={getIconSize()}
          color={iconColor}
          animate={iconAnimate}
          aria-hidden="true"
        />
      );
    };

    // Determine content layout based on icon position and iconOnly
    const getContent = () => {
      const iconElement = renderIcon();
      
      if (iconOnly) {
        return iconElement;
      }

      if (!iconElement) {
        return children;
      }

      const spacing = "gap-2";
      
      switch (iconPosition) {
        case 'right':
          return (
            <div className={cn("flex items-center", spacing)}>
              <span>{children}</span>
              {iconElement}
            </div>
          );
        case 'top':
          return (
            <div className="flex flex-col items-center gap-1">
              {iconElement}
              <span className="text-xs">{children}</span>
            </div>
          );
        case 'bottom':
          return (
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs">{children}</span>
              {iconElement}
            </div>
          );
        case 'left':
        default:
          return (
            <div className={cn("flex items-center", spacing)}>
              {iconElement}
              <span>{children}</span>
            </div>
          );
      }
    };

    return (
      <>
        <button
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          disabled={isDisabled}
          aria-disabled={isDisabled}
          onClick={handleClick}
          {...props}
        >
          {getContent()}
          {loading && <span className="sr-only">Loading...</span>}
        </button>
        
        {/* Icon Picker Modal */}
        {showIconPicker && (
          <IconPicker
            open={showPicker}
            onOpenChange={setShowPicker}
            onIconSelect={handleIconSelect}
            title="Select Button Icon"
            description="Choose an icon for this button"
          />
        )}
      </>
    )
  }
)

EnhancedButton.displayName = "EnhancedButton"

export { EnhancedButton }

// Predefined button variants with icons
export function IconButton({ 
  icon, 
  iconLibrary = 'lucide',
  size = 'icon',
  variant = 'ghost',
  ...props 
}: EnhancedButtonProps) {
  return (
    <EnhancedButton
      {...props}
      icon={icon}
      iconLibrary={iconLibrary}
      iconOnly={true}
      size={size}
      variant={variant}
    />
  );
}

export function LoadingButton({ loading, ...props }: EnhancedButtonProps) {
  return (
    <EnhancedButton
      {...props}
      loading={loading}
      disabled={loading || props.disabled}
    />
  );
}

// Action buttons with predefined icons
export function SaveButton(props: Omit<EnhancedButtonProps, 'icon'>) {
  return <EnhancedButton {...props} icon="Save" />;
}

export function CancelButton(props: Omit<EnhancedButtonProps, 'icon'>) {
  return <EnhancedButton {...props} icon="X" variant="outline" />;
}

export function DeleteButton(props: Omit<EnhancedButtonProps, 'icon'>) {
  return <EnhancedButton {...props} icon="Trash2" variant="destructive" />;
}

export function EditButton(props: Omit<EnhancedButtonProps, 'icon'>) {
  return <EnhancedButton {...props} icon="Edit" variant="outline" />;
}

export function DownloadButton(props: Omit<EnhancedButtonProps, 'icon'>) {
  return <EnhancedButton {...props} icon="Download" />;
}

export function UploadButton(props: Omit<EnhancedButtonProps, 'icon'>) {
  return <EnhancedButton {...props} icon="Upload" />;
}

export function ShareButton(props: Omit<EnhancedButtonProps, 'icon'>) {
  return <EnhancedButton {...props} icon="Share2" variant="outline" />;
}

export function RefreshButton(props: Omit<EnhancedButtonProps, 'icon'>) {
  return <EnhancedButton {...props} icon="RefreshCw" variant="outline" />;
}

export function AddButton(props: Omit<EnhancedButtonProps, 'icon'>) {
  return <EnhancedButton {...props} icon="Plus" />;
}

export function SearchButton(props: Omit<EnhancedButtonProps, 'icon'>) {
  return <EnhancedButton {...props} icon="Search" />;
}

// Navigation buttons
export function BackButton(props: Omit<EnhancedButtonProps, 'icon'>) {
  return <EnhancedButton {...props} icon="ArrowLeft" variant="outline" />;
}

export function ForwardButton(props: Omit<EnhancedButtonProps, 'icon'>) {
  return <EnhancedButton {...props} icon="ArrowRight" variant="outline" />;
}

export function CloseButton(props: Omit<EnhancedButtonProps, 'icon'>) {
  return <EnhancedButton {...props} icon="X" variant="ghost" size="icon" />;
}

export function MenuButton(props: Omit<EnhancedButtonProps, 'icon'>) {
  return <EnhancedButton {...props} icon="Menu" variant="ghost" size="icon" />;
}

// Social login buttons
export function GoogleLoginButton(props: Omit<EnhancedButtonProps, 'icon' | 'iconLibrary'>) {
  return (
    <EnhancedButton
      {...props}
      icon="SiGoogle"
      iconLibrary="si"
      className={cn("bg-white text-gray-700 border hover:bg-gray-50", props.className)}
    />
  );
}

export function GithubLoginButton(props: Omit<EnhancedButtonProps, 'icon' | 'iconLibrary'>) {
  return (
    <EnhancedButton
      {...props}
      icon="SiGithub"
      iconLibrary="si"
      className={cn("bg-gray-900 text-white hover:bg-gray-800", props.className)}
    />
  );
}