/**
 * Accessibility Service
 * Provides comprehensive accessibility features and WCAG 2.1 Level AA compliance
 */

import logger from '../../utils/logger.js';

export class AccessibilityService {
  constructor() {
    this.preferences = {
      reducedMotion: false,
      highContrast: false,
      largeText: false,
      screenReader: false,
      keyboardOnly: false
    };
    
    this.announcer = null;
    this.focusTrap = null;
    this.currentFocusable = [];
    this.skipLinks = new Map();
    this.keyboardNavigation = null;
    
    // Bind methods
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleFocusIn = this.handleFocusIn.bind(this);
    this.handleMediaChange = this.handleMediaChange.bind(this);
  }

  /**
   * Initialize the accessibility service
   */
  async initialize() {
    // Create screen reader announcer
    this.createAnnouncer();
    
    // Check user preferences
    this.detectPreferences();
    
    // Set up media query listeners
    this.setupMediaQueries();
    
    // Initialize keyboard navigation
    this.initializeKeyboardNavigation();
    
    // Create skip links
    this.createSkipLinks();
    
    // Apply initial settings
    this.applyPreferences();
    
    // Add global event listeners
    this.attachGlobalListeners();
    
    // Initialize ARIA live regions
    this.setupLiveRegions();
    
    logger.info('AccessibilityService initialized');
  }

  /**
   * Create screen reader announcer
   */
  createAnnouncer() {
    // Polite announcements (wait for screen reader to finish)
    this.announcer = {
      polite: document.createElement('div'),
      assertive: document.createElement('div')
    };

    // Configure polite announcer
    this.announcer.polite.setAttribute('aria-live', 'polite');
    this.announcer.polite.setAttribute('aria-atomic', 'true');
    this.announcer.polite.className = 'sr-only';
    this.announcer.polite.id = 'accessibility-announcer-polite';

    // Configure assertive announcer
    this.announcer.assertive.setAttribute('aria-live', 'assertive');
    this.announcer.assertive.setAttribute('aria-atomic', 'true');
    this.announcer.assertive.className = 'sr-only';
    this.announcer.assertive.id = 'accessibility-announcer-assertive';

    // Add to DOM
    document.body.appendChild(this.announcer.polite);
    document.body.appendChild(this.announcer.assertive);
  }

  /**
   * Detect user accessibility preferences
   */
  detectPreferences() {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.preferences.reducedMotion = prefersReducedMotion.matches;

    // Check for high contrast preference
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
    this.preferences.highContrast = prefersHighContrast.matches;

    // Check for color scheme preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    this.preferences.darkMode = prefersDark.matches;

    // Check for screen reader (heuristic)
    this.preferences.screenReader = this.detectScreenReader();

    // Load saved preferences
    this.loadSavedPreferences();
  }

  /**
   * Detect if screen reader is likely active
   */
  detectScreenReader() {
    // Check for common screen reader indicators
    const indicators = [
      () => navigator.userAgent.includes('NVDA'),
      () => navigator.userAgent.includes('JAWS'),
      () => window.speechSynthesis && window.speechSynthesis.getVoices().length > 0,
      () => 'speechSynthesis' in window,
      () => document.querySelector('[role="application"]') !== null
    ];

    return indicators.some(check => {
      try {
        return check();
      } catch (e) {
        return false;
      }
    });
  }

  /**
   * Set up media query listeners
   */
  setupMediaQueries() {
    // Reduced motion
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionQuery.addEventListener('change', this.handleMediaChange);

    // High contrast
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    highContrastQuery.addEventListener('change', this.handleMediaChange);

    // Color scheme
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeQuery.addEventListener('change', this.handleMediaChange);
  }

  /**
   * Handle media query changes
   */
  handleMediaChange(e) {
    if (e.media.includes('prefers-reduced-motion')) {
      this.preferences.reducedMotion = e.matches;
      this.applyMotionPreferences();
    } else if (e.media.includes('prefers-contrast')) {
      this.preferences.highContrast = e.matches;
      this.applyContrastPreferences();
    } else if (e.media.includes('prefers-color-scheme')) {
      this.preferences.darkMode = e.matches;
      this.applyColorSchemePreferences();
    }
  }

  /**
   * Initialize keyboard navigation
   */
  initializeKeyboardNavigation() {
    this.keyboardNavigation = new KeyboardNavigationManager();
  }

