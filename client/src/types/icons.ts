import { ComponentType, SVGProps } from 'react';

// Base icon component type from react-icons
export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

// Icon metadata interface
export interface IconMetadata {
  name: string;
  displayName: string;
  category: string;
  library: string;
  keywords: string[];
  component: IconComponent;
  variants?: IconVariant[];
}

// Icon variant types
export interface IconVariant {
  name: string;
  component: IconComponent;
  suffix: string;
}

// Icon category structure
export interface IconCategory {
  id: string;
  name: string;
  displayName: string;
  description: string;
  library: string;
  iconCount: number;
  examples: string[];
}

// Icon customization options
export interface IconCustomization {
  size: number;
  color: string;
  strokeWidth?: number;
  fill?: string;
  opacity?: number;
}

// Icon export formats
export type IconExportFormat = 'svg' | 'png' | 'component' | 'jsx';

// Icon export options
export interface IconExportOptions {
  format: IconExportFormat;
  size?: number;
  color?: string;
  backgroundColor?: string;
  padding?: number;
  quality?: number; // For PNG exports
}

// Icon search filters
export interface IconSearchFilters {
  query?: string;
  categories?: string[];
  libraries?: string[];
  variants?: string[];
  minSize?: number;
  maxSize?: number;
}

// Icon usage tracking
export interface IconUsage {
  iconName: string;
  category: string;
  library: string;
  lastUsed: Date;
  useCount: number;
}

// Icon favorites
export interface IconFavorite {
  iconName: string;
  category: string;
  library: string;
  addedAt: Date;
  customization?: IconCustomization;
}

// Icon picker state
export interface IconPickerState {
  isOpen: boolean;
  selectedCategory?: string;
  selectedIcon?: IconMetadata;
  searchQuery: string;
  filters: IconSearchFilters;
  customization: IconCustomization;
  recentIcons: IconUsage[];
  favoriteIcons: IconFavorite[];
}

// Icon generation request
export interface IconGenerationRequest {
  iconName: string;
  category: string;
  library: string;
  customization: IconCustomization;
  exportOptions: IconExportOptions;
}

// Server icon response
export interface ServerIconResponse {
  success: boolean;
  iconName: string;
  format: IconExportFormat;
  data: string; // Base64 or SVG string
  metadata: {
    size: number;
    color: string;
    generatedAt: Date;
    cacheKey: string;
  };
}

// Icon library configuration
export interface IconLibraryConfig {
  name: string;
  displayName: string;
  prefix: string;
  importPath: string;
  categories: IconCategory[];
  supportsVariants: boolean;
  defaultSize: number;
}

// Icon theme configuration
export interface IconTheme {
  name: string;
  displayName: string;
  defaultSize: number;
  defaultColor: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  mutedColor: string;
}

// Icon accessibility configuration
export interface IconAccessibility {
  label: string;
  description?: string;
  role?: string;
  hidden?: boolean;
  labelledBy?: string;
  describedBy?: string;
}