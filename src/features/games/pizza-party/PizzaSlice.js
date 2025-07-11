// filepath: src/features/games/pizza-party/PizzaSlice.js

/**
 * PizzaSlice - Represents a draggable pizza slice with fraction properties
 */
export default class PizzaSlice {
  constructor(options = {}) {
    // Fraction properties
    this.numerator = options.numerator || 1;
    this.denominator = options.denominator || 2;
    
    // Visual properties
    this.color = options.color || '#FF6B6B';
    this.topping = options.topping || '🍄';
    
    // Position and size
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.size = options.size || 60;
    this.originalPosition = { x: this.x, y: this.y };
    
    // Animation properties
    this.scale = 1;
    this.rotation = 0;
    this.startAngle = 0;
    
    // State properties
    this.isPlaced = false;
    this.isDragging = false;
    this.isHovered = false;
    this.isOverPizza = false;
    this.visible = true;
    
    // Generate unique ID
    this.id = `slice-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get the decimal value of this slice's fraction
   */
  getValue() {
    return this.numerator / this.denominator;
  }
  
  /**
   * Check if this slice is equivalent to another fraction
   */
  isEquivalent(numerator, denominator) {
    return this.getValue() === (numerator / denominator);
  }
  
  /**
   * Get a simplified version of this fraction
   */
  getSimplified() {
    const gcd = this.findGCD(this.numerator, this.denominator);
    return {
      numerator: this.numerator / gcd,
      denominator: this.denominator / gcd
    };
  }
  
  /**
   * Find the greatest common divisor
   */
  findGCD(a, b) {
    return b === 0 ? a : this.findGCD(b, a % b);
  }
  
  /**
   * Clone this slice
   */
  clone() {
    return new PizzaSlice({
      numerator: this.numerator,
      denominator: this.denominator,
      color: this.color,
      topping: this.topping,
      x: this.x,
      y: this.y,
      size: this.size
    });
  }
  
  /**
   * Reset slice to original position and state
   */
  reset() {
    this.x = this.originalPosition.x;
    this.y = this.originalPosition.y;
    this.scale = 1;
    this.rotation = 0;
    this.isPlaced = false;
    this.isDragging = false;
    this.isHovered = false;
    this.isOverPizza = false;
  }
  
  /**
   * Check if a point is inside this slice
   */
  containsPoint(x, y) {
    const distance = Math.sqrt(
      Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2)
    );
    return distance <= (this.size / 2) * this.scale;
  }
  
  /**
   * Get display text for this fraction
   */
  getDisplayText() {
    const simplified = this.getSimplified();
    return `${simplified.numerator}/${simplified.denominator}`;
  }
  
  /**
   * Get CSS color with opacity
   */
  getColorWithOpacity(opacity = 1) {
    const rgb = this.hexToRgb(this.color);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
  }
  
  /**
   * Convert hex color to RGB
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 107, b: 107 }; // Default red
  }
  
  /**
   * Animate to a new position
   */
  animateTo(x, y, duration = 600, onComplete = null) {
    const startX = this.x;
    const startY = this.y;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out elastic
      const easedProgress = this.easeOutElastic(progress);
      
      this.x = startX + (x - startX) * easedProgress;
      this.y = startY + (y - startY) * easedProgress;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else if (onComplete) {
        onComplete();
      }
    };
    
    animate();
  }
  
  /**
   * Elastic easing function
   */
  easeOutElastic(t) {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
}