import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import sharp from 'sharp';

// Generation parameters interface
interface IconGenerationOptions {
  size?: number;
  color?: string;
  backgroundColor?: string;
  padding?: number;
}

interface IconGenerationParams {
  iconName: string;
  library: string;
  size: number;
  color: string;
  backgroundColor?: string;
  padding: number;
  format: 'svg' | 'png';
}

/**
 * Generate real icon SVG using react-dom/server
 */
export async function generateIconSVG(params: IconGenerationParams): Promise<string> {
  const { iconName, library, size, color, backgroundColor, padding } = params;
  
  try {
    // Get the React icon component
    const IconComponent = await getIconComponent(iconName, library);
    
    if (!IconComponent) {
      throw new Error(`Icon "${iconName}" not found in library "${library}"`);
    }

    // Create the React element with props
    const iconElement = createElement(IconComponent, {
      size: size,
      color: color,
      width: size,
      height: size,
      style: { 
        width: size, 
        height: size,
        color: color,
        fill: 'currentColor',
      },
    });

    // Render the React component to HTML string
    const renderedHtml = renderToString(iconElement);
    
    // Extract the SVG content from the rendered HTML
    let svgContent = renderedHtml;
    
    // Clean up the SVG and ensure proper attributes
    svgContent = cleanAndEnhanceSVG(svgContent, { size, color, backgroundColor, padding });
    
    return svgContent;
    
  } catch (error) {
    console.error(`Error generating SVG for ${iconName} from ${library}:`, error);
    
    // Return a fallback SVG instead of throwing
    return generateFallbackSVG(iconName, { size, color, backgroundColor, padding });
  }
}

/**
 * Generate real icon PNG using Sharp library
 */
export async function generateIconPNG(params: IconGenerationParams): Promise<Buffer> {
  const { iconName, library, size } = params;
  
  try {
    // First generate the SVG
    const svgString = await generateIconSVG(params);
    
    // Convert SVG to PNG using Sharp
    const pngBuffer = await sharp(Buffer.from(svgString))
      .png({
        quality: 100,
        progressive: true,
      })
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
      })
      .toBuffer();
    
    return pngBuffer;
    
  } catch (error) {
    console.error(`Error generating PNG for ${iconName} from ${library}:`, error);
    
    // Return a fallback PNG
    return generateFallbackPNG(iconName, size);
  }
}

/**
 * Get icon component from the specified library
 */
async function getIconComponent(iconName: string, library: string): Promise<any> {
  try {
    let iconModule: any;
    
    // Dynamic import based on library
    switch (library) {
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
        throw new Error(`Unknown icon library: ${library}`);
    }

    // Get the specific icon component
    const IconComponent = iconModule[iconName];
    
    if (!IconComponent) {
      // Try common variations for some libraries
      const variations = getIconNameVariations(iconName, library);
      for (const variation of variations) {
        if (iconModule[variation]) {
          return iconModule[variation];
        }
      }
      throw new Error(`Icon "${iconName}" not found in ${library} library`);
    }
    
    return IconComponent;
    
  } catch (error) {
    console.error(`Error loading icon component ${iconName} from ${library}:`, error);
    throw error;
  }
}

/**
 * Get possible variations of icon names for different libraries
 */
function getIconNameVariations(iconName: string, library: string): string[] {
  const variations: string[] = [];
  
  // Add the original name
  variations.push(iconName);
  
  // Library-specific variations
  switch (library) {
    case 'fa6':
      if (!iconName.startsWith('Fa')) {
        variations.push(`Fa${iconName}`);
        variations.push(`Far${iconName}`);
        variations.push(`Fas${iconName}`);
      }
      break;
      
    case 'md':
      if (!iconName.startsWith('Md')) {
        variations.push(`Md${iconName}`);
      }
      break;
      
    case 'si':
      if (!iconName.startsWith('Si')) {
        variations.push(`Si${iconName}`);
      }
      break;
      
    case 'hi2':
      if (!iconName.startsWith('Hi')) {
        variations.push(`Hi${iconName}`);
        variations.push(`HiOutline${iconName}`);
        variations.push(`HiSolid${iconName}`);
      }
      break;
      
    case 'bi':
      if (!iconName.startsWith('Bi')) {
        variations.push(`Bi${iconName}`);
      }
      break;
      
    case 'io5':
      if (!iconName.startsWith('Io')) {
        variations.push(`Io${iconName}`);
        variations.push(`Io${iconName}Outline`);
        variations.push(`Io${iconName}Sharp`);
      }
      break;
  }
  
  return variations;
}

