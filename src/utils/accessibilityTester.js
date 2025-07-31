/**
 * Accessibility Testing Utilities
 * Tools for automated and manual accessibility testing
 */

import logger from './logger.js';

export class AccessibilityTester {
  constructor() {
    this.violations = [];
    this.warnings = [];
    this.passes = [];
  }

  /**
   * Run comprehensive accessibility audit
   */
  async runAudit(container = document) {
    this.violations = [];
    this.warnings = [];
    this.passes = [];

    const tests = [
      { name: 'Keyboard Navigation', test: () => this.testKeyboardNavigation(container) },
      { name: 'Focus Management', test: () => this.testFocusManagement(container) },
      { name: 'ARIA Implementation', test: () => this.testARIA(container) },
      { name: 'Color Contrast', test: () => this.testColorContrast(container) },
      { name: 'Form Accessibility', test: () => this.testFormAccessibility(container) },
      { name: 'Image Accessibility', test: () => this.testImageAccessibility(container) },
      { name: 'Heading Structure', test: () => this.testHeadingStructure(container) },
      { name: 'Touch Targets', test: () => this.testTouchTargets(container) },
      { name: 'Motion Preferences', test: () => this.testMotionPreferences(container) }
    ];

    for (const { name, test } of tests) {
      try {
        logger.debug(`Running accessibility test: ${name}`);
        await test();
        this.passes.push(name);
      } catch (error) {
        logger.error(`Accessibility test failed: ${name}`, error);
        this.violations.push({ test: name, error: error.message });
      }
    }

    return this.generateReport();
  }

  /**
   * Test keyboard navigation
   */
  testKeyboardNavigation(container) {
    const focusableElements = this.getFocusableElements(container);
    
    if (focusableElements.length === 0) {
      this.warnings.push('No focusable elements found');
      return;
    }

    // Check if all interactive elements are keyboard accessible
    const interactiveElements = container.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [role="link"], [tabindex]'
    );

    interactiveElements.forEach(element => {
      if (!this.isKeyboardAccessible(element)) {
        throw new Error(`Element not keyboard accessible: ${this.getElementSelector(element)}`);
      }
    });

    // Check tab order
    const tabOrder = this.getTabOrder(focusableElements);
    if (!this.isLogicalTabOrder(tabOrder)) {
      this.warnings.push('Tab order may not be logical');
    }

