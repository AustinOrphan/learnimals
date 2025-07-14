/**
 * GameSystem - Central game management system for Learnimals
 * Provides unified game registration, loading, and lifecycle management
 */
import logger from './logger.js';

class GameSystem {
  constructor() {
    this.registry = new Map();
    this.activeGames = new Map();
    this.templateEngine = null;
    this.eventListeners = new Map();
    this.initialized = false;
    
    // Bind methods to preserve 'this' context
    this.handleWindowUnload = this.handleWindowUnload.bind(this);
  }

  /**
   * Initialize the GameSystem
   */
  async init() {
    if (this.initialized) {
      logger.warn('GameSystem already initialized');
      return;
    }

    try {
      // Import and initialize template engine
      const { GameTemplateEngine } = await import('./GameTemplateEngine.js');
      this.templateEngine = new GameTemplateEngine();

      // Load game registry
      await this.loadGameRegistry();

      // Set up cleanup on page unload
      window.addEventListener('beforeunload', this.handleWindowUnload);

      this.initialized = true;
      logger.info('GameSystem initialized successfully');
      
      // Emit initialization event
      this.emit('systemInitialized');
      
    } catch (error) {
      logger.error('Failed to initialize GameSystem:', error);
      throw error;
    }
  }

  /**
   * Load the game registry configuration
   */
  async loadGameRegistry() {
    try {
      const { gameRegistry } = await import('../config/gameRegistry.js');
      
      // Register all games from the registry
      for (const gameConfig of gameRegistry) {
        await this.registerGame(gameConfig);
      }
      
      logger.info(`Loaded ${this.registry.size} games from registry`);
    } catch (error) {
      logger.warn('Game registry not found, starting with empty registry:', error);
    }
  }

  /**
   * Register a new game with the system
   * @param {Object} gameConfig - Game configuration object
   */
  async registerGame(gameConfig) {
    try {
      // Validate game configuration
      const validatedConfig = this.validateGameConfig(gameConfig);
      
      // Store in registry
      this.registry.set(validatedConfig.id, validatedConfig);
      
      logger.debug(`Registered game: ${validatedConfig.id}`);
      
      // Emit registration event
      this.emit('gameRegistered', validatedConfig);
      
      return validatedConfig;
    } catch (error) {
      logger.error(`Failed to register game ${gameConfig?.id}:`, error);
      throw error;
    }
  }

  /**
   * Validate game configuration
   * @param {Object} config - Game configuration to validate
   * @returns {Object} Validated configuration
   */
  validateGameConfig(config) {
    if (!config || typeof config !== 'object') {
      throw new Error('Game config must be an object');
    }

    const required = ['id', 'name', 'gameClass', 'scriptPath'];
    for (const field of required) {
      if (!config[field]) {
        throw new Error(`Game config missing required field: ${field}`);
      }
    }

    // Set defaults
    const validated = {
      ...config,
      subject: config.subject || 'general',
      difficulty: config.difficulty || ['easy'],
      template: config.template || 'game',
      features: config.features || ['analytics', 'progress', 'mobile', 'themes'],
      options: config.options || {}
    };

    // Validate ID format (alphanumeric with hyphens)
    if (!/^[a-z0-9-]+$/.test(validated.id)) {
      throw new Error('Game ID must be lowercase alphanumeric with hyphens only');
    }

    return validated;
  }