  /**
   * Create skip links for better navigation
   */
  createSkipLinks() {
    const skipLinks = [
      { text: 'Skip to main content', target: '#main-content' },
      { text: 'Skip to navigation', target: '#main-navigation' },
      { text: 'Skip to search', target: '#search' }
    ];

    const skipContainer = document.createElement('div');
    skipContainer.className = 'skip-links';
    skipContainer.setAttribute('role', 'navigation');
    skipContainer.setAttribute('aria-label', 'Skip links');

    skipLinks.forEach(link => {
      const skipLink = document.createElement('a');
      skipLink.href = link.target;
      skipLink.textContent = link.text;
      skipLink.className = 'skip-link sr-only-focusable';
      
      skipLink.addEventListener('click', (e) => {
        const target = document.querySelector(link.target);
        if (target) {
          e.preventDefault();
          target.focus();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });

      skipContainer.appendChild(skipLink);
      this.skipLinks.set(link.target, skipLink);
    });

    // Insert at the beginning of body
    document.body.insertBefore(skipContainer, document.body.firstChild);
  }

  /**
   * Attach global event listeners
   */
  attachGlobalListeners() {
    document.addEventListener('keydown', this.handleKeydown);
    document.addEventListener('focusin', this.handleFocusIn);
    
    // Monitor for keyboard usage
    document.addEventListener('keydown', () => {
      document.body.classList.add('keyboard-navigation');
      this.preferences.keyboardOnly = true;
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
      this.preferences.keyboardOnly = false;
    });
  }

  /**
   * Handle global keydown events
   */
  handleKeydown(e) {
    // Global keyboard shortcuts for accessibility
    switch (e.key) {
    case 'Escape':
      this.handleEscapeKey(e);
      break;
    case 'F6':
      this.handleF6Navigation(e);
      break;
    case 'Home':
      if (e.ctrlKey) {
        this.navigateToTop(e);
      }
      break;
    case 'End':
      if (e.ctrlKey) {
        this.navigateToBottom(e);
      }
      break;
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
      if (e.altKey) {
        this.handleHeadingNavigation(e, parseInt(e.key));
      }
      break;
    }
  }

  /**
   * Handle heading navigation (Alt+1 through Alt+6)
   */
  handleHeadingNavigation(e, level) {
    e.preventDefault();
    
    const heading = document.querySelector(`h${level}`);
    if (heading) {
      heading.focus();
      heading.scrollIntoView({ behavior: 'smooth' });
      this.announce(`Navigated to ${heading.textContent || 'heading level ' + level}`, 'polite');
    }
  }

  /**
   * Handle escape key press
   */
  handleEscapeKey(_e) {
    // Close modals, menus, or other overlays
    const activeModal = document.querySelector('.modal[aria-hidden="false"]');
    if (activeModal) {
      const closeButton = activeModal.querySelector('.modal-close');
      if (closeButton) {
        closeButton.click();
      }
      return;
    }

    // Close dropdowns
    const openDropdown = document.querySelector('.dropdown.open');
    if (openDropdown) {
      openDropdown.classList.remove('open');
      const trigger = openDropdown.querySelector('[aria-expanded="true"]');
      if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
        trigger.focus();
      }
    }
  }

  /**
   * Handle F6 navigation (section-to-section)
   */
  handleF6Navigation(e) {
    e.preventDefault();
    
    const landmarks = document.querySelectorAll(
      'main, nav, aside, header, footer, section[aria-labelledby], section[aria-label]'
    );
    
    if (landmarks.length === 0) return;

    const currentIndex = Array.from(landmarks).findIndex(
      landmark => landmark.contains(document.activeElement)
    );
    
    const nextIndex = e.shiftKey 
      ? (currentIndex - 1 + landmarks.length) % landmarks.length 
      : (currentIndex + 1) % landmarks.length;
    
    const nextLandmark = landmarks[nextIndex];
    
    // Make sure landmark is focusable
    if (!nextLandmark.hasAttribute('tabindex')) {
      nextLandmark.setAttribute('tabindex', '-1');
    }
    
    nextLandmark.focus();
    
    // Announce the landmark
    const landmarkName = this.getLandmarkName(nextLandmark);
    this.announce(`Navigated to ${landmarkName}`, 'polite');
  }

