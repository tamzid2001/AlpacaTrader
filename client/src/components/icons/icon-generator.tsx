import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import IconPreview from './icon-preview';
import { useIconPicker, useIconSearch, useIconCategories, usePopularIcons } from '@/hooks/use-icons';
import { iconLibraryConfigs } from '@/lib/icons/icon-manager';
import { IconMetadata, IconSearchFilters } from '@/types/icons';
import { Search, Filter, Grid, List, Star, Clock, Heart, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function IconGenerator() {
  const {
    state,
    setSearchQuery,
    setFilters,
    setCustomization,
    selectIcon,
    toggleFavorite,
    isFavorite,
  } = useIconPicker();

  const { categories } = useIconCategories();
  const { popularIcons, loading: popularLoading } = usePopularIcons();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedLibrary, setSelectedLibrary] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Build search filters from current state
  const searchFilters: IconSearchFilters = useMemo(() => ({
    query: state.searchQuery,
    libraries: selectedLibrary === 'all' ? undefined : [selectedLibrary],
    categories: selectedCategory === 'all' ? undefined : [selectedCategory],
    ...state.filters,
  }), [state.searchQuery, state.filters, selectedLibrary, selectedCategory]);

  const { icons: searchResults, loading: searchLoading, error: searchError } = useIconSearch(searchFilters);

  // Determine which icons to display
  const displayIcons = useMemo(() => {
    if (state.searchQuery || selectedLibrary !== 'all' || selectedCategory !== 'all') {
      return searchResults;
    }
    return popularIcons;
  }, [state.searchQuery, selectedLibrary, selectedCategory, searchResults, popularIcons]);

  const handleIconSelect = (icon: IconMetadata) => {
    selectIcon(icon);
  };

  const handleExport = async (icon: IconMetadata, format: string) => {
    // TODO: Implement export functionality
    console.log('Exporting icon:', icon.name, 'in format:', format);
  };

  const isLoading = popularLoading || searchLoading;
  const hasQuery = Boolean(state.searchQuery || selectedLibrary !== 'all' || selectedCategory !== 'all');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="title-icon-generator">
            Icon Generator & Manager
          </h1>
          <p className="text-xl text-muted-foreground" data-testid="text-icon-generator-description">
            Browse, customize, and export icons from multiple icon libraries
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Search & Filters */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Search & Filter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search Input */}
                <div className="space-y-2">
                  <Label htmlFor="search-input">Search Icons</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="search-input"
                      type="text"
                      placeholder="Search icons..."
                      value={state.searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-icon-search"
                    />
                  </div>
                </div>

                {/* Library Filter */}
                <div className="space-y-2">
                  <Label htmlFor="library-select">Icon Library</Label>
                  <Select value={selectedLibrary} onValueChange={setSelectedLibrary}>
                    <SelectTrigger id="library-select" data-testid="select-library">
                      <SelectValue placeholder="All Libraries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Libraries</SelectItem>
                      {iconLibraryConfigs.map((config) => (
                        <SelectItem key={config.name} value={config.name}>
                          {config.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                  <Label htmlFor="category-select">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger id="category-select" data-testid="select-category">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Advanced Filters Toggle */}
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full justify-between"
                  data-testid="button-toggle-filters"
                >
                  <Filter className="w-4 h-4" />
                  Advanced Filters
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    {Object.keys(state.filters).length}
                  </span>
                </Button>

                {/* Advanced Filters Panel */}
                {showFilters && (
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                    {/* Size Range */}
                    <div className="space-y-2">
                      <Label>Size Range</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={state.filters.minSize || ''}
                          onChange={(e) => setFilters({
                            ...state.filters,
                            minSize: e.target.value ? parseInt(e.target.value) : undefined
                          })}
                          data-testid="input-min-size"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={state.filters.maxSize || ''}
                          onChange={(e) => setFilters({
                            ...state.filters,
                            maxSize: e.target.value ? parseInt(e.target.value) : undefined
                          })}
                          data-testid="input-max-size"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Quick Access Tabs */}
                <Tabs defaultValue="popular" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="popular" className="text-xs" data-testid="tab-popular">
                      <Zap className="w-3 h-3 mr-1" />
                      Popular
                    </TabsTrigger>
                    <TabsTrigger value="recent" className="text-xs" data-testid="tab-recent">
                      <Clock className="w-3 h-3 mr-1" />
                      Recent
                    </TabsTrigger>
                    <TabsTrigger value="favorites" className="text-xs" data-testid="tab-favorites">
                      <Heart className="w-3 h-3 mr-1" />
                      Favorites
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="popular" className="mt-4">
                    <div className="text-sm text-muted-foreground">
                      {popularIcons.length} popular icons
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="recent" className="mt-4">
                    <div className="space-y-2">
                      {state.recentIcons.slice(0, 5).map((icon) => (
                        <div key={`${icon.library}-${icon.iconName}`} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="text-xs">
                            {icon.library}
                          </Badge>
                          <span className="truncate">{icon.iconName}</span>
                        </div>
                      ))}
                      {state.recentIcons.length === 0 && (
                        <p className="text-xs text-muted-foreground">No recent icons</p>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="favorites" className="mt-4">
                    <div className="space-y-2">
                      {state.favoriteIcons.slice(0, 5).map((icon) => (
                        <div key={`${icon.library}-${icon.iconName}`} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="text-xs">
                            {icon.library}
                          </Badge>
                          <span className="truncate">{icon.iconName}</span>
                        </div>
                      ))}
                      {state.favoriteIcons.length === 0 && (
                        <p className="text-xs text-muted-foreground">No favorite icons</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Grid className="w-5 h-5" />
                    {hasQuery ? 'Search Results' : 'Popular Icons'}
                    {displayIcons.length > 0 && (
                      <Badge variant="secondary">{displayIcons.length}</Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      data-testid="button-grid-view"
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      data-testid="button-list-view"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Error State */}
                {searchError && (
                  <Alert>
                    <AlertDescription>
                      {searchError}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Loading State */}
                {isLoading && (
                  <div className={cn(
                    "grid gap-4",
                    viewMode === 'grid' ? "grid-cols-2 sm:grid-cols-4 md:grid-cols-6" : "grid-cols-1"
                  )}>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 p-4">
                        <Skeleton className="w-12 h-12 rounded" />
                        <Skeleton className="w-16 h-4" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Icons Grid/List */}
                {!isLoading && displayIcons.length > 0 && (
                  <ScrollArea className="h-[600px] w-full">
                    <div className={cn(
                      "grid gap-4 pb-4",
                      viewMode === 'grid' 
                        ? "grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8" 
                        : "grid-cols-1"
                    )}>
                      {displayIcons.map((icon) => (
                        <IconCard
                          key={`${icon.library}-${icon.name}`}
                          icon={icon}
                          viewMode={viewMode}
                          onSelect={() => handleIconSelect(icon)}
                          onToggleFavorite={() => toggleFavorite(icon)}
                          isFavorite={isFavorite(icon)}
                          customization={state.customization}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {/* Empty State */}
                {!isLoading && displayIcons.length === 0 && hasQuery && (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No icons found</h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your search query or filters
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedLibrary('all');
                        setSelectedCategory('all');
                      }}
                      data-testid="button-clear-filters"
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Icon Preview Panel */}
          <div className="lg:col-span-1">
            {state.selectedIcon ? (
              <IconPreview
                icon={state.selectedIcon}
                customization={state.customization}
                onCustomizationChange={setCustomization}
                onToggleFavorite={toggleFavorite}
                onExport={handleExport}
                isFavorite={isFavorite(state.selectedIcon)}
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">Select an Icon</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose an icon from the collection to see customization options and export features.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Icon Card Component
interface IconCardProps {
  icon: IconMetadata;
  viewMode: 'grid' | 'list';
  onSelect: () => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
  customization: { size: number; color: string };
}

function IconCard({ icon, viewMode, onSelect, onToggleFavorite, isFavorite, customization }: IconCardProps) {
  const IconComponent = icon.component;

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-all cursor-pointer" onClick={onSelect}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-muted/30 rounded flex items-center justify-center">
              <IconComponent
                size={24}
                color={customization.color}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{icon.displayName}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {icon.library}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {icon.category}
                </span>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite();
                  }}
                >
                  <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Card 
          className="hover:shadow-md transition-all cursor-pointer relative group"
          onClick={onSelect}
          data-testid={`card-icon-${icon.name}`}
        >
          <CardContent className="p-3">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-muted/30 rounded flex items-center justify-center">
                <IconComponent
                  size={Math.min(customization.size, 24)}
                  color={customization.color}
                />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium truncate w-full">
                  {icon.displayName}
                </p>
                <Badge variant="outline" className="text-[10px] mt-1">
                  {icon.library}
                </Badge>
              </div>
            </div>
            
            {/* Favorite Button - Appears on Hover */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
            >
              <Heart className={cn("w-3 h-3", isFavorite && "fill-current")} />
            </Button>
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent side="top">
        <div className="text-center">
          <p className="font-medium">{icon.displayName}</p>
          <p className="text-xs text-muted-foreground">
            {icon.library} • {icon.category}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}