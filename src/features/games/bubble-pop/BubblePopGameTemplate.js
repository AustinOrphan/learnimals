/**
 * BubblePopGameTemplate - Enhanced bubble pop game using the new template system
 * Extends BaseGame to inherit common functionality
 */
import BaseGame from '../../../components/games/BaseGame.js';
import { getRandomInt } from '../../../utils/common.js';
import Bubble from './Bubble.js';

export default class BubblePopGameTemplate extends BaseGame {
  constructor(canvasId, options = {}) {
    super(canvasId, options);
        
    // Bubble Pop specific properties
    this.bubbles = [];
    this.currentQuestion = {};
    this.correctBubbleIndex = 0;
    this.difficulty = options.difficulty || 'easy';
    this.timeLimit = 30; // seconds per round
    this.timeRemaining = this.timeLimit;
    this.round = 1;
    this.streakCount = 0;
    this.maxStreak = 0;
    this.roundEnding = false;
        
    // Visual effects
    this.particles = [];
    this.messageQueue = [];
    this.bubbleCache = new Map();
        
    // Theme colors
    this.themeColors = {
      primary: this.getThemeColor('--accent-primary') || '#007bff',
      secondary: this.getThemeColor('--accent-secondary') || '#6f42c1',
      success: this.getThemeColor('--success-color') || '#28a745',
      danger: this.getThemeColor('--danger-color') || '#dc3545',
      warning: this.getThemeColor('--warning-color') || '#ffc107'
    };
        
    // Difficulty settings
    this.difficultySettings = {
      easy: { 
        bubbleCount: 3, 
        maxNumber: 10, 
        timeLimit: 45,
        scoreMultiplier: 1 
      },
      medium: { 
        bubbleCount: 4, 
        maxNumber: 20, 
        timeLimit: 30,
        scoreMultiplier: 1.5 
      },
      hard: { 
        bubbleCount: 5, 
        maxNumber: 50, 
        timeLimit: 20,
        scoreMultiplier: 2 
      }
    };
        
    this.settings = this.difficultySettings[this.difficulty];
  }
    
