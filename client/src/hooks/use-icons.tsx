import { useState, useEffect, useCallback, useMemo } from 'react';
import { iconManager } from '@/lib/icons/icon-manager';
import {
  IconComponent,
  IconMetadata,
  IconCategory,
  IconSearchFilters,
  IconCustomization,
  IconUsage,
  IconFavorite,
  IconPickerState,
} from '@/types/icons';

// Hook for managing icon picker state
export function useIconPicker() {
  const [state, setState] = useState<IconPickerState>({
    isOpen: false,
    searchQuery: '',
    filters: {},
    customization: {
      size: 24,
      color: 'currentColor',
    },
    recentIcons: [],
    favoriteIcons: [],
  });

  // Load persisted state from localStorage
  useEffect(() => {
    try {
      const savedRecentIcons = localStorage.getItem('icon-picker-recent');
      const savedFavorites = localStorage.getItem('icon-picker-favorites');
      
      if (savedRecentIcons) {
        const recentIcons = JSON.parse(savedRecentIcons).map((item: any) => ({
          ...item,
          lastUsed: new Date(item.lastUsed),
        }));
        setState(prev => ({ ...prev, recentIcons }));
      }
      
      if (savedFavorites) {
        const favoriteIcons = JSON.parse(savedFavorites).map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt),
        }));
        setState(prev => ({ ...prev, favoriteIcons }));
      }
    } catch (error) {
      console.warn('Failed to load icon picker state from localStorage:', error);
    }
  }, []);

  // Open picker
  const openPicker = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: true }));
  }, []);

  // Close picker
  const closePicker = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Update search query
  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  // Update filters
  const setFilters = useCallback((filters: IconSearchFilters) => {
    setState(prev => ({ ...prev, filters }));
  }, []);

  // Update customization
  const setCustomization = useCallback((customization: Partial<IconCustomization>) => {
    setState(prev => ({
      ...prev,
      customization: { ...prev.customization, ...customization },
    }));
  }, []);

  // Select category
  const selectCategory = useCallback((category: string) => {
    setState(prev => ({ ...prev, selectedCategory: category }));
  }, []);

  // Select icon
  const selectIcon = useCallback((icon: IconMetadata) => {
    setState(prev => ({ ...prev, selectedIcon: icon }));
    
    // Add to recent icons
    const usage: IconUsage = {
      iconName: icon.name,
      category: icon.category,
      library: icon.library,
      lastUsed: new Date(),
      useCount: 1,
    };
    
    setState(prev => {
      const existingIndex = prev.recentIcons.findIndex(
        item => item.iconName === icon.name && item.library === icon.library
      );
      
      let newRecentIcons;
      if (existingIndex >= 0) {
        // Update existing entry
        newRecentIcons = [...prev.recentIcons];
        newRecentIcons[existingIndex] = {
          ...newRecentIcons[existingIndex],
          lastUsed: usage.lastUsed,
          useCount: newRecentIcons[existingIndex].useCount + 1,
        };
        // Move to front
        const updated = newRecentIcons.splice(existingIndex, 1)[0];
        newRecentIcons.unshift(updated);
      } else {
        // Add new entry
        newRecentIcons = [usage, ...prev.recentIcons].slice(0, 20); // Keep only 20 recent icons
      }
      
      // Save to localStorage
      try {
        localStorage.setItem('icon-picker-recent', JSON.stringify(newRecentIcons));
      } catch (error) {
        console.warn('Failed to save recent icons to localStorage:', error);
      }
      
      return { ...prev, recentIcons: newRecentIcons };
    });
  }, []);

  // Toggle favorite
  const toggleFavorite = useCallback((icon: IconMetadata) => {
    setState(prev => {
      const existingIndex = prev.favoriteIcons.findIndex(
        item => item.iconName === icon.name && item.library === icon.library
      );
      
      let newFavorites;
      if (existingIndex >= 0) {
        // Remove from favorites
        newFavorites = prev.favoriteIcons.filter((_, index) => index !== existingIndex);
      } else {
        // Add to favorites
        const favorite: IconFavorite = {
          iconName: icon.name,
          category: icon.category,
          library: icon.library,
          addedAt: new Date(),
          customization: prev.customization,
        };
        newFavorites = [favorite, ...prev.favoriteIcons];
      }
      
      // Save to localStorage
      try {
        localStorage.setItem('icon-picker-favorites', JSON.stringify(newFavorites));
      } catch (error) {
        console.warn('Failed to save favorite icons to localStorage:', error);
      }
      
      return { ...prev, favoriteIcons: newFavorites };
    });
  }, []);

  // Check if icon is favorite
  const isFavorite = useCallback((icon: IconMetadata) => {
    return state.favoriteIcons.some(
      fav => fav.iconName === icon.name && fav.library === icon.library
    );
  }, [state.favoriteIcons]);

  return {
    state,
    openPicker,
    closePicker,
    setSearchQuery,
    setFilters,
    setCustomization,
    selectCategory,
    selectIcon,
    toggleFavorite,
    isFavorite,
  };
}

