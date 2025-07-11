/**
 * XPGainAnimation.js
 * 
 * Component for displaying floating XP gain animations during gameplay
 */

import xpCalculator from '../../utils/xpCalculator.js';

class XPGainAnimation {
  constructor() {
    this.animationQueue = [];
    this.activeAnimations = new Set();
    this.createStyles();
  }
  
  /**
   * Show XP gain animation
   * @param {number} xpAmount - Amount of XP gained
   * @param {Object} options - Animation options
   */
  show(xpAmount, options = {}) {
    const config = {
      xpAmount,
      target: options.target || document.body,
      position: options.position || { x: 50, y: 50 }, // Percentage from top-left
      type: options.type || 'gain', // gain, bonus, penalty, total
      delay: options.delay || 0,
      duration: options.duration || 2000,
      sound: options.sound !== false,
      color: options.color || this.getXPColor(options.type, xpAmount),
      fontSize: options.fontSize || this.getFontSize(xpAmount),
      animation: options.animation || 'float-up' // float-up, bounce, fade-in
    };
    
    if (config.delay > 0) {
      setTimeout(() => this.createAnimation(config), config.delay);
    } else {
      this.createAnimation(config);
    }
  }
  
  /**
   * Show XP breakdown with staggered animations
   * @param {Object} xpBreakdown - XP breakdown from xpCalculator
   * @param {Object} options - Animation options
   */
  showBreakdown(xpBreakdown, options = {}) {
    const events = xpCalculator.getXPEventDescriptions(xpBreakdown);
    const baseDelay = options.baseDelay || 0;
    const staggerDelay = options.staggerDelay || 300;
    
    events.forEach((event, index) => {
      if (event.type === 'total') return; // Skip total for breakdown
      
      const xpValue = parseInt(event.value.replace('+', ''));
      if (xpValue <= 0) return;
      
      this.show(xpValue, {
        ...options,
        type: event.type,
        delay: baseDelay + (index * staggerDelay),
        target: options.target
      });
    });
    
    // Show total with bigger emphasis
    if (options.showTotal !== false) {
      this.show(xpBreakdown.total, {
        ...options,
        type: 'total',
        delay: baseDelay + (events.length * staggerDelay),
        fontSize: 'large',
        animation: 'bounce'
      });
    }
  }
  
  /**
   * Create and animate XP element
   * @param {Object} config - Animation configuration
   */
  createAnimation(config) {
    const element = this.createElement(config);
    const targetRect = this.getTargetRect(config.target);
    
    // Position element
    const startX = targetRect.left + (targetRect.width * config.position.x / 100);
    const startY = targetRect.top + (targetRect.height * config.position.y / 100);
    
    element.style.left = `${startX}px`;
    element.style.top = `${startY}px`;
    
    document.body.appendChild(element);
    this.activeAnimations.add(element);
    
    // Play sound
    if (config.sound) {
      this.playSound(config.type, config.xpAmount);
    }
    
    // Start animation
    this.animateElement(element, config);
    
    // Clean up after animation
    setTimeout(() => {
      this.removeAnimation(element);
    }, config.duration + 500);
  }
  
  /**
   * Create XP animation element
   * @param {Object} config - Configuration object
   * @returns {HTMLElement} Created element
   */
  createElement(config) {
    const element = document.createElement('div');
    element.className = `xp-animation xp-${config.type} xp-${config.animation}`;
    
    // Format XP text
    const sign = config.xpAmount >= 0 ? '+' : '';
    const text = config.type === 'total' ? `${sign}${config.xpAmount} XP` : `${sign}${config.xpAmount}`;
    
    element.innerHTML = `
      <div class="xp-text" style="color: ${config.color}; font-size: ${config.fontSize};">
        ${text}
      </div>
      ${this.getEffectHTML(config)}
    `;
    
    return element;
  }
  
  /**
   * Get effect HTML based on XP amount and type
   * @param {Object} config - Configuration object
   * @returns {string} Effect HTML
   */
  getEffectHTML(config) {
    if (config.type === 'total' && config.xpAmount >= 50) {
      // Big XP gains get sparkle effects
      return `
        <div class="xp-sparkles">
          ${Array.from({length: 6}, (_, i) => 
    `<div class="sparkle" style="animation-delay: ${i * 0.1}s;"></div>`
  ).join('')}
        </div>
      `;
    }
    
    if (config.type === 'special' || config.xpAmount >= 25) {
      // Medium XP gains get glow effect
      return '<div class="xp-glow"></div>';
    }
    
    return '';
  }
  