  /**
     * Get theme color from CSS variables
     */
  getThemeColor(variable) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(variable)
      .trim() || '#333';
  }
    
  /**
     * Draw a rounded rectangle (fallback for browsers without roundRect support)
     */
  drawRoundedRect(x, y, width, height, radius) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }
    
  /**
     * Initialize game after BaseGame setup
     */
  async onInitialized() {
    super.onInitialized();
    this.setupThemeListener();
    this.generateQuestion();
    this.spawnBubbles();
    this.start();
  }
    
  /**
     * Listen for theme changes to update colors
     */
  setupThemeListener() {
    document.addEventListener('themeChanged', () => {
      this.themeColors = {
        primary: this.getThemeColor('--accent-primary') || '#007bff',
        secondary: this.getThemeColor('--accent-secondary') || '#6f42c1',
        success: this.getThemeColor('--success-color') || '#28a745',
        danger: this.getThemeColor('--danger-color') || '#dc3545',
        warning: this.getThemeColor('--warning-color') || '#ffc107'
      };
      this.bubbleCache.clear(); // Clear cached bubbles to regenerate with new colors
    });
  }
    
  /**
     * Generate a new math question based on difficulty
     */
  generateQuestion() {
    const max = this.settings.maxNumber;
        
    switch (this.difficulty) {
    case 'easy': {
      // Simple addition
      const a = getRandomInt(1, max);
      const b = getRandomInt(1, max);
      this.currentQuestion = {
        text: `${a} + ${b}`,
        answer: a + b,
        type: 'addition'
      };
      break;
    }
                
    case 'medium': {
      // Addition and subtraction
      if (Math.random() < 0.6) {
        const x = getRandomInt(1, max);
        const y = getRandomInt(1, max);
        this.currentQuestion = {
          text: `${x} + ${y}`,
          answer: x + y,
          type: 'addition'
        };
      } else {
        const x = getRandomInt(10, max);
        const y = getRandomInt(1, x);
        this.currentQuestion = {
          text: `${x} - ${y}`,
          answer: x - y,
          type: 'subtraction'
        };
      }
      break;
    }
                
    case 'hard': {
      // Addition, subtraction, and simple multiplication
      const operation = Math.random();
      if (operation < 0.4) {
        const x = getRandomInt(1, max);
        const y = getRandomInt(1, max);
        this.currentQuestion = {
          text: `${x} + ${y}`,
          answer: x + y,
          type: 'addition'
        };
      } else if (operation < 0.7) {
        const x = getRandomInt(10, max);
        const y = getRandomInt(1, x);
        this.currentQuestion = {
          text: `${x} - ${y}`,
          answer: x - y,
          type: 'subtraction'
        };
      } else {
        const x = getRandomInt(2, 9);
        const y = getRandomInt(2, 9);
        this.currentQuestion = {
          text: `${x} × ${y}`,
          answer: x * y,
          type: 'multiplication'
        };
      }
      break;
    }
    }
  }
    
  /**
     * Create bubbles for the current question
     */
  spawnBubbles() {
    this.bubbles = [];
    this.roundEnding = false; // Reset round ending flag
    this.correctBubbleIndex = getRandomInt(0, this.settings.bubbleCount - 1);
        
    // Calculate bubble positions - start off-screen (below canvas)
    const spacing = this.canvas.width / (this.settings.bubbleCount + 1);
    const radius = Math.min(40, spacing / 3);
    const startY = this.canvas.height + radius + 20; // Start below canvas
        
    for (let i = 0; i < this.settings.bubbleCount; i++) {
      const x = spacing * (i + 1);
      const y = startY + getRandomInt(0, 40); // Stagger start positions slightly
      let answer;
            
      if (i === this.correctBubbleIndex) {
        answer = this.currentQuestion.answer;
      } else {
        // Generate unique wrong answers
        do {
          const offset = getRandomInt(-10, 10);
          answer = this.currentQuestion.answer + offset;
        } while (
          answer === this.currentQuestion.answer ||
                    answer < 0 ||
                    this.bubbles.some(b => b.answer === answer)
        );
      }
            
      const isCorrect = i === this.correctBubbleIndex;
      const bubble = new Bubble({
        x,
        y,
        radius,
        answer,
        isCorrect,
        bubbleBackground: this.createBubbleBackground(radius),
        ctx: this.ctx,
        floatSpeed: 0.8 + Math.random() * 0.4, // Slightly faster and more varied
        color: isCorrect ? this.themeColors.success : this.themeColors.primary
      });
            
      this.bubbles.push(bubble);
    }
        
    // Reset time for this round
    this.timeRemaining = this.settings.timeLimit;
  }
    
  /**
     * Create cached bubble background for performance
     */
  createBubbleBackground(radius) {
    const cacheKey = `bubble_${radius}_${this.themeColors.primary}`;
        
    if (!this.bubbleCache.has(cacheKey)) {
      const bubbleCanvas = document.createElement('canvas');
      bubbleCanvas.width = radius * 2 + 4;
      bubbleCanvas.height = radius * 2 + 4;
      const bubbleCtx = bubbleCanvas.getContext('2d');
            
      // Create gradient
      const gradient = bubbleCtx.createRadialGradient(
        radius + 2, radius + 2, 0,
        radius + 2, radius + 2, radius
      );
            
      // Convert colors to rgba with alpha
      const secondaryWithAlpha = this.convertToRgba(this.themeColors.secondary, 0.5);
      gradient.addColorStop(0, secondaryWithAlpha);
      gradient.addColorStop(1, this.themeColors.primary);
            
      // Draw bubble
      bubbleCtx.beginPath();
      bubbleCtx.arc(radius + 2, radius + 2, radius, 0, Math.PI * 2);
      bubbleCtx.fillStyle = gradient;
      bubbleCtx.fill();
            
      // Add shine effect
      bubbleCtx.beginPath();
      bubbleCtx.arc(radius + 2 - radius/3, radius + 2 - radius/3, radius/4, 0, Math.PI * 2);
      bubbleCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      bubbleCtx.fill();
            
      // Border
      bubbleCtx.beginPath();
      bubbleCtx.arc(radius + 2, radius + 2, radius, 0, Math.PI * 2);
      bubbleCtx.strokeStyle = this.themeColors.primary;
      bubbleCtx.lineWidth = 2;
      bubbleCtx.stroke();
            
      this.bubbleCache.set(cacheKey, bubbleCanvas);
    }
        
    return this.bubbleCache.get(cacheKey);
  }
    
  /**
     * Handle click/touch on bubbles
     */
  onClick(position, _event) {
    if (this.state !== 'playing' || !this.bubbles) return;
        
    // Check collision with bubbles
    for (let i = 0; i < this.bubbles.length; i++) {
      const bubble = this.bubbles[i];
      if (bubble.containsPoint(position.x, position.y)) {
        if (bubble.isCorrect) {
          this.handleCorrectAnswer(bubble);
        } else {
          this.handleWrongAnswer(bubble);
        }
        break;
      }
    }
  }
    
  /**
     * Handle correct answer
     */
  handleCorrectAnswer(bubble) {
    // Prevent multiple round endings
    if (this.roundEnding) return;
    this.roundEnding = true;
        
    // Calculate score based on time remaining and streak
    const timeBonus = Math.floor(this.timeRemaining * 2);
    const streakBonus = this.streakCount * 10;
    const difficultyBonus = Math.floor(100 * this.settings.scoreMultiplier);
    const totalPoints = difficultyBonus + timeBonus + streakBonus;
        
    this.addScore(totalPoints);
    this.streakCount++;
    this.maxStreak = Math.max(this.maxStreak, this.streakCount);
        
    // Create explosion particles for the clicked bubble
    this.createExplosion(bubble.x, bubble.y, this.themeColors.success);
        
    // Pop all remaining bubbles simultaneously
    this.popAllBubbles();
        
    // Play success sound
    this.playSound(523.25, 200); // C5 note
        
    // Show feedback message
    this.addMessage(`Correct! +${totalPoints}`, this.themeColors.success);
        
    if (this.streakCount >= 3) {
      this.addMessage(`${this.streakCount} in a row!`, this.themeColors.warning);
    }
        
    // Next round
    this.nextRound();
  }
    
  /**
     * Handle wrong answer
     */
  handleWrongAnswer(bubble) {
    this.streakCount = 0;
        
    // Create failure particles
    this.createExplosion(bubble.x, bubble.y, this.themeColors.danger);
        
    // Play error sound
    this.playSound(196, 300, 'square'); // G3 note
        
    // Show feedback
    this.addMessage('Try again!', this.themeColors.danger);
        
    // Remove the wrong bubble with animation
    bubble.remove();
        
    // If no bubbles left except correct one, hint at it
    const remainingBubbles = this.bubbles.filter(b => b.active);
    if (remainingBubbles.length <= 2) {
      this.addMessage('Almost there!', this.themeColors.warning);
      // Make correct bubble pulse
      const correctBubble = this.bubbles.find(b => b.isCorrect);
      if (correctBubble) {
        correctBubble.pulse();
      }
    }
  }
    
  /**
     * Proceed to next round
     */
  nextRound() {
    this.round++;
    this.updateLevel(this.round);
        
    // Temporarily pause the game to prevent visual issues
    this.setState('transitioning');
        
    // Increase difficulty gradually
    if (this.round % 5 === 0 && this.settings.timeLimit > 15) {
      this.settings.timeLimit = Math.max(15, this.settings.timeLimit - 2);
      this.addMessage('Time limit decreased!', this.themeColors.warning);
    }
        
    // Generate new question and bubbles
    setTimeout(() => {
      this.generateQuestion();
      this.spawnBubbles();
      this.setState('playing'); // Resume playing
    }, 1000);
  }
    
  /**
     * Create particle explosion effect
     */
  createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1.0,
        decay: 0.02,
        color: color,
        size: Math.random() * 4 + 2
      });
    }
  }
    
  /**
     * Add floating message
     */
  addMessage(text, color) {
    // Prevent duplicate messages
    const existingMessage = this.messageQueue.find(msg => msg.text === text && msg.life > 0.5);
    if (existingMessage) {
      return; // Don't add duplicate message
    }
        
    // Limit the number of active messages to prevent overcrowding
    if (this.messageQueue.length >= 3) {
      this.messageQueue.shift(); // Remove oldest message
    }
        
    this.messageQueue.push({
      text,
      color,
      x: this.canvas.width / 2,
      y: this.canvas.height / 2 - 50,
      vy: -1,
      life: 1.0,
      decay: 0.015,
      fontSize: 24
    });
  }
    
  /**
     * Convert a color to RGBA format with specified alpha
     */
  convertToRgba(color, alpha = 1) {
    // If color is already in hex format, convert to rgba
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
        
    // If color is in rgb format, convert to rgba
    if (color.startsWith('rgb(')) {
      const values = color.match(/\d+/g);
      if (values && values.length >= 3) {
        return `rgba(${values[0]}, ${values[1]}, ${values[2]}, ${alpha})`;
      }
    }
        
    // If color is already rgba, return as-is
    if (color.startsWith('rgba(')) {
      return color;
    }
        
    // Fallback - try to use the color as-is
    return color;
  }

  /**
     * Update game logic
     */
  update(deltaTime, _timestamp) {
    if (this.state !== 'playing') return;
        
    // Update time remaining
    this.timeRemaining -= deltaTime / 1000;
        
    if (this.timeRemaining <= 0) {
      this.handleTimeUp();
      return;
    }
        
    // Update bubbles
    if (this.bubbles) {
      this.bubbles.forEach(bubble => {
        bubble.update(deltaTime);
      });
            
      // Remove inactive bubbles
      this.bubbles = this.bubbles.filter(bubble => bubble.active);
            
      // Check if correct bubble was missed or all bubbles have exited (only check once per round)
      const correctBubble = this.bubbles.find(b => b.isCorrect);
      const activeBubbles = this.bubbles.filter(b => b.active);
      
      if ((!correctBubble || !correctBubble.active || activeBubbles.length === 0) && !this.roundEnding) {
        // Prevent multiple calls by setting a flag
        this.roundEnding = true;
        
        // If there are still active bubbles, pop them all before ending the round
        if (activeBubbles.length > 0) {
          this.popAllBubbles();
        }
        
        this.handleMissedBubble();
      }
    }
        
    // Update particles
    this.particles.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1; // gravity
      particle.life -= particle.decay;
    });
        
    // Remove dead particles
    this.particles = this.particles.filter(p => p.life > 0);
        
    // Update messages
    this.messageQueue.forEach(message => {
      message.y += message.vy;
      message.life -= message.decay;
    });
        
    // Remove expired messages
    this.messageQueue = this.messageQueue.filter(m => m.life > 0);
  }
    
  /**
     * Handle time running out
     */
  handleTimeUp() {
    // Prevent multiple calls
    if (this.roundEnding) return;
    this.roundEnding = true;
        
    this.streakCount = 0;
    this.addMessage('Time\'s up!', this.themeColors.danger);
    this.playSound(147, 500, 'square'); // D3 note
        
    // Check if we should end the game or continue
    this.lives--;
    if (this.lives <= 0) {
      this.gameOver();
    } else {
      this.nextRound();
    }
  }
    
  /**
     * Pop all bubbles simultaneously with explosion effects
     */
  popAllBubbles() {
    if (!this.bubbles) return;
    
    // Create explosion effects for all bubbles
    this.bubbles.forEach(bubble => {
      if (bubble.active) {
        // Create smaller explosion for non-correct bubbles
        const particleCount = bubble.isCorrect ? 15 : 8;
        const color = bubble.isCorrect ? this.themeColors.success : this.themeColors.primary;
        
        for (let i = 0; i < particleCount; i++) {
          this.particles.push({
            x: bubble.x,
            y: bubble.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8 - 2,
            size: Math.random() * 4 + 2,
            color: color,
            life: 1,
            decay: 0.02
          });
        }
        
        // Mark bubble for removal
        bubble.isRemoving = true;
      }
    });
  }

  /**
     * Handle missed correct bubble
     */
  handleMissedBubble() {
    this.streakCount = 0;
    
    // Pop all remaining bubbles
    this.popAllBubbles();
    
    this.addMessage('Missed the answer!', this.themeColors.danger);
    this.nextRound();
  }
    
  /**
     * Render the game
     */
  render() {
    // Clear canvas with theme-aware background
    this.ctx.fillStyle = this.getThemeColor('--bg-card') || '#f8f9fa';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
    // Draw question
    this.renderQuestion();
        
    // Draw timer
    this.renderTimer();
        
    // Draw bubbles
    if (this.bubbles) {
      this.bubbles.forEach(bubble => {
        bubble.render();
      });
    }
        
    // Draw particles
    this.renderParticles();
        
    // Draw messages
    this.renderMessages();
        
    // Draw streak indicator
    this.renderStreakIndicator();
  }
    
  /**
     * Render the current question
     */
  renderQuestion() {
    if (!this.currentQuestion || !this.currentQuestion.text) {
      return;
    }
    
    this.ctx.save();
    this.ctx.font = 'bold 32px "Comic Sans MS", cursive';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
        
    // Background for question
    const questionText = `Solve: ${this.currentQuestion.text} = ?`;
    const metrics = this.ctx.measureText(questionText);
    const padding = 20;
    const bgX = this.canvas.width / 2 - metrics.width / 2 - padding;
    const bgY = 30;
    const bgWidth = metrics.width + padding * 2;
    const bgHeight = 50;
        
    // Draw background
    this.ctx.fillStyle = this.getThemeColor('--bg-secondary') || '#e9ecef';
    this.drawRoundedRect(bgX, bgY, bgWidth, bgHeight, 10);
    this.ctx.fill();
        
    // Add border for better visibility
    this.ctx.strokeStyle = this.getThemeColor('--border-color') || '#ddd';
    this.ctx.lineWidth = 2;
    this.drawRoundedRect(bgX, bgY, bgWidth, bgHeight, 10);
    this.ctx.stroke();
        
    // Question text
    this.ctx.fillStyle = this.getThemeColor('--text-primary') || '#333';
    this.ctx.fillText(questionText, this.canvas.width / 2, bgY + bgHeight / 2);
        
    this.ctx.restore();
  }
    
  /**
     * Render timer bar
     */
  renderTimer() {
    const barWidth = this.canvas.width - 40;
    const barHeight = 8;
    const x = 20;
    const y = 100;
        
    // Background
    this.ctx.fillStyle = this.getThemeColor('--border-color') || '#e0e0e0';
    this.drawRoundedRect(x, y, barWidth, barHeight, 4);
    this.ctx.fill();
        
    // Timer fill
    const fillWidth = (this.timeRemaining / this.settings.timeLimit) * barWidth;
    const timeRatio = this.timeRemaining / this.settings.timeLimit;
        
    if (timeRatio > 0.5) {
      this.ctx.fillStyle = this.themeColors.success;
    } else if (timeRatio > 0.25) {
      this.ctx.fillStyle = this.themeColors.warning;
    } else {
      this.ctx.fillStyle = this.themeColors.danger;
    }
        
    this.drawRoundedRect(x, y, fillWidth, barHeight, 4);
    this.ctx.fill();
        
    // Timer text
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = this.getThemeColor('--text-secondary') || '#666';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      `Time: ${Math.ceil(this.timeRemaining)}s`,
      this.canvas.width / 2,
      y + barHeight + 20
    );
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
     * Render floating messages
     */
  renderMessages() {
    this.messageQueue.forEach(message => {
      this.ctx.save();
      this.ctx.globalAlpha = message.life;
      this.ctx.font = `bold ${message.fontSize}px "Comic Sans MS", cursive`;
      this.ctx.fillStyle = message.color;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.strokeStyle = 'white';
      this.ctx.lineWidth = 3;
      this.ctx.strokeText(message.text, message.x, message.y);
      this.ctx.fillText(message.text, message.x, message.y);
      this.ctx.restore();
    });
  }
    
  /**
     * Render streak indicator
     */
  renderStreakIndicator() {
    if (this.streakCount > 0) {
      const text = `Streak: ${this.streakCount}`;
      this.ctx.save();
      this.ctx.font = 'bold 20px Arial';
      this.ctx.fillStyle = this.themeColors.warning;
      this.ctx.textAlign = 'right';
      this.ctx.fillText(text, this.canvas.width - 20, 40);
            
      // Add fire emoji for high streaks
      if (this.streakCount >= 5) {
        this.ctx.font = '24px Arial';
        this.ctx.fillText('🔥', this.canvas.width - 20, 65);
      }
            
      this.ctx.restore();
    }
  }
    
  /**
     * Game over handling
     */
  onGameEnd() {
    // Calculate final stats
    const accuracy = this.round > 1 ? Math.round((this.score / (this.round * 100)) * 100) : 0;
    const finalStats = {
      score: this.score,
      rounds: this.round - 1,
      maxStreak: this.maxStreak,
      accuracy: accuracy,
      difficulty: this.difficulty
    };
        
    console.log('Game Over Stats:', finalStats);
        
    // Update game info for template
    const gameInfoElement = document.getElementById('game-info');
    if (gameInfoElement) {
      gameInfoElement.innerHTML = `
                Rounds: ${finalStats.rounds} | 
                Max Streak: ${finalStats.maxStreak} | 
                Accuracy: ${finalStats.accuracy}%
            `;
    }
  }
    
  /**
     * Restart game
     */
  onRestart() {
    this.bubbles = [];
    this.particles = [];
    this.messageQueue = [];
    this.round = 1;
    this.streakCount = 0;
    this.maxStreak = 0;
    this.roundEnding = false;
    this.timeRemaining = this.settings.timeLimit;
    this.lives = 3;
        
    this.generateQuestion();
    this.spawnBubbles();
  }
    
  /**
     * Handle resize
     */
  onResize(width, height) {
    super.onResize(width, height);
        
    // Reposition bubbles if they exist and are properly initialized
    if (this.bubbles && this.bubbles.length > 0 && this.settings) {
      const spacing = width / (this.settings.bubbleCount + 1);
      const baseY = height - 80;
            
      this.bubbles.forEach((bubble, index) => {
        bubble.x = spacing * (index + 1);
        bubble.y = baseY;
      });
    }
  }
    
  /**
     * Cleanup
     */
  destroy() {
    super.destroy();
    this.bubbles = [];
    this.particles = [];
    this.messageQueue = [];
    this.bubbleCache.clear();
  }
}