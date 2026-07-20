import { debounce } from '../../utils/common.js';
import EcosystemEngine from './EcosystemEngine.js';
import SpeciesManager from './SpeciesManager.js';
import HabitatBuilder from './HabitatBuilder.js';
import DiscoveryJournal from './DiscoveryJournal.js';

/**
 * EcosystemSafariGame - An interactive ecosystem simulation game
 * Players build and balance different habitats while learning about
 * species relationships and environmental science with Sky the Parrot
 */
export default class EcosystemSafariGame {
  /**
   * Create a new EcosystemSafariGame instance
   * @param {string} canvasId - The ID of the canvas element
   * @param {Object} options - Game configuration options
   */
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d', { alpha: false });

    // Game configuration
    this.config = {
      world: {
        width: 800,
        height: 600,
        gravity: 0.2,
        ecosystemUpdateInterval: 1000, // milliseconds
      },
      ui: {
        panelWidth: 200,
        toolbarHeight: 60,
        gridSize: 20,
      },
      gameplay: {
        maxLevel: 15,
        startingLives: 3,
        perfectBonus: 1000,
        discoveryPoints: 50,
      },
      animation: {
        particleCount: 20,
        fadeSpeed: 0.02,
        bounceHeight: 10,
      },
      ...options,
    };

    // Game state
    this.gameState = {
      currentLevel: 1,
      score: 0,
      lives: this.config.gameplay.startingLives,
      discoveredSpecies: new Set(),
      ecosystemHealth: 100,
      isPlaying: false,
      isPaused: false,
      phase: 'habitat-building', // habitat-building, species-introduction, challenge
      timeElapsed: 0,
    };

    // Initialize subsystems
    this.ecosystemEngine = new EcosystemEngine(this.config.world);
    this.speciesManager = new SpeciesManager();
    this.habitatBuilder = new HabitatBuilder(this.config.ui);
    this.discoveryJournal = new DiscoveryJournal();

    // Game entities
    this.habitats = [];
    this.species = [];
    this.particles = [];
    this.activeConnections = []; // Visual connections between species

    // UI state
    this.dragState = {
      isDragging: false,
      draggedItem: null,
      dragOffset: { x: 0, y: 0 },
      dropZones: [],
    };

    // Animation state
    this.lastFrameTime = 0;
    this.animationId = null;

    // Event handlers bound to this context
    this.handlePointerEvent = this.handlePointerEvent.bind(this);
    this.animate = this.animate.bind(this);
    this.resizeCanvas = this.resizeCanvas.bind(this);
    this.updateEcosystem = this.updateEcosystem.bind(this);

