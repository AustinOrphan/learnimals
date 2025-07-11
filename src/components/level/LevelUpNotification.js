/**
 * LevelUpNotification.js
 * 
 * Component for displaying animated level-up celebrations and notifications
 */

import xpCalculator from '../../utils/xpCalculator.js';

class LevelUpNotification {
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
    this.container.className = 'level-notification-container';
    this.container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 11000;
      pointer-events: none;
    `;
    
    document.body.appendChild(this.container);
  }
  
  /**
   * Show level-up notification
   */
  show(levelData, options = {}) {
    const notification = {
      levelData,
      duration: options.duration || this.getDefaultDuration(levelData),
      sound: options.sound !== false,
      confetti: options.confetti !== false,
      rewards: options.rewards || [],
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
    
    const { levelData } = notification;
    
    // Create notification element
    const element = this.createNotificationElement(levelData, notification.rewards);
    this.container.appendChild(element);
    
    // Play sound effect
    if (notification.sound) {
      this.playSound(levelData.level);
    }
    
    // Show confetti for milestone levels
    if (notification.confetti && this.isMilestoneLevel(levelData.level)) {
      this.showConfetti(levelData.level);
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
  createNotificationElement(levelData, rewards) {
    const element = document.createElement('div');
    element.className = `level-notification ${this.getLevelClass(levelData.level)}`;
    
    const prestigeInfo = xpCalculator.getPrestigeInfo(levelData.level);
    const title = xpCalculator.getLevelTitle(levelData.level);
    
    element.innerHTML = `
      <div class="notification-content">
        <div class="notification-header">
          <span class="notification-title">Level Up!</span>
          <button class="notification-close">✕</button>
        </div>
        
        <div class="notification-body">
          <div class="level-display">
            <div class="level-icon">${this.getLevelIcon(levelData.level)}</div>
            <div class="level-number">${levelData.level}</div>
            ${prestigeInfo.stars > 0 ? `<div class="prestige-stars">${'★'.repeat(Math.min(prestigeInfo.stars, 5))}</div>` : ''}
          </div>
          
          <div class="level-info">
            <div class="level-title">${prestigeInfo.title || title}</div>
            <div class="level-subtitle">${this.getLevelSubtitle(levelData.level)}</div>
            ${this.getXPProgressHTML(levelData)}
            ${this.getRewardsHTML(rewards)}
          </div>
        </div>
        
        <div class="notification-footer">
          <span class="notification-hint">Click to continue</span>
        </div>
      </div>
      
