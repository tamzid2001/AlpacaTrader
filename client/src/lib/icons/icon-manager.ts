import { IconComponent, IconMetadata, IconCategory, IconLibraryConfig, IconSearchFilters } from '@/types/icons';

// Dynamic imports for icon libraries
const iconLibraries = {
  lucide: () => import('lucide-react'),
  fa: () => import('react-icons/fa'),
  fa6: () => import('react-icons/fa6'),
  md: () => import('react-icons/md'),
  ai: () => import('react-icons/ai'),
  bi: () => import('react-icons/bi'),
  bs: () => import('react-icons/bs'),
  cg: () => import('react-icons/cg'),
  di: () => import('react-icons/di'),
  fi: () => import('react-icons/fi'),
  gi: () => import('react-icons/gi'),
  go: () => import('react-icons/go'),
  gr: () => import('react-icons/gr'),
  hi: () => import('react-icons/hi'),
  hi2: () => import('react-icons/hi2'),
  im: () => import('react-icons/im'),
  io: () => import('react-icons/io'),
  io5: () => import('react-icons/io5'),
  lia: () => import('react-icons/lia'),
  pi: () => import('react-icons/pi'),
  ri: () => import('react-icons/ri'),
  rx: () => import('react-icons/rx'),
  si: () => import('react-icons/si'),
  sl: () => import('react-icons/sl'),
  tb: () => import('react-icons/tb'),
  ti: () => import('react-icons/ti'),
  vsc: () => import('react-icons/vsc'),
  wi: () => import('react-icons/wi'),
};

