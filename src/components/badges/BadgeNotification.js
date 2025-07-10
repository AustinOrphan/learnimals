/**
 * BadgeNotification.js
 * 
 * Component for displaying animated notifications when achievements are unlocked
 */

import { getBadgeByAchievementId, BADGE_RARITY } from '../../utils/badgeDefinitions.js';

class BadgeNotification {
  constructor() {
    this.notificationQueue = [];
    this.currentNotification = null;
    this.isShowing = false;
    
    this.createContainer();
  }
  
  /**
   * Create notification container
   */
  createContainer() {
    this.container = document.createElement('div');
    this.container.className = 'badge-notification-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    `;
    
    document.body.appendChild(this.container);
  }
  
  /**
   * Show achievement unlock notification
   */
  show(achievement, options = {}) {
    const notification = {
      achievement,
      duration: options.duration || this.getDefaultDuration(achievement),
      sound: options.sound !== false,
      confetti: options.confetti !== false,
      callback: options.callback || null
    };
    
    this.notificationQueue.push(notification);
    this.processQueue();
  }
  
  /**
   * Process notification queue
   */
  processQueue() {
    if (this.isShowing || this.notificationQueue.length === 0) {
      return;
    }
    
    const notification = this.notificationQueue.shift();
    this.showNotification(notification);
  }
  
  /**
   * Show individual notification
   */
  showNotification(notification) {
    this.isShowing = true;
    this.currentNotification = notification;
    
    const badge = getBadgeByAchievementId(notification.achievement.id);
    if (!badge) {
      console.warn(`No badge found for achievement: ${notification.achievement.id}`);
      this.finishNotification();
      return;
    }
    
    // Create notification element
    const element = this.createNotificationElement(badge, notification.achievement);
    this.container.appendChild(element);
    
    // Play sound effect
    if (notification.sound) {
      this.playSound(badge.rarity);
    }
    
    // Show confetti for rare badges
    if (notification.confetti && (badge.rarity === BADGE_RARITY.EPIC || badge.rarity === BADGE_RARITY.LEGENDARY)) {
      this.showConfetti(badge.rarity);
    }
    
    // Animate in
    setTimeout(() => {
      element.classList.add('show');
    }, 100);
    
    // Auto-hide after duration
    setTimeout(() => {
      this.hideNotification(element, notification);
    }, notification.duration);
    
    // Manual dismiss on click
    element.addEventListener('click', () => {
      this.hideNotification(element, notification);
    });
  }
  