  /**
   * Load and instantiate a game
   * @param {string} gameId - ID of the game to load
   * @param {string} containerId - DOM container ID for the game
   * @param {Object} options - Additional options for game initialization
   * @returns {Promise<Object>} Game instance
   */
  async loadGame(gameId, containerId, options = {}) {
    try {
      // Check if game is already active
      if (this.activeGames.has(gameId)) {
        logger.warn(`Game ${gameId} is already active`);
        return this.activeGames.get(gameId);
      }

      // Get game configuration
      const gameConfig = this.registry.get(gameId);
      if (!gameConfig) {
        throw new Error(`Game not found: ${gameId}`);
      }

      // Render game template if needed
      if (this.templateEngine && gameConfig.template !== 'none') {
        await this.templateEngine.renderGamePage(gameConfig, containerId);
      }

      // Dynamic import of game class
      const gameModule = await import(gameConfig.scriptPath);
      const GameClass = gameModule.default || gameModule[gameConfig.gameClass];
      
      if (!GameClass) {
        throw new Error(`Game class not found: ${gameConfig.gameClass}`);
      }

      // Merge configuration options with runtime options
      const gameOptions = {
        ...gameConfig.options,
        ...options,
        gameId: gameId,
        gameConfig: gameConfig
      };

      // Instantiate game
      const gameInstance = new GameClass(containerId, gameOptions);
      
      // Store active game
      this.activeGames.set(gameId, {
        instance: gameInstance,
        config: gameConfig,
        containerId: containerId,
        startTime: Date.now()
      });

      // Set up game event handlers
      this.setupGameEventHandlers(gameId, gameInstance);

      logger.info(`Loaded game: ${gameId}`);
      
      // Emit game loaded event
      this.emit('gameLoaded', { gameId, instance: gameInstance });

      return gameInstance;
    } catch (error) {
      logger.error(`Failed to load game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Set up event handlers for a game instance
   * @param {string} gameId - Game ID
   * @param {Object} gameInstance - Game instance
   */
  setupGameEventHandlers(gameId, gameInstance) {
    // Handle game completion
    if (typeof gameInstance.on === 'function') {
      gameInstance.on('gameComplete', (data) => {
        this.emit('gameComplete', { gameId, ...data });
      });

      gameInstance.on('gameError', (error) => {
        logger.error(`Game ${gameId} error:`, error);
        this.emit('gameError', { gameId, error });
      });
    }
  }

  /**
   * Destroy a game instance and clean up resources
   * @param {string} gameId - ID of the game to destroy
   */
  async destroyGame(gameId) {
    try {
      const gameData = this.activeGames.get(gameId);
      if (!gameData) {
        logger.warn(`Game ${gameId} not found in active games`);
        return;
      }

      const { instance } = gameData;

      // Call game's destroy method if it exists
      if (typeof instance.destroy === 'function') {
        await instance.destroy();
      }

      // Remove from active games
      this.activeGames.delete(gameId);

      logger.info(`Destroyed game: ${gameId}`);
      
      // Emit game destroyed event
      this.emit('gameDestroyed', { gameId });
      
    } catch (error) {
      logger.error(`Failed to destroy game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Get list of available games, optionally filtered
   * @param {Object} filters - Filter criteria
   * @returns {Array} Array of game configurations
   */
  getAvailableGames(filters = {}) {
    let games = Array.from(this.registry.values());

    // Apply filters
    if (filters.subject) {
      games = games.filter(game => game.subject === filters.subject);
    }

    if (filters.difficulty) {
      games = games.filter(game => 
        game.difficulty.includes(filters.difficulty)
      );
    }

    if (filters.features) {
      const requiredFeatures = Array.isArray(filters.features) 
        ? filters.features 
        : [filters.features];
      
      games = games.filter(game => 
        requiredFeatures.every(feature => game.features.includes(feature))
      );
    }

    return games;
  }

  /**
   * Get information about a specific game
   * @param {string} gameId - Game ID
   * @returns {Object|null} Game configuration or null if not found
   */
  getGameInfo(gameId) {
    return this.registry.get(gameId) || null;
  }

  /**
   * Check if a game is currently active
   * @param {string} gameId - Game ID
   * @returns {boolean} True if game is active
   */
  isGameActive(gameId) {
    return this.activeGames.has(gameId);
  }

  /**
   * Get list of currently active games
   * @returns {Array} Array of active game IDs
   */
  getActiveGames() {
    return Array.from(this.activeGames.keys());
  }

  /**
   * Event system for cross-game communication
   */
  
  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  on(event, handler) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(handler);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} handler - Event handler to remove
   */
  off(event, handler) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(handler);
    }
  }

  /**
   * Emit event to all listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      for (const handler of this.eventListeners.get(event)) {
        try {
          handler(data);
        } catch (error) {
          logger.error(`Error in event handler for ${event}:`, error);
        }
      }
    }
  }

  /**
   * Clean up all resources
   */
  async destroy() {
    // Destroy all active games
    const activeGameIds = Array.from(this.activeGames.keys());
    for (const gameId of activeGameIds) {
      await this.destroyGame(gameId);
    }

    // Clear event listeners
    this.eventListeners.clear();

    // Remove window event listener
    window.removeEventListener('beforeunload', this.handleWindowUnload);

    // Clean up template engine
    if (this.templateEngine && typeof this.templateEngine.destroy === 'function') {
      this.templateEngine.destroy();
    }

    this.initialized = false;
    logger.info('GameSystem destroyed');
  }

  /**
   * Handle window unload event
   */
  handleWindowUnload() {
    // Quick cleanup of active games
    for (const [gameId, gameData] of this.activeGames) {
      const { instance } = gameData;
      if (typeof instance.destroy === 'function') {
        try {
          instance.destroy();
        } catch (error) {
          logger.warn(`Error destroying game ${gameId} on unload:`, error);
        }
      }
    }
  }

  /**
   * Get system statistics
   * @returns {Object} System stats
   */
  getStats() {
    return {
      registeredGames: this.registry.size,
      activeGames: this.activeGames.size,
      initialized: this.initialized,
      gamesList: Array.from(this.registry.keys())
    };
  }
}

// Create singleton instance
const gameSystem = new GameSystem();

export default gameSystem;
export { GameSystem };