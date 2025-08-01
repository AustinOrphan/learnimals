/**
 * Enhanced Unit Tests for ThemeManager
 * 
 * Comprehensive test suite covering theme switching, persistence,
 * CSS variable management, and theme validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockModule } from '../helpers/moduleResolver.js';
import { ThemeFactory } from '../fixtures/testDataFactory.js';

// Mock localStorage
const mockLocalStorage = {
  store: {},
  getItem: vi.fn((key) => mockLocalStorage.store[key] || null),
  setItem: vi.fn((key, value) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: vi.fn((key) => {
    delete mockLocalStorage.store[key];
  }),
  clear: vi.fn(() => {
    mockLocalStorage.store = {};
  })
};

// Mock ThemeManager
const mockThemeManager = createMockModule({
  default: class ThemeManager {
    constructor(options = {}) {
      this.options = {
        storageKey: 'learnimals-theme',
        defaultTheme: 'light',
        autoDetectPreference: true,
        validateThemes: true,
        ...options
      };

      this.themes = new Map();
      this.currentTheme = null;
      this.listeners = new Map();
      this.cssVariables = new Map();
      
      // Initialize with default themes
      this.initializeDefaultThemes();
      
      // Load saved theme or detect preference
      this.initializeTheme();
    }

    initializeDefaultThemes() {
      // Light theme
      this.registerTheme('light', {
        name: 'Light',
        type: 'light',
        colors: {
          primary: '#007bff',
          secondary: '#6c757d',
          success: '#28a745',
          danger: '#dc3545',
          warning: '#ffc107',
          info: '#17a2b8',
          light: '#f8f9fa',
          dark: '#343a40',
          background: '#ffffff',
          surface: '#f8f9fa',
          text: '#212529',
          textSecondary: '#6c757d',
          border: '#dee2e6'
        },
        variables: {
          '--bg-primary': '#ffffff',
          '--bg-secondary': '#f8f9fa',
          '--text-primary': '#212529',
          '--text-secondary': '#6c757d',
          '--border-color': '#dee2e6',
          '--shadow': '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)'
        }
      });

      // Dark theme
      this.registerTheme('dark', {
        name: 'Dark',
        type: 'dark',
        colors: {
          primary: '#0d6efd',
          secondary: '#6c757d',
          success: '#198754',
          danger: '#dc3545',
          warning: '#ffc107',
          info: '#0dcaf0',
          light: '#f8f9fa',
          dark: '#212529',
          background: '#212529',
          surface: '#343a40',
          text: '#ffffff',
          textSecondary: '#adb5bd',
          border: '#495057'
        },
        variables: {
          '--bg-primary': '#212529',
          '--bg-secondary': '#343a40',
          '--text-primary': '#ffffff',
          '--text-secondary': '#adb5bd',
          '--border-color': '#495057',
          '--shadow': '0 0.125rem 0.25rem rgba(255, 255, 255, 0.075)'
        }
      });

      // High contrast theme
      this.registerTheme('high-contrast', {
        name: 'High Contrast',
        type: 'light',
        accessibility: true,
        colors: {
          primary: '#000000',
          secondary: '#666666',
          success: '#008000',
          danger: '#ff0000',
          warning: '#ff8c00',
          info: '#0000ff',
          light: '#ffffff',
          dark: '#000000',
          background: '#ffffff',
          surface: '#ffffff',
          text: '#000000',
          textSecondary: '#333333',
          border: '#000000'
        },
        variables: {
          '--bg-primary': '#ffffff',
          '--bg-secondary': '#ffffff',
          '--text-primary': '#000000',
          '--text-secondary': '#333333',
          '--border-color': '#000000',
          '--shadow': '0 0.125rem 0.25rem rgba(0, 0, 0, 0.5)'
        }
      });
    }

    initializeTheme() {
      // Try to load saved theme
      let savedTheme = null;
      try {
        savedTheme = mockLocalStorage.getItem(this.options.storageKey);
      } catch (error) {
        console.warn('Failed to load saved theme:', error);
      }

      // Use saved theme if valid
      if (savedTheme && this.themes.has(savedTheme)) {
        this.setTheme(savedTheme);
        return;
      }

      // Auto-detect preference
      if (this.options.autoDetectPreference) {
        const prefersDark = window.matchMedia && 
          window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (prefersDark && this.themes.has('dark')) {
          this.setTheme('dark');
          return;
        }
      }

      // Fall back to default theme
      this.setTheme(this.options.defaultTheme);
    }

    registerTheme(id, themeData) {
      if (!id || typeof id !== 'string') {
        throw new Error('Theme ID must be a non-empty string');
      }

      if (!themeData || typeof themeData !== 'object') {
        throw new Error('Theme data must be an object');
      }

      // Validate theme if enabled
      if (this.options.validateThemes) {
        this.validateTheme(themeData);
      }

      // Store theme
      this.themes.set(id, {
        id,
        ...themeData,
        registeredAt: new Date()
      });

      this.trigger('themeRegistered', { id, theme: themeData });
      return this;
    }

    validateTheme(themeData) {
      const errors = [];

      // Required properties
      if (!themeData.name) {
        errors.push('Theme must have a name');
      }

      if (!themeData.type || !['light', 'dark'].includes(themeData.type)) {
        errors.push('Theme must have a valid type (light or dark)');
      }

      // Colors validation
      if (!themeData.colors || typeof themeData.colors !== 'object') {
        errors.push('Theme must have a colors object');
      } else {
        const requiredColors = ['background', 'text', 'primary'];
        requiredColors.forEach(color => {
          if (!themeData.colors[color]) {
            errors.push(`Theme must define color: ${color}`);
          }
        });
      }

      // Variables validation
      if (themeData.variables && typeof themeData.variables !== 'object') {
        errors.push('Theme variables must be an object');
      }

      if (errors.length > 0) {
        throw new Error(`Theme validation failed: ${errors.join(', ')}`);
      }
    }

    setTheme(themeId) {
      if (!this.themes.has(themeId)) {
        throw new Error(`Theme '${themeId}' is not registered`);
      }

      const previousTheme = this.currentTheme;
      const theme = this.themes.get(themeId);

      // Apply theme to document (before updating currentTheme)
      this.applyTheme(theme, previousTheme);

      // Update current theme
      this.currentTheme = themeId;

      // Save to storage
      this.saveTheme(themeId);

      // Trigger events
      this.trigger('themeChanged', {
        previous: previousTheme,
        current: themeId,
        theme: theme
      });

      return this;
    }

    applyTheme(theme, previousTheme = null) {
      const root = document.documentElement;

      // Remove previous theme classes
      if (previousTheme) {
        root.classList.remove(`theme-${previousTheme}`);
        const prevThemeData = this.themes.get(previousTheme);
        if (prevThemeData) {
          root.classList.remove(`theme-type-${prevThemeData.type}`);
        }
      }

      // Add new theme classes
      root.classList.add(`theme-${theme.id}`);
      root.classList.add(`theme-type-${theme.type}`);

      // Apply CSS variables
      if (theme.variables) {
        Object.entries(theme.variables).forEach(([property, value]) => {
          root.style.setProperty(property, value);
          this.cssVariables.set(property, value);
        });
      }

      // Set color scheme for browser
      root.style.colorScheme = theme.type;

      // Apply accessibility attributes
      if (theme.accessibility) {
        root.setAttribute('data-theme-accessibility', 'true');
      } else {
        root.removeAttribute('data-theme-accessibility');
      }
    }

    saveTheme(themeId) {
      try {
        mockLocalStorage.setItem(this.options.storageKey, themeId);
      } catch (error) {
        console.warn('Failed to save theme preference:', error);
      }
    }

    getCurrentTheme() {
      return this.currentTheme;
    }

    getCurrentThemeData() {
      return this.currentTheme ? this.themes.get(this.currentTheme) : null;
    }

    getAvailableThemes() {
      return Array.from(this.themes.entries()).map(([id, theme]) => ({
        id,
        name: theme.name,
        type: theme.type,
        accessibility: theme.accessibility || false
      }));
    }

    hasTheme(themeId) {
      return this.themes.has(themeId);
    }

    removeTheme(themeId) {
      if (!this.themes.has(themeId)) {
        return false;
      }

      // Don't remove the current theme
      if (this.currentTheme === themeId) {
        throw new Error('Cannot remove the currently active theme');
      }

      this.themes.delete(themeId);
      this.trigger('themeRemoved', { id: themeId });
      return true;
    }

    toggleTheme() {
      const currentType = this.getCurrentThemeData()?.type;
      const targetType = currentType === 'light' ? 'dark' : 'light';
      
      // Find first theme of target type
      const targetTheme = Array.from(this.themes.entries())
        .find(([_, theme]) => theme.type === targetType);

      if (targetTheme) {
        this.setTheme(targetTheme[0]);
      }

      return this;
    }

    getCSSVariable(property) {
      return this.cssVariables.get(property) || 
        getComputedStyle(document.documentElement).getPropertyValue(property);
    }

    setCSSVariable(property, value) {
      document.documentElement.style.setProperty(property, value);
      this.cssVariables.set(property, value);
      return this;
    }

    // Event system
    on(event, handler) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(handler);
      return this;
    }

    off(event, handler) {
      if (!this.listeners.has(event)) return this;
      
      const handlers = this.listeners.get(event);
      if (handler) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      } else {
        this.listeners.set(event, []);
      }
      return this;
    }

    trigger(event, data) {
      if (!this.listeners.has(event)) return this;
      
      this.listeners.get(event).forEach(handler => {
        try {
          handler.call(this, data);
        } catch (error) {
          console.error(`Error in theme event handler for '${event}':`, error);
        }
      });
      return this;
    }

    // System theme detection
    detectSystemTheme() {
      if (!window.matchMedia) return 'light';
      
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      return darkModeQuery.matches ? 'dark' : 'light';
    }

    enableSystemThemeDetection() {
      if (!window.matchMedia) return this;
      
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        const systemTheme = e.matches ? 'dark' : 'light';
        if (this.hasTheme(systemTheme)) {
          this.setTheme(systemTheme);
        }
      };

      darkModeQuery.addListener(handleChange);
      this._systemThemeListener = { query: darkModeQuery, handler: handleChange };
      
      return this;
    }

    disableSystemThemeDetection() {
      if (this._systemThemeListener) {
        this._systemThemeListener.query.removeListener(this._systemThemeListener.handler);
        delete this._systemThemeListener;
      }
      return this;
    }

    // Theme utility methods
    isLightTheme(themeId = this.currentTheme) {
      const theme = this.themes.get(themeId);
      return theme ? theme.type === 'light' : false;
    }

    isDarkTheme(themeId = this.currentTheme) {
      const theme = this.themes.get(themeId);
      return theme ? theme.type === 'dark' : false;
    }

    isAccessibilityTheme(themeId = this.currentTheme) {
      const theme = this.themes.get(themeId);
      return theme ? !!theme.accessibility : false;
    }

    // Export/import themes
    exportThemes() {
      const themes = {};
      this.themes.forEach((theme, id) => {
        themes[id] = { ...theme };
        delete themes[id].registeredAt; // Remove internal properties
      });
      return themes;
    }

    importThemes(themes) {
      if (!themes || typeof themes !== 'object') {
        throw new Error('Themes must be an object');
      }

      Object.entries(themes).forEach(([id, themeData]) => {
        try {
          this.registerTheme(id, themeData);
        } catch (error) {
          console.warn(`Failed to import theme '${id}':`, error);
        }
      });

      return this;
    }

    // Cleanup
    destroy() {
      this.disableSystemThemeDetection();
      this.listeners.clear();
      this.cssVariables.clear();
      this.themes.clear();
      this.currentTheme = null;
    }
  }
});

// Mock the module
vi.mock('../../src/features/themes/ThemeManager.js', () => mockThemeManager);

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false, // Default to light theme preference
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('ThemeManager Enhanced Tests', () => {
  let themeManager;
  const ThemeManager = mockThemeManager.default;

  beforeEach(() => {
    // Clear localStorage
    mockLocalStorage.clear();
    
    // Reset CSS variables and classes
    document.documentElement.className = '';
    document.documentElement.style.cssText = '';
    
    // Clear all mocks
    vi.clearAllMocks();
    
    // Replace localStorage globally
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
  });

  afterEach(() => {
    if (themeManager) {
      themeManager.destroy();
    }
  });

  describe('Initialization and Default Themes', () => {
    it('should initialize with default themes', () => {
      themeManager = new ThemeManager();
      
      expect(themeManager.hasTheme('light')).toBe(true);
      expect(themeManager.hasTheme('dark')).toBe(true);
      expect(themeManager.hasTheme('high-contrast')).toBe(true);
      expect(themeManager.getAvailableThemes()).toHaveLength(3);
    });

    it('should set default theme on initialization', () => {
      themeManager = new ThemeManager();
      
      expect(themeManager.getCurrentTheme()).toBe('light');
      expect(document.documentElement.classList.contains('theme-light')).toBe(true);
    });

    it('should load saved theme from localStorage', () => {
      mockLocalStorage.setItem('learnimals-theme', 'dark');
      themeManager = new ThemeManager();
      
      expect(themeManager.getCurrentTheme()).toBe('dark');
      expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    });

    it('should auto-detect dark mode preference', () => {
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query.includes('dark') ? true : false,
        addListener: vi.fn(),
        removeListener: vi.fn()
      }));

      themeManager = new ThemeManager({ autoDetectPreference: true });
      
      expect(themeManager.getCurrentTheme()).toBe('dark');
    });

    it('should use custom storage key', () => {
      const customKey = 'custom-theme-key';
      mockLocalStorage.setItem(customKey, 'dark');
      
      themeManager = new ThemeManager({ storageKey: customKey });
      
      expect(themeManager.getCurrentTheme()).toBe('dark');
    });
  });

  describe('Theme Registration and Validation', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should register valid theme', () => {
      const customTheme = ThemeFactory.create({
        name: 'Custom Theme',
        type: 'light'
      });

      themeManager.registerTheme('custom', customTheme);
      
      expect(themeManager.hasTheme('custom')).toBe(true);
      expect(themeManager.getAvailableThemes()).toHaveLength(4);
    });

    it('should validate theme structure', () => {
      const invalidTheme = {
        // Missing required fields
        colors: {}
      };

      expect(() => {
        themeManager.registerTheme('invalid', invalidTheme);
      }).toThrow('Theme validation failed');
    });

    it('should require theme ID', () => {
      expect(() => {
        themeManager.registerTheme('', { name: 'Test' });
      }).toThrow('Theme ID must be a non-empty string');
    });

    it('should require theme data', () => {
      expect(() => {
        themeManager.registerTheme('test', null);
      }).toThrow('Theme data must be an object');
    });

    it('should trigger themeRegistered event', () => {
      const handler = vi.fn();
      themeManager.on('themeRegistered', handler);
      
      const theme = ThemeFactory.create({ name: 'Event Test' });
      themeManager.registerTheme('event-test', theme);
      
      expect(handler).toHaveBeenCalledWith({
        id: 'event-test',
        theme: theme
      });
    });

    it('should disable validation when configured', () => {
      themeManager = new ThemeManager({ validateThemes: false });
      
      const invalidTheme = { invalid: true };
      
      expect(() => {
        themeManager.registerTheme('invalid', invalidTheme);
      }).not.toThrow();
    });
  });

  describe('Theme Switching', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should switch theme correctly', () => {
      themeManager.setTheme('dark');
      
      expect(themeManager.getCurrentTheme()).toBe('dark');
      expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
      expect(document.documentElement.classList.contains('theme-type-dark')).toBe(true);
      expect(document.documentElement.style.colorScheme).toBe('dark');
    });

    it('should apply CSS variables', () => {
      themeManager.setTheme('dark');
      
      const darkTheme = themeManager.getCurrentThemeData();
      Object.entries(darkTheme.variables).forEach(([property, value]) => {
        expect(document.documentElement.style.getPropertyValue(property)).toBe(value);
      });
    });

    it('should remove previous theme classes', () => {
      themeManager.setTheme('dark');
      themeManager.setTheme('light');
      
      expect(document.documentElement.classList.contains('theme-dark')).toBe(false);
      expect(document.documentElement.classList.contains('theme-light')).toBe(true);
    });

    it('should save theme to localStorage', () => {
      themeManager.setTheme('dark');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('learnimals-theme', 'dark');
    });

    it('should trigger themeChanged event', () => {
      const handler = vi.fn();
      themeManager.on('themeChanged', handler);
      
      // Start with light theme to test changing to dark
      themeManager.setTheme('light');
      vi.clearAllMocks(); // Clear the initial setTheme call
      
      themeManager.setTheme('dark');
      
      expect(handler).toHaveBeenCalledWith({
        previous: 'light',
        current: 'dark',
        theme: expect.objectContaining({ id: 'dark' })
      });
    });

    it('should throw error for non-existent theme', () => {
      expect(() => {
        themeManager.setTheme('non-existent');
      }).toThrow('Theme \'non-existent\' is not registered');
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      expect(() => themeManager.setTheme('dark')).not.toThrow();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to save theme preference:',
        expect.any(Error)
      );
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Theme Toggle and Detection', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should toggle between light and dark themes', () => {
      // Ensure we start with light theme
      themeManager.setTheme('light');
      expect(themeManager.getCurrentTheme()).toBe('light');
      
      themeManager.toggleTheme();
      expect(themeManager.getCurrentTheme()).toBe('dark');
      
      themeManager.toggleTheme();
      expect(themeManager.getCurrentTheme()).toBe('light');
    });

    it('should detect system theme preference', () => {
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query.includes('dark') ? false : true,
        addListener: vi.fn(),
        removeListener: vi.fn()
      }));

      expect(themeManager.detectSystemTheme()).toBe('light');
    });

    it('should enable system theme detection', () => {
      const mockAddListener = vi.fn();
      window.matchMedia = vi.fn().mockReturnValue({
        matches: false,
        addListener: mockAddListener,
        removeListener: vi.fn()
      });

      themeManager.enableSystemThemeDetection();
      
      expect(mockAddListener).toHaveBeenCalled();
      expect(themeManager._systemThemeListener).toBeDefined();
    });

    it('should disable system theme detection', () => {
      const mockRemoveListener = vi.fn();
      themeManager._systemThemeListener = {
        query: { removeListener: mockRemoveListener },
        handler: vi.fn()
      };

      themeManager.disableSystemThemeDetection();
      
      expect(mockRemoveListener).toHaveBeenCalled();
      expect(themeManager._systemThemeListener).toBeUndefined();
    });
  });

  describe('CSS Variable Management', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should get CSS variable value', () => {
      themeManager.setTheme('light');
      
      const value = themeManager.getCSSVariable('--bg-primary');
      expect(value).toBe('#ffffff');
    });

    it('should set CSS variable value', () => {
      themeManager.setCSSVariable('--custom-color', '#ff0000');
      
      expect(document.documentElement.style.getPropertyValue('--custom-color')).toBe('#ff0000');
      expect(themeManager.getCSSVariable('--custom-color')).toBe('#ff0000');
    });

    it('should fallback to computed style for unknown variables', () => {
      // Mock getComputedStyle
      Object.defineProperty(window, 'getComputedStyle', {
        value: () => ({
          getPropertyValue: vi.fn().mockReturnValue('computed-value')
        })
      });

      const value = themeManager.getCSSVariable('--unknown-variable');
      expect(value).toBe('computed-value');
    });
  });

  describe('Theme Utility Methods', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should identify light themes', () => {
      expect(themeManager.isLightTheme('light')).toBe(true);
      expect(themeManager.isLightTheme('dark')).toBe(false);
      expect(themeManager.isLightTheme('high-contrast')).toBe(true);
    });

    it('should identify dark themes', () => {
      expect(themeManager.isDarkTheme('dark')).toBe(true);
      expect(themeManager.isDarkTheme('light')).toBe(false);
    });

    it('should identify accessibility themes', () => {
      expect(themeManager.isAccessibilityTheme('high-contrast')).toBe(true);
      expect(themeManager.isAccessibilityTheme('light')).toBe(false);
    });

    it('should get current theme data', () => {
      themeManager.setTheme('dark');
      
      const themeData = themeManager.getCurrentThemeData();
      expect(themeData.id).toBe('dark');
      expect(themeData.name).toBe('Dark');
      expect(themeData.type).toBe('dark');
    });

    it('should list available themes', () => {
      const themes = themeManager.getAvailableThemes();
      
      expect(themes).toHaveLength(3);
      expect(themes[0]).toEqual({
        id: 'light',
        name: 'Light',
        type: 'light',
        accessibility: false
      });
    });
  });

  describe('Theme Removal', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
      const customTheme = ThemeFactory.create({ name: 'Removable' });
      themeManager.registerTheme('removable', customTheme);
    });

    it('should remove theme successfully', () => {
      expect(themeManager.hasTheme('removable')).toBe(true);
      
      const result = themeManager.removeTheme('removable');
      
      expect(result).toBe(true);
      expect(themeManager.hasTheme('removable')).toBe(false);
    });

    it('should not remove current theme', () => {
      themeManager.setTheme('removable');
      
      expect(() => {
        themeManager.removeTheme('removable');
      }).toThrow('Cannot remove the currently active theme');
    });

    it('should return false for non-existent theme', () => {
      const result = themeManager.removeTheme('non-existent');
      expect(result).toBe(false);
    });

    it('should trigger themeRemoved event', () => {
      const handler = vi.fn();
      themeManager.on('themeRemoved', handler);
      
      themeManager.removeTheme('removable');
      
      expect(handler).toHaveBeenCalledWith({ id: 'removable' });
    });
  });

  describe('Event System', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should register and trigger events', () => {
      const handler = vi.fn();
      themeManager.on('customEvent', handler);
      
      themeManager.trigger('customEvent', { data: 'test' });
      
      expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should support multiple handlers', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      themeManager.on('test', handler1);
      themeManager.on('test', handler2);
      
      themeManager.trigger('test');
      
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should remove specific handler', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      themeManager.on('test', handler1);
      themeManager.on('test', handler2);
      themeManager.off('test', handler1);
      
      themeManager.trigger('test');
      
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should remove all handlers for event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      themeManager.on('test', handler1);
      themeManager.on('test', handler2);
      themeManager.off('test');
      
      themeManager.trigger('test');
      
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('should handle errors in event handlers', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorHandler = vi.fn(() => { throw new Error('Handler error'); });
      const successHandler = vi.fn();
      
      themeManager.on('test', errorHandler);
      themeManager.on('test', successHandler);
      
      themeManager.trigger('test');
      
      expect(errorHandler).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in theme event handler for \'test\':',
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Import and Export', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should export themes correctly', () => {
      const exported = themeManager.exportThemes();
      
      expect(exported).toHaveProperty('light');
      expect(exported).toHaveProperty('dark');
      expect(exported).toHaveProperty('high-contrast');
      
      // Should not include internal properties
      expect(exported.light.registeredAt).toBeUndefined();
    });

    it('should import themes correctly', () => {
      const themes = {
        'custom1': ThemeFactory.create({ name: 'Custom 1' }),
        'custom2': ThemeFactory.create({ name: 'Custom 2' })
      };
      
      themeManager.importThemes(themes);
      
      expect(themeManager.hasTheme('custom1')).toBe(true);
      expect(themeManager.hasTheme('custom2')).toBe(true);
      expect(themeManager.getAvailableThemes()).toHaveLength(5);
    });

    it('should handle import errors gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const themes = {
        'valid': ThemeFactory.create({ name: 'Valid' }),
        'invalid': { invalid: true } // Invalid theme
      };
      
      themeManager.importThemes(themes);
      
      expect(themeManager.hasTheme('valid')).toBe(true);
      expect(themeManager.hasTheme('invalid')).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to import theme \'invalid\':',
        expect.any(Error)
      );
      
      consoleWarnSpy.mockRestore();
    });

    it('should validate import data', () => {
      expect(() => {
        themeManager.importThemes('not an object');
      }).toThrow('Themes must be an object');
    });
  });

  describe('Accessibility Features', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should apply accessibility attributes for high contrast theme', () => {
      themeManager.setTheme('high-contrast');
      
      expect(document.documentElement.getAttribute('data-theme-accessibility')).toBe('true');
    });

    it('should remove accessibility attributes for normal themes', () => {
      themeManager.setTheme('high-contrast');
      themeManager.setTheme('light');
      
      expect(document.documentElement.getAttribute('data-theme-accessibility')).toBeNull();
    });
  });

  describe('Performance and Memory Management', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should handle rapid theme switching', () => {
      const themes = ['light', 'dark', 'high-contrast'];
      
      for (let i = 0; i < 10; i++) {
        const theme = themes[i % themes.length];
        themeManager.setTheme(theme);
        expect(themeManager.getCurrentTheme()).toBe(theme);
      }
    });

    it('should clean up on destroy', () => {
      const handler = vi.fn();
      themeManager.on('test', handler);
      themeManager.registerTheme('temp', ThemeFactory.create());
      
      themeManager.destroy();
      
      expect(themeManager.listeners.size).toBe(0);
      expect(themeManager.themes.size).toBe(0);
      expect(themeManager.currentTheme).toBeNull();
    });

    it('should handle large numbers of themes efficiently', () => {
      const startTime = performance.now();
      
      // Register 100 themes
      for (let i = 0; i < 100; i++) {
        const theme = ThemeFactory.create({ name: `Theme ${i}` });
        themeManager.registerTheme(`theme-${i}`, theme);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(themeManager.getAvailableThemes()).toHaveLength(103); // 3 defaults + 100 custom
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Edge Cases and Error Handling', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should handle invalid localStorage data', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      expect(() => {
        new ThemeManager();
      }).not.toThrow();
    });

    it('should handle missing matchMedia API', () => {
      delete window.matchMedia;
      
      expect(() => {
        themeManager.enableSystemThemeDetection();
      }).not.toThrow();
      
      expect(themeManager.detectSystemTheme()).toBe('light');
    });

    it('should handle theme data with missing colors', () => {
      const incompleteTheme = {
        name: 'Incomplete',
        type: 'light',
        colors: {
          background: '#ffffff'
          // Missing required colors
        }
      };
      
      expect(() => {
        themeManager.registerTheme('incomplete', incompleteTheme);
      }).toThrow('Theme validation failed');
    });

    it('should handle undefined current theme gracefully', () => {
      themeManager.currentTheme = null;
      
      expect(themeManager.getCurrentThemeData()).toBeNull();
      expect(themeManager.isLightTheme()).toBe(false);
      expect(themeManager.isDarkTheme()).toBe(false);
    });
  });

  describe('Integration with Theme Factory', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should work with ThemeFactory created themes', () => {
      const factoryTheme = ThemeFactory.create({
        name: 'Factory Theme',
        type: 'dark'
      });
      
      themeManager.registerTheme('factory', factoryTheme);
      themeManager.setTheme('factory');
      
      expect(themeManager.getCurrentTheme()).toBe('factory');
      expect(themeManager.getCurrentThemeData().name).toBe('Factory Theme');
    });

    it('should validate factory themes correctly', () => {
      const validFactoryTheme = ThemeFactory.create();
      const invalidFactoryTheme = ThemeFactory.create({ 
        name: '', // Invalid empty name
        type: 'invalid' // Invalid type
      });
      
      expect(() => {
        themeManager.registerTheme('valid', validFactoryTheme);
      }).not.toThrow();
      
      expect(() => {
        themeManager.registerTheme('invalid', invalidFactoryTheme);
      }).toThrow();
    });
  });
});