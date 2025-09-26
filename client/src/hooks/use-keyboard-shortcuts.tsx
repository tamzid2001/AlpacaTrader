import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
  disabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const [, setLocation] = useLocation();
  const shortcutsRef = useRef(shortcuts);
  
  // Update shortcuts ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in form elements
      const activeElement = document.activeElement;
      const isFormElement = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT' ||
        activeElement.isContentEditable
      );

      if (isFormElement) return;

      const matchedShortcut = shortcutsRef.current.find(shortcut => {
        if (shortcut.disabled) return false;
        
        return (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          !!event.ctrlKey === !!shortcut.ctrlKey &&
          !!event.altKey === !!shortcut.altKey &&
          !!event.shiftKey === !!shortcut.shiftKey
        );
      });

      if (matchedShortcut) {
        event.preventDefault();
        matchedShortcut.action();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);

  // Common application shortcuts
  const commonShortcuts: KeyboardShortcut[] = [
    {
      key: 'h',
      altKey: true,
      action: () => setLocation('/'),
      description: 'Go to home page',
    },
    {
      key: 'd',
      altKey: true,
      action: () => setLocation('/dashboard'),
      description: 'Go to dashboard',
    },
    {
      key: 'a',
      altKey: true,
      action: () => setLocation('/anomaly-detection'),
      description: 'Go to anomaly detection',
    },
    {
      key: '?',
      shiftKey: true,
      action: () => {
        // Show keyboard shortcuts help
        const helpText = shortcutsRef.current
          .filter(s => !s.disabled)
          .map(s => {
            const modifiers = [];
            if (s.ctrlKey) modifiers.push('Ctrl');
            if (s.altKey) modifiers.push('Alt');
            if (s.shiftKey) modifiers.push('Shift');
            return `${modifiers.join(' + ')} + ${s.key.toUpperCase()}: ${s.description}`;
          })
          .join('\n');
        
        alert(`Keyboard Shortcuts:\n\n${helpText}`);
      },
      description: 'Show keyboard shortcuts help',
    },
  ];

  return {
    shortcuts: [...commonShortcuts, ...shortcuts],
    commonShortcuts,
  };
}

// Hook for managing focus and keyboard navigation
export function useFocusManagement() {
  const focusTrap = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
      
      if (e.key === 'Escape') {
        // Find and trigger close button
        const closeButton = container.querySelector('[data-close]') as HTMLElement;
        if (closeButton) {
          closeButton.click();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  };

  const restoreFocus = (element: HTMLElement | null) => {
    if (element && typeof element.focus === 'function') {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        element.focus();
      }, 0);
    }
  };

  return {
    focusTrap,
    restoreFocus,
  };
}

export default useKeyboardShortcuts;