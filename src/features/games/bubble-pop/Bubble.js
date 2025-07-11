
/**
 * Bubble class that represents a floating answer bubble in the game
 */
export default class Bubble {
  /**
   * Create a new Bubble
   * @param {Object} params - Bubble parameters
   * @param {number} params.x - X position
   * @param {number} params.y - Y position
   * @param {number} params.radius - Bubble radius
   * @param {number|string} params.answer - Answer text/number to display
   * @param {boolean} params.isCorrect - Whether this bubble contains the correct answer
   * @param {HTMLCanvasElement} params.bubbleBackground - Pre-rendered bubble background
   * @param {CanvasRenderingContext2D} params.ctx - Canvas context for drawing
   * @param {number} params.floatSpeed - Speed of floating movement (optional)
   * @param {string} params.color - Bubble color (optional)
   */
  constructor({ x, y, radius, answer, isCorrect, bubbleBackground, ctx, floatSpeed = 1, color = '#007bff' }) {
    this.x = x;
    this.y = y;
    this.originalY = y;
    this.radius = radius;
    this.answer = answer;
    this.isCorrect = isCorrect;
    this.speed = Math.random() * 0.75 + floatSpeed; // Random speed for variety
    this.floatSpeed = floatSpeed;
    this.active = true;
    this.bubbleBackground = bubbleBackground;
    this.ctx = ctx;
    this.color = color;
    
    // Animation properties
    this.pulseScale = 1;
    this.pulseSpeed = 0.05;
    this.isPulsing = false;
    this.removeAnimation = 0;
    this.isRemoving = false;
    
    // Floating animation
    this.floatOffset = Math.random() * Math.PI * 2;
    this.floatAmplitude = 15;
    this.floatTime = 0;
    
    // Enhanced animation properties
    this.wobbleAmount = 0;
    this.wobbleSpeed = 0.1;
    this.glowIntensity = 0;
    this.spawnAnimation = 0;
    this.isSpawning = true;
    this.shakeAmount = 0;
    this.shakeDecay = 0.9;
    
    // Particle trail effect
    this.trail = [];
    this.maxTrailLength = 5;
    this.lastTrailPosition = { x: this.x, y: this.y };
  }
  
  /**
   * Draw the bubble on the canvas
   */
  draw() {
    this.ctx.save();
    
    // Ensure proper rendering context
    this.ctx.globalCompositeOperation = 'source-over';
    
    // Draw trail effect for fast-moving bubbles
    if (this.trail.length > 0 && !this.isRemoving) {
      this.trail.forEach((pos, index) => {
        const alpha = (index / this.trail.length) * 0.3;
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = this.color;
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, this.radius * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
      });
      this.ctx.globalAlpha = 1;
    }
    
    // Apply transformations
    this.ctx.translate(this.x, this.y);
    
    // Apply spawn animation
    if (this.isSpawning) {
      const spawnScale = this.easeOutBack(this.spawnAnimation);
      this.ctx.scale(spawnScale, spawnScale);
      this.ctx.rotate(Math.PI * 2 * (1 - this.spawnAnimation));
    }
    
    // Apply pulse scale if pulsing
    if (this.isPulsing) {
      this.ctx.scale(this.pulseScale, this.pulseScale);
    }
    
    // Apply shake effect
    if (this.shakeAmount > 0) {
      const shakeX = (Math.random() - 0.5) * this.shakeAmount;
      const shakeY = (Math.random() - 0.5) * this.shakeAmount;
      this.ctx.translate(shakeX, shakeY);
    }
    
    // Apply wobble effect
    if (this.wobbleAmount > 0) {
      const wobble = Math.sin(this.floatTime * this.wobbleSpeed) * this.wobbleAmount;
      this.ctx.rotate(wobble);
    }
    
    // Apply remove animation opacity
    if (this.isRemoving) {
      this.ctx.globalAlpha = 1 - this.removeAnimation;
      this.ctx.scale(1 + this.removeAnimation * 0.5, 1 + this.removeAnimation * 0.5);
    }
    
    // Reset translation for drawing
    this.ctx.translate(-this.x, -this.y);
    
    // Draw glow effect for correct bubble
    if (this.glowIntensity > 0 && this.isCorrect) {
      const gradient = this.ctx.createRadialGradient(
        this.x, this.y, this.radius * 0.5,
        this.x, this.y, this.radius * 2
      );
      gradient.addColorStop(0, `rgba(76, 175, 80, ${this.glowIntensity * 0.3})`);
      gradient.addColorStop(1, 'rgba(76, 175, 80, 0)');
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Draw pre-rendered bubble background for better performance
    if (this.bubbleBackground) {
      this.ctx.drawImage(
        this.bubbleBackground,
        this.x - this.radius - 2, // Account for stroke width
        this.y - this.radius - 2
      );
    }
    
    // Draw the answer text with theme-aware color
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || 
                     getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim() || 
                     getComputedStyle(document.documentElement).getPropertyValue('--foreground-color').trim() || 
                     '#000';
    
    this.ctx.fillStyle = textColor;
    this.ctx.font = '20px Comic Sans MS, Comic Sans, cursive';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Add text shadow for better visibility in both light and dark modes
    this.ctx.shadowColor = textColor.includes('#fff') || textColor.includes('255, 255, 255') ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)';
    this.ctx.shadowBlur = 2;
    this.ctx.shadowOffsetX = 1;
    this.ctx.shadowOffsetY = 1;
    
    this.ctx.fillText(this.answer, this.x, this.y);
    
    this.ctx.restore();
  }
  
