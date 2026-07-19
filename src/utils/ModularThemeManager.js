// Modular Theme Manager for Learnimals
// Extends existing ThemeManager with module registration capabilities and ES6 module support

import ThemeManager from './themeManager.js';
import ModuleRegistry from './ModuleRegistry.js';

class ModularThemeManager extends ThemeManager {
  constructor(options = {}) {
    super();

    // Module-specific options
    this.moduleOptions = {
      autoRegisterThemes: options.autoRegisterThemes !== false,
      enableModuleIntegration: options.enableModuleIntegration !== false,
      debugMode: options.debugMode || false,
      ...options,
    };

    // Module registry integration
    this.moduleRegistry = null;
    this.moduleThemes = new Map();
    this.themeModules = new Map();

    // Initialize module system
    if (this.moduleOptions.enableModuleIntegration) {
      this.initializeModuleSystem();
    }
  }

  /**
   * Initialize the module system integration
   */
  initializeModuleSystem() {
    try {
      // Get or create global module registry
      this.moduleRegistry = this.getModuleRegistry();

      // Register this theme manager as a module
      if (this.moduleOptions.autoRegisterThemes) {
        this.registerAsModule();
      }

      // Listen for theme-related module registrations
      if (this.moduleRegistry && typeof this.moduleRegistry.on === 'function') {
        this.moduleRegistry.on('moduleRegistered', event => {
          this.handleModuleRegistration(event);
        });
      }
    } catch (error) {
      if (this.moduleOptions.debugMode) {
        console.warn('Module system initialization failed for ModularThemeManager:', error);
      }
      // Continue without module features rather than failing
    }
  }

  /**
   * Get or create the global module registry
   * @returns {ModuleRegistry} - Module registry instance
   */
  getModuleRegistry() {
    // Try to get existing global registry
    if (typeof window !== 'undefined' && window.LearnimalsModuleRegistry) {
      return window.LearnimalsModuleRegistry;
    }

    // Create new registry if none exists
    const registry = new ModuleRegistry({
      debugMode: this.moduleOptions.debugMode,
      strictMode: false, // Allow flexible registration during migration
    });

    // Store globally for sharing across components
    if (typeof window !== 'undefined') {
      window.LearnimalsModuleRegistry = registry;
    }

    return registry;
  }

