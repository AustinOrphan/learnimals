/**
 * avatarSystem.js
 * 
 * Avatar creation and customization system with animal themes
 */

// Avatar part categories
export const AVATAR_CATEGORIES = {
  BASE: 'base',
  COLOR: 'color',
  EYES: 'eyes',
  MOUTH: 'mouth',
  ACCESSORIES: 'accessories',
  BACKGROUND: 'background',
  SPECIAL: 'special'
};

// Avatar bases (animal characters matching our game characters)
export const AVATAR_BASES = {
  'lion': {
    id: 'lion',
    name: 'Leo the Lion',
    icon: '🦁',
    description: 'Brave and mathematical',
    unlocked: true
  },
  'owl': {
    id: 'owl',
    name: 'Sage the Owl',
    icon: '🦉',
    description: 'Wise and scientific',
    unlocked: true
  },
  'bunny': {
    id: 'bunny',
    name: 'Bella the Bunny',
    icon: '🐰',
    description: 'Creative and articulate',
    unlocked: true
  },
  'parrot': {
    id: 'parrot',
    name: 'Polly the Parrot',
    icon: '🦜',
    description: 'Colorful and artistic',
    unlocked: true
  },
  'cat': {
    id: 'cat',
    name: 'Cody the Cat',
    icon: '🐱',
    description: 'Clever and logical',
    unlocked: true
  },
  'panda': {
    id: 'panda',
    name: 'Peter the Panda',
    icon: '🐼',
    description: 'Peaceful and studious',
    requiresLevel: 10
  },
  'fox': {
    id: 'fox',
    name: 'Felix the Fox',
    icon: '🦊',
    description: 'Cunning and quick',
    requiresLevel: 20
  },
  'elephant': {
    id: 'elephant',
    name: 'Ellie the Elephant',
    icon: '🐘',
    description: 'Memory master',
    requiresLevel: 30
  },
  'dragon': {
    id: 'dragon',
    name: 'Drake the Dragon',
    icon: '🐉',
    description: 'Legendary learner',
    requiresLevel: 50
  }
};

// Color palettes
export const AVATAR_COLORS = {
  'default': { name: 'Natural', hex: '#8B6F47', unlocked: true },
  'blue': { name: 'Ocean Blue', hex: '#4A90E2', unlocked: true },
  'green': { name: 'Forest Green', hex: '#7ED321', unlocked: true },
  'purple': { name: 'Royal Purple', hex: '#9B59B6', unlocked: true },
  'red': { name: 'Crimson Red', hex: '#E74C3C', unlocked: true },
  'orange': { name: 'Sunset Orange', hex: '#F39C12', unlocked: true },
  'pink': { name: 'Bubblegum Pink', hex: '#FFB6C1', requiresLevel: 5 },
  'teal': { name: 'Mystic Teal', hex: '#16A085', requiresLevel: 15 },
  'gold': { name: 'Golden', hex: '#FFD700', requiresLevel: 25 },
  'rainbow': { name: 'Rainbow', hex: 'rainbow', requiresLevel: 40, special: true }
};

// Eye expressions
export const AVATAR_EYES = {
  'happy': { name: 'Happy', emoji: '😊', unlocked: true },
  'wink': { name: 'Winking', emoji: '😉', unlocked: true },
  'sleepy': { name: 'Sleepy', emoji: '😴', unlocked: true },
  'excited': { name: 'Excited', emoji: '🤩', unlocked: true },
  'cool': { name: 'Cool', emoji: '😎', requiresAchievement: 'style-master' },
  'heart': { name: 'Heart Eyes', emoji: '😍', requiresAchievement: 'love-learning' },
  'star': { name: 'Starry', emoji: '🌟', requiresLevel: 20 },
  'determined': { name: 'Determined', emoji: '😤', requiresAchievement: 'never-give-up' }
};

// Mouth expressions
export const AVATAR_MOUTHS = {
  'smile': { name: 'Smile', emoji: '🙂', unlocked: true },
  'grin': { name: 'Big Grin', emoji: '😀', unlocked: true },
  'laugh': { name: 'Laughing', emoji: '😄', unlocked: true },
  'tongue': { name: 'Silly', emoji: '😛', unlocked: true },
  'surprised': { name: 'Surprised', emoji: '😮', requiresLevel: 5 },
  'thinking': { name: 'Thinking', emoji: '🤔', requiresAchievement: 'deep-thinker' },
  'confident': { name: 'Confident', emoji: '😏', requiresLevel: 15 },
  'whistle': { name: 'Whistling', emoji: '😙', requiresAchievement: 'music-lover' }
};

