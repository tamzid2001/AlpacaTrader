/**
 * Accessibility utility functions for WCAG 2.2 AA compliance
 */

/**
 * Announce message to screen readers
 * @param message - Message to announce
 * @param priority - Priority level (polite, assertive, off)
 */
export const announceToScreenReader = (
  message: string, 
  priority: 'polite' | 'assertive' | 'off' = 'polite'
) => {
  const announcer = document.getElementById('accessibility-announcer');
  if (announcer) {
    announcer.setAttribute('aria-live', priority);
    announcer.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  }
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Check if user is using high contrast mode
 */
export const prefersHighContrast = () => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};

/**
 * Trap focus within an element
 * @param element - Element to trap focus within
 */
export const trapFocus = (element: HTMLElement) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>;
  
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    }
    
    if (e.key === 'Escape') {
      const closeButton = element.querySelector('[data-close]') as HTMLElement;
      if (closeButton) {
        closeButton.click();
      }
    }
  };

  element.addEventListener('keydown', handleKeyDown);
  firstFocusable?.focus();

  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * Generate unique ID for accessibility purposes
 */
export const generateAccessibilityId = (prefix: string = 'a11y') => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check if element is visible to screen readers
 */
export const isVisibleToScreenReader = (element: HTMLElement) => {
  const styles = window.getComputedStyle(element);
  return !(
    element.hasAttribute('aria-hidden') ||
    styles.display === 'none' ||
    styles.visibility === 'hidden' ||
    styles.opacity === '0'
  );
};

/**
 * Keyboard event helpers
 */
export const keyboardEventHelpers = {
  isEnterKey: (e: KeyboardEvent) => e.key === 'Enter',
  isSpaceKey: (e: KeyboardEvent) => e.key === ' ' || e.key === 'Space',
  isEscapeKey: (e: KeyboardEvent) => e.key === 'Escape',
  isArrowKey: (e: KeyboardEvent) => ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key),
  isTabKey: (e: KeyboardEvent) => e.key === 'Tab',
};

/**
 * ARIA helper functions
 */
export const ariaHelpers = {
  setExpanded: (element: HTMLElement, expanded: boolean) => {
    element.setAttribute('aria-expanded', String(expanded));
  },
  
  setSelected: (element: HTMLElement, selected: boolean) => {
    element.setAttribute('aria-selected', String(selected));
  },
  
  setChecked: (element: HTMLElement, checked: boolean) => {
    element.setAttribute('aria-checked', String(checked));
  },
  
  setPressed: (element: HTMLElement, pressed: boolean) => {
    element.setAttribute('aria-pressed', String(pressed));
  },
  
  setLabel: (element: HTMLElement, label: string) => {
    element.setAttribute('aria-label', label);
  },
  
  setLabelledBy: (element: HTMLElement, labelId: string) => {
    element.setAttribute('aria-labelledby', labelId);
  },
  
  setDescribedBy: (element: HTMLElement, descriptionId: string) => {
    element.setAttribute('aria-describedby', descriptionId);
  },
};