  /**
   * Update the bubble's position and state
   * @param {number} deltaTime - Time elapsed since last frame in ms
   */
  update(deltaTime) {
    // Handle remove animation
    if (this.isRemoving) {
      this.removeAnimation += 0.05;
      if (this.removeAnimation >= 1) {
        this.active = false;
      }
      return; // Don't continue with normal update
    }
    
    // Handle spawn animation
    if (this.isSpawning) {
      this.spawnAnimation += deltaTime / 300; // 300ms spawn duration
      if (this.spawnAnimation >= 1) {
        this.spawnAnimation = 1;
        this.isSpawning = false;
      }
    }
    
    // Update float time for animations
    this.floatTime += deltaTime / 1000;
    
    // Original upward floating movement with side-to-side wobble
    const wobbleX = Math.sin(this.floatTime + this.floatOffset) * this.floatAmplitude * 0.5;
    this.x += wobbleX * (deltaTime / 16.67) * 0.1;
    this.y -= this.speed * (deltaTime / 16.67); // Normalized to ~60 FPS
    
    // Update trail positions
    const distance = Math.sqrt(
      Math.pow(this.x - this.lastTrailPosition.x, 2) + 
      Math.pow(this.y - this.lastTrailPosition.y, 2)
    );
    
    if (distance > 10 && this.speed > 1.5) { // Only show trail for fast bubbles
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > this.maxTrailLength) {
        this.trail.shift();
      }
      this.lastTrailPosition = { x: this.x, y: this.y };
    }
    
    // Pulse animation
    if (this.isPulsing) {
      this.pulseScale = 1 + Math.sin(this.floatTime * this.pulseSpeed) * 0.2;
      this.glowIntensity = 0.5 + Math.sin(this.floatTime * this.pulseSpeed * 2) * 0.5;
    }
    
    // Update shake
    if (this.shakeAmount > 0) {
      this.shakeAmount *= this.shakeDecay;
      if (this.shakeAmount < 0.1) {
        this.shakeAmount = 0;
      }
    }
    
    // Mark as inactive if out of canvas (only if floating upward)
    if (this.y + this.radius < 0) {
      this.active = false;
    }
  }
  
  /**
   * Render the bubble (separated from update for better organization)
   */
  render() {
    this.draw();
  }
  
  /**
   * Start pulsing animation (used for hints)
   */
  pulse() {
    this.isPulsing = true;
  }
  
  /**
   * Stop pulsing animation
   */
  stopPulse() {
    this.isPulsing = false;
    this.pulseScale = 1;
  }
  
  /**
   * Start remove animation
   */
  remove() {
    this.isRemoving = true;
    this.removeAnimation = 0;
  }
  
  /**
   * Check if a point is within the bubble
   * @param {number} x - X coordinate to check
   * @param {number} y - Y coordinate to check
   * @returns {boolean} - True if point is inside bubble
   */
  containsPoint(x, y) {
    const dx = this.x - x;
    const dy = this.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const effectiveRadius = this.radius * (this.pulseScale || 1);
    return distance <= effectiveRadius;
  }
  
  /**
   * Apply easeOutBack easing function for bounce effect
   * @param {number} t - Progress value from 0 to 1
   * @returns {number} - Eased value
   */
  easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
  
  /**
   * Add shake effect to the bubble
   * @param {number} intensity - Shake intensity (default: 10)
   */
  shake(intensity = 10) {
    this.shakeAmount = intensity;
    this.shakeDecay = 0.9;
  }
  
  /**
   * Add wobble effect to the bubble
   * @param {number} amount - Wobble amount (default: 0.1)
   * @param {number} speed - Wobble speed (default: 0.15)
   */
  wobble(amount = 0.1, speed = 0.15) {
    this.wobbleAmount = amount;
    this.wobbleSpeed = speed;
  }
  
  /**
   * Set glow intensity for correct bubble highlighting
   * @param {number} intensity - Glow intensity from 0 to 1
   */
  setGlow(intensity) {
    this.glowIntensity = Math.max(0, Math.min(1, intensity));
  }
}