// Accessories
export const AVATAR_ACCESSORIES = {
  // Headwear
  'glasses': { 
    name: 'Smart Glasses', 
    category: 'head', 
    icon: '👓',
    requiresLevel: 5 
  },
  'sunglasses': { 
    name: 'Cool Shades', 
    category: 'head', 
    icon: '🕶️',
    requiresAchievement: 'cool-kid' 
  },
  'hat': { 
    name: 'Scholar Hat', 
    category: 'head', 
    icon: '🎓',
    requiresLevel: 10 
  },
  'crown': { 
    name: 'Learning Crown', 
    category: 'head', 
    icon: '👑',
    requiresLevel: 25 
  },
  'headband': { 
    name: 'Focus Headband', 
    category: 'head', 
    icon: '🎯',
    requiresAchievement: 'focus-master' 
  },
  
  // Body accessories
  'cape': { 
    name: 'Hero Cape', 
    category: 'body', 
    icon: '🦸',
    requiresLevel: 15 
  },
  'scarf': { 
    name: 'Cozy Scarf', 
    category: 'body', 
    icon: '🧣',
    requiresAchievement: 'winter-warrior' 
  },
  'backpack': { 
    name: 'Adventure Pack', 
    category: 'body', 
    icon: '🎒',
    unlocked: true 
  },
  'medal': { 
    name: 'Champion Medal', 
    category: 'body', 
    icon: '🏅',
    requiresAchievement: 'champion' 
  },
  
  // Special effects
  'sparkles': { 
    name: 'Sparkle Effect', 
    category: 'effect', 
    icon: '✨',
    requiresLevel: 20 
  },
  'wings': { 
    name: 'Angel Wings', 
    category: 'effect', 
    icon: '👼',
    requiresLevel: 30 
  },
  'aura': { 
    name: 'Rainbow Aura', 
    category: 'effect', 
    icon: '🌈',
    requiresLevel: 40 
  },
  'stars': { 
    name: 'Orbiting Stars', 
    category: 'effect', 
    icon: '⭐',
    requiresLevel: 50 
  }
};

// Background themes
export const AVATAR_BACKGROUNDS = {
  'classroom': { name: 'Classroom', icon: '🏫', unlocked: true },
  'library': { name: 'Library', icon: '📚', unlocked: true },
  'playground': { name: 'Playground', icon: '🎪', unlocked: true },
  'nature': { name: 'Nature', icon: '🌳', requiresLevel: 5 },
  'space': { name: 'Space', icon: '🌌', requiresLevel: 10 },
  'underwater': { name: 'Underwater', icon: '🌊', requiresLevel: 15 },
  'clouds': { name: 'Sky High', icon: '☁️', requiresLevel: 20 },
  'rainbow': { name: 'Rainbow Land', icon: '🌈', requiresLevel: 30 },
  'galaxy': { name: 'Galaxy', icon: '🌠', requiresLevel: 50 }
};

// Avatar configuration class
export class AvatarConfiguration {
  constructor(config = {}) {
    this.base = config.base || 'lion';
    this.color = config.color || 'default';
    this.eyes = config.eyes || 'happy';
    this.mouth = config.mouth || 'smile';
    this.accessories = config.accessories || [];
    this.background = config.background || 'classroom';
  }
  
  /**
   * Check if avatar is valid based on unlocks
   */
  isValid(profile) {
    // Check base
    const base = AVATAR_BASES[this.base];
    if (!base) return false;
    if (base.requiresLevel && profile.level < base.requiresLevel) return false;
    
    // Check color
    const color = AVATAR_COLORS[this.color];
    if (!color) return false;
    if (color.requiresLevel && profile.level < color.requiresLevel) return false;
    
    // Check accessories
    for (const accessoryId of this.accessories) {
      const accessory = AVATAR_ACCESSORIES[accessoryId];
      if (!accessory) return false;
      if (accessory.requiresLevel && profile.level < accessory.requiresLevel) return false;
      if (accessory.requiresAchievement && !profile.unlockedAvatarItems.includes(accessoryId)) return false;
    }
    
    return true;
  }
  
  /**
   * Get locked items
   */
  getLockedItems(profile) {
    const locked = [];
    
    // Check all categories
    Object.entries(AVATAR_BASES).forEach(([id, item]) => {
      if (item.requiresLevel && profile.level < item.requiresLevel) {
        locked.push({
          type: 'base',
          id,
          item,
          requirement: `Level ${item.requiresLevel}`
        });
      }
    });
    
    Object.entries(AVATAR_COLORS).forEach(([id, item]) => {
      if (item.requiresLevel && profile.level < item.requiresLevel) {
        locked.push({
          type: 'color',
          id,
          item,
          requirement: `Level ${item.requiresLevel}`
        });
      }
    });
    
    Object.entries(AVATAR_ACCESSORIES).forEach(([id, item]) => {
      if (item.requiresLevel && profile.level < item.requiresLevel) {
        locked.push({
          type: 'accessory',
          id,
          item,
          requirement: `Level ${item.requiresLevel}`
        });
      } else if (item.requiresAchievement && !profile.unlockedAvatarItems.includes(id)) {
        locked.push({
          type: 'accessory',
          id,
          item,
          requirement: `Achievement: ${item.requiresAchievement}`
        });
      }
    });
    
    return locked;
  }
  
