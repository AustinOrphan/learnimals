/**
 * BaseGame - Base class for all Learnimals games
 * Provides common functionality for game state management, scoring, and UI integration
 * Enhanced with progress tracking, mobile-first design, and analytics
 */
import logger from '../../utils/logger.js';
import ProgressTracker from '../../features/progress/ProgressTracker.js';
import AchievementSystem from '../../features/progress/AchievementSystem.js';
import xpCalculator from '../../utils/xpCalculator.js';
import XPGainAnimation from '../level/XPGainAnimation.js';
import LevelUpNotification from '../level/LevelUpNotification.js';
import LevelMilestones from '../level/LevelMilestones.js';
import animationManager from '../../utils/AnimationManager.js';

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
    
    // Animation and feedback system
    this.enableAnimations = options.enableAnimations !== false;
    this.animationVariants = {
      inactive: { scale: 0.9, opacity: 0.7 },
      playing: { scale: 1, opacity: 1 },
      paused: { scale: 0.95, opacity: 0.8 },
      gameOver: { scale: 1.05, opacity: 1 }
    };
    
    // Progress tracking integration
    this.progressTracker = null;
    this.achievementSystem = null;
    this.enableProgressTracking = options.enableProgressTracking !== false;
    
    // Level and XP system integration
    this.xpGainAnimation = null;
    this.levelUpNotification = null;
    this.levelMilestones = null;
    this.userLevel = 1;
    this.totalXP = 0;
    this.sessionXP = 0;
    this.enableXPSystem = options.enableXPSystem !== false;
    
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
      await this.setState('ready');
      this.onInitialized();
    } catch (error) {
      logger.error('Game initialization failed:', error);
      await this.setState('error');
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
    
    // Add animation classes if animations are enabled
    if (this.enableAnimations) {
      this.container.classList.add('game-animated');
      this.container.setAttribute('data-animate', 'true');
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
    
    // Initialize XP system
    this.setupXPSystem();
  }
  
  /**
   * Set up XP system integration
   */
  setupXPSystem() {
    if (!this.enableXPSystem) {
      logger.debug('XP system disabled for this game');
      return;
    }
    
    try {
      // Initialize XP components
      this.xpGainAnimation = XPGainAnimation.getInstance();
      this.levelUpNotification = LevelUpNotification.getInstance();
      this.levelMilestones = LevelMilestones.getInstance();
      
      // Load user's current XP and level
      this.loadUserXPData();
      
      logger.debug('XP system initialized successfully');
    } catch (error) {
      logger.warn('Failed to initialize XP system:', error);
      this.enableXPSystem = false;
    }
  }
  
  /**
   * Load user's current XP and level data
   */
  loadUserXPData() {
    try {
      const savedProgress = localStorage.getItem('learnimals-user-progress');
      if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        this.totalXP = progress.totalXP || 0;
        this.userLevel = xpCalculator.calculateLevel(this.totalXP);
      }
    } catch (error) {
      logger.warn('Failed to load user XP data:', error);
      this.totalXP = 0;
      this.userLevel = 1;
    }
  }
  
  /**
   * Save user's XP and level data
   */
  saveUserXPData() {
    try {
      const progress = {
        totalXP: this.totalXP,
        level: this.userLevel,
        lastPlayed: new Date().toISOString()
      };
      localStorage.setItem('learnimals-user-progress', JSON.stringify(progress));
    } catch (error) {
      logger.warn('Failed to save user XP data:', error);
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
  async start() {
    if (this.state !== 'ready' && this.state !== 'game-over') {
      logger.warn('Cannot start game in current state:', this.state);
      return false;
    }
        
    // Prevent multiple simultaneous starts
    if (this.gameLoopRunning) {
      logger.warn('Game loop already running, stopping previous loop');
      this.stopGameLoop();
    }
        
    const stateChanged = await this.setState('playing');
    if (!stateChanged) {
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
  async pause() {
    if (this.state !== 'playing') {
      logger.warn('Cannot pause game in current state:', this.state);
      return false;
    }
        
    const stateChanged = await this.setState('paused');
    if (!stateChanged) {
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
  async resume() {
    if (this.state !== 'paused') {
      logger.warn('Cannot resume game in current state:', this.state);
      return false;
    }
        
    const stateChanged = await this.setState('playing');
    if (!stateChanged) {
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
  async gameOver() {
    if (this.state === 'game-over') {
      logger.warn('Game already over');
      return false;
    }
    
    const stateChanged = await this.setState('game-over');
    if (!stateChanged) {
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
  async restart(autoStart = true) {
    // Stop any running game loop immediately
    this.stopGameLoop();
    
    // Analytics tracking
    this.analytics.restartCount++;
    
    await this.setState('loading');
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
    await this.setState('ready');
    
    // Automatically start the game after restart if requested
    if (autoStart) {
      await this.start();
    }
  }
    
  /**
     * Set game state and notify listeners with race condition protection
     */
  async setState(newState) {
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
    
    try {
      // Trigger state transition animation if animations are enabled
      if (this.enableAnimations && oldState !== newState) {
        await this.animateStateTransition(newState, {
          duration: 300,
          easing: 'easeInOut'
        });
      }
      
      this.state = newState;
      
      this.onStateChange(newState, oldState);
      logger.debug(`Game state: ${oldState} → ${newState}`);
      
    } catch (error) {
      logger.error('Error in state change or animation:', error);
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
      
    // Calculate and award session XP
    if (this.enableXPSystem) {
      this.awardSessionXP(accuracy);
    }
      
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
        streakRecord: this.analytics.streakRecord,
        sessionXP: this.sessionXP,
        userLevel: this.userLevel,
        totalXP: this.totalXP
      });
    }
    
    this.saveGameStatistics();
  }
  
  /**
   * Award XP based on session performance
   */
  awardSessionXP(accuracy) {
    if (!this.enableXPSystem) return;
    
    // Create session data for XP calculation
    const sessionData = {
      score: this.score,
      accuracy: accuracy,
      difficulty: this.difficulty,
      gameType: this.gameType,
      completed: this.state === 'game-over' && this.score > 0,
      duration: this.analytics.totalPlayTime,
      expectedDuration: 300000, // 5 minutes expected
      firstTime: this.analytics.restartCount === 0
    };
    
    // Calculate session XP using xpCalculator
    const xpBreakdown = xpCalculator.calculateSessionXP(sessionData);
    
    if (xpBreakdown.total > 0) {
      // Show XP breakdown with staggered animations
      if (this.xpGainAnimation) {
        this.xpGainAnimation.showBreakdown(xpBreakdown, {
          target: this.useDOMContainer ? this.container : this.canvas,
          baseDelay: 1000, // Wait 1 second after game end
          staggerDelay: 500
        });
      }
      
      // Award the total XP (without position for session XP)
      this.awardXP(xpBreakdown.total, 'total');
      
      logger.debug('Session XP awarded:', xpBreakdown);
    }
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
    
    // Show score animation if animations are enabled
    if (this.enableAnimations && points !== 0) {
      const options = {
        isBonus: points >= 50,
        duration: 1500
      };
      
      // Use position if provided
      if (position) {
        options.x = position.x;
        options.y = position.y;
      }
      
      this.showScoreAnimation(points, options);
    }
    
    // Mobile haptic feedback
    if (this.hapticFeedback && points > 0) {
      navigator.vibrate(25);
    }
    
    // Calculate and award XP for the score
    if (this.enableXPSystem && points > 0) {
      this.awardXPForScore(points, position);
    }
    
    // Visual score feedback (to be implemented by subclasses)
    this.showScoreFeedback(points, position);
  }
  
  /**
   * Award XP for score earned and show animations
   */
  awardXPForScore(points, position = null) {
    if (!this.enableXPSystem || !this.xpGainAnimation) {
      return;
    }
    
    // Calculate XP based on score (1 XP per 10 points as base)
    const baseXP = Math.floor(points / 10);
    if (baseXP <= 0) return;
    
    // Apply difficulty and level multipliers
    const multiplier = this.levelMilestones.getCurrentXPMultiplier();
    const finalXP = Math.floor(baseXP * multiplier);
    
    // Award XP
    this.awardXP(finalXP, 'score', position);
  }
  
  /**
   * Award XP and handle level-up logic
   */
  awardXP(xpAmount, type = 'gain', position = null) {
    if (!this.enableXPSystem || xpAmount <= 0) {
      return;
    }
    
    const oldLevel = this.userLevel;
    
    // Add XP
    this.totalXP += xpAmount;
    this.sessionXP += xpAmount;
    this.userLevel = xpCalculator.calculateLevel(this.totalXP);
    
    // Show XP gain animation
    if (this.xpGainAnimation && position) {
      this.xpGainAnimation.showAt(xpAmount, position.x, position.y);
    } else if (this.xpGainAnimation) {
      this.xpGainAnimation.show(xpAmount, {
        type: type,
        target: this.useDOMContainer ? this.container : this.canvas
      });
    }
    
    // Check for level-up
    if (this.userLevel > oldLevel) {
      this.handleLevelUp(oldLevel, this.userLevel, xpAmount);
    }
    
    // Save progress
    this.saveUserXPData();
    
    logger.debug(`Awarded ${xpAmount} XP (${type}). Total: ${this.totalXP}, Level: ${this.userLevel}`);
  }
  
  /**
   * Handle level-up with celebrations and milestone rewards
   */
  handleLevelUp(oldLevel, newLevel, xpGained) {
    if (!this.enableXPSystem) return;
    
    // Calculate level progress data
    const progressData = xpCalculator.calculateLevelProgress(this.totalXP);
    progressData.xpGained = xpGained;
    
    // Check for milestone rewards
    const milestones = this.levelMilestones.checkLevelUp(oldLevel, newLevel);
    const rewards = [];
    
    milestones.forEach(milestone => {
      const appliedRewards = this.levelMilestones.applyRewards(milestone);
      rewards.push(...appliedRewards);
    });
    
    // Show level-up notification
    if (this.levelUpNotification) {
      this.levelUpNotification.show(progressData, {
        rewards: rewards,
        callback: () => {
          // Additional celebration or effects can go here
          this.onLevelUpComplete(oldLevel, newLevel, rewards);
        }
      });
    }
    
    // Track level-up achievement
    if (this.achievementSystem) {
      this.achievementSystem.checkAchievement('level_up', {
        oldLevel,
        newLevel,
        totalXP: this.totalXP
      });
    }
    
    logger.debug(`Level up! ${oldLevel} → ${newLevel}. Rewards: ${rewards.length}`);
  }
  
  /**
   * Called when level-up celebration is complete
   */
  onLevelUpComplete(oldLevel, newLevel, _rewards) {
    // Base implementation - subclasses can override
    logger.debug(`Level-up celebration complete: ${oldLevel} → ${newLevel}`);
  }
  
  /**
   * Show visual score feedback - override in subclasses
   */
  showScoreFeedback(points, position) {
    // Base implementation - subclasses should override for visual effects
    logger.debug(`Score feedback: +${points} points`, position);
  }

  
  /**
   * Animate transition between game states
   * @param {string} newState - The new game state to transition to
   * @param {Object} options - Animation options
   * @returns {Promise} - Animation completion promise
   */
  async animateStateTransition(newState, options = {}) {
    if (!this.enableAnimations || !this.container) {
      return Promise.resolve();
    }
    
    const {
      duration = 400,
      easing = 'easeInOut'
    } = options;
    
    try {
      // Add state-specific visual feedback
      this.container.setAttribute('data-game-state', newState);
      this.container.classList.add('game-state-transition');
      
      // Get the animation variant for the new state
      const variant = this.animationVariants[newState];
      if (variant) {
        // Apply the base state transition animation
        await animationManager.createAnimation(this.container, {
          type: 'state',
          animation: 'stateTransition',
          options: {
            to: variant,
            duration,
            easing,
            priority: 'high'
          }
        });
      }
      
      // Show state-specific overlays
      switch (newState) {
      case 'loading':
        await this.showLoadingOverlay({ 
          text: 'Loading Game...',
          duration: 200 
        });
        break;
          
      case 'ready':
        // Hide loading overlay and show ready countdown
        await this.hideLoadingOverlay();
        if (this.state === 'loading') {
          await this.showReadyCountdown({
            countFrom: 3,
            onComplete: () => {
              logger.debug('Ready countdown complete');
            }
          });
        }
        break;
          
      case 'playing':
        // Hide any overlays when playing
        await Promise.all([
          this.hideLoadingOverlay(),
          this.hidePauseOverlay()
        ]);
        break;
          
      case 'paused':
        await this.showPauseOverlay({
          title: 'Game Paused',
          subtitle: 'Take a break! Press Resume when ready.',
          showResumeButton: true
        });
        break;
          
      case 'game-over':
        await this.showGameOverOverlay({
          title: 'Game Over!',
          showStats: true,
          showRestartButton: true
        });
        break;
      }
      
      // Remove transition class after animation
      setTimeout(() => {
        this.container.classList.remove('game-state-transition');
      }, duration);
      
      // Emit state transition event
      this.analytics.stateTransitions = this.analytics.stateTransitions || [];
      this.analytics.stateTransitions.push({
        from: this.state,
        to: newState,
        timestamp: performance.now()
      });
      
    } catch (error) {
      logger.error('State transition animation failed:', error);
    }
  }

  
  /**
   * Create and show loading overlay
   * @param {Object} options - Loading options
   * @returns {Promise} - Animation completion promise
   */
  async showLoadingOverlay(options = {}) {
    const {
      text = 'Loading...',
      duration = 300
    } = options;
    
    // Remove any existing loading overlay
    this.hideLoadingOverlay();
    
    // Create loading overlay
    const overlay = document.createElement('div');
    overlay.className = 'game-loading-overlay';
    overlay.id = 'game-loading-overlay';
    
    overlay.innerHTML = `
      <div class="game-loading-spinner"></div>
      <div class="game-loading-text">${text}</div>
    `;
    
    this.container.appendChild(overlay);
    
    // Animate in
    if (this.enableAnimations) {
      await animationManager.fadeIn(overlay, { duration });
    }
    
    return overlay;
  }
  
  /**
   * Hide loading overlay
   * @param {Object} options - Hide options
   * @returns {Promise} - Animation completion promise
   */
  async hideLoadingOverlay(options = {}) {
    const overlay = document.getElementById('game-loading-overlay');
    if (!overlay) return Promise.resolve();
    
    const { duration = 200 } = options;
    
    if (this.enableAnimations) {
      await animationManager.createAnimation(overlay, {
        type: 'exit',
        animation: 'fadeOut',
        options: { duration }
      });
    }
    
    overlay.remove();
  }
  
  /**
   * Create and show pause overlay
   * @param {Object} options - Pause options
   * @returns {Promise} - Animation completion promise
   */
  async showPauseOverlay(options = {}) {
    const {
      title = 'Game Paused',
      subtitle = 'Press Resume to continue',
      showResumeButton = true
    } = options;
    
    // Remove any existing pause overlay
    this.hidePauseOverlay();
    
    // Create pause overlay
    const overlay = document.createElement('div');
    overlay.className = 'game-pause-overlay';
    overlay.id = 'game-pause-overlay';
    
    const content = document.createElement('div');
    content.className = 'game-pause-content';
    
    content.innerHTML = `
      <div class="game-pause-icon">⏸</div>
      <h2 class="game-pause-title">${title}</h2>
      <p class="game-pause-subtitle">${subtitle}</p>
      ${showResumeButton ? '<button class="component-button component-button--primary game-resume-button">Resume Game</button>' : ''}
    `;
    
    overlay.appendChild(content);
    this.container.appendChild(overlay);
    
    // Add resume button handler
    if (showResumeButton) {
      const resumeButton = content.querySelector('.game-resume-button');
      if (resumeButton) {
        resumeButton.addEventListener('click', () => this.resume());
      }
    }
    
    // Animate in
    if (this.enableAnimations) {
      await Promise.all([
        animationManager.fadeIn(overlay, { duration: 200 }),
        animationManager.createAnimation(content, {
          type: 'entrance',
          animation: 'bounceIn',
          options: { duration: 300, delay: 100 }
        })
      ]);
    }
    
    return overlay;
  }
  
  /**
   * Hide pause overlay
   * @param {Object} options - Hide options
   * @returns {Promise} - Animation completion promise
   */
  async hidePauseOverlay(options = {}) {
    const overlay = document.getElementById('game-pause-overlay');
    if (!overlay) return Promise.resolve();
    
    const { duration = 200 } = options;
    
    if (this.enableAnimations) {
      await animationManager.createAnimation(overlay, {
        type: 'exit',
        animation: 'fadeOut',
        options: { duration }
      });
    }
    
    overlay.remove();
  }
  
  /**
   * Create and show game over overlay
   * @param {Object} options - Game over options
   * @returns {Promise} - Animation completion promise
   */
  async showGameOverOverlay(options = {}) {
    const {
      title = 'Game Over!',
      showStats = true,
      showRestartButton = true,
      customStats = null
    } = options;
    
    // Remove any existing game over overlay
    this.hideGameOverOverlay();
    
    // Create game over overlay
    const overlay = document.createElement('div');
    overlay.className = 'game-over-overlay';
    overlay.id = 'game-over-overlay';
    
    const content = document.createElement('div');
    content.className = 'game-over-content';
    
    // Get analytics summary
    const stats = customStats || this.getAnalyticsSummary();
    
    content.innerHTML = `
      <h2 class="game-over-title">${title}</h2>
      <div class="game-over-score">${this.score}</div>
      <div class="game-over-score-label">Final Score</div>
      ${showStats ? `
        <div class="game-over-stats">
          <div class="game-over-stat">
            <div class="game-over-stat-value">${stats.level || this.level}</div>
            <div class="game-over-stat-label">Level</div>
          </div>
          <div class="game-over-stat">
            <div class="game-over-stat-value">${stats.accuracy || 0}%</div>
            <div class="game-over-stat-label">Accuracy</div>
          </div>
          <div class="game-over-stat">
            <div class="game-over-stat-value">${stats.streakRecord || 0}</div>
            <div class="game-over-stat-label">Best Streak</div>
          </div>
        </div>
      ` : ''}
      ${showRestartButton ? '<button class="component-button component-button--primary game-restart-button">Play Again</button>' : ''}
    `;
    
    overlay.appendChild(content);
    this.container.appendChild(overlay);
    
    // Add restart button handler
    if (showRestartButton) {
      const restartButton = content.querySelector('.game-restart-button');
      if (restartButton) {
        restartButton.addEventListener('click', () => this.restart());
      }
    }
    
    // Animate in with celebration if high score
    if (this.enableAnimations) {
      const isHighScore = this.checkHighScore();
      
      await Promise.all([
        animationManager.fadeIn(overlay, { duration: 300 }),
        animationManager.createAnimation(content, {
          type: 'entrance',
          animation: 'slideUp',
          options: { duration: 400, delay: 200 }
        })
      ]);
      
      if (isHighScore) {
        await this.celebrateCompletion({
          celebrationText: 'New High Score!',
          duration: 2000
        });
      }
    }
    
    return overlay;
  }
  
  /**
   * Hide game over overlay
   * @param {Object} options - Hide options
   * @returns {Promise} - Animation completion promise
   */
  async hideGameOverOverlay(options = {}) {
    const overlay = document.getElementById('game-over-overlay');
    if (!overlay) return Promise.resolve();
    
    const { duration = 200 } = options;
    
    if (this.enableAnimations) {
      await animationManager.createAnimation(overlay, {
        type: 'exit',
        animation: 'fadeOut',
        options: { duration }
      });
    }
    
    overlay.remove();
  }
  
  /**
   * Show ready countdown animation
   * @param {Object} options - Countdown options
   * @returns {Promise} - Animation completion promise
   */
  async showReadyCountdown(options = {}) {
    const {
      countFrom = 3,
      onComplete = () => {}
    } = options;
    
    for (let i = countFrom; i > 0; i--) {
      const countElement = document.createElement('div');
      countElement.className = 'game-ready-animation';
      countElement.textContent = i;
      
      this.container.appendChild(countElement);
      
      // Play countdown sound
      this.playSound(400 + (i * 100), 150, 'sine');
      
      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 800));
      
      countElement.remove();
    }
    
    // Show "GO!" message
    const goElement = document.createElement('div');
    goElement.className = 'game-ready-animation';
    goElement.textContent = 'GO!';
    goElement.style.color = '#4CAF50';
    
    this.container.appendChild(goElement);
    
    // Play go sound
    this.playSound(800, 200, 'sine');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    goElement.remove();
    
    onComplete();
  }
  
  /**
   * Check if current score is a high score
   * @returns {boolean} - True if high score
   */
  checkHighScore() {
    try {
      const key = `${this.gameType}_highScore`;
      const highScore = parseInt(localStorage.getItem(key) || '0');
      
      if (this.score > highScore) {
        localStorage.setItem(key, this.score.toString());
        return true;
      }
    } catch (error) {
      logger.warn('Failed to check high score:', error);
    }
    
    return false;
  }
  
  /**
   * Show correct answer feedback animation
   * @param {HTMLElement} element - Element to animate (optional, defaults to container)
   * @param {Object} options - Animation options
   * @returns {Promise} - Animation completion promise
   */
  async showCorrectFeedback(element = null, options = {}) {
    if (!this.enableAnimations) {
      return Promise.resolve();
    }
    
    const target = element || this.container;
    if (!target) return Promise.resolve();
    
    const {
      duration = 600,
      showCheckmark = true,
      scale = 1.05,
      points = 0,
      showScore = true,
      showParticles = true
    } = options;
    
    try {
      // Create success feedback sequence
      const animations = [];
      
      // 1. Background flash effect
      const flashEl = document.createElement('div');
      flashEl.className = 'correct-feedback-flash';
      target.appendChild(flashEl);
      
      animations.push(
        new Promise(resolve => {
          setTimeout(() => {
            if (flashEl.parentNode) {
              flashEl.remove();
            }
            resolve();
          }, duration);
        })
      );
      
      // 2. Element scale animation
      if (element && element !== this.container) {
        element.style.transition = `transform ${duration / 2}ms ease-out`;
        element.style.transform = `scale(${scale})`;
        
        animations.push(
          new Promise(resolve => {
            setTimeout(() => {
              element.style.transform = 'scale(1)';
              setTimeout(resolve, duration / 2);
            }, duration / 2);
          })
        );
      }
      
      // 3. Show checkmark if requested
      if (showCheckmark) {
        const checkmark = document.createElement('div');
        checkmark.className = 'correct-checkmark';
        checkmark.textContent = '✓';
        target.appendChild(checkmark);
        
        animations.push(
          new Promise(resolve => {
            setTimeout(() => {
              if (checkmark.parentNode) {
                checkmark.remove();
              }
              resolve();
            }, 800);
          })
        );
      }
      
      // 4. Show particles if requested
      if (showParticles && element) {
        const rect = element.getBoundingClientRect();
        const containerRect = target.getBoundingClientRect();
        const x = rect.left + rect.width / 2 - containerRect.left;
        const y = rect.top + rect.height / 2 - containerRect.top;
        this.createBonusParticles(x, y, 6);
      }
      
      // 5. Show score animation if points provided
      if (showScore && points > 0) {
        const rect = element ? element.getBoundingClientRect() : target.getBoundingClientRect();
        const containerRect = target.getBoundingClientRect();
        const x = rect.left + rect.width / 2 - containerRect.left;
        const y = rect.top + rect.height / 2 - containerRect.top;
        
        this.showScoreAnimation(points, {
          x,
          y,
          isBonus: points >= 50
        });
      }
      
      // Execute all animations in parallel
      await Promise.all(animations);
      
      // Update streak
      this.analytics.currentStreak++;
      if (this.analytics.currentStreak > this.analytics.streakRecord) {
        this.analytics.streakRecord = this.analytics.currentStreak;
      }
      
      // Show streak animation
      if (this.analytics.currentStreak >= 2) {
        this.showStreakAnimation(this.analytics.currentStreak);
      }
      
      // Haptic feedback for mobile
      if (this.hapticFeedback) {
        navigator.vibrate([50, 50, 100]);
      }
      
      // Sound effect hook
      if (this.onSoundEffect) {
        this.onSoundEffect('correct-answer');
      }
      
    } catch (error) {
      logger.error('Correct feedback animation failed:', error);
    }
  }
  
  /**
   * Show incorrect answer feedback animation
   * @param {HTMLElement} element - Element to animate (optional, defaults to container)
   * @param {Object} options - Animation options
   * @returns {Promise} - Animation completion promise
   */
  async showIncorrectFeedback(element = null, options = {}) {
    if (!this.enableAnimations) {
      return Promise.resolve();
    }
    
    const target = element || this.container;
    if (!target) return Promise.resolve();
    
    const {
      duration = 600,
      showX = true,
      loseLife = false,
      points = 0,
      showScore = true
    } = options;
    
    try {
      // Create error feedback sequence
      const animations = [];
      
      // 1. Background flash effect
      const flashEl = document.createElement('div');
      flashEl.className = 'incorrect-feedback-flash';
      target.appendChild(flashEl);
      
      animations.push(
        new Promise(resolve => {
          setTimeout(() => {
            if (flashEl.parentNode) {
              flashEl.remove();
            }
            resolve();
          }, duration);
        })
      );
      
      // 2. Shake animation for element
      if (element && element !== this.container) {
        element.classList.add('shake-element');
        
        animations.push(
          new Promise(resolve => {
            setTimeout(() => {
              element.classList.remove('shake-element');
              resolve();
            }, 600);
          })
        );
      }
      
      // 3. Show X mark if requested
      if (showX) {
        const xMark = document.createElement('div');
        xMark.className = 'incorrect-x';
        xMark.textContent = '✗';
        target.appendChild(xMark);
        
        animations.push(
          new Promise(resolve => {
            setTimeout(() => {
              if (xMark.parentNode) {
                xMark.remove();
              }
              resolve();
            }, 800);
          })
        );
      }
      
      // 4. Show life loss animation if requested
      if (loseLife && this.lives > 0) {
        this.lives--;
        this.showLifeAnimation(-1);
        
        // Check if game over
        if (this.lives <= 0) {
          setTimeout(() => {
            this.gameOver();
          }, 1000);
        }
      }
      
      // 5. Show negative score if points lost
      if (showScore && points < 0) {
        const rect = element ? element.getBoundingClientRect() : target.getBoundingClientRect();
        const containerRect = target.getBoundingClientRect();
        const x = rect.left + rect.width / 2 - containerRect.left;
        const y = rect.top + rect.height / 2 - containerRect.top;
        
        this.showScoreAnimation(points, { x, y });
      }
      
      // Execute all animations in parallel
      await Promise.all(animations);
      
      // Reset streak
      this.analytics.currentStreak = 0;
      
      // Track incorrect answer
      this.analytics.incorrectAnswers++;
      
      // Haptic feedback for mobile
      if (this.hapticFeedback) {
        navigator.vibrate([100, 100, 200]);
      }
      
      // Sound effect hook
      if (this.onSoundEffect) {
        this.onSoundEffect('incorrect-answer');
      }
      
    } catch (error) {
      logger.error('Incorrect feedback animation failed:', error);
    }
  }
  
  /**
   * Celebrate game completion with victory animations
   * @param {Object} options - Animation options
   * @returns {Promise} - Animation completion promise
   */
  async celebrateCompletion(options = {}) {
    if (!this.enableAnimations || !this.container) {
      return Promise.resolve();
    }
    
    const {
      duration = 2000,
      showConfetti = true,
      showStars = true,
      celebrationText = 'Awesome!',
      tier = 'bronze', // 'bronze', 'silver', 'gold', 'platinum'
      score = null,
      perfectScore = false,
      showTrophy = true,
      showFireworks = false
    } = options;
    
    // Adjust celebration based on tier
    const tierConfig = this.getTierConfiguration(tier, perfectScore);
    
    try {
      const animations = [];
      
      // Create victory overlay container
      const victoryOverlay = this.createVictoryOverlay(tierConfig, celebrationText, score);
      document.body.appendChild(victoryOverlay);
      
      // 1. Container celebration scale and rotation
      animations.push(
        animationManager.createAnimation(this.container, {
          type: 'celebration',
          animation: 'victoryBounce',
          options: {
            scale: tierConfig.containerScale,
            rotation: tierConfig.containerRotation,
            duration: duration / 2,
            easing: 'easeOut'
          }
        })
      );
      
      // 2. Show trophy if enabled
      if (showTrophy && tierConfig.trophy) {
        const trophyElement = victoryOverlay.querySelector('.trophy');
        if (trophyElement) {
          animations.push(
            animationManager.createAnimation(trophyElement, {
              type: 'celebration',
              animation: 'trophyEntrance',
              options: {
                duration: duration * 0.6,
                easing: 'easeOut'
              }
            })
          );
        }
      }
      
      // 3. Enhanced confetti effect based on tier
      if (showConfetti) {
        animations.push(this.createConfettiEffect(tierConfig.colors, duration * tierConfig.confettiDuration));
      }
      
      // 4. Star burst effect with tier-specific intensity
      if (showStars) {
        animations.push(this.createStarBurstEffect(duration * tierConfig.starDuration, tierConfig.starCount));
      }
      
      // 5. Fireworks for gold/platinum tiers
      if ((showFireworks || tier === 'gold' || tier === 'platinum') && tierConfig.showFireworks) {
        animations.push(this.createFireworksEffect(duration * 0.8));
      }
      
      // 6. Particle effects for higher tiers
      if (tierConfig.showParticles) {
        animations.push(this.createParticleEffect(tierConfig.colors, duration * 0.9));
      }
      
      // Execute all animations in parallel
      await Promise.all(animations);
      
      // Enhanced haptic feedback based on tier
      if (this.hapticFeedback && tierConfig.hapticPattern) {
        navigator.vibrate(tierConfig.hapticPattern);
      }
      
      // Remove victory overlay after animations complete
      setTimeout(() => {
        if (victoryOverlay.parentNode) {
          victoryOverlay.remove();
        }
      }, 1000);
      
    } catch (error) {
      logger.error('Celebration animation failed:', error);
    }
  }
  
  /**
   * Animate a game element with specified animation type
   * @param {HTMLElement} element - Element to animate
   * @param {string} animationType - Type of animation to apply
   * @param {Object} options - Animation options
   * @returns {Promise} - Animation completion promise
   */
  async animateGameElement(element, animationType, options = {}) {
    if (!this.enableAnimations || !element) {
      return Promise.resolve();
    }
    
    const {
      duration = 300,
      easing = 'easeOut',
      priority = 'normal'
    } = options;
    
    try {
      switch (animationType) {
      case 'hover':
        return animationManager.createAnimation(element, {
          type: 'interaction',
          animation: 'hover',
          options: {
            scale: 1.05,
            duration: 200,
            easing: 'easeOut'
          }
        });
        
      case 'click':
        return animationManager.createAnimation(element, {
          type: 'interaction',
          animation: 'click',
          options: {
            scale: [1, 0.95, 1],
            duration: 150,
            easing: 'easeInOut'
          }
        });
        
      case 'appear':
        return animationManager.fadeIn(element, {
          duration,
          easing,
          priority
        });
        
      case 'disappear':
        return animationManager.createAnimation(element, {
          type: 'exit',
          animation: 'fadeOut',
          options: { duration, easing, priority }
        });
        
      case 'pulse':
        return animationManager.createAnimation(element, {
          type: 'emphasis',
          animation: 'pulse',
          options: {
            scale: [1, 1.1, 1],
            duration,
            easing,
            repeat: 2
          }
        });
        
      case 'wiggle':
        return animationManager.createAnimation(element, {
          type: 'attention',
          animation: 'wiggle',
          options: {
            rotation: [0, 5, -5, 0],
            duration,
            easing
          }
        });
        
      default:
        logger.warn(`Unknown animation type: ${animationType}`);
        return Promise.resolve();
      }
    } catch (error) {
      logger.error(`Game element animation failed for type ${animationType}:`, error);
      return Promise.resolve();
    }
  }
  
  /**
   * Create a feedback icon element
   * @param {string} icon - Icon character (✓, ✗, etc.)
   * @param {string} color - Icon color
   * @returns {HTMLElement} - Created icon element
   */
  createFeedbackIcon(icon, color) {
    const iconElement = document.createElement('div');
    iconElement.className = 'game-feedback-icon';
    iconElement.textContent = icon;
    iconElement.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 3rem;
      font-weight: bold;
      color: ${color};
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
      opacity: 0;
      z-index: 1000;
      pointer-events: none;
    `;
    return iconElement;
  }
  
  /**
   * Create celebration text element
   * @param {string} text - Celebration text
   * @returns {HTMLElement} - Created text element
   */
  createCelebrationText(text) {
    const textElement = document.createElement('div');
    textElement.className = 'game-celebration-text';
    textElement.textContent = text;
    textElement.style.cssText = `
      position: absolute;
      top: 30%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 2.5rem;
      font-weight: bold;
      color: #FFD700;
      text-shadow: 3px 3px 6px rgba(0,0,0,0.5);
      opacity: 0;
      z-index: 1001;
      pointer-events: none;
      text-align: center;
    `;
    return textElement;
  }
  
  /**
   * Create confetti particle effect
   * @param {Array} colors - Array of colors for confetti
   * @param {number} duration - Effect duration in ms
   * @returns {Promise} - Effect completion promise
   */
  async createConfettiEffect(colors, duration) {
    const confettiCount = 30;
    const confettiElements = [];
    
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'game-confetti-particle';
      confetti.style.cssText = `
        position: absolute;
        width: 10px;
        height: 10px;
        background-color: ${colors[Math.floor(Math.random() * colors.length)]};
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        border-radius: 2px;
        z-index: 999;
        pointer-events: none;
      `;
      
      this.container.appendChild(confetti);
      confettiElements.push(confetti);
      
      // Animate each confetti particle
      const angle = (360 / confettiCount) * i;
      const distance = 100 + Math.random() * 100;
      const x = Math.cos(angle * Math.PI / 180) * distance;
      const y = Math.sin(angle * Math.PI / 180) * distance;
      
      animationManager.createAnimation(confetti, {
        type: 'celebration',
        animation: 'confetti',
        options: {
          transform: [
            'translate(-50%, -50%) scale(0) rotate(0deg)',
            `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1) rotate(${Math.random() * 360}deg)`
          ],
          opacity: [1, 0],
          duration: duration,
          easing: 'easeOut',
          delay: i * 50
        }
      });
    }
    
    // Clean up confetti after animation
    setTimeout(() => {
      confettiElements.forEach(confetti => {
        if (confetti.parentNode) {
          confetti.parentNode.removeChild(confetti);
        }
      });
    }, duration + 1000);
    
    return Promise.resolve();
  }
  

  /**
   * Get tier configuration for celebration animations
   * @param {string} tier - Achievement tier (bronze, silver, gold, platinum)
   * @param {boolean} perfectScore - Whether this was a perfect score
   * @returns {Object} - Tier configuration object
   */
  getTierConfiguration(tier, perfectScore = false) {
    const baseConfig = {
      bronze: {
        trophy: '🥉',
        colors: ['#CD7F32', '#DAA520', '#B8860B'],
        containerScale: [1, 1.05, 1],
        containerRotation: [0, 1, 0],
        confettiDuration: 0.6,
        starDuration: 0.7,
        starCount: 8,
        showFireworks: false,
        showParticles: false,
        hapticPattern: [100, 50, 100]
      },
      silver: {
        trophy: '🥈',
        colors: ['#C0C0C0', '#E5E5E5', '#DCDCDC'],
        containerScale: [1, 1.08, 1.02],
        containerRotation: [0, 2, 0],
        confettiDuration: 0.7,
        starDuration: 0.8,
        starCount: 12,
        showFireworks: false,
        showParticles: true,
        hapticPattern: [100, 50, 100, 50, 150]
      },
      gold: {
        trophy: '🥇',
        colors: ['#FFD700', '#FFA500', '#FF8C00'],
        containerScale: [1, 1.15, 1.05],
        containerRotation: [0, 3, -1, 0],
        confettiDuration: 0.8,
        starDuration: 0.9,
        starCount: 16,
        showFireworks: true,
        showParticles: true,
        hapticPattern: [100, 50, 100, 50, 100, 50, 200]
      },
      platinum: {
        trophy: '🏆',
        colors: ['#E5E4E2', '#FFFFFF', '#C0C0C0'],
        containerScale: [1, 1.2, 1.1, 1.05],
        containerRotation: [0, 5, -2, 1, 0],
        confettiDuration: 1.0,
        starDuration: 1.0,
        starCount: 20,
        showFireworks: true,
        showParticles: true,
        hapticPattern: [100, 50, 100, 50, 100, 50, 100, 50, 300]
      }
    };

    const config = baseConfig[tier] || baseConfig.bronze;
    
    // Enhance for perfect scores
    if (perfectScore) {
      config.colors = ['#FFD700', '#FFFF00', '#FFA500']; // Golden colors
      config.starCount = Math.min(config.starCount + 8, 24);
      config.showFireworks = true;
      config.showParticles = true;
      config.hapticPattern = [...config.hapticPattern, 100, 50, 400];
    }

    return config;
  }

  /**
   * Create victory overlay with tier-specific styling
   * @param {Object} tierConfig - Tier configuration
   * @param {string} celebrationText - Text to display
   * @param {number} score - Player's score
   * @returns {HTMLElement} - Victory overlay element
   */
  createVictoryOverlay(tierConfig, celebrationText, score) {
    const overlay = document.createElement('div');
    overlay.className = `victory-container celebration-tier-${tierConfig.trophy === '🥉' ? 'bronze' : 
      tierConfig.trophy === '🥈' ? 'silver' :
        tierConfig.trophy === '🥇' ? 'gold' : 'platinum'}`;
    
    overlay.innerHTML = `
      <div class="victory-content victory-bounce">
        <div class="trophy-container">
          <div class="trophy ${tierConfig.trophy === '🥉' ? 'bronze' : 
    tierConfig.trophy === '🥈' ? 'silver' :
      tierConfig.trophy === '🥇' ? 'gold' : 'platinum'}">${tierConfig.trophy}</div>
        </div>
        <div class="celebration-text ${tierConfig.trophy === '🥇' || tierConfig.trophy === '🏆' ? 'golden' : 
    tierConfig.trophy === '🥈' ? 'silver' : 'bronze'}">${celebrationText}</div>
        ${score !== null ? `<div class="victory-score${score === 100 ? ' perfect' : ''}">${score} Points!</div>` : ''}
        <div class="celebration-subtitle">Fantastic work!</div>
        <div class="victory-ribbon">
          <span>${tierConfig.trophy === '🏆' ? 'LEGENDARY!' : 
    tierConfig.trophy === '🥇' ? 'EXCELLENT!' :
      tierConfig.trophy === '🥈' ? 'GREAT JOB!' : 'WELL DONE!'}</span>
        </div>
      </div>
      <div class="particle-container"></div>
    `;

    return overlay;
  }

  /**
   * Create fireworks effect for gold/platinum celebrations
   * @param {number} duration - Effect duration in ms
   * @returns {Promise} - Effect completion promise
   */
  async createFireworksEffect(duration) {
    const fireworksCount = 6;
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFD700', '#9B59B6', '#F39C12'];
    
    for (let i = 0; i < fireworksCount; i++) {
      setTimeout(() => {
        const firework = document.createElement('div');
        firework.className = `firework ${colors[i % colors.length].replace('#', '')}`;
        
        // Random position
        firework.style.left = (Math.random() * 80 + 10) + '%';
        firework.style.top = (Math.random() * 60 + 20) + '%';
        
        document.body.appendChild(firework);
        
        // Remove after animation
        setTimeout(() => {
          if (firework.parentNode) {
            firework.remove();
          }
        }, 1500);
      }, i * (duration / fireworksCount));
    }
    
    return Promise.resolve();
  }

  /**
   * Create particle effect for higher tier celebrations
   * @param {Array} colors - Array of colors for particles
   * @param {number} duration - Effect duration in ms
   * @returns {Promise} - Effect completion promise
   */
  async createParticleEffect(colors, duration) {
    const particleCount = 15;
    const particleContainer = document.querySelector('.particle-container');
    
    if (!particleContainer) return Promise.resolve();
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.cssText = `
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        left: ${Math.random() * 100}%;
        animation-delay: ${Math.random() * duration / 2}ms;
      `;
      
      particleContainer.appendChild(particle);
      
      // Remove after animation
      setTimeout(() => {
        if (particle.parentNode) {
          particle.remove();
        }
      }, duration + 1000);
    }
    
    return Promise.resolve();
  }

  /**
   * Enhanced createStarBurstEffect with configurable parameters
   * @param {number} duration - Effect duration in ms
   * @param {number} starCount - Number of stars to create
   * @returns {Promise} - Effect completion promise
   */
  async createStarBurstEffect(duration, starCount = 8) {
    const starElements = [];
    
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.className = 'game-star-particle';
      star.textContent = '⭐';
      star.style.cssText = `
        position: absolute;
        font-size: ${1.5 + Math.random() * 1}rem;
        color: #FFD700;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        z-index: 1000;
        pointer-events: none;
        opacity: 0;
      `;
      
      this.container.appendChild(star);
      starElements.push(star);
      
      // Animate each star in a burst pattern
      const angle = (360 / starCount) * i;
      const distance = 80 + Math.random() * 40;
      const x = Math.cos(angle * Math.PI / 180) * distance;
      const y = Math.sin(angle * Math.PI / 180) * distance;
      
      animationManager.createAnimation(star, {
        type: 'celebration',
        animation: 'starBurst',
        options: {
          transform: [
            'translate(-50%, -50%) scale(0)',
            `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1.2)`,
            `translate(calc(-50% + ${x * 1.3}px), calc(-50% + ${y * 1.3}px)) scale(0)`
          ],
          opacity: [0, 1, 0],
          duration: duration,
          easing: 'easeOut',
          delay: i * (duration / starCount / 2)
        }
      });
    }
    
    // Clean up stars after animation
    setTimeout(() => {
      starElements.forEach(star => {
        if (star.parentNode) {
          star.parentNode.removeChild(star);
        }
      });
    }, duration + 500);
    
    return Promise.resolve();
  }
  
  /**
   * Show score animation when score changes
   * @param {number} points - Points gained/lost
   * @param {Object} options - Animation options
   * @returns {Promise} - Animation completion promise
   */
  async showScoreAnimation(points, options = {}) {
    if (!this.enableAnimations || !this.container) {
      return Promise.resolve();
    }
    
    const {
      x = this.container.offsetWidth / 2,
      y = this.container.offsetHeight / 2,
      isBonus = false,
      duration = 1500
    } = options;
    
    try {
      // Create floating score element
      const scoreFloat = document.createElement('div');
      scoreFloat.className = 'score-float' + (isBonus ? ' bonus' : '') + (points < 0 ? ' negative' : '');
      scoreFloat.textContent = (points > 0 ? '+' : '') + points;
      scoreFloat.style.left = x + 'px';
      scoreFloat.style.top = y + 'px';
      
      this.container.appendChild(scoreFloat);
      
      // Create particles for bonus scores
      if (isBonus && points > 0) {
        this.createBonusParticles(x, y, 8);
      }
      
      // Update score counter with animation
      const scoreElement = document.getElementById('score-display') || 
                          this.container.querySelector('.score-display');
      if (scoreElement) {
        scoreElement.classList.add('updating');
        setTimeout(() => {
          scoreElement.classList.remove('updating');
        }, 600);
      }
      
      // Remove floating score after animation
      setTimeout(() => {
        if (scoreFloat.parentNode) {
          scoreFloat.remove();
        }
      }, duration);
      
      // Sound effect hook
      if (this.onSoundEffect) {
        this.onSoundEffect(points > 0 ? 'score-gain' : 'score-loss');
      }
      
    } catch (error) {
      logger.error('Score animation failed:', error);
    }
  }
  
  /**
   * Show streak animation for consecutive correct answers
   * @param {number} streakCount - Current streak count
   * @param {Object} options - Animation options
   * @returns {Promise} - Animation completion promise
   */
  async showStreakAnimation(streakCount, options = {}) {
    if (!this.enableAnimations || !this.container || streakCount < 2) {
      return Promise.resolve();
    }
    
    const {
      showIndicator = true,
      showFireEffect = streakCount >= 5,
      duration = 2000
    } = options;
    
    try {
      // Update or create streak indicator
      let streakIndicator = this.container.querySelector('.streak-indicator');
      const isNew = !streakIndicator;
      
      if (!streakIndicator && showIndicator) {
        streakIndicator = document.createElement('div');
        streakIndicator.className = 'streak-indicator new';
        this.container.appendChild(streakIndicator);
      }
      
      if (streakIndicator) {
        streakIndicator.innerHTML = `
          ${showFireEffect ? '<span class="streak-fire">🔥</span>' : ''}
          <span class="streak-count">${streakCount} Streak!</span>
        `;
        
        if (isNew) {
          // Remove 'new' class after animation
          setTimeout(() => {
            streakIndicator.classList.remove('new');
          }, 600);
        }
      }
      
      // Show combo multiplier for high streaks
      if (streakCount >= 10) {
        const multiplier = Math.floor(streakCount / 5);
        this.showComboMultiplier(multiplier);
      }
      
      // Special effects for milestone streaks
      if (streakCount === 5 || streakCount === 10 || streakCount % 25 === 0) {
        await this.showMilestoneStreakEffect(streakCount);
      }
      
      // Sound effect hook
      if (this.onSoundEffect) {
        if (streakCount === 3) this.onSoundEffect('streak-start');
        else if (streakCount % 5 === 0) this.onSoundEffect('streak-milestone');
        else this.onSoundEffect('streak-continue');
      }
      
      // Auto-hide streak indicator after duration
      if (showIndicator && isNew) {
        setTimeout(() => {
          if (streakIndicator && streakIndicator.parentNode) {
            animationManager.createAnimation(streakIndicator, {
              type: 'exit',
              animation: 'fadeOut',
              options: { duration: 300 }
            }).then(() => {
              streakIndicator.remove();
            });
          }
        }, duration);
      }
      
    } catch (error) {
      logger.error('Streak animation failed:', error);
    }
  }
  
  /**
   * Show combo multiplier
   * @param {number} multiplier - Combo multiplier value
   */
  showComboMultiplier(multiplier) {
    const existing = this.container.querySelector('.combo-multiplier');
    if (existing) existing.remove();
    
    const combo = document.createElement('div');
    combo.className = 'combo-multiplier';
    combo.textContent = `${multiplier}x Combo!`;
    this.container.appendChild(combo);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (combo.parentNode) {
        combo.remove();
      }
    }, 3000);
  }
  
  /**
   * Show milestone streak effect
   * @param {number} streakCount - Milestone streak count
   * @returns {Promise} - Animation completion promise
   */
  async showMilestoneStreakEffect(streakCount) {
    const effect = document.createElement('div');
    effect.className = 'perfect-score';
    
    if (streakCount === 5) {
      effect.textContent = 'ON FIRE! 🔥';
    } else if (streakCount === 10) {
      effect.textContent = 'UNSTOPPABLE! ⚡';
    } else if (streakCount === 25) {
      effect.textContent = 'LEGENDARY! 👑';
    } else if (streakCount === 50) {
      effect.textContent = 'GODLIKE! 🌟';
    } else {
      effect.textContent = `${streakCount} STREAK! 🎯`;
    }
    
    this.container.appendChild(effect);
    
    // Remove after animation
    setTimeout(() => {
      if (effect.parentNode) {
        effect.remove();
      }
    }, 2000);
    
    // Create particle burst for milestone
    if (streakCount >= 25) {
      await this.createStarBurstEffect(1000);
    }
  }
  
  /**
   * Create bonus particles effect
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} count - Number of particles
   */
  createBonusParticles(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'correct-particle';
      particle.style.left = x + 'px';
      particle.style.top = y + 'px';
      
      // Random direction for burst effect
      const angle = (Math.PI * 2 * i) / count;
      const distance = 50 + Math.random() * 50;
      particle.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
      particle.style.setProperty('--ty', Math.sin(angle) * distance + 'px');
      
      this.container.appendChild(particle);
      
      // Remove after animation
      setTimeout(() => {
        if (particle.parentNode) {
          particle.remove();
        }
      }, 1000);
    }
  }
  
  /**
   * Show life/heart animation
   * @param {number} livesChange - Number of lives gained/lost
   * @param {Object} options - Animation options
   * @returns {Promise} - Animation completion promise
   */
  async showLifeAnimation(livesChange, options = {}) {
    if (!this.enableAnimations || !this.container) {
      return Promise.resolve();
    }
    
    const {
      showHearts = true,
      duration = 800
    } = options;
    
    try {
      // Find or create lives container
      let livesContainer = this.container.querySelector('.game-lives-container');
      if (!livesContainer && showHearts) {
        livesContainer = document.createElement('div');
        livesContainer.className = 'game-lives-container';
        livesContainer.style.position = 'absolute';
        livesContainer.style.top = '20px';
        livesContainer.style.left = '20px';
        this.container.appendChild(livesContainer);
      }
      
      if (livesContainer) {
        // Update hearts display
        const hearts = [];
        for (let i = 0; i < this.lives; i++) {
          const heart = document.createElement('div');
          heart.className = 'game-life heart';
          hearts.push(heart);
        }
        
        // Animate life change
        if (livesChange < 0) {
          // Losing lives
          const currentHearts = livesContainer.querySelectorAll('.game-life');
          for (let i = 0; i < Math.abs(livesChange) && i < currentHearts.length; i++) {
            const index = currentHearts.length - 1 - i;
            if (currentHearts[index]) {
              currentHearts[index].classList.add('losing');
            }
          }
          
          // Update display after animation
          setTimeout(() => {
            livesContainer.innerHTML = '';
            hearts.forEach(heart => livesContainer.appendChild(heart));
          }, duration);
          
        } else if (livesChange > 0) {
          // Gaining lives
          for (let i = 0; i < livesChange; i++) {
            const newHeart = document.createElement('div');
            newHeart.className = 'game-life heart gaining';
            livesContainer.appendChild(newHeart);
            
            // Remove gaining class after animation
            setTimeout(() => {
              newHeart.classList.remove('gaining');
            }, duration);
          }
        }
      }
      
      // Sound effect hook
      if (this.onSoundEffect) {
        this.onSoundEffect(livesChange > 0 ? 'life-gain' : 'life-loss');
      }
      
    } catch (error) {
      logger.error('Life animation failed:', error);
    }
  }
  
  /**
   * Make an element interactive with hover, click, and drag animations
   * @param {HTMLElement} element - Element to make interactive
   * @param {Object} options - Interaction options
   * @returns {Object} - Interaction handler object with cleanup method
   */
  makeInteractive(element, options = {}) {
    if (!element) return null;
    
    const {
      hover = 'scale', // 'scale', 'lift', 'glow', 'rotate', 'bounce', 'float', 'wobble'
      click = 'press', // 'press', 'ripple', 'pulse', 'flash', 'shake'
      draggable = false,
      selectable = false,
      sound = true,
      haptic = true,
      onHover = null,
      onClick = null,
      onDragStart = null,
      onDragEnd = null,
      onSelect = null
    } = options;
    
    // Add base interactive class
    element.classList.add('game-interactive');
    
    // Add specific interaction classes
    if (hover) element.classList.add(`hover-${hover}`);
    if (click) element.classList.add(`click-${click}`);
    if (draggable) element.classList.add('game-draggable');
    
    // Store original styles for cleanup
    const originalClasses = [...element.classList];
    const originalStyle = element.getAttribute('style') || '';
    
    // Event handlers
    const handlers = {};
    
    // Hover handlers
    if (onHover) {
      handlers.mouseenter = (e) => {
        onHover('enter', e);
        if (sound && this.onSoundEffect) this.onSoundEffect('hover');
      };
      handlers.mouseleave = (e) => {
        onHover('leave', e);
      };
      element.addEventListener('mouseenter', handlers.mouseenter);
      element.addEventListener('mouseleave', handlers.mouseleave);
    }
    
    // Click handlers
    if (onClick) {
      handlers.click = async (e) => {
        e.preventDefault();
        
        // Add click animation class temporarily
        if (click === 'shake') {
          element.classList.add('click-shake');
          setTimeout(() => element.classList.remove('click-shake'), 500);
        }
        
        // Haptic feedback
        if (haptic && this.hapticFeedback) {
          navigator.vibrate(25);
        }
        
        // Sound effect
        if (sound && this.onSoundEffect) {
          this.onSoundEffect('click');
        }
        
        // Create touch ripple effect on mobile
        if (this.isMobile && click === 'ripple') {
          this.createTouchRipple(e);
        }
        
        await onClick(e);
      };
      element.addEventListener('click', handlers.click);
      
      // Touch handling for mobile
      if (this.isMobile) {
        handlers.touchstart = (e) => {
          if (click === 'ripple') {
            this.createTouchRipple(e);
          }
        };
        element.addEventListener('touchstart', handlers.touchstart, { passive: true });
      }
    }
    
    // Drag and drop handlers
    if (draggable) {
      this.makeDraggable(element, { onDragStart, onDragEnd });
    }
    
    // Selection handler
    if (selectable && onSelect) {
      handlers.select = (e) => {
        this.selectElement(element);
        onSelect(e);
      };
      element.addEventListener('click', handlers.select);
    }
    
    // Keyboard navigation
    element.setAttribute('tabindex', '0');
    handlers.keydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (onClick) onClick(e);
        if (selectable && onSelect) onSelect(e);
      }
    };
    element.addEventListener('keydown', handlers.keydown);
    
    // Return cleanup object
    return {
      element,
      cleanup: () => {
        // Remove event listeners
        Object.entries(handlers).forEach(([event, handler]) => {
          element.removeEventListener(event, handler);
        });
        
        // Reset classes and styles
        element.className = originalClasses.join(' ');
        if (originalStyle) {
          element.setAttribute('style', originalStyle);
        } else {
          element.removeAttribute('style');
        }
        
        // Remove tabindex if it wasn't there originally
        if (!element.hasAttribute('tabindex')) {
          element.removeAttribute('tabindex');
        }
      }
    };
  }
  
  /**
   * Create touch ripple effect
   * @param {Event} event - Touch or click event
   */
  createTouchRipple(event) {
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    
    // Calculate ripple position
    let x, y;
    if (event.touches && event.touches[0]) {
      x = event.touches[0].clientX - rect.left;
      y = event.touches[0].clientY - rect.top;
    } else {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    }
    
    // Create ripple element
    const ripple = document.createElement('span');
    ripple.className = 'touch-ripple';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    element.appendChild(ripple);
    
    // Remove ripple after animation
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.remove();
      }
    }, 600);
  }
  
  /**
   * Make an element draggable
   * @param {HTMLElement} element - Element to make draggable
   * @param {Object} options - Drag options
   */
  makeDraggable(element, options = {}) {
    const { onDragStart, onDragEnd } = options;
    
    let isDragging = false;
    let dragGhost = null;
    let startPos = null;
    
    // Mouse/touch start
    const handleStart = (e) => {
      isDragging = true;
      element.classList.add('dragging');
      
      // Store start position
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      startPos = { x: clientX, y: clientY };
      
      // Create drag ghost
      dragGhost = this.createDragGhost(element);
      
      // Sound effect
      if (this.onSoundEffect) this.onSoundEffect('drag-start');
      
      // Haptic feedback
      if (this.hapticFeedback) navigator.vibrate(50);
      
      if (onDragStart) onDragStart(e);
      
      e.preventDefault();
    };
    
    // Mouse/touch move
    const handleMove = (e) => {
      if (!isDragging || !dragGhost) return;
      
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      
      dragGhost.style.left = clientX + 'px';
      dragGhost.style.top = clientY + 'px';
      
      // Check for drop zones
      this.updateDropZones(clientX, clientY);
      
      e.preventDefault();
    };
    
    // Mouse/touch end
    const handleEnd = (e) => {
      if (!isDragging) return;
      
      isDragging = false;
      element.classList.remove('dragging');
      
      // Remove drag ghost
      if (dragGhost) {
        dragGhost.remove();
        dragGhost = null;
      }
      
      // Check for successful drop
      const dropZone = this.findDropZone(e.clientX || startPos.x, e.clientY || startPos.y);
      if (dropZone) {
        this.handleDrop(element, dropZone);
      }
      
      // Clear drop zone highlights
      this.clearDropZoneHighlights();
      
      // Sound effect
      if (this.onSoundEffect) this.onSoundEffect('drag-end');
      
      if (onDragEnd) onDragEnd(e);
    };
    
    // Add event listeners
    element.addEventListener('mousedown', handleStart);
    element.addEventListener('touchstart', handleStart, { passive: false });
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleMove, { passive: false });
    
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);
    
    // Store cleanup function
    element._dragCleanup = () => {
      element.removeEventListener('mousedown', handleStart);
      element.removeEventListener('touchstart', handleStart);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchend', handleEnd);
    };
  }
  
  /**
   * Create a visual ghost for dragging
   * @param {HTMLElement} element - Original element
   * @returns {HTMLElement} - Ghost element
   */
  createDragGhost(element) {
    const ghost = element.cloneNode(true);
    ghost.className = 'game-drag-ghost';
    
    // Position ghost at cursor
    const rect = element.getBoundingClientRect();
    ghost.style.left = rect.left + 'px';
    ghost.style.top = rect.top + 'px';
    ghost.style.width = rect.width + 'px';
    ghost.style.height = rect.height + 'px';
    
    document.body.appendChild(ghost);
    return ghost;
  }
  
  /**
   * Update drop zone highlights during drag
   * @param {number} x - Cursor X position
   * @param {number} y - Cursor Y position
   */
  updateDropZones(x, y) {
    const dropZones = this.container.querySelectorAll('.game-drop-zone');
    
    dropZones.forEach(zone => {
      const rect = zone.getBoundingClientRect();
      const isOver = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      
      zone.classList.toggle('drag-over', isOver);
    });
  }
  
  /**
   * Find drop zone at coordinates
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {HTMLElement|null} - Drop zone element or null
   */
  findDropZone(x, y) {
    const dropZones = this.container.querySelectorAll('.game-drop-zone');
    
    for (const zone of dropZones) {
      const rect = zone.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return zone;
      }
    }
    
    return null;
  }
  
  /**
   * Handle successful drop
   * @param {HTMLElement} element - Dragged element
   * @param {HTMLElement} dropZone - Drop zone element
   */
  handleDrop(element, dropZone) {
    // Check if drop is valid
    const isValid = this.validateDrop(element, dropZone);
    
    if (isValid) {
      dropZone.classList.add('drop-success');
      
      // Move element to drop zone
      dropZone.appendChild(element);
      
      // Success animation
      element.classList.add('game-drop-success');
      
      // Sound effect
      if (this.onSoundEffect) this.onSoundEffect('drop-success');
      
      // Haptic feedback
      if (this.hapticFeedback) navigator.vibrate([50, 50, 100]);
      
      // Clean up animation classes
      setTimeout(() => {
        dropZone.classList.remove('drop-success');
        element.classList.remove('game-drop-success');
      }, 600);
      
    } else {
      dropZone.classList.add('drop-invalid');
      
      // Invalid drop animation
      setTimeout(() => {
        dropZone.classList.remove('drop-invalid');
      }, 500);
      
      // Sound effect
      if (this.onSoundEffect) this.onSoundEffect('drop-invalid');
      
      // Haptic feedback
      if (this.hapticFeedback) navigator.vibrate(200);
    }
  }
  
  /**
   * Validate if a drop is allowed
   * @param {HTMLElement} element - Dragged element
   * @param {HTMLElement} dropZone - Drop zone element
   * @returns {boolean} - Whether drop is valid
   */
  validateDrop(element, dropZone) {
    // Check data attributes for validation
    const elementType = element.dataset.type;
    const acceptedTypes = dropZone.dataset.accept;
    
    if (acceptedTypes) {
      return acceptedTypes.split(',').includes(elementType);
    }
    
    // Default: allow all drops
    return true;
  }
  
  /**
   * Clear all drop zone highlights
   */
  clearDropZoneHighlights() {
    const dropZones = this.container.querySelectorAll('.game-drop-zone');
    dropZones.forEach(zone => {
      zone.classList.remove('drag-over', 'drop-valid', 'drop-invalid');
    });
  }
  
  /**
   * Select an element (for games with selection mechanics)
   * @param {HTMLElement} element - Element to select
   */
  selectElement(element) {
    // Clear previous selections
    this.container.querySelectorAll('.game-interactive.selected').forEach(el => {
      el.classList.remove('selected');
    });
    
    // Select new element
    element.classList.add('selected');
    
    // Sound effect
    if (this.onSoundEffect) this.onSoundEffect('select');
    
    // Haptic feedback
    if (this.hapticFeedback) navigator.vibrate(25);
  }
  
  /**
   * Highlight element (for tutorials or hints)
   * @param {HTMLElement} element - Element to highlight
   * @param {number} duration - Highlight duration in ms
   */
  highlightElement(element, duration = 3000) {
    element.classList.add('highlighted');
    
    setTimeout(() => {
      element.classList.remove('highlighted');
    }, duration);
  }
  
  /**
   * Set element loading state
   * @param {HTMLElement} element - Element to show loading
   * @param {boolean} loading - Loading state
   */
  setElementLoading(element, loading = true) {
    element.classList.toggle('loading', loading);
    element.classList.toggle('disabled', loading);
  }
  
  /**
   * Enable/disable element interaction
   * @param {HTMLElement} element - Element to enable/disable
   * @param {boolean} enabled - Enabled state
   */
  setElementEnabled(element, enabled = true) {
    element.classList.toggle('disabled', !enabled);
    
    if (enabled) {
      element.removeAttribute('aria-disabled');
    } else {
      element.setAttribute('aria-disabled', 'true');
    }
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
    
    // Clear XP system references
    this.xpGainAnimation = null;
    this.levelUpNotification = null;
    this.levelMilestones = null;
        
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