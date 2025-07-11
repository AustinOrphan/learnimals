// Color Palette Game for Learnimals
// An interactive art game where Aria the Owl teaches color theory and palette creation
// Enhanced with BaseGame framework for progress tracking, analytics, and mobile optimization

import logger from '../../../utils/logger.js';
import BaseGame from '../../../components/games/BaseGame.js';
import { 
  getChallengesForDifficulty, 
  getColorById, 
  mixColors, 
  validateColorScheme, 
  getColorsForDifficulty 
} from './colorData.js';

class ColorPaletteGame extends BaseGame {
  constructor(canvasId, options = {}) {
    // Initialize BaseGame with canvas mode
    super(canvasId, {
      gameType: 'color-palette',
      subject: 'art',
      difficulty: options.difficulty || 'easy',
      enableProgressTracking: true,
      ...options
    });
    
    // Game-specific properties
    this.currentChallengeIndex = 0;
    this.maxChallenges = 5;
    this.challenges = [];
    this.currentChallenge = null;
    this.availableColors = [];
    this.selectedColors = [];
    this.mixingBowl = [];
    this.createdPalette = [];
    
    // Visual elements and layout
    this.ariaPosition = { x: 0, y: 0 };
    this.ariaAnimationFrame = 0;
    this.colorPalette = { x: 0, y: 0, width: 0, height: 0 };
    this.workArea = { x: 0, y: 0, width: 0, height: 0 };
    this.mixingArea = { x: 0, y: 0, width: 0, height: 0 };
    
    // Interaction state
    this.draggedColor = null;
    this.dragOffset = { x: 0, y: 0 };
    this.touchStartPos = { x: 0, y: 0 };
    this.isDragging = false;
    
    // Game state
    this.challengeStartTime = null;
    this.attempts = 0;
    this.hintsUsed = 0;
    this.colorsCreated = 0;
    this.perfectMixes = 0;
    
    // Visual effects
    this.particles = [];
    this.colorTransitions = [];
    this.brushStrokes = [];
    
    // Animation state
    this.isMixing = false;
    this.mixingAnimation = null;
    this.currentAnimations = [];
    
    // Colors and styling
    this.colors = {
      background: '#F5F3E7',
      ariaOwl: '#8B4513',
      easel: '#DEB887',
      canvas: '#FFFFFF',
      palette: '#F4A460',
      brush: '#654321',
      text: '#2F4F4F',
      success: '#32CD32',
      error: '#FF6B6B'
    };
  }
  
  /**
   * Override BaseGame's onInitialized
   */
  onInitialized() {
    super.onInitialized();
    this.setupGameLayout();
    this.loadChallenges();
    logger.debug('Color Palette game initialized successfully');
  }
  
  /**
   * Override BaseGame's onStart
   */
  onStart() {
    super.onStart();
    this.startNewGame();
  }
  
  /**
   * Override BaseGame's onRestart
   */
  onRestart() {
    super.onRestart();
    this.currentChallengeIndex = 0;
    this.challenges = [];
    this.selectedColors = [];
    this.mixingBowl = [];
    this.createdPalette = [];
    this.attempts = 0;
    this.hintsUsed = 0;
    this.colorsCreated = 0;
    this.perfectMixes = 0;
    this.particles = [];
    this.colorTransitions = [];
    this.brushStrokes = [];
  }
  
  /**
   * Setup game layout based on canvas size
   */
  setupGameLayout() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Position Aria the Owl in top-left corner
    this.ariaPosition.x = 80;
    this.ariaPosition.y = 80;
    
    // Color palette area (bottom of screen)
    this.colorPalette = {
      x: 20,
      y: height - 120,
      width: width - 40,
      height: 80
    };
    
    // Work area (center of screen)
    this.workArea = {
      x: 200,
      y: 150,
      width: width - 240,
      height: height - 300
    };
    
