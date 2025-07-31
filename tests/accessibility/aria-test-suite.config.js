/**
 * ARIA Test Suite Configuration
 * Configuration and utilities for comprehensive ARIA testing
 * Provides test helpers, matchers, and validation utilities
 */

// Custom ARIA validation utilities
export const ariaValidators = {
  /**
   * Validate ARIA role is valid
   */
  isValidRole(role) {
    const validRoles = [
      // Widget roles
      'alert', 'alertdialog', 'button', 'checkbox', 'dialog', 'gridcell',
      'link', 'log', 'marquee', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
      'option', 'progressbar', 'radio', 'scrollbar', 'slider', 'spinbutton',
      'status', 'tab', 'tabpanel', 'textbox', 'timer', 'tooltip', 'tree',
      'treeitem',
      
      // Composite roles
      'combobox', 'grid', 'listbox', 'menu', 'menubar', 'radiogroup',
      'tablist', 'toolbar', 'treegrid',
      
      // Document structure roles
      'article', 'columnheader', 'definition', 'directory', 'document',
      'group', 'heading', 'img', 'list', 'listitem', 'math', 'note',
      'presentation', 'region', 'row', 'rowgroup', 'rowheader', 'separator',
      'toolbar',
      
      // Landmark roles
      'application', 'banner', 'complementary', 'contentinfo', 'form',
      'main', 'navigation', 'search'
    ];
    
    return !role || validRoles.includes(role);
  },

  /**
   * Validate ARIA property values
   */
  isValidPropertyValue(property, value) {
    const booleanProperties = [
      'aria-atomic', 'aria-busy', 'aria-disabled', 'aria-expanded',
      'aria-grabbed', 'aria-hidden', 'aria-invalid', 'aria-multiline',
      'aria-multiselectable', 'aria-readonly', 'aria-required', 'aria-selected'
    ];
    
    const tristateProperties = ['aria-checked', 'aria-pressed'];
    
    if (booleanProperties.includes(property)) {
      return ['true', 'false'].includes(value);
    }
    
    if (tristateProperties.includes(property)) {
      return ['true', 'false', 'mixed'].includes(value);
    }
    
    if (property === 'aria-autocomplete') {
      return ['inline', 'list', 'both', 'none'].includes(value);
    }
    
    if (property === 'aria-dropeffect') {
      const validValues = ['copy', 'execute', 'link', 'move', 'none', 'popup'];
      return value.split(' ').every(v => validValues.includes(v));
    }
    
    if (property === 'aria-live') {
      return ['off', 'polite', 'assertive'].includes(value);
    }
    
    if (property === 'aria-orientation') {
      return ['horizontal', 'vertical', 'undefined'].includes(value);
    }
    
    if (property === 'aria-relevant') {
      const validValues = ['additions', 'removals', 'text', 'all'];
      return value.split(' ').every(v => validValues.includes(v));
    }
    
    if (property === 'aria-sort') {
      return ['ascending', 'descending', 'none', 'other'].includes(value);
    }
    
    // For properties with ID references or numbers, just check they exist
    return true;
  },

  /**
   * Validate element has proper ARIA labeling
   */
  hasProperLabeling(element) {
    const ariaLabel = element.getAttribute('aria-label');
    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    const associatedLabel = element.labels?.[0];
    const title = element.getAttribute('title');
    
    // Interactive elements must have accessible names
    const interactiveRoles = ['button', 'link', 'textbox', 'combobox', 'slider'];
    const interactiveTags = ['button', 'a', 'input', 'select', 'textarea'];
    const role = element.getAttribute('role');
    const tag = element.tagName.toLowerCase();
    
    const isInteractive = interactiveRoles.includes(role) || interactiveTags.includes(tag);
    
    if (isInteractive) {
      return !!(ariaLabel || ariaLabelledBy || associatedLabel || title || element.textContent.trim());
    }
    
    return true;
  },

  /**
   * Validate live region configuration
   */
  isValidLiveRegion(element) {
    const ariaLive = element.getAttribute('aria-live');
    const role = element.getAttribute('role');
    
    // Check for explicit aria-live or implicit roles
    const implicitLiveRoles = ['alert', 'status', 'log', 'marquee', 'timer'];
    
    if (ariaLive) {
      return ['off', 'polite', 'assertive'].includes(ariaLive);
    }
    
    if (role && implicitLiveRoles.includes(role)) {
      return true;
    }
    
    return false;
  },

  /**
   * Validate relationship attributes point to existing elements
   */
  hasValidRelationships(element) {
    const relationshipAttributes = [
      'aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns',
      'aria-flowto', 'aria-activedescendant'
    ];
    
    for (const attr of relationshipAttributes) {
      const value = element.getAttribute(attr);
      if (value) {
        const ids = value.split(' ').filter(id => id.trim());
        for (const id of ids) {
          if (!document.getElementById(id)) {
            return false;
          }
        }
      }
    }
    
    return true;
  }
};