  /**
   * Register this theme manager as a module
   */
  registerAsModule() {
    if (!this.moduleRegistry) return false;

    try {
      return this.moduleRegistry.register('ModularThemeManager', this, {
        type: 'service',
        version: '1.0.0',
        dependencies: [],
        metadata: {
          className: 'ModularThemeManager',
          description: 'Modular theme management system',
          capabilities: ['theme-switching', 'module-theme-registration', 'persistence'],
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      if (this.moduleOptions.debugMode) {
        console.warn('Failed to register ModularThemeManager as module:', error);
      }
      return false;
    }
  }

  /**
   * Handle module registration events
   * @param {Object} event - Module registration event
   */
  handleModuleRegistration(event) {
    const { moduleName, module: _module, options } = event;

    // Check if this module provides themes
    if (options && options.type === 'theme' && options.themes) {
      this.registerModuleThemes(moduleName, options.themes);
    }

    // Check if module has theme requirements
    if (options && options.themeRequirements) {
      this.handleThemeRequirements(moduleName, options.themeRequirements);
    }
  }

  /**
   * Register a theme from a module
   * @param {string} name - Theme name
   * @param {Object} themeModule - Theme module
   * @param {Object} options - Registration options
   * @returns {boolean} - Registration success
   */
  registerTheme(name, themeModule, options = {}) {
    // Call parent registerTheme if it's a simple color set
    if (themeModule.light && themeModule.dark && !themeModule.module) {
      return super.registerTheme(name, themeModule);
    }

    // Handle module-based theme registration
    try {
      let colorSet;

      if (typeof themeModule === 'function') {
        // Theme module is a function that returns color set
        colorSet = themeModule();
      } else if (themeModule.getThemeColors) {
        // Theme module has a getThemeColors method
        colorSet = themeModule.getThemeColors();
      } else if (themeModule.colors) {
        // Theme module has a colors property
        colorSet = themeModule.colors;
      } else {
        // Try to use module directly as color set
        colorSet = themeModule;
      }

      if (!colorSet || !colorSet.light || !colorSet.dark) {
        throw new Error('Invalid theme color set: must have light and dark modes');
      }

      // Register the theme
      const success = super.registerTheme(name, colorSet);

      if (success) {
        // Store module reference
        this.moduleThemes.set(name, themeModule);
        this.themeModules.set(themeModule, name);

        // Register in module registry if available
        if (this.moduleRegistry && options.registerInModuleRegistry !== false) {
          this.moduleRegistry.register(`theme-${name}`, themeModule, {
            type: 'theme',
            themes: { [name]: colorSet },
            metadata: {
              themeName: name,
              autoGenerated: true,
              timestamp: new Date().toISOString(),
              ...options.metadata,
            },
          });
        }

        if (this.moduleOptions.debugMode) {
          console.log(`Successfully registered module theme: ${name}`);
        }
      }

      return success;
    } catch (error) {
      if (this.moduleOptions.debugMode) {
        console.error(`Failed to register module theme ${name}:`, error);
      }
      return false;
    }
  }

  /**
   * Register themes from a module
   * @param {string} moduleName - Module name
   * @param {Object} themes - Theme definitions
   */
  registerModuleThemes(moduleName, themes) {
    Object.entries(themes).forEach(([themeName, themeData]) => {
      const fullThemeName = `${moduleName}-${themeName}`;
      this.registerTheme(fullThemeName, themeData, {
        metadata: { sourceModule: moduleName },
      });
    });
  }

  /**
   * Import and register a theme from a module path
   * @param {string} themePath - Path to theme module
   * @param {string} [themeName] - Optional theme name override
   * @returns {Promise<boolean>} - Registration success
   */
  async importTheme(themePath, themeName) {
    try {
      const themeModule = await import(themePath);
      const theme = themeModule.default || themeModule;
      const name = themeName || theme.name || themePath.split('/').pop().replace('.js', '');

      return this.registerTheme(name, theme, {
        metadata: { importPath: themePath },
      });
    } catch (error) {
      if (this.moduleOptions.debugMode) {
        console.error(`Failed to import theme from ${themePath}:`, error);
      }
      return false;
    }
  }

  /**
   * Handle theme requirements from modules
   * @param {string} moduleName - Module name
   * @param {Object} requirements - Theme requirements
   */
  handleThemeRequirements(moduleName, requirements) {
    // Ensure required themes are available
    if (requirements.requiredThemes) {
      requirements.requiredThemes.forEach(themeName => {
        if (!this.themeColors[themeName]) {
          console.warn(`Module ${moduleName} requires theme '${themeName}' which is not available`);
        }
      });
    }

    // Apply theme preferences if specified
    if (requirements.preferredTheme && this.themeColors[requirements.preferredTheme]) {
      // Could auto-switch to preferred theme, but this might be too intrusive
      if (this.moduleOptions.debugMode) {
        console.log(`Module ${moduleName} prefers theme '${requirements.preferredTheme}'`);
      }
    }
  }

  /**
   * Get theme module by name
   * @param {string} themeName - Theme name
   * @returns {*} - Theme module or null
   */
  getThemeModule(themeName) {
    return this.moduleThemes.get(themeName) || null;
  }

  /**
   * Get theme name by module
   * @param {*} themeModule - Theme module
   * @returns {string|null} - Theme name or null
   */
  getThemeNameByModule(themeModule) {
    return this.themeModules.get(themeModule) || null;
  }

  /**
   * Get all module-registered themes
   * @returns {Array} - Array of theme information
   */
  getModuleThemes() {
    const moduleThemes = [];

    this.moduleThemes.forEach((module, name) => {
      moduleThemes.push({
        name,
        module,
        colors: this.themeColors[name],
        isModuleTheme: true,
      });
    });

    return moduleThemes;
  }

  /**
   * Enhanced theme application with module notifications
   */
  applyCurrentTheme() {
    // Call parent implementation
    super.applyCurrentTheme();

    // Notify module registry of theme change
    if (this.moduleRegistry && typeof this.moduleRegistry.emit === 'function') {
      this.moduleRegistry.emit('themeChanged', {
        theme: this.currentTheme.name,
        mode: this.currentTheme.mode,
        timestamp: new Date().toISOString(),
      });
    }

    // Notify theme modules of the change
    const currentThemeModule = this.moduleThemes.get(this.currentTheme.name);
    if (currentThemeModule && typeof currentThemeModule.onThemeApplied === 'function') {
      try {
        currentThemeModule.onThemeApplied(this.currentTheme);
      } catch (error) {
        if (this.moduleOptions.debugMode) {
          console.warn(`Theme module ${this.currentTheme.name} onThemeApplied error:`, error);
        }
      }
    }
  }

  /**
   * Unregister a theme
   * @param {string} themeName - Theme name to unregister
   * @returns {boolean} - Success
   */
  unregisterTheme(themeName) {
    if (!this.themeColors[themeName]) {
      return false;
    }

    // Remove from parent theme colors
    delete this.themeColors[themeName];

    // Remove module references
    const themeModule = this.moduleThemes.get(themeName);
    if (themeModule) {
      this.moduleThemes.delete(themeName);
      this.themeModules.delete(themeModule);
    }

    // Remove from module registry
    if (this.moduleRegistry) {
      this.moduleRegistry.unregister(`theme-${themeName}`);
    }

    // Switch to default theme if current theme was unregistered
    if (this.currentTheme.name === themeName) {
      this.setTheme('default');
    }

    return true;
  }

  /**
   * Get enhanced theme information including module data
   * @returns {Object} - Enhanced theme information
   */
  getCurrentThemeInfo() {
    const baseInfo = super.getCurrentTheme();
    const themeModule = this.moduleThemes.get(baseInfo.name);

    return {
      ...baseInfo,
      isModuleTheme: !!themeModule,
      module: themeModule,
      moduleRegistry: !!this.moduleRegistry,
      availableModuleThemes: this.getModuleThemes().length,
    };
  }

  /**
   * Validate module theme structure
   * @param {*} themeModule - Theme module to validate
   * @returns {Object} - Validation results
   */
  validateThemeModule(themeModule) {
    const results = {
      valid: true,
      errors: [],
      warnings: [],
    };

    try {
      let colorSet;

      if (typeof themeModule === 'function') {
        colorSet = themeModule();
      } else if (themeModule.getThemeColors) {
        colorSet = themeModule.getThemeColors();
      } else if (themeModule.colors) {
        colorSet = themeModule.colors;
      } else {
        colorSet = themeModule;
      }

      if (!colorSet) {
        results.errors.push('Theme module does not provide color set');
        results.valid = false;
      } else {
        if (!colorSet.light) {
          results.errors.push('Theme module missing light mode colors');
          results.valid = false;
        }

        if (!colorSet.dark) {
          results.errors.push('Theme module missing dark mode colors');
          results.valid = false;
        }

        // Check for required color properties
        const requiredColors = ['primary', 'background', 'text'];
        ['light', 'dark'].forEach(mode => {
          if (colorSet[mode]) {
            requiredColors.forEach(color => {
              if (!colorSet[mode][color]) {
                results.warnings.push(`Missing ${color} color in ${mode} mode`);
              }
            });
          }
        });
      }
    } catch (error) {
      results.errors.push(`Theme validation error: ${error.message}`);
      results.valid = false;
    }

    return results;
  }

  /**
   * Static method to create modular theme manager
   * @param {Object} options - Options
   * @returns {ModularThemeManager} - Theme manager instance
   */
  static create(options = {}) {
    return new ModularThemeManager(options);
  }

  /**
   * Static method to get global module registry
   * @returns {ModuleRegistry|null} - Module registry or null
   */
  static getRegistry() {
    return (typeof window !== 'undefined' && window.LearnimalsModuleRegistry) || null;
  }
}

// ES module export
export default ModularThemeManager;
