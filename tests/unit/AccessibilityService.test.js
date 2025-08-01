/**
 * Unit Tests for AccessibilityService
 * Tests comprehensive accessibility features and WCAG compliance
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AccessibilityService } from '../../src/services/accessibility/AccessibilityService.js';
import { DOMUtils } from '../fixtures/testDataFactory.js';

// Mock logger with inline mock to avoid hoisting issues
vi.mock('../../src/utils/logger.js', () => ({
  default: {
    level: 2,
    enabled: true,
    getLogLevel: vi.fn().mockReturnValue(2),
    setLevel: vi.fn(),
    setEnabled: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    shouldLog: vi.fn().mockReturnValue(true),
    formatMessage: vi.fn().mockImplementation((level, message, args) => {
      const timestamp = new Date().toISOString().slice(11, 23);
      return [`[${timestamp}] ${level}:`, message, ...args];
    }),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    game: vi.fn(),
    user: vi.fn(),
    perf: vi.fn()
  },
  Logger: vi.fn(),
  LOG_LEVELS: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 }
}));

describe('AccessibilityService', () => {
  let accessibilityService;
  
  beforeEach(() => {
    // Set up DOM mocks
    DOMUtils.setupElementMocks();
    
    // Reset DOM
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    
    // Set up localStorage mock with working implementation
    const localStorageMock = {
      store: new Map(),
      getItem: function(key) { 
        return this.store.get(key) || null; 
      },
      setItem: function(key, value) { 
        this.store.set(key, String(value)); 
      },
      removeItem: function(key) { 
        this.store.delete(key); 
      },
      clear: function() { 
        this.store.clear(); 
      },
      key: function(index) { 
        return Array.from(this.store.keys())[index] || null; 
      },
      get length() { 
        return this.store.size; 
      }
    };
    
    // Replace localStorage globally
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true
    });
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true
    });
    
    // Additional mock for scrollIntoView (may be overridden)
    Element.prototype.scrollIntoView = vi.fn();
    
    // Mock getBoundingClientRect for all elements
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      top: 0,
      left: 0,
      bottom: 100,
      right: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0
    }));
    
    // Mock window properties
    window.scrollTo = vi.fn();
    window.innerHeight = 768;
    window.innerWidth = 1024;
    
    // Mock media queries
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Mock speechSynthesis if not already defined
    if (!window.speechSynthesis) {
      Object.defineProperty(window, 'speechSynthesis', {
        writable: true,
        configurable: true,
        value: {
          getVoices: vi.fn(() => [])
        }
      });
    } else {
      window.speechSynthesis.getVoices = vi.fn(() => []);
    }

    accessibilityService = new AccessibilityService();
  });

  afterEach(() => {
    if (accessibilityService) {
      accessibilityService.destroy();
    }
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default preferences', () => {
      expect(accessibilityService.preferences).toEqual({
        reducedMotion: false,
        highContrast: false,
        largeText: false,
        screenReader: false,
        keyboardOnly: false
      });
    });

    it('should create screen reader announcer elements', async () => {
      await accessibilityService.initialize();
      
      const politeAnnouncer = document.getElementById('accessibility-announcer-polite');
      const assertiveAnnouncer = document.getElementById('accessibility-announcer-assertive');
      
      expect(politeAnnouncer).toBeTruthy();
      expect(politeAnnouncer.getAttribute('aria-live')).toBe('polite');
      expect(politeAnnouncer.className).toContain('sr-only');
      
      expect(assertiveAnnouncer).toBeTruthy();
      expect(assertiveAnnouncer.getAttribute('aria-live')).toBe('assertive');
      expect(assertiveAnnouncer.className).toContain('sr-only');
    });

    it('should create skip links', async () => {
      await accessibilityService.initialize();
      
      const skipLinks = document.querySelector('.skip-links');
      expect(skipLinks).toBeTruthy();
      expect(skipLinks.getAttribute('role')).toBe('navigation');
      expect(skipLinks.getAttribute('aria-label')).toBe('Skip links');
      
      const links = skipLinks.querySelectorAll('.skip-link');
      expect(links.length).toBeGreaterThan(0);
    });

    it('should set up keyboard navigation', async () => {
      await accessibilityService.initialize();
      
      expect(accessibilityService.keyboardNavigation).toBeTruthy();
    });

    it('should detect reduced motion preference', () => {
      window.matchMedia.mockImplementation(query => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }));

      accessibilityService.detectPreferences();
      
      expect(accessibilityService.preferences.reducedMotion).toBe(true);
    });
  });

  describe('Screen Reader Announcements', () => {
    beforeEach(async () => {
      await accessibilityService.initialize();
    });

    it('should announce polite messages', (done) => {
      const message = 'Test polite message';
      
      accessibilityService.announce(message, 'polite');
      
      setTimeout(() => {
        const announcer = document.getElementById('accessibility-announcer-polite');
        expect(announcer.textContent).toBe(message);
        done();
      }, 150);
    });

    it('should announce assertive messages', (done) => {
      const message = 'Test assertive message';
      
      accessibilityService.announce(message, 'assertive');
      
      setTimeout(() => {
        const announcer = document.getElementById('accessibility-announcer-assertive');
        expect(announcer.textContent).toBe(message);
        done();
      }, 150);
    });

    it('should clear messages after timeout', (done) => {
      const message = 'Test timeout message';
      
      accessibilityService.announce(message, 'polite', 500);
      
      setTimeout(() => {
        const announcer = document.getElementById('accessibility-announcer-polite');
        expect(announcer.textContent).toBe('');
        done();
      }, 600);
    });

    it('should not announce empty messages', () => {
      accessibilityService.announce('');
      accessibilityService.announce(null);
      accessibilityService.announce(undefined);
      
      const politeAnnouncer = document.getElementById('accessibility-announcer-polite');
      const assertiveAnnouncer = document.getElementById('accessibility-announcer-assertive');
      
      expect(politeAnnouncer.textContent).toBe('');
      expect(assertiveAnnouncer.textContent).toBe('');
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(async () => {
      await accessibilityService.initialize();
      
      // Set up test DOM
      document.body.innerHTML = `
        <main id="main-content">
          <nav id="main-navigation">Navigation</nav>
          <div class="modal" aria-hidden="true">
            <button class="modal-close">Close</button>
          </div>
          <div class="dropdown">
            <button aria-expanded="false">Dropdown</button>
          </div>
        </main>
      `;
    });

    it('should handle Escape key for modals', () => {
      const modal = document.querySelector('.modal');
      const closeButton = document.querySelector('.modal-close');
      modal.setAttribute('aria-hidden', 'false');
      
      const clickSpy = vi.fn();
      closeButton.addEventListener('click', clickSpy);
      
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);
      
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should handle Escape key for dropdowns', () => {
      const dropdown = document.querySelector('.dropdown');
      const trigger = dropdown.querySelector('button');
      dropdown.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
      
      const focusSpy = vi.spyOn(trigger, 'focus');
      
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);
      
      expect(dropdown.classList.contains('open')).toBe(false);
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should handle F6 navigation between landmarks', async () => {
      document.body.innerHTML = `
        <header tabindex="-1">Header</header>
        <nav tabindex="-1">Navigation</nav>
        <main tabindex="-1">Main Content</main>
        <aside tabindex="-1">Sidebar</aside>
        <footer tabindex="-1">Footer</footer>
      `;

      // Initialize the service to set up event listeners
      await accessibilityService.initialize();

      const nav = document.querySelector('nav');
      const main = document.querySelector('main');
      
      // Focus nav first
      nav.focus();
      
      const f6Event = new KeyboardEvent('keydown', { 
        key: 'F6',
        bubbles: true,
        cancelable: true
      });
      
      const focusSpy = vi.spyOn(main, 'focus');
      document.dispatchEvent(f6Event);
      
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should add keyboard navigation class on keydown', () => {
      const keydownEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      document.dispatchEvent(keydownEvent);
      
      expect(document.body.classList.contains('keyboard-navigation')).toBe(true);
      expect(accessibilityService.preferences.keyboardOnly).toBe(true);
    });

    it('should remove keyboard navigation class on mousedown', () => {
      document.body.classList.add('keyboard-navigation');
      accessibilityService.preferences.keyboardOnly = true;
      
      const mousedownEvent = new MouseEvent('mousedown');
      document.dispatchEvent(mousedownEvent);
      
      expect(document.body.classList.contains('keyboard-navigation')).toBe(false);
      expect(accessibilityService.preferences.keyboardOnly).toBe(false);
    });
  });

  describe('Focus Management', () => {
    beforeEach(async () => {
      await accessibilityService.initialize();
    });

    it('should ensure focused elements are visible', () => {
      const button = document.createElement('button');
      button.textContent = 'Test Button';
      document.body.appendChild(button);
      
      // Mock getBoundingClientRect to simulate element outside viewport
      vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
        top: -100,
        bottom: -50,
        left: 0,
        right: 100
      });
      
      const scrollSpy = vi.spyOn(button, 'scrollIntoView');
      
      const focusEvent = new FocusEvent('focusin', { bubbles: true });
      Object.defineProperty(focusEvent, 'target', {
        value: button,
        configurable: true
      });
      document.dispatchEvent(focusEvent);
      
      expect(scrollSpy).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    });

    it('should use auto scroll behavior when reduced motion is enabled', () => {
      accessibilityService.preferences.reducedMotion = true;
      
      const button = document.createElement('button');
      button.textContent = 'Test Button';
      document.body.appendChild(button);
      
      vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
        top: 1000,
        bottom: 1050,
        left: 0,
        right: 100
      });
      
      const scrollSpy = vi.spyOn(button, 'scrollIntoView');
      
      const focusEvent = new FocusEvent('focusin', { bubbles: true });
      Object.defineProperty(focusEvent, 'target', {
        value: button,
        configurable: true
      });
      document.dispatchEvent(focusEvent);
      
      expect(scrollSpy).toHaveBeenCalledWith({
        behavior: 'auto',
        block: 'center',
        inline: 'nearest'
      });
    });

    it('should create focus trap', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      
      const focusTrap = accessibilityService.createFocusTrap(container);
      
      expect(focusTrap).toBeTruthy();
      expect(focusTrap.container).toBe(container);
    });
  });

  describe('Preference Management', () => {
    beforeEach(async () => {
      await accessibilityService.initialize();
    });

    it('should update preferences and apply changes', () => {
      accessibilityService.updatePreference('reducedMotion', true);
      
      expect(accessibilityService.preferences.reducedMotion).toBe(true);
      expect(document.body.classList.contains('reduce-motion')).toBe(true);
    });

    it('should save preferences to localStorage', async () => {
      await accessibilityService.initialize();
      
      // Verify initial state
      expect(accessibilityService.preferences.highContrast).toBe(false);
      
      accessibilityService.updatePreference('highContrast', true);
      
      // Verify the preference was updated
      expect(accessibilityService.preferences.highContrast).toBe(true);
      
      const savedString = localStorage.getItem('accessibility-preferences');
      expect(savedString).toBeTruthy();
      
      if (savedString) {
        const saved = JSON.parse(savedString);
        expect(saved.highContrast).toBe(true);
      }
    });

    it('should load saved preferences', () => {
      const preferences = {
        reducedMotion: true,
        highContrast: true,
        largeText: true,
        screenReader: false,
        keyboardOnly: false
      };
      
      localStorage.setItem('accessibility-preferences', JSON.stringify(preferences));
      
      // Create new instance to test loading on initialization
      const newService = new AccessibilityService();
      newService.loadSavedPreferences();
      
      expect(newService.preferences.reducedMotion).toBe(true);
      expect(newService.preferences.highContrast).toBe(true);
      expect(newService.preferences.largeText).toBe(true);
    });

    it('should get current preferences', () => {
      accessibilityService.preferences.reducedMotion = true;
      accessibilityService.preferences.highContrast = false;
      
      const preferences = accessibilityService.getPreferences();
      
      expect(preferences.reducedMotion).toBe(true);
      expect(preferences.highContrast).toBe(false);
      expect(preferences).not.toBe(accessibilityService.preferences); // Should be a copy
    });
  });

  describe('Theme Application', () => {
    beforeEach(async () => {
      await accessibilityService.initialize();
    });

    it('should apply reduced motion preference', () => {
      accessibilityService.preferences.reducedMotion = true;
      accessibilityService.applyMotionPreferences();
      
      expect(document.body.classList.contains('reduce-motion')).toBe(true);
    });

    it('should apply high contrast preference', () => {
      accessibilityService.preferences.highContrast = true;
      accessibilityService.applyContrastPreferences();
      
      expect(document.body.classList.contains('high-contrast')).toBe(true);
    });

    it('should apply large text preference', () => {
      accessibilityService.preferences.largeText = true;
      accessibilityService.applyTextPreferences();
      
      expect(document.body.classList.contains('large-text')).toBe(true);
    });

    it('should apply dark mode preference', () => {
      accessibilityService.preferences.darkMode = true;
      accessibilityService.applyColorSchemePreferences();
      
      expect(document.body.classList.contains('dark-theme')).toBe(true);
    });
  });

  describe('Color Contrast Testing', () => {
    it('should calculate contrast ratio correctly', () => {
      // Black text on white background
      const contrast1 = accessibilityService.checkContrast('#000000', '#ffffff');
      expect(contrast1.ratio).toBeCloseTo(21, 1);
      expect(contrast1.isAAA).toBe(true);
      
      // White text on black background
      const contrast2 = accessibilityService.checkContrast('#ffffff', '#000000');
      expect(contrast2.ratio).toBeCloseTo(21, 1);
      expect(contrast2.isAAA).toBe(true);
      
      // Low contrast example
      const contrast3 = accessibilityService.checkContrast('#888888', '#ffffff');
      expect(contrast3.ratio).toBeLessThan(4.5);
      expect(contrast3.isAA).toBe(false);
    });

    it('should convert hex colors to RGB', () => {
      const rgb = accessibilityService.hexToRgb('#ff0000');
      expect(rgb).toEqual({ r: 255, g: 0, b: 0 });
      
      const rgbWithoutHash = accessibilityService.hexToRgb('00ff00');
      expect(rgbWithoutHash).toEqual({ r: 0, g: 255, b: 0 });
      
      const invalidHex = accessibilityService.hexToRgb('invalid');
      expect(invalidHex).toBeNull();
    });

    it('should calculate luminance correctly', () => {
      const whiteLuminance = accessibilityService.getLuminance('#ffffff');
      expect(whiteLuminance).toBeCloseTo(1, 2);
      
      const blackLuminance = accessibilityService.getLuminance('#000000');
      expect(blackLuminance).toBeCloseTo(0, 2);
    });
  });

  describe('Form Enhancement', () => {
    it('should create accessible form', () => {
      const form = document.createElement('form');
      document.body.appendChild(form);
      
      const accessibleForm = accessibilityService.enhanceForm(form);
      
      expect(accessibleForm).toBeTruthy();
      expect(accessibleForm.form).toBe(form);
    });
  });

  describe('Navigation Helpers', () => {
    beforeEach(async () => {
      await accessibilityService.initialize();
      
      document.body.innerHTML = `
        <main id="main-content">Main Content</main>
        <footer>Footer Content</footer>
      `;
    });

    it('should navigate to top of page', async () => {
      document.body.innerHTML = '<main id="main-content" tabindex="-1">Content</main>';
      
      // Initialize the service to set up event listeners
      await accessibilityService.initialize();
      
      const main = document.getElementById('main-content');
      const focusSpy = vi.spyOn(main, 'focus');
      const scrollSpy = vi.spyOn(main, 'scrollIntoView');
      
      const preventDefaultSpy = vi.fn();
      const event = new KeyboardEvent('keydown', { 
        key: 'Home', 
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });
      event.preventDefault = preventDefaultSpy;
      
      document.dispatchEvent(event);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalled();
      expect(scrollSpy).toHaveBeenCalled();
    });

    it('should navigate to bottom of page', async () => {
      document.body.innerHTML = '<footer tabindex="-1">Footer Content</footer>';
      
      // Initialize the service to set up event listeners
      await accessibilityService.initialize();
      
      const footer = document.querySelector('footer');
      const focusSpy = vi.spyOn(footer, 'focus');
      const scrollSpy = vi.spyOn(footer, 'scrollIntoView');
      
      const preventDefaultSpy = vi.fn();
      const event = new KeyboardEvent('keydown', { 
        key: 'End', 
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });
      event.preventDefault = preventDefaultSpy;
      
      document.dispatchEvent(event);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalled();
      expect(scrollSpy).toHaveBeenCalled();
    });
  });

  describe('Landmark Detection', () => {
    it('should get landmark name from aria-label', () => {
      const nav = document.createElement('nav');
      nav.setAttribute('aria-label', 'Main navigation');
      
      const landmarkName = accessibilityService.getLandmarkName(nav);
      expect(landmarkName).toBe('Main navigation');
    });

    it('should get landmark name from aria-labelledby', () => {
      const heading = document.createElement('h2');
      heading.id = 'nav-heading';
      heading.textContent = 'Site Navigation';
      document.body.appendChild(heading);
      
      const nav = document.createElement('nav');
      nav.setAttribute('aria-labelledby', 'nav-heading');
      
      const landmarkName = accessibilityService.getLandmarkName(nav);
      expect(landmarkName).toBe('Site Navigation');
    });

    it('should get landmark name from tag name', () => {
      const main = document.createElement('main');
      
      const landmarkName = accessibilityService.getLandmarkName(main);
      expect(landmarkName).toBe('main content');
    });
  });

  describe('Screen Reader Detection', () => {
    it('should detect screen reader indicators', () => {
      // Mock user agent
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 NVDA'
      });
      
      const isScreenReader = accessibilityService.detectScreenReader();
      expect(isScreenReader).toBe(true);
    });

    it('should handle errors in screen reader detection', () => {
      // Save original speechSynthesis
      const originalSpeechSynthesis = window.speechSynthesis;
      
      // Mock speechSynthesis to throw error
      Object.defineProperty(window, 'speechSynthesis', {
        get: () => {
          throw new Error('Not available');
        },
        configurable: true
      });
      
      const isScreenReader = accessibilityService.detectScreenReader();
      expect(typeof isScreenReader).toBe('boolean');
      
      // Restore original speechSynthesis
      Object.defineProperty(window, 'speechSynthesis', {
        value: originalSpeechSynthesis,
        writable: true,
        configurable: true
      });
    });
  });

  describe('Cleanup', () => {
    it('should clean up properly on destroy', async () => {
      await accessibilityService.initialize();
      
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      
      accessibilityService.destroy();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', accessibilityService.handleKeydown);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('focusin', accessibilityService.handleFocusIn);
      
      // Check announcers are removed
      expect(document.getElementById('accessibility-announcer-polite')).toBeFalsy();
      expect(document.getElementById('accessibility-announcer-assertive')).toBeFalsy();
      
      // Check skip links are removed
      expect(document.querySelector('.skip-links')).toBeFalsy();
    });
  });

  describe('Media Query Handling', () => {
    it('should handle media query changes', async () => {
      await accessibilityService.initialize();
      
      // Simulate reduced motion change
      const mediaQuery = {
        matches: true,
        media: '(prefers-reduced-motion: reduce)'
      };
      
      accessibilityService.handleMediaChange(mediaQuery);
      
      expect(accessibilityService.preferences.reducedMotion).toBe(true);
      expect(document.body.classList.contains('reduce-motion')).toBe(true);
    });

    it('should handle contrast preference changes', async () => {
      await accessibilityService.initialize();
      
      const mediaQuery = {
        matches: true,
        media: '(prefers-contrast: high)'
      };
      
      accessibilityService.handleMediaChange(mediaQuery);
      
      expect(accessibilityService.preferences.highContrast).toBe(true);
      expect(document.body.classList.contains('high-contrast')).toBe(true);
    });

    it('should handle color scheme changes', async () => {
      await accessibilityService.initialize();
      
      const mediaQuery = {
        matches: true,
        media: '(prefers-color-scheme: dark)'
      };
      
      accessibilityService.handleMediaChange(mediaQuery);
      
      expect(accessibilityService.preferences.darkMode).toBe(true);
      expect(document.body.classList.contains('dark-theme')).toBe(true);
    });
  });
});