// Test utilities for ARIA testing
export const ariaTestUtils = {
  /**
   * Create a mock element with ARIA attributes
   */
  createMockElement(tag, attributes = {}) {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    
    return element;
  },

  /**
   * Create a complete ARIA live region
   */
  createLiveRegion(type = 'polite', atomic = true) {
    const region = document.createElement('div');
    region.setAttribute('aria-live', type);
    region.setAttribute('aria-atomic', atomic.toString());
    region.className = 'sr-only';
    region.id = `live-region-${Date.now()}`;
    
    return region;
  },

  /**
   * Create an accessible form field
   */
  createAccessibleField(type = 'text', options = {}) {
    const container = document.createElement('div');
    
    const label = document.createElement('label');
    label.textContent = options.label || 'Field Label';
    label.htmlFor = options.id || `field-${Date.now()}`;
    
    const input = document.createElement('input');
    input.type = type;
    input.id = label.htmlFor;
    
    if (options.required) {
      input.setAttribute('required', '');
      input.setAttribute('aria-required', 'true');
    }
    
    if (options.describedBy) {
      input.setAttribute('aria-describedby', options.describedBy);
    }
    
    container.appendChild(label);
    container.appendChild(input);
    
    return { container, label, input };
  },

  /**
   * Create a complete tablist with tabs and panels
   */
  createTablist(tabs = ['Tab 1', 'Tab 2']) {
    const tablist = document.createElement('div');
    tablist.setAttribute('role', 'tablist');
    tablist.setAttribute('aria-label', 'Content tabs');
    
    const panels = document.createElement('div');
    panels.className = 'tab-panels';
    
    tabs.forEach((tabText, index) => {
      const tab = document.createElement('button');
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
      tab.setAttribute('aria-controls', `panel-${index}`);
      tab.id = `tab-${index}`;
      tab.textContent = tabText;
      
      const panel = document.createElement('div');
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', `tab-${index}`);
      panel.id = `panel-${index}`;
      panel.textContent = `Content for ${tabText}`;
      
      if (index !== 0) {
        panel.setAttribute('aria-hidden', 'true');
      }
      
      tablist.appendChild(tab);
      panels.appendChild(panel);
    });
    
    return { tablist, panels };
  },

  /**
   * Wait for ARIA live region announcement
   */
  async waitForAnnouncement(element, timeout = 1000) {
    return new Promise((resolve, reject) => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' || mutation.type === 'characterData') {
            observer.disconnect();
            resolve(element.textContent);
          }
        });
      });
      
      observer.observe(element, {
        childList: true,
        characterData: true,
        subtree: true
      });
      
      setTimeout(() => {
        observer.disconnect();
        reject(new Error('Timeout waiting for announcement'));
      }, timeout);
    });
  },

  /**
   * Get all focusable elements in container
   */
  getFocusableElements(container) {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');
    
    return Array.from(container.querySelectorAll(focusableSelectors));
  },

  /**
   * Simulate keyboard navigation
   */
  simulateKeyboard(element, key, options = {}) {
    const event = new KeyboardEvent('keydown', {
      key,
      code: key,
      bubbles: true,
      cancelable: true,
      ...options
    });
    
    element.dispatchEvent(event);
    return event;
  }
};