  /**
   * Get readable name for landmark
   */
  getLandmarkName(element) {
    const label = element.getAttribute('aria-label');
    if (label) return label;
    
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement) return labelElement.textContent.trim();
    }
    
    const tagName = element.tagName.toLowerCase();
    const roleMap = {
      'main': 'main content',
      'nav': 'navigation',
      'aside': 'sidebar',
      'header': 'header',
      'footer': 'footer',
      'section': 'section'
    };
    
    return roleMap[tagName] || tagName;
  }

  /**
   * Handle focus events
   */
  handleFocusIn(e) {
    // Ensure focused element is visible
    this.ensureVisible(e.target);
    
    // Track keyboard navigation
    if (this.preferences.keyboardOnly) {
      e.target.classList.add('keyboard-focused');
    }
  }

  /**
   * Ensure element is visible when focused
   */
  ensureVisible(element) {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // Check if element is partially or fully outside viewport
    if (rect.top < 0 || rect.bottom > viewportHeight) {
      element.scrollIntoView({
        behavior: this.preferences.reducedMotion ? 'auto' : 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  }

  /**
   * Set up ARIA live regions
   */
  setupLiveRegions() {
    // Status messages (polite)
    if (!document.getElementById('status-messages')) {
      const statusRegion = document.createElement('div');
      statusRegion.id = 'status-messages';
      statusRegion.setAttribute('aria-live', 'polite');
      statusRegion.setAttribute('aria-atomic', 'false');
      statusRegion.className = 'sr-only';
      document.body.appendChild(statusRegion);
    }

    // Alert messages (assertive)
    if (!document.getElementById('alert-messages')) {
      const alertRegion = document.createElement('div');
      alertRegion.id = 'alert-messages';
      alertRegion.setAttribute('aria-live', 'assertive');
      alertRegion.setAttribute('aria-atomic', 'true');
      alertRegion.className = 'sr-only';
      document.body.appendChild(alertRegion);
    }
  }

  /**
   * Announce message to screen readers
   */
  announce(message, priority = 'polite', timeout = 1000) {
    if (!message) return;

    const announcer = priority === 'assertive' 
      ? this.announcer.assertive 
      : this.announcer.polite;

    // Clear previous message
    announcer.textContent = '';

    // Set new message after brief delay to ensure it's picked up
    setTimeout(() => {
      announcer.textContent = message;
      logger.debug(`Accessibility announcement (${priority}):`, message);
    }, 100);

    // Clear message after timeout
    setTimeout(() => {
      if (announcer.textContent === message) {
        announcer.textContent = '';
      }
    }, timeout);
  }

  /**
   * Apply accessibility preferences
   */
  applyPreferences() {
    this.applyMotionPreferences();
    this.applyContrastPreferences();
    this.applyTextPreferences();
    this.applyColorSchemePreferences();
  }

  /**
   * Apply motion preferences
   */
  applyMotionPreferences() {
    if (this.preferences.reducedMotion) {
      document.body.classList.add('reduce-motion');
    } else {
      document.body.classList.remove('reduce-motion');
    }
  }

  /**
   * Apply contrast preferences
   */
  applyContrastPreferences() {
    if (this.preferences.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }

  /**
   * Apply text size preferences
   */
  applyTextPreferences() {
    if (this.preferences.largeText) {
      document.body.classList.add('large-text');
    } else {
      document.body.classList.remove('large-text');
    }
  }

  /**
   * Apply color scheme preferences
   */
  applyColorSchemePreferences() {
    if (this.preferences.darkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  /**
   * Create focus trap for modal/dialog elements
   */
  createFocusTrap(container) {
    return new FocusTrap(container);
  }

  /**
   * Enhance form accessibility
   */
  enhanceForm(form) {
    return new AccessibleForm(form);
  }

  /**
   * Check color contrast compliance
   */
  checkContrast(foreground, background) {
    const ratio = this.calculateContrastRatio(foreground, background);
    
    return {
      ratio: parseFloat(ratio.toFixed(2)),
      isAALarge: ratio >= 3.0,  // Large text AA
      isAA: ratio >= 4.5,       // Normal text AA
      isAAALarge: ratio >= 4.5, // Large text AAA
      isAAA: ratio >= 7.0       // Normal text AAA
    };
  }

  /**
   * Calculate contrast ratio between two colors
   */
  calculateContrastRatio(color1, color2) {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Get relative luminance of a color
   */
  getLuminance(color) {
    // Convert color to RGB
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;

    // Convert to relative luminance
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;

    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Convert hex color to RGB
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Load saved accessibility preferences
   */
  loadSavedPreferences() {
    try {
      const saved = localStorage.getItem('accessibility-preferences');
      if (saved) {
        const preferences = JSON.parse(saved);
        Object.assign(this.preferences, preferences);
      }
    } catch (error) {
      logger.warn('Failed to load accessibility preferences:', error);
    }
  }

  /**
   * Save accessibility preferences
   */
  savePreferences() {
    try {
      localStorage.setItem('accessibility-preferences', JSON.stringify(this.preferences));
    } catch (error) {
      logger.warn('Failed to save accessibility preferences:', error);
    }
  }

  /**
   * Update preference and apply changes
   */
  updatePreference(key, value) {
    if (Object.prototype.hasOwnProperty.call(this.preferences, key)) {
      this.preferences[key] = value;
      this.applyPreferences();
      this.savePreferences();
      
      this.announce(`${key} ${value ? 'enabled' : 'disabled'}`, 'polite');
    }
  }

  /**
   * Get current preferences
   */
  getPreferences() {
    return { ...this.preferences };
  }

  /**
   * Navigate to top of page
   */
  navigateToTop(e) {
    e.preventDefault();
    const main = document.querySelector('main') || document.body;
    main.focus();
    main.scrollIntoView({ behavior: this.preferences.reducedMotion ? 'auto' : 'smooth' });
    this.announce('Navigated to top of page', 'polite');
  }

  /**
   * Navigate to bottom of page
   */
  navigateToBottom(e) {
    e.preventDefault();
    const footer = document.querySelector('footer') || document.body.lastElementChild;
    footer.focus();
    footer.scrollIntoView({ behavior: this.preferences.reducedMotion ? 'auto' : 'smooth' });
    this.announce('Navigated to bottom of page', 'polite');
  }

  /**
   * Create accessible tooltip
   */
  createTooltip(trigger, content) {
    return new AccessibleTooltip(trigger, content);
  }

  /**
   * Cleanup method
   */
  destroy() {
    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeydown);
    document.removeEventListener('focusin', this.handleFocusIn);

    // Remove announcers
    if (this.announcer) {
      this.announcer.polite?.remove();
      this.announcer.assertive?.remove();
    }

    // Clean up skip links
    document.querySelector('.skip-links')?.remove();

    // Clean up keyboard navigation
    if (this.keyboardNavigation) {
      this.keyboardNavigation.destroy();
    }

    logger.info('AccessibilityService destroyed');
  }
}

/**
 * Keyboard Navigation Manager
 */
class KeyboardNavigationManager {
  constructor() {
    this.navigationMode = 'browse'; // browse, application, focus
    this.currentGroup = null;
  }

  /**
   * Handle roving tabindex for component groups
   */
  setupRovingTabindex(container, items) {
    if (!container || !items.length) return;

    // Set initial state
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === 0 ? '0' : '-1');
      
      item.addEventListener('keydown', (e) => {
        this.handleRovingKeydown(e, items, index);
      });

      item.addEventListener('focus', () => {
        this.updateRovingTabindex(items, index);
      });
    });

    return {
      destroy: () => {
        items.forEach(item => {
          item.removeAttribute('tabindex');
        });
      }
    };
  }

  /**
   * Handle keydown in roving tabindex group
   */
  handleRovingKeydown(e, items, currentIndex) {
    let newIndex = currentIndex;

    switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      newIndex = (currentIndex + 1) % items.length;
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      newIndex = (currentIndex - 1 + items.length) % items.length;
      break;
    case 'Home':
      newIndex = 0;
      break;
    case 'End':
      newIndex = items.length - 1;
      break;
    default:
      return; // Don't prevent default for other keys
    }

    e.preventDefault();
    this.updateRovingTabindex(items, newIndex);
    items[newIndex].focus();
  }

  /**
   * Update tabindex for roving tabindex group
   */
  updateRovingTabindex(items, activeIndex) {
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === activeIndex ? '0' : '-1');
    });
  }

  destroy() {
    // Cleanup if needed
  }
}

