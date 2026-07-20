// Modular Game Loader
// Handles dynamic loading and management of game components with ModuleRegistry integration

import ModuleRegistry from './ModuleRegistry.js';
import ComponentLoader from './ComponentLoader.js';

/**
 * ModularGameLoader - Enhanced game loading system with module integration
 * Provides centralized game component loading, lifecycle management, and registry integration
 */
class ModularGameLoader {
  /**
   * Create a modular game loader
   * @param {Object} options - Loader options
   * @param {string} [options.basePath='games'] - Base path for game files
   * @param {boolean} [options.enableModuleRegistry=true] - Enable module registry integration
   * @param {boolean} [options.debugMode=false] - Enable debug logging
   * @param {Object} [options.gameDefaults={}] - Default options for all games
   */
  constructor(options = {}) {
    this.options = {
      basePath: options.basePath || 'games',
      enableModuleRegistry: options.enableModuleRegistry !== false,
      debugMode: options.debugMode || false,
      gameDefaults: options.gameDefaults || {},
      cacheGames: options.cacheGames !== false,
      maxConcurrentLoads: options.maxConcurrentLoads || 3,
      ...options,
    };

    // Game management
    this.loadedGames = new Map();
    this.gameInstances = new Map();
    this.loadPromises = new Map();
    this.gameConfigs = new Map();

    // Registry integration
    this.moduleRegistry = null;
    this.componentLoader = null;

    // Performance tracking
    this.loadTimes = new Map();
    this.gameStats = {
      totalLoaded: 0,
      totalFailed: 0,
      averageLoadTime: 0,
    };

    this.init();
  }

  /**
   * Initialize the game loader
   */
  init() {
    if (this.options.enableModuleRegistry) {
      this.initializeModuleRegistry();
    }

    this.initializeComponentLoader();
    this.registerBuiltInGames();

    if (this.options.debugMode) {
      console.log('ModularGameLoader initialized with options:', this.options);
    }
  }