  /**
   * Animate element based on animation type
   * @param {HTMLElement} element - Element to animate
   * @param {Object} config - Configuration object
   */
  animateElement(element, config) {
    setTimeout(() => {
      element.classList.add('animate');
      
      // Add special effects for high XP
      if (config.xpAmount >= 100) {
        element.classList.add('mega-xp');
      } else if (config.xpAmount >= 50) {
        element.classList.add('big-xp');
      }
      
      // Add type-specific classes
      if (config.type === 'special') {
        element.classList.add('special-effect');
      }
    }, 50);
  }
  
  /**
   * Get target element's position
   * @param {HTMLElement|string} target - Target element or selector
   * @returns {DOMRect} Target rectangle
   */
  getTargetRect(target) {
    let element = target;
    
    if (typeof target === 'string') {
      element = document.querySelector(target);
    }
    
    if (!element || element === document.body) {
      // Default to center of screen
      return {
        left: window.innerWidth / 2,
        top: window.innerHeight / 2,
        width: 0,
        height: 0
      };
    }
    
    return element.getBoundingClientRect();
  }
  
  /**
   * Get XP color based on type and amount
   * @param {string} type - XP type
   * @param {number} amount - XP amount
   * @returns {string} Color value
   */
  getXPColor(type, amount) {
    switch (type) {
    case 'total':
      if (amount >= 100) return '#FFD700'; // Gold
      if (amount >= 50) return '#FF6B6B';  // Red
      return '#4ECDC4'; // Teal
        
    case 'special':
      return '#9B59B6'; // Purple
        
    case 'bonus':
      return '#F39C12'; // Orange
        
    case 'penalty':
      return '#E74C3C'; // Red
        
    default:
      return '#2ECC71'; // Green
    }
  }
  
  /**
   * Get font size based on XP amount
   * @param {number} amount - XP amount
   * @returns {string} Font size
   */
  getFontSize(amount) {
    if (amount >= 100) return '2.5rem';
    if (amount >= 50) return '2rem';
    if (amount >= 25) return '1.8rem';
    if (amount >= 10) return '1.5rem';
    return '1.2rem';
  }
  
