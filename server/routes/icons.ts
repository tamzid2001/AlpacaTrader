import { Router } from 'express';
import { z } from 'zod';
import { iconLibraryConfigs } from '../lib/icon-metadata.js';
import { searchIcons, getIconMetadata, getAvailableLibraries, getAvailableCategories } from '../lib/icon-catalog.js';
import { generateIconSVG, generateIconPNG } from '../lib/icon-generator.js';
import { 
  SVGCache, 
  PNGCache, 
  MetadataCache, 
  SearchCache,
  generateSVGCacheKey,
  generatePNGCacheKey,
  generateMetadataCacheKey,
  generateSearchCacheKey
} from '../lib/icon-cache.js';

const router = Router();

// Icon generation request schema
const iconGenerationSchema = z.object({
  iconName: z.string(),
  library: z.string().default('lucide'),
  size: z.number().min(12).max(512).default(24),
  color: z.string().default('#000000'),
  format: z.enum(['svg', 'png']).default('svg'),
  backgroundColor: z.string().optional(),
  padding: z.number().min(0).max(50).default(0),
});

// Icon search schema
const iconSearchSchema = z.object({
  query: z.string().optional(),
  library: z.string().optional(),
  category: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

// Get all icon categories
router.get('/categories', async (req, res) => {
  try {
    // Use real categories from the icon catalog
    const realCategories = await getAvailableCategories();
    
    // Format to match expected response structure
    const categories = realCategories.map(cat => ({
      id: cat.category,
      name: cat.category,
      displayName: cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
      description: `${cat.category} icons`,
      iconCount: cat.iconCount,
      libraries: cat.libraries,
    }));

    res.json({
      success: true,
      categories,
      total: categories.length,
    });
  } catch (error) {
    console.error('Error fetching icon categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch icon categories',
    });
  }
});

// Get icon libraries
router.get('/libraries', async (req, res) => {
  try {
    // Use real library data from the icon catalog
    const realLibraries = await getAvailableLibraries();
    
    // Enhance with configuration data
    const libraries = realLibraries.map(lib => {
      const config = iconLibraryConfigs.find(c => c.name === lib.name);
      return {
        name: lib.name,
        displayName: lib.displayName,
        prefix: config?.prefix || lib.name,
        importPath: config?.importPath || '',
        supportsVariants: config?.supportsVariants || false,
        defaultSize: config?.defaultSize || 24,
        categoryCount: config?.categories.length || 0,
        totalIcons: lib.iconCount, // Real count from catalog
      };
    });

    res.json({
      success: true,
      libraries,
      total: libraries.length,
    });
  } catch (error) {
    console.error('Error fetching icon libraries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch icon libraries',
    });
  }
});

// Search icons
router.get('/search', async (req, res) => {
  try {
    const { query, library, category, limit, offset } = iconSearchSchema.parse({
      ...req.query,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    });

    // Check cache first
    const cacheKey = generateSearchCacheKey(query, library, category, limit, offset);
    const cachedResults = SearchCache.get(cacheKey);
    
    if (cachedResults) {
      return res.json({
        success: true,
        ...cachedResults,
        cached: true,
      });
    }

    // Use real search functionality
    const searchResults = await searchIcons(query, library, category, limit, offset);

    const response = {
      success: true,
      icons: searchResults.icons,
      total: searchResults.total,
      limit,
      offset,
      hasMore: searchResults.total > offset + limit,
    };
    
    // Cache the results
    SearchCache.set(cacheKey, response);

    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid search parameters',
        details: error.errors,
      });
    }

    console.error('Error searching icons:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search icons',
    });
  }
});