/**
 * Focus Trap Class
 */
class FocusTrap {
  constructor(container) {
    this.container = container;
    this.focusableElements = [];
    this.firstFocusable = null;
    this.lastFocusable = null;
    this.previouslyFocused = document.activeElement;
    
    this.handleKeydown = this.handleKeydown.bind(this);
    this.updateFocusableElements();
  }

  /**
   * Update the list of focusable elements
   */
  updateFocusableElements() {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    this.focusableElements = Array.from(
      this.container.querySelectorAll(focusableSelectors)
    );

    this.firstFocusable = this.focusableElements[0];
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];
  }

  /**
   * Activate the focus trap
   */
  activate() {
    this.container.addEventListener('keydown', this.handleKeydown);
    
    // Focus first element or container
    if (this.firstFocusable) {
      this.firstFocusable.focus();
    } else {
      this.container.focus();
    }
  }

  /**
   * Deactivate the focus trap
   */
  deactivate() {
    this.container.removeEventListener('keydown', this.handleKeydown);
    
    // Restore focus to previously focused element
    if (this.previouslyFocused && this.previouslyFocused.focus) {
      this.previouslyFocused.focus();
    }
  }

  /**
   * Handle keydown events for focus trapping
   */
  handleKeydown(e) {
    if (e.key !== 'Tab') return;

    if (this.focusableElements.length === 0) {
      e.preventDefault();
      return;
    }

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === this.firstFocusable) {
        e.preventDefault();
        this.lastFocusable.focus();
      }
    } else {
      // Tab
      if (document.activeElement === this.lastFocusable) {
        e.preventDefault();
        this.firstFocusable.focus();
      }
    }
  }
}

