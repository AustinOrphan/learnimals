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
    this.messageColor =
      this.getThemeColor('--text-danger') || this.getThemeColor('--text-primary') || '#d9534f'; // Dynamic theme color
    this.lastFrameTime = 0;
    this.gameActive = true;

    // Bubble cache for performance
    this.bubbleCache = {};

    // Vivid, high-contrast bubble palette. These are deliberately fixed
    // (not theme variables) so every bubble pops against the ocean
    // background in both light and dark modes.
    this.bubbleColors = ['#ff5252', '#ffb300', '#7c4dff', '#00c853', '#00b0ff', '#ff4081'];

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
    return (
      getComputedStyle(document.documentElement).getPropertyValue(cssVariable).trim() || '#333'
    ); // Fallback color
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

      this.bubbles.forEach(bubble => {
        bubble.x *= widthRatio;
        bubble.y *= heightRatio;
      });
    }
  }

  /**
   * Create a cached, glossy bubble background for performance.
   * Uses a fixed, vivid, high-contrast palette so bubbles are clearly visible
   * against the ocean background in both light and dark themes.
   * @param {number} radius - The radius of the bubble
   * @param {string} color - The vivid fill color for this bubble
   * @returns {HTMLCanvasElement} - The pre-rendered bubble canvas
   */
  createBubbleBackground(radius, color) {
    const cacheKey = `bubble_${radius}_${color}`;

    if (!this.bubbleCache[cacheKey]) {
      const pad = 6;
      const bubbleCanvas = document.createElement('canvas');
      bubbleCanvas.width = radius * 2 + pad * 2;
      bubbleCanvas.height = radius * 2 + pad * 2;
      const bubbleCtx = bubbleCanvas.getContext('2d');
      const cx = radius + pad;
      const cy = radius + pad;

      // Glossy radial gradient: bright highlight toward the top-left,
      // deepening to the base color at the edge.
      const gradient = bubbleCtx.createRadialGradient(
        cx - radius * 0.35,
        cy - radius * 0.35,
        radius * 0.1,
        cx,
        cy,
        radius
      );
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.25, color);
      gradient.addColorStop(1, this.shadeColor(color, -0.35));

      bubbleCtx.beginPath();
      bubbleCtx.arc(cx, cy, radius, 0, Math.PI * 2);
      bubbleCtx.fillStyle = gradient;
      bubbleCtx.fill();

      // Bold white outline for crisp separation from the background.
      bubbleCtx.lineWidth = 3;
      bubbleCtx.strokeStyle = '#ffffff';
      bubbleCtx.stroke();
      bubbleCtx.closePath();

      // Small specular highlight for a shiny bubble look.
      bubbleCtx.beginPath();
      bubbleCtx.arc(cx - radius * 0.35, cy - radius * 0.38, radius * 0.22, 0, Math.PI * 2);
      bubbleCtx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      bubbleCtx.fill();
      bubbleCtx.closePath();

      this.bubbleCache[cacheKey] = bubbleCanvas;
    }

    return this.bubbleCache[cacheKey];
  }

  /**
   * Darken (negative amount) or lighten (positive amount) a hex color.
   * @param {string} hex - Color in #rrggbb form
   * @param {number} amount - Fraction from -1 (black) to 1 (white)
   * @returns {string} - Adjusted #rrggbb color
   */
  shadeColor(hex, amount) {
    const normalized = hex.replace('#', '');
    const num = parseInt(normalized, 16);
    let r = (num >> 16) & 0xff;
    let g = (num >> 8) & 0xff;
    let b = num & 0xff;
    const target = amount < 0 ? 0 : 255;
    const t = Math.abs(amount);
    r = Math.round(r + (target - r) * t);
    g = Math.round(g + (target - g) * t);
    b = Math.round(b + (target - b) * t);
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
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
    // Shuffle the palette so bubble colors vary each round while staying distinct.
    const colors = [...this.bubbleColors].sort(() => Math.random() - 0.5);

    for (let i = 0; i < 4; i++) {
      const radius = 42;
      // Distribute bubbles evenly across canvas width with proper spacing.
      const x = spacing * (i + 1);
      // Place the bubbles in the middle of the play area (below the score/question
      // header) so they are always fully within the visible canvas.
      const y = this.canvas.height * 0.5;
      const color = colors[i];
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
          this.bubbles.some(b => b.answer === answer)
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
        color,
        bubbleBackground: this.createBubbleBackground(radius, color),
        ctx: this.ctx,
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
          this.showMessage(
            'Correct! Well done!',
            this.getThemeColor('--accent-color') ||
              this.getThemeColor('--success-color') ||
              '#5cb85c'
          );
          // Clear the bubbles and spawn new ones
          this.nextRound();
        } else {
          this.showMessage(
            'Oops! Try again.',
            this.getThemeColor('--text-danger') || this.getThemeColor('--text-primary') || '#d9534f'
          );
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

    // Clear canvas and paint a SOLID, opaque ocean background. This is a fixed
    // gradient (not a semi-transparent theme variable) so the alpha:false canvas
    // never renders as muddy gray, and it stays high-contrast in light and dark.
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const bg = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    bg.addColorStop(0, '#4facfe');
    bg.addColorStop(1, '#0a4d8c');
    this.ctx.fillStyle = bg;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw game UI in bold white with a dark shadow for readability on the ocean.
    this.ctx.font = 'bold 22px Comic Sans MS, Comic Sans, cursive';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'left';
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    this.ctx.shadowBlur = 4;
    this.ctx.fillText(`Score: ${this.score}`, 12, 32);
    this.ctx.fillText(`Solve: ${this.currentQuestion.text}`, 12, 62);
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

    this.bubbles.forEach(bubble => {
      bubble.update(deltaTime);
      // Render the bubble every frame (this was previously missing, so bubbles
      // were never drawn at all).
      bubble.draw();
      // Check if a correct bubble has left the screen
      if (!bubble.active && bubble.isCorrect) {
        missedCorrect = true;
      }
    });

    // Remove inactive bubbles using efficient filter
    this.bubbles = this.bubbles.filter(bubble => bubble.active);

    // If the correct bubble was missed, show message and start next round
    if (missedCorrect) {
      this.showMessage(
        'Oops! The correct answer got away!',
        this.getThemeColor('--text-danger') || this.getThemeColor('--text-primary') || '#d9534f'
      );
      this.nextRound();
    }

    requestAnimationFrame(this.animate);
  }
}