// Generate icon (SVG or PNG)
router.get('/generate/:iconName', async (req, res) => {
  try {
    const { iconName } = req.params;
    const params = iconGenerationSchema.parse({
      iconName,
      ...req.query,
      size: req.query.size ? parseInt(req.query.size as string) : undefined,
      padding: req.query.padding ? parseInt(req.query.padding as string) : undefined,
    });

    if (params.format === 'svg') {
      // Check SVG cache first
      const cacheKey = generateSVGCacheKey(params.iconName, params.library, params.size, params.color, params.backgroundColor, params.padding);
      let svg = SVGCache.get(cacheKey);
      
      if (!svg) {
        // Generate real SVG using our icon generator
        svg = await generateIconSVG(params);
        SVGCache.set(cacheKey, svg);
      }
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.send(svg);
    } else {
      // Check PNG cache first
      const cacheKey = generatePNGCacheKey(params.iconName, params.library, params.size, params.color, params.backgroundColor, params.padding);
      let png = PNGCache.get(cacheKey);
      
      if (!png) {
        // Generate real PNG using our icon generator
        png = await generateIconPNG(params);
        PNGCache.set(cacheKey, png);
      }
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.send(png);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid generation parameters',
        details: error.errors,
      });
    }

    console.error('Error generating icon:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate icon',
    });
  }
});

// Get icon metadata
router.get('/metadata/:iconName', async (req, res) => {
  try {
    const { iconName } = req.params;
    const { library = 'lucide' } = req.query;

    // Check metadata cache first
    const cacheKey = generateMetadataCacheKey(iconName, library as string);
    let metadata = MetadataCache.get(cacheKey);
    
    if (!metadata) {
      // Get real metadata using our icon catalog
      metadata = await getIconMetadata(iconName, library as string);
      
      if (metadata) {
        MetadataCache.set(cacheKey, metadata);
      }
    }

    if (!metadata) {
      return res.status(404).json({
        success: false,
        error: 'Icon not found',
      });
    }

    res.json({
      success: true,
      metadata,
    });
  } catch (error) {
    console.error('Error fetching icon metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch icon metadata',
    });
  }
});

// Batch generate icons
router.post('/batch-generate', async (req, res) => {
  try {
    const { icons, defaultParams } = req.body;

    if (!Array.isArray(icons) || icons.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Icons array is required',
      });
    }

    if (icons.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 50 icons per batch',
      });
    }

    const results = await Promise.allSettled(
      icons.map(async (iconConfig: any) => {
        const params = iconGenerationSchema.parse({
          ...defaultParams,
          ...iconConfig,
        });
        
        if (params.format === 'svg') {
          // Check cache first, then generate real SVG
          const cacheKey = generateSVGCacheKey(params.iconName, params.library, params.size, params.color, params.backgroundColor, params.padding);
          let svg = SVGCache.get(cacheKey);
          
          if (!svg) {
            svg = await generateIconSVG(params);
            SVGCache.set(cacheKey, svg);
          }
          
          return {
            iconName: params.iconName,
            format: 'svg',
            data: svg,
            mimeType: 'image/svg+xml',
          };
        } else {
          // Check cache first, then generate real PNG
          const cacheKey = generatePNGCacheKey(params.iconName, params.library, params.size, params.color, params.backgroundColor, params.padding);
          let png = PNGCache.get(cacheKey);
          
          if (!png) {
            png = await generateIconPNG(params);
            PNGCache.set(cacheKey, png);
          }
          
          return {
            iconName: params.iconName,
            format: 'png',
            data: png,
            mimeType: 'image/png',
          };
        }
      })
    );

    const successful = results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value);

    const failed = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map(result => result.reason);

    res.json({
      success: true,
      results: successful,
      failures: failed,
      total: icons.length,
      successful: successful.length,
      failed: failed.length,
    });
  } catch (error) {
    console.error('Error in batch generation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process batch generation',
    });
  }
});

// Cache statistics endpoint
router.get('/cache-stats', async (req, res) => {
  try {
    const stats = {
      svg: SVGCache.getStats(),
      png: PNGCache.getStats(),
      metadata: MetadataCache.getStats(),
      search: SearchCache.getStats(),
      timestamp: new Date().toISOString(),
    };
    
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cache statistics',
    });
  }
});

// All stubbed helper functions have been removed and replaced with real implementations from our libraries

export default router;