// Icon library configurations
export const iconLibraryConfigs: IconLibraryConfig[] = [
  {
    name: 'lucide',
    displayName: 'Lucide React',
    prefix: 'lucide',
    importPath: 'lucide-react',
    categories: [
      {
        id: 'general',
        name: 'general',
        displayName: 'General',
        description: 'Common icons for everyday use',
        library: 'lucide',
        iconCount: 1000,
        examples: ['Home', 'User', 'Settings', 'Search']
      }
    ],
    supportsVariants: false,
    defaultSize: 24,
  },
  {
    name: 'fa6',
    displayName: 'Font Awesome 6',
    prefix: 'fa6',
    importPath: 'react-icons/fa6',
    categories: [
      {
        id: 'solid',
        name: 'solid',
        displayName: 'Solid',
        description: 'Solid filled icons',
        library: 'fa6',
        iconCount: 800,
        examples: ['FaHome', 'FaUser', 'FaCog', 'FaSearch']
      },
      {
        id: 'regular',
        name: 'regular',
        displayName: 'Regular',
        description: 'Regular outline icons',
        library: 'fa6',
        iconCount: 400,
        examples: ['FarHome', 'FarUser', 'FarCog', 'FarSearch']
      }
    ],
    supportsVariants: true,
    defaultSize: 16,
  },
  {
    name: 'md',
    displayName: 'Material Design',
    prefix: 'md',
    importPath: 'react-icons/md',
    categories: [
      {
        id: 'filled',
        name: 'filled',
        displayName: 'Filled',
        description: 'Material filled icons',
        library: 'md',
        iconCount: 900,
        examples: ['MdHome', 'MdPerson', 'MdSettings', 'MdSearch']
      }
    ],
    supportsVariants: false,
    defaultSize: 24,
  },
  {
    name: 'ai',
    displayName: 'Ant Design',
    prefix: 'ai',
    importPath: 'react-icons/ai',
    categories: [
      {
        id: 'outlined',
        name: 'outlined',
        displayName: 'Outlined',
        description: 'Ant Design outlined icons',
        library: 'ai',
        iconCount: 600,
        examples: ['AiOutlineHome', 'AiOutlineUser', 'AiOutlineSetting', 'AiOutlineSearch']
      },
      {
        id: 'filled',
        name: 'filled',
        displayName: 'Filled',
        description: 'Ant Design filled icons',
        library: 'ai',
        iconCount: 300,
        examples: ['AiFillHome', 'AiFillUser', 'AiFillSetting', 'AiFillSearch']
      }
    ],
    supportsVariants: true,
    defaultSize: 16,
  },
  {
    name: 'bi',
    displayName: 'Bootstrap Icons',
    prefix: 'bi',
    importPath: 'react-icons/bi',
    categories: [
      {
        id: 'general',
        name: 'general',
        displayName: 'General',
        description: 'Bootstrap icons',
        library: 'bi',
        iconCount: 1300,
        examples: ['BiHome', 'BiUser', 'BiCog', 'BiSearch']
      }
    ],
    supportsVariants: false,
    defaultSize: 16,
  },
  {
    name: 'hi2',
    displayName: 'Heroicons 2',
    prefix: 'hi2',
    importPath: 'react-icons/hi2',
    categories: [
      {
        id: 'outline',
        name: 'outline',
        displayName: 'Outline',
        description: 'Heroicons 2 outline icons',
        library: 'hi2',
        iconCount: 300,
        examples: ['HiOutlineHome', 'HiOutlineUser', 'HiOutlineCog', 'HiOutlineMagnifyingGlass']
      },
      {
        id: 'solid',
        name: 'solid',
        displayName: 'Solid',
        description: 'Heroicons 2 solid icons',
        library: 'hi2',
        iconCount: 300,
        examples: ['HiHome', 'HiUser', 'HiCog6Tooth', 'HiMagnifyingGlass']
      }
    ],
    supportsVariants: true,
    defaultSize: 24,
  },
  {
    name: 'io5',
    displayName: 'Ionicons 5',
    prefix: 'io5',
    importPath: 'react-icons/io5',
    categories: [
      {
        id: 'outline',
        name: 'outline',
        displayName: 'Outline',
        description: 'Ionicons 5 outline icons',
        library: 'io5',
        iconCount: 500,
        examples: ['IoHomeOutline', 'IoPersonOutline', 'IoSettingsOutline', 'IoSearchOutline']
      },
      {
        id: 'solid',
        name: 'solid',
        displayName: 'Solid',
        description: 'Ionicons 5 solid icons',
        library: 'io5',
        iconCount: 500,
        examples: ['IoHome', 'IoPerson', 'IoSettings', 'IoSearch']
      }
    ],
    supportsVariants: true,
    defaultSize: 24,
  },
  {
    name: 'si',
    displayName: 'Simple Icons',
    prefix: 'si',
    importPath: 'react-icons/si',
    categories: [
      {
        id: 'brands',
        name: 'brands',
        displayName: 'Brands',
        description: 'Brand and logo icons',
        library: 'si',
        iconCount: 2000,
        examples: ['SiGoogle', 'SiGithub', 'SiReplit', 'SiOpenai']
      }
    ],
    supportsVariants: false,
    defaultSize: 24,
  },
];

class IconManager {
  private iconCache = new Map<string, IconComponent>();
  private libraryCache = new Map<string, any>();
  private metadataCache = new Map<string, IconMetadata[]>();
  
  // Get all available categories
  getAllCategories(): IconCategory[] {
    const categories: IconCategory[] = [];
    for (const config of iconLibraryConfigs) {
      categories.push(...config.categories);
    }
    return categories;
  }
  
  // Get categories for a specific library
  getCategoriesByLibrary(libraryName: string): IconCategory[] {
    const config = iconLibraryConfigs.find(c => c.name === libraryName);
    return config?.categories || [];
  }
  
  // Get library configuration
  getLibraryConfig(libraryName: string): IconLibraryConfig | undefined {
    return iconLibraryConfigs.find(c => c.name === libraryName);
  }
  
