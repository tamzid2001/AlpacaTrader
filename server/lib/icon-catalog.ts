import { iconLibraryConfigs } from './icon-metadata.js';

// Real icon catalogs - dynamically generated from actual libraries
interface IconCatalogEntry {
  name: string;
  displayName: string;
  library: string;
  category: string;
  keywords: string[];
  variants?: string[];
  tags: string[];
  importPath: string;
}

interface IconCatalog {
  [libraryName: string]: IconCatalogEntry[];
}

// Cache for icon catalogs to avoid regenerating
let iconCatalogCache: IconCatalog | null = null;
let catalogLastBuilt: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Build real icon catalogs from available icon libraries
 */
export async function buildIconCatalog(): Promise<IconCatalog> {
  const now = Date.now();
  
  // Return cached catalog if still valid
  if (iconCatalogCache && (now - catalogLastBuilt) < CACHE_DURATION) {
    return iconCatalogCache;
  }

  console.log('Building icon catalog from libraries...');
  
  const catalog: IconCatalog = {};

  for (const config of iconLibraryConfigs) {
    try {
      const icons = await getIconsFromLibrary(config);
      catalog[config.name] = icons;
      console.log(`Loaded ${icons.length} icons from ${config.displayName}`);
    } catch (error) {
      console.warn(`Failed to load icons from ${config.displayName}:`, error);
      catalog[config.name] = [];
    }
  }

  iconCatalogCache = catalog;
  catalogLastBuilt = now;
  
  const totalIcons = Object.values(catalog).reduce((sum, icons) => sum + icons.length, 0);
  console.log(`Icon catalog built successfully with ${totalIcons} total icons`);
  
  return catalog;
}

/**
 * Get real icons from a specific library using dynamic imports
 */
async function getIconsFromLibrary(config: any): Promise<IconCatalogEntry[]> {
  const icons: IconCatalogEntry[] = [];

  try {
    let iconModule: any;
    
    // Dynamic import based on library
    switch (config.name) {
      case 'lucide':
        iconModule = await import('lucide-react');
        break;
      case 'fa6':
        iconModule = await import('react-icons/fa6');
        break;
      case 'md':
        iconModule = await import('react-icons/md');
        break;
      case 'si':
        iconModule = await import('react-icons/si');
        break;
      case 'hi2':
        iconModule = await import('react-icons/hi2');
        break;
      case 'bi':
        iconModule = await import('react-icons/bi');
        break;
      case 'io5':
        iconModule = await import('react-icons/io5');
        break;
      default:
        console.warn(`Unknown library: ${config.name}`);
        return [];
    }

    // Extract icon names from the module
    const iconNames = Object.keys(iconModule).filter(key => {
      const item = iconModule[key];
      // Filter out non-component exports (like __esModule, default, etc.)
      return typeof item === 'function' || (item && item.$$typeof);
    });

    // Build catalog entries for each icon
    for (const iconName of iconNames) {
      // Skip non-icon exports
      if (iconName.startsWith('_') || iconName === 'default' || 
          iconName === 'createLucideIcon' || iconName === 'Icon') {
        continue;
      }

      const displayName = formatDisplayName(iconName);
      const category = getCategoryForIcon(iconName, config);
      const keywords = generateKeywords(iconName, displayName);
      
      icons.push({
        name: iconName,
        displayName,
        library: config.name,
        category,
        keywords,
        tags: [category, config.name],
        importPath: config.importPath,
        variants: config.supportsVariants ? getVariantsForIcon(iconName) : undefined,
      });
    }

  } catch (error) {
    console.error(`Error loading ${config.name} library:`, error);
    throw error;
  }

  return icons;
}

/**
 * Format icon name to display name
 */
function formatDisplayName(iconName: string): string {
  // Remove prefixes (Fa, Md, Si, Hi, Bi, Io, etc.)
  const cleanName = iconName.replace(/^(Fa|Far|Fas|Md|Si|Hi|Bi|Io|IoMd|IoIos)/, '');
  
  // Convert camelCase to spaced words
  return cleanName
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .trim();
}

/**
 * Get category for an icon based on naming patterns
 */
function getCategoryForIcon(iconName: string, config: any): string {
  const lowerName = iconName.toLowerCase();
  
  // Category mapping based on common patterns
  if (lowerName.includes('arrow') || lowerName.includes('chevron') || 
      lowerName.includes('direction') || lowerName.includes('navigate')) {
    return 'navigation';
  }
  
  if (lowerName.includes('home') || lowerName.includes('user') || 
      lowerName.includes('profile') || lowerName.includes('person')) {
    return 'user';
  }
  
  if (lowerName.includes('mail') || lowerName.includes('message') || 
      lowerName.includes('chat') || lowerName.includes('phone') || 
      lowerName.includes('bell') || lowerName.includes('notification')) {
    return 'communication';
  }
  
  if (lowerName.includes('play') || lowerName.includes('pause') || 
      lowerName.includes('video') || lowerName.includes('music') || 
      lowerName.includes('media') || lowerName.includes('camera')) {
    return 'media';
  }
  
  if (lowerName.includes('edit') || lowerName.includes('delete') || 
      lowerName.includes('save') || lowerName.includes('copy') || 
      lowerName.includes('cut') || lowerName.includes('paste')) {
    return 'editing';
  }
  
  if (lowerName.includes('share') || lowerName.includes('export') || 
      lowerName.includes('import') || lowerName.includes('download') || 
      lowerName.includes('upload')) {
    return 'sharing';
  }
  
  if (lowerName.includes('settings') || lowerName.includes('config') || 
      lowerName.includes('gear') || lowerName.includes('cog')) {
    return 'interface';
  }
  
  if (lowerName.includes('calendar') || lowerName.includes('clock') || 
      lowerName.includes('time') || lowerName.includes('date')) {
    return 'time';
  }

  // Brand/logo icons for Simple Icons
  if (config.name === 'si') {
    return 'brands';
  }
  
  // Default to general
  return 'general';
}

