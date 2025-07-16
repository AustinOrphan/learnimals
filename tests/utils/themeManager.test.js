import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock theme registry
const mockThemeRegistry = {
  COMMON_COLORS: {
    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent'
  },
  THEME_BASE_COLORS: {
    light: {
      primary: '#ffffff',
      secondary: '#f8f9fa'
    },
    dark: {
      primary: '#1a1a1a',
      secondary: '#2d2d2d'
    }
  },
  THEME_COLORS: {
    default: {
      light: {
        primary: '#007bff',
        secondary: '#6c757d'
      },
      dark: {
        primary: '#0056b3',
        secondary: '#5a6268'
      }
    },
    nature: {
      light: {
        primary: '#28a745',
        secondary: '#20c997'
      },
      dark: {
        primary: '#1e7e34',
        secondary: '#17a2b8'
      }
    }
  },
  THEME_DEFINITIONS: {
    default: {
      name: 'Default',
      description: 'Default theme'
    },
    nature: {
      name: 'Nature',
      description: 'Nature theme'
    }
  }
};

const mockThemeManagerUtils = {
  applyColors: vi.fn(),
  setSemanticVariables: vi.fn(),
  updateMetaThemeColor: vi.fn(),
  getPreferredColorScheme: vi.fn().mockReturnValue('light')
};

// Mock modules
vi.mock('../../src/utils/themeRegistry.js', () => mockThemeRegistry);
vi.mock('../../src/utils/themeManagerUtils.js', () => mockThemeManagerUtils);

// Mock DOM
const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;
global.matchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock;

// Mock CustomEvent
global.CustomEvent = dom.window.CustomEvent;

