
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
   */
  constructor({ x, y, radius, answer, isCorrect, bubbleBackground, ctx }) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.answer = answer;
    this.isCorrect = isCorrect;
    this.speed = Math.random() * 0.75 + 1; // Random speed for variety
    this.active = true;
    this.bubbleBackground = bubbleBackground;
    this.ctx = ctx;
  }
  
  /**
   * Draw the bubble on the canvas
   */
  draw() {
    // Draw pre-rendered bubble background for better performance
    this.ctx.drawImage(
      this.bubbleBackground,
      this.x - this.radius - 2, // Account for stroke width
      this.y - this.radius - 2
    );
    
    // Draw the answer text
this.ctx.fillStyle = this.textColor;
    this.ctx.font = "20px Comic Sans MS, Comic Sans, cursive";
    this.ctx.textAlign = "center";
    this.ctx.fillText(this.answer, this.x, this.y + 5);
  }
  
  /**
   * Update the bubble's position and state
   * @param {number} deltaTime - Time elapsed since last frame in ms
   */
  update(deltaTime) {
    // Time-based movement for consistent speed across devices
    this.y -= this.speed * (deltaTime / 16.67); // Normalized to ~60 FPS
    
    // Draw the bubble
    this.draw();
    
    // Mark as inactive if out of canvas
    if (this.y + this.radius < 0) {
      this.active = false;
    }
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
    return Math.sqrt(dx * dx + dy * dy) <= this.radius;
  }
}