    // Initialize game
    this.init();
  }

  /**
   * Initialize the game
   */
  init() {
    this.setupCanvas();
    this.setupEventListeners();
    this.setupThemeListener();
    this.loadGameContent();
    this.startGameLoop();

    // Display welcome message with Sky the Parrot
    this.showWelcomeMessage();
  }

  /**
   * Set up canvas dimensions and styling
   */
  setupCanvas() {
    this.resizeCanvas();

    // Set up canvas styling
    this.canvas.style.cursor = 'default';
    this.canvas.style.touchAction = 'none'; // Prevent scrolling on touch
  }

  /**
   * Set up event listeners for user interaction
   */
  setupEventListeners() {
    // Pointer events for drag and drop
    this.canvas.addEventListener('pointerdown', this.handlePointerEvent);
    this.canvas.addEventListener('pointermove', this.handlePointerEvent);
    this.canvas.addEventListener('pointerup', this.handlePointerEvent);
    this.canvas.addEventListener('pointercancel', this.handlePointerEvent);

    // Window resize
    window.addEventListener('resize', debounce(this.resizeCanvas, 250));

    // Prevent context menu on right click
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  /**
   * Set up theme change listener
   */
  setupThemeListener() {
    document.addEventListener('theme-changed', () => {
      this.updateThemeColors();
    });
  }

  /**
   * Load game content and data
   */
  loadGameContent() {
    // Initialize with first level habitat options
    this.habitatBuilder.loadLevel(this.gameState.currentLevel);
    this.speciesManager.loadSpeciesForLevel(this.gameState.currentLevel);

    // Set up initial ecosystem state
    this.ecosystemEngine.reset();
  }

  /**
   * Handle pointer events for drag and drop interaction
   * @param {PointerEvent} event - The pointer event
   */
  handlePointerEvent(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    switch (event.type) {
      case 'pointerdown':
        this.handlePointerDown(x, y, event);
        break;
      case 'pointermove':
        this.handlePointerMove(x, y, event);
        break;
      case 'pointerup':
      case 'pointercancel':
        this.handlePointerUp(x, y, event);
        break;
    }
  }

  /**
   * Handle pointer down events
   */
  handlePointerDown(x, y, event) {
    if (!this.gameState.isPlaying) return;

    // Check if clicking on a draggable item
    const item = this.getItemAtPosition(x, y);
    if (item && item.draggable) {
      this.dragState.isDragging = true;
      this.dragState.draggedItem = item;
      this.dragState.dragOffset = {
        x: x - item.x,
        y: y - item.y,
      };

      // Update cursor
      this.canvas.style.cursor = 'grabbing';

      // Capture pointer
      this.canvas.setPointerCapture(event.pointerId);
    }
  }

  /**
   * Handle pointer move events
   */
  handlePointerMove(x, y, _event) {
    if (this.dragState.isDragging && this.dragState.draggedItem) {
      // Update dragged item position
      this.dragState.draggedItem.x = x - this.dragState.dragOffset.x;
      this.dragState.draggedItem.y = y - this.dragState.dragOffset.y;

      // Update drop zones
      this.updateDropZones(x, y);
    } else {
      // Update cursor based on hover state
      const item = this.getItemAtPosition(x, y);
      this.canvas.style.cursor = item && item.draggable ? 'grab' : 'default';
    }
  }

  /**
   * Handle pointer up events
   */
  handlePointerUp(x, y, event) {
    if (this.dragState.isDragging) {
      const dropZone = this.getDropZoneAtPosition(x, y);

      if (dropZone && this.isValidDrop(this.dragState.draggedItem, dropZone)) {
        this.handleSuccessfulDrop(this.dragState.draggedItem, dropZone);
      } else {
        this.handleFailedDrop(this.dragState.draggedItem);
      }

      // Reset drag state
      this.dragState.isDragging = false;
      this.dragState.draggedItem = null;
      this.dragState.dropZones = [];
      this.canvas.style.cursor = 'default';

      // Release pointer capture
      this.canvas.releasePointerCapture(event.pointerId);
    }
  }

  /**
   * Start the main game loop
   */
  startGameLoop() {
    this.gameState.isPlaying = true;
    this.lastFrameTime = performance.now();
    this.animate();

    // Start ecosystem updates
    this.ecosystemUpdateTimer = setInterval(
      this.updateEcosystem,
      this.config.world.ecosystemUpdateInterval
    );
  }

  /**
   * Main animation loop
   */
  animate(currentTime = performance.now()) {
    if (!this.gameState.isPlaying) return;

    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Update game state
    this.update(deltaTime);

    // Render frame
    this.render();

    // Schedule next frame
    this.animationId = requestAnimationFrame(this.animate);
  }

  /**
   * Update game logic
   * @param {number} deltaTime - Time since last frame in milliseconds
   */
  update(deltaTime) {
    if (this.gameState.isPaused) return;

    // Update time elapsed
    this.gameState.timeElapsed += deltaTime;

    // Update particles
    this.updateParticles(deltaTime);

    // Update species animations
    this.updateSpeciesAnimations(deltaTime);

    // Update ecosystem connections
    this.updateEcosystemConnections();

    // Check for level completion
    this.checkLevelCompletion();
  }

  /**
   * Render the game
   */
  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Render background
    this.renderBackground();

    // Render habitats
    this.renderHabitats();

    // Render species
    this.renderSpecies();

    // Render ecosystem connections
    this.renderConnections();

    // Render particles
    this.renderParticles();

    // Render UI
    this.renderUI();

    // Render drag preview
    if (this.dragState.isDragging) {
      this.renderDragPreview();
    }
  }

  /**
   * Show welcome message with Sky the Parrot
   */
  showWelcomeMessage() {
    // This would integrate with the Modal component
    const message = `
      <h3>🦜 Welcome to Sky's Science Safari!</h3>
      <p>Help me build amazing ecosystems and discover how different species work together!</p>
      <p><strong>Phase 1:</strong> Let's start by choosing the perfect habitat for our ecosystem.</p>
    `;

    // Integration point with existing Modal system
    if (window.Modal) {
      window.Modal.show("Sky's Science Safari", message);
    }
  }

  /**
   * Resize canvas to fit container
   */
  resizeCanvas() {
    const container = this.canvas.parentElement;
    const rect = container.getBoundingClientRect();

    this.canvas.width = rect.width;
    this.canvas.height = rect.height;

    // Update world config
    this.config.world.width = this.canvas.width - this.config.ui.panelWidth;
    this.config.world.height = this.canvas.height - this.config.ui.toolbarHeight;
  }

  /**
   * Update theme colors based on current theme
   */
  updateThemeColors() {
    // Get CSS variables for current theme
    const style = getComputedStyle(document.documentElement);

    this.colors = {
      primary: style.getPropertyValue('--accent-primary').trim(),
      secondary: style.getPropertyValue('--accent-secondary').trim(),
      background: style.getPropertyValue('--bg-primary').trim(),
      card: style.getPropertyValue('--bg-card').trim(),
      text: style.getPropertyValue('--text-primary').trim(),
      success: style.getPropertyValue('--text-success').trim(),
      warning: style.getPropertyValue('--text-warning').trim(),
      danger: style.getPropertyValue('--text-danger').trim(),
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    // Stop game loop
    this.gameState.isPlaying = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // Clear ecosystem timer
    if (this.ecosystemUpdateTimer) {
      clearInterval(this.ecosystemUpdateTimer);
    }

    // Remove event listeners
    this.canvas.removeEventListener('pointerdown', this.handlePointerEvent);
    this.canvas.removeEventListener('pointermove', this.handlePointerEvent);
    this.canvas.removeEventListener('pointerup', this.handlePointerEvent);
    this.canvas.removeEventListener('pointercancel', this.handlePointerEvent);
    window.removeEventListener('resize', this.resizeCanvas);
  }

  // Placeholder methods that will be implemented as we build out the subsystems
  getItemAtPosition(_x, _y) {
    return null;
  }
  updateDropZones(_x, _y) {}
  getDropZoneAtPosition(_x, _y) {
    return null;
  }
  isValidDrop(_item, _zone) {
    return false;
  }
  handleSuccessfulDrop(_item, _zone) {}
  handleFailedDrop(_item) {}
  updateEcosystem() {}
  updateParticles(_deltaTime) {}
  updateSpeciesAnimations(_deltaTime) {}
  updateEcosystemConnections() {}
  checkLevelCompletion() {}
  renderBackground() {}
  renderHabitats() {}
  renderSpecies() {}
  renderConnections() {}
  renderParticles() {}
  renderUI() {}
  renderDragPreview() {}
}
