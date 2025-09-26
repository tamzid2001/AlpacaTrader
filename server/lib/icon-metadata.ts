// Icon library configurations for server-side operations
export interface IconCategory {
  id: string;
  name: string;
  displayName: string;
  description: string;
  library: string;
  iconCount: number;
  examples: string[];
}

export interface IconLibraryConfig {
  name: string;
  displayName: string;
  prefix: string;
  importPath: string;
  categories: IconCategory[];
  supportsVariants: boolean;
  defaultSize: number;
}

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
      },
      {
        id: 'navigation',
        name: 'navigation',
        displayName: 'Navigation',
        description: 'Navigation and directional icons',
        library: 'lucide',
        iconCount: 150,
        examples: ['ChevronLeft', 'ChevronRight', 'ArrowUp', 'Menu']
      },
      {
        id: 'interface',
        name: 'interface',
        displayName: 'Interface',
        description: 'User interface elements',
        library: 'lucide',
        iconCount: 200,
        examples: ['Button', 'Switch', 'Slider', 'Input']
      },
      {
        id: 'communication',
        name: 'communication',
        displayName: 'Communication',
        description: 'Communication and messaging icons',
        library: 'lucide',
        iconCount: 100,
        examples: ['Mail', 'Phone', 'MessageCircle', 'Bell']
      },
      {
        id: 'media',
        name: 'media',
        displayName: 'Media',
        description: 'Media and entertainment icons',
        library: 'lucide',
        iconCount: 80,
        examples: ['Play', 'Pause', 'Video', 'Music']
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
];