      <div class="notification-effects">
        ${this.createEffectsHTML(levelData.level)}
      </div>
    `;
    
    // Close button functionality
    const closeBtn = element.querySelector('.notification-close');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideNotification(element, { levelData });
    });
    
    return element;
  }
  
  /**
   * Get level class for styling
   */
  getLevelClass(level) {
    if (level >= 100) return 'prestige';
    if (level >= 50) return 'legendary';
    if (level >= 25) return 'epic';
    if (level >= 10) return 'rare';
    return 'common';
  }
  
  /**
   * Get level icon based on level
   */
  getLevelIcon(level) {
    if (level >= 100) return '👑';
    if (level >= 75) return '🏆';
    if (level >= 50) return '🥇';
    if (level >= 25) return '🥈';
    if (level >= 10) return '🥉';
    if (level >= 5) return '⭐';
    return '🌟';
  }
  
  /**
   * Get level subtitle
   */
  getLevelSubtitle(level) {
    if (this.isMilestoneLevel(level)) {
      return this.getMilestoneMessage(level);
    }
    return 'Keep up the great work!';
  }
  
  /**
   * Check if level is a milestone
   */
  isMilestoneLevel(level) {
    const milestones = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100];
    return milestones.includes(level) || level % 100 === 0;
  }
  
  /**
   * Get milestone message
   */
  getMilestoneMessage(level) {
    if (level === 5) return 'You\'re getting the hang of this!';
    if (level === 10) return 'Double digits - amazing progress!';
    if (level === 25) return 'Quarter-century of learning!';
    if (level === 50) return 'Halfway to greatness!';
    if (level === 75) return 'You\'re almost legendary!';
    if (level === 100) return 'Welcome to prestige status!';
    if (level % 100 === 0) return `Prestige level ${Math.floor(level / 100)} achieved!`;
    return 'Milestone reached!';
  }
  
  /**
   * Get XP progress HTML
   */
  getXPProgressHTML(levelData) {
    return `
      <div class="xp-progress">
        <div class="xp-gained">+${levelData.xpGained || 0} XP</div>
        <div class="xp-bar">
          <div class="xp-fill" style="width: ${(levelData.progress || 0) * 100}%"></div>
        </div>
        <div class="xp-text">
          ${levelData.xpIntoLevel || 0} / ${levelData.xpForLevel || 100} XP
        </div>
      </div>
    `;
  }
  
  /**
   * Get rewards HTML
   */
  getRewardsHTML(rewards) {
    if (!rewards || rewards.length === 0) return '';
    
    return `
      <div class="level-rewards">
        <div class="rewards-title">Rewards Unlocked:</div>
        <div class="rewards-list">
          ${rewards.map(reward => `
            <div class="reward-item">
              <span class="reward-icon">${reward.icon}</span>
              <span class="reward-text">${reward.text}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  /**
   * Create effects HTML based on level
   */
  createEffectsHTML(level) {
    if (level >= 100) {
      return `
        <div class="sparkles prestige">
          ${Array.from({length: 20}, (_, i) => 
    `<div class="sparkle" style="animation-delay: ${i * 0.05}s;"></div>`
  ).join('')}
        </div>
        <div class="energy-burst prestige"></div>
        <div class="crown-effect"></div>
      `;
    }
    
    if (level >= 50) {
      return `
        <div class="sparkles legendary">
          ${Array.from({length: 15}, (_, i) => 
    `<div class="sparkle" style="animation-delay: ${i * 0.1}s;"></div>`
  ).join('')}
        </div>
        <div class="energy-burst legendary"></div>
      `;
    }
    
    if (level >= 25) {
      return `
        <div class="sparkles epic">
          ${Array.from({length: 10}, (_, i) => 
    `<div class="sparkle" style="animation-delay: ${i * 0.15}s;"></div>`
  ).join('')}
        </div>
        <div class="energy-burst epic"></div>
      `;
    }
    
    if (level >= 10) {
      return `
        <div class="sparkles rare">
          ${Array.from({length: 8}, (_, i) => 
    `<div class="sparkle" style="animation-delay: ${i * 0.2}s;"></div>`
  ).join('')}
        </div>
      `;
    }
    
    return '<div class="simple-glow"></div>';
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
        notification.callback(notification.levelData);
      }
    }, 500);
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
    }, 200);
  }
  
  /**
   * Get default duration based on level
   */
  getDefaultDuration(levelData) {
    const level = levelData.level;
    
    if (level >= 100) return 8000; // Prestige levels
    if (level >= 50) return 6000;  // Legendary levels
    if (this.isMilestoneLevel(level)) return 5000; // Milestones
    return 4000; // Regular levels
  }
  
  /**
   * Play sound effect
   */
  playSound(level) {
    // Create audio context if it doesn't exist
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API not supported');
        return;
      }
    }
    
    // Generate level-up sound
    const frequencies = this.getSoundFrequencies(level);
    const duration = 1.5;
    
    this.playTones(frequencies, duration);
  }
  
  /**
   * Get sound frequencies based on level
   */
  getSoundFrequencies(level) {
    if (level >= 100) {
      // Prestige: Major chord progression
      return [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    }
    if (level >= 50) {
      // Legendary: Triumph chord
      return [349.23, 440.00, 523.25]; // F4, A4, C5
    }
    if (this.isMilestoneLevel(level)) {
      // Milestone: Celebratory notes
      return [392.00, 523.25]; // G4, C5
    }
    
    // Regular level-up
    return [440.00, 554.37]; // A4, C#5
  }
  
  /**
   * Play multiple tones in sequence
   */
  playTones(frequencies, duration) {
    if (!this.audioContext) return;
    
    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
      oscillator.type = 'sine';
      
      // Volume envelope
      const startTime = this.audioContext.currentTime + index * 0.2;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
  }
  
  /**
   * Show confetti effect
   */
  showConfetti(level) {
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    confettiContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 10999;
      overflow: hidden;
    `;
    
    const numParticles = level >= 100 ? 80 : level >= 50 ? 60 : 40;
    const colors = this.getConfettiColors(level);
    
    for (let i = 0; i < numParticles; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti-particle';
      particle.style.cssText = `
        position: absolute;
        width: ${4 + Math.random() * 6}px;
        height: ${4 + Math.random() * 6}px;
        background-color: ${colors[Math.floor(Math.random() * colors.length)]};
        top: -10px;
        left: ${Math.random() * 100}vw;
        animation: confetti-fall ${3 + Math.random() * 3}s linear forwards;
        animation-delay: ${Math.random() * 1}s;
        border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
      `;
      
      confettiContainer.appendChild(particle);
    }
    
    document.body.appendChild(confettiContainer);
    
    setTimeout(() => {
      confettiContainer.remove();
    }, 6000);
  }
  
  /**
   * Get confetti colors based on level
   */
  getConfettiColors(level) {
    if (level >= 100) {
      return ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
    }
    if (level >= 50) {
      return ['#FFD700', '#FFA500', '#FF6347', '#32CD32', '#1E90FF', '#9370DB'];
    }
    if (level >= 25) {
      return ['#9B59B6', '#E74C3C', '#F39C12', '#27AE60'];
    }
    return ['#3498DB', '#E67E22', '#2ECC71', '#F1C40F'];
  }
  
  /**
   * Clear all notifications
   */
  clearAll() {
    this.notificationQueue = [];
    
    if (this.currentNotification) {
      const currentElement = this.container.querySelector('.level-notification');
      if (currentElement) {
        currentElement.remove();
      }
      this.finishNotification();
    }
  }
  
  /**
   * Check if notifications are enabled
   */
  isEnabled() {
    try {
      const preferences = localStorage.getItem('learnimals-preferences');
      if (preferences) {
        const prefs = JSON.parse(preferences);
        return prefs.levelNotifications !== false;
      }
    } catch (e) {
      console.warn('Error reading level notification preferences');
    }
    
    return true; // Default to enabled
  }
  
  /**
   * Static method to get singleton instance
   */
  static getInstance() {
    if (!LevelUpNotification.instance) {
      LevelUpNotification.instance = new LevelUpNotification();
    }
    return LevelUpNotification.instance;
  }
  
  /**
   * Static convenience method
   */
  static show(levelData, options = {}) {
    const instance = LevelUpNotification.getInstance();
    if (instance.isEnabled()) {
      instance.show(levelData, options);
    }
  }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  .level-notification {
    background: linear-gradient(135deg, var(--bg-card), var(--bg-secondary));
    border-radius: 16px;
    box-shadow: 0 16px 64px rgba(0, 0, 0, 0.4);
    opacity: 0;
    transform: scale(0.5) rotateY(90deg);
    transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    pointer-events: auto;
    cursor: pointer;
    min-width: 400px;
    max-width: 500px;
    overflow: hidden;
    position: relative;
    border: 2px solid var(--accent-primary);
  }
  
  .level-notification.show {
    opacity: 1;
    transform: scale(1) rotateY(0deg);
  }
  
  .level-notification.hide {
    opacity: 0;
    transform: scale(0.8) rotateY(-90deg);
    transition: all 0.5s ease-in;
  }
  
  .level-notification.prestige {
    background: linear-gradient(135deg, #FFD700, #FFA500);
    border-color: #FFD700;
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
  }
  
  .level-notification.legendary {
    background: linear-gradient(135deg, #9B59B6, #8E44AD);
    border-color: #9B59B6;
    box-shadow: 0 0 20px rgba(155, 89, 182, 0.4);
  }
  
  .level-notification.epic {
    background: linear-gradient(135deg, #E74C3C, #C0392B);
    border-color: #E74C3C;
    box-shadow: 0 0 15px rgba(231, 76, 60, 0.3);
  }
  
  .level-notification.rare {
    background: linear-gradient(135deg, #3498DB, #2980B9);
    border-color: #3498DB;
    box-shadow: 0 0 10px rgba(52, 152, 219, 0.3);
  }
  
  .notification-content {
    padding: 24px;
    position: relative;
    z-index: 2;
    color: white;
  }
  
  .notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .notification-title {
    font-weight: bold;
    font-size: 1.2rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  
  .notification-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    transition: all 0.2s ease;
  }
  
  .notification-close:hover {
    background-color: rgba(0, 0, 0, 0.2);
    color: white;
  }
  
  .notification-body {
    display: flex;
    gap: 24px;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .level-display {
    text-align: center;
    flex-shrink: 0;
  }
  
  .level-icon {
    font-size: 4rem;
    animation: level-bounce 0.8s ease-out;
    display: block;
    margin-bottom: 8px;
  }
  
  .level-number {
    font-size: 3rem;
    font-weight: bold;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    animation: level-number-pop 0.6s ease-out 0.2s both;
  }
  
  .prestige-stars {
    font-size: 1.5rem;
    color: #FFD700;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
    animation: star-twinkle 2s ease-in-out infinite;
  }
  
  .level-info {
    flex: 1;
  }
  
  .level-title {
    font-size: 1.4rem;
    font-weight: bold;
    margin-bottom: 8px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  
  .level-subtitle {
    font-size: 1rem;
    opacity: 0.9;
    margin-bottom: 16px;
  }
  
  .xp-progress {
    margin-bottom: 16px;
  }
  
  .xp-gained {
    font-weight: bold;
    color: #FFD700;
    margin-bottom: 8px;
    text-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
  }
  
  .xp-bar {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    height: 8px;
    overflow: hidden;
    margin-bottom: 4px;
  }
  
  .xp-fill {
    background: linear-gradient(90deg, #4ECDC4, #44A08D);
    height: 100%;
    border-radius: 12px;
    transition: width 0.8s ease-out;
    animation: xp-glow 2s ease-in-out infinite;
  }
  
  .xp-text {
    font-size: 0.85rem;
    opacity: 0.8;
  }
  
  .level-rewards {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    padding: 12px;
  }
  
  .rewards-title {
    font-weight: bold;
    margin-bottom: 8px;
    font-size: 0.9rem;
  }
  
  .rewards-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .reward-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
  }
  
  .reward-icon {
    width: 20px;
    text-align: center;
  }
  
  .notification-footer {
    text-align: center;
  }
  
  .notification-hint {
    font-size: 0.8rem;
    opacity: 0.7;
  }
  
  @keyframes level-bounce {
    0% { transform: scale(0.3) rotate(-180deg); opacity: 0; }
    50% { transform: scale(1.2) rotate(-90deg); opacity: 1; }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }
  
  @keyframes level-number-pop {
    0% { transform: scale(0); opacity: 0; }
    80% { transform: scale(1.1); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  
  @keyframes star-twinkle {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(0.9); }
  }
  
  @keyframes xp-glow {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; box-shadow: 0 0 10px rgba(78, 205, 196, 0.6); }
  }
  
  @keyframes confetti-fall {
    to {
      transform: translateY(100vh) rotate(720deg);
      opacity: 0;
    }
  }
  
  @media (max-width: 768px) {
    .level-notification {
      min-width: 300px;
      max-width: calc(100vw - 40px);
    }
    
    .notification-body {
      gap: 16px;
    }
    
    .level-icon {
      font-size: 3rem;
    }
    
    .level-number {
      font-size: 2.5rem;
    }
    
    .level-title {
      font-size: 1.2rem;
    }
  }
`;
document.head.appendChild(style);

export default LevelUpNotification;