  /**
   * Initialize module registry integration
   */
  initializeModuleRegistry() {
    try {
      // Get or create global module registry
      this.moduleRegistry = this.getModuleRegistry();

      // Register this game loader as a service
      if (this.moduleRegistry) {
        this.moduleRegistry.register('ModularGameLoader', this, {
          type: 'service',
          version: '1.0.0',
          dependencies: ['ComponentLoader'],
          metadata: {
            className: 'ModularGameLoader',
            description: 'Advanced game loading system with module registry integration',
            capabilities: [
              'game-loading',
              'lifecycle-management',
              'performance-tracking',
              'module-integration',
              'concurrent-loading',
              'game-caching',
            ],
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      if (this.options.debugMode) {
        console.warn('Module registry initialization failed for ModularGameLoader:', error);
      }
    }
  }

  /**
   * Get or create the global module registry
   * @returns {ModuleRegistry|null} - Module registry instance
   */
  getModuleRegistry() {
    // Try to get existing global registry
    if (typeof window !== 'undefined' && window.LearnimalsModuleRegistry) {
      return window.LearnimalsModuleRegistry;
    }

    // Create new registry if none exists
    const registry = new ModuleRegistry({
      debugMode: this.options.debugMode,
      strictMode: false,
    });

    // Store globally for sharing across components
    if (typeof window !== 'undefined') {
      window.LearnimalsModuleRegistry = registry;
    }

    return registry;
  }

  /**
   * Initialize component loader integration
   */
  initializeComponentLoader() {
    try {
      this.componentLoader = new ComponentLoader({
        basePath: this.options.basePath,
        enableModuleRegistry: this.options.enableModuleRegistry,
        debugMode: this.options.debugMode,
      });
    } catch (error) {
      if (this.options.debugMode) {
        console.warn('ComponentLoader initialization failed:', error);
      }
    }
  }

  /**
   * Register built-in games in the system
   */
  registerBuiltInGames() {
    const builtInGames = [
      {
        name: 'bubble-pop',
        title: 'Bubble Pop',
        description: 'Pop bubbles to learn letters and numbers',
        category: 'learning',
        subjects: ['reading', 'math'],
        difficulty: 'easy',
        path: 'bubble-pop/BubblePop.js',
        cssPath: 'bubble-pop/bubble-pop.css',
        configPath: 'bubble-pop/config.json',
      },
      {
        name: 'word-scramble',
        title: 'Word Scramble',
        description: 'Unscramble words to build vocabulary',
        category: 'word-game',
        subjects: ['reading', 'language'],
        difficulty: 'medium',
        path: 'word-scramble/WordScramble.js',
        cssPath: 'word-scramble/word-scramble.css',
        configPath: 'word-scramble/config.json',
      },
    ];

    builtInGames.forEach(game => {
      this.registerGame(game.name, game);
    });
  }

  /**
   * Register a game configuration
   * @param {string} gameName - Game identifier
   * @param {Object} gameConfig - Game configuration
   */
  registerGame(gameName, gameConfig) {
    this.gameConfigs.set(gameName, {
      ...gameConfig,
      registeredAt: new Date().toISOString(),
    });

    if (this.options.debugMode) {
      console.log(`Registered game: ${gameName}`, gameConfig);
    }
  }

  /**
   * Load a game by name
   * @param {string} gameName - Game identifier
   * @param {string|HTMLElement} container - Container for the game
   * @param {Object} [options={}] - Game-specific options
   * @returns {Promise<Object>} - Promise resolving to game instance
   */
  async loadGame(gameName, container, options = {}) {
    const startTime = performance.now();

    try {
      // Check if game is already loaded and cached
      if (this.options.cacheGames && this.loadedGames.has(gameName)) {
        return this.createGameInstance(gameName, container, options);
      }

      // Check if we're already loading this game
      if (this.loadPromises.has(gameName)) {
        await this.loadPromises.get(gameName);
        return this.createGameInstance(gameName, container, options);
      }

      // Get game configuration
      const gameConfig = this.gameConfigs.get(gameName);
      if (!gameConfig) {
        throw new Error(`Game '${gameName}' not registered`);
      }

      // Start loading process
      const loadPromise = this.performGameLoad(gameName, gameConfig);
      this.loadPromises.set(gameName, loadPromise);

      await loadPromise;

      // Create and return game instance
      const instance = await this.createGameInstance(gameName, container, options);

      // Track performance
      const loadTime = performance.now() - startTime;
      this.trackLoadTime(gameName, loadTime);

      return instance;
    } catch (error) {
      this.gameStats.totalFailed++;
      if (this.options.debugMode) {
        console.error(`Failed to load game ${gameName}:`, error);
      }
      throw error;
    } finally {
      this.loadPromises.delete(gameName);
    }
  }

  /**
   * Perform the actual game loading
   * @param {string} gameName - Game identifier
   * @param {Object} gameConfig - Game configuration
   * @returns {Promise<void>} - Loading promise
   */
  async performGameLoad(gameName, gameConfig) {
    const loadTasks = [];

    // Load game JavaScript
    if (gameConfig.path) {
      loadTasks.push(this.loadGameScript(gameName, gameConfig.path));
    }

    // Load game CSS
    if (gameConfig.cssPath) {
      loadTasks.push(this.loadGameStyles(gameName, gameConfig.cssPath));
    }

    // Load game configuration
    if (gameConfig.configPath) {
      loadTasks.push(this.loadGameConfig(gameName, gameConfig.configPath));
    }

    // Execute all loading tasks concurrently
    await Promise.all(loadTasks);

    // Mark as loaded
    this.loadedGames.set(gameName, {
      config: gameConfig,
      loadedAt: new Date().toISOString(),
    });

    this.gameStats.totalLoaded++;
  }

  /**
   * Load game script file
   * @param {string} gameName - Game identifier
   * @param {string} scriptPath - Path to game script
   * @returns {Promise<any>} - Promise resolving to loaded module
   */
  async loadGameScript(gameName, scriptPath) {
    if (!this.componentLoader) {
      throw new Error('ComponentLoader not available');
    }

    const fullPath = `${this.options.basePath}/${scriptPath}`;
    const module = await this.componentLoader.loadScript(fullPath);

    // Register in module registry if available
    if (this.moduleRegistry && module.default) {
      this.moduleRegistry.register(`Game_${gameName}`, module.default, {
        type: 'game',
        source: 'ModularGameLoader',
        category: this.gameConfigs.get(gameName)?.category || 'unknown',
        path: fullPath,
        timestamp: new Date().toISOString(),
      });
    }

    return module;
  }

  /**
   * Load game stylesheet
   * @param {string} gameName - Game identifier
   * @param {string} cssPath - Path to game CSS
   * @returns {Promise<HTMLLinkElement>} - Promise resolving to link element
   */
  async loadGameStyles(gameName, cssPath) {
    if (!this.componentLoader) {
      return null;
    }

    const fullPath = `${this.options.basePath}/${cssPath}`;
    return this.componentLoader.loadStylesheet(fullPath);
  }

  /**
   * Load game configuration file
   * @param {string} gameName - Game identifier
   * @param {string} configPath - Path to config file
   * @returns {Promise<Object>} - Promise resolving to config object
   */
  async loadGameConfig(gameName, configPath) {
    try {
      const fullPath = `${this.options.basePath}/${configPath}`;
      const response = await fetch(fullPath);

      if (!response.ok) {
        if (this.options.debugMode) {
          console.warn(`Config file not found for ${gameName}: ${fullPath}`);
        }
        return {};
      }

      const config = await response.json();

      // Merge with existing game config
      const existingConfig = this.gameConfigs.get(gameName) || {};
      this.gameConfigs.set(gameName, { ...existingConfig, ...config });

      return config;
    } catch (error) {
      if (this.options.debugMode) {
        console.warn(`Failed to load config for ${gameName}:`, error);
      }
      return {};
    }
  }

  /**
   * Create a game instance
   * @param {string} gameName - Game identifier
   * @param {string|HTMLElement} container - Container for the game
   * @param {Object} [options={}] - Game-specific options
   * @returns {Promise<Object>} - Promise resolving to game instance
   */
  async createGameInstance(gameName, container, options = {}) {
    // Try to get game class from module registry first
    if (this.moduleRegistry) {
      const gameInfo = this.moduleRegistry.get(`Game_${gameName}`);
      if (gameInfo) {
        const GameClass = gameInfo.module;
        const gameConfig = this.gameConfigs.get(gameName) || {};

        const instanceOptions = {
          ...this.options.gameDefaults,
          ...gameConfig,
          ...options,
        };

        const instance = new GameClass(instanceOptions);

        // Initialize game in container
        if (typeof instance.init === 'function') {
          await instance.init(container);
        } else if (typeof instance.render === 'function') {
          await instance.render(container);
        }

        // Track instance
        const instanceId = `${gameName}_${Date.now()}`;
        this.gameInstances.set(instanceId, {
          game: instance,
          gameName,
          container,
          createdAt: new Date().toISOString(),
        });

        return instance;
      }
    }

    throw new Error(`Game class not available for ${gameName}`);
  }

  /**
   * Unload a game
   * @param {string} gameName - Game identifier
   */
  unloadGame(gameName) {
    // Remove from loaded games if not caching
    if (!this.options.cacheGames) {
      this.loadedGames.delete(gameName);
    }

    // Clean up instances
    for (const [_instanceId, instanceData] of this.gameInstances.entries()) {
      if (instanceData.gameName === gameName) {
        if (typeof instanceData.game.destroy === 'function') {
          instanceData.game.destroy();
        }
        this.gameInstances.delete(_instanceId);
      }
    }

    if (this.options.debugMode) {
      console.log(`Unloaded game: ${gameName}`);
    }
  }

  /**
   * Get list of registered games
   * @returns {Array<Object>} - Array of game configurations
   */
  getRegisteredGames() {
    return Array.from(this.gameConfigs.entries()).map(([name, config]) => ({
      name,
      ...config,
    }));
  }

  /**
   * Get game loading statistics
   * @returns {Object} - Performance statistics
   */
  getStats() {
    return {
      ...this.gameStats,
      loadedGames: this.loadedGames.size,
      activeInstances: this.gameInstances.size,
      registeredGames: this.gameConfigs.size,
      averageLoadTime: this.calculateAverageLoadTime(),
    };
  }

  /**
   * Track load time for performance monitoring
   * @param {string} gameName - Game identifier
   * @param {number} loadTime - Load time in milliseconds
   */
  trackLoadTime(gameName, loadTime) {
    if (!this.loadTimes.has(gameName)) {
      this.loadTimes.set(gameName, []);
    }
    this.loadTimes.get(gameName).push(loadTime);
  }

  /**
   * Calculate average load time across all games
   * @returns {number} - Average load time in milliseconds
   */
  calculateAverageLoadTime() {
    let totalTime = 0;
    let totalLoads = 0;

    for (const times of this.loadTimes.values()) {
      totalTime += times.reduce((sum, time) => sum + time, 0);
      totalLoads += times.length;
    }

    return totalLoads > 0 ? totalTime / totalLoads : 0;
  }

  /**
   * Clear cache and reset loader state
   */
  clearCache() {
    this.loadedGames.clear();
    this.loadPromises.clear();
    this.loadTimes.clear();

    // Destroy all active instances
    for (const [_instanceId, instanceData] of this.gameInstances.entries()) {
      if (typeof instanceData.game.destroy === 'function') {
        instanceData.game.destroy();
      }
    }
    this.gameInstances.clear();

    // Reset stats
    this.gameStats = {
      totalLoaded: 0,
      totalFailed: 0,
      averageLoadTime: 0,
    };

    if (this.options.debugMode) {
      console.log('ModularGameLoader cache cleared');
    }
  }
}

// ES module export
export default ModularGameLoader;
