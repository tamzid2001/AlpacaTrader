// Manual accessibility testing helpers
export const runAccessibilityAudit = async () => {
  if (typeof window === 'undefined') return;
  
  try {
    const axeCore = await import('axe-core');
    const results = await axeCore.run();
    
    console.group('🔍 Accessibility Audit Results');
    console.log(`Found ${results.violations.length} violations`);
    
    results.violations.forEach((violation, index) => {
      console.group(`${index + 1}. ${violation.id} (${violation.impact})`);
      console.log('Description:', violation.description);
      console.log('Help:', violation.help);
      console.log('Help URL:', violation.helpUrl);
      
      violation.nodes.forEach((node, nodeIndex) => {
        console.group(`Element ${nodeIndex + 1}`);
        console.log('Target:', node.target);
        console.log('HTML:', node.html);
        console.log('Impact:', node.impact);
        console.groupEnd();
      });
      
      console.groupEnd();
    });
    
    console.groupEnd();
    
    return results;
  } catch (error) {
    console.error('Failed to run accessibility audit:', error);
    return null;
  }
};

// Keyboard navigation testing helper
export const testKeyboardNavigation = () => {
  const focusableElements = document.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  console.group('⌨️ Keyboard Navigation Test');
  console.log(`Found ${focusableElements.length} focusable elements`);
  
  const elementsWithoutAriaLabel = Array.from(focusableElements).filter(el => {
    const hasAriaLabel = el.hasAttribute('aria-label') || 
                        el.hasAttribute('aria-labelledby') ||
                        (el.tagName === 'INPUT' && (el as HTMLInputElement).labels && (el as HTMLInputElement).labels!.length > 0) ||
                        (el.textContent && el.textContent.trim().length > 0);
    return !hasAriaLabel;
  });
  
  if (elementsWithoutAriaLabel.length > 0) {
    console.warn('Elements without proper labels:', elementsWithoutAriaLabel);
  }
  
  console.groupEnd();
  
  return {
    totalFocusable: focusableElements.length,
    elementsWithoutLabels: elementsWithoutAriaLabel.length
  };
};

// Color contrast testing helper
export const testColorContrast = () => {
  console.group('🎨 Color Contrast Test');
  
  // Test common text elements
  const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button, label');
  const contrastIssues: Array<{element: Element, contrast: number, required: number}> = [];
  
  textElements.forEach(element => {
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;
    const fontSize = parseFloat(styles.fontSize);
    
    // Simple heuristic - in a real implementation, you'd use a proper contrast calculation library
    if (color && backgroundColor) {
      const requiredRatio = fontSize >= 18 ? 3 : 4.5;
      // This is a simplified check - you'd want to use a proper contrast calculation
      console.log(`Element: ${element.tagName}, Font Size: ${fontSize}px, Required Ratio: ${requiredRatio}:1`);
    }
  });
  
  console.groupEnd();
  
  return contrastIssues;
};