    // Check for keyboard traps
    if (this.hasKeyboardTraps(container)) {
      throw new Error('Keyboard trap detected without escape mechanism');
    }
  }

  /**
   * Test focus management
   */
  testFocusManagement(container) {
    const focusableElements = this.getFocusableElements(container);

    focusableElements.forEach(element => {
      // Test focus indicators
      if (!this.hasFocusIndicator(element)) {
        this.warnings.push(`Focus indicator may be insufficient: ${this.getElementSelector(element)}`);
      }

      // Test focus visibility
      if (!this.isFocusVisible(element)) {
        throw new Error(`Focus indicator not visible: ${this.getElementSelector(element)}`);
      }
    });

    // Check for skip links
    const skipLinks = container.querySelectorAll('.skip-link, [href="#main-content"]');
    if (skipLinks.length === 0) {
      this.warnings.push('No skip links found');
    }
  }

  /**
   * Test ARIA implementation
   */
  testARIA(container) {
    // Check for proper landmark usage
    this.testLandmarks(container);
    
    // Check ARIA labels and descriptions
    this.testARIALabels(container);
    
    // Check for proper roles
    this.testARIARoles(container);
    
    // Check live regions
    this.testLiveRegions(container);
  }

  /**
   * Test landmarks
   */
  testLandmarks(container) {
    const main = container.querySelector('main');
    if (!main) {
      throw new Error('Missing main landmark');
    }

    const nav = container.querySelector('nav');
    if (nav && !nav.getAttribute('aria-label') && !nav.getAttribute('aria-labelledby')) {
      this.warnings.push('Navigation landmark should have accessible name');
    }
  }

  /**
   * Test ARIA labels and descriptions
   */
  testARIALabels(container) {
    // Check buttons without text content
    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
      if (!this.hasAccessibleName(button)) {
        throw new Error(`Button missing accessible name: ${this.getElementSelector(button)}`);
      }
    });

    // Check form inputs
    const inputs = container.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (!this.hasLabel(input)) {
        throw new Error(`Form input missing label: ${this.getElementSelector(input)}`);
      }
    });

    // Check images
    const images = container.querySelectorAll('img');
    images.forEach(img => {
      if (!img.alt && !img.getAttribute('aria-hidden')) {
        throw new Error(`Image missing alt text: ${this.getElementSelector(img)}`);
      }
    });
  }

  /**
   * Test ARIA roles
   */
  testARIARoles(container) {
    const elementsWithRoles = container.querySelectorAll('[role]');
    
    elementsWithRoles.forEach(element => {
      const role = element.getAttribute('role');
      
      // Check for invalid roles
      if (!this.isValidRole(role)) {
        throw new Error(`Invalid ARIA role: ${role} on ${this.getElementSelector(element)}`);
      }

      // Check required ARIA properties for roles
      const requiredProps = this.getRequiredARIAProperties(role);
      requiredProps.forEach(prop => {
        if (!element.hasAttribute(prop)) {
          throw new Error(`Missing required ARIA property ${prop} for role ${role}: ${this.getElementSelector(element)}`);
        }
      });
    });
  }

  /**
   * Test live regions
   */
  testLiveRegions(container) {
    const liveRegions = container.querySelectorAll('[aria-live]');
    
    liveRegions.forEach(region => {
      const liveValue = region.getAttribute('aria-live');
      if (!['polite', 'assertive', 'off'].includes(liveValue)) {
        throw new Error(`Invalid aria-live value: ${liveValue} on ${this.getElementSelector(region)}`);
      }
    });
  }

  /**
   * Test color contrast
   */
  testColorContrast(container) {
    const textElements = container.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label');
    
    textElements.forEach(element => {
      const style = window.getComputedStyle(element);
      const color = style.color;
      const backgroundColor = this.getBackgroundColor(element);
      
      if (color && backgroundColor) {
        const contrast = this.calculateContrastRatio(color, backgroundColor);
        const fontSize = parseInt(style.fontSize);
        const fontWeight = style.fontWeight;
        
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
        const minContrast = isLargeText ? 3.0 : 4.5;
        
        if (contrast < minContrast) {
          this.warnings.push(`Low color contrast (${contrast.toFixed(2)}:1) on ${this.getElementSelector(element)}`);
        }
      }
    });
  }

  /**
   * Test form accessibility
   */
  testFormAccessibility(container) {
    const forms = container.querySelectorAll('form');
    
    forms.forEach(form => {
      // Check for form labels
      const inputs = form.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        if (input.type !== 'hidden' && !this.hasLabel(input)) {
          throw new Error(`Form input missing label: ${this.getElementSelector(input)}`);
        }
      });

      // Check for fieldsets with multiple related inputs
      const radioGroups = form.querySelectorAll('input[type="radio"]');
      const radioNames = new Set();
      radioGroups.forEach(radio => {
        if (radio.name) radioNames.add(radio.name);
      });

      radioNames.forEach(name => {
        const radios = form.querySelectorAll(`input[type="radio"][name="${name}"]`);
        if (radios.length > 1) {
          const fieldset = radios[0].closest('fieldset');
          if (!fieldset) {
            this.warnings.push(`Radio group "${name}" should be wrapped in fieldset`);
          }
        }
      });

      // Check for error messages
      const errorMessages = form.querySelectorAll('[role="alert"], .error-message');
      if (errorMessages.length === 0) {
        this.warnings.push('Form may lack error message support');
      }
    });
  }

  /**
   * Test image accessibility
   */
  testImageAccessibility(container) {
    const images = container.querySelectorAll('img');
    
    images.forEach(img => {
      // Check for alt text
      if (!img.hasAttribute('alt')) {
        throw new Error(`Image missing alt attribute: ${this.getElementSelector(img)}`);
      }

      // Check for decorative images
      if (img.alt === '' && !img.getAttribute('aria-hidden')) {
        this.warnings.push(`Decorative image should have aria-hidden="true": ${this.getElementSelector(img)}`);
      }

      // Check for complex images
      if (img.alt && img.alt.length > 125) {
        this.warnings.push(`Alt text is very long, consider using aria-describedby: ${this.getElementSelector(img)}`);
      }
    });

    // Check for background images with content
    const elementsWithBgImages = container.querySelectorAll('[style*="background-image"]');
    elementsWithBgImages.forEach(element => {
      if (element.textContent.trim() === '' && !element.getAttribute('aria-label')) {
        this.warnings.push(`Background image may need accessible alternative: ${this.getElementSelector(element)}`);
      }
    });
  }

  /**
   * Test heading structure
   */
  testHeadingStructure(container) {
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    if (headings.length === 0) {
      this.warnings.push('No headings found');
      return;
    }

    let previousLevel = 0;
    let hasH1 = false;

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (level === 1) {
        hasH1 = true;
        if (index > 0) {
          this.warnings.push('Multiple H1 elements found');
        }
      }

      if (previousLevel > 0 && level > previousLevel + 1) {
        this.warnings.push(`Heading level skipped: ${heading.tagName} after H${previousLevel}`);
      }

      if (heading.textContent.trim() === '') {
        throw new Error(`Empty heading: ${this.getElementSelector(heading)}`);
      }

      previousLevel = level;
    });

    if (!hasH1) {
      throw new Error('No H1 heading found');
    }
  }

  /**
   * Test touch targets
   */
  testTouchTargets(container) {
    const interactiveElements = container.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [role="link"], [tabindex]:not([tabindex="-1"])'
    );

    interactiveElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const minSize = 44; // WCAG recommendation

      if (rect.width < minSize || rect.height < minSize) {
        this.warnings.push(`Touch target may be too small (${Math.round(rect.width)}x${Math.round(rect.height)}): ${this.getElementSelector(element)}`);
      }
    });
  }

  /**
   * Test motion preferences
   */
  testMotionPreferences(container) {
    const animatedElements = container.querySelectorAll('[style*="animation"], [class*="animate"]');
    
    if (animatedElements.length > 0) {
      // Check if there's a way to disable animations
      const animationControl = container.querySelector('.animation-control, [data-reduce-motion]');
      if (!animationControl) {
        this.warnings.push('Animated content found but no animation control provided');
      }

      // Check for CSS that respects prefers-reduced-motion
      const stylesheets = Array.from(document.styleSheets);
      let hasReducedMotionSupport = false;

      try {
        stylesheets.forEach(sheet => {
          Array.from(sheet.cssRules || []).forEach(rule => {
            if (rule.media && rule.media.mediaText.includes('prefers-reduced-motion')) {
              hasReducedMotionSupport = true;
            }
          });
        });
      } catch (e) {
        // Cross-origin stylesheets can't be accessed
      }

      if (!hasReducedMotionSupport) {
        this.warnings.push('No prefers-reduced-motion support detected');
      }
    }
  }

  /**
   * Utility methods
   */
  getFocusableElements(container) {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors));
  }

  isKeyboardAccessible(element) {
    // Check if element can receive focus
    const tabIndex = element.getAttribute('tabindex');
    if (tabIndex === '-1') return false;

    // Check if element is visible
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return false;

    // Check if element has keyboard event handlers or is natively focusable
    const tagName = element.tagName.toLowerCase();
    const nativelyFocusable = ['a', 'button', 'input', 'select', 'textarea'].includes(tagName);
    
    if (nativelyFocusable) return true;

    // Check for role that implies keyboard interaction
    const role = element.getAttribute('role');
    const interactiveRoles = ['button', 'link', 'menuitem', 'tab', 'option'];
    
    return interactiveRoles.includes(role) || tabIndex !== null;
  }

  getTabOrder(elements) {
    return elements
      .map(el => ({
        element: el,
        tabIndex: parseInt(el.getAttribute('tabindex')) || 0
      }))
      .sort((a, b) => {
        if (a.tabIndex !== b.tabIndex) {
          // Positive tab indices come first, then 0
          if (a.tabIndex > 0 && b.tabIndex <= 0) return -1;
          if (b.tabIndex > 0 && a.tabIndex <= 0) return 1;
          return a.tabIndex - b.tabIndex;
        }
        // Same tab index, use document order
        // eslint-disable-next-line no-undef
        return a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });
  }

  isLogicalTabOrder(tabOrder) {
    // This is a simplified check - in practice, you'd need more sophisticated logic
    return tabOrder.every((item, index) => {
      if (index === 0) return true;
      const prev = tabOrder[index - 1];
      return item.tabIndex >= 0 && prev.tabIndex >= 0;
    });
  }

  hasKeyboardTraps(container) {
    // Simplified check for modals without escape mechanism
    const modals = container.querySelectorAll('[role="dialog"], .modal');
    return Array.from(modals).some(modal => {
      const style = window.getComputedStyle(modal);
      if (style.display === 'none') return false;
      
      // Check for escape mechanisms
      const closeButton = modal.querySelector('[data-dismiss], .close, .modal-close');
      const hasEscapeListener = modal.hasAttribute('data-keyboard') || 
                               modal.addEventListener || 
                               window.getEventListeners?.(modal)?.keydown;
      
      return !closeButton && !hasEscapeListener;
    });
  }

  hasFocusIndicator(element) {
    const style = window.getComputedStyle(element, ':focus');
    return style.outline !== 'none' && style.outline !== '0px';
  }

  isFocusVisible(element) {
    // Simplified check - would need more sophisticated testing in practice
    element.focus();
    const activeStyle = window.getComputedStyle(element, ':focus');
    element.blur();
    
    return activeStyle.outline !== 'none' || 
           activeStyle.boxShadow !== 'none' ||
           activeStyle.backgroundColor !== window.getComputedStyle(element).backgroundColor;
  }

  hasAccessibleName(element) {
    return element.getAttribute('aria-label') ||
           element.getAttribute('aria-labelledby') ||
           element.textContent.trim() ||
           element.title ||
           (element.tagName === 'INPUT' && element.labels?.length > 0);
  }

  hasLabel(input) {
    return input.labels?.length > 0 ||
           input.getAttribute('aria-label') ||
           input.getAttribute('aria-labelledby') ||
           input.getAttribute('title');
  }

  isValidRole(role) {
    const validRoles = [
      'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
      'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
      'contentinfo', 'definition', 'dialog', 'directory', 'document',
      'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading',
      'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
      'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox',
      'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation',
      'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup',
      'rowheader', 'scrollbar', 'search', 'searchbox', 'separator',
      'slider', 'spinbutton', 'status', 'switch', 'tab', 'table',
      'tablist', 'tabpanel', 'term', 'textbox', 'timer', 'toolbar',
      'tooltip', 'tree', 'treegrid', 'treeitem'
    ];
    
    return validRoles.includes(role);
  }

  getRequiredARIAProperties(role) {
    const requirements = {
      'checkbox': ['aria-checked'],
      'radio': ['aria-checked'],
      'slider': ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
      'progressbar': ['aria-valuenow'],
      'tab': ['aria-selected'],
      'tabpanel': ['aria-labelledby'],
      'dialog': ['aria-labelledby'],
      'alertdialog': ['aria-labelledby']
    };
    
    return requirements[role] || [];
  }

  getBackgroundColor(element) {
    let current = element;
    
    while (current && current !== document.body) {
      const style = window.getComputedStyle(current);
      const bgColor = style.backgroundColor;
      
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        return bgColor;
      }
      
      current = current.parentElement;
    }
    
    return 'rgb(255, 255, 255)'; // Default to white
  }

  calculateContrastRatio(color1, color2) {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  getLuminance(color) {
    // Convert color to RGB
    const rgb = this.parseColor(color);
    if (!rgb) return 0;

    // Convert to relative luminance
    const [r, g, b] = rgb.map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  parseColor(color) {
    // Handle rgb() format
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
    }

    // Handle rgba() format
    const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
    if (rgbaMatch) {
      return [parseInt(rgbaMatch[1]), parseInt(rgbaMatch[2]), parseInt(rgbaMatch[3])];
    }

    // Handle hex format
    const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (hexMatch) {
      return [
        parseInt(hexMatch[1], 16),
        parseInt(hexMatch[2], 16),
        parseInt(hexMatch[3], 16)
      ];
    }

    return null;
  }

  getElementSelector(element) {
    if (element.id) return `#${element.id}`;
    if (element.className) return `${element.tagName.toLowerCase()}.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  /**
   * Generate accessibility report
   */
  generateReport() {
    const total = this.passes.length + this.violations.length + this.warnings.length;
    const score = total > 0 ? Math.round((this.passes.length / total) * 100) : 0;

    const report = {
      score,
      summary: {
        total,
        passes: this.passes.length,
        violations: this.violations.length,
        warnings: this.warnings.length
      },
      passes: this.passes,
      violations: this.violations,
      warnings: this.warnings,
      timestamp: new Date().toISOString()
    };

    logger.info('Accessibility audit completed:', report.summary);
    
    if (this.violations.length > 0) {
      logger.error('Accessibility violations:', this.violations);
    }
    
    if (this.warnings.length > 0) {
      logger.warn('Accessibility warnings:', this.warnings);
    }

    return report;
  }

  /**
   * Export report as JSON
   */
  exportReport(report) {
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `accessibility-report-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  /**
   * Run axe-core if available
   */
  async runAxe(container = document) {
    if (!window.axe) {
      logger.warn('axe-core not available for automated testing');
      return null;
    }

    try {
      // eslint-disable-next-line no-undef
      const results = await axe.run(container);
      
      if (results.violations.length > 0) {
        logger.group('Axe Accessibility Violations');
        results.violations.forEach(violation => {
          logger.error(`${violation.impact}: ${violation.description}`);
          violation.nodes.forEach(node => {
            logger.log('Element:', node.target);
            logger.log('Fix:', node.failureSummary);
          });
        });
        logger.groupEnd();
      }

      return results;
    } catch (error) {
      logger.error('Error running axe:', error);
      return null;
    }
  }
}

// Export singleton instance
export const accessibilityTester = new AccessibilityTester();