/**
 * Generate keywords for search
 */
function generateKeywords(iconName: string, displayName: string): string[] {
  const keywords = new Set<string>();
  
  // Add the icon name variations
  keywords.add(iconName.toLowerCase());
  keywords.add(displayName.toLowerCase());
  
  // Add individual words from display name
  displayName.toLowerCase().split(' ').forEach(word => {
    if (word.length > 2) {
      keywords.add(word);
    }
  });
  
  // Add common synonyms
  const synonyms: Record<string, string[]> = {
    'home': ['house', 'main', 'start'],
    'user': ['person', 'profile', 'account', 'people'],
    'settings': ['config', 'options', 'preferences', 'gear', 'cog'],
    'search': ['find', 'magnify', 'glass', 'look'],
    'mail': ['email', 'message', 'envelope'],
    'phone': ['call', 'telephone', 'mobile'],
    'calendar': ['date', 'schedule', 'time'],
    'edit': ['modify', 'change', 'pencil'],
    'delete': ['remove', 'trash', 'bin'],
    'download': ['get', 'fetch', 'save'],
    'upload': ['send', 'post', 'submit'],
  };
  
  Object.entries(synonyms).forEach(([key, values]) => {
    if (iconName.toLowerCase().includes(key)) {
      values.forEach(synonym => keywords.add(synonym));
    }
  });
  
  return Array.from(keywords);
}

/**
 * Get variants for an icon (outline, solid, etc.)
 */
function getVariantsForIcon(iconName: string): string[] {
  const variants: string[] = [];
  
  if (iconName.includes('Outline')) {
    variants.push('outline');
  }
  if (iconName.includes('Solid') || (!iconName.includes('Outline') && !iconName.includes('Regular'))) {
    variants.push('solid');
  }
  if (iconName.includes('Regular')) {
    variants.push('regular');
  }
  
  return variants.length > 0 ? variants : ['default'];
}

/**
 * Search icons with real data
 */
export async function searchIcons(
  query?: string, 
  library?: string, 
  category?: string, 
  limit = 20, 
  offset = 0
): Promise<{icons: IconCatalogEntry[], total: number}> {
  const catalog = await buildIconCatalog();
  
  let allIcons: IconCatalogEntry[] = [];
  
  // Filter by library if specified
  if (library && catalog[library]) {
    allIcons = catalog[library];
  } else {
    // Combine all libraries
    allIcons = Object.values(catalog).flat();
  }
  
  // Filter by category if specified
  if (category) {
    allIcons = allIcons.filter(icon => icon.category === category);
  }
  
  // Filter by search query if specified
  if (query && query.trim()) {
    const searchTerm = query.toLowerCase().trim();
    allIcons = allIcons.filter(icon => {
      return icon.name.toLowerCase().includes(searchTerm) ||
             icon.displayName.toLowerCase().includes(searchTerm) ||
             icon.keywords.some(keyword => keyword.includes(searchTerm)) ||
             icon.tags.some(tag => tag.toLowerCase().includes(searchTerm));
    });
    
    // Sort by relevance (exact matches first, then partial matches)
    allIcons.sort((a, b) => {
      const aExact = a.name.toLowerCase() === searchTerm || a.displayName.toLowerCase() === searchTerm;
      const bExact = b.name.toLowerCase() === searchTerm || b.displayName.toLowerCase() === searchTerm;
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      const aStarts = a.name.toLowerCase().startsWith(searchTerm) || a.displayName.toLowerCase().startsWith(searchTerm);
      const bStarts = b.name.toLowerCase().startsWith(searchTerm) || b.displayName.toLowerCase().startsWith(searchTerm);
      
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      return a.name.localeCompare(b.name);
    });
  } else {
    // Sort alphabetically by default
    allIcons.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  const total = allIcons.length;
  const icons = allIcons.slice(offset, offset + limit);
  
  return { icons, total };
}

/**
 * Get icon metadata
 */
export async function getIconMetadata(iconName: string, library: string): Promise<IconCatalogEntry | null> {
  const catalog = await buildIconCatalog();
  
  if (!catalog[library]) {
    return null;
  }
  
  const icon = catalog[library].find(icon => icon.name === iconName);
  return icon || null;
}

/**
 * Get all available libraries with their icon counts
 */
export async function getAvailableLibraries(): Promise<Array<{name: string, displayName: string, iconCount: number}>> {
  const catalog = await buildIconCatalog();
  
  return Object.entries(catalog).map(([name, icons]) => {
    const config = iconLibraryConfigs.find(c => c.name === name);
    return {
      name,
      displayName: config?.displayName || name,
      iconCount: icons.length,
    };
  });
}

/**
 * Get all available categories
 */
export async function getAvailableCategories(): Promise<Array<{category: string, iconCount: number, libraries: string[]}>> {
  const catalog = await buildIconCatalog();
  const categoryMap = new Map<string, {count: number, libraries: Set<string>}>();
  
  Object.values(catalog).flat().forEach(icon => {
    if (!categoryMap.has(icon.category)) {
      categoryMap.set(icon.category, {count: 0, libraries: new Set()});
    }
    
    const entry = categoryMap.get(icon.category)!;
    entry.count++;
    entry.libraries.add(icon.library);
  });
  
  return Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    iconCount: data.count,
    libraries: Array.from(data.libraries),
  })).sort((a, b) => b.iconCount - a.iconCount);
}