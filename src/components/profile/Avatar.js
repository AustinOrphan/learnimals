/**
 * Avatar.js
 * 
 * Avatar display component
 */

import { AvatarRenderer } from '../../features/profile/avatarSystem.js';
import logger from '../../utils/logger.js';

class Avatar {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.size = options.size || 200;
    this.interactive = options.interactive || false;
    this.showName = options.showName !== false;
    this.showLevel = options.showLevel !== false;
    this.onClick = options.onClick || null;
    
    this.canvas = null;
    this.renderer = null;
    this.avatarConfig = null;
    this.profile = null;
    
    this.init();
  }
  
  init() {
    if (!this.container) {
      logger.error(`Container ${this.containerId} not found`);
      return;
    }
    
    this.createStructure();
    this.setupCanvas();
  }
  
  createStructure() {
    this.container.className = 'avatar-container';
    this.container.innerHTML = `
      <div class="avatar-frame ${this.interactive ? 'interactive' : ''}">
        <canvas class="avatar-canvas" width="${this.size}" height="${this.size}"></canvas>
        <div class="avatar-effects"></div>
      </div>
      ${this.showName ? '<div class="avatar-name"></div>' : ''}
      ${this.showLevel ? '<div class="avatar-level"></div>' : ''}
    `;
    
    if (this.interactive && this.onClick) {
      this.container.querySelector('.avatar-frame').addEventListener('click', this.onClick);
    }
  }
  
  setupCanvas() {
    this.canvas = this.container.querySelector('.avatar-canvas');
    this.renderer = new AvatarRenderer(this.canvas);
  }
  
  /**
   * Update avatar with profile data
   */
  updateFromProfile(profile) {
    this.profile = profile;
    this.avatarConfig = profile.avatar;
    
    // Render avatar
    if (this.avatarConfig) {
      this.renderer.render(this.avatarConfig);
    }
    
    // Update name
    if (this.showName) {
      const nameEl = this.container.querySelector('.avatar-name');
      nameEl.textContent = profile.name;
      
      // Add title if selected
      if (profile.selectedTitle && profile.selectedTitle !== 'Learner') {
        nameEl.innerHTML = `
          <span class="avatar-title">${profile.selectedTitle}</span>
          <span class="avatar-username">${profile.name}</span>
        `;
      }
    }
    
    // Update level
    if (this.showLevel) {
      const levelEl = this.container.querySelector('.avatar-level');
      levelEl.innerHTML = `
        <span class="level-badge">Lv ${profile.level}</span>
      `;
      
      // Add prestige stars if applicable
      if (profile.level >= 100) {
        const prestige = Math.floor(profile.level / 100);
        let stars = '';
        for (let i = 0; i < prestige; i++) {
          stars += '⭐';
        }
        levelEl.innerHTML += `<span class="prestige-stars">${stars}</span>`;
      }
    }
    
    // Apply special effects
    this.applySpecialEffects();
    
    // Apply rarity glow based on level
    this.applyRarityGlow();
  }
  
  /**
   * Apply special effects based on accessories
   */
  applySpecialEffects() {
    const effectsContainer = this.container.querySelector('.avatar-effects');
    effectsContainer.innerHTML = '';
    
    if (!this.avatarConfig || !this.avatarConfig.accessories) return;
    
    this.avatarConfig.accessories.forEach(accessoryId => {
      switch (accessoryId) {
      case 'sparkles':
        this.addSparkleEffect(effectsContainer);
        break;
      case 'wings':
        this.addWingEffect(effectsContainer);
        break;
      case 'aura':
        this.addAuraEffect(effectsContainer);
        break;
      case 'stars':
        this.addStarEffect(effectsContainer);
        break;
      }
    });
  }
  
  addSparkleEffect(container) {
    for (let i = 0; i < 8; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'effect-sparkle';
      sparkle.style.animationDelay = `${i * 0.3}s`;
      sparkle.style.left = `${Math.random() * 100}%`;
      sparkle.style.top = `${Math.random() * 100}%`;
      container.appendChild(sparkle);
    }
  }
  
  addWingEffect(container) {
    const wings = document.createElement('div');
    wings.className = 'effect-wings';
    wings.innerHTML = `
      <div class="wing wing-left">👼</div>
      <div class="wing wing-right">👼</div>
    `;
    container.appendChild(wings);
  }
  
  addAuraEffect(container) {
    const aura = document.createElement('div');
    aura.className = 'effect-aura rainbow-aura';
    container.appendChild(aura);
  }
  
  addStarEffect(container) {
    for (let i = 0; i < 5; i++) {
      const star = document.createElement('div');
      star.className = 'effect-star orbiting';
      star.style.animationDelay = `${i * 0.5}s`;
      star.textContent = '⭐';
      container.appendChild(star);
    }
  }
  
  /**
   * Apply rarity glow based on level
   */
  applyRarityGlow() {
    const frame = this.container.querySelector('.avatar-frame');
    
    // Remove existing glow classes
    frame.classList.remove('glow-common', 'glow-rare', 'glow-epic', 'glow-legendary');
    
    // Add glow based on level
    if (this.profile.level >= 50) {
      frame.classList.add('glow-legendary');
    } else if (this.profile.level >= 25) {
      frame.classList.add('glow-epic');
    } else if (this.profile.level >= 10) {
      frame.classList.add('glow-rare');
    } else {
      frame.classList.add('glow-common');
    }
  }
  
  /**
   * Animate level up
   */
  animateLevelUp() {
    const frame = this.container.querySelector('.avatar-frame');
    frame.classList.add('level-up-animation');
    
    // Create burst effect
    const burst = document.createElement('div');
    burst.className = 'level-up-burst';
    frame.appendChild(burst);
    
    // Remove after animation
    setTimeout(() => {
      frame.classList.remove('level-up-animation');
      burst.remove();
    }, 2000);
  }
  
  /**
   * Show achievement unlock
   */
  showAchievementUnlock(achievement) {
    const notification = document.createElement('div');
    notification.className = 'avatar-achievement-popup';
    notification.innerHTML = `
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-text">
        <div class="achievement-label">Unlocked!</div>
        <div class="achievement-name">${achievement.name}</div>
      </div>
    `;
    
    this.container.appendChild(notification);
    
    // Animate and remove
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
  
  /**
   * Set size
   */
  setSize(size) {
    this.size = size;
    this.canvas.width = size;
    this.canvas.height = size;
    this.renderer = new AvatarRenderer(this.canvas);
    
    if (this.avatarConfig) {
      this.renderer.render(this.avatarConfig);
    }
  }
  
  /**
   * Export avatar as image
   */
  exportImage() {
    return this.canvas.toDataURL('image/png');
  }
  
  /**
   * Add shake animation
   */
  shake() {
    const frame = this.container.querySelector('.avatar-frame');
    frame.classList.add('shake');
    setTimeout(() => frame.classList.remove('shake'), 500);
  }
  
  /**
   * Add bounce animation
   */
  bounce() {
    const frame = this.container.querySelector('.avatar-frame');
    frame.classList.add('bounce');
    setTimeout(() => frame.classList.remove('bounce'), 1000);
  }
}

// Static helper to create mini avatar
Avatar.createMini = function(container, profile, size = 40) {
  const miniContainer = document.createElement('div');
  miniContainer.className = 'avatar-mini';
  miniContainer.style.width = `${size}px`;
  miniContainer.style.height = `${size}px`;
  
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  
  const renderer = new AvatarRenderer(canvas);
  if (profile.avatar) {
    renderer.render(profile.avatar);
  }
  
  miniContainer.appendChild(canvas);
  
  if (container) {
    container.appendChild(miniContainer);
  }
  
  return miniContainer;
};

// Export
export default Avatar;