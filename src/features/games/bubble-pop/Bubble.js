
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
  }
  
  /**
   * Draw the bubble on the canvas
   */
  draw() {
    this.ctx.save();
    
    // Apply pulse scale if pulsing
    if (this.isPulsing) {
      this.ctx.translate(this.x, this.y);
      this.ctx.scale(this.pulseScale, this.pulseScale);
      this.ctx.translate(-this.x, -this.y);
    }
    
    // Apply remove animation opacity
    if (this.isRemoving) {
      this.ctx.globalAlpha = 1 - this.removeAnimation;
    }
    
    // Draw pre-rendered bubble background for better performance
    this.ctx.drawImage(
      this.bubbleBackground,
      this.x - this.radius - 2, // Account for stroke width
      this.y - this.radius - 2
    );
    
    // Draw the answer text with theme-aware color
    this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || 
                        getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim() || '#000';
    this.ctx.font = "20px Comic Sans MS, Comic Sans, cursive";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
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
      this.render();
      return;
    }
    
    // Original upward floating movement (like the original game)
    this.y -= this.speed * (deltaTime / 16.67); // Normalized to ~60 FPS
    
    // Pulse animation
    if (this.isPulsing) {
      this.pulseScale = 1 + Math.sin(Date.now() * this.pulseSpeed) * 0.2;
    }
    
    // Render the bubble
    this.render();
    
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
}
