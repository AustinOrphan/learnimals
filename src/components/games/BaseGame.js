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
      difficultyChanges: [],
      feedbackEvents: []
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
    
    // Feedback system configuration
    this.feedbackConfig = {
      enabled: options.enableFeedback !== false,
      character: options.character || this.getDefaultCharacter(),
      audioEnabled: options.enableAudio !== false,
      hapticEnabled: options.enableHaptic !== false && this.hapticFeedback,
      accessibilityEnabled: options.enableA11y !== false,
      reducedMotion: this.detectReducedMotion(),
      feedbackDuration: options.feedbackDuration || 2000,
      debugMode: options.debugFeedback || false
    };
    
    // Feedback state management
    this.feedbackState = {
      activeFeedbacks: new Map(),
      feedbackQueue: [],
      lastFeedbackTime: 0,
      feedbackCounter: 0,
      ariaLiveRegion: null,
      feedbackContainer: null
    };
    
    // Character audio libraries (lazy loaded)
    this.characterAudio = {
      bella: null,   // Reading bunny
      max: null,     // Math bear  
      zara: null,    // Science zebra
      aria: null,    // Art owl
      codecat: null  // Coding cat
    };
        
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
      this.setupFeedbackSystem();
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
   * Set up feedback system infrastructure
   */
  setupFeedbackSystem() {
    if (!this.feedbackConfig.enabled) {
      logger.debug('Feedback system disabled for this game');
      return;
    }
    
    try {
      // Create ARIA live region for accessibility
      this.createAriaLiveRegion();
      
      // Create feedback container for visual feedback
      this.createFeedbackContainer();
      
      // Initialize character audio system
      this.initializeCharacterAudio();
      
      // Set up accessibility event listeners
      this.setupAccessibilityListeners();
      
      logger.debug('Feedback system initialized successfully');
    } catch (error) {
      logger.error('Feedback system setup failed:', error);
      this.feedbackConfig.enabled = false;
    }
  }
  
  /**
   * Get default character based on subject
   */
  getDefaultCharacter() {
    const characterMap = {
      'reading': 'bella',
      'math': 'max', 
      'science': 'zara',
      'art': 'aria',
      'coding': 'codecat'
    };
    return characterMap[this.subject] || 'bella';
  }
  
  /**
   * Detect reduced motion preference
   */
  detectReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  
  /**
   * Create ARIA live region for screen reader announcements
   */
  createAriaLiveRegion() {
    if (this.feedbackState.ariaLiveRegion) return;
    
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.setAttribute('class', 'visually-hidden');
    liveRegion.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    
    document.body.appendChild(liveRegion);
    this.feedbackState.ariaLiveRegion = liveRegion;
  }
  
  /**
   * Create feedback container for visual feedback elements
   */
  createFeedbackContainer() {
    if (this.feedbackState.feedbackContainer) return;
    
    const container = document.createElement('div');
    container.setAttribute('class', 'game-feedback-container');
    container.setAttribute('aria-hidden', 'true');
    container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
    `;
    
    // Append to game container or body
    const parent = this.container || document.body;
    parent.appendChild(container);
    this.feedbackState.feedbackContainer = container;
  }
  
  /**
   * Initialize character audio system (lazy loading)
   */
  initializeCharacterAudio() {
    // Character audio will be loaded on-demand when first needed
    // This prevents blocking the game initialization
    this.characterAudio[this.feedbackConfig.character] = {
      loaded: false,
      loading: false,
      sounds: new Map()
    };
  }
  
  /**
   * Set up accessibility event listeners
   */
  setupAccessibilityListeners() {
    // Listen for reduced motion changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      mediaQuery.addListener((e) => {
        this.feedbackConfig.reducedMotion = e.matches;
        logger.debug('Reduced motion preference changed:', e.matches);
      });
    }
    
    // Listen for focus events to manage feedback properly
    if (this.container) {
      this.container.addEventListener('focus', () => {
        this.feedbackState.containerHasFocus = true;
      });
      
      this.container.addEventListener('blur', () => {
        this.feedbackState.containerHasFocus = false;
      });
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
   * Main feedback system method - provides consistent feedback across all games
   * @param {string} type - Feedback type: 'success', 'error', 'hint', 'progress', 'achievement'
   * @param {string} message - Primary feedback message
   * @param {Object} options - Configuration options
   */
  showFeedback(type, message, options = {}) {
    if (!this.feedbackConfig.enabled) {
      logger.debug('Feedback disabled, skipping:', type, message);
      return;
    }
    
    // Validate feedback type
    const validTypes = ['success', 'error', 'hint', 'progress', 'achievement'];
    if (!validTypes.includes(type)) {
      logger.warn('Invalid feedback type:', type);
      return;
    }
    
    // Merge options with defaults
    const config = {
      character: options.character || this.feedbackConfig.character,
      animation: options.animation || this.getDefaultAnimation(type),
      sound: options.sound || this.getDefaultSound(type),
      duration: options.duration || this.feedbackConfig.feedbackDuration,
      priority: options.priority || this.getFeedbackPriority(type),
      ariaLabel: options.ariaLabel || message,
      hint: options.hint || null,
      achievement: options.achievement || null,
      position: options.position || 'center',
      ...options
    };
    
    try {
      // Generate unique feedback ID
      const feedbackId = `feedback_${++this.feedbackState.feedbackCounter}_${Date.now()}`;
      
      // Create feedback object
      const feedback = {
        id: feedbackId,
        type,
        message,
        config,
        startTime: performance.now(),
        active: true
      };
      
      // Store active feedback
      this.feedbackState.activeFeedbacks.set(feedbackId, feedback);
      
      // Execute feedback components
      this.executeFeedbackPipeline(feedback);
      
      // Schedule cleanup
      setTimeout(() => {
        this.cleanupFeedback(feedbackId);
      }, config.duration);
      
      // Debug logging
      if (this.feedbackConfig.debugMode) {
        logger.debug('Feedback triggered:', feedback);
      }
      
      return feedbackId;
      
    } catch (error) {
      logger.error('Feedback execution failed:', error);
    }
  }
  
  /**
   * Execute the complete feedback pipeline
   */
  executeFeedbackPipeline(feedback) {
    const { type, message, config } = feedback;
    
    // 1. Accessibility announcement (highest priority)
    this.announceToScreenReader(message, config.ariaLabel, type);
    
    // 2. Audio feedback
    if (this.feedbackConfig.audioEnabled && config.sound) {
      this.playFeedbackAudio(config.sound, config.character, type);
    }
    
    // 3. Visual feedback (respects reduced motion)
    if (!this.feedbackConfig.reducedMotion || type === 'error') {
      this.showVisualFeedback(feedback);
    }
    
    // 4. Haptic feedback (mobile)
    if (this.feedbackConfig.hapticEnabled && this.isMobile) {
      this.triggerHapticFeedback(type);
    }
    
    // 5. Character-specific reactions
    this.triggerCharacterReaction(config.character, type, message);
    
    // 6. Analytics tracking
    this.trackFeedbackEvent(feedback);
  }
  
  /**
   * Get default animation for feedback type
   */
  getDefaultAnimation(type) {
    const animations = {
      'success': 'celebrate',
      'error': 'encourage', 
      'hint': 'thinking',
      'progress': 'levelup',
      'achievement': 'achievement-sparkle'
    };
    return animations[type] || 'default';
  }
  
  /**
   * Get default sound for feedback type
   */
  getDefaultSound(type) {
    const sounds = {
      'success': 'success-chime',
      'error': 'gentle-error',
      'hint': 'hint-bell', 
      'progress': 'progress-up',
      'achievement': 'achievement-fanfare'
    };
    return sounds[type] || 'default';
  }
  
  /**
   * Get feedback priority for queue management
   */
  getFeedbackPriority(type) {
    const priorities = {
      'error': 3,        // Highest - user needs to know immediately
      'achievement': 2,  // High - celebrate accomplishments
      'success': 2,      // High - positive reinforcement
      'progress': 1,     // Medium - good to know
      'hint': 1          // Medium - helpful but not critical
    };
    return priorities[type] || 1;
  }
  
  /**
   * Announce feedback to screen readers
   */
  announceToScreenReader(message, ariaLabel, type) {
    if (!this.feedbackConfig.accessibilityEnabled || !this.feedbackState.ariaLiveRegion) {
      return;
    }
    
    // Use assertive for errors, polite for others
    const liveMode = (type === 'error') ? 'assertive' : 'polite';
    this.feedbackState.ariaLiveRegion.setAttribute('aria-live', liveMode);
    
    // Clear previous announcement
    this.feedbackState.ariaLiveRegion.textContent = '';
    
    // Announce after a brief delay to ensure screen readers pick it up
    setTimeout(() => {
      if (this.feedbackState.ariaLiveRegion) {
        this.feedbackState.ariaLiveRegion.textContent = ariaLabel || message;
      }
    }, 100);
  }
  
  /**
   * Play character-specific audio feedback
   */
  playFeedbackAudio(soundId, character, type) {
    // Try character-specific sound first, fall back to generic
    this.loadCharacterAudio(character).then(() => {
      const characterAudio = this.characterAudio[character];
      if (characterAudio && characterAudio.sounds.has(soundId)) {
        this.playCharacterSound(character, soundId);
      } else {
        // Fall back to synthetic audio
        this.playDefaultFeedbackSound(type);
      }
    }).catch(() => {
      // Audio loading failed, use synthetic fallback
      this.playDefaultFeedbackSound(type);
    });
  }
  
  /**
   * Play default synthetic feedback sound
   */
  playDefaultFeedbackSound(type) {
    const audioMap = {
      'success': { frequency: 600, duration: 200, type: 'sine' },
      'error': { frequency: 200, duration: 300, type: 'sawtooth' },
      'hint': { frequency: 400, duration: 150, type: 'sine' },
      'progress': { frequency: 800, duration: 250, type: 'triangle' },
      'achievement': { frequency: 1000, duration: 500, type: 'sine' }
    };
    
    const audio = audioMap[type] || audioMap.success;
    this.playSound(audio.frequency, audio.duration, audio.type);
  }
  
  /**
   * Show visual feedback element
   */
  showVisualFeedback(feedback) {
    if (!this.feedbackState.feedbackContainer) return;
    
    const { type, message, config } = feedback;
    
    // Create feedback element
    const element = document.createElement('div');
    element.className = `game-feedback game-feedback-${type}`;
    element.setAttribute('data-feedback-id', feedback.id);
    element.textContent = message;
    
    // Apply styles
    element.style.cssText = `
      position: absolute;
      background: ${this.getFeedbackColor(type)};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: bold;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 1001;
      pointer-events: none;
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.3s ease, transform 0.3s ease;
    `;
    
    // Position feedback
    this.positionFeedback(element, config.position);
    
    // Add to container
    this.feedbackState.feedbackContainer.appendChild(element);
    
    // Trigger animation
    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    });
    
    // Auto-remove after duration
    setTimeout(() => {
      if (element.parentNode) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(-20px)';
        setTimeout(() => {
          if (element.parentNode) {
            element.parentNode.removeChild(element);
          }
        }, 300);
      }
    }, config.duration - 300);
  }
  
  /**
   * Get color for feedback type
   */
  getFeedbackColor(type) {
    const colors = {
      'success': '#28a745',
      'error': '#dc3545', 
      'hint': '#17a2b8',
      'progress': '#ffc107',
      'achievement': '#6f42c1'
    };
    return colors[type] || colors.success;
  }
  
  /**
   * Position feedback element
   */
  positionFeedback(element, position) {
    const positions = {
      'top': { top: '20px', left: '50%', transform: 'translateX(-50%)' },
      'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
      'bottom': { bottom: '20px', left: '50%', transform: 'translateX(-50%)' }
    };
    
    const pos = positions[position] || positions.center;
    Object.assign(element.style, pos);
  }
  
  /**
   * Trigger haptic feedback for mobile devices
   */
  triggerHapticFeedback(type) {
    if (!navigator.vibrate) return;
    
    const patterns = {
      'success': [50],
      'error': [100, 50, 100],
      'hint': [25],
      'progress': [50, 25, 50],
      'achievement': [100, 50, 100, 50, 100]
    };
    
    const pattern = patterns[type] || patterns.success;
    navigator.vibrate(pattern);
  }
  
  /**
   * Trigger character-specific reaction
   */
  triggerCharacterReaction(character, type, _message) {
    const characterEmojis = {
      bella: '🐰',
      max: '🐻', 
      zara: '🦓',
      aria: '🦉',
      codecat: '🐱'
    };
    
    const reactions = {
      success: {
        bella: ['Great reading! 📚', 'Perfect sentence! ✨', 'You\'re a reading star! 🌟'],
        max: ['Math magic! 🎩', 'Numbers are your friend! 🔢', 'Calculating success! 📊'],
        zara: ['Science rocks! 🧪', 'Discovery achieved! 🔬', 'Lab experiment success! ⚗️'],
        aria: ['Artistic brilliance! 🎨', 'Creative masterpiece! 🖼️', 'Paint the world beautiful! 🌈'],
        codecat: ['Code executed! 💻', 'Debug successful! 🐛', 'Program complete! ⚡']
      },
      error: {
        bella: ['Let\'s try again! 📖', 'Reading takes practice! 💪', 'Every mistake teaches us! 🌱'],
        max: ['Math puzzles need patience! 🧩', 'Numbers can be tricky! 🤔', 'Let\'s solve this together! 🤝'],
        zara: ['Science is about testing! 🧬', 'Experiments teach us! 📋', 'Discovery needs tries! 🔍'],
        aria: ['Art is about expression! 🎭', 'Every brushstroke counts! 🖌️', 'Creativity flows freely! 🌊'],
        codecat: ['Debugging is learning! 🔧', 'Code evolves with fixes! 📝', 'Logic needs refinement! 🧠']
      },
      hint: {
        bella: ['Here\'s a reading tip! 💡', 'Grammar clue coming up! 🔤', 'Word wisdom ahead! 📝'],
        max: ['Math hint incoming! 🎯', 'Number strategy here! 📐', 'Calculation clue! 🧮'],
        zara: ['Science hint available! 🔬', 'Research reminder! 📊', 'Discovery direction! 🧭'],
        aria: ['Art inspiration here! ✨', 'Creative guidance! 🎨', 'Artistic advice! 🖼️'],
        codecat: ['Code hint ready! 💡', 'Programming pointer! 👆', 'Logic guidance! 🧩']
      },
      progress: {
        bella: ['Reading level up! 📈', 'Vocabulary growing! 🌱', 'Comprehension building! 🏗️'],
        max: ['Math skills advancing! 📊', 'Problem-solving improved! 🎯', 'Calculation power up! ⚡'],
        zara: ['Scientific thinking grows! 🧪', 'Research skills develop! 📋', 'Discovery abilities rise! 🚀'],
        aria: ['Artistic vision expands! 👁️', 'Creative skills bloom! 🌸', 'Imagination soars! 🦋'],
        codecat: ['Coding prowess increases! 💻', 'Programming logic sharpens! 🔪', 'Debug skills level up! 🐛']
      },
      achievement: {
        bella: ['Reading champion! 🏆', 'Literary legend! 📚', 'Word wizard achieved! 🧙'],
        max: ['Mathematics master! 🎓', 'Number ninja unlocked! 🥷', 'Calculation champion! 🏅'],
        zara: ['Science superstar! ⭐', 'Research rockstar! 🎸', 'Discovery dynamo! 💫'],
        aria: ['Art virtuoso! 🎨', 'Creative genius! 🧠', 'Masterpiece maker! 🖼️'],
        codecat: ['Code commander! 👑', 'Programming prodigy! 🌟', 'Debug deity! ⚡']
      }
    };
    
    // Get character emoji and random reaction
    const emoji = characterEmojis[character] || '🎮';
    const characterReactions = reactions[type]?.[character] || [`${emoji} Great job!`];
    const reaction = characterReactions[Math.floor(Math.random() * characterReactions.length)];
    
    // Trigger character animation/reaction in UI if available
    this.animateCharacterReaction(character, type, emoji, reaction);
    
    if (this.feedbackConfig.debugMode) {
      logger.debug(`Character reaction: ${character} - ${type} - ${reaction}`);
    }
  }
  
  /**
   * Animate character reaction in UI
   */
  animateCharacterReaction(character, type, emoji, reaction) {
    // Find character element in the game UI
    const characterElement = this.container?.querySelector(`.${character}-character, .character-avatar, #${character}-character`);
    
    if (characterElement) {
      // Add reaction animation class
      characterElement.classList.add(`reaction-${type}`);
      
      // Update character speech/tooltip if available
      const speechElement = characterElement.querySelector('.character-speech, .speech-bubble');
      if (speechElement) {
        speechElement.textContent = reaction;
        speechElement.classList.add('reaction-active');
      }
      
      // Remove animation classes after duration
      setTimeout(() => {
        characterElement.classList.remove(`reaction-${type}`);
        if (speechElement) {
          speechElement.classList.remove('reaction-active');
        }
      }, this.feedbackConfig.feedbackDuration);
    }
  }
  
  /**
   * Track feedback event for analytics
   */
  trackFeedbackEvent(feedback) {
    // Add to analytics tracking
    if (this.analytics && this.analytics.feedbackEvents) {
      this.analytics.feedbackEvents.push({
        type: feedback.type,
        timestamp: feedback.startTime,
        character: feedback.config.character,
        sessionId: this.sessionId
      });
    }
  }
  
  /**
   * Clean up feedback resources
   */
  cleanupFeedback(feedbackId) {
    this.feedbackState.activeFeedbacks.delete(feedbackId);
    
    // Remove visual elements
    const element = this.feedbackState.feedbackContainer?.querySelector(`[data-feedback-id="${feedbackId}"]`);
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }
  
  /**
   * Load character audio assets (async)
   */
  async loadCharacterAudio(character) {
    const audio = this.characterAudio[character];
    if (!audio || audio.loaded || audio.loading) {
      return Promise.resolve();
    }
    
    audio.loading = true;
    
    try {
      // Character audio loading will be implemented in the audio system issue
      // For now, mark as loaded
      audio.loaded = true;
      audio.loading = false;
      logger.debug(`Character audio loaded: ${character}`);
    } catch (error) {
      audio.loading = false;
      logger.warn(`Failed to load character audio: ${character}`, error);
      throw error;
    }
  }
  
  /**
   * Play character-specific sound
   */
  playCharacterSound(character, soundId) {
    // Character sound playing will be implemented in the audio system issue
    logger.debug(`Playing character sound: ${character} - ${soundId}`);
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
  
  // ==========================================
  // BACKWARD COMPATIBILITY METHODS
  // ==========================================
  
  /**
   * Legacy feedback method for existing games (SentenceBuilder, etc.)
   * Maps to new feedback system while maintaining API compatibility
   */
  displayMessage(message, type = 'info', duration = 2000) {
    const feedbackType = this.mapLegacyType(type);
    return this.showFeedback(feedbackType, message, { duration });
  }
  
  /**
   * Legacy success feedback method
   */
  showSuccessMessage(message, options = {}) {
    return this.showFeedback('success', message, options);
  }
  
  /**
   * Legacy error feedback method  
   */
  showErrorMessage(message, options = {}) {
    return this.showFeedback('error', message, options);
  }
  
  /**
   * Legacy hint feedback method
   */
  showHintMessage(message, options = {}) {
    return this.showFeedback('hint', message, options);
  }
  
  /**
   * Legacy progress feedback method
   */
  showProgressMessage(message, options = {}) {
    return this.showFeedback('progress', message, options);
  }
  
  /**
   * Map legacy feedback types to new system
   */
  mapLegacyType(legacyType) {
    const typeMap = {
      'info': 'hint',
      'warning': 'hint', 
      'success': 'success',
      'error': 'error',
      'correct': 'success',
      'incorrect': 'error',
      'level-up': 'progress',
      'achievement': 'achievement'
    };
    return typeMap[legacyType] || 'hint';
  }
  
  /**
   * Legacy method for games that call addMessage directly
   */
  addMessage(message, type = 'info', duration = 2000) {
    return this.displayMessage(message, type, duration);
  }
  
  /**
   * Legacy method for simple text announcements
   */
  announce(message, options = {}) {
    return this.showFeedback('hint', message, options);
  }
  
  /**
   * Simplified feedback for quick integration
   */
  feedback(message, isSuccess = true, options = {}) {
    const type = isSuccess ? 'success' : 'error';
    return this.showFeedback(type, message, options);
  }
  
  /**
   * Character-specific feedback shorthand methods
   */
  bellaFeedback(message, type = 'hint', options = {}) {
    return this.showFeedback(type, message, { character: 'bella', ...options });
  }
  
  maxFeedback(message, type = 'hint', options = {}) {
    return this.showFeedback(type, message, { character: 'max', ...options });
  }
  
  zaraFeedback(message, type = 'hint', options = {}) {
    return this.showFeedback(type, message, { character: 'zara', ...options });
  }
  
  ariaFeedback(message, type = 'hint', options = {}) {
    return this.showFeedback(type, message, { character: 'aria', ...options });
  }
  
  codecatFeedback(message, type = 'hint', options = {}) {
    return this.showFeedback(type, message, { character: 'codecat', ...options });
  }
}