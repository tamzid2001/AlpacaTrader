import { useEffect } from 'react';

// Development-only accessibility testing with axe-core
export function AccessibilityTesting() {
  useEffect(() => {
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      // Import axe-core React integration properly
      import('@axe-core/react').then(({ default: axe }) => {
        // Import React and ReactDOM properly with proper default export handling
        Promise.all([
          import('react'),
          import('react-dom')
        ]).then(([ReactModule, ReactDOMModule]) => {
          // Extract default exports properly - React exports React as default
          // ReactDOM exports as default in newer versions
          const React = ReactModule.default || ReactModule;
          const ReactDOM = ReactDOMModule.default || ReactDOMModule;
          
          // Ensure we have the actual React and ReactDOM objects
          if (React && ReactDOM && typeof axe === 'function') {
            // axe-core expects React and ReactDOM as arguments
            axe(React, ReactDOM, 1000);
            console.log('Axe-core accessibility testing initialized');
          } else {
            console.warn('Failed to initialize axe-core: Missing React or ReactDOM');
          }
        }).catch((error) => {
          console.warn('Failed to load React modules for axe-core:', error);
        });
      }).catch((error) => {
        console.warn('Failed to load axe-core for accessibility testing:', error);
      });
    }
  }, []);

  return null;
}

export default AccessibilityTesting;