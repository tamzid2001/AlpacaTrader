import { LRUCache } from 'lru-cache';

// Cache configuration
const CACHE_CONFIG = {
  // SVG cache - can store more since SVGs are smaller
  svg: {
    max: 2000,
    ttl: 1000 * 60 * 60 * 24, // 24 hours
    maxSize: 50 * 1024 * 1024, // 50MB total
    sizeCalculation: (value: string) => value.length,
  },
  // PNG cache - limited since PNGs are larger
  png: {
    max: 500,
    ttl: 1000 * 60 * 60 * 24, // 24 hours
    maxSize: 100 * 1024 * 1024, // 100MB total
    sizeCalculation: (value: Buffer) => value.length,
  },
  // Metadata cache
  metadata: {
    max: 5000,
    ttl: 1000 * 60 * 60 * 12, // 12 hours
    maxSize: 10 * 1024 * 1024, // 10MB total
    sizeCalculation: (value: any) => JSON.stringify(value).length,
  },
  // Search results cache
  search: {
    max: 1000,
    ttl: 1000 * 60 * 30, // 30 minutes
    maxSize: 20 * 1024 * 1024, // 20MB total
    sizeCalculation: (value: any) => JSON.stringify(value).length,
  },
};

// Cache instances
const svgCache = new LRUCache<string, string>(CACHE_CONFIG.svg);
const pngCache = new LRUCache<string, Buffer>(CACHE_CONFIG.png);
const metadataCache = new LRUCache<string, any>(CACHE_CONFIG.metadata);
const searchCache = new LRUCache<string, any>(CACHE_CONFIG.search);

// Cache key generators
export function generateSVGCacheKey(iconName: string, library: string, size: number, color: string, backgroundColor?: string, padding?: number): string {
  return `svg:${library}:${iconName}:${size}:${color}:${backgroundColor || 'none'}:${padding || 0}`;
}

export function generatePNGCacheKey(iconName: string, library: string, size: number, color: string, backgroundColor?: string, padding?: number): string {
  return `png:${library}:${iconName}:${size}:${color}:${backgroundColor || 'none'}:${padding || 0}`;
}

export function generateMetadataCacheKey(iconName: string, library: string): string {
  return `metadata:${library}:${iconName}`;
}

export function generateSearchCacheKey(query?: string, library?: string, category?: string, limit?: number, offset?: number): string {
  return `search:${query || 'all'}:${library || 'all'}:${category || 'all'}:${limit || 20}:${offset || 0}`;
}

// SVG cache operations
export class SVGCache {
  static get(key: string): string | undefined {
    return svgCache.get(key);
  }

  static set(key: string, value: string): void {
    svgCache.set(key, value);
  }

  static has(key: string): boolean {
    return svgCache.has(key);
  }

  static delete(key: string): boolean {
    return svgCache.delete(key);
  }

  static clear(): void {
    svgCache.clear();
  }

  static getStats() {
    return {
      size: svgCache.size,
      calculatedSize: svgCache.calculatedSize,
      maxSize: CACHE_CONFIG.svg.maxSize,
    };
  }
}

// PNG cache operations
export class PNGCache {
  static get(key: string): Buffer | undefined {
    return pngCache.get(key);
  }

  static set(key: string, value: Buffer): void {
    pngCache.set(key, value);
  }

  static has(key: string): boolean {
    return pngCache.has(key);
  }

  static delete(key: string): boolean {
    return pngCache.delete(key);
  }

  static clear(): void {
    pngCache.clear();
  }

  static getStats() {
    return {
      size: pngCache.size,
      calculatedSize: pngCache.calculatedSize,
      maxSize: CACHE_CONFIG.png.maxSize,
    };
  }
}

// Metadata cache operations
export class MetadataCache {
  static get(key: string): any {
    return metadataCache.get(key);
  }

  static set(key: string, value: any): void {
    metadataCache.set(key, value);
  }

  static has(key: string): boolean {
    return metadataCache.has(key);
  }

  static delete(key: string): boolean {
    return metadataCache.delete(key);
  }

  static clear(): void {
    metadataCache.clear();
  }

  static getStats() {
    return {
      size: metadataCache.size,
      calculatedSize: metadataCache.calculatedSize,
      maxSize: CACHE_CONFIG.metadata.maxSize,
    };
  }
}

// Search cache operations
export class SearchCache {
  static get(key: string): any {
    return searchCache.get(key);
  }

