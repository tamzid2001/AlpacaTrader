import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useIconSearch, usePopularIcons, useIconCategories } from '@/hooks/use-icons';
import { IconMetadata } from '@/types/icons';
import { iconLibraryConfigs } from '@/lib/icons/icon-manager';
import { Search, Star, Clock, Heart, Grid } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconPickerProps {
  trigger?: React.ReactNode;
  onIconSelect: (icon: IconMetadata) => void;
  selectedIcon?: IconMetadata | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  showFavorites?: boolean;
  showRecents?: boolean;
  libraryFilter?: string[];
  categoryFilter?: string[];
  size?: 'sm' | 'md' | 'lg';
}

export default function IconPicker({
  trigger,
  onIconSelect,
  selectedIcon,
  open,
  onOpenChange,
  title = 'Select Icon',
  description = 'Choose an icon from the library',
  showFavorites = true,
  showRecents = true,
  libraryFilter,
  categoryFilter,
  size = 'md',
}: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLibrary, setSelectedLibrary] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('popular');
  const [recentIcons, setRecentIcons] = useState<IconMetadata[]>([]);
  const [favoriteIcons, setFavoriteIcons] = useState<IconMetadata[]>([]);

  const { categories } = useIconCategories();
  const { popularIcons, loading: popularLoading } = usePopularIcons();
  
  // Build search filters
  const searchFilters = {
    query: searchQuery,
    libraries: libraryFilter || (selectedLibrary === 'all' ? undefined : [selectedLibrary]),
    categories: categoryFilter,
  };

  const { icons: searchResults, loading: searchLoading } = useIconSearch(searchFilters);

  // Determine which icons to show based on active tab
  const getDisplayIcons = useCallback(() => {
    switch (activeTab) {
      case 'search':
        return searchResults;
      case 'recent':
        return recentIcons;
      case 'favorites':
        return favoriteIcons;
      case 'popular':
      default:
        return popularIcons;
    }
  }, [activeTab, searchResults, recentIcons, favoriteIcons, popularIcons]);

  const displayIcons = getDisplayIcons();
  const isLoading = popularLoading || (activeTab === 'search' && searchLoading);

  // Handle icon selection
  const handleIconSelect = useCallback((icon: IconMetadata) => {
    onIconSelect(icon);
    
    // Add to recent icons
    setRecentIcons(prev => {
      const filtered = prev.filter(i => !(i.name === icon.name && i.library === icon.library));
      return [icon, ...filtered].slice(0, 20);
    });

    // Close dialog
    const shouldClose = open !== undefined ? onOpenChange : setIsOpen;
    shouldClose?.(false);
  }, [onIconSelect, open, onOpenChange]);

  // Toggle favorite
  const toggleFavorite = useCallback((icon: IconMetadata, event: React.MouseEvent) => {
    event.stopPropagation();
    
    setFavoriteIcons(prev => {
      const exists = prev.some(i => i.name === icon.name && i.library === icon.library);
      if (exists) {
        return prev.filter(i => !(i.name === icon.name && i.library === icon.library));
      } else {
        return [icon, ...prev];
      }
    });
  }, []);

  const isFavorite = useCallback((icon: IconMetadata) => {
    return favoriteIcons.some(i => i.name === icon.name && i.library === icon.library);
  }, [favoriteIcons]);

  const dialogProps = open !== undefined 
    ? { open, onOpenChange }
    : { open: isOpen, onOpenChange: setIsOpen };

  return (
    <Dialog {...dialogProps}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      
      <DialogContent className={cn(
        "max-w-4xl max-h-[90vh] overflow-hidden flex flex-col",
        size === 'sm' && "max-w-2xl",
        size === 'lg' && "max-w-6xl"
      )}>
        <DialogHeader className="pb-4">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Search and Library Filter */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search icons..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value) {
                    setActiveTab('search');
                  }
                }}
                className="pl-10"
                data-testid="input-icon-picker-search"
              />
            </div>
            
            {!libraryFilter && (
              <div className="w-48">
                <Label htmlFor="library-filter" className="sr-only">Filter by library</Label>
                <select
                  id="library-filter"
                  value={selectedLibrary}
                  onChange={(e) => setSelectedLibrary(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  data-testid="select-icon-picker-library"
                >
                  <option value="all">All Libraries</option>
                  {iconLibraryConfigs.map((config) => (
                    <option key={config.name} value={config.name}>
                      {config.displayName}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="popular" className="text-sm" data-testid="tab-icon-picker-popular">
                <Star className="w-4 h-4 mr-2" />
                Popular
              </TabsTrigger>
              <TabsTrigger value="search" className="text-sm" data-testid="tab-icon-picker-search">
                <Search className="w-4 h-4 mr-2" />
                Search {searchQuery && `(${searchResults.length})`}
              </TabsTrigger>
              {showRecents && (
                <TabsTrigger value="recent" className="text-sm" data-testid="tab-icon-picker-recent">
                  <Clock className="w-4 h-4 mr-2" />
                  Recent
                </TabsTrigger>
              )}
              {showFavorites && (
                <TabsTrigger value="favorites" className="text-sm" data-testid="tab-icon-picker-favorites">
                  <Heart className="w-4 h-4 mr-2" />
                  Favorites
                </TabsTrigger>
              )}
            </TabsList>

            {/* Tab Contents */}
            <div className="flex-1 overflow-hidden mt-4">
              <TabsContent value="popular" className="h-full overflow-hidden">
                <IconGrid
                  icons={popularIcons}
                  loading={popularLoading}
                  selectedIcon={selectedIcon}
                  onIconSelect={handleIconSelect}
                  onToggleFavorite={showFavorites ? toggleFavorite : undefined}
                  isFavorite={isFavorite}
                  emptyMessage="No popular icons available"
                />
              </TabsContent>

              <TabsContent value="search" className="h-full overflow-hidden">
                <IconGrid
                  icons={searchResults}
                  loading={searchLoading}
                  selectedIcon={selectedIcon}
                  onIconSelect={handleIconSelect}
                  onToggleFavorite={showFavorites ? toggleFavorite : undefined}
                  isFavorite={isFavorite}
                  emptyMessage={searchQuery ? "No icons found for your search" : "Enter a search query"}
                />
              </TabsContent>

              {showRecents && (
                <TabsContent value="recent" className="h-full overflow-hidden">
                  <IconGrid
                    icons={recentIcons}
                    loading={false}
                    selectedIcon={selectedIcon}
                    onIconSelect={handleIconSelect}
                    onToggleFavorite={showFavorites ? toggleFavorite : undefined}
                    isFavorite={isFavorite}
                    emptyMessage="No recent icons"
                  />
                </TabsContent>
              )}

              {showFavorites && (
                <TabsContent value="favorites" className="h-full overflow-hidden">
                  <IconGrid
                    icons={favoriteIcons}
                    loading={false}
                    selectedIcon={selectedIcon}
                    onIconSelect={handleIconSelect}
                    onToggleFavorite={toggleFavorite}
                    isFavorite={isFavorite}
                    emptyMessage="No favorite icons"
                  />
                </TabsContent>
              )}
            </div>
          </Tabs>

          {/* Selected Icon Preview */}
          {selectedIcon && (
            <>
              <Separator />
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="w-12 h-12 bg-background rounded flex items-center justify-center">
                  <selectedIcon.component size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{selectedIcon.displayName}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {selectedIcon.library}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {selectedIcon.category}
                    </span>
                  </div>
                </div>
                <Button size="sm" onClick={() => handleIconSelect(selectedIcon)}>
                  Select
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Icon Grid Component
interface IconGridProps {
  icons: IconMetadata[];
  loading: boolean;
  selectedIcon?: IconMetadata | null;
  onIconSelect: (icon: IconMetadata) => void;
  onToggleFavorite?: (icon: IconMetadata, event: React.MouseEvent) => void;
  isFavorite?: (icon: IconMetadata) => boolean;
  emptyMessage: string;
}

function IconGrid({
  icons,
  loading,
  selectedIcon,
  onIconSelect,
  onToggleFavorite,
  isFavorite,
  emptyMessage,
}: IconGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="aspect-square">
            <Skeleton className="w-full h-full rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (icons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Grid className="w-16 h-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] w-full">
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 p-2">
        {icons.map((icon) => (
          <IconPickerCard
            key={`${icon.library}-${icon.name}`}
            icon={icon}
            selected={selectedIcon?.name === icon.name && selectedIcon?.library === icon.library}
            onSelect={() => onIconSelect(icon)}
            onToggleFavorite={onToggleFavorite}
            isFavorite={isFavorite?.(icon) || false}
            showFavorite={Boolean(onToggleFavorite && isFavorite)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

// Icon Picker Card Component
interface IconPickerCardProps {
  icon: IconMetadata;
  selected: boolean;
  onSelect: () => void;
  onToggleFavorite?: (icon: IconMetadata, event: React.MouseEvent) => void;
  isFavorite: boolean;
  showFavorite: boolean;
}

function IconPickerCard({
  icon,
  selected,
  onSelect,
  onToggleFavorite,
  isFavorite,
  showFavorite,
}: IconPickerCardProps) {
  const IconComponent = icon.component;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Card
          className={cn(
            "aspect-square cursor-pointer hover:shadow-md transition-all relative group",
            selected && "ring-2 ring-primary shadow-md"
          )}
          onClick={onSelect}
          data-testid={`card-icon-picker-${icon.name}`}
        >
          <CardContent className="p-2 h-full flex items-center justify-center">
            <IconComponent
              size={20}
              className={cn(
                "transition-colors",
                selected ? "text-primary" : "text-foreground"
              )}
            />
            
            {/* Favorite Button */}
            {showFavorite && onToggleFavorite && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 p-0"
                onClick={(e) => onToggleFavorite(icon, e)}
              >
                <Heart className={cn("w-3 h-3", isFavorite && "fill-current text-red-500")} />
              </Button>
            )}
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent side="top">
        <div className="text-center">
          <p className="font-medium text-xs">{icon.displayName}</p>
          <p className="text-[10px] text-muted-foreground">
            {icon.library}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// Export convenience hook for using IconPicker
export function useIconPicker() {
  const [selectedIcon, setSelectedIcon] = useState<IconMetadata | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openPicker = useCallback(() => setIsOpen(true), []);
  const closePicker = useCallback(() => setIsOpen(false), []);
  
  const handleIconSelect = useCallback((icon: IconMetadata) => {
    setSelectedIcon(icon);
    setIsOpen(false);
  }, []);

  return {
    selectedIcon,
    isOpen,
    openPicker,
    closePicker,
    handleIconSelect,
    IconPickerComponent: (props: Omit<IconPickerProps, 'onIconSelect' | 'selectedIcon' | 'open' | 'onOpenChange'>) => (
      <IconPicker
        {...props}
        selectedIcon={selectedIcon}
        open={isOpen}
        onOpenChange={setIsOpen}
        onIconSelect={handleIconSelect}
      />
    ),
  };
}