/**
 * @fileoverview BaseGame - Base class for all Learnimals games
 * @module BaseGame
 * @requires logger
 * @version 1.0.0
 * @author Learnimals Development Team
 * @since 1.0.0
 */
import logger from '../../utils/logger.js';

/**
 * Base class for all Learnimals games providing common functionality for game state management,
 * scoring, UI integration, input handling, and performance monitoring.
 * 
 * Features:
 * - Robust state management with race condition protection
 * - Canvas-based rendering with high DPI support
 * - Multi-input support (keyboard, mouse, touch)
 * - Performance monitoring and FPS tracking
 * - Audio context integration
 * - Responsive canvas sizing
 * - Memory leak prevention
 * 
 * @class BaseGame
 * @example
 * // Basic game implementation
 * class MyGame extends BaseGame {
 *   constructor(canvasId) {
 *     super(canvasId, {
 *       onScoreUpdate: (score) => console.log('Score:', score),
 *       onGameOver: (finalScore) => console.log('Game Over:', finalScore)
 *     });
 *   }
 *   
 *   update(deltaTime) {
 *     // Game logic here
 *   }
 *   
 *   render() {
 *     super.render(); // Clear canvas
 *     // Rendering logic here
 *   }
 * }
 * 
 * @example
 * // Game with input handling
 * class InteractiveGame extends BaseGame {
 *   handleClick(position) {
 *     console.log('Clicked at:', position.x, position.y);
 *   }
 *   
 *   handleKeyDown(event) {
 *     if (event.code === 'Space') {
 *       // Handle spacebar
 *     }
 *   }
 * }
 */
export default class BaseGame {
  /**
   * Creates a new BaseGame instance with the specified canvas and options.
   * Initializes all game systems including state management, input handling,
   * performance monitoring, and audio context.
   * 
   * @param {string} canvasId - ID of the HTML canvas element to render the game
   * @param {Object} [options={}] - Configuration options for the game
   * @param {Function} [options.onScoreUpdate] - Callback when score changes (score) => void
   * @param {Function} [options.onLevelUpdate] - Callback when level changes (level) => void
   * @param {Function} [options.onGameOver] - Callback when game ends (finalScore) => void
   * @param {Function} [options.onPause] - Callback when game pauses () => void
   * @param {Function} [options.onResume] - Callback when game resumes () => void
   * @param {Function} [options.onStateChange] - Callback when state changes (newState, oldState) => void
   * 
   * @throws {Error} Throws error if canvas element is not found or doesn't support 2D context
   * 
   * @example
   * const game = new BaseGame('game-canvas', {
   *   onScoreUpdate: (score) => updateScoreDisplay(score),
   *   onGameOver: (score) => showGameOverModal(score),
   *   onStateChange: (newState) => updateGameButtons(newState)
   * });
   */
  constructor(canvasId, options = {}) {
    // Core properties
    this.canvasId = canvasId;
    this.canvas = document.getElementById(canvasId);
    this.options = options;

    // Game state with atomic operations for thread safety
    this.state = 'loading'; // loading, playing, paused, game-over
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.isActive = false;
    this.isPaused = false;
    this.stateTransitionInProgress = false;

    // Timing
    this.startTime = null;
    this.pausedTime = 0;
    this.lastFrameTime = 0;
    this.gameLoopId = null; // Track current game loop
    this.gameLoopRunning = false; // Flag to prevent multiple loops

    // Event callbacks from GameTemplateLoader
    this.onScoreUpdate = options.onScoreUpdate || (() => {});
    this.onLevelUpdate = options.onLevelUpdate || (() => {});
    this.onGameOver = options.onGameOver || (() => {});
    this.onPause = options.onPause || (() => {});
    this.onResume = options.onResume || (() => {});
    this.onStateChange = options.onStateChange || (() => {});

    // Performance monitoring
    this.frameCount = 0;
    this.fpsHistory = [];
    this.lastFpsUpdate = 0;

    // Input handling
    this.keys = new Set();
    this.touches = new Map();
    this.mousePosition = { x: 0, y: 0 };

    // Audio context (if supported)
    this.audioContext = null;
    this.soundEnabled = true;

    // Initialize the game
    this.initialize();
  }

  /**
   * Initializes the game systems asynchronously.
   * Sets up canvas, event listeners, audio context, loads assets,
   * and transitions to 'ready' state. Called automatically by constructor.
   * 
   * @returns {Promise<void>} Promise that resolves when initialization is complete
   * @throws {Error} Throws error if any initialization step fails
   * 
   * @example
   * // Initialization is automatic, but you can override onInitialized
   * class MyGame extends BaseGame {
   *   onInitialized() {
   *     console.log('Game ready to start!');
   *   }
   * }
   * 
   * @private
   */
  async initialize() {
    try {
      this.validateCanvas();
      this.setupCanvas();
      this.setupEventListeners();
      this.setupAudio();
      await this.loadAssets();
      this.setState('ready');
      this.onInitialized();
    } catch (error) {
      logger.error('Game initialization failed:', error);
      this.setState('error');
      throw error;
    }
  }

  /**
   * Validates that the canvas element exists and supports 2D rendering context.
   * Sets up the rendering context for use throughout the game.
   * 
   * @throws {Error} Throws error if canvas not found or doesn't support 2D context
   * 
   * @example
   * // Canvas validation happens automatically, but errors are thrown for:
   * // - Canvas element not found in DOM
   * // - Canvas doesn't support getContext
   * // - 2D context creation fails
   * 
   * @private
   */
  validateCanvas() {
    if (!this.canvas) {
      throw new Error(`Canvas element with ID '${this.canvasId}' not found`);
    }

    if (!this.canvas.getContext) {
      throw new Error('Canvas element does not support 2D context');
    }

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('Failed to get 2D rendering context');
    }
  }

  /**
   * Sets up canvas properties including high DPI support and responsive sizing.
   * Configures pixel ratio scaling for crisp rendering on high DPI displays.
   * 
   * @example
   * // Canvas setup includes:
   * // - Responsive sizing
   * // - High DPI support (retina displays)
   * // - Default rendering settings
   * // - Image smoothing enabled
   * 
   * @private
   */
  setupCanvas() {
    // Set canvas size
    this.resizeCanvas();

    // Enable high DPI support
    const pixelRatio = window.devicePixelRatio || 1;
    if (pixelRatio > 1) {
      const rect = this.canvas.getBoundingClientRect();
      this.canvas.width = rect.width * pixelRatio;
      this.canvas.height = rect.height * pixelRatio;
      this.ctx.scale(pixelRatio, pixelRatio);
      this.canvas.style.width = `${rect.width  }px`;
      this.canvas.style.height = `${rect.height  }px`;
    }

    // Set default canvas styles
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
  }

  /**
     * Set up event listeners for input handling
     */
  setupEventListeners() {
    // Store bound event handlers for proper cleanup
    this.boundHandlers = {
      keydown: (e) => this.handleKeyDown(e),
      keyup: (e) => this.handleKeyUp(e),
      click: (e) => this.handleClick(e),
      mousemove: (e) => this.handleMouseMove(e),
      mousedown: (e) => this.handleMouseDown(e),
      mouseup: (e) => this.handleMouseUp(e),
      touchstart: (e) => this.handleTouchStart(e),
      touchmove: (e) => this.handleTouchMove(e),
      touchend: (e) => this.handleTouchEnd(e),
      resize: () => this.handleResize(),
      blur: () => this.handleWindowBlur(),
      focus: () => this.handleWindowFocus(),
      visibilitychange: () => this.handleVisibilityChange()
    };

    // Keyboard events
    document.addEventListener('keydown', this.boundHandlers.keydown);
    document.addEventListener('keyup', this.boundHandlers.keyup);

    // Mouse events
    this.canvas.addEventListener('click', this.boundHandlers.click);
    this.canvas.addEventListener('mousemove', this.boundHandlers.mousemove);
    this.canvas.addEventListener('mousedown', this.boundHandlers.mousedown);
    this.canvas.addEventListener('mouseup', this.boundHandlers.mouseup);

    // Touch events
    this.canvas.addEventListener('touchstart', this.boundHandlers.touchstart, { passive: false });
    this.canvas.addEventListener('touchmove', this.boundHandlers.touchmove, { passive: false });
    this.canvas.addEventListener('touchend', this.boundHandlers.touchend, { passive: false });

    // Window events
    window.addEventListener('resize', this.boundHandlers.resize);
    window.addEventListener('blur', this.boundHandlers.blur);
    window.addEventListener('focus', this.boundHandlers.focus);

    // Visibility API
    document.addEventListener('visibilitychange', this.boundHandlers.visibilitychange);
  }

  /**
     * Set up audio context for sound effects
     */
  setupAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.soundEnabled = true;
    } catch (error) {
      logger.warn('Audio not supported:', error);
      this.soundEnabled = false;
    }
  }

  /**
     * Load game assets - override in subclasses
     */
  async loadAssets() {
    // Base implementation - subclasses should override
    return Promise.resolve();
  }

  /**
     * Called after successful initialization - override in subclasses
     */
  onInitialized() {
    logger.debug(`${this.constructor.name} initialized successfully`);
  }

  /**
     * Called when game starts - override in subclasses
     */
  onStart() {
    // Base implementation - subclasses can override
  }

  /**
     * Called when game ends - override in subclasses
     */
  onGameEnd() {
    // Base implementation - subclasses can override
  }

  /**
     * Called when game restarts - override in subclasses
     */
  onRestart() {
    // Base implementation - subclasses can override
  }

  /**
     * Called when canvas is resized - override in subclasses
     */
  onResize(_width, _height) {
    // Base implementation - subclasses can override
  }

  /**
   * Starts the game with race condition protection.
   * Transitions from 'ready' or 'game-over' state to 'playing' state,
   * initializes timing, and begins the game loop.
   * 
   * @returns {boolean} True if game started successfully, false otherwise
   * 
   * @example
   * const game = new BaseGame('canvas');
   * // Wait for initialization
   * game.start(); // Returns true if successful
   * 
   * @example
   * // Check if start was successful
   * if (!game.start()) {
   *   console.log('Could not start game in current state:', game.state);
   * }
   */
  start() {
    if (this.state !== 'ready' && this.state !== 'game-over') {
      logger.warn('Cannot start game in current state:', this.state);
      return false;
    }

    // Prevent multiple simultaneous starts
    if (this.gameLoopRunning) {
      logger.warn('Game loop already running, stopping previous loop');
      this.stopGameLoop();
    }

    if (!this.setState('playing')) {
      logger.warn('Failed to transition to playing state');
      return false;
    }

    this.isActive = true;
    this.isPaused = false;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;

    this.onStart();
    this.startGameLoop();
    return true;
  }

  /**
   * Pauses the game with race condition protection.
   * Transitions from 'playing' state to 'paused' state,
   * stops the game loop, and triggers pause callbacks.
   * 
   * @returns {boolean} True if game paused successfully, false otherwise
   * 
   * @example
   * if (game.state === 'playing') {
   *   game.pause(); // Game is now paused
   * }
   * 
   * @example
   * // Pause on window blur
   * window.addEventListener('blur', () => {
   *   if (game.state === 'playing') {
   *     game.pause();
   *   }
   * });
   */
  pause() {
    if (this.state !== 'playing') {
      logger.warn('Cannot pause game in current state:', this.state);
      return false;
    }

    if (!this.setState('paused')) {
      logger.warn('Failed to transition to paused state');
      return false;
    }

    this.isPaused = true;
    this.pausedTime = performance.now();

    // Stop the game loop
    this.stopGameLoop();

    this.onPause();
    this.onPauseCallback();
    return true;
  }

  /**
   * Resumes the game with race condition protection.
   * Transitions from 'paused' state to 'playing' state,
   * adjusts timing to account for pause duration, and restarts the game loop.
   * 
   * @returns {boolean} True if game resumed successfully, false otherwise
   * 
   * @example
   * if (game.state === 'paused') {
   *   game.resume(); // Game continues from where it was paused
   * }
   * 
   * @example
   * // Resume button handler
   * resumeButton.addEventListener('click', () => {
   *   if (game.resume()) {
   *     updateButtonText('Pause');
   *   }
   * });
   */
  resume() {
    if (this.state !== 'paused') {
      logger.warn('Cannot resume game in current state:', this.state);
      return false;
    }

    if (!this.setState('playing')) {
      logger.warn('Failed to transition to playing state');
      return false;
    }

    this.isPaused = false;

    // Adjust timing to account for pause duration
    const pauseDuration = performance.now() - this.pausedTime;
    this.startTime += pauseDuration;
    this.lastFrameTime = performance.now();

    this.onResume();
    this.onResumeCallback();
    this.startGameLoop();
    return true;
  }

  /**
   * Ends the game with race condition protection.
   * Transitions to 'game-over' state, stops the game loop,
   * and triggers game over callbacks with final score.
   * 
   * @returns {boolean} True if game ended successfully, false if already over
   * 
   * @example
   * // End game when lives reach zero
   * if (this.lives <= 0) {
   *   this.gameOver();
   * }
   * 
   * @example
   * // End game after time limit
   * if (this.getElapsedTime() > TIME_LIMIT) {
   *   this.gameOver();
   * }
   */
  gameOver() {
    if (this.state === 'game-over') {
      logger.warn('Game already over');
      return false;
    }

    if (!this.setState('game-over')) {
      logger.warn('Failed to transition to game-over state');
      return false;
    }

    this.isActive = false;
    this.isPaused = false;

    // Stop the game loop
    this.stopGameLoop();

    this.onGameOverCallback();
    this.onGameEnd();
    return true;
  }

  /**
   * Restarts the game by resetting all state to initial values.
   * Clears score, level, lives, timing, and performance tracking.
   * Optionally starts the game automatically after reset.
   * 
   * @param {boolean} [autoStart=true] - Whether to automatically start the game after restart
   * 
   * @example
   * // Restart and begin playing immediately
   * game.restart(); // autoStart defaults to true
   * 
   * @example
   * // Restart but wait for user to manually start
   * game.restart(false);
   * // User can call game.start() when ready
   * 
   * @example
   * // Restart button handler
   * restartButton.addEventListener('click', () => {
   *   game.restart();
   *   updateUI();
   * });
   */
  restart(autoStart = true) {
    // Stop any running game loop immediately
    this.stopGameLoop();

    this.setState('loading');
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.isActive = false;
    this.isPaused = false;
    this.frameCount = 0;
    this.fpsHistory = [];

    // Reset timing
    this.startTime = null;
    this.pausedTime = 0;
    this.lastFrameTime = 0;
    this.gameLoopId = null; // Clear any existing game loop
    this.gameLoopRunning = false; // Ensure loop is not running

    this.onScoreUpdate(this.score);
    this.onLevelUpdate(this.level);

    this.onRestart();
    this.setState('ready');

    // Automatically start the game after restart if requested
    if (autoStart) {
      this.start();
    }
  }

  /**
     * Set game state and notify listeners with race condition protection
     */
  setState(newState) {
    // Prevent concurrent state transitions
    if (this.stateTransitionInProgress) {
      logger.warn(`State transition already in progress, ignoring: ${this.state} → ${newState}`);
      return false;
    }

    this.stateTransitionInProgress = true;

    const oldState = this.state;

    // Validate state transition
    if (!this.isValidStateTransition(oldState, newState)) {
      logger.warn(`Invalid state transition: ${oldState} → ${newState}`);
      this.stateTransitionInProgress = false;
      return false;
    }

    this.state = newState;

    try {
      this.onStateChange(newState, oldState);
      logger.debug(`Game state: ${oldState} → ${newState}`);
    } catch (error) {
      logger.error('Error in state change callback:', error);
    } finally {
      this.stateTransitionInProgress = false;
    }

    return true;
  }

  /**
   * Validate if a state transition is allowed
   */
  isValidStateTransition(from, to) {
    const validTransitions = {
      'loading': ['ready', 'error'],
      'ready': ['playing'],
      'playing': ['paused', 'game-over'],
      'paused': ['playing', 'game-over'],
      'game-over': ['loading', 'ready'],
      'error': ['loading']
    };

    return validTransitions[from]?.includes(to) || false;
  }

  /**
     * Main game loop
     */
  gameLoop(timestamp = performance.now()) {
    // Exit immediately if loop should not be running
    if (!this.gameLoopRunning || !this.isActive || this.isPaused) {
      this.gameLoopId = null;
      this.gameLoopRunning = false;
      return;
    }

    // Calculate delta time
    const deltaTime = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;

    // Update FPS tracking
    this.updateFPS(timestamp);

    // Update game logic
    this.update(deltaTime, timestamp);

    // Render game
    this.render();

    // Continue loop and store the ID - only if still should be running
    if (this.gameLoopRunning && this.isActive && !this.isPaused) {
      this.gameLoopId = requestAnimationFrame((ts) => this.gameLoop(ts));
    } else {
      this.gameLoopId = null;
      this.gameLoopRunning = false;
    }
  }

  /**
     * Update FPS tracking
     */
  updateFPS(timestamp) {
    this.frameCount++;

    if (timestamp - this.lastFpsUpdate >= 1000) {
      const fps = this.frameCount;
      this.fpsHistory.push(fps);

      // Keep only last 10 seconds of history
      if (this.fpsHistory.length > 10) {
        this.fpsHistory.shift();
      }

      this.frameCount = 0;
      this.lastFpsUpdate = timestamp;

      // Warn if FPS is consistently low
      if (this.fpsHistory.length >= 3) {
        const avgFps = this.fpsHistory.reduce((a, b) => a + b) / this.fpsHistory.length;
        if (avgFps < 30) {
          logger.perf('Low FPS detected:', avgFps);
        }
      }
    }
  }

  /**
     * Resize canvas to fit container
     */
  resizeCanvas() {
    const container = this.canvas.parentElement;
    if (!container) {return;}

    const rect = container.getBoundingClientRect();
    const aspectRatio = 16 / 9; // Default aspect ratio

    let width = rect.width - 40; // Account for padding
    let height = width / aspectRatio;

    // Ensure height doesn't exceed container
    if (height > rect.height - 40) {
      height = rect.height - 40;
      width = height * aspectRatio;
    }

    this.canvas.style.width = `${width  }px`;
    this.canvas.style.height = `${height  }px`;
    this.canvas.width = width;
    this.canvas.height = height;

    this.onResize(width, height);
  }

  /**
   * Gets normalized pointer position from mouse or touch event.
   * Handles coordinate transformation and scaling for canvas interactions.
   * 
   * @param {MouseEvent|TouchEvent} event - The pointer event
   * @returns {Object} Position object with pixel and normalized coordinates
   * @returns {number} returns.x - X coordinate in canvas pixels
   * @returns {number} returns.y - Y coordinate in canvas pixels
   * @returns {number} returns.normalizedX - X coordinate normalized to 0-1 range
   * @returns {number} returns.normalizedY - Y coordinate normalized to 0-1 range
   * 
   * @example
   * handleClick(event) {
   *   const pos = this.getPointerPosition(event);
   *   console.log('Clicked at:', pos.x, pos.y);
   *   console.log('Normalized:', pos.normalizedX, pos.normalizedY);
   * }
   * 
   * @example
   * // Check if click is in specific area
   * const pos = this.getPointerPosition(event);
   * if (pos.normalizedX > 0.5 && pos.normalizedY < 0.5) {
   *   // Top-right quadrant clicked
   * }
   */
  getPointerPosition(event) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    let x, y;

    if (event.touches && event.touches.length > 0) {
      x = (event.touches[0].clientX - rect.left) * scaleX;
      y = (event.touches[0].clientY - rect.top) * scaleY;
    } else {
      x = (event.clientX - rect.left) * scaleX;
      y = (event.clientY - rect.top) * scaleY;
    }

    return {
      x,
      y,
      normalizedX: x / this.canvas.width,
      normalizedY: y / this.canvas.height
    };
  }

  /**
   * Plays a simple sound effect using the Web Audio API.
   * Creates a short tone with specified frequency and waveform type.
   * 
   * @param {number} frequency - Sound frequency in Hz
   * @param {number} [duration=200] - Duration in milliseconds
   * @param {string} [type='sine'] - Oscillator type ('sine', 'square', 'triangle', 'sawtooth')
   * 
   * @example
   * // Play different sound effects
   * game.playSound(440, 100);           // A4 note for 100ms
   * game.playSound(880, 200, 'square'); // Higher pitch square wave
   * game.playSound(220, 500, 'triangle'); // Lower pitch triangle wave
   * 
   * @example
   * // Game event sounds
   * game.playSound(600, 100);  // Point scored
   * game.playSound(200, 300);  // Game over
   * game.playSound(800, 50);   // UI click
   */
  playSound(frequency, duration = 200, type = 'sine') {
    if (!this.soundEnabled || !this.audioContext) {return;}

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (error) {
      logger.warn('Sound playback failed:', error);
    }
  }

  /**
   * Updates the game score and notifies listeners.
   * Ensures score never goes below zero and triggers score update callback.
   * 
   * @param {number} newScore - The new score value
   * 
   * @example
   * // Set specific score
   * game.updateScore(150);
   * 
   * @example
   * // Update score based on game events
   * if (playerHitTarget) {
   *   game.updateScore(game.score + 10);
   * }
   */
  updateScore(newScore) {
    this.score = Math.max(0, newScore);
    this.onScoreUpdate(this.score);
  }

  /**
   * Adds points to the current score.
   * Convenience method for incrementing score by a specific amount.
   * 
   * @param {number} points - Points to add to current score
   * 
   * @example
   * // Add points for various achievements
   * game.addScore(10);  // Small target hit
   * game.addScore(50);  // Bonus target
   * game.addScore(100); // Perfect combo
   * 
   * @example
   * // Subtract points for penalties
   * game.addScore(-5); // Missed shot penalty
   */
  addScore(points) {
    this.updateScore(this.score + points);
  }

  /**
     * Update level and notify listeners
     */
  updateLevel(newLevel) {
    this.level = Math.max(1, newLevel);
    this.onLevelUpdate(this.level);
  }

  /**
   * Updates game logic each frame. Must be overridden in subclasses.
   * Called automatically by the game loop with timing information.
   * 
   * @param {number} _deltaTime - Time elapsed since last frame in milliseconds
   * @param {number} _timestamp - Current timestamp from performance.now()
   * 
   * @example
   * // Override in your game class
   * update(deltaTime, timestamp) {
   *   // Update player position
   *   this.player.x += this.player.velocity * deltaTime;
   *   
   *   // Check collisions
   *   this.checkCollisions();
   *   
   *   // Update game objects
   *   this.enemies.forEach(enemy => enemy.update(deltaTime));
   * }
   * 
   * @abstract
   */
  update(_deltaTime, _timestamp) {
    // Override in subclasses
  }

  /**
   * Renders the game graphics each frame. Must be overridden in subclasses.
   * Base implementation clears the canvas - call super.render() to clear before drawing.
   * 
   * @example
   * // Override in your game class
   * render() {
   *   super.render(); // Clear canvas
   *   
   *   // Draw game objects
   *   this.player.draw(this.ctx);
   *   this.enemies.forEach(enemy => enemy.draw(this.ctx));
   *   
   *   // Draw UI
   *   this.drawHUD();
   * }
   * 
   * @abstract
   */
  render() {
    // Override in subclasses
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Input event handlers - override in subclasses
  handleKeyDown(event) {
    this.keys.add(event.code);
    this.onKeyDown?.(event);
  }

  handleKeyUp(event) {
    this.keys.delete(event.code);
    this.onKeyUp?.(event);
  }

  handleClick(event) {
    const pos = this.getPointerPosition(event);
    this.onClick?.(pos, event);
  }

  handleMouseMove(event) {
    this.mousePosition = this.getPointerPosition(event);
    this.onMouseMove?.(this.mousePosition, event);
  }

  handleMouseDown(event) {
    const pos = this.getPointerPosition(event);
    this.onMouseDown?.(pos, event);
  }

  handleMouseUp(event) {
    const pos = this.getPointerPosition(event);
    this.onMouseUp?.(pos, event);
  }

  handleTouchStart(event) {
    event.preventDefault();

    for (const touch of event.touches) {
      const pos = this.getPointerPosition({ clientX: touch.clientX, clientY: touch.clientY });
      this.touches.set(touch.identifier, pos);
    }

    this.onTouchStart?.(Array.from(this.touches.values()), event);
  }

  handleTouchMove(event) {
    event.preventDefault();

    for (const touch of event.touches) {
      const pos = this.getPointerPosition({ clientX: touch.clientX, clientY: touch.clientY });
      this.touches.set(touch.identifier, pos);
    }

    this.onTouchMove?.(Array.from(this.touches.values()), event);
  }

  handleTouchEnd(event) {
    event.preventDefault();

    for (const touch of event.changedTouches) {
      this.touches.delete(touch.identifier);
    }

    this.onTouchEnd?.(Array.from(this.touches.values()), event);
  }

  handleResize() {
    this.resizeCanvas();
  }

  handleWindowBlur() {
    if (this.state === 'playing') {
      this.pause();
    }
  }

  handleWindowFocus() {
    // Don't auto-resume - let user choose
  }

  handleVisibilityChange() {
    if (document.hidden && this.state === 'playing') {
      this.pause();
    }
  }

  /**
   * Checks if a specific key is currently pressed.
   * Uses KeyboardEvent.code values for consistent cross-layout support.
   * 
   * @param {string} keyCode - The key code to check (e.g., 'Space', 'ArrowUp', 'KeyW')
   * @returns {boolean} True if the key is currently pressed
   * 
   * @example
   * // Check movement keys in update loop
   * update(deltaTime) {
   *   if (this.isKeyPressed('ArrowLeft')) {
   *     this.player.moveLeft();
   *   }
   *   if (this.isKeyPressed('Space')) {
   *     this.player.jump();
   *   }
   * }
   * 
   * @example
   * // Multiple key combinations
   * if (this.isKeyPressed('KeyW') && this.isKeyPressed('KeyA')) {
   *   this.player.moveNorthWest();
   * }
   */
  isKeyPressed(keyCode) {
    return this.keys.has(keyCode);
  }

  /**
   * Gets the number of active touch points.
   * Useful for detecting multi-touch gestures and interactions.
   * 
   * @returns {number} Number of active touches
   * 
   * @example
   * // Handle different touch counts
   * if (this.getTouchCount() === 1) {
   *   // Single finger - move player
   * } else if (this.getTouchCount() === 2) {
   *   // Two fingers - special action
   * }
   */
  getTouchCount() {
    return this.touches.size;
  }

  /**
   * Gets the elapsed time since the game started.
   * Accounts for pause time by using the adjusted start time.
   * 
   * @returns {number} Elapsed time in milliseconds, or 0 if not started
   * 
   * @example
   * // Check time limits
   * update() {
   *   const elapsed = this.getElapsedTime();
   *   if (elapsed > 60000) { // 1 minute
   *     this.gameOver();
   *   }
   * }
   * 
   * @example
   * // Display timer
   * const seconds = Math.floor(this.getElapsedTime() / 1000);
   * timerDisplay.textContent = `${seconds}s`;
   */
  getElapsedTime() {
    if (!this.startTime) {return 0;}
    return performance.now() - this.startTime;
  }

  /**
   * Gets the average frames per second over recent history.
   * Based on the last 10 seconds of FPS measurements.
   * 
   * @returns {number} Average FPS, or 0 if no history available
   * 
   * @example
   * // Monitor performance
   * const fps = this.getAverageFPS();
   * if (fps < 30) {
   *   console.warn('Low FPS detected:', fps);
   *   this.reduceGraphicsQuality();
   * }
   * 
   * @example
   * // Display performance info
   * debugInfo.textContent = `FPS: ${Math.round(this.getAverageFPS())}`;
   */
  getAverageFPS() {
    if (this.fpsHistory.length === 0) {return 0;}
    return this.fpsHistory.reduce((a, b) => a + b) / this.fpsHistory.length;
  }

  /**
     * Callback methods (used by GameTemplateLoader)
     */
  onPauseCallback() {
    this.onPause();
  }

  onResumeCallback() {
    this.onResume();
  }

  onGameOverCallback() {
    this.onGameOver(this.score);
  }

  /**
   * Completely destroys the game instance and cleans up all resources.
   * Stops the game loop, removes event listeners, closes audio context,
   * and clears all references to prevent memory leaks.
   * 
   * @example
   * // Clean up when navigating away
   * window.addEventListener('beforeunload', () => {
   *   game.destroy();
   * });
   * 
   * @example
   * // Clean up when switching games
   * function switchToNewGame() {
   *   currentGame.destroy();
   *   currentGame = new NewGame('canvas');
   * }
   */
  destroy() {
    this.isActive = false;
    this.isPaused = false;

    // Stop game loop completely
    this.stopGameLoop();

    // Remove event listeners using bound handlers for proper cleanup
    if (this.boundHandlers) {
      document.removeEventListener('keydown', this.boundHandlers.keydown);
      document.removeEventListener('keyup', this.boundHandlers.keyup);

      if (this.canvas) {
        this.canvas.removeEventListener('click', this.boundHandlers.click);
        this.canvas.removeEventListener('mousemove', this.boundHandlers.mousemove);
        this.canvas.removeEventListener('mousedown', this.boundHandlers.mousedown);
        this.canvas.removeEventListener('mouseup', this.boundHandlers.mouseup);
        this.canvas.removeEventListener('touchstart', this.boundHandlers.touchstart);
        this.canvas.removeEventListener('touchmove', this.boundHandlers.touchmove);
        this.canvas.removeEventListener('touchend', this.boundHandlers.touchend);
      }

      window.removeEventListener('resize', this.boundHandlers.resize);
      window.removeEventListener('blur', this.boundHandlers.blur);
      window.removeEventListener('focus', this.boundHandlers.focus);
      document.removeEventListener('visibilitychange', this.boundHandlers.visibilitychange);

      // Clear bound handlers
      this.boundHandlers = null;
    }

    // Close audio context safely
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (error) {
        logger.warn('Error closing audio context:', error);
      }
      this.audioContext = null;
    }

    // Clear references to prevent memory leaks
    this.canvas = null;
    this.ctx = null;
    this.keys.clear();
    this.touches.clear();
    this.fpsHistory = [];

    // Clear callbacks to prevent references
    this.onScoreUpdate = null;
    this.onLevelUpdate = null;
    this.onGameOver = null;
    this.onPause = null;
    this.onResume = null;
    this.onStateChange = null;

    logger.debug(`${this.constructor.name} destroyed`);
  }

  /**
     * Start the game loop with protection against multiple instances
     */
  startGameLoop() {
    if (this.gameLoopRunning) {
      logger.warn('Attempted to start game loop while already running');
      return;
    }

    this.gameLoopRunning = true;
    this.gameLoopId = null;
    this.gameLoop();
  }

  /**
     * Stop the game loop completely
     */
  stopGameLoop() {
    this.gameLoopRunning = false;
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
      this.gameLoopId = null;
    }
  }
}