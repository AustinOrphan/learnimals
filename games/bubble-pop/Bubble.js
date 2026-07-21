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
  constructor({
    x,
    y,
    radius,
    answer,
    isCorrect,
    bubbleBackground,
    ctx,
    floatSpeed = 1,
    color = '#007bff',
  }) {
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

    // Ensure proper rendering context
    this.ctx.globalCompositeOperation = 'source-over';

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
    if (this.bubbleBackground) {
      this.ctx.drawImage(
        this.bubbleBackground,
        this.x - this.radius - 2, // Account for stroke width
        this.y - this.radius - 2
      );
    }

    // Draw the answer number in bold white with a dark outline so it stays
    // legible on top of any vivid bubble color, in both light and dark themes.
    this.ctx.font = 'bold 26px Comic Sans MS, Comic Sans, cursive';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.lineWidth = 4;
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
    this.ctx.strokeText(String(this.answer), this.x, this.y);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(String(this.answer), this.x, this.y);

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

    // Float steadily upward and off the top of the canvas — the core mechanic
    // (pop the correct bubble before it drifts away). deltaTime is normalised to
    // ~60fps steps so the rise speed is frame-rate independent.
    const frames = deltaTime / 16.67;
    this.y -= this.speed * frames;

    // A little horizontal sway around the spawn column for character.
    if (this.baseX === undefined) this.baseX = this.x;
    this.bobTime = (this.bobTime || 0) + deltaTime;
    this.x = this.baseX + Math.sin(this.bobTime / 500 + this.floatOffset) * 6;

    // Deactivate once fully off the top so the game can score/advance the round.
    if (this.y < -this.radius) {
      this.active = false;
    }

    // Pulse animation
    if (this.isPulsing) {
      this.pulseScale = 1 + Math.sin(Date.now() * this.pulseSpeed) * 0.2;
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