// Custom test matchers for ARIA
export const ariaMatchers = {
  /**
   * Check if element has valid ARIA role
   */
  toHaveValidAriaRole(element) {
    const role = element.getAttribute('role');
    const isValid = ariaValidators.isValidRole(role);
    
    return {
      pass: isValid,
      message: () => `Expected element to have valid ARIA role, got "${role}"`
    };
  },

  /**
   * Check if element has accessible name
   */
  toHaveAccessibleName(element) {
    const hasName = ariaValidators.hasProperLabeling(element);
    
    return {
      pass: hasName,
      message: () => 'Expected element to have accessible name (aria-label, aria-labelledby, or associated label)'
    };
  },

  /**
   * Check if element has valid ARIA relationships
   */
  toHaveValidAriaRelationships(element) {
    const hasValid = ariaValidators.hasValidRelationships(element);
    
    return {
      pass: hasValid,
      message: () => 'Expected all ARIA relationship attributes to reference existing elements'
    };
  },

  /**
   * Check if element is properly configured as live region
   */
  toBeValidLiveRegion(element) {
    const isValid = ariaValidators.isValidLiveRegion(element);
    
    return {
      pass: isValid,
      message: () => 'Expected element to be a valid ARIA live region'
    };
  },

  /**
   * Check if element has proper keyboard support
   */
  toSupportKeyboardNavigation(element) {
    const tabIndex = element.getAttribute('tabindex');
    const role = element.getAttribute('role');
    const tag = element.tagName.toLowerCase();
    
    const interactiveElements = ['button', 'a', 'input', 'select', 'textarea'];
    const interactiveRoles = ['button', 'link', 'tab', 'menuitem', 'option'];
    
    const isInteractive = interactiveElements.includes(tag) || 
                         interactiveRoles.includes(role);
    
    if (isInteractive) {
      const isAccessible = tabIndex !== '-1' && 
                          (tabIndex === '0' || !tabIndex || interactiveElements.includes(tag));
      
      return {
        pass: isAccessible,
        message: () => 'Expected interactive element to be keyboard accessible'
      };
    }
    
    return { pass: true, message: () => '' };
  }
};

// Test data factories
export const testDataFactory = {
  /**
   * Create test data for form validation
   */
  createFormTestData() {
    return {
      validEmail: 'test@example.com',
      invalidEmail: 'invalid-email',
      validPassword: 'SecurePass123!',
      shortPassword: '123',
      requiredField: 'Required value',
      emptyField: ''
    };
  },

  /**
   * Create test data for game interactions
   */
  createGameTestData() {
    return {
      scores: [0, 25, 50, 75, 100],
      levels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      achievements: [
        { name: 'First Steps', description: 'Complete first level', earned: true },
        { name: 'Speed Demon', description: 'Solve 10 problems in 1 minute', earned: false },
        { name: 'Perfect Score', description: 'Get 100% on any level', earned: false }
      ],
      subjects: ['Math', 'Science', 'Reading', 'Art', 'Coding']
    };
  },

  /**
   * Create test data for progress tracking
   */
  createProgressTestData() {
    return {
      overallProgress: 65,
      subjectProgress: {
        Math: 85,
        Science: 70,
        Reading: 90,
        Art: 45,
        Coding: 25
      },
      streakDays: 7,
      totalProblems: 150,
      correctAnswers: 132
    };
  }
};

// Setup helpers for tests
export const testSetup = {
  /**
   * Set up DOM with accessibility-friendly structure
   */
  setupAccessibleDOM() {
    document.body.innerHTML = `
      <div id="test-container" role="main">
        <h1>Test Page</h1>
        <nav aria-label="Test navigation">
          <ul role="menubar">
            <li role="none">
              <a href="#" role="menuitem">Home</a>
            </li>
          </ul>
        </nav>
        <main id="main-content">
          <!-- Test content goes here -->
        </main>
      </div>
    `;
    
    return document.getElementById('test-container');
  },

  /**
   * Set up live region for testing announcements
   */
  setupLiveRegions() {
    const politeRegion = ariaTestUtils.createLiveRegion('polite');
    politeRegion.id = 'test-polite-region';
    
    const assertiveRegion = ariaTestUtils.createLiveRegion('assertive');
    assertiveRegion.id = 'test-assertive-region';
    
    document.body.appendChild(politeRegion);
    document.body.appendChild(assertiveRegion);
    
    return { politeRegion, assertiveRegion };
  },

  /**
   * Clean up test DOM
   */
  cleanup() {
    document.body.innerHTML = '';
  }
};

// Export all utilities as default
export default {
  validators: ariaValidators,
  utils: ariaTestUtils,
  matchers: ariaMatchers,
  factory: testDataFactory,
  setup: testSetup
};