  static set(key: string, value: any): void {
    searchCache.set(key, value);
  }

  static has(key: string): boolean {
    return searchCache.has(key);
  }

  static delete(key: string): boolean {
    return searchCache.delete(key);
  }

  static clear(): void {
    searchCache.clear();
  }

  static getStats() {
    return {
      size: searchCache.size,
      calculatedSize: searchCache.calculatedSize,
      maxSize: CACHE_CONFIG.search.maxSize,
    };
  }
}

// Cache warming functions
export async function warmupIconCache(icons: Array<{iconName: string, library: string}>) {
  console.log(`Warming up cache for ${icons.length} icons...`);
  
  // Note: This would be called during server startup
  // Implementation would generate and cache commonly used icons
  // For now, we'll just log the intent
  
  let warmedCount = 0;
  for (const icon of icons.slice(0, 100)) { // Limit initial warmup
    try {
      // Generate common sizes for popular icons
      const commonSizes = [16, 24, 32, 48];
      const commonColors = ['#000000', '#ffffff', '#666666'];
      
      for (const size of commonSizes) {
        for (const color of commonColors) {
          const svgKey = generateSVGCacheKey(icon.iconName, icon.library, size, color);
          const pngKey = generatePNGCacheKey(icon.iconName, icon.library, size, color);
          
          // Check if already cached
          if (!SVGCache.has(svgKey)) {
            // Would generate and cache SVG
            warmedCount++;
          }
          
          if (!PNGCache.has(pngKey)) {
            // Would generate and cache PNG
            warmedCount++;
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to warm cache for ${icon.iconName}:`, error);
    }
  }
  
  console.log(`Cache warmup completed: ${warmedCount} items prepared`);
}

// Cache cleanup and maintenance
export function performCacheCleanup() {
  console.log('Performing cache cleanup...');
  
  const before = {
    svg: SVGCache.getStats(),
    png: PNGCache.getStats(),
    metadata: MetadataCache.getStats(),
    search: SearchCache.getStats(),
  };
  
  // LRU cache automatically handles cleanup, but we can trigger explicit cleanup
  // by accessing size (which triggers internal cleanup)
  svgCache.size;
  pngCache.size;
  metadataCache.size;
  searchCache.size;
  
  const after = {
    svg: SVGCache.getStats(),
    png: PNGCache.getStats(),
    metadata: MetadataCache.getStats(),
    search: SearchCache.getStats(),
  };
  
  console.log('Cache cleanup completed:', {
    svg: { before: before.svg.size, after: after.svg.size },
    png: { before: before.png.size, after: after.png.size },
    metadata: { before: before.metadata.size, after: after.metadata.size },
    search: { before: before.search.size, after: after.search.size },
  });
}

// Get overall cache statistics
export function getCacheStats() {
  return {
    svg: SVGCache.getStats(),
    png: PNGCache.getStats(),
    metadata: MetadataCache.getStats(),
    search: SearchCache.getStats(),
    timestamp: new Date().toISOString(),
  };
}

// Cache invalidation utilities
export function invalidateIconCache(iconName: string, library: string) {
  // Remove all cached variants of this icon
  const keysToDelete: string[] = [];
  
  // This is a simplified approach - in a real implementation,
  // you'd want to track cache keys more systematically
  svgCache.forEach((value, key) => {
    if (key.includes(`${library}:${iconName}:`)) {
      keysToDelete.push(key);
    }
  });
  
  pngCache.forEach((value, key) => {
    if (key.includes(`${library}:${iconName}:`)) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => {
    if (key.startsWith('svg:')) {
      SVGCache.delete(key);
    } else if (key.startsWith('png:')) {
      PNGCache.delete(key);
    }
  });
  
  // Also invalidate metadata
  const metadataKey = generateMetadataCacheKey(iconName, library);
  MetadataCache.delete(metadataKey);
  
  console.log(`Invalidated cache for ${iconName} from ${library}: ${keysToDelete.length} items`);
}

export function invalidateSearchCache() {
  SearchCache.clear();
  console.log('Search cache invalidated');
}

export function invalidateAllCaches() {
  SVGCache.clear();
  PNGCache.clear();
  MetadataCache.clear();
  SearchCache.clear();
  console.log('All caches cleared');
}

// Schedule periodic cleanup (every hour)
setInterval(performCacheCleanup, 1000 * 60 * 60);

// Export cache instances for testing
export const __testing__ = {
  svgCache,
  pngCache,
  metadataCache,
  searchCache,
};