  /**
   * Export configuration
   */
  toJSON() {
    return {
      base: this.base,
      color: this.color,
      eyes: this.eyes,
      mouth: this.mouth,
      accessories: [...this.accessories],
      background: this.background
    };
  }
  
  /**
   * Create from JSON
   */
  static fromJSON(json) {
    return new AvatarConfiguration(json);
  }
}

// Avatar renderer for canvas
export class AvatarRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.size = Math.min(canvas.width, canvas.height);
  }
  
  /**
   * Render avatar to canvas
   */
  render(avatarConfig) {
    const ctx = this.ctx;
    
    // Clear canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw background
    this.drawBackground(avatarConfig.background);
    
    // Draw base animal
    this.drawBase(avatarConfig.base, avatarConfig.color);
    
    // Draw face
    this.drawEyes(avatarConfig.eyes);
    this.drawMouth(avatarConfig.mouth);
    
    // Draw accessories
    avatarConfig.accessories.forEach(accessoryId => {
      this.drawAccessory(accessoryId);
    });
  }
  
  drawBackground(backgroundId) {
    const bg = AVATAR_BACKGROUNDS[backgroundId];
    if (!bg) return;
    
    const ctx = this.ctx;
    const size = this.size;
    
    // Simple gradient backgrounds for now
    const gradients = {
      'classroom': ['#F5DEB3', '#D2691E'],
      'library': ['#8B4513', '#654321'],
      'playground': ['#87CEEB', '#98FB98'],
      'nature': ['#228B22', '#90EE90'],
      'space': ['#000080', '#191970'],
      'underwater': ['#006994', '#00CED1'],
      'clouds': ['#87CEEB', '#FFFFFF'],
      'rainbow': ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'],
      'galaxy': ['#0F0F3A', '#3A0F3A', '#3A0F0F']
    };
    
    const colors = gradients[backgroundId] || ['#FFFFFF', '#EEEEEE'];
    
    if (backgroundId === 'rainbow') {
      // Special rainbow gradient
      const gradient = ctx.createLinearGradient(0, 0, size, size);
      colors.forEach((color, i) => {
        gradient.addColorStop(i / (colors.length - 1), color);
      });
      ctx.fillStyle = gradient;
    } else {
      // Regular gradient
      const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(1, colors[1]);
      ctx.fillStyle = gradient;
    }
    
    ctx.fillRect(0, 0, size, size);
  }
  
  drawBase(baseId, colorId) {
    const base = AVATAR_BASES[baseId];
    const color = AVATAR_COLORS[colorId];
    if (!base || !color) return;
    
    const ctx = this.ctx;
    const size = this.size;
    const centerX = size / 2;
    const centerY = size / 2;
    
    // Set color
    if (color.special && color.hex === 'rainbow') {
      // Rainbow gradient
      const gradient = ctx.createLinearGradient(0, 0, size, 0);
      const rainbowColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
      rainbowColors.forEach((c, i) => {
        gradient.addColorStop(i / (rainbowColors.length - 1), c);
      });
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = color.hex;
    }
    
    // Draw simple shape based on animal (placeholder - would be replaced with actual graphics)
    ctx.beginPath();
    ctx.arc(centerX, centerY, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw ears/features based on animal type
    this.drawAnimalFeatures(baseId, centerX, centerY, size * 0.3);
  }
  
  drawAnimalFeatures(baseId, centerX, centerY, radius) {
    const ctx = this.ctx;
    
    switch (baseId) {
    case 'lion':
      // Draw mane
      ctx.strokeStyle = '#D2691E';
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
      ctx.stroke();
      break;
        
    case 'bunny':
      // Draw long ears
      ctx.beginPath();
      ctx.ellipse(centerX - radius * 0.5, centerY - radius, radius * 0.2, radius * 0.6, 0, 0, Math.PI * 2);
      ctx.ellipse(centerX + radius * 0.5, centerY - radius, radius * 0.2, radius * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
        
    case 'cat':
      // Draw triangular ears
      ctx.beginPath();
      ctx.moveTo(centerX - radius * 0.8, centerY - radius * 0.6);
      ctx.lineTo(centerX - radius * 0.5, centerY - radius);
      ctx.lineTo(centerX - radius * 0.2, centerY - radius * 0.6);
      ctx.closePath();
      ctx.fill();
        
      ctx.beginPath();
      ctx.moveTo(centerX + radius * 0.8, centerY - radius * 0.6);
      ctx.lineTo(centerX + radius * 0.5, centerY - radius);
      ctx.lineTo(centerX + radius * 0.2, centerY - radius * 0.6);
      ctx.closePath();
      ctx.fill();
      break;
    }
  }
  
  drawEyes(eyesId) {
    const eyes = AVATAR_EYES[eyesId];
    if (!eyes) return;
    
    const ctx = this.ctx;
    const size = this.size;
    const centerX = size / 2;
    const centerY = size / 2;
    
    // Draw simple eyes (placeholder)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX - size * 0.1, centerY - size * 0.05, size * 0.03, 0, Math.PI * 2);
    ctx.arc(centerX + size * 0.1, centerY - size * 0.05, size * 0.03, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawMouth(mouthId) {
    const mouth = AVATAR_MOUTHS[mouthId];
    if (!mouth) return;
    
    const ctx = this.ctx;
    const size = this.size;
    const centerX = size / 2;
    const centerY = size / 2;
    
    // Draw simple mouth (placeholder)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY + size * 0.05, size * 0.1, 0, Math.PI);
    ctx.stroke();
  }
  
  drawAccessory(accessoryId) {
    const accessory = AVATAR_ACCESSORIES[accessoryId];
    if (!accessory) return;
    
    // Placeholder - would draw actual accessory graphics
    // For now, just add the icon as text
    const ctx = this.ctx;
    const size = this.size;
    
    ctx.font = `${size * 0.15}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const x = size / 2;
    let y = size / 2;
    
    switch (accessory.category) {
    case 'head':
      y = size * 0.2;
      break;
    case 'body':
      y = size * 0.7;
      break;
    case 'effect':
      // Draw around avatar
      ctx.globalAlpha = 0.7;
      break;
    }
    
    ctx.fillText(accessory.icon, x, y);
    ctx.globalAlpha = 1;
  }
  
  /**
   * Export avatar as data URL
   */
  toDataURL() {
    return this.canvas.toDataURL('image/png');
  }
}

// Helper functions
export function getUnlockedItems(profile) {
  const unlocked = {
    bases: [],
    colors: [],
    eyes: [],
    mouths: [],
    accessories: [],
    backgrounds: []
  };
  
  // Check bases
  Object.entries(AVATAR_BASES).forEach(([id, item]) => {
    if (item.unlocked || (item.requiresLevel && profile.level >= item.requiresLevel)) {
      unlocked.bases.push(id);
    }
  });
  
  // Check colors
  Object.entries(AVATAR_COLORS).forEach(([id, item]) => {
    if (item.unlocked || (item.requiresLevel && profile.level >= item.requiresLevel)) {
      unlocked.colors.push(id);
    }
  });
  
  // Check eyes
  Object.entries(AVATAR_EYES).forEach(([id, item]) => {
    if (item.unlocked || 
        (item.requiresLevel && profile.level >= item.requiresLevel) ||
        (item.requiresAchievement && profile.unlockedAvatarItems.includes(id))) {
      unlocked.eyes.push(id);
    }
  });
  
  // Check mouths
  Object.entries(AVATAR_MOUTHS).forEach(([id, item]) => {
    if (item.unlocked || 
        (item.requiresLevel && profile.level >= item.requiresLevel) ||
        (item.requiresAchievement && profile.unlockedAvatarItems.includes(id))) {
      unlocked.mouths.push(id);
    }
  });
  
  // Check accessories
  Object.entries(AVATAR_ACCESSORIES).forEach(([id, item]) => {
    if (item.unlocked || 
        (item.requiresLevel && profile.level >= item.requiresLevel) ||
        (item.requiresAchievement && profile.unlockedAvatarItems.includes(id))) {
      unlocked.accessories.push(id);
    }
  });
  
  // Check backgrounds
  Object.entries(AVATAR_BACKGROUNDS).forEach(([id, item]) => {
    if (item.unlocked || (item.requiresLevel && profile.level >= item.requiresLevel)) {
      unlocked.backgrounds.push(id);
    }
  });
  
  return unlocked;
}

export default {
  AVATAR_CATEGORIES,
  AVATAR_BASES,
  AVATAR_COLORS,
  AVATAR_EYES,
  AVATAR_MOUTHS,
  AVATAR_ACCESSORIES,
  AVATAR_BACKGROUNDS,
  AvatarConfiguration,
  AvatarRenderer,
  getUnlockedItems
};