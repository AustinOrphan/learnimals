/**
 * BaseGame - Base class for all Learnimals games
 * Provides common functionality for game state management, scoring, and UI integration
 * Enhanced with progress tracking, mobile-first design, and analytics
 */
import logger from '../../utils/logger.js';
import ProgressTracker from '../../features/progress/ProgressTracker.js';
import AchievementSystem from '../../features/progress/AchievementSystem.js';

export default class BaseGame {
  constructor(containerId, options = {}) {
    // Core properties
    this.containerId = containerId;
    this.useDOMContainer = options.useDOMContainer || false;
    
    if (this.useDOMContainer) {
      this.container = document.getElementById(containerId);
      this.canvas = null;
      this.ctx = null;
    } else {
      this.canvasId = containerId; // Backward compatibility
      this.canvas = document.getElementById(containerId);
      this.container = this.canvas;
    }
    
    this.options = options;
        
    // Game state with atomic operations for thread safety
    this.state = 'loading'; // loading, playing, paused, game-over
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.isActive = false;
    this.isPaused = false;
    this.stateTransitionInProgress = false;
    
    // Enhanced game metadata
    this.gameType = options.gameType || 'unknown';
    this.subject = options.subject || 'general';
    this.difficulty = options.difficulty || 'medium';
    this.sessionId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Progress tracking integration
    this.progressTracker = null;
    this.achievementSystem = null;
    this.enableProgressTracking = options.enableProgressTracking !== false;
    
    // Analytics and metrics
    this.analytics = {
      sessionStartTime: null,
      totalPlayTime: 0,
      pauseCount: 0,
      restartCount: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      streakRecord: 0,
      currentStreak: 0,
      timeSpentPerLevel: new Map(),
      difficultyChanges: []
    };
    
    // Mobile-first enhancements
    this.isMobile = this.detectMobileDevice();
    this.touchSensitivity = options.touchSensitivity || (this.isMobile ? 0.8 : 1.0);
    this.hapticFeedback = options.hapticFeedback !== false && 'vibrate' in navigator;
        
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
      if (this.useDOMContainer) {
        this.validateContainer();
        this.setupDOMContainer();
      } else {
        this.validateCanvas();
        this.setupCanvas();
      }
      this.setupEventListeners();
      this.setupAudio();
      this.setupProgressTracking();
      this.setupMobileOptimizations();
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
     * Validate DOM container element exists and is accessible
     */
  validateContainer() {
    if (!this.container) {
      throw new Error(`Container element with ID '${this.containerId}' not found`);
    }
  }
    
  /**
     * Set up DOM container for DOM-based games
     */
  setupDOMContainer() {
    if (!this.container) {
      throw new Error('DOM container not found');
    }
    
    // Add mobile-optimized CSS classes
    this.container.classList.add('game-container');
    if (this.isMobile) {
      this.container.classList.add('mobile-optimized');
    }
    
    // Set up container properties for mobile-first design
    this.container.style.touchAction = 'manipulation';
    this.container.style.userSelect = 'none';
    this.container.style.webkitUserSelect = 'none';
    this.container.style.webkitTapHighlightColor = 'transparent';
    
    // Ensure container can handle focus for accessibility
    if (!this.container.hasAttribute('tabindex')) {
      this.container.setAttribute('tabindex', '0');
    }
    
    logger.debug('DOM container setup completed');
  }
    
  /**
     * Set up canvas properties and responsive sizing
     */
  setupCanvas() {
    // Set canvas size with mobile-first responsive approach
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
        
    // Set default canvas styles with mobile optimizations
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    
    // Mobile-specific canvas optimizations
    if (this.isMobile) {
      // Optimize for touch interactions
      this.canvas.style.touchAction = 'manipulation';
      this.canvas.style.userSelect = 'none';
      this.canvas.style.webkitUserSelect = 'none';
      this.canvas.style.webkitTapHighlightColor = 'transparent';
    }
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
        
    // Mouse and touch events - use container for DOM games, canvas for canvas games
    const eventTarget = this.useDOMContainer ? this.container : this.canvas;
    
    if (eventTarget) {
      eventTarget.addEventListener('click', this.boundHandlers.click);
      eventTarget.addEventListener('mousemove', this.boundHandlers.mousemove);
      eventTarget.addEventListener('mousedown', this.boundHandlers.mousedown);
      eventTarget.addEventListener('mouseup', this.boundHandlers.mouseup);
      
      // Touch events
      eventTarget.addEventListener('touchstart', this.boundHandlers.touchstart, { passive: false });
      eventTarget.addEventListener('touchmove', this.boundHandlers.touchmove, { passive: false });
      eventTarget.addEventListener('touchend', this.boundHandlers.touchend, { passive: false });
    }
        
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
   * Set up progress tracking integration
   */
  setupProgressTracking() {
    if (!this.enableProgressTracking) {
      logger.debug('Progress tracking disabled for this game');
      return;
    }
    
    try {
      // Initialize progress tracker
      this.progressTracker = new ProgressTracker();
      
      // Initialize achievement system  
      this.achievementSystem = new AchievementSystem();
      
      logger.debug('Progress tracking initialized successfully');
    } catch (error) {
      logger.warn('Failed to initialize progress tracking:', error);
      this.enableProgressTracking = false;
    }
  }
  
  /**
   * Set up mobile-specific optimizations
   */
  setupMobileOptimizations() {
    if (!this.isMobile) {
      return;
    }
    
    // Prevent zoom on double tap for game canvas
    let lastTouchEnd = 0;
    this.canvas.addEventListener('touchend', (e) => {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });
    
    // Optimize viewport for mobile gaming
    this.setupMobileViewport();
    
    // Setup mobile-specific event listeners
    this.setupMobileEventListeners();
    
    logger.debug('Mobile optimizations applied');
  }
  
  /**
   * Detect if running on mobile device
   */
  detectMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
  }
  
  /**
   * Setup mobile viewport optimizations
   */
  setupMobileViewport() {
    // Ensure proper mobile viewport
    let viewport = document.querySelector('meta[name=viewport]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    
    // Prevent pull-to-refresh on mobile
    document.body.style.overscrollBehavior = 'none';
  }
  
  /**
   * Setup mobile-specific event listeners
   */
  setupMobileEventListeners() {
    // Prevent context menu on long press
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.handleOrientationChange(), 500);
    });
    