  // Dynamically load icon library
  async loadIconLibrary(libraryName: keyof typeof iconLibraries): Promise<any> {
    if (this.libraryCache.has(libraryName)) {
      return this.libraryCache.get(libraryName);
    }
    
    try {
      const library = await iconLibraries[libraryName]();
      this.libraryCache.set(libraryName, library);
      return library;
    } catch (error) {
      console.error(`Failed to load icon library: ${libraryName}`, error);
      return null;
    }
  }
  
  // Get icon component by name
  async getIcon(iconName: string, libraryName: string): Promise<IconComponent | null> {
    const cacheKey = `${libraryName}:${iconName}`;
    
    if (this.iconCache.has(cacheKey)) {
      return this.iconCache.get(cacheKey)!;
    }
    
    try {
      const library = await this.loadIconLibrary(libraryName as keyof typeof iconLibraries);
      if (!library || !library[iconName]) {
        console.warn(`Icon ${iconName} not found in library ${libraryName}`);
        return null;
      }
      
      const iconComponent = library[iconName];
      
      // Validate that the component is a valid React component
      // Check for regular functions, forwardRef components, and memo components
      const isValidComponent = typeof iconComponent === 'function' || 
        (iconComponent && typeof iconComponent === 'object' && 
         (iconComponent.$$typeof === Symbol.for('react.forward_ref') ||
          iconComponent.$$typeof === Symbol.for('react.memo') ||
          iconComponent.$$typeof?.toString?.().includes('react.forward_ref') ||
          iconComponent.$$typeof?.toString?.().includes('react.memo')));
          
      if (!isValidComponent) {
        console.warn(`Icon ${iconName} from ${libraryName} is not a valid React component:`, typeof iconComponent, iconComponent);
        return null;
      }
      
      this.iconCache.set(cacheKey, iconComponent);
      return iconComponent;
    } catch (error) {
      console.error(`Error loading icon ${iconName} from ${libraryName}:`, error);
      return null;
    }
  }
  
  // Search icons with filters
  async searchIcons(filters: IconSearchFilters): Promise<IconMetadata[]> {
    const results: IconMetadata[] = [];
    
    // Determine which libraries to search
    const librariesToSearch = filters.libraries || iconLibraryConfigs.map(c => c.name);
    
    for (const libraryName of librariesToSearch) {
      const config = this.getLibraryConfig(libraryName);
      if (!config) continue;
      
      try {
        const library = await this.loadIconLibrary(libraryName as keyof typeof iconLibraries);
        if (!library) continue;
        
        const iconNames = Object.keys(library);
        
        for (const iconName of iconNames) {
          // Skip non-icon exports
          if (typeof library[iconName] !== 'function') continue;
          
          // Apply search filters
          if (filters.query && !iconName.toLowerCase().includes(filters.query.toLowerCase())) {
            continue;
          }
          
          // Create metadata
          const metadata: IconMetadata = {
            name: iconName,
            displayName: this.formatDisplayName(iconName),
            category: this.getIconCategory(iconName, libraryName),
            library: libraryName,
            keywords: this.generateKeywords(iconName),
            component: library[iconName],
          };
          
          results.push(metadata);
        }
      } catch (error) {
        console.error(`Error searching icons in library ${libraryName}:`, error);
      }
    }
    
    return results;
  }
  
  // Get popular/recommended icons
  getPopularIcons(): string[] {
    return [
      // Common UI icons
      'Home', 'User', 'Settings', 'Search', 'Menu', 'Close', 'Plus', 'Minus',
      // Navigation
      'ChevronLeft', 'ChevronRight', 'ChevronUp', 'ChevronDown', 'ArrowLeft', 'ArrowRight',
      // Actions
      'Edit', 'Delete', 'Save', 'Copy', 'Download', 'Upload', 'Share', 'Star',
      // Status
      'Check', 'X', 'AlertTriangle', 'Info', 'Help', 'Bell', 'Mail', 'Phone',
      // Media
      'Play', 'Pause', 'Stop', 'Volume2', 'Camera', 'Image', 'Video', 'Music',
      // File types
      'File', 'FileText', 'Database', 'Folder', 'Archive', 'Code', 'FileJson',
      // Social
      'Github', 'Twitter', 'Facebook', 'LinkedIn', 'Instagram', 'Youtube',
    ];
  }
  