/**
 * Clean and enhance SVG content
 */
function cleanAndEnhanceSVG(
  svgContent: string, 
  options: { size: number; color: string; backgroundColor?: string; padding: number }
): string {
  const { size, color, backgroundColor, padding } = options;
  
  // Calculate dimensions with padding
  const totalSize = size + (padding * 2);
  const iconOffset = padding;
  
  // Extract the SVG content and clean it up
  let cleanSvg = svgContent;
  
  // Ensure the SVG has proper XML declaration and namespace
  if (!cleanSvg.includes('<?xml')) {
    cleanSvg = `<?xml version="1.0" encoding="UTF-8"?>\n${cleanSvg}`;
  }
  
  // Add namespace if missing
  if (!cleanSvg.includes('xmlns=')) {
    cleanSvg = cleanSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  
  // Update SVG attributes
  cleanSvg = cleanSvg.replace(
    /<svg[^>]*>/,
    `<svg width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}" xmlns="http://www.w3.org/2000/svg">`
  );
  
  // Add background if specified
  let backgroundRect = '';
  if (backgroundColor) {
    backgroundRect = `<rect width="${totalSize}" height="${totalSize}" fill="${backgroundColor}"/>`;
  }
  
  // Wrap the icon content in a group with translation for padding
  const svgBodyMatch = cleanSvg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
  if (svgBodyMatch) {
    const iconContent = svgBodyMatch[1];
    cleanSvg = cleanSvg.replace(
      /<svg[^>]*>[\s\S]*?<\/svg>/,
      `<svg width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}" xmlns="http://www.w3.org/2000/svg">
        ${backgroundRect}
        <g transform="translate(${iconOffset}, ${iconOffset})" fill="${color}" color="${color}">
          ${iconContent}
        </g>
      </svg>`
    );
  }
  
  return cleanSvg;
}

/**
 * Generate fallback SVG when the real icon cannot be loaded
 */
function generateFallbackSVG(
  iconName: string, 
  options: { size: number; color: string; backgroundColor?: string; padding: number }
): string {
  const { size, color, backgroundColor, padding } = options;
  
  const totalSize = size + (padding * 2);
  const iconOffset = padding;
  const fontSize = Math.max(8, size / 3);
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}" xmlns="http://www.w3.org/2000/svg">
  ${backgroundColor ? `<rect width="${totalSize}" height="${totalSize}" fill="${backgroundColor}"/>` : ''}
  <g transform="translate(${iconOffset}, ${iconOffset})">
    <rect width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="2" rx="4"/>
    <text x="${size / 2}" y="${size / 2 + fontSize / 3}" text-anchor="middle" fill="${color}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold">
      ${iconName.charAt(0).toUpperCase()}
    </text>
    <text x="${size / 2}" y="${size - 8}" text-anchor="middle" fill="${color}" font-family="Arial, sans-serif" font-size="6" opacity="0.7">
      ${iconName.slice(0, 4)}...
    </text>
  </g>
</svg>`;
}

/**
 * Generate fallback PNG when the real icon cannot be loaded
 */
async function generateFallbackPNG(iconName: string, size: number): Promise<Buffer> {
  try {
    const fallbackSvg = generateFallbackSVG(iconName, { 
      size, 
      color: '#666666', 
      padding: 0 
    });
    
    const pngBuffer = await sharp(Buffer.from(fallbackSvg))
      .png()
      .resize(size, size)
      .toBuffer();
    
    return pngBuffer;
  } catch (error) {
    console.error('Error generating fallback PNG:', error);
    
    // Return minimal 1x1 transparent PNG as last resort
    return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
  }
}

/**
 * Validate icon exists in the specified library
 */
export async function validateIconExists(iconName: string, library: string): Promise<boolean> {
  try {
    const IconComponent = await getIconComponent(iconName, library);
    return !!IconComponent;
  } catch (error) {
    return false;
  }
}

/**
 * Get available icon formats for a library
 */
export function getSupportedFormats(): string[] {
  return ['svg', 'png'];
}

/**
 * Get default size for a library
 */
export function getDefaultSize(library: string): number {
  const defaultSizes: Record<string, number> = {
    lucide: 24,
    fa6: 16,
    md: 24,
    si: 24,
    hi2: 24,
    bi: 16,
    io5: 24,
  };
  
  return defaultSizes[library] || 24;
}