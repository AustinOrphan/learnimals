/**
 * GameTemplateLoader - Loads and manages game templates
 * Handles template customization, game initialization, and UI management
 */
export default class GameTemplateLoader {
  constructor(gameConfig) {
    this.config = gameConfig;
    this.gameInstance = null;
    this.isInitialized = false;
    this.gameState = 'loading'; // loading, playing, paused, game-over
        
    // DOM elements
    this.elements = {};
        
    // Initialize the game template
    this.init();
  }
    
  /**
     * Initialize the game template
     */
  async init() {
    try {
      this.cacheElements();
      this.setupEventListeners();
      this.hideLoading();
      await this.loadGameScript();
      this.initializeGame();
      this.isInitialized = true;
      this.setState('playing');
    } catch (error) {
      console.error('Failed to initialize game template:', error);
      this.showError('Failed to load game. Please refresh and try again.');
    }
  }
    
  /**
     * Cache DOM elements for performance
     */
  cacheElements() {
    this.elements = {
      // Game container and content
      gameContainer: document.getElementById('game-container'),
      gameContent: document.getElementById('game-content'),
      gameCanvas: document.getElementById('gameCanvas'),
      gameLoading: document.getElementById('game-loading'),
      gameUIOverlay: document.getElementById('game-ui-overlay'),
            
      // Status and controls
      scoreValue: document.getElementById('score-value'),
      levelValue: document.getElementById('level-value'),
      gameInfo: document.getElementById('game-info'),
            
      // Control buttons
      pauseBtn: document.getElementById('pause-btn'),
      restartBtn: document.getElementById('restart-btn'),
      fullscreenBtn: document.getElementById('fullscreen-btn'),
      helpBtn: document.getElementById('help-btn'),
            
      // Instructions
      gameInstructions: document.getElementById('game-instructions'),
      howToPlayBtn: document.querySelector('.how-to-play-btn'),
      startGameBtn: document.querySelector('.start-game-btn'),
            
      // Modals
      pauseModal: document.getElementById('pause-modal'),
      gameOverModal: document.getElementById('game-over-modal'),
      instructionsModal: document.getElementById('instructions-modal'),
            
      // Modal buttons
      resumeBtn: document.querySelector('.resume-btn'),
      restartGameBtn: document.querySelector('.restart-game-btn'),
      quitGameBtn: document.querySelector('.quit-game-btn'),
      playAgainBtn: document.querySelector('.play-again-btn'),
      shareScoreBtn: document.querySelector('.share-score-btn'),
      backToMenuBtn: document.querySelector('.back-to-menu-btn'),
      startPlayingBtn: document.querySelector('.start-playing-btn'),
      modalCloses: document.querySelectorAll('.modal-close')
    };
  }
    
