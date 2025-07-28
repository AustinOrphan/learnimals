// filepath: src/features/games/bubble-pop/bubblepop.js
import config from '../../../config.js';
import { getRandomInt, debounce } from '../../../utils/common.js';
import Bubble from './Bubble.js';

/**
 * BubblePopGame - A fun math game where players pop bubbles with correct answers
 */
export default class BubblePopGame {
  /**
   * Create a new BubblePopGame instance
   * @param {string} canvasId - The ID of the canvas element
   */
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    
    // Initialize game variables
    this.bubbles = [];
    this.currentQuestion = {};
    this.score = 0;
    this.message = '';
    this.messageTimer = null;
    this.messageColor = this.getThemeColor('--text-danger') || this.getThemeColor('--text-primary') || '#d9534f'; // Dynamic theme color
    this.lastFrameTime = 0;
    this.gameActive = true;
    
    // Bubble cache for performance
    this.bubbleCache = {};
    
    // Bind methods to preserve 'this' context
    this.handlePointerEvent = this.handlePointerEvent.bind(this);
    this.animate = this.animate.bind(this);
    this.pauseGame = this.pauseGame.bind(this);
    this.resumeGame = this.resumeGame.bind(this);
    this.resizeCanvas = this.resizeCanvas.bind(this);
    this.generateQuestion = this.generateQuestion.bind(this);
    this.spawnBubbles = this.spawnBubbles.bind(this);
    this.nextRound = this.nextRound.bind(this);
    
    // Initialize event listeners and start game
    this.setupEventListeners();
    
