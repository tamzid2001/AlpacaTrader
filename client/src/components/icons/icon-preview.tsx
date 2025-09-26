import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { IconMetadata, IconCustomization } from '@/types/icons';
import { Heart, Download, Copy, Share } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface IconPreviewProps {
  icon: IconMetadata;
  customization: IconCustomization;
  onCustomizationChange: (customization: Partial<IconCustomization>) => void;
  onToggleFavorite: (icon: IconMetadata) => void;
  onExport: (icon: IconMetadata, format: string) => void;
  isFavorite: boolean;
}

export default function IconPreview({
  icon,
  customization,
  onCustomizationChange,
  onToggleFavorite,
  onExport,
  isFavorite,
}: IconPreviewProps) {
  const { toast } = useToast();
  const [exportFormat, setExportFormat] = useState<string>('svg');

  const IconComponent = icon.component;

  // Predefined color palette
  const colorPalette = [
    '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', 
    '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
    '#6b7280', '#1f2937', '#374151', '#4b5563', '#9ca3af',
  ];

  // Predefined size options
  const sizeOptions = [
    { label: 'XS', value: 12 },
    { label: 'SM', value: 16 },
    { label: 'MD', value: 24 },
    { label: 'LG', value: 32 },
    { label: 'XL', value: 48 },
    { label: '2XL', value: 64 },
  ];

  const handleCopyCode = async () => {
    try {
      const importPath = getImportPath(icon.library);
      const code = `import { ${icon.name} } from '${importPath}';

// Usage
<${icon.name} 
  size={${customization.size}} 
  color="${customization.color}"
  ${customization.strokeWidth ? `strokeWidth={${customization.strokeWidth}}` : ''}
  ${customization.fill && customization.fill !== customization.color ? `fill="${customization.fill}"` : ''}
  ${customization.opacity && customization.opacity !== 1 ? `opacity={${customization.opacity}}` : ''}
/>`;

      await navigator.clipboard.writeText(code);
      toast({
        title: "Code copied!",
        description: "The React component code has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy code to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: `${icon.displayName} Icon`,
        text: `Check out this ${icon.displayName} icon from ${icon.library}`,
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "Icon link has been copied to your clipboard.",
        });
      }
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Failed to share icon.",
        variant: "destructive",
      });
    }
  };

  const getImportPath = (library: string): string => {
    switch (library) {
      case 'lucide':
        return 'lucide-react';
      case 'fa6':
        return 'react-icons/fa6';
      case 'md':
        return 'react-icons/md';
      case 'ai':
        return 'react-icons/ai';
      case 'bi':
        return 'react-icons/bi';
      case 'hi2':
        return 'react-icons/hi2';
      case 'io5':
        return 'react-icons/io5';
      case 'si':
        return 'react-icons/si';
      default:
        return `react-icons/${library}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Icon Preview */}
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <div 
              className="mx-auto mb-6 flex items-center justify-center rounded-lg bg-muted/30"
              style={{ 
                width: Math.max(customization.size + 40, 120), 
                height: Math.max(customization.size + 40, 120) 
              }}
            >
              <IconComponent
                size={customization.size}
                color={customization.color}
                strokeWidth={customization.strokeWidth}
                fill={customization.fill}
                opacity={customization.opacity}
                style={{
                  transition: 'all 0.2s ease-in-out',
                }}
              />
            </div>
            <h3 className="text-2xl font-bold mb-2">{icon.displayName}</h3>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge variant="secondary">{icon.library}</Badge>
              <Badge variant="outline">{icon.category}</Badge>
            </div>
            <p className="text-muted-foreground mb-6">
              {icon.keywords.slice(0, 3).join(', ')}
            </p>
            
            {/* Action buttons */}
            <div className="flex items-center justify-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isFavorite ? "default" : "outline"}
                    size="sm"
                    onClick={() => onToggleFavorite(icon)}
                    data-testid="button-toggle-favorite"
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                    data-testid="button-copy-code"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy React code</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    data-testid="button-share"
                  >
                    <Share className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share icon</TooltipContent>
              </Tooltip>

              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="svg">SVG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="component">React</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() => onExport(icon, exportFormat)}
                data-testid="button-export"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customization Panel */}
      <Card>
        <CardContent className="p-6">
          <h4 className="text-lg font-semibold mb-4">Customization</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Size Control */}
            <div className="space-y-3">
              <Label>Size: {customization.size}px</Label>
              <div className="flex items-center gap-2 mb-2">
                {sizeOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={customization.size === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => onCustomizationChange({ size: option.value })}
                    data-testid={`button-size-${option.label.toLowerCase()}`}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              <Slider
                value={[customization.size]}
                onValueChange={([size]) => onCustomizationChange({ size })}
                min={12}
                max={128}
                step={2}
                className="w-full"
                data-testid="slider-size"
              />
            </div>

            {/* Color Control */}
            <div className="space-y-3">
              <Label>Color</Label>
              <div className="flex items-center gap-2 mb-2">
                <Input
                  type="color"
                  value={customization.color}
                  onChange={(e) => onCustomizationChange({ color: e.target.value })}
                  className="w-12 h-8 rounded border cursor-pointer"
                  data-testid="input-color"
                />
                <Input
                  type="text"
                  value={customization.color}
                  onChange={(e) => onCustomizationChange({ color: e.target.value })}
                  placeholder="#000000"
                  className="flex-1"
                  data-testid="input-color-text"
                />
              </div>
              <div className="grid grid-cols-5 gap-2">
                {colorPalette.map((color) => (
                  <button
                    key={color}
                    onClick={() => onCustomizationChange({ color })}
                    className="w-8 h-8 rounded border-2 border-border hover:border-primary transition-colors"
                    style={{ backgroundColor: color }}
                    data-testid={`button-color-${color.replace('#', '')}`}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>

            {/* Stroke Width (for outline icons) */}
            {icon.library === 'lucide' || icon.library === 'hi2' && (
              <div className="space-y-3">
                <Label>Stroke Width: {customization.strokeWidth || 2}</Label>
                <Slider
                  value={[customization.strokeWidth || 2]}
                  onValueChange={([strokeWidth]) => onCustomizationChange({ strokeWidth })}
                  min={0.5}
                  max={4}
                  step={0.5}
                  className="w-full"
                  data-testid="slider-stroke-width"
                />
              </div>
            )}

            {/* Opacity Control */}
            <div className="space-y-3">
              <Label>Opacity: {Math.round((customization.opacity || 1) * 100)}%</Label>
              <Slider
                value={[(customization.opacity || 1) * 100]}
                onValueChange={([opacity]) => onCustomizationChange({ opacity: opacity / 100 })}
                min={10}
                max={100}
                step={10}
                className="w-full"
                data-testid="slider-opacity"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Preview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">React Code</h4>
            <Button variant="outline" size="sm" onClick={handleCopyCode}>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>
          <div className="bg-muted rounded-lg p-4 text-sm font-mono overflow-x-auto">
            <div className="text-muted-foreground mb-2">
              import &#123; {icon.name} &#125; from '{getImportPath(icon.library)}';
            </div>
            <div className="text-foreground">
              &lt;{icon.name}<br />
              &nbsp;&nbsp;size=&#123;{customization.size}&#125;<br />
              &nbsp;&nbsp;color="{customization.color}"
              {customization.strokeWidth && (
                <>
                  <br />&nbsp;&nbsp;strokeWidth=&#123;{customization.strokeWidth}&#125;
                </>
              )}
              {customization.fill && customization.fill !== customization.color && (
                <>
                  <br />&nbsp;&nbsp;fill="{customization.fill}"
                </>
              )}
              {customization.opacity && customization.opacity !== 1 && (
                <>
                  <br />&nbsp;&nbsp;opacity=&#123;{customization.opacity}&#125;
                </>
              )}
              <br />/&gt;
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}