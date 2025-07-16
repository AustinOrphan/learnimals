// filepath: src/features/games/pizza-party/pizzaParty.js
import { getRandomInt, debounce, lightenColor, darkenColor, compareFractions, addFractions } from '../../../utils/common.js';
import PizzaSlice from './PizzaSlice.js';
import ParticleSystem from './ParticleSystem.js';

/**
 * PizzaPartyGame - A delightful fraction game where players create pizzas by combining slices
 * Features:
 * - Visual fraction learning through pizza slices
 * - Engaging drag-and-drop mechanics
 * - Beautiful animations and particle effects
 * - Progressive difficulty with achievements
 * - Sound effects and visual feedback
 */
export default class PizzaPartyGame {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    
    // Game configuration
    this.config = {
      pizza: {
        radius: 120,
        centerX: 0, // Will be set in resize
        centerY: 0, // Will be set in resize
        crustWidth: 15,
        shadowBlur: 20
      },
      animation: {
        duration: 600,
        easing: 'easeOutElastic',
        particleCount: 30,
        sparkleRate: 0.05
      },
      gameplay: {
        maxLevel: 20,
        timeBonus: true,
        perfectBonus: 500,
        comboMultiplier: 1.5
      },
      sounds: {
        enabled: options.soundEnabled !== false,
        volume: 0.6
      }
    };
    
    // Game state
    this.gameState = {
      currentLevel: 1,
      score: 0,
      lives: 3,
      combo: 0,
      targetFraction: { numerator: 1, denominator: 2 },
      placedSlices: [],
      availableSlices: [],
      isAnimating: false,
      gameActive: true,
      timeStarted: Date.now(),
      perfectStreak: 0
    };
    
    // Visual elements
    this.pizzaBase = null;
    this.toppings = [];
    this.particles = new ParticleSystem(this.ctx);
    this.animations = [];
    
    // UI elements
    this.uiElements = {
      fractionDisplay: null,
      scoreDisplay: null,
      levelDisplay: null,
      messageArea: null,
      hintButton: null
    };
    
    // Performance optimization
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.fps = 60;
    
    // Event listeners tracking for cleanup
    this.documentListeners = [];
    
    // Bind methods
    this.bindMethods();
    