  /**
   * Create notification element
   */
  createNotificationElement(badge, achievement) {
    const element = document.createElement('div');
    element.className = `badge-notification ${badge.rarity}`;
    
    element.innerHTML = `
      <div class="notification-content">
        <div class="notification-header">
          <span class="notification-title">Achievement Unlocked!</span>
          <button class="notification-close">✕</button>
        </div>
        
        <div class="notification-body">
          <div class="notification-badge">
            <div class="badge-icon ${badge.rarity}">${badge.icon}</div>
            <div class="badge-glow"></div>
          </div>
          
          <div class="notification-info">
            <div class="badge-name">${badge.name}</div>
            <div class="badge-description">${badge.description}</div>
            <div class="badge-rarity ${badge.rarity}">${badge.rarity.toUpperCase()}</div>
            ${badge.points ? `<div class="badge-points">+${badge.points} points</div>` : ''}
          </div>
        </div>
        
        <div class="notification-footer">
          <span class="notification-hint">Click to dismiss</span>
        </div>
      </div>
      
      <div class="notification-effects">
        ${this.createEffectsHTML(badge.rarity)}
      </div>
    `;
    
    // Close button functionality
    const closeBtn = element.querySelector('.notification-close');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideNotification(element, { achievement });
    });
    
    return element;
  }
  
  /**
   * Create effects HTML based on rarity
   */
  createEffectsHTML(rarity) {
    switch (rarity) {
    case BADGE_RARITY.LEGENDARY:
      return `
          <div class="sparkles legendary">
            ${Array.from({length: 12}, (_, i) => 
    `<div class="sparkle" style="animation-delay: ${i * 0.1}s;"></div>`
  ).join('')}
          </div>
          <div class="energy-burst legendary"></div>
        `;
      
    case BADGE_RARITY.EPIC:
      return `
          <div class="sparkles epic">
            ${Array.from({length: 8}, (_, i) => 
    `<div class="sparkle" style="animation-delay: ${i * 0.15}s;"></div>`
  ).join('')}
          </div>
          <div class="energy-burst epic"></div>
        `;
      
    case BADGE_RARITY.RARE:
      return `
          <div class="sparkles rare">
            ${Array.from({length: 6}, (_, i) => 
    `<div class="sparkle" style="animation-delay: ${i * 0.2}s;"></div>`
  ).join('')}
          </div>
        `;
      
    default:
      return '<div class="simple-glow"></div>';
    }
  }
  
  /**
   * Hide notification
   */
  hideNotification(element, notification) {
    element.classList.add('hide');
    
    setTimeout(() => {
      element.remove();
      this.finishNotification();
      
      if (notification.callback) {
        notification.callback(notification.achievement);
      }
    }, 300);
  }
  
  /**
   * Finish current notification and process next
   */
  finishNotification() {
    this.isShowing = false;
    this.currentNotification = null;
    
    // Process next in queue
    setTimeout(() => {
      this.processQueue();
    }, 500);
  }
  
  /**
   * Get default duration based on achievement rarity
   */
  getDefaultDuration(achievement) {
    const badge = getBadgeByAchievementId(achievement.id);
    if (!badge) return 4000;
    
    switch (badge.rarity) {
    case BADGE_RARITY.LEGENDARY:
      return 8000;
    case BADGE_RARITY.EPIC:
      return 6000;
    case BADGE_RARITY.RARE:
      return 5000;
    default:
      return 4000;
    }
  }
  
  /**
   * Play sound effect
   */
  playSound(rarity) {
    // Create audio context if it doesn't exist
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API not supported');
        return;
      }
    }
    
    // Generate sound based on rarity
    const frequency = this.getSoundFrequency(rarity);
    const duration = this.getSoundDuration(rarity);
    
    this.playTone(frequency, duration);
  }
  
  /**
   * Get sound frequency based on rarity
   */
  getSoundFrequency(rarity) {
    switch (rarity) {
    case BADGE_RARITY.LEGENDARY:
      return [523.25, 659.25, 783.99]; // C5, E5, G5 chord
    case BADGE_RARITY.EPIC:
      return [440, 554.37]; // A4, C#5
    case BADGE_RARITY.RARE:
      return [349.23, 440]; // F4, A4
    default:
      return [261.63]; // C4
    }
  }
  
  /**
   * Get sound duration based on rarity
   */
  getSoundDuration(rarity) {
    switch (rarity) {
    case BADGE_RARITY.LEGENDARY:
      return 1.5;
    case BADGE_RARITY.EPIC:
      return 1.0;
    case BADGE_RARITY.RARE:
      return 0.8;
    default:
      return 0.5;
    }
  }
  
  /**
   * Play tone(s)
   */
  playTone(frequencies, duration) {
    if (!this.audioContext) return;
    
    const freqArray = Array.isArray(frequencies) ? frequencies : [frequencies];
    
    freqArray.forEach((freq, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
      oscillator.type = 'sine';
      
      // Volume envelope
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
      
      oscillator.start(this.audioContext.currentTime + index * 0.1);
      oscillator.stop(this.audioContext.currentTime + duration + index * 0.1);
    });
  }
  
  /**
   * Show confetti effect
   */
  showConfetti(rarity) {
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    confettiContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9999;
      overflow: hidden;
    `;
    
    const numParticles = rarity === BADGE_RARITY.LEGENDARY ? 50 : 30;
    const colors = this.getConfettiColors(rarity);
    
    for (let i = 0; i < numParticles; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti-particle';
      particle.style.cssText = `
        position: absolute;
        width: 8px;
        height: 8px;
        background-color: ${colors[Math.floor(Math.random() * colors.length)]};
        top: -10px;
        left: ${Math.random() * 100}vw;
        animation: confetti-fall ${2 + Math.random() * 2}s linear forwards;
        animation-delay: ${Math.random() * 0.5}s;
      `;
      
      confettiContainer.appendChild(particle);
    }
    
    document.body.appendChild(confettiContainer);
    
    setTimeout(() => {
      confettiContainer.remove();
    }, 4000);
  }
  
  /**
   * Get confetti colors based on rarity
   */
  getConfettiColors(rarity) {
    switch (rarity) {
    case BADGE_RARITY.LEGENDARY:
      return ['#FFD700', '#FFA500', '#FF6347', '#FF1493', '#9370DB', '#00CED1'];
    case BADGE_RARITY.EPIC:
      return ['#9B59B6', '#8E44AD', '#E74C3C', '#C0392B'];
    default:
      return ['#3498DB', '#2980B9', '#E67E22', '#D35400'];
    }
  }
  
  /**
   * Clear all notifications
   */
  clearAll() {
    this.notificationQueue = [];
    
    if (this.currentNotification) {
      const currentElement = this.container.querySelector('.badge-notification');
      if (currentElement) {
        currentElement.remove();
      }
      this.finishNotification();
    }
  }
  
  /**
   * Show multiple achievements in sequence
   */
  showMultiple(achievements, options = {}) {
    const delay = options.delay || 1000;
    
    achievements.forEach((achievement, index) => {
      setTimeout(() => {
        this.show(achievement, options);
      }, index * delay);
    });
  }
  
  /**
   * Check if notifications are enabled (respects user preferences)
   */
  isEnabled() {
    // Check localStorage for user preferences
    try {
      const preferences = localStorage.getItem('learnimals-preferences');
      if (preferences) {
        const prefs = JSON.parse(preferences);
        return prefs.notifications !== false;
      }
    } catch (e) {
      console.warn('Error reading notification preferences');
    }
    
    return true; // Default to enabled
  }
  
  /**
   * Static method to get singleton instance
   */
  static getInstance() {
    if (!BadgeNotification.instance) {
      BadgeNotification.instance = new BadgeNotification();
    }
    return BadgeNotification.instance;
  }
  
  /**
   * Static convenience method
   */
  static show(achievement, options = {}) {
    const instance = BadgeNotification.getInstance();
    if (instance.isEnabled()) {
      instance.show(achievement, options);
    }
  }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  .badge-notification {
    background: linear-gradient(135deg, var(--bg-card), var(--bg-secondary));
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    margin-bottom: 16px;
    opacity: 0;
    transform: translateX(400px);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    pointer-events: auto;
    cursor: pointer;
    min-width: 320px;
    max-width: 400px;
    overflow: hidden;
    position: relative;
  }
  
  .badge-notification.show {
    opacity: 1;
    transform: translateX(0);
  }
  
  .badge-notification.hide {
    opacity: 0;
    transform: translateX(400px);
    transition: all 0.3s ease-in;
  }
  
  .notification-content {
    padding: 16px;
    position: relative;
    z-index: 2;
  }
  
  .notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .notification-title {
    font-weight: bold;
    color: var(--accent-primary);
    font-size: 0.9rem;
  }
  
  .notification-close {
    background: none;
    border: none;
    font-size: 1.2rem;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
  }
  
  .notification-close:hover {
    background-color: var(--bg-secondary);
    color: var(--text-primary);
  }
  
  .notification-body {
    display: flex;
    gap: 16px;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .notification-badge {
    position: relative;
    flex-shrink: 0;
  }
  
  .notification-badge .badge-icon {
    font-size: 3rem;
    animation: badge-bounce 0.6s ease-out;
  }
  
  .badge-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80px;
    height: 80px;
    border-radius: 50%;
    opacity: 0.3;
    animation: glow-pulse 2s ease-in-out infinite;
  }
  
  .badge-notification.common .badge-glow {
    background: radial-gradient(circle, #8D8D8D, transparent);
  }
  
  .badge-notification.rare .badge-glow {
    background: radial-gradient(circle, #4A90E2, transparent);
  }
  
  .badge-notification.epic .badge-glow {
    background: radial-gradient(circle, #9B59B6, transparent);
  }
  
  .badge-notification.legendary .badge-glow {
    background: radial-gradient(circle, #F39C12, transparent);
  }
  
  .notification-info {
    flex: 1;
  }
  
  .badge-name {
    font-weight: bold;
    color: var(--text-primary);
    margin-bottom: 4px;
  }
  
  .badge-description {
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.3;
    margin-bottom: 8px;
  }
  
  .badge-rarity {
    font-size: 0.75rem;
    font-weight: bold;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 3px;
    margin-bottom: 4px;
    display: inline-block;
  }
  
  .badge-rarity.common { background-color: #8D8D8D; color: white; }
  .badge-rarity.rare { background-color: #4A90E2; color: white; }
  .badge-rarity.epic { background-color: #9B59B6; color: white; }
  .badge-rarity.legendary { background-color: #F39C12; color: white; }
  
  .badge-points {
    font-size: 0.8rem;
    color: var(--accent-primary);
    font-weight: bold;
  }
  
  .notification-footer {
    text-align: center;
  }
  
  .notification-hint {
    font-size: 0.75rem;
    color: var(--text-secondary);
    opacity: 0.7;
  }
  
  @keyframes badge-bounce {
    0% { transform: scale(0.3) rotate(-180deg); }
    50% { transform: scale(1.1) rotate(-90deg); }
    100% { transform: scale(1) rotate(0deg); }
  }
  
  @keyframes glow-pulse {
    0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
    50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1); }
  }
  
  @keyframes confetti-fall {
    to {
      transform: translateY(100vh) rotate(720deg);
      opacity: 0;
    }
  }
  
  @media (max-width: 768px) {
    .badge-notification {
      min-width: 280px;
      max-width: calc(100vw - 40px);
    }
    
    .notification-body {
      gap: 12px;
    }
    
    .notification-badge .badge-icon {
      font-size: 2.5rem;
    }
  }
`;
document.head.appendChild(style);

export default BadgeNotification;