    // Handle focus changes for mobile keyboards
    window.addEventListener('resize', () => {
      if (this.isMobile) {
        setTimeout(() => this.resizeCanvas(), 100);
      }
    });
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
     * Start the game with race condition protection
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
    
    // Analytics tracking
    this.analytics.sessionStartTime = this.startTime;
    this.analytics.timeSpentPerLevel.set(this.level, performance.now());
    
    // Progress tracking
    this.trackGameStart();
        
    this.onStart();
    this.startGameLoop();
    return true;
  }
    
  /**
     * Pause the game with race condition protection
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
    
    // Analytics tracking
    this.analytics.pauseCount++;
    this.updatePlayTime();
    
    // Stop the game loop
    this.stopGameLoop();
    
    this.onPause();
    this.onPauseCallback();
    return true;
  }
    
  /**
     * Resume the game with race condition protection
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
     * End the game with race condition protection
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
    
    // Update analytics with final session data
    this.updatePlayTime();
    this.finalizeGameSession();
    
    // Track progress and achievements
    this.trackGameEnd();
    
    // Stop the game loop
    this.stopGameLoop();
        
    this.onGameOverCallback();
    this.onGameEnd();
    return true;
  }
    
  /**
     * Restart the game
     * @param {boolean} autoStart - Whether to automatically start the game after restart (default: true)
     */
  restart(autoStart = true) {
    // Stop any running game loop immediately
    this.stopGameLoop();
    
    // Analytics tracking
    this.analytics.restartCount++;
    
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
    
    // Reset analytics for new session
    this.resetAnalytics();
        
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
     * Main game loop - supports both canvas and DOM-based games
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
        
    // Render game (canvas games override this, DOM games may not need it)
    if (!this.useDOMContainer) {
      this.render();
    }
        
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
    const target = this.useDOMContainer ? this.container : this.canvas;
    const rect = target.getBoundingClientRect();
    
    let x, y;
        
    if (event.touches && event.touches.length > 0) {
      x = event.touches[0].clientX - rect.left;
      y = event.touches[0].clientY - rect.top;
    } else {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    }
    
    // For canvas games, apply scaling
    if (!this.useDOMContainer && this.canvas) {
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      x *= scaleX;
      y *= scaleY;
      
      return {
        x: x,
        y: y,
        normalizedX: x / this.canvas.width,
        normalizedY: y / this.canvas.height
      };
    }
    
    // For DOM games, use container dimensions
    return {
      x: x,
      y: y,
      normalizedX: x / rect.width,
      normalizedY: y / rect.height
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
      logger.warn('Sound playback failed:', error);
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
    // Clear canvas (only for canvas-based games)
    if (!this.useDOMContainer && this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
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
   * Enhanced analytics and progress tracking methods
   */
  
  /**
   * Track correct answer with analytics and progress
   */
  trackCorrectAnswer(questionData = {}) {
    this.analytics.questionsAnswered++;
    this.analytics.correctAnswers++;
    this.analytics.currentStreak++;
    
    if (this.analytics.currentStreak > this.analytics.streakRecord) {
      this.analytics.streakRecord = this.analytics.currentStreak;
    }
    
    // Mobile haptic feedback for correct answers
    if (this.hapticFeedback) {
      navigator.vibrate(50);
    }
    
    // Progress tracking
    if (this.enableProgressTracking && this.progressTracker) {
      this.progressTracker.recordActivity({
        type: 'question_correct',
        subject: this.subject,
        gameType: this.gameType,
        difficulty: this.difficulty,
        level: this.level,
        score: this.score,
        questionData
      });
    }
    
    // Check for achievements
    this.checkAchievements();
  }
  
  /**
   * Track incorrect answer with analytics
   */
  trackIncorrectAnswer(questionData = {}) {
    this.analytics.questionsAnswered++;
    this.analytics.incorrectAnswers++;
    this.analytics.currentStreak = 0;
    
    // Different haptic feedback for incorrect answers
    if (this.hapticFeedback) {
      navigator.vibrate([100, 50, 100]);
    }
    
    // Progress tracking
    if (this.enableProgressTracking && this.progressTracker) {
      this.progressTracker.recordActivity({
        type: 'question_incorrect',
        subject: this.subject,
        gameType: this.gameType,
        difficulty: this.difficulty,
        level: this.level,
        score: this.score,
        questionData
      });
    }
  }
  
  /**
   * Track level completion
   */
  trackLevelComplete(levelData = {}) {
    const levelTime = this.analytics.timeSpentPerLevel.get(this.level);
    const timeSpent = levelTime ? performance.now() - levelTime : 0;
    
    if (this.enableProgressTracking && this.progressTracker) {
      this.progressTracker.recordActivity({
        type: 'level_complete',
        subject: this.subject,
        gameType: this.gameType,
        difficulty: this.difficulty,
        level: this.level,
        score: this.score,
        timeSpent,
        levelData
      });
    }
    
    this.checkAchievements();
  }
  
  /**
   * Track game start
   */
  trackGameStart() {
    if (this.enableProgressTracking && this.progressTracker) {
      this.progressTracker.recordActivity({
        type: 'game_start',
        subject: this.subject,
        gameType: this.gameType,
        difficulty: this.difficulty,
        sessionId: this.sessionId
      });
    }
  }
  
  /**
   * Track game end with final statistics
   */
  trackGameEnd() {
    const accuracy = this.analytics.questionsAnswered > 0 
      ? (this.analytics.correctAnswers / this.analytics.questionsAnswered) * 100 
      : 0;
      
    if (this.enableProgressTracking && this.progressTracker) {
      this.progressTracker.recordActivity({
        type: 'game_end',
        subject: this.subject,
        gameType: this.gameType,
        difficulty: this.difficulty,
        sessionId: this.sessionId,
        finalScore: this.score,
        finalLevel: this.level,
        totalPlayTime: this.analytics.totalPlayTime,
        accuracy,
        questionsAnswered: this.analytics.questionsAnswered,
        streakRecord: this.analytics.streakRecord
      });
    }
    
    this.saveGameStatistics();
  }
  
  /**
   * Check and unlock achievements
   */
  checkAchievements() {
    if (!this.enableProgressTracking || !this.achievementSystem) {
      return;
    }
    
    // Check for streak achievements
    if (this.analytics.currentStreak >= 5) {
      this.achievementSystem.checkAchievement('streak_5', { streak: this.analytics.currentStreak });
    }
    
    if (this.analytics.currentStreak >= 10) {
      this.achievementSystem.checkAchievement('streak_10', { streak: this.analytics.currentStreak });
    }
    
    // Check for score achievements
    if (this.score >= 100) {
      this.achievementSystem.checkAchievement('score_100', { score: this.score });
    }
    
    if (this.score >= 500) {
      this.achievementSystem.checkAchievement('score_500', { score: this.score });
    }
    
    // Check for level achievements
    if (this.level >= 5) {
      this.achievementSystem.checkAchievement('level_5', { level: this.level });
    }
    
    if (this.level >= 10) {
      this.achievementSystem.checkAchievement('level_10', { level: this.level });
    }
  }
  
  /**
   * Update total play time
   */
  updatePlayTime() {
    if (this.analytics.sessionStartTime) {
      this.analytics.totalPlayTime = performance.now() - this.analytics.sessionStartTime;
    }
  }
  
  /**
   * Reset analytics for new session
   */
  resetAnalytics() {
    const restartCount = this.analytics.restartCount;
    this.analytics = {
      sessionStartTime: null,
      totalPlayTime: 0,
      pauseCount: 0,
      restartCount,
      questionsAnswered: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      streakRecord: 0,
      currentStreak: 0,
      timeSpentPerLevel: new Map(),
      difficultyChanges: []
    };
  }
  
  /**
   * Finalize game session data
   */
  finalizeGameSession() {
    const sessionData = {
      sessionId: this.sessionId,
      gameType: this.gameType,
      subject: this.subject,
      finalScore: this.score,
      finalLevel: this.level,
      totalPlayTime: this.analytics.totalPlayTime,
      accuracy: this.analytics.questionsAnswered > 0 
        ? (this.analytics.correctAnswers / this.analytics.questionsAnswered) * 100 
        : 0,
      ...this.analytics
    };
    
    logger.debug('Game session completed:', sessionData);
    return sessionData;
  }
  
  /**
   * Save game statistics to localStorage
   */
  saveGameStatistics() {
    try {
      const stats = this.finalizeGameSession();
      const key = `${this.gameType}_stats`;
      const existingStats = JSON.parse(localStorage.getItem(key) || '[]');
      existingStats.push(stats);
      
      // Keep only last 50 sessions to prevent storage bloat
      if (existingStats.length > 50) {
        existingStats.splice(0, existingStats.length - 50);
      }
      
      localStorage.setItem(key, JSON.stringify(existingStats));
    } catch (error) {
      logger.warn('Failed to save game statistics:', error);
    }
  }
  
  /**
   * Handle orientation change for mobile devices
   */
  handleOrientationChange() {
    if (!this.isMobile) return;
    
    // Pause game during orientation change
    if (this.state === 'playing') {
      this.pause();
    }
    
    // Resize canvas after orientation change
    setTimeout(() => {
      this.resizeCanvas();
      this.onOrientationChange();
    }, 100);
    
    logger.debug('Orientation changed, game paused and canvas resized');
  }
  
  /**
   * Called when orientation changes - override in subclasses
   */
  onOrientationChange() {
    // Base implementation - subclasses can override
  }
  
  /**
   * Enhanced mobile-friendly scoring with visual feedback
   */
  addScoreWithFeedback(points, position = null) {
    this.addScore(points);
    
    // Mobile haptic feedback
    if (this.hapticFeedback && points > 0) {
      navigator.vibrate(25);
    }
    
    // Visual score feedback (to be implemented by subclasses)
    this.showScoreFeedback(points, position);
  }
  
  /**
   * Show visual score feedback - override in subclasses
   */
  showScoreFeedback(points, position) {
    // Base implementation - subclasses should override for visual effects
    logger.debug(`Score feedback: +${points} points`, position);
  }
  
  /**
   * Get game analytics summary
   */
  getAnalyticsSummary() {
    const accuracy = this.analytics.questionsAnswered > 0 
      ? (this.analytics.correctAnswers / this.analytics.questionsAnswered) * 100 
      : 0;
      
    return {
      score: this.score,
      level: this.level,
      accuracy: Math.round(accuracy),
      questionsAnswered: this.analytics.questionsAnswered,
      streakRecord: this.analytics.streakRecord,
      totalPlayTime: Math.round(this.analytics.totalPlayTime / 1000), // Convert to seconds
      pauseCount: this.analytics.pauseCount,
      restartCount: this.analytics.restartCount
    };
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