    // Mixing area (right side)
    this.mixingArea = {
      x: width - 150,
      y: 180,
      width: 120,
      height: 100
    };
  }
  
  /**
   * Load challenges for the game session
   */
  loadChallenges() {
    this.challenges = getChallengesForDifficulty(this.difficulty);
    this.availableColors = getColorsForDifficulty(this.difficulty);
    logger.debug(`Loaded ${this.challenges.length} challenges for difficulty: ${this.difficulty}`);
  }
  
  /**
   * Start a new game session
   */
  startNewGame() {
    this.currentChallengeIndex = 0;
    this.loadCurrentChallenge();
  }
  
  /**
   * Load the current challenge
   */
  loadCurrentChallenge() {
    if (this.currentChallengeIndex >= this.challenges.length) {
      this.gameOver();
      return;
    }
    
    this.currentChallenge = this.challenges[this.currentChallengeIndex];
    this.selectedColors = [];
    this.mixingBowl = [];
    this.createdPalette = [];
    this.attempts = 0;
    this.challengeStartTime = performance.now();
    
    // Update level display
    this.updateLevel(this.currentChallengeIndex + 1);
    
    logger.debug(`Loaded challenge: ${this.currentChallenge.title}`);
  }
  
  /**
   * Handle color selection and interaction
   */
  selectColor(colorId) {
    if (this.state !== 'playing') {
      return;
    }
    
    const color = getColorById(colorId);
    if (!color) {
      return;
    }
    
    switch (this.currentChallenge.type) {
    case 'color-mixing':
      this.addColorToMixing(color);
      break;
    case 'color-sorting':
      this.addColorToSort(color);
      break;
    case 'color-wheel':
      this.addColorToWheel(color);
      break;
    case 'palette-creation':
      this.addColorToPalette(color);
      break;
    case 'color-matching':
      this.addColorToMatch(color);
      break;
    }
    
    // Provide audio feedback
    this.playSound(300, 100, 'sine');
  }
  
  /**
   * Add color to mixing bowl
   */
  addColorToMixing(color) {
    if (this.mixingBowl.length < 2) {
      this.mixingBowl.push(color);
      
      if (this.mixingBowl.length === 2) {
        setTimeout(() => {
          this.performColorMix();
        }, 500);
      }
    }
  }
  
  /**
   * Perform color mixing
   */
  performColorMix() {
    if (this.mixingBowl.length !== 2) {
      return;
    }
    
    const [color1, color2] = this.mixingBowl;
    const mixResult = mixColors(color1.id, color2.id);
    this.attempts++;
    
    // Start mixing animation
    this.startMixingAnimation(color1, color2, mixResult);
    
    // Delay result to allow animation to play
    setTimeout(() => {
      if (mixResult.success) {
        this.handleSuccessfulMix(mixResult);
      } else {
        this.handleFailedMix(mixResult);
      }
    }, 1500);
    
    // Clear mixing bowl after animation
    setTimeout(() => {
      this.mixingBowl = [];
      this.stopMixingAnimation();
    }, 2000);
  }
  
  /**
   * Handle successful color mixing
   */
  handleSuccessfulMix(mixResult) {
    this.colorsCreated++;
    this.perfectMixes++;
    
    // Check if this matches the challenge objective
    const isCorrect = this.checkChallengeObjective(mixResult.result.id);
    
    if (isCorrect) {
      // Award points with bonuses
      const basePoints = this.difficulty === 'easy' ? 50 : this.difficulty === 'medium' ? 75 : 100;
      const speedBonus = this.calculateSpeedBonus();
      const efficiencyBonus = this.attempts === 1 ? 25 : 0;
      
      this.addScore(basePoints + speedBonus + efficiencyBonus);
      
      // Track correct answer
      this.trackCorrectAnswer({
        challenge: this.currentChallenge.id,
        mixedColors: [this.mixingBowl[0].id, this.mixingBowl[1].id],
        result: mixResult.result.id,
        timeToComplete: performance.now() - this.challengeStartTime,
        attempts: this.attempts
      });
      
      // Add success particles and animations
      this.addColorMixingParticles(mixResult.result.hex);
      this.addSuccessAnimation(mixResult.result);
      
      // Play success sound
      this.playSound(600, 200, 'sine');
      
      // Haptic feedback
      if (this.hapticFeedback) {
        navigator.vibrate(100);
      }
      
      // Complete challenge after a moment
      setTimeout(() => {
        this.completeChallenge();
      }, 1500);
    } else {
      // Partial success - created a color but not the target
      this.addScore(25);
      this.addColorMixingParticles(mixResult.result.hex);
      this.addPartialSuccessAnimation(mixResult.result);
    }
  }
  
  /**
   * Handle failed color mixing
   */
  handleFailedMix(mixResult) {
    // Track incorrect attempt
    this.trackIncorrectAnswer({
      challenge: this.currentChallenge.id,
      mixedColors: [this.mixingBowl[0].id, this.mixingBowl[1].id],
      message: mixResult.message,
      attempts: this.attempts
    });
    
    // Play error sound
    this.playSound(200, 300, 'sawtooth');
    
    // Error haptic feedback
    if (this.hapticFeedback) {
      navigator.vibrate([100, 50, 100]);
    }
  }
  
  /**
   * Add color to sorting challenge
   */
  addColorToSort(color) {
    // Implementation depends on the specific sorting challenge
    this.selectedColors.push(color);
    this.checkSortingCompletion();
  }
  
  /**
   * Add color to color wheel challenge
   */
  addColorToWheel(color) {
    // Implementation for placing colors on the wheel
    this.selectedColors.push(color);
    this.checkWheelCompletion();
  }
  
  /**
   * Add color to palette creation
   */
  addColorToPalette(color) {
    if (this.createdPalette.length < 6) {
      this.createdPalette.push(color);
    }
  }
  
  /**
   * Add color to matching challenge
   */
  addColorToMatch(color) {
    this.selectedColors.push(color);
    this.checkMatchingCompletion();
  }
  
  /**
   * Check if challenge objective is met
   */
  checkChallengeObjective(resultColorId) {
    switch (this.currentChallenge.type) {
    case 'color-mixing':
      return this.currentChallenge.correctAnswer === resultColorId;
    default:
      return false;
    }
  }
  
  /**
   * Check sorting challenge completion
   */
  checkSortingCompletion() {
    // Implementation for checking if sorting is correct
    if (this.selectedColors.length >= 6) {
      this.completeChallenge();
    }
  }
  
  /**
   * Check color wheel completion
   */
  checkWheelCompletion() {
    // Implementation for checking wheel placement
    if (this.selectedColors.length >= 6) {
      this.completeChallenge();
    }
  }
  
  /**
   * Check matching challenge completion
   */
  checkMatchingCompletion() {
    // Implementation for checking matches
    if (this.selectedColors.length >= (this.currentChallenge.pairs?.length || 3)) {
      this.completeChallenge();
    }
  }
  
  /**
   * Submit created palette for validation
   */
  submitPalette() {
    if (this.createdPalette.length < 2) {
      return;
    }
    
    const validation = validateColorScheme(
      this.createdPalette.map(c => c.id),
      this.currentChallenge.scheme
    );
    
    if (validation.valid) {
      this.handleSuccessfulPalette(validation);
    } else {
      this.handleFailedPalette(validation);
    }
  }
  
  /**
   * Handle successful palette creation
   */
  handleSuccessfulPalette(_validation) {
    const basePoints = this.difficulty === 'easy' ? 75 : this.difficulty === 'medium' ? 100 : 150;
    const creativityBonus = this.createdPalette.length * 10;
    
    this.addScore(basePoints + creativityBonus);
    
    // Track successful palette
    this.trackCorrectAnswer({
      challenge: this.currentChallenge.id,
      palette: this.createdPalette.map(c => c.id),
      scheme: this.currentChallenge.scheme,
      timeToComplete: performance.now() - this.challengeStartTime
    });
    
    // Add rainbow particles and art celebration
    this.addRainbowParticles();
    this.addArtCelebration();
    
    // Play success sound
    this.playSound(600, 300, 'sine');
    
    // Complete challenge
    setTimeout(() => {
      this.completeChallenge();
    }, 2500);
  }
  
  /**
   * Handle failed palette creation
   */
  handleFailedPalette(_validation) {
    this.trackIncorrectAnswer({
      challenge: this.currentChallenge.id,
      palette: this.createdPalette.map(c => c.id),
      message: _validation.message
    });
    
    // Play error sound
    this.playSound(200, 300, 'sawtooth');
  }
  
  /**
   * Calculate speed bonus
   */
  calculateSpeedBonus() {
    const timeSpent = (performance.now() - this.challengeStartTime) / 1000;
    const targetTime = 30; // 30 seconds target
    
    if (timeSpent < targetTime) {
      return Math.round((targetTime - timeSpent) * 2);
    }
    return 0;
  }
  
  /**
   * Clear current work (mixing bowl, palette, etc.)
   */
  clearWork() {
    this.mixingBowl = [];
    this.selectedColors = [];
    this.createdPalette = [];
  }
  
  /**
   * Show hint for current challenge
   */
  showHint() {
    this.hintsUsed++;
    
    if (this.currentChallenge.hint) {
      // Display hint message (would be implemented in UI)
      logger.debug(`Hint: ${this.currentChallenge.hint}`);
    }
  }
  
  /**
   * Complete current challenge and move to next
   */
  completeChallenge() {
    // Track challenge completion
    this.trackLevelComplete({
      challenge: this.currentChallenge.id,
      type: this.currentChallenge.type,
      attempts: this.attempts,
      hintsUsed: this.hintsUsed,
      timeToComplete: performance.now() - this.challengeStartTime
    });
    
    this.currentChallengeIndex++;
    
    if (this.currentChallengeIndex < this.challenges.length) {
      setTimeout(() => {
        this.loadCurrentChallenge();
      }, 2000);
    } else {
      this.gameOver();
    }
  }
  
  /**
   * Add color mixing particle effect
   */
  addColorMixingParticles(color) {
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x: this.mixingArea.x + this.mixingArea.width / 2,
        y: this.mixingArea.y + this.mixingArea.height / 2,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 1.0,
        decay: 0.02,
        color: color,
        size: Math.random() * 8 + 4,
        type: 'paint-splatter'
      });
    }
  }
  
  /**
   * Start mixing animation
   */
  startMixingAnimation(color1, color2, mixResult) {
    this.isMixing = true;
    
    // Add CSS animation classes if using DOM mode
    if (this.container && !this.canvas) {
      const gameContainer = this.container.querySelector('.game-container');
      if (gameContainer) {
        gameContainer.classList.add('color-swirling');
      }
      
      // Find mixing area or create visual feedback
      const mixingElement = this.container.querySelector('.mixing-area, .work-area');
      if (mixingElement) {
        mixingElement.classList.add('mixing-area-active');
        
        // Add color blend overlay
        const overlay = document.createElement('div');
        overlay.className = 'color-blend-overlay active';
        overlay.style.background = `linear-gradient(45deg, ${color1.hex}, ${color2.hex})`;
        mixingElement.appendChild(overlay);
      }
    }
    
    // Store animation state
    this.mixingAnimation = {
      color1: color1,
      color2: color2,
      result: mixResult,
      startTime: performance.now()
    };
  }
  
  /**
   * Stop mixing animation
   */
  stopMixingAnimation() {
    this.isMixing = false;
    
    // Remove CSS animation classes if using DOM mode
    if (this.container && !this.canvas) {
      const gameContainer = this.container.querySelector('.game-container');
      if (gameContainer) {
        gameContainer.classList.remove('color-swirling');
      }
      
      const mixingElement = this.container.querySelector('.mixing-area, .work-area');
      if (mixingElement) {
        mixingElement.classList.remove('mixing-area-active');
        const overlay = mixingElement.querySelector('.color-blend-overlay');
        if (overlay) {
          overlay.remove();
        }
      }
    }
    
    this.mixingAnimation = null;
  }
  
  /**
   * Add success animation effects
   */
  addSuccessAnimation(resultColor) {
    // Add paint splatter effect
    if (this.container && !this.canvas) {
      const workArea = this.container.querySelector('.game-container');
      if (workArea) {
        // Create multiple paint particles
        for (let i = 0; i < 5; i++) {
          const splatter = document.createElement('div');
          splatter.className = 'paint-particle paint-splattering';
          splatter.style.backgroundColor = resultColor.hex;
          splatter.style.left = `${40 + Math.random() * 20}%`;
          splatter.style.top = `${40 + Math.random() * 20}%`;
          splatter.style.animationDelay = `${i * 100}ms`;
          workArea.appendChild(splatter);
          
          // Remove after animation
          setTimeout(() => splatter.remove(), 1000 + i * 100);
        }
      }
      
      // Add palette fill animation to the entire game
      const gameElement = this.container.querySelector('.color-palette-game');
      if (gameElement) {
        gameElement.classList.add('palette-filling');
        setTimeout(() => gameElement.classList.remove('palette-filling'), 600);
      }
      
      // Add color transformation effect
      const canvas = this.container.querySelector('.game-canvas');
      if (canvas) {
        canvas.classList.add('color-transforming');
        setTimeout(() => canvas.classList.remove('color-transforming'), 1500);
      }
    }
    
    // Add extra particles for celebration
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: this.workArea.x + this.workArea.width / 2,
        y: this.workArea.y + this.workArea.height / 2,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 8 - 2,
        life: 1.0,
        decay: 0.015,
        color: resultColor.hex,
        size: Math.random() * 10 + 5,
        type: 'celebration'
      });
    }
  }
  
  /**
   * Add partial success animation
   */
  addPartialSuccessAnimation(resultColor) {
    if (this.container && !this.canvas) {
      // Add gentle color flowing animation
      const gameElement = this.container.querySelector('.color-palette-game');
      if (gameElement) {
        gameElement.classList.add('color-flowing');
        setTimeout(() => gameElement.classList.remove('color-flowing'), 800);
      }
    }
  }
  
  /**
   * Add art celebration animation
   */
  addArtCelebration() {
    if (this.container && !this.canvas) {
      // Add art celebration to main game container
      const gameElement = this.container.querySelector('.color-palette-game');
      if (gameElement) {
        gameElement.classList.add('art-celebrating');
        setTimeout(() => gameElement.classList.remove('art-celebrating'), 2000);
      }
      
      // Add canvas texture animation
      const workArea = this.container.querySelector('.game-container');
      if (workArea) {
        workArea.classList.add('canvas-animating');
        setTimeout(() => workArea.classList.remove('canvas-animating'), 10000);
      }
    }
  }
  
  /**
   * Add rainbow particle effect
   */
  addRainbowParticles() {
    const rainbowColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
    
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: this.workArea.x + Math.random() * this.workArea.width,
        y: this.workArea.y + Math.random() * this.workArea.height,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1.0,
        decay: 0.015,
        color: rainbowColors[Math.floor(Math.random() * rainbowColors.length)],
        size: Math.random() * 6 + 3
      });
    }
  }
  
  /**
   * Override BaseGame's update method
   */
  update(deltaTime, timestamp) {
    super.update(deltaTime, timestamp);
    
    // Update Aria animation
    this.ariaAnimationFrame += deltaTime * 0.001;
    
    // Update particles
    this.updateParticles();
    
    // Update color transitions
    this.updateColorTransitions();
  }
  
  /**
   * Update particle effects
   */
  updateParticles() {
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= particle.decay;
      particle.vx *= 0.98; // Air resistance
      particle.vy *= 0.98;
      return particle.life > 0;
    });
  }
  
  /**
   * Update color transition effects
   */
  updateColorTransitions() {
    this.colorTransitions = this.colorTransitions.filter(transition => {
      transition.progress += 0.02;
      return transition.progress < 1;
    });
  }
  
  /**
   * Override BaseGame's render method
   */
  render() {
    super.render(); // Clear canvas
    
    if (this.state !== 'playing') {
      return;
    }
    
    this.renderBackground();
    this.renderAriaCharacter();
    this.renderChallengeInfo();
    this.renderColorPalette();
    this.renderWorkArea();
    this.renderMixingArea();
    this.renderParticles();
    this.renderGameInfo();
  }
  
  /**
   * Render art studio background
   */
  renderBackground() {
    // Studio background with easel and art supplies
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#F5F3E7');
    gradient.addColorStop(1, '#E6DDD4');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Easel
    this.ctx.fillStyle = this.colors.easel;
    this.ctx.fillRect(150, 50, 10, 300);
    this.ctx.fillRect(300, 50, 10, 300);
    this.ctx.fillRect(120, 200, 220, 150);
    
    // Canvas on easel
    this.ctx.fillStyle = this.colors.canvas;
    this.ctx.fillRect(130, 210, 200, 130);
    this.ctx.strokeStyle = '#8B4513';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(130, 210, 200, 130);
  }
  
  /**
   * Render Aria the Owl character
   */
  renderAriaCharacter() {
    const x = this.ariaPosition.x;
    const y = this.ariaPosition.y;
    const bobOffset = Math.sin(this.ariaAnimationFrame * 2) * 2;
    
    // Aria body (artistic owl with beret)
    this.ctx.fillStyle = this.colors.ariaOwl;
    this.ctx.beginPath();
    this.ctx.arc(x, y + bobOffset, 30, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Artist beret
    this.ctx.fillStyle = '#8B0000';
    this.ctx.beginPath();
    this.ctx.arc(x, y - 20 + bobOffset, 20, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Eyes
    this.ctx.fillStyle = 'white';
    this.ctx.beginPath();
    this.ctx.arc(x - 10, y - 5 + bobOffset, 8, 0, Math.PI * 2);
    this.ctx.arc(x + 10, y - 5 + bobOffset, 8, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Pupils
    this.ctx.fillStyle = 'black';
    this.ctx.beginPath();
    this.ctx.arc(x - 10, y - 5 + bobOffset, 4, 0, Math.PI * 2);
    this.ctx.arc(x + 10, y - 5 + bobOffset, 4, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Beak
    this.ctx.fillStyle = '#FFA500';
    this.ctx.beginPath();
    this.ctx.moveTo(x, y + 5 + bobOffset);
    this.ctx.lineTo(x - 5, y + 12 + bobOffset);
    this.ctx.lineTo(x + 5, y + 12 + bobOffset);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Paintbrush in wing
    this.ctx.strokeStyle = this.colors.brush;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(x + 25, y + bobOffset);
    this.ctx.lineTo(x + 45, y - 10 + bobOffset);
    this.ctx.stroke();
    
    // Paint on brush
    this.ctx.fillStyle = '#FF69B4';
    this.ctx.beginPath();
    this.ctx.arc(x + 45, y - 10 + bobOffset, 3, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  /**
   * Render current challenge information
   */
  renderChallengeInfo() {
    if (!this.currentChallenge) return;
    
    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      this.currentChallenge.title,
      this.canvas.width / 2,
      30
    );
    
    this.ctx.font = '14px Arial';
    this.ctx.fillText(
      this.currentChallenge.instruction,
      this.canvas.width / 2,
      55
    );
  }
  
  /**
   * Render color palette area
   */
  renderColorPalette() {
    const paletteArea = this.colorPalette;
    
    // Palette background
    this.ctx.fillStyle = this.colors.palette;
    this.ctx.fillRect(paletteArea.x, paletteArea.y, paletteArea.width, paletteArea.height);
    this.ctx.strokeStyle = '#8B4513';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(paletteArea.x, paletteArea.y, paletteArea.width, paletteArea.height);
    
    // Color swatches
    const colorSize = 50;
    const spacing = 10;
    const startX = paletteArea.x + 15;
    const startY = paletteArea.y + 15;
    
    this.availableColors.forEach((color, index) => {
      const x = startX + (index % 10) * (colorSize + spacing);
      const y = startY + Math.floor(index / 10) * (colorSize + spacing);
      
      // Color swatch
      this.ctx.fillStyle = color.hex;
      this.ctx.fillRect(x, y, colorSize, colorSize);
      this.ctx.strokeStyle = '#333';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(x, y, colorSize, colorSize);
      
      // Color name
      this.ctx.fillStyle = this.colors.text;
      this.ctx.font = '10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(color.name, x + colorSize/2, y + colorSize + 12);
    });
  }
  
  /**
   * Render work area (depends on challenge type)
   */
  renderWorkArea() {
    const area = this.workArea;
    
    // Work area background
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.fillRect(area.x, area.y, area.width, area.height);
    this.ctx.strokeStyle = '#DDD';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(area.x, area.y, area.width, area.height);
    
    // Render based on challenge type
    switch (this.currentChallenge?.type) {
    case 'color-wheel':
      this.renderColorWheel();
      break;
    case 'color-sorting':
      this.renderSortingAreas();
      break;
    case 'palette-creation':
      this.renderPaletteCreation();
      break;
    case 'color-matching':
      this.renderMatchingArea();
      break;
    }
  }
  
  /**
   * Render color wheel for wheel challenges
   */
  renderColorWheel() {
    const centerX = this.workArea.x + this.workArea.width / 2;
    const centerY = this.workArea.y + this.workArea.height / 2;
    const radius = Math.min(this.workArea.width, this.workArea.height) / 3;
    
    // Draw color wheel outline
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Draw wheel segments
    const segments = 12;
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const nextAngle = ((i + 1) / segments) * Math.PI * 2;
      
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY);
      this.ctx.arc(centerX, centerY, radius, angle, nextAngle);
      this.ctx.closePath();
      this.ctx.strokeStyle = '#DDD';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
  }
  
  /**
   * Render sorting areas for sorting challenges
   */
  renderSortingAreas() {
    const area = this.workArea;
    const halfWidth = area.width / 2;
    
    // Warm colors area
    this.ctx.fillStyle = 'rgba(255, 200, 200, 0.3)';
    this.ctx.fillRect(area.x + 10, area.y + 10, halfWidth - 20, area.height - 20);
    this.ctx.strokeStyle = '#FF6B6B';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(area.x + 10, area.y + 10, halfWidth - 20, area.height - 20);
    
    // Cool colors area
    this.ctx.fillStyle = 'rgba(200, 200, 255, 0.3)';
    this.ctx.fillRect(area.x + halfWidth + 10, area.y + 10, halfWidth - 20, area.height - 20);
    this.ctx.strokeStyle = '#6BB6FF';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(area.x + halfWidth + 10, area.y + 10, halfWidth - 20, area.height - 20);
    
    // Labels
    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Warm Colors ☀️', area.x + halfWidth/2, area.y + 30);
    this.ctx.fillText('Cool Colors ❄️', area.x + halfWidth + halfWidth/2, area.y + 30);
  }
  
  /**
   * Render palette creation area
   */
  renderPaletteCreation() {
    const area = this.workArea;
    
    // Palette slots
    const slotSize = 60;
    const spacing = 10;
    const slotsPerRow = 6;
    const startX = area.x + (area.width - (slotsPerRow * (slotSize + spacing) - spacing)) / 2;
    const startY = area.y + 20;
    
    this.createdPalette.forEach((color, index) => {
      const x = startX + (index % slotsPerRow) * (slotSize + spacing);
      const y = startY + Math.floor(index / slotsPerRow) * (slotSize + spacing);
      
      this.ctx.fillStyle = color.hex;
      this.ctx.fillRect(x, y, slotSize, slotSize);
      this.ctx.strokeStyle = '#333';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, y, slotSize, slotSize);
    });
    
    // Empty slots
    for (let i = this.createdPalette.length; i < 6; i++) {
      const x = startX + (i % slotsPerRow) * (slotSize + spacing);
      const y = startY + Math.floor(i / slotsPerRow) * (slotSize + spacing);
      
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.fillRect(x, y, slotSize, slotSize);
      this.ctx.strokeStyle = '#DDD';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([5, 5]);
      this.ctx.strokeRect(x, y, slotSize, slotSize);
      this.ctx.setLineDash([]);
    }
  }
  
  /**
   * Render matching area
   */
  renderMatchingArea() {
    // Implementation for color matching challenges
    const area = this.workArea;
    
    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Match colors with their descriptions', 
      area.x + area.width/2, area.y + area.height/2);
  }
  
  /**
   * Render mixing area
   */
  renderMixingArea() {
    const area = this.mixingArea;
    
    // Mixing bowl
    this.ctx.fillStyle = '#F5F5DC';
    this.ctx.beginPath();
    this.ctx.arc(area.x + area.width/2, area.y + area.height/2, 40, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#8B4513';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
    
    // Colors in mixing bowl
    this.mixingBowl.forEach((color, index) => {
      const angle = (index / this.mixingBowl.length) * Math.PI * 2;
      const x = area.x + area.width/2 + Math.cos(angle) * 20;
      const y = area.y + area.height/2 + Math.sin(angle) * 20;
      
      this.ctx.fillStyle = color.hex;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 15, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = '#333';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    });
    
    // Mixing label
    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Mix Colors', area.x + area.width/2, area.y - 10);
  }
  
  /**
   * Render particle effects
   */
  renderParticles() {
    this.particles.forEach(particle => {
      this.ctx.save();
      this.ctx.globalAlpha = particle.life;
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
  }
  
  /**
   * Render game information
   */
  renderGameInfo() {
    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'right';
    
    // Score and challenge info
    this.ctx.fillText(`Score: ${this.score}`, this.canvas.width - 20, 30);
    this.ctx.fillText(`Challenge: ${this.currentChallengeIndex + 1}/${this.challenges.length}`, 
      this.canvas.width - 20, 50);
    this.ctx.fillText(`Colors Created: ${this.colorsCreated}`, this.canvas.width - 20, 70);
  }
  
  /**
   * Handle click events
   */
  handleClick(event) {
    super.handleClick(event);
    
    const pos = this.getPointerPosition(event);
    
    // Check color palette clicks
    this.checkColorPaletteClick(pos);
    
    // Check work area clicks
    this.checkWorkAreaClick(pos);
    
    // Check mixing area clicks
    this.checkMixingAreaClick(pos);
  }
  
  /**
   * Check if click is on color palette
   */
  checkColorPaletteClick(pos) {
    const paletteArea = this.colorPalette;
    const colorSize = 50;
    const spacing = 10;
    const startX = paletteArea.x + 15;
    const startY = paletteArea.y + 15;
    
    this.availableColors.forEach((color, index) => {
      const x = startX + (index % 10) * (colorSize + spacing);
      const y = startY + Math.floor(index / 10) * (colorSize + spacing);
      
      if (pos.x >= x && pos.x <= x + colorSize &&
          pos.y >= y && pos.y <= y + colorSize) {
        this.selectColor(color.id);
      }
    });
  }
  
  /**
   * Check work area clicks
   */
  checkWorkAreaClick(_pos) {
    // Implementation depends on challenge type
    if (this.currentChallenge?.type === 'palette-creation') {
      // Check if clicking submit area or palette manipulation
    }
  }
  
  /**
   * Check mixing area clicks
   */
  checkMixingAreaClick(pos) {
    const area = this.mixingArea;
    
    if (pos.x >= area.x && pos.x <= area.x + area.width &&
        pos.y >= area.y && pos.y <= area.y + area.height) {
      // Clear mixing bowl on click
      this.mixingBowl = [];
    }
  }
  
  /**
   * Override BaseGame's onGameEnd
   */
  onGameEnd() {
    super.onGameEnd();
    
    // Track final game statistics
    this.trackLevelComplete({
      challengesCompleted: this.currentChallengeIndex,
      totalChallenges: this.challenges.length,
      colorsCreated: this.colorsCreated,
      perfectMixes: this.perfectMixes,
      hintsUsed: this.hintsUsed,
      difficulty: this.difficulty,
      finalScore: this.score
    });
  }
}

// Export the game class
export default ColorPaletteGame;