    // Initialize game
    this.initializeGame();
  }
  
  bindMethods() {
    this.animate = this.animate.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.resizeCanvas = this.resizeCanvas.bind(this);
    this.generateLevel = this.generateLevel.bind(this);
    this.checkSolution = this.checkSolution.bind(this);
    this.nextLevel = this.nextLevel.bind(this);
    this.showHint = this.showHint.bind(this);
  }
  
  async initializeGame() {
    this.setupCanvas();
    this.setupEventListeners();
    this.createUIElements();
    await this.loadAssets();
    this.generateLevel();
    this.animate();
    
    // Show welcome animation
    this.showWelcomeAnimation();
  }
  
  setupCanvas() {
    this.resizeCanvas();
    
    // Enable high DPI support
    const devicePixelRatio = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    this.canvas.width = rect.width * devicePixelRatio;
    this.canvas.height = rect.height * devicePixelRatio;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    
    this.ctx.scale(devicePixelRatio, devicePixelRatio);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }
  
  setupEventListeners() {
    // Touch and mouse events
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointercancel', this.handlePointerUp);
    
    // Resize handling
    window.addEventListener('resize', debounce(this.resizeCanvas, 200));
    
    // Keyboard shortcuts
    const keydownHandler = (e) => {
      switch(e.key) {
      case 'h':
      case 'H':
        this.showHint();
        break;
      case 'r':
      case 'R':
        this.resetLevel();
        break;
      case ' ':
        e.preventDefault();
        this.gameState.gameActive ? this.pauseGame() : this.resumeGame();
        break;
      }
    };
    document.addEventListener('keydown', keydownHandler);
    this.documentListeners.push({ type: 'keydown', handler: keydownHandler });
  }
  
  createUIElements() {
    const gameContainer = this.canvas.parentElement;
    
    // Create HUD overlay
    const hudOverlay = document.createElement('div');
    hudOverlay.className = 'pizza-game-hud';
    hudOverlay.innerHTML = `
      <div class="hud-top">
        <div class="score-display">
          <span class="score-label">Score</span>
          <span class="score-value">0</span>
        </div>
        <div class="level-display">
          <span class="level-label">Level</span>
          <span class="level-value">1</span>
        </div>
        <div class="lives-display">
          <span class="lives-label">Lives</span>
          <div class="lives-hearts">
            <span class="heart">❤️</span>
            <span class="heart">❤️</span>
            <span class="heart">❤️</span>
          </div>
        </div>
      </div>
      
      <div class="hud-center">
        <div class="fraction-challenge">
          <div class="challenge-text">Create this fraction:</div>
          <div class="fraction-display">
            <span class="numerator">1</span>
            <span class="fraction-line"></span>
            <span class="denominator">2</span>
          </div>
        </div>
      </div>
      
      <div class="hud-bottom">
        <button class="game-btn hint-btn" title="Show Hint (H)">
          <span class="btn-icon">💡</span>
          <span class="btn-text">Hint</span>
        </button>
        <button class="game-btn reset-btn" title="Reset Level (R)">
          <span class="btn-icon">🔄</span>
          <span class="btn-text">Reset</span>
        </button>
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
      </div>
      
      <div class="message-area"></div>
    `;
    
    gameContainer.appendChild(hudOverlay);
    
    // Store references
    this.uiElements = {
      fractionDisplay: hudOverlay.querySelector('.fraction-display'),
      scoreDisplay: hudOverlay.querySelector('.score-value'),
      levelDisplay: hudOverlay.querySelector('.level-value'),
      livesDisplay: hudOverlay.querySelector('.lives-hearts'),
      messageArea: hudOverlay.querySelector('.message-area'),
      hintButton: hudOverlay.querySelector('.hint-btn'),
      resetButton: hudOverlay.querySelector('.reset-btn'),
      progressBar: hudOverlay.querySelector('.progress-fill')
    };
    
    // Bind UI events
    this.uiElements.hintButton.addEventListener('click', this.showHint);
    this.uiElements.resetButton.addEventListener('click', () => this.resetLevel());
  }
  
  async loadAssets() {
    // Create pizza base texture
    this.pizzaBase = await this.createPizzaBaseTexture();
    
    // Load sound effects (if enabled)
    if (this.config.sounds.enabled) {
      this.sounds = await this.loadSounds();
    }
  }
  
  async createPizzaBaseTexture() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = this.config.pizza.radius * 2 + 40;
    
    canvas.width = size;
    canvas.height = size;
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = this.config.pizza.radius;
    
    // Create gradient for pizza base
    const gradient = ctx.createRadialGradient(
      centerX - radius * 0.3, centerY - radius * 0.3, 0,
      centerX, centerY, radius
    );
    gradient.addColorStop(0, '#FFF8DC'); // Cream
    gradient.addColorStop(0.7, '#F4A460'); // Sandy brown
    gradient.addColorStop(1, '#D2691E'); // Chocolate
    
    // Draw pizza base with shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = this.config.pizza.shadowBlur;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw crust
    ctx.restore();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.lineWidth = this.config.pizza.crustWidth;
    ctx.strokeStyle = '#8B4513'; // Saddle brown
    ctx.stroke();
    
    // Add texture
    this.addPizzaTexture(ctx, centerX, centerY, radius);
    
    return canvas;
  }
  
  addPizzaTexture(ctx, centerX, centerY, radius) {
    // Add subtle texture dots
    ctx.fillStyle = 'rgba(139, 69, 19, 0.2)';
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * (radius - 20);
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      ctx.beginPath();
      ctx.arc(x, y, Math.random() * 2 + 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  async loadSounds() {
    // Create audio context for sound effects
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    return {
      place: this.createSound(audioContext, 'place'),
      success: this.createSound(audioContext, 'success'),
      error: this.createSound(audioContext, 'error'),
      levelComplete: this.createSound(audioContext, 'levelComplete'),
      combo: this.createSound(audioContext, 'combo')
    };
  }
  
  createSound(audioContext, type) {
    // Create procedural sounds using Web Audio API
    return {
      play: () => {
        if (!this.config.sounds.enabled) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        const now = audioContext.currentTime;
        
        switch(type) {
        case 'place':
          oscillator.frequency.setValueAtTime(800, now);
          oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1);
          gainNode.gain.setValueAtTime(0.3, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          oscillator.start(now);
          oscillator.stop(now + 0.1);
          break;
        
        case 'success':
          oscillator.frequency.setValueAtTime(523, now); // C5
          oscillator.frequency.setValueAtTime(659, now + 0.1); // E5
          oscillator.frequency.setValueAtTime(784, now + 0.2); // G5
          gainNode.gain.setValueAtTime(0.4, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          oscillator.start(now);
          oscillator.stop(now + 0.3);
          break;
        
        case 'error':
          oscillator.frequency.setValueAtTime(200, now);
          oscillator.frequency.exponentialRampToValueAtTime(150, now + 0.2);
          gainNode.gain.setValueAtTime(0.4, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          oscillator.start(now);
          oscillator.stop(now + 0.2);
          break;
        }
      }
    };
  }
  
  generateLevel() {
    const level = this.gameState.currentLevel;
    
    // Progressive difficulty
    let maxDenominator;
    if (level <= 3) maxDenominator = 4;
    else if (level <= 6) maxDenominator = 6;
    else if (level <= 10) maxDenominator = 8;
    else if (level <= 15) maxDenominator = 12;
    else maxDenominator = 16;
    
    // Generate target fraction
    const denominator = getRandomInt(2, maxDenominator + 1);
    const numerator = getRandomInt(1, denominator);
    
    this.gameState.targetFraction = { numerator, denominator };
    
    // Generate available slices
    this.generateAvailableSlices();
    
    // Reset game state
    this.gameState.placedSlices = [];
    this.gameState.isAnimating = false;
    this.gameState.timeStarted = Date.now();
    
    // Update UI
    this.updateFractionDisplay();
    this.updateProgressBar();
    
    // Show level start animation
    this.showLevelStartAnimation();
  }
  
  generateAvailableSlices() {
    const { denominator } = this.gameState.targetFraction;
    const slices = [];
    
    // Add various slice sizes that can combine to make the target
    const possibleDenominators = [];
    
    // Add the target denominator
    possibleDenominators.push(denominator);
    
    // Add factors of the denominator
    for (let i = 2; i <= denominator / 2; i++) {
      if (denominator % i === 0) {
        possibleDenominators.push(i);
      }
    }
    
    // Add multiples of the denominator (for challenge)
    if (denominator * 2 <= 16) {
      possibleDenominators.push(denominator * 2);
    }
    
    // Generate slices
    possibleDenominators.forEach(denom => {
      for (let num = 1; num < denom; num++) {
        if (slices.length < 8) { // Limit to 8 slices
          slices.push(new PizzaSlice({
            numerator: num,
            denominator: denom,
            color: this.getSliceColor(denom),
            topping: this.getRandomTopping()
          }));
        }
      }
    });
    
    // Shuffle and position slices
    this.gameState.availableSlices = this.shuffleArray(slices);
    this.positionAvailableSlices();
  }
  
  getSliceColor(denominator) {
    const colors = {
      2: '#FF6B6B', // Red
      3: '#4ECDC4', // Teal
      4: '#45B7D1', // Blue
      6: '#96CEB4', // Mint
      8: '#FECA57', // Yellow
      12: '#FF9FF3', // Pink
      16: '#54A0FF'  // Light blue
    };
    return colors[denominator] || '#95A5A6';
  }
  
  getRandomTopping() {
    const toppings = [
      '🍄', '🧀', '🍅', '🫒', '🥓', '🌶️', '🧄', '🧅'
    ];
    return toppings[getRandomInt(0, toppings.length)];
  }
  
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  positionAvailableSlices() {
    const sliceAreaY = this.canvas.height * 0.75;
    const sliceAreaHeight = this.canvas.height * 0.2;
    const sliceSize = 60;
    const spacing = (this.canvas.width - sliceSize * this.gameState.availableSlices.length) / 
                    (this.gameState.availableSlices.length + 1);
    
    this.gameState.availableSlices.forEach((slice, index) => {
      slice.x = spacing + (sliceSize + spacing) * index + sliceSize / 2;
      slice.y = sliceAreaY + sliceAreaHeight / 2;
      slice.size = sliceSize;
      slice.originalPosition = { x: slice.x, y: slice.y };
    });
  }
  
  resizeCanvas() {
    const container = this.canvas.parentElement;
    const rect = container.getBoundingClientRect();
    
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    
    // Update pizza center position
    this.config.pizza.centerX = this.canvas.width / 2;
    this.config.pizza.centerY = this.canvas.height * 0.4;
    
    // Reposition available slices
    if (this.gameState.availableSlices) {
      this.positionAvailableSlices();
    }
  }
  
  animate(currentTime = 0) {
    if (!this.gameState.gameActive) {
      requestAnimationFrame(this.animate);
      return;
    }
    
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw background
    this.drawBackground();
    
    // Draw pizza base
    this.drawPizzaBase();
    
    // Draw placed slices
    this.drawPlacedSlices();
    
    // Draw available slices
    this.drawAvailableSlices();
    
    // Update and draw particles
    this.particles.update(deltaTime);
    this.particles.draw();
    
    // Update animations
    this.updateAnimations(deltaTime);
    
    // Draw UI overlays
    this.drawUIOverlays();
    
    requestAnimationFrame(this.animate);
  }
  
  drawBackground() {
    // Use CSS-defined gradient colors from CSS custom properties
    
    // Create gradient using CSS custom properties
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#FFE4E1'); // Misty rose
    gradient.addColorStop(0.5, '#FFF8DC'); // Cornsilk  
    gradient.addColorStop(1, '#F0E68C'); // Khaki
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Add subtle pattern
    this.drawBackgroundPattern();
  }
  
  drawBackgroundPattern() {
    this.ctx.save();
    this.ctx.globalAlpha = 0.1;
    this.ctx.fillStyle = '#DDD';
    
    const patternSize = 40;
    for (let x = 0; x < this.canvas.width; x += patternSize) {
      for (let y = 0; y < this.canvas.height; y += patternSize) {
        if ((x / patternSize + y / patternSize) % 2 === 0) {
          this.ctx.fillRect(x, y, patternSize, patternSize);
        }
      }
    }
    
    this.ctx.restore();
  }
  
  drawPizzaBase() {
    if (!this.pizzaBase) return;
    
    const x = this.config.pizza.centerX - this.config.pizza.radius - 20;
    const y = this.config.pizza.centerY - this.config.pizza.radius - 20;
    
    this.ctx.drawImage(this.pizzaBase, x, y);
    
    // Draw pizza plate
    this.drawPizzaPlate();
  }
  
  drawPizzaPlate() {
    const centerX = this.config.pizza.centerX;
    const centerY = this.config.pizza.centerY;
    const plateRadius = this.config.pizza.radius + 30;
    
    // Plate shadow
    this.ctx.save();
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    this.ctx.shadowBlur = 15;
    this.ctx.shadowOffsetY = 8;
    
    // Plate
    const plateGradient = this.ctx.createRadialGradient(
      centerX - 20, centerY - 20, 0,
      centerX, centerY, plateRadius
    );
    plateGradient.addColorStop(0, '#FFFFFF');
    plateGradient.addColorStop(0.8, '#F5F5F5');
    plateGradient.addColorStop(1, '#E0E0E0');
    
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, plateRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = plateGradient;
    this.ctx.fill();
    
    // Plate rim
    this.ctx.restore();
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, plateRadius, 0, Math.PI * 2);
    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = '#D0D0D0';
    this.ctx.stroke();
  }
  
  drawPlacedSlices() {
    this.gameState.placedSlices.forEach(slice => {
      this.drawPizzaSlice(slice);
    });
  }
  
  drawAvailableSlices() {
    this.gameState.availableSlices.forEach(slice => {
      this.drawPizzaSlice(slice);
    });
  }
  
  drawPizzaSlice(slice) {
    if (!slice.visible) return;
    
    const ctx = this.ctx;
    const centerX = slice.isPlaced ? this.config.pizza.centerX : slice.x;
    const centerY = slice.isPlaced ? this.config.pizza.centerY : slice.y;
    const radius = slice.isPlaced ? this.config.pizza.radius : slice.size / 2;
    
    ctx.save();
    
    // Apply transformations for animations
    if (slice.rotation) {
      ctx.translate(centerX, centerY);
      ctx.rotate(slice.rotation);
      ctx.translate(-centerX, -centerY);
    }
    
    if (slice.scale) {
      ctx.translate(centerX, centerY);
      ctx.scale(slice.scale, slice.scale);
      ctx.translate(-centerX, -centerY);
    }
    
    // Calculate slice angle
    const sliceAngle = (Math.PI * 2) / slice.denominator;
    const startAngle = slice.startAngle || 0;
    const endAngle = startAngle + sliceAngle * slice.numerator;
    
    // Draw slice shadow
    if (slice.isHovered || slice.isDragging) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;
    }
    
    // Draw slice
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    
    // Fill with gradient
    const gradient = ctx.createRadialGradient(
      centerX - radius * 0.3, centerY - radius * 0.3, 0,
      centerX, centerY, radius
    );
    gradient.addColorStop(0, lightenColor(slice.color, 20));
    gradient.addColorStop(1, slice.color);
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw slice border
    ctx.strokeStyle = darkenColor(slice.color, 20);
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw topping
    if (slice.topping) {
      this.drawTopping(ctx, centerX, centerY, radius, startAngle, endAngle, slice.topping);
    }
    
    // Draw fraction label if not placed
    if (!slice.isPlaced) {
      this.drawFractionLabel(ctx, centerX, centerY + radius + 20, slice);
    }
    
    ctx.restore();
  }
  
  drawTopping(ctx, centerX, centerY, radius, startAngle, endAngle, topping) {
    const midAngle = (startAngle + endAngle) / 2;
    const toppingRadius = radius * 0.6;
    const toppingX = centerX + Math.cos(midAngle) * toppingRadius * 0.5;
    const toppingY = centerY + Math.sin(midAngle) * toppingRadius * 0.5;
    
    ctx.font = `${radius * 0.3}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(topping, toppingX, toppingY);
  }
  
  drawFractionLabel(ctx, x, y, slice) {
    ctx.save();
    
    // Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(x - 25, y - 15, 50, 30);
    
    // Border
    ctx.strokeStyle = slice.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 25, y - 15, 50, 30);
    
    // Fraction text
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const fractionText = `${slice.numerator}/${slice.denominator}`;
    ctx.fillText(fractionText, x, y);
    
    ctx.restore();
  }
  
  
  drawUIOverlays() {
    // Draw target fraction visualization on pizza
    this.drawTargetVisualization();
    
    // Draw completion percentage
    this.drawCompletionIndicator();
  }
  
  drawTargetVisualization() {
    const { numerator, denominator } = this.gameState.targetFraction;
    const centerX = this.config.pizza.centerX;
    const centerY = this.config.pizza.centerY;
    const radius = this.config.pizza.radius + 40;
    
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    
    // Draw target sections
    const sectionAngle = (Math.PI * 2) / denominator;
    for (let i = 0; i < numerator; i++) {
      const startAngle = i * sectionAngle;
      const endAngle = (i + 1) * sectionAngle;
      
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }
  
  drawCompletionIndicator() {
    const currentValue = this.getCurrentFractionValue();
    const targetValue = this.gameState.targetFraction.numerator / this.gameState.targetFraction.denominator;
    const completion = Math.min(currentValue / targetValue, 1);
    
    // Draw progress arc around pizza
    const centerX = this.config.pizza.centerX;
    const centerY = this.config.pizza.centerY;
    const radius = this.config.pizza.radius + 50;
    
    this.ctx.save();
    
    // Background arc
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.lineWidth = 6;
    this.ctx.stroke();
    
    // Progress arc
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * completion);
    this.ctx.strokeStyle = completion >= 1 ? '#4CAF50' : '#2196F3';
    this.ctx.lineWidth = 6;
    this.ctx.stroke();
    
    this.ctx.restore();
  }
  
  getCurrentFractionValue() {
    return this.gameState.placedSlices.reduce((sum, slice) => {
      return sum + (slice.numerator / slice.denominator);
    }, 0);
  }
  
  getCurrentFractionAsInteger() {
    // Calculate the sum of fractions using integer arithmetic
    if (this.gameState.placedSlices.length === 0) {
      return { numerator: 0, denominator: 1 };
    }
    
    // Start with the first slice
    let result = {
      numerator: this.gameState.placedSlices[0].numerator,
      denominator: this.gameState.placedSlices[0].denominator
    };
    
    // Add each subsequent slice
    for (let i = 1; i < this.gameState.placedSlices.length; i++) {
      const slice = this.gameState.placedSlices[i];
      result = addFractions(result.numerator, result.denominator, slice.numerator, slice.denominator);
    }
    
    return result;
  }
  
  updateAnimations(deltaTime) {
    this.animations = this.animations.filter(animation => {
      animation.progress += deltaTime / animation.duration;
      
      if (animation.progress >= 1) {
        animation.progress = 1;
        if (animation.onComplete) {
          animation.onComplete();
        }
        return false;
      }
      
      // Apply easing
      const easedProgress = this.easeOutElastic(animation.progress);
      
      // Update animation target
      if (animation.target && animation.properties) {
        Object.keys(animation.properties).forEach(prop => {
          const start = animation.properties[prop].start;
          const end = animation.properties[prop].end;
          animation.target[prop] = start + (end - start) * easedProgress;
        });
      }
      
      return true;
    });
  }
  
  easeOutElastic(t) {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
  
  // Event handlers
  handlePointerDown(event) {
    if (this.gameState.isAnimating) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if clicking on available slice
    const clickedSlice = this.gameState.availableSlices.find(slice => {
      const distance = Math.sqrt(
        Math.pow(x - slice.x, 2) + Math.pow(y - slice.y, 2)
      );
      return distance <= slice.size / 2;
    });
    
    if (clickedSlice) {
      this.startDragging(clickedSlice, x, y);
    }
  }
  
  handlePointerMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    if (this.draggedSlice) {
      this.draggedSlice.x = x;
      this.draggedSlice.y = y;
      
      // Check if over pizza area
      const distanceToCenter = Math.sqrt(
        Math.pow(x - this.config.pizza.centerX, 2) + 
        Math.pow(y - this.config.pizza.centerY, 2)
      );
      
      this.draggedSlice.isOverPizza = distanceToCenter <= this.config.pizza.radius;
    } else {
      // Update hover states
      this.updateHoverStates(x, y);
    }
  }
  
  handlePointerUp() {
    if (this.draggedSlice) {
      this.handleSliceDrop();
    }
  }
  
  startDragging(slice) {
    this.draggedSlice = slice;
    this.draggedSlice.isDragging = true;
    this.draggedSlice.scale = 1.1;
    
    // Play sound
    if (this.sounds) {
      this.sounds.place.play();
    }
    
    // Add lift animation
    this.addAnimation({
      target: slice,
      duration: 200,
      properties: {
        y: { start: slice.y, end: slice.y - 10 },
        scale: { start: 1, end: 1.1 }
      }
    });
  }
  
  handleSliceDrop() {
    const slice = this.draggedSlice;
    
    if (slice.isOverPizza) {
      this.placeSliceOnPizza(slice);
    } else {
      this.returnSliceToOriginalPosition(slice);
    }
    
    slice.isDragging = false;
    this.draggedSlice = null;
  }
  
  placeSliceOnPizza(slice) {
    // Calculate where to place the slice based on cumulative fraction value
    const cumulativeFraction = this.getCurrentFractionValue();
    const fullCircle = Math.PI * 2;
    
    slice.startAngle = cumulativeFraction * fullCircle;
    slice.isPlaced = true;
    slice.scale = 1;
    
    // Remove from available slices
    this.gameState.availableSlices = this.gameState.availableSlices.filter(s => s !== slice);
    this.gameState.placedSlices.push(slice);
    
    // Animate slice to pizza
    this.addAnimation({
      target: slice,
      duration: 600,
      properties: {
        x: { start: slice.x, end: this.config.pizza.centerX },
        y: { start: slice.y, end: this.config.pizza.centerY },
        scale: { start: slice.scale, end: 1 }
      },
      onComplete: () => {
        this.checkSolution();
      }
    });
    
    // Add particle effect
    this.particles.addBurst(slice.x, slice.y, slice.color);
    
    // Play sound
    if (this.sounds) {
      this.sounds.place.play();
    }
  }
  
  returnSliceToOriginalPosition(slice) {
    const originalPos = slice.originalPosition;
    
    this.addAnimation({
      target: slice,
      duration: 400,
      properties: {
        x: { start: slice.x, end: originalPos.x },
        y: { start: slice.y, end: originalPos.y },
        scale: { start: slice.scale, end: 1 }
      }
    });
  }
  
  updateHoverStates(x, y) {
    this.gameState.availableSlices.forEach(slice => {
      const distance = Math.sqrt(
        Math.pow(x - slice.x, 2) + Math.pow(y - slice.y, 2)
      );
      slice.isHovered = distance <= slice.size / 2;
    });
  }
  
  checkSolution() {
    // Calculate current fraction as integer arithmetic to avoid floating point errors
    const currentFraction = this.getCurrentFractionAsInteger();
    const targetFraction = this.gameState.targetFraction;
    
    // Use integer comparison to avoid floating point precision issues
    if (compareFractions(currentFraction.numerator, currentFraction.denominator,
      targetFraction.numerator, targetFraction.denominator)) {
      this.handleCorrectSolution();
    } else {
      // Check if current value exceeds target using cross multiplication
      if (currentFraction.numerator * targetFraction.denominator > 
          targetFraction.numerator * currentFraction.denominator) {
        this.handleIncorrectSolution();
      }
    }
    // If currentValue < targetValue, continue playing
  }
  
  handleCorrectSolution() {
    this.gameState.isAnimating = true;
    
    // Calculate score
    const timeBonus = this.calculateTimeBonus();
    const comboBonus = this.gameState.combo * 100;
    // Perfect bonus awarded for achieving target with optimal efficiency (minimal slices or exact target match)
    const perfectBonus = this.calculatePerfectBonus();
    
    const levelScore = 1000 + timeBonus + comboBonus + perfectBonus;
    this.gameState.score += levelScore;
    this.gameState.combo++;
    this.gameState.perfectStreak++;
    
    // Update UI
    this.updateScoreDisplay();
    this.showMessage(`Perfect! +${levelScore} points`, 'success');
    
    // Play success sound
    if (this.sounds) {
      this.sounds.success.play();
    }
    
    // Success animation
    this.showSuccessAnimation();
    
    // Next level after delay
    setTimeout(() => {
      this.nextLevel();
    }, 2000);
  }
  
  handleIncorrectSolution() {
    this.gameState.lives--;
    this.gameState.combo = 0;
    this.gameState.perfectStreak = 0;
    
    // Update UI
    this.updateLivesDisplay();
    this.showMessage('Too much pizza! Try removing some slices.', 'error');
    
    // Play error sound
    if (this.sounds) {
      this.sounds.error.play();
    }
    
    // Shake animation
    this.addShakeAnimation();
    
    // Check game over
    if (this.gameState.lives <= 0) {
      this.handleGameOver();
    }
  }
  
  calculateTimeBonus() {
    const timeElapsed = (Date.now() - this.gameState.timeStarted) / 1000;
    const maxTime = 30; // 30 seconds for full bonus
    const bonus = Math.max(0, Math.floor((maxTime - timeElapsed) * 10));
    return bonus;
  }
  
  calculatePerfectBonus() {
    const target = this.gameState.targetFraction;
    const placedSlices = this.gameState.placedSlices.length;
    
    // Perfect bonus criteria:
    // 1. Single slice that exactly matches target (e.g., 1/2 slice for 1/2 target)
    // 2. Minimum number of slices possible to achieve target
    // 3. Using only necessary denominators (no overcomplicated solutions)
    
    if (placedSlices === 1 && 
        this.gameState.placedSlices[0].numerator === target.numerator && 
        this.gameState.placedSlices[0].denominator === target.denominator) {
      // Single exact match slice
      return this.config.gameplay.perfectBonus;
    }
    
    if (placedSlices <= target.numerator) {
      // Achieved with minimal slices
      return Math.floor(this.config.gameplay.perfectBonus * 0.5);
    }
    
    // No perfect bonus
    return 0;
  }
  
  nextLevel() {
    this.gameState.currentLevel++;
    this.gameState.isAnimating = false;
    
    this.updateLevelDisplay();
    this.generateLevel();
    
    // Check for milestone achievements
    this.checkAchievements();
  }
  
  checkAchievements() {
    const level = this.gameState.currentLevel;
    const streak = this.gameState.perfectStreak;
    
    if (level === 5) {
      this.showAchievement('Pizza Apprentice', 'Completed 5 levels!');
    } else if (level === 10) {
      this.showAchievement('Pizza Master', 'Completed 10 levels!');
    } else if (streak === 5) {
      this.showAchievement('Perfect Streak', '5 perfect solutions in a row!');
    }
  }
  
  showAchievement(title, description) {
    // TODO: Implement achievement popup
    console.log(`Achievement Unlocked: ${title} - ${description}`);
  }
  
  addAnimation(animation) {
    this.animations.push({
      progress: 0,
      duration: animation.duration || 600,
      target: animation.target,
      properties: animation.properties,
      onComplete: animation.onComplete
    });
  }
  
  addShakeAnimation() {
    const originalX = this.config.pizza.centerX;
    const originalY = this.config.pizza.centerY;
    const intensity = 10;
    const duration = 500;
    
    let shakeTime = 0;
    const shakeInterval = setInterval(() => {
      this.config.pizza.centerX = originalX + (Math.random() - 0.5) * intensity;
      this.config.pizza.centerY = originalY + (Math.random() - 0.5) * intensity;
      
      shakeTime += 50;
      if (shakeTime >= duration) {
        clearInterval(shakeInterval);
        this.config.pizza.centerX = originalX;
        this.config.pizza.centerY = originalY;
      }
    }, 50);
  }
  
  showSuccessAnimation() {
    // Confetti particles
    this.particles.addConfetti(
      this.config.pizza.centerX,
      this.config.pizza.centerY,
      30
    );
    
    // Pizza celebration animation
    this.gameState.placedSlices.forEach((slice, index) => {
      setTimeout(() => {
        this.addAnimation({
          target: slice,
          duration: 400,
          properties: {
            scale: { start: 1, end: 1.2 },
            rotation: { start: slice.rotation || 0, end: (slice.rotation || 0) + Math.PI / 4 }
          }
        });
      }, index * 100);
    });
  }
  
  showWelcomeAnimation() {
    this.showMessage('Create the target fraction by dragging pizza slices!', 'info', 3000);
    
    // Animate available slices appearing
    this.gameState.availableSlices.forEach((slice, index) => {
      slice.y += 100;
      slice.scale = 0;
      
      setTimeout(() => {
        this.addAnimation({
          target: slice,
          duration: 600,
          properties: {
            y: { start: slice.y, end: slice.originalPosition.y },
            scale: { start: 0, end: 1 }
          }
        });
      }, index * 100);
    });
  }
  
  showLevelStartAnimation() {
    // Animate new target fraction
    const fractionDisplay = this.uiElements.fractionDisplay;
    if (fractionDisplay) {
      fractionDisplay.style.transform = 'scale(1.3)';
      fractionDisplay.style.transition = 'transform 0.3s ease';
      
      setTimeout(() => {
        fractionDisplay.style.transform = 'scale(1)';
      }, 300);
    }
  }
  
  showMessage(text, _type = 'info', duration = 2000) {
    const messageArea = this.uiElements.messageArea;
    if (!messageArea) return;
    
    messageArea.textContent = text;
    messageArea.className = `message-area ${type}`;
    messageArea.style.opacity = '1';
    
    setTimeout(() => {
      messageArea.style.opacity = '0';
    }, duration);
  }
  
  updateFractionDisplay() {
    const fractionDisplay = this.uiElements.fractionDisplay;
    if (!fractionDisplay) return;
    
    const numerator = fractionDisplay.querySelector('.numerator');
    const denominator = fractionDisplay.querySelector('.denominator');
    
    if (numerator) numerator.textContent = this.gameState.targetFraction.numerator;
    if (denominator) denominator.textContent = this.gameState.targetFraction.denominator;
  }
  
  updateScoreDisplay() {
    if (this.uiElements.scoreDisplay) {
      this.uiElements.scoreDisplay.textContent = this.gameState.score.toLocaleString();
    }
  }
  
  updateLevelDisplay() {
    if (this.uiElements.levelDisplay) {
      this.uiElements.levelDisplay.textContent = this.gameState.currentLevel;
    }
  }
  
  updateLivesDisplay() {
    const livesDisplay = this.uiElements.livesDisplay;
    if (!livesDisplay) return;
    
    const hearts = livesDisplay.querySelectorAll('.heart');
    hearts.forEach((heart, index) => {
      heart.style.opacity = index < this.gameState.lives ? '1' : '0.3';
    });
  }
  
  updateProgressBar() {
    const progressBar = this.uiElements.progressBar;
    if (!progressBar) return;
    
    const progress = (this.gameState.currentLevel - 1) / this.config.gameplay.maxLevel;
    progressBar.style.width = `${progress * 100}%`;
  }
  
  showHint() {
    const target = this.gameState.targetFraction;
    const hints = [
      `You need ${target.numerator} slice(s) from a pizza divided into ${target.denominator} pieces.`,
      `Look for slices that add up to ${target.numerator}/${target.denominator}.`,
      `Try combining different slice sizes to make ${target.numerator}/${target.denominator}.`
    ];
    
    const randomHint = hints[getRandomInt(0, hints.length)];
    this.showMessage(randomHint, 'info', 4000);
  }
  
  resetLevel() {
    // Return all placed slices to available
    this.gameState.placedSlices.forEach(slice => {
      slice.isPlaced = false;
      slice.x = slice.originalPosition.x;
      slice.y = slice.originalPosition.y;
      slice.scale = 1;
      slice.rotation = 0;
      this.gameState.availableSlices.push(slice);
    });
    
    this.gameState.placedSlices = [];
    this.gameState.isAnimating = false;
    this.gameState.timeStarted = Date.now();
    
    this.showMessage('Level reset!', 'info');
  }
  
  pauseGame() {
    this.gameState.gameActive = false;
    this.showMessage('Game Paused - Press Space to Resume', 'info');
  }
  
  resumeGame() {
    this.gameState.gameActive = true;
    this.showMessage('Game Resumed!', 'info', 1000);
  }
  
  handleGameOver() {
    this.gameState.gameActive = false;
    this.showMessage(`Game Over! Final Score: ${this.gameState.score}`, 'error', 5000);
    
    // TODO: Show game over screen with restart option
  }
  
  destroy() {
    // Clean up event listeners
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
    
    window.removeEventListener('resize', this.resizeCanvas);
    
    // Clean up document event listeners to prevent memory leaks
    this.documentListeners.forEach(({ type, handler }) => {
      document.removeEventListener(type, handler);
    });
    this.documentListeners = [];
    
    // Clean up animations
    this.animations = [];
    
    // Clean up particles
    this.particles.destroy();
    
    // Clean up UI
    const hudOverlay = document.querySelector('.pizza-game-hud');
    if (hudOverlay) {
      hudOverlay.remove();
    }
  }
}

// Export for use in other modules
window.PizzaPartyGame = PizzaPartyGame;