/**
 * Accessible Form Enhancement
 */
class AccessibleForm {
  constructor(form) {
    this.form = form;
    this.errors = new Map();
    this.announcer = null;
    
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
    this.enhanceInputs();
  }

  /**
   * Enhance form inputs with accessibility features
   */
  enhanceInputs() {
    const inputs = this.form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      // Add aria-describedby for help text
      const helpText = input.parentNode.querySelector('.help-text');
      if (helpText && !helpText.id) {
        helpText.id = `${input.id || this.generateId()}-help`;
        const describedBy = input.getAttribute('aria-describedby') || '';
        input.setAttribute('aria-describedby', `${describedBy} ${helpText.id}`.trim());
      }

      // Real-time validation
      input.addEventListener('blur', () => {
        this.validateField(input);
      });

      input.addEventListener('input', () => {
        if (this.errors.has(input)) {
          this.clearFieldError(input);
        }
      });
    });
  }

  /**
   * Handle form submission
   */
  handleSubmit(e) {
    e.preventDefault();
    this.clearAllErrors();
    
    if (this.validate()) {
      // Form is valid, proceed with submission
      this.announceSuccess('Form submitted successfully');
    } else {
      this.announceErrors();
      this.focusFirstError();
    }
  }

  /**
   * Validate entire form
   */
  validate() {
    const inputs = this.form.querySelectorAll('[required], [data-validate]');
    let isValid = true;

    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });

    return isValid;
  }

  /**
   * Validate individual field
   */
  validateField(input) {
    const value = input.value.trim();
    const fieldName = this.getFieldName(input);

    // Required validation
    if (input.hasAttribute('required') && !value) {
      this.addFieldError(input, `${fieldName} is required`);
      return false;
    }

    // Type-specific validation
    if (value) {
      switch (input.type) {
      case 'email':
        if (!this.isValidEmail(value)) {
          this.addFieldError(input, 'Please enter a valid email address');
          return false;
        }
        break;
      case 'url':
        if (!this.isValidUrl(value)) {
          this.addFieldError(input, 'Please enter a valid URL');
          return false;
        }
        break;
      case 'tel':
        if (!this.isValidPhone(value)) {
          this.addFieldError(input, 'Please enter a valid phone number');
          return false;
        }
        break;
      }

      // Pattern validation
      const pattern = input.getAttribute('pattern');
      if (pattern && !new RegExp(pattern).test(value)) {
        const title = input.getAttribute('title') || 'Please match the required format';
        this.addFieldError(input, title);
        return false;
      }
    }

    this.clearFieldError(input);
    return true;
  }

  /**
   * Add error to field
   */
  addFieldError(input, message) {
    this.errors.set(input, message);
    
    input.setAttribute('aria-invalid', 'true');
    
    // Create or update error element
    const errorId = `${input.id || this.generateId()}-error`;
    let errorElement = document.getElementById(errorId);
    
    if (!errorElement) {
      errorElement = document.createElement('span');
      errorElement.id = errorId;
      errorElement.className = 'error-message';
      errorElement.setAttribute('role', 'alert');
      errorElement.setAttribute('aria-live', 'polite');
      input.parentNode.appendChild(errorElement);
      
      // Update aria-describedby
      const describedBy = input.getAttribute('aria-describedby') || '';
      input.setAttribute('aria-describedby', `${describedBy} ${errorId}`.trim());
    }
    
    errorElement.textContent = message;
    input.classList.add('error');
  }

  /**
   * Clear error from field
   */
  clearFieldError(input) {
    this.errors.delete(input);
    input.setAttribute('aria-invalid', 'false');
    input.classList.remove('error');
    
    const errorId = `${input.id}-error`;
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
      errorElement.textContent = '';
    }
  }

  /**
   * Clear all errors
   */
  clearAllErrors() {
    this.errors.forEach((message, input) => {
      this.clearFieldError(input);
    });
  }

  /**
   * Announce form errors
   */
  announceErrors() {
    const count = this.errors.size;
    const message = `There ${count === 1 ? 'is' : 'are'} ${count} error${count === 1 ? '' : 's'} in the form. Please review and correct them.`;
    
    // Create temporary announcer
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'alert');
    announcer.setAttribute('aria-live', 'assertive');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    setTimeout(() => announcer.remove(), 3000);
  }

  /**
   * Announce success
   */
  announceSuccess(message) {
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    setTimeout(() => announcer.remove(), 3000);
  }

  /**
   * Focus first error field
   */
  focusFirstError() {
    const firstErrorField = Array.from(this.errors.keys())[0];
    if (firstErrorField) {
      firstErrorField.focus();
    }
  }

  /**
   * Get human-readable field name
   */
  getFieldName(input) {
    const label = input.labels?.[0]?.textContent;
    if (label) return label.replace('*', '').trim();
    
    const placeholder = input.placeholder;
    if (placeholder) return placeholder;
    
    const name = input.name;
    if (name) return name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return 'This field';
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `field-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validation helpers
   */
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  isValidPhone(phone) {
    return /^[+]?[(]?[\d\s\-()]{10,}$/.test(phone);
  }
}

/**
 * Accessible Tooltip
 */
class AccessibleTooltip {
  constructor(trigger, content) {
    this.trigger = trigger;
    this.content = content;
    this.tooltip = null;
    this.isVisible = false;
    
    this.setup();
  }

  setup() {
    // Create tooltip element
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'tooltip';
    this.tooltip.textContent = this.content;
    this.tooltip.id = `tooltip-${Math.random().toString(36).substr(2, 9)}`;
    this.tooltip.setAttribute('role', 'tooltip');
    this.tooltip.setAttribute('aria-hidden', 'true');
    
    // Set up trigger
    this.trigger.setAttribute('aria-describedby', this.tooltip.id);
    
    // Add event listeners
    this.trigger.addEventListener('mouseenter', () => this.show());
    this.trigger.addEventListener('mouseleave', () => this.hide());
    this.trigger.addEventListener('focus', () => this.show());
    this.trigger.addEventListener('blur', () => this.hide());
    this.trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hide();
    });
    
    document.body.appendChild(this.tooltip);
  }

  show() {
    if (this.isVisible) return;
    
    this.isVisible = true;
    this.tooltip.setAttribute('aria-hidden', 'false');
    this.tooltip.classList.add('visible');
    this.position();
  }

  hide() {
    if (!this.isVisible) return;
    
    this.isVisible = false;
    this.tooltip.setAttribute('aria-hidden', 'true');
    this.tooltip.classList.remove('visible');
  }

  position() {
    const triggerRect = this.trigger.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();
    
    const left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
    const top = triggerRect.top - tooltipRect.height - 8;
    
    this.tooltip.style.left = `${Math.max(8, left)}px`;
    this.tooltip.style.top = `${Math.max(8, top)}px`;
  }
}

// Export singleton instance
export const accessibilityService = new AccessibilityService();