  /**
   * Play sound effect
   * @param {string} type - XP type
   * @param {number} amount - XP amount
   */
  playSound(type, amount) {
    // Create audio context if it doesn't exist
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API not supported');
        return;
      }
    }
    
    const frequency = this.getSoundFrequency(type, amount);
    const duration = this.getSoundDuration(type, amount);
    
    this.playTone(frequency, duration);
  }
  
  /**
   * Get sound frequency based on type and amount
   * @param {string} type - XP type
   * @param {number} amount - XP amount
   * @returns {number} Frequency in Hz
   */
  getSoundFrequency(type, amount) {
    switch (type) {
    case 'total':
      if (amount >= 100) return 830.61; // G#5
      if (amount >= 50) return 659.25;  // E5
      return 523.25; // C5
        
    case 'special':
      return 783.99; // G5
        
    case 'bonus':
      return 622.25; // D#5
        
    case 'penalty':
      return 293.66; // D4
        
    default:
      return 440.00; // A4
    }
  }
  
  /**
   * Get sound duration
   * @param {string} type - XP type
   * @param {number} amount - XP amount
   * @returns {number} Duration in seconds
   */
  getSoundDuration(type, amount) {
    if (type === 'total' && amount >= 50) return 0.4;
    if (type === 'special') return 0.3;
    return 0.2;
  }
  
  /**
   * Play tone
   * @param {number} frequency - Frequency in Hz
   * @param {number} duration - Duration in seconds
   */
  playTone(frequency, duration) {
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = 'sine';
    
    // Volume envelope
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }
  
  /**
   * Remove animation element
   * @param {HTMLElement} element - Element to remove
   */
  removeAnimation(element) {
    if (this.activeAnimations.has(element)) {
      this.activeAnimations.delete(element);
      
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }
  }
  
  /**
   * Clear all active animations
   */
  clearAll() {
    this.activeAnimations.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    this.activeAnimations.clear();
  }
  
  /**
   * Create CSS styles
   */
  createStyles() {
    if (document.getElementById('xp-animation-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'xp-animation-styles';
    style.textContent = `
      .xp-animation {
        position: fixed;
        pointer-events: none;
        z-index: 9000;
        transform: translate(-50%, -50%);
        opacity: 0;
        transition: all 0.1s ease-out;
      }
      
      .xp-text {
        font-weight: bold;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        font-family: 'Comic Sans MS', cursive;
        white-space: nowrap;
        position: relative;
        z-index: 2;
      }
      
      .xp-animation.animate {
        opacity: 1;
      }
      
      .xp-float-up.animate {
        animation: xp-float-up 2s ease-out forwards;
      }
      
      .xp-bounce.animate {
        animation: xp-bounce 2s ease-out forwards;
      }
      
      .xp-fade-in.animate {
        animation: xp-fade-in 2s ease-out forwards;
      }
      
      .xp-animation.big-xp .xp-text {
        animation: xp-pulse 0.5s ease-out;
      }
      
      .xp-animation.mega-xp .xp-text {
        animation: xp-mega-pulse 0.8s ease-out;
      }
      
      .xp-animation.special-effect .xp-text {
        animation: xp-rainbow 2s ease-in-out;
      }
      
      .xp-glow {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.3), transparent);
        z-index: 1;
        animation: xp-glow-pulse 2s ease-out;
      }
      
      .xp-sparkles {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 120px;
        height: 120px;
        z-index: 1;
      }
      
      .sparkle {
        position: absolute;
        width: 4px;
        height: 4px;
        background-color: #FFD700;
        border-radius: 50%;
        animation: xp-sparkle 1.5s ease-out forwards;
      }
      
      .sparkle:nth-child(1) { top: 20%; left: 50%; }
      .sparkle:nth-child(2) { top: 50%; left: 80%; }
      .sparkle:nth-child(3) { top: 80%; left: 50%; }
      .sparkle:nth-child(4) { top: 50%; left: 20%; }
      .sparkle:nth-child(5) { top: 30%; left: 30%; }
      .sparkle:nth-child(6) { top: 70%; left: 70%; }
      
      @keyframes xp-float-up {
        0% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.5);
        }
        20% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1.1);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, -200%) scale(1);
        }
      }
      
      @keyframes xp-bounce {
        0% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.3) rotate(-10deg);
        }
        30% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1.2) rotate(5deg);
        }
        50% {
          transform: translate(-50%, -50%) scale(0.9) rotate(-2deg);
        }
        70% {
          transform: translate(-50%, -50%) scale(1.05) rotate(1deg);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, -150%) scale(1) rotate(0deg);
        }
      }
      
      @keyframes xp-fade-in {
        0% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.8);
        }
        30% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(1.2);
        }
      }
      
      @keyframes xp-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
      }
      
      @keyframes xp-mega-pulse {
        0% { transform: scale(0.5); }
        20% { transform: scale(1.3); }
        40% { transform: scale(1.1); }
        60% { transform: scale(1.2); }
        100% { transform: scale(1); }
      }
      
      @keyframes xp-rainbow {
        0% { color: #FF6B6B; }
        16% { color: #FF8E53; }
        32% { color: #FFD93D; }
        48% { color: #6BCF7F; }
        64% { color: #4D96FF; }
        80% { color: #9B59B6; }
        100% { color: #FF6B6B; }
      }
      
      @keyframes xp-glow-pulse {
        0% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.5);
        }
        50% {
          opacity: 0.6;
          transform: translate(-50%, -50%) scale(1.2);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(1.5);
        }
      }
      
      @keyframes xp-sparkle {
        0% {
          opacity: 0;
          transform: scale(0);
        }
        50% {
          opacity: 1;
          transform: scale(1);
        }
        100% {
          opacity: 0;
          transform: scale(0) translateY(-20px);
        }
      }
      
      @media (max-width: 768px) {
        .xp-text {
          font-size: 0.9em !important;
        }
        
        .xp-glow {
          width: 60px;
          height: 60px;
        }
        
        .xp-sparkles {
          width: 80px;
          height: 80px;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * Static helper methods
   */
  
  /**
   * Show quick XP gain (convenience method)
   * @param {number} amount - XP amount
   * @param {HTMLElement|string} target - Target element
   */
  static showQuick(amount, target = null) {
    const instance = XPGainAnimation.getInstance();
    instance.show(amount, { target });
  }
  
  /**
   * Show XP gain at specific coordinates
   * @param {number} amount - XP amount
   * @param {number} x - X coordinate (pixels)
   * @param {number} y - Y coordinate (pixels)
   */
  static showAt(amount, x, y) {
    const instance = XPGainAnimation.getInstance();
    const element = document.createElement('div');
    element.style.position = 'fixed';
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.width = '1px';
    element.style.height = '1px';
    element.style.pointerEvents = 'none';
    
    document.body.appendChild(element);
    
    instance.show(amount, { 
      target: element,
      position: { x: 0, y: 0 }
    });
    
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }, 3000);
  }
  
  /**
   * Get singleton instance
   */
  static getInstance() {
    if (!XPGainAnimation.instance) {
      XPGainAnimation.instance = new XPGainAnimation();
    }
    return XPGainAnimation.instance;
  }
}

export default XPGainAnimation;