  /**
     * Set up event listeners for game controls
     */
  setupEventListeners() {
    // Control buttons
    if (this.elements.pauseBtn) {
      this.elements.pauseBtn.addEventListener('click', () => this.togglePause());
    }
        
    if (this.elements.restartBtn) {
      this.elements.restartBtn.addEventListener('click', () => this.restartGame());
    }
        
    if (this.elements.fullscreenBtn) {
      this.elements.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    }
        
    if (this.elements.helpBtn) {
      this.elements.helpBtn.addEventListener('click', () => this.showInstructions());
    }
        
    // Instructions
    if (this.elements.howToPlayBtn) {
      this.elements.howToPlayBtn.addEventListener('click', () => this.toggleInstructions());
    }
        
    if (this.elements.startGameBtn) {
      this.elements.startGameBtn.addEventListener('click', () => this.hideInstructions());
    }
        
    // Modal buttons
    if (this.elements.resumeBtn) {
      this.elements.resumeBtn.addEventListener('click', () => this.resumeGame());
    }
        
    if (this.elements.restartGameBtn) {
      this.elements.restartGameBtn.addEventListener('click', () => this.restartFromModal());
    }
        
    if (this.elements.quitGameBtn) {
      this.elements.quitGameBtn.addEventListener('click', () => this.quitGame());
    }
        
    if (this.elements.playAgainBtn) {
      this.elements.playAgainBtn.addEventListener('click', () => this.playAgain());
    }
        
    if (this.elements.shareScoreBtn) {
      this.elements.shareScoreBtn.addEventListener('click', () => this.shareScore());
    }
        
    if (this.elements.backToMenuBtn) {
      this.elements.backToMenuBtn.addEventListener('click', () => this.backToMenu());
    }
        
    if (this.elements.startPlayingBtn) {
      this.elements.startPlayingBtn.addEventListener('click', () => this.hideInstructionsModal());
    }
        
    // Modal close buttons
    this.elements.modalCloses.forEach(closeBtn => {
      closeBtn.addEventListener('click', (e) => {
        const modal = e.target.closest('.game-modal');
        this.hideModal(modal);
      });
    });
        
    // Keyboard controls
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
    // Modal backdrop clicks
    document.querySelectorAll('.game-modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideModal(modal);
        }
      });
    });
        
    // Fullscreen change detection
    document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
        
    // Visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.gameState === 'playing') {
        this.pauseGame();
      }
    });
        
    // Window blur/focus
    window.addEventListener('blur', () => {
      if (this.gameState === 'playing') {
        this.pauseGame();
      }
    });
  }
    
  /**
     * Load the game-specific script dynamically
     */
  async loadGameScript() {
    if (!this.config.gameScript || !this.config.gameClass) {
      throw new Error('Game script and class must be specified in config');
    }
        
    try {
      const gameModule = await import(this.config.gameScript);
      this.GameClass = gameModule.default || gameModule[this.config.gameClass];
            
      if (!this.GameClass) {
        throw new Error(`Game class '${this.config.gameClass}' not found in ${this.config.gameScript}`);
      }
    } catch (error) {
      console.error('Failed to load game script:', error);
      throw error;
    }
  }
    
  /**
     * Initialize the game instance
     */
  initializeGame() {
    if (!this.GameClass || !this.config.canvasId) {
      throw new Error('Game class or canvas ID not available');
    }
        
    try {
      // Create game instance with config options
      this.gameInstance = new this.GameClass(this.config.canvasId, {
        ...this.config,
        onScoreUpdate: (score) => this.updateScore(score),
        onLevelUpdate: (level) => this.updateLevel(level),
        onGameOver: (finalScore) => this.handleGameOver(finalScore),
        onPause: () => this.setState('paused'),
        onResume: () => this.setState('playing')
      });
            
      // Make game instance available globally for debugging
      if (typeof window !== 'undefined') {
        window.gameInstance = this.gameInstance;
      }
            
    } catch (error) {
      console.error('Failed to initialize game:', error);
      throw error;
    }
  }
    
  /**
     * Set the current game state
     */
  setState(newState) {
    const oldState = this.gameState;
    this.gameState = newState;
        
    // Update UI based on state
    if (this.elements.gameContainer) {
      this.elements.gameContainer.className = `game-container ${newState}`;
    }
        
    // Update pause button
    if (this.elements.pauseBtn) {
      const pauseIcon = this.elements.pauseBtn.querySelector('.btn-icon');
      const pauseText = this.elements.pauseBtn.querySelector('.btn-text');
            
      if (newState === 'paused') {
        this.elements.pauseBtn.classList.add('paused');
        if (pauseIcon) pauseIcon.textContent = '▶️';
        if (pauseText) pauseText.textContent = 'Resume';
      } else {
        this.elements.pauseBtn.classList.remove('paused');
        if (pauseIcon) pauseIcon.textContent = '⏸️';
        if (pauseText) pauseText.textContent = 'Pause';
      }
    }
        
    console.log(`Game state changed: ${oldState} → ${newState}`);
  }
    
  /**
     * Update score display
     */
  updateScore(score) {
    if (this.elements.scoreValue) {
      this.elements.scoreValue.textContent = score;
    }
  }
    
  /**
     * Update level display
     */
  updateLevel(level) {
    if (this.elements.levelValue) {
      this.elements.levelValue.textContent = level;
    }
  }
    
  /**
     * Handle game over
     */
  handleGameOver(finalScore) {
    this.setState('game-over');
        
    // Update final score in modal
    const finalScoreElement = document.getElementById('final-score');
    if (finalScoreElement) {
      finalScoreElement.textContent = finalScore;
    }
        
    // Update high score
    const highScore = this.getHighScore();
    const highScoreElement = document.getElementById('high-score');
    if (highScoreElement) {
      highScoreElement.textContent = highScore;
    }
        
    // Save high score if this is a new record
    if (finalScore > highScore) {
      this.saveHighScore(finalScore);
      this.showAchievement('New High Score!', `You scored ${finalScore} points!`);
    }
        
    // Show game over modal
    this.showModal(this.elements.gameOverModal);
  }
    
  /**
     * Game control methods
     */
  togglePause() {
    if (this.gameState === 'playing') {
      this.pauseGame();
    } else if (this.gameState === 'paused') {
      this.resumeGame();
    }
  }
    
  pauseGame() {
    if (this.gameInstance && typeof this.gameInstance.pause === 'function') {
      this.gameInstance.pause();
    }
    this.setState('paused');
    this.showModal(this.elements.pauseModal);
  }
    
  resumeGame() {
    if (this.gameInstance && typeof this.gameInstance.resume === 'function') {
      this.gameInstance.resume();
    }
    this.setState('playing');
    this.hideModal(this.elements.pauseModal);
  }
    
  restartGame() {
    if (this.gameInstance && typeof this.gameInstance.restart === 'function') {
      this.gameInstance.restart();
    } else {
      // Reinitialize if no restart method
      this.initializeGame();
    }
    this.setState('playing');
    this.updateScore(0);
    this.updateLevel(1);
  }
    
  restartFromModal() {
    this.hideAllModals();
    this.restartGame();
  }
    
  playAgain() {
    this.hideAllModals();
    this.restartGame();
  }
    
  quitGame() {
    this.hideAllModals();
    this.backToMenu();
  }
    
  backToMenu() {
    // Navigate back to subject page or main menu
    const referrer = document.referrer;
    if (referrer && referrer.includes(window.location.origin)) {
      window.location.href = referrer;
    } else {
      window.location.href = '/src/pages/index.html';
    }
  }
    
  /**
     * Fullscreen functionality
     */
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.elements.gameContainer.requestFullscreen().catch(err => {
        console.log('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }
    
  handleFullscreenChange() {
    const isFullscreen = !!document.fullscreenElement;
    if (this.elements.fullscreenBtn) {
      this.elements.fullscreenBtn.classList.toggle('active', isFullscreen);
      const icon = this.elements.fullscreenBtn.querySelector('.btn-icon');
      const text = this.elements.fullscreenBtn.querySelector('.btn-text');
            
      if (isFullscreen) {
        if (icon) icon.textContent = '⤡';
        if (text) text.textContent = 'Exit';
      } else {
        if (icon) icon.textContent = '⤢';
        if (text) text.textContent = 'Fullscreen';
      }
    }
  }
    
  /**
     * Instructions functionality
     */
  toggleInstructions() {
    const isHidden = this.elements.gameInstructions.getAttribute('aria-hidden') === 'true';
    if (isHidden) {
      this.showInstructionsPanel();
    } else {
      this.hideInstructions();
    }
  }
    
  showInstructionsPanel() {
    if (this.elements.gameInstructions) {
      this.elements.gameInstructions.setAttribute('aria-hidden', 'false');
    }
  }
    
  hideInstructions() {
    if (this.elements.gameInstructions) {
      this.elements.gameInstructions.setAttribute('aria-hidden', 'true');
    }
  }
    
  showInstructions() {
    this.showModal(this.elements.instructionsModal);
  }
    
  hideInstructionsModal() {
    this.hideModal(this.elements.instructionsModal);
  }
    
  /**
     * Modal management
     */
  showModal(modal) {
    if (modal) {
      modal.setAttribute('aria-hidden', 'false');
      modal.style.display = 'flex';
            
      // Focus management
      const focusableElement = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusableElement) {
        focusableElement.focus();
      }
            
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }
  }
    
  hideModal(modal) {
    if (modal) {
      modal.setAttribute('aria-hidden', 'true');
      modal.style.display = 'none';
            
      // Restore body scroll
      document.body.style.overflow = '';
            
      // Resume game if paused by modal
      if (this.gameState === 'paused' && modal === this.elements.pauseModal) {
        this.resumeGame();
      }
    }
  }
    
  hideAllModals() {
    document.querySelectorAll('.game-modal').forEach(modal => {
      this.hideModal(modal);
    });
  }
    
  /**
     * Keyboard controls
     */
  handleKeyboard(e) {
    switch (e.code) {
    case 'Space':
      e.preventDefault();
      this.togglePause();
      break;
    case 'Escape':
      e.preventDefault();
      if (document.querySelector('.game-modal[aria-hidden="false"]')) {
        this.hideAllModals();
      } else {
        this.pauseGame();
      }
      break;
    case 'KeyR':
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        this.restartGame();
      }
      break;
    case 'F11':
      e.preventDefault();
      this.toggleFullscreen();
      break;
    }
  }
    
  /**
     * High score management
     */
  getHighScore() {
    const key = `${this.config.gameTitle}_highScore`;
    return parseInt(localStorage.getItem(key) || '0', 10);
  }
    
  saveHighScore(score) {
    const key = `${this.config.gameTitle}_highScore`;
    localStorage.setItem(key, score.toString());
  }
    
  /**
     * Achievement system
     */
  showAchievement(title, description) {
    const achievementSection = document.getElementById('achievement-section');
    if (achievementSection) {
      achievementSection.innerHTML = `
                <div class="achievement-badge">🏆</div>
                <h3 class="achievement-title">${title}</h3>
                <p class="achievement-description">${description}</p>
            `;
      achievementSection.classList.remove('hidden');
    }
  }
    
  /**
     * Share score functionality
     */
  shareScore() {
    const finalScore = document.getElementById('final-score')?.textContent || '0';
    const shareText = `I just scored ${finalScore} points in ${this.config.gameTitle} on Learnimals! 🎮`;
        
    if (navigator.share) {
      navigator.share({
        title: this.config.gameTitle,
        text: shareText,
        url: window.location.href
      }).catch(err => console.log('Share failed:', err));
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText).then(() => {
        this.showTemporaryMessage('Score copied to clipboard!');
      }).catch(() => {
        console.log('Share not supported');
      });
    }
  }
    
  /**
     * Utility methods
     */
  hideLoading() {
    if (this.elements.gameLoading) {
      this.elements.gameLoading.classList.add('hidden');
    }
  }
    
  showError(message) {
    if (this.elements.gameLoading) {
      const loadingText = this.elements.gameLoading.querySelector('.loading-text');
      if (loadingText) {
        loadingText.textContent = message;
        loadingText.style.color = 'var(--danger-color, #dc3545)';
      }
    }
  }
    
  showTemporaryMessage(message, duration = 3000) {
    // Create temporary message element
    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success-color, #28a745);
            color: white;
            padding: 1rem;
            border-radius: 8px;
            z-index: 1001;
            font-weight: 500;
        `;
        
    document.body.appendChild(messageEl);
        
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    }, duration);
  }
    
  /**
     * Cleanup method
     */
  destroy() {
    if (this.gameInstance && typeof this.gameInstance.destroy === 'function') {
      this.gameInstance.destroy();
    }
        
    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeyboard);
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
    this.gameInstance = null;
    this.isInitialized = false;
  }
}