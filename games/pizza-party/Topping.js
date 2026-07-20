// filepath: src/features/games/pizza-party/Topping.js

/**
 * Topping - Represents visual toppings for pizza slices
 */
export default class Topping {
  constructor(options = {}) {
    this.emoji = options.emoji || '🍄';
    this.name = options.name || 'Mushroom';
    this.color = options.color || '#8B4513';
    this.rarity = options.rarity || 'common'; // common, uncommon, rare, legendary

    // Position relative to slice center
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.size = options.size || 1;
    this.rotation = options.rotation || 0;

    // Animation properties
    this.animationOffset = Math.random() * Math.PI * 2;
    this.bobAmount = options.bobAmount || 2;
    this.bobSpeed = options.bobSpeed || 0.002;

    this.id = `topping-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update topping animation
   */
  update(deltaTime) {
    // Simple bobbing animation
    this.animationOffset += this.bobSpeed * deltaTime;
  }

  /**
   * Draw topping on canvas
   */
  draw(ctx, centerX, centerY, sliceRadius) {
    ctx.save();

    // Calculate position on slice
    const x = centerX + this.x * sliceRadius * 0.6;
    const y =
      centerY + this.y * sliceRadius * 0.6 + Math.sin(this.animationOffset) * this.bobAmount;

    // Apply rotation
    if (this.rotation) {
      ctx.translate(x, y);
      ctx.rotate(this.rotation);
      ctx.translate(-x, -y);
    }

    // Set font size based on slice size and topping size
    const fontSize = sliceRadius * 0.3 * this.size;
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add glow effect for rare toppings
    if (this.rarity === 'rare' || this.rarity === 'legendary') {
      ctx.shadowColor = this.rarity === 'legendary' ? '#FFD700' : '#FF6B6B';
      ctx.shadowBlur = 8;
    }

    // Draw topping emoji
    ctx.fillText(this.emoji, x, y);

    ctx.restore();
  }

  /**
   * Get topping rarity color
   */
  getRarityColor() {
    const colors = {
      common: '#8B8B8B',
      uncommon: '#4CAF50',
      rare: '#2196F3',
      legendary: '#FFD700',
    };
    return colors[this.rarity] || colors.common;
  }

  /**
   * Clone this topping
   */
  clone() {
    return new Topping({
      emoji: this.emoji,
      name: this.name,
      color: this.color,
      rarity: this.rarity,
      x: this.x,
      y: this.y,
      size: this.size,
      rotation: this.rotation,
      bobAmount: this.bobAmount,
      bobSpeed: this.bobSpeed,
    });
  }

  /**
   * Create random topping
   */
  static createRandom() {
    const toppings = [
      { emoji: '🍄', name: 'Mushroom', rarity: 'common' },
      { emoji: '🧀', name: 'Cheese', rarity: 'common' },
      { emoji: '🍅', name: 'Tomato', rarity: 'common' },
      { emoji: '🫒', name: 'Olive', rarity: 'common' },
      { emoji: '🥓', name: 'Bacon', rarity: 'uncommon' },
      { emoji: '🌶️', name: 'Pepper', rarity: 'uncommon' },
      { emoji: '🧄', name: 'Garlic', rarity: 'uncommon' },
      { emoji: '🧅', name: 'Onion', rarity: 'uncommon' },
      { emoji: '🍍', name: 'Pineapple', rarity: 'rare' },
      { emoji: '🦐', name: 'Shrimp', rarity: 'rare' },
      { emoji: '🥩', name: 'Steak', rarity: 'legendary' },
      { emoji: '🦞', name: 'Lobster', rarity: 'legendary' },
    ];

    const randomTopping = toppings[Math.floor(Math.random() * toppings.length)];

    return new Topping({
      emoji: randomTopping.emoji,
      name: randomTopping.name,
      rarity: randomTopping.rarity,
      x: (Math.random() - 0.5) * 0.8,
      y: (Math.random() - 0.5) * 0.8,
      size: 0.8 + Math.random() * 0.4,
      rotation: Math.random() * Math.PI * 2,
      bobSpeed: 0.001 + Math.random() * 0.002,
    });
  }

  /**
   * Get topping by name
   */
  static getByName(name) {
    const toppingMap = {
      mushroom: { emoji: '🍄', name: 'Mushroom', rarity: 'common' },
      cheese: { emoji: '🧀', name: 'Cheese', rarity: 'common' },
      tomato: { emoji: '🍅', name: 'Tomato', rarity: 'common' },
      olive: { emoji: '🫒', name: 'Olive', rarity: 'common' },
      bacon: { emoji: '🥓', name: 'Bacon', rarity: 'uncommon' },
      pepper: { emoji: '🌶️', name: 'Pepper', rarity: 'uncommon' },
      garlic: { emoji: '🧄', name: 'Garlic', rarity: 'uncommon' },
      onion: { emoji: '🧅', name: 'Onion', rarity: 'uncommon' },
      pineapple: { emoji: '🍍', name: 'Pineapple', rarity: 'rare' },
      shrimp: { emoji: '🦐', name: 'Shrimp', rarity: 'rare' },
      steak: { emoji: '🥩', name: 'Steak', rarity: 'legendary' },
      lobster: { emoji: '🦞', name: 'Lobster', rarity: 'legendary' },
    };

    const toppingData = toppingMap[name.toLowerCase()];
    if (!toppingData) return Topping.createRandom();

    return new Topping({
      emoji: toppingData.emoji,
      name: toppingData.name,
      rarity: toppingData.rarity,
      x: (Math.random() - 0.5) * 0.8,
      y: (Math.random() - 0.5) * 0.8,
      size: 0.8 + Math.random() * 0.4,
      rotation: Math.random() * Math.PI * 2,
    });
  }
}