    // Listen for theme changes to update bubble cache
    this.setupThemeListener();
  }

  /**
   * Get current theme color from CSS variables
   * @param {string} cssVariable - CSS variable name (e.g., '--primary-color')
   * @returns {string} - Computed color value
   */
  getThemeColor(cssVariable) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(cssVariable)
      .trim() || '#333'; // Fallback color
  }

  /**
   * Set up theme change listener to refresh bubble cache
   */
  setupThemeListener() {
    // Listen for theme changes
    document.addEventListener('themeChanged', () => {
      this.bubbleCache = {}; // Clear cache when theme changes
    });
  }

  /**
   * Set up all event listeners for the game
   */
  setupEventListeners() {
    // Canvas interaction
    this.canvas.addEventListener('click', this.handlePointerEvent);
    this.canvas.addEventListener('touchstart', this.handlePointerEvent, { passive: false });
    
    // Window events
    window.addEventListener('resize', debounce(this.resizeCanvas, 250));
    window.addEventListener('blur', this.pauseGame);
    window.addEventListener('focus', this.resumeGame);
    
    // Document visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseGame();
      } else {
        this.resumeGame();
      }
    });
    
    // Theme changes
    document.addEventListener('themeChanged', () => {
      if (this.gameActive) {
        requestAnimationFrame(this.animate);
      }
    });
    
    // Initial setup
    this.resizeCanvas();
    this.generateQuestion();
    this.spawnBubbles();
    requestAnimationFrame(this.animate);
  }

  /**
   * Responsive canvas sizing
   */
  resizeCanvas() {
    const container = this.canvas.parentElement;
    const oldWidth = this.canvas.width;
    const oldHeight = this.canvas.height;

    this.canvas.width = Math.min(config.games.bubblePop.canvasWidth, container.clientWidth - 20);
    this.canvas.height = config.games.bubblePop.canvasHeight;

    // Adjust bubble positions if canvas size changes
    if (
      this.bubbles.length > 0 &&
      (oldWidth !== this.canvas.width || oldHeight !== this.canvas.height)
    ) {
      const widthRatio = this.canvas.width / oldWidth;
      const heightRatio = this.canvas.height / oldHeight;

      this.bubbles.forEach((bubble) => {
        bubble.x *= widthRatio;
        bubble.y *= heightRatio;
      });
    }
  }

  /**
   * Create a cached bubble background for performance
   * @param {number} radius - The radius of the bubble
   * @returns {HTMLCanvasElement} - The pre-rendered bubble canvas
   */
  createBubbleBackground(radius) {
    const cacheKey = `bubble_${radius}`;

    if (!this.bubbleCache[cacheKey]) {
      const bubbleCanvas = document.createElement('canvas');
      bubbleCanvas.width = radius * 2 + 4; // Add padding for stroke
      bubbleCanvas.height = radius * 2 + 4;
      const bubbleCtx = bubbleCanvas.getContext('2d');

      bubbleCtx.beginPath();
      bubbleCtx.arc(radius + 2, radius + 2, radius, 0, Math.PI * 2);
      bubbleCtx.fillStyle = this.getThemeColor('--secondary-color') || this.getThemeColor('--bg-secondary') || '#a2e8ff';
      bubbleCtx.fill();
      bubbleCtx.strokeStyle = this.getThemeColor('--primary-color') || this.getThemeColor('--bg-primary') || '#008cba';
      bubbleCtx.lineWidth = 2;
      bubbleCtx.stroke();
      bubbleCtx.closePath();

      this.bubbleCache[cacheKey] = bubbleCanvas;
    }

    return this.bubbleCache[cacheKey];
  }

  /**
   * Generate a new math question
   */
  generateQuestion() {
    const a = getRandomInt(1, 10);
    const b = getRandomInt(1, 10);
    this.currentQuestion = {
      text: `${a} + ${b}`,
      answer: a + b,
    };
  }

  /**
   * Create bubbles for current question
   */
  spawnBubbles() {
    this.bubbles = [];
    const correctPos = getRandomInt(0, 3); // Random position for correct answer
    const spacing = this.canvas.width / 5;

    for (let i = 0; i < 4; i++) {
      const radius = 30;
      // Distribute bubbles evenly across canvas width with proper spacing
      const x = spacing * (i + 1);
      const y = this.canvas.height - 40;
      let answer;

      if (i === correctPos) {
        answer = this.currentQuestion.answer;
      } else {
        // Generate unique wrong answers
        do {
          answer = this.currentQuestion.answer + getRandomInt(-5, 5);
        } while (
          answer === this.currentQuestion.answer ||
          answer < 0 ||
          this.bubbles.some((b) => b.answer === answer)
        );
      }

      const isCorrect = answer === this.currentQuestion.answer;
      
      // Create the bubble
      const bubble = new Bubble({
        x, 
        y, 
        radius, 
        answer, 
        isCorrect, 
        bubbleBackground: this.createBubbleBackground(radius),
        ctx: this.ctx
      });
      
      this.bubbles.push(bubble);
    }
  }

  /**
   * Handle pointer events (touch and mouse)
   * @param {Event} e - The pointer event
   */
  handlePointerEvent(e) {
    if (!this.gameActive) return;

    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const scale = this.canvas.width / rect.width; // Handle HiDPI displays

    // Get pointer position (works for both touch and mouse)
    let clickX, clickY;
    if (e.type.startsWith('touch')) {
      clickX = (e.touches[0].clientX - rect.left) * scale;
      clickY = (e.touches[0].clientY - rect.top) * scale;
    } else {
      clickX = (e.clientX - rect.left) * scale;
      clickY = (e.clientY - rect.top) * scale;
    }

    // Check collision with bubbles
    for (let i = 0; i < this.bubbles.length; i++) {
      const bubble = this.bubbles[i];
      if (bubble.containsPoint(clickX, clickY)) {
        if (bubble.isCorrect) {
          this.score++;
          this.showMessage('Correct! Well done!', this.getThemeColor('--accent-color') || this.getThemeColor('--success-color') || '#5cb85c');
          // Clear the bubbles and spawn new ones
          this.nextRound();
        } else {
          this.showMessage('Oops! Try again.', this.getThemeColor('--text-danger') || this.getThemeColor('--text-primary') || '#d9534f');
        }
        break;
      }
    }
  }
  
  /**
   * Display a message on the canvas
   * @param {string} text - Message to display
   * @param {string} color - Color of the message
   */
  showMessage(text, color) {
    this.message = text;
    this.messageColor = color;
    
    // Clear previous message timer if exists
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
    }
    
    // Set new timer to clear message
    this.messageTimer = setTimeout(() => {
      this.message = '';
    }, config.games.bubblePop.messageTimeout);
  }

  /**
   * Start the next round with a new question
   */
  nextRound() {
    this.generateQuestion();
    this.spawnBubbles();
  }

  /**
   * Pause the game
   */
  pauseGame() {
    this.gameActive = false;
  }

  /**
   * Resume the game
   */
  resumeGame() {
    if (!this.gameActive) {
      this.gameActive = true;
      this.lastFrameTime = performance.now();
      requestAnimationFrame(this.animate);
    }
  }

  /**
   * Main game loop
   * @param {number} timestamp - Current timestamp
   */
  animate(timestamp) {
    // Calculate delta time for smooth animation
    const deltaTime = timestamp - (this.lastFrameTime || timestamp);
    this.lastFrameTime = timestamp;

    // Skip frames if tab is inactive
    if (!this.gameActive) {
      requestAnimationFrame(this.animate);
      return;
    }

    // Clear canvas and set background color based on theme
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply theme-based background
    this.ctx.fillStyle = this.getThemeColor('--bg-card') || this.getThemeColor('--bg-body') || '#e0f7fa';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw game UI with shadow effect for better readability
    this.ctx.font = '20px Comic Sans MS, Comic Sans, cursive';
    this.ctx.fillStyle = this.getThemeColor('--text-primary') || this.getThemeColor('--text-color') || '#333';
    this.ctx.textAlign = 'left';
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'; // Or a dedicated shadow variable
    this.ctx.shadowBlur = 4;
    this.ctx.fillText(`Score: ${this.score}`, 10, 35);
    this.ctx.fillText(`Solve: ${this.currentQuestion.text}`, 10, 60);
    this.ctx.shadowBlur = 0;

    // Draw message if present
    if (this.message) {
      this.ctx.font = '24px Comic Sans MS, Comic Sans, cursive';
      this.ctx.fillStyle = this.messageColor;
      this.ctx.textAlign = 'center';
      this.ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
      this.ctx.shadowBlur = 6;
      // Position message in the middle of the canvas
      this.ctx.fillText(this.message, this.canvas.width / 2, this.canvas.height / 2 - 50);
      this.ctx.shadowBlur = 0;
      this.ctx.textAlign = 'left'; // Reset alignment
    }

    // Update bubbles with time-based movement
    let missedCorrect = false;

    this.bubbles.forEach((bubble) => {
      bubble.update(deltaTime);
      // Check if a correct bubble has left the screen
      if (!bubble.active && bubble.isCorrect) {
        missedCorrect = true;
      }
    });

    // Remove inactive bubbles using efficient filter
    this.bubbles = this.bubbles.filter((bubble) => bubble.active);

    // If the correct bubble was missed, show message and start next round
    if (missedCorrect) {
      this.showMessage('Oops! The correct answer got away!', this.getThemeColor('--text-danger') || this.getThemeColor('--text-primary') || '#d9534f');
      this.nextRound();
    }

    requestAnimationFrame(this.animate);
  }
}