describe('ThemeManager', () => {
  let ThemeManager;
  let themeManager;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Reset localStorage to ensure clean state
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
    localStorageMock.clear.mockImplementation(() => {});
    
    // Reset DOM
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    
    // Ensure light mode is preferred
    mockThemeManagerUtils.getPreferredColorScheme.mockReturnValue('light');
    
    // Import ThemeManager after setting up mocks
    const module = await import('../../src/utils/themeManager.js');
    ThemeManager = module.default;
  });

  afterEach(() => {
    if (themeManager) {
      // Clean up if needed
    }
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with default theme', () => {
      themeManager = new ThemeManager();
      
      expect(themeManager.currentTheme.name).toBe('default');
      expect(themeManager.currentTheme.mode).toBe('light');
      expect(themeManager.commonColors).toEqual(mockThemeRegistry.COMMON_COLORS);
      expect(themeManager.themeColors).toEqual(mockThemeRegistry.THEME_COLORS);
    });

    it('should load saved theme preferences', () => {
      localStorageMock.getItem
        .mockReturnValueOnce('nature')  // theme name
        .mockReturnValueOnce('dark');   // theme mode
      
      themeManager = new ThemeManager();
      
      expect(themeManager.currentTheme.name).toBe('nature');
      expect(themeManager.currentTheme.mode).toBe('dark');
    });

    it('should fallback to system preference when no saved theme', () => {
      localStorageMock.getItem.mockReturnValue(null);
      mockThemeManagerUtils.getPreferredColorScheme.mockReturnValue('dark');
      
      themeManager = new ThemeManager();
      
      expect(themeManager.currentTheme.mode).toBe('dark');
    });

    it('should ignore invalid saved theme names', () => {
      localStorageMock.getItem
        .mockReturnValueOnce('invalid-theme')
        .mockReturnValueOnce('light');
      
      themeManager = new ThemeManager();
      
      expect(themeManager.currentTheme.name).toBe('default');
    });

    it('should ignore invalid saved theme modes', () => {
      localStorageMock.getItem
        .mockReturnValueOnce('nature')
        .mockReturnValueOnce('invalid-mode');
      
      themeManager = new ThemeManager();
      
      expect(themeManager.currentTheme.mode).toBe('light');
    });
  });

  describe('Theme Application', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should apply current theme on initialization', () => {
      expect(mockThemeManagerUtils.applyColors).toHaveBeenCalled();
      expect(mockThemeManagerUtils.setSemanticVariables).toHaveBeenCalled();
      expect(mockThemeManagerUtils.updateMetaThemeColor).toHaveBeenCalled();
    });

    it('should apply theme when switched', () => {
      vi.clearAllMocks();
      
      themeManager.switchTheme('nature');
      
      expect(mockThemeManagerUtils.applyColors).toHaveBeenCalled();
      expect(mockThemeManagerUtils.setSemanticVariables).toHaveBeenCalled();
      expect(mockThemeManagerUtils.updateMetaThemeColor).toHaveBeenCalled();
    });
  });

  describe('Theme Switching', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should switch to valid theme', () => {
      themeManager.switchTheme('nature');
      
      expect(themeManager.currentTheme.name).toBe('nature');
      expect(localStorage.setItem).toHaveBeenCalledWith('learnimals-theme-name', 'nature');
    });

    it('should not switch to invalid theme', () => {
      const originalTheme = themeManager.currentTheme.name;
      
      themeManager.switchTheme('invalid-theme');
      
      expect(themeManager.currentTheme.name).toBe(originalTheme);
      expect(localStorage.setItem).not.toHaveBeenCalledWith('learnimals-theme-name', 'invalid-theme');
    });

    it('should switch theme mode', () => {
      themeManager.switchMode('dark');
      
      expect(themeManager.currentTheme.mode).toBe('dark');
      expect(localStorage.setItem).toHaveBeenCalledWith('learnimals-theme-mode', 'dark');
    });

    it('should not switch to invalid mode', () => {
      const originalMode = themeManager.currentTheme.mode;
      
      themeManager.switchMode('invalid-mode');
      
      expect(themeManager.currentTheme.mode).toBe(originalMode);
      expect(localStorage.setItem).not.toHaveBeenCalledWith('learnimals-theme-mode', 'invalid-mode');
    });

    it('should toggle between light and dark modes', () => {
      themeManager.currentTheme.mode = 'light';
      
      themeManager.toggleMode();
      expect(themeManager.currentTheme.mode).toBe('dark');
      
      themeManager.toggleMode();
      expect(themeManager.currentTheme.mode).toBe('light');
    });
  });

  describe('Theme Information', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should get current theme', () => {
      const currentTheme = themeManager.getCurrentTheme();
      
      expect(currentTheme.name).toBe('default');
      expect(currentTheme.mode).toBe('light');
    });

    it('should get available themes', () => {
      const availableThemes = themeManager.getAvailableThemes();
      
      expect(availableThemes).toEqual(['default', 'nature']);
    });

    it('should get theme definition', () => {
      const themeDefinition = themeManager.getThemeDefinition('nature');
      
      expect(themeDefinition).toEqual({
        name: 'Nature',
        description: 'Nature theme'
      });
    });

    it('should return null for invalid theme definition', () => {
      const themeDefinition = themeManager.getThemeDefinition('invalid-theme');
      
      expect(themeDefinition).toBeNull();
    });

    it('should check if theme is dark', () => {
      themeManager.currentTheme.mode = 'dark';
      expect(themeManager.isDarkMode()).toBe(true);
      
      themeManager.currentTheme.mode = 'light';
      expect(themeManager.isDarkMode()).toBe(false);
    });
  });

  describe('System Preference Changes', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should listen for system preference changes', () => {
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });

    it('should respond to system preference changes when no explicit mode set', () => {
      localStorageMock.getItem.mockImplementation(key => {
        if (key === 'learnimals-theme-mode') return null; // No explicit mode set
        return null;
      });
      
      const mockMediaQuery = {
        matches: true,
        addEventListener: vi.fn()
      };
      window.matchMedia.mockReturnValue(mockMediaQuery);
      
      themeManager = new ThemeManager();
      
      // Get the event listener that was added
      const changeListener = mockMediaQuery.addEventListener.mock.calls[0][1];
      
      // Simulate system preference change to dark
      changeListener({ matches: true });
      
      expect(themeManager.currentTheme.mode).toBe('dark');
    });

    it('should not respond to system preference changes when explicit mode set', () => {
      localStorageMock.getItem.mockImplementation(key => {
        if (key === 'learnimals-theme-mode') return 'light'; // Explicit mode set
        return null;
      });
      
      const mockMediaQuery = {
        matches: true,
        addEventListener: vi.fn()
      };
      window.matchMedia.mockReturnValue(mockMediaQuery);
      
      themeManager = new ThemeManager();
      
      // Get the event listener that was added
      const changeListener = mockMediaQuery.addEventListener.mock.calls[0][1];
      
      // Simulate system preference change to dark
      changeListener({ matches: true });
      
      // Should remain light because explicit mode was set
      expect(themeManager.currentTheme.mode).toBe('light');
    });
  });

  describe('Event Emission', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should emit themeChanged event on theme switch', () => {
      const eventListener = vi.fn();
      document.addEventListener('themeChanged', eventListener);
      
      themeManager.switchTheme('nature');
      
      expect(eventListener).toHaveBeenCalled();
      expect(eventListener.mock.calls[0][0].detail.theme).toEqual(themeManager.currentTheme);
    });

    it('should emit themeChanged event on mode switch', () => {
      const eventListener = vi.fn();
      document.addEventListener('themeChanged', eventListener);
      
      themeManager.switchMode('dark');
      
      expect(eventListener).toHaveBeenCalled();
      expect(eventListener.mock.calls[0][0].detail.theme).toEqual(themeManager.currentTheme);
    });

    it('should emit themeChanged event on mode toggle', () => {
      const eventListener = vi.fn();
      document.addEventListener('themeChanged', eventListener);
      
      themeManager.toggleMode();
      
      expect(eventListener).toHaveBeenCalled();
    });
  });

  describe('Color Retrieval', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should get theme colors', () => {
      const colors = themeManager.getThemeColors('nature');
      
      expect(colors).toEqual(mockThemeRegistry.THEME_COLORS.nature);
    });

    it('should return null for invalid theme colors', () => {
      const colors = themeManager.getThemeColors('invalid-theme');
      
      expect(colors).toBeNull();
    });

    it('should get base colors for mode', () => {
      const colors = themeManager.getBaseColors('dark');
      
      expect(colors).toEqual(mockThemeRegistry.THEME_BASE_COLORS.dark);
    });

    it('should return null for invalid base colors', () => {
      const colors = themeManager.getBaseColors('invalid-mode');
      
      expect(colors).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing matchMedia', () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = undefined;
      
      expect(() => {
        themeManager = new ThemeManager();
      }).not.toThrow();
      
      window.matchMedia = originalMatchMedia;
    });

    it('should handle localStorage errors', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('LocalStorage error');
      });
      
      expect(() => {
        themeManager = new ThemeManager();
      }).not.toThrow();
    });

    it('should handle invalid JSON in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');
      
      expect(() => {
        themeManager = new ThemeManager();
      }).not.toThrow();
    });
  });

  describe('Reset Functionality', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should reset theme to default', () => {
      themeManager.switchTheme('nature');
      themeManager.switchMode('dark');
      
      themeManager.resetTheme();
      
      expect(themeManager.currentTheme.name).toBe('default');
      expect(themeManager.currentTheme.mode).toBe('light');
      expect(localStorage.removeItem).toHaveBeenCalledWith('learnimals-theme-name');
      expect(localStorage.removeItem).toHaveBeenCalledWith('learnimals-theme-mode');
    });
  });
});