// Hook for searching icons
export function useIconSearch(filters: IconSearchFilters) {
  const [icons, setIcons] = useState<IconMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchIcons = useCallback(async () => {
    if (!filters.query && (!filters.categories || filters.categories.length === 0)) {
      setIcons([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await iconManager.searchIcons(filters);
      setIcons(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search icons');
      setIcons([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timeoutId = setTimeout(searchIcons, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [searchIcons]);

  return { icons, loading, error };
}

// Hook for loading a specific icon
export function useIcon(iconName: string, libraryName: string) {
  const [icon, setIcon] = useState<IconComponent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!iconName || !libraryName) {
      setIcon(null);
      return;
    }

    setLoading(true);
    setError(null);

    iconManager
      .getIcon(iconName, libraryName)
      .then(iconComponent => {
        setIcon(iconComponent);
        setError(null);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to load icon');
        setIcon(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [iconName, libraryName]);

  return { icon, loading, error };
}

// Hook for getting icon categories
export function useIconCategories() {
  const categories = useMemo(() => {
    return iconManager.getAllCategories();
  }, []);

  const getCategoriesByLibrary = useCallback((libraryName: string) => {
    return iconManager.getCategoriesByLibrary(libraryName);
  }, []);

  return { categories, getCategoriesByLibrary };
}

// Hook for popular/recommended icons
export function usePopularIcons() {
  const [popularIcons, setPopularIcons] = useState<IconMetadata[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    
    const loadPopularIcons = async () => {
      const popularIconNames = iconManager.getPopularIcons();
      const icons: IconMetadata[] = [];
      
      // Load popular icons from multiple libraries
      for (const iconName of popularIconNames.slice(0, 20)) {
        try {
          // Try Lucide first, then fallback to other libraries
          let icon = await iconManager.getIcon(iconName, 'lucide');
          let library = 'lucide';
          
          if (!icon) {
            // Try FontAwesome
            icon = await iconManager.getIcon(`Fa${iconName}`, 'fa6');
            library = 'fa6';
          }
          
          if (!icon) {
            // Try Heroicons
            icon = await iconManager.getIcon(`Hi${iconName}`, 'hi2');
            library = 'hi2';
          }
          
          if (icon) {
            icons.push({
              name: iconName,
              displayName: iconName,
              category: 'popular',
              library,
              keywords: [iconName.toLowerCase()],
              component: icon,
            });
          }
        } catch (error) {
          console.warn(`Failed to load popular icon: ${iconName}`, error);
        }
      }
      
      setPopularIcons(icons);
      setLoading(false);
    };
    
    loadPopularIcons();
  }, []);

  return { popularIcons, loading };
}

// Hook for icon export functionality
export function useIconExport() {
  const exportIcon = useCallback(async (
    iconComponent: IconComponent,
    options: {
      format: 'svg' | 'png' | 'component';
      size?: number;
      color?: string;
      backgroundColor?: string;
    }
  ) => {
    try {
      switch (options.format) {
        case 'svg': {
          // Render icon to SVG string
          const svg = await renderIconToSVG(iconComponent, options);
          return { data: svg, mimeType: 'image/svg+xml' };
        }
        
        case 'png': {
          // Convert SVG to PNG (would need canvas or server-side generation)
          const svg = await renderIconToSVG(iconComponent, options);
          const png = await convertSVGToPNG(svg, options);
          return { data: png, mimeType: 'image/png' };
        }
        
        case 'component': {
          // Generate React component code
          const componentCode = generateIconComponent(iconComponent, options);
          return { data: componentCode, mimeType: 'text/plain' };
        }
        
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error) {
      throw new Error(`Failed to export icon: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  return { exportIcon };
}

// Helper function to render icon to SVG (simplified implementation)
async function renderIconToSVG(
  IconComponent: IconComponent,
  options: { size?: number; color?: string }
): Promise<string> {
  // This would need to be implemented using a rendering library or server-side rendering
  // For now, return a placeholder SVG
  const size = options.size || 24;
  const color = options.color || 'currentColor';
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}">
    <!-- Icon content would be rendered here -->
  </svg>`;
}

// Helper function to convert SVG to PNG (would need canvas or server-side generation)
async function convertSVGToPNG(
  svg: string,
  options: { size?: number; backgroundColor?: string }
): Promise<string> {
  // This would need to be implemented using canvas or server-side image generation
  // For now, return a data URL placeholder
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
}

// Helper function to generate React component code
function generateIconComponent(
  IconComponent: IconComponent,
  options: { size?: number; color?: string }
): string {
  const size = options.size || 24;
  const color = options.color || 'currentColor';
  
  return `import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

export function CustomIcon({ size = ${size}, color = "${color}", className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      className={className}
      {...props}
    >
      {/* Icon paths would be generated here */}
    </svg>
  );
}

export default CustomIcon;
`;
}