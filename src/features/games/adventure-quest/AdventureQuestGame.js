import config from '../../../config.js';
import { getRandomInt, debounce } from '../../../utils/common.js';
import StoryProgression from './StoryProgression.js';
import ChallengeManager from './ChallengeManager.js';
import DiscoveryTracker from './DiscoveryTracker.js';
import IslandNavigator from './IslandNavigator.js';

/**
 * AdventureQuestGame - Sky's Scientific Expedition
 * A story-driven educational adventure game where students explore scientific islands
 */
export default class AdventureQuestGame {
  /**
   * Create a new AdventureQuestGame instance
   * @param {string} canvasId - The ID of the canvas element
   * @param {Object} options - Game configuration options
   */
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas element with id "${canvasId}" not found`);
    }

    this.ctx = this.canvas.getContext('2d', { alpha: false });

    // Game configuration
    this.config = {
      playerName: options.playerName || 'Explorer',
      difficulty: options.difficulty || 'medium',
      soundEnabled: options.soundEnabled !== false,
      ...config.adventureQuest,
    };

    // Initialize game state
    this.gameState = {
      isPlaying: false,
      isPaused: false,
      currentScene: 'intro',
      score: 0,
      totalDiscoveries: 0,
    };

    // Initialize game systems
    this.storyProgression = new StoryProgression(this);
    this.challengeManager = new ChallengeManager(this);
    this.discoveryTracker = new DiscoveryTracker(this);
    this.islandNavigator = new IslandNavigator(this);

    // Theme and rendering
    this.themeColors = this.initializeThemeColors();
    this.lastFrameTime = 0;
    this.animationId = null;

    // Bind methods to preserve 'this' context
    this.animate = this.animate.bind(this);
    this.handleCanvasClick = this.handleCanvasClick.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.onThemeChange = this.onThemeChange.bind(this);

    // Initialize
    this.setupCanvas();
    this.setupEventListeners();
    this.setupThemeListener();

    // Load initial scene
    this.loadScene('intro');
  }

  /**
   * Initialize theme colors from CSS variables
   * @returns {Object} Theme color mappings
   */
  initializeThemeColors() {
    const style = getComputedStyle(document.documentElement);
    return {
      primary: style.getPropertyValue('--accent-primary').trim() || '#4a90e2',
      secondary: style.getPropertyValue('--accent-secondary').trim() || '#7ed321',
      background: style.getPropertyValue('--bg-primary').trim() || '#ffffff',
      surface: style.getPropertyValue('--bg-card').trim() || '#f8f9fa',
      text: style.getPropertyValue('--text-primary').trim() || '#333333',
      textSecondary: style.getPropertyValue('--text-secondary').trim() || '#666666',
      danger: style.getPropertyValue('--text-danger').trim() || '#d9534f',
      success: style.getPropertyValue('--text-success').trim() || '#5cb85c',
    };
  }

  /**
   * Setup canvas dimensions and styling
   */
  setupCanvas() {
    this.resizeCanvas();
    this.canvas.style.border = '2px solid ' + this.themeColors.primary;
    this.canvas.style.borderRadius = '8px';
    this.canvas.style.background = this.themeColors.background;
  }

  /**
   * Resize canvas to fill container while maintaining aspect ratio
   */
  resizeCanvas() {
    const container = this.canvas.parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight || 600;

    // Maintain 16:9 aspect ratio
    const aspectRatio = 16 / 9;
    let canvasWidth = containerWidth;
    let canvasHeight = containerWidth / aspectRatio;

    if (canvasHeight > containerHeight) {
      canvasHeight = containerHeight;
      canvasWidth = containerHeight * aspectRatio;
    }

    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;

    // Update canvas style dimensions
    this.canvas.style.width = canvasWidth + 'px';
    this.canvas.style.height = canvasHeight + 'px';
  }

  /**
   * Setup event listeners for user interaction
   */
  setupEventListeners() {
    this.canvas.addEventListener('click', this.handleCanvasClick);
    document.addEventListener('keydown', this.handleKeyPress);
    window.addEventListener('resize', debounce(this.handleResize, 250));

    // Focus management for keyboard input
    this.canvas.setAttribute('tabindex', '0');
    this.canvas.addEventListener('focus', () => {
      this.canvas.style.outline = '2px solid ' + this.themeColors.primary;
    });
    this.canvas.addEventListener('blur', () => {
      this.canvas.style.outline = 'none';
    });
  }

  /**
   * Setup theme change listener
   */
  setupThemeListener() {
    const observer = new MutationObserver(() => {
      this.onThemeChange();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });
  }

  /**
   * Handle theme changes
   */
  onThemeChange() {
    this.themeColors = this.initializeThemeColors();
    this.setupCanvas();
    // Trigger re-render of current scene
    if (this.gameState.currentScene) {
      this.render();
    }
  }

  /**
   * Handle canvas click events
   * @param {MouseEvent} event - Click event
   */
  handleCanvasClick(event) {
    if (!this.gameState.isPlaying && !this.gameState.isPaused) return;

    const rect = this.canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Scale click coordinates to canvas coordinates
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const canvasX = clickX * scaleX;
    const canvasY = clickY * scaleY;

    // Route click to appropriate system
    this.routeClick(canvasX, canvasY);
  }

  /**
   * Handle keyboard input
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyPress(event) {
    if (!this.gameState.isPlaying && !this.gameState.isPaused) return;

    switch (event.code) {
      case 'Space':
        event.preventDefault();
        this.togglePause();
        break;
      case 'Escape':
        event.preventDefault();
        this.showPauseMenu();
        break;
      case 'KeyH':
        event.preventDefault();
        this.showHelp();
        break;
      default:
        // Route other keys to current scene
        this.routeKeyPress(event);
    }
  }

  /**
   * Route key press events to appropriate systems
   * @param {KeyboardEvent} event - Keyboard event
   */
  routeKeyPress(event) {
    const currentSystem = this.getCurrentSystem();
    if (currentSystem && currentSystem.handleKeyPress) {
      currentSystem.handleKeyPress(event);
    }
  }

  /**
   * Get the currently active game system
   * @returns {Object|null} Current active system
   */
  getCurrentSystem() {
    switch (this.gameState.currentScene) {
      case 'story':
        return this.storyProgression;
      case 'challenge':
        return this.challengeManager;
      case 'navigation':
        return this.islandNavigator;
      case 'discovery':
        return this.discoveryTracker;
      default:
        return null;
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    this.resizeCanvas();
    this.render();
  }

  /**
   * Load a specific scene
   * @param {string} sceneName - Name of scene to load
   * @param {Object} data - Optional scene data
   */
  loadScene(sceneName, data = {}) {
    this.gameState.currentScene = sceneName;

    switch (sceneName) {
      case 'intro':
        this.loadIntroScene(data);
        break;
      case 'story':
        this.storyProgression.loadStory(data);
        break;
      case 'challenge':
        this.challengeManager.loadChallenge(data);
        break;
      case 'navigation':
        this.islandNavigator.loadNavigation(data);
        break;
      case 'discovery':
        this.discoveryTracker.loadDiscovery(data);
        break;
      default:
        console.warn(`Unknown scene: ${sceneName}`);
    }

    this.render();
  }

  /**
   * Load the intro scene
   * @param {Object} data - Scene data
   */
  loadIntroScene(data) {
    this.gameState.isPlaying = false;
    // Intro scene will be rendered in render() method
  }

  /**
   * Start the game
   */
  startGame() {
    this.gameState.isPlaying = true;
    this.gameState.isPaused = false;
    this.startGameLoop();
    this.loadScene('story', { chapter: 'introduction' });
  }

  /**
   * Pause/unpause the game
   */
  togglePause() {
    if (!this.gameState.isPlaying) return;

    this.gameState.isPaused = !this.gameState.isPaused;

    if (this.gameState.isPaused) {
      this.stopGameLoop();
    } else {
      this.startGameLoop();
    }

    this.render();
  }

  /**
   * Show pause menu
   */
  showPauseMenu() {
    if (!this.gameState.isPlaying) return;

    this.gameState.isPaused = true;
    this.stopGameLoop();
    // Pause menu will be rendered in render() method
    this.render();
  }

  /**
   * Show help information
   */
  showHelp() {
    // Implementation will show help overlay
    console.log('Help: Space=Pause, Esc=Menu, H=Help');
  }

  /**
   * Start the game animation loop
   */
  startGameLoop() {
    if (this.animationId) return;

    this.lastFrameTime = performance.now();
    this.animate();
  }

  /**
   * Stop the game animation loop
   */
  stopGameLoop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Main animation loop
   * @param {number} currentTime - Current timestamp
   */
  animate(currentTime = performance.now()) {
    if (!this.gameState.isPlaying || this.gameState.isPaused) {
      this.animationId = null;
      return;
    }

    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Update game systems
    this.update(deltaTime);

    // Render frame
    this.render();

    // Schedule next frame
    this.animationId = requestAnimationFrame(this.animate);
  }

  /**
   * Update game state
   * @param {number} deltaTime - Time since last frame in milliseconds
   */
  update(deltaTime) {
    // Update current active system
    const currentSystem = this.getCurrentSystem();
    if (currentSystem && currentSystem.update) {
      currentSystem.update(deltaTime);
    }

    // Update discovery tracker (always active)
    this.discoveryTracker.update(deltaTime);
  }

  /**
   * Render the current frame
   */
  render() {
    // Clear canvas
    this.ctx.fillStyle = this.themeColors.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Render current scene
    switch (this.gameState.currentScene) {
      case 'intro':
        this.renderIntroScene();
        break;
      case 'story':
        this.storyProgression.render(this.ctx);
        break;
      case 'challenge':
        this.challengeManager.render(this.ctx);
        break;
      case 'navigation':
        this.islandNavigator.render(this.ctx);
        break;
      case 'discovery':
        this.discoveryTracker.render(this.ctx);
        break;
    }

    // Always render UI overlay
    this.renderUIOverlay();

    // Render pause menu if paused
    if (this.gameState.isPaused) {
      this.renderPauseMenu();
    }
  }

  /**
   * Render the intro scene
   */
  renderIntroScene() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // Title
    this.ctx.fillStyle = this.themeColors.primary;
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText("Sky's Scientific Expedition", centerX, centerY - 100);

    // Subtitle
    this.ctx.fillStyle = this.themeColors.text;
    this.ctx.font = '24px Arial';
    this.ctx.fillText('An Adventure Quest Game', centerX, centerY - 50);

    // Start button
    const buttonWidth = 200;
    const buttonHeight = 60;
    const buttonX = centerX - buttonWidth / 2;
    const buttonY = centerY + 50;

    this.ctx.fillStyle = this.themeColors.primary;
    this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

    this.ctx.fillStyle = this.themeColors.background;
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillText('Start Adventure', centerX, buttonY + 38);

    // Store button bounds for click detection
    this.startButtonBounds = { x: buttonX, y: buttonY, width: buttonWidth, height: buttonHeight };
  }

  /**
   * Render UI overlay (score, progress, etc.)
   */
  renderUIOverlay() {
    if (this.gameState.currentScene === 'intro') return;

    // Score display
    this.ctx.fillStyle = this.themeColors.text;
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);

    // Discoveries display
    this.ctx.fillText(`Discoveries: ${this.gameState.totalDiscoveries}`, 20, 55);

    // Instructions
    this.ctx.font = '14px Arial';
    this.ctx.fillStyle = this.themeColors.textSecondary;
    this.ctx.textAlign = 'right';
    this.ctx.fillText(
      'Space: Pause | Esc: Menu | H: Help',
      this.canvas.width - 20,
      this.canvas.height - 20
    );
  }

  /**
   * Render pause menu
   */
  renderPauseMenu() {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Pause menu
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    this.ctx.fillStyle = this.themeColors.background;
    this.ctx.font = 'bold 32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAUSED', centerX, centerY - 50);

    this.ctx.fillStyle = this.themeColors.text;
    this.ctx.font = '18px Arial';
    this.ctx.fillText('Press Space to Resume', centerX, centerY);
    this.ctx.fillText('Press Esc to Return to Menu', centerX, centerY + 30);
  }

  /**
   * Handle clicks in intro scene
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  handleIntroClick(x, y) {
    if (
      this.startButtonBounds &&
      x >= this.startButtonBounds.x &&
      x <= this.startButtonBounds.x + this.startButtonBounds.width &&
      y >= this.startButtonBounds.y &&
      y <= this.startButtonBounds.y + this.startButtonBounds.height
    ) {
      this.startGame();
    }
  }

  /**
   * Route clicks based on current scene
   */
  routeClick(x, y) {
    if (this.gameState.currentScene === 'intro') {
      this.handleIntroClick(x, y);
      return;
    }

    // Route to appropriate system based on current scene
    // Check if click is on navigation elements
    if (this.islandNavigator.handleClick(x, y)) return;

    // Check if click is on story progression elements
    if (this.storyProgression.handleClick(x, y)) return;

    // Check if click is on challenge elements
    if (this.challengeManager.handleClick(x, y)) return;

    // Check if click is on discovery elements
    if (this.discoveryTracker.handleClick(x, y)) return;
  }

  /**
   * Get current game progress
   * @returns {Object} Progress data
   */
  getProgress() {
    return {
      score: this.gameState.score,
      discoveries: this.gameState.totalDiscoveries,
      currentScene: this.gameState.currentScene,
      storyProgress: this.storyProgression.getProgress(),
      challengeProgress: this.challengeManager.getProgress(),
      explorationProgress: this.islandNavigator.getProgress(),
    };
  }

  /**
   * Save game progress to localStorage
   */
  saveProgress() {
    const progress = this.getProgress();
    localStorage.setItem('adventureQuest_progress', JSON.stringify(progress));
  }

  /**
   * Load game progress from localStorage
   * @returns {Object|null} Saved progress or null
   */
  loadProgress() {
    const saved = localStorage.getItem('adventureQuest_progress');
    return saved ? JSON.parse(saved) : null;
  }

  /**
   * Clean up resources and event listeners
   */
  destroy() {
    this.stopGameLoop();

    // Remove event listeners
    this.canvas.removeEventListener('click', this.handleCanvasClick);
    document.removeEventListener('keydown', this.handleKeyPress);
    window.removeEventListener('resize', this.handleResize);

    // Clean up game systems
    this.storyProgression.destroy();
    this.challengeManager.destroy();
    this.discoveryTracker.destroy();
    this.islandNavigator.destroy();
  }
}