  // Format display name from icon name
  private formatDisplayName(iconName: string): string {
    // Remove prefixes (Fa, Ai, Bi, etc.)
    let displayName = iconName.replace(/^(Fa|Ai|Bi|Hi|Io|Md|Si|Ti|Vsc|Wi|Gi|Go|Gr|Cg|Di|Fi|Im|Lia|Pi|Ri|Rx|Sl|Tb)[A-Z]?/g, '');
    
    // Handle special cases for Lucide (no prefix removal needed)
    if (!displayName || displayName === iconName) {
      displayName = iconName;
    }
    
    // Convert PascalCase to Title Case
    return displayName
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/^\w/, c => c.toUpperCase());
  }
  
  // Get category for icon based on name patterns
  private getIconCategory(iconName: string, libraryName: string): string {
    const name = iconName.toLowerCase();
    
    // Category mapping based on common patterns
    if (name.includes('arrow') || name.includes('chevron') || name.includes('navigate')) return 'navigation';
    if (name.includes('user') || name.includes('person') || name.includes('profile')) return 'user';
    if (name.includes('home') || name.includes('house') || name.includes('building')) return 'places';
    if (name.includes('mail') || name.includes('message') || name.includes('chat')) return 'communication';
    if (name.includes('file') || name.includes('document') || name.includes('folder')) return 'files';
    if (name.includes('play') || name.includes('video') || name.includes('music') || name.includes('media')) return 'media';
    if (name.includes('chart') || name.includes('graph') || name.includes('analytics')) return 'charts';
    if (name.includes('lock') || name.includes('shield') || name.includes('security')) return 'security';
    if (name.includes('shopping') || name.includes('cart') || name.includes('store')) return 'commerce';
    if (name.includes('heart') || name.includes('star') || name.includes('thumbs')) return 'social';
    
    // Library-specific defaults
    if (libraryName === 'si') return 'brands';
    
    return 'general';
  }
  
  // Generate keywords for better searchability
  private generateKeywords(iconName: string): string[] {
    const keywords = new Set<string>();
    
    // Add the original name
    keywords.add(iconName.toLowerCase());
    
    // Add words from the formatted display name
    const displayName = this.formatDisplayName(iconName);
    displayName.toLowerCase().split(/\s+/).forEach(word => keywords.add(word));
    
    // Add common synonyms
    const synonyms: Record<string, string[]> = {
      'home': ['house', 'dashboard', 'main'],
      'user': ['person', 'profile', 'account', 'avatar'],
      'settings': ['config', 'preferences', 'options', 'gear'],
      'search': ['find', 'lookup', 'magnifier', 'glass'],
      'menu': ['hamburger', 'navigation', 'options'],
      'close': ['x', 'cancel', 'exit', 'dismiss'],
      'edit': ['pencil', 'modify', 'change', 'update'],
      'delete': ['trash', 'remove', 'destroy', 'bin'],
      'save': ['disk', 'store', 'keep', 'preserve'],
      'download': ['arrow-down', 'import', 'save'],
      'upload': ['arrow-up', 'export', 'send'],
    };
    
    // Add synonyms
    for (const [key, values] of Object.entries(synonyms)) {
      if (iconName.toLowerCase().includes(key)) {
        values.forEach(synonym => keywords.add(synonym));
      }
    }
    
    return Array.from(keywords);
  }
  
  // Clear caches (useful for development)
  clearCache(): void {
    this.iconCache.clear();
    this.libraryCache.clear();
    this.metadataCache.clear();
  }
}

// Export singleton instance
export const iconManager = new IconManager();