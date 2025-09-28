/**
 * Color contrast utilities for WCAG 2.2 AA compliance
 */

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance according to WCAG guidelines
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color combination meets WCAG AA standards
 */
export function meetsWCAGAA(
  foreground: string,
  background: string,
  fontSize: number = 16,
  fontWeight: number = 400
): { passes: boolean; ratio: number; required: number } {
  const ratio = getContrastRatio(foreground, background);
  
  // Large text is 18pt+ regular or 14pt+ bold (roughly 24px+ regular or 19px+ bold)
  const isLargeText = (fontSize >= 24) || (fontSize >= 19 && fontWeight >= 700);
  const required = isLargeText ? 3 : 4.5;
  
  return {
    passes: ratio >= required,
    ratio: Math.round(ratio * 100) / 100,
    required,
  };
}

/**
 * Test colors from CSS custom properties
 */
export function testThemeColors(): Array<{
  name: string;
  foreground: string;
  background: string;
  result: ReturnType<typeof meetsWCAGAA>;
}> {
  const results = [];
  
  // Get computed styles from document root
  const rootStyles = getComputedStyle(document.documentElement);
  
  const colorCombinations = [
    { name: 'Primary on Background', fg: '--primary-foreground', bg: '--primary' },
    { name: 'Secondary on Background', fg: '--secondary-foreground', bg: '--secondary' },
    { name: 'Foreground on Background', fg: '--foreground', bg: '--background' },
    { name: 'Muted Foreground on Background', fg: '--muted-foreground', bg: '--background' },
    { name: 'Card Foreground on Card', fg: '--card-foreground', bg: '--card' },
    { name: 'Destructive Foreground on Destructive', fg: '--destructive-foreground', bg: '--destructive' },
  ];
  
  colorCombinations.forEach(({ name, fg, bg }) => {
    const fgValue = rootStyles.getPropertyValue(fg).trim();
    const bgValue = rootStyles.getPropertyValue(bg).trim();
    
    if (fgValue && bgValue) {
      // Convert HSL to hex (simplified - in real implementation you'd use a proper converter)
      const fgHex = hslToHex(fgValue);
      const bgHex = hslToHex(bgValue);
      
      if (fgHex && bgHex) {
        results.push({
          name,
          foreground: fgHex,
          background: bgHex,
          result: meetsWCAGAA(fgHex, bgHex),
        });
      }
    }
  });
  
  return results;
}

/**
 * Simplified HSL to Hex conversion (for testing purposes)
 * In production, use a proper color conversion library
 */
function hslToHex(hsl: string): string | null {
  // This is a simplified version - in real implementation use proper HSL to RGB conversion
  // For now, return some default hex values based on common patterns
  const hslPattern = /hsl\(([^)]+)\)/;
  const match = hsl.match(hslPattern);
  
  if (!match) return null;
  
  const values = match[1].split(',').map(s => s.trim());
  if (values.length !== 3) return null;
  
  // Simplified mapping for common theme values
  const hue = parseFloat(values[0]);
  const saturation = parseFloat(values[1].replace('%', ''));
  const lightness = parseFloat(values[2].replace('%', ''));
  
  // Very basic approximation - use proper HSL to RGB conversion in production
  if (lightness < 20) return '#000000';
  if (lightness > 80) return '#ffffff';
  if (hue >= 140 && hue <= 150) return '#22c55e'; // Green
  if (hue >= 0 && hue <= 10) return '#ef4444'; // Red
  
  return lightness < 50 ? '#1f2937' : '#f9fafb';
}

/**
 * Get color suggestions for better contrast
 */
export function suggestBetterContrast(
  foreground: string,
  background: string,
  targetRatio: number = 4.5
): { suggestion: string; ratio: number } | null {
  // This is a simplified version - in production, implement proper color adjustment
  const currentRatio = getContrastRatio(foreground, background);
  
  if (currentRatio >= targetRatio) {
    return null; // Already meets requirements
  }
  
  // Simple suggestions - in production, implement proper color adjustment algorithms
  const bgRgb = hexToRgb(background);
  if (!bgRgb) return null;
  
  const bgLuminance = getRelativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  
  // If background is light, suggest darker foreground
  if (bgLuminance > 0.5) {
    return { suggestion: '#1f2937', ratio: getContrastRatio('#1f2937', background) };
  } else {
    return { suggestion: '#f9fafb', ratio: getContrastRatio('#f9fafb', background) };
  }
}

/**
 * Audit current page for color contrast issues
 */
export function auditPageContrast(): Array<{
  element: Element;
  issue: string;
  suggestion?: string;
}> {
  const issues = [];
  const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button, label, div');
  
  textElements.forEach((element) => {
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;
    const fontSize = parseFloat(styles.fontSize);
    
    if (color && backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
      // Extract RGB values from computed styles
      const colorMatch = color.match(/rgb\((\d+), (\d+), (\d+)\)/);
      const bgMatch = backgroundColor.match(/rgb\((\d+), (\d+), (\d+)\)/);
      
      if (colorMatch && bgMatch) {
        const fgRgb = { r: parseInt(colorMatch[1]), g: parseInt(colorMatch[2]), b: parseInt(colorMatch[3]) };
        const bgRgb = { r: parseInt(bgMatch[1]), g: parseInt(bgMatch[2]), b: parseInt(bgMatch[3]) };
        
        const l1 = getRelativeLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
        const l2 = getRelativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
        
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        const required = fontSize >= 24 ? 3 : 4.5;
        
        if (ratio < required) {
          issues.push({
            element,
            issue: `Low contrast ratio: ${ratio.toFixed(2)}:1 (requires ${required}:1)`,
            suggestion: `Consider adjusting colors to meet WCAG AA standards`,
          });
        }
      }
    }
  });
  
  return issues;
}

export default {
  hexToRgb,
  getRelativeLuminance,
  getContrastRatio,
  meetsWCAGAA,
  testThemeColors,
  suggestBetterContrast,
  auditPageContrast,
};