/**
 * BaseGame - Base class for all Learnimals games
 * Provides common functionality for game state management, scoring, and UI integration
 */
export default class BaseGame {
  constructor(canvasId, options = {}) {
    // Core properties
    this.canvasId = canvasId;
    this.canvas = document.getElementById(canvasId);
    this.options = options;
        
    // Game state
    this.state = 'loading'; // loading, playing, paused, game-over
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.isActive = false;
    this.isPaused = false;
        
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
     * Initialize the game - called by constructor
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
      console.error('Game initialization failed:', error);
      this.setState('error');
      throw error;
    }
  }
    
  /**
     * Validate canvas element exists and is accessible
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
     * Set up canvas properties and responsive sizing
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
      this.canvas.style.width = rect.width + 'px';
      this.canvas.style.height = rect.height + 'px';
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
    // Keyboard events
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
    // Mouse events
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
    // Touch events
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        
    // Window events
    window.addEventListener('resize', () => this.handleResize());
    window.addEventListener('blur', () => this.handleWindowBlur());
    window.addEventListener('focus', () => this.handleWindowFocus());
        
    // Visibility API
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
  }
    
  /**
     * Set up audio context for sound effects
     */
  setupAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.soundEnabled = true;
    } catch (error) {
      console.warn('Audio not supported:', error);
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
    console.log(`${this.constructor.name} initialized successfully`);
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
     * Start the game
     */
  start() {
    if (this.state !== 'ready' && this.state !== 'game-over') {
      console.warn('Cannot start game in current state:', this.state);
      return;
    }
        
    // Prevent multiple simultaneous starts
    if (this.gameLoopRunning) {
      console.warn('Game loop already running, stopping previous loop');
      this.stopGameLoop();
    }
        
    this.setState('playing');
    this.isActive = true;
    this.isPaused = false;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
        
    this.onStart();
    this.startGameLoop();
  }
    
  /**
     * Pause the game
     */
  pause() {
    if (this.state !== 'playing') return;
        
    this.setState('paused');
    this.isPaused = true;
    this.pausedTime = performance.now();
    
    // Stop the game loop
    this.stopGameLoop();
    
    this.onPause();
    this.onPauseCallback();
  }
    
  /**
     * Resume the game
     */
  resume() {
    if (this.state !== 'paused') return;
        
    this.setState('playing');
    this.isPaused = false;
        
    // Adjust timing to account for pause duration
    const pauseDuration = performance.now() - this.pausedTime;
    this.startTime += pauseDuration;
    this.lastFrameTime = performance.now();
        
    this.onResume();
    this.onResumeCallback();
    this.startGameLoop();
  }
    
  /**
     * End the game
     */
  gameOver() {
    this.setState('game-over');
    this.isActive = false;
    this.isPaused = false;
    
    // Stop the game loop
    this.stopGameLoop();
        
    this.onGameOverCallback();
    this.onGameEnd();
  }
    
  /**
     * Restart the game
     * @param {boolean} autoStart - Whether to automatically start the game after restart (default: true)
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
     * Set game state and notify listeners
     */
  setState(newState) {
    const oldState = this.state;
    this.state = newState;
    this.onStateChange(newState, oldState);
    console.log(`Game state: ${oldState} → ${newState}`);
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
          console.warn('Low FPS detected:', avgFps);
        }
      }
    }
  }
    
  /**
     * Resize canvas to fit container
     */
  resizeCanvas() {
    const container = this.canvas.parentElement;
    if (!container) return;
        
    const rect = container.getBoundingClientRect();
    const aspectRatio = 16 / 9; // Default aspect ratio
        
    let width = rect.width - 40; // Account for padding
    let height = width / aspectRatio;
        
    // Ensure height doesn't exceed container
    if (height > rect.height - 40) {
      height = rect.height - 40;
      width = height * aspectRatio;
    }
        
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.canvas.width = width;
    this.canvas.height = height;
        
    this.onResize(width, height);
  }
    
  /**
     * Get normalized pointer position (0-1 range)
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
      x: x,
      y: y,
      normalizedX: x / this.canvas.width,
      normalizedY: y / this.canvas.height
    };
  }
    
  /**
     * Play sound effect
     */
  playSound(frequency, duration = 200, type = 'sine') {
    if (!this.soundEnabled || !this.audioContext) return;
        
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
      console.warn('Sound playback failed:', error);
    }
  }
    
  /**
     * Update score and notify listeners
     */
  updateScore(newScore) {
    this.score = Math.max(0, newScore);
    this.onScoreUpdate(this.score);
  }
    
  /**
     * Add to score
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
     * Event handler methods - override in subclasses
     */
  update(_deltaTime, _timestamp) {
    // Override in subclasses
  }
    
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
     * Utility methods
     */
  isKeyPressed(keyCode) {
    return this.keys.has(keyCode);
  }
    
  getTouchCount() {
    return this.touches.size;
  }
    
  getElapsedTime() {
    if (!this.startTime) return 0;
    return performance.now() - this.startTime;
  }
    
  getAverageFPS() {
    if (this.fpsHistory.length === 0) return 0;
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
     * Cleanup method
     */
  destroy() {
    this.isActive = false;
    this.isPaused = false;
    
    // Stop game loop completely
    this.stopGameLoop();
        
    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
        
    if (this.canvas) {
      this.canvas.removeEventListener('click', this.handleClick);
      this.canvas.removeEventListener('mousemove', this.handleMouseMove);
      this.canvas.removeEventListener('mousedown', this.handleMouseDown);
      this.canvas.removeEventListener('mouseup', this.handleMouseUp);
      this.canvas.removeEventListener('touchstart', this.handleTouchStart);
      this.canvas.removeEventListener('touchmove', this.handleTouchMove);
      this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    }
        
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('focus', this.handleWindowFocus);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
        
    // Clear references
    this.canvas = null;
    this.ctx = null;
    this.keys.clear();
    this.touches.clear();
        
    console.log(`${this.constructor.name} destroyed`);
  }
    
  /**
     * Start the game loop with protection against multiple instances
     */
  startGameLoop() {
    if (this.gameLoopRunning) {
      console.warn('Attempted to start game loop while already running');
      return;
    }
    
    console.log('Starting game loop');
    this.gameLoopRunning = true;
    this.gameLoopId = null;
    this.gameLoop();
  }
    
  /**
     * Stop the game loop completely
     */
  stopGameLoop() {
    if (this.gameLoopRunning) {
      console.log('Stopping game loop');
    }
    this.gameLoopRunning = false;
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
      this.gameLoopId = null;
    }
  }
}