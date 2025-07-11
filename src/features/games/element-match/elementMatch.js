// Element Match Game for Learnimals
// An interactive science game where Sage the Owl teaches about chemical elements
// Enhanced with BaseGame framework for progress tracking, analytics, and mobile optimization
import logger from '../../../utils/logger.js';
import BaseGame from '../../../components/games/BaseGame.js';
import { getRandomElements, matchTypes } from './elementData.js';

class ElementMatchGame extends BaseGame {
  constructor(canvasId, options = {}) {
    // Initialize BaseGame with canvas mode
    super(canvasId, {
      gameType: 'element-match',
      subject: 'science',
      difficulty: options.difficulty || 'easy',
      enableProgressTracking: true,
      ...options
    });
    
    // Game-specific properties
    this.currentRound = 1;
    this.maxRounds = 5;
    this.currentMatchType = 'symbol';
    this.elementsToMatch = [];
    this.matchOptions = [];
    this.correctMatches = new Map();
    this.playerMatches = new Map();
    this.selectedCard = null;
    this.matchedPairs = new Set();
    
    // Difficulty-based settings
    this.elementsPerRound = this.getElementsPerRound();
    this.availableMatchTypes = this.getMatchTypesForDifficulty();
    
    // Visual elements
    this.cardWidth = 120;
    this.cardHeight = 80;
    this.cardSpacing = 20;
    this.sagePosition = { x: 0, y: 0 };
    this.sageAnimationFrame = 0;
    
    // Colors and styling
    this.colors = {
      background: '#2C3E50',
      cardBackground: '#ECF0F1',
      cardBorder: '#34495E',
      selectedCard: '#3498DB',
      correctMatch: '#2ECC71',
      incorrectMatch: '#E74C3C',
      text: '#2C3E50',
      sage: '#8E44AD',
      elementCard: '#FFFFFF',
      optionCard: '#F8F9FA'
    };
    
    // Animation states
    this.cardAnimations = new Map();
    this.matchLines = [];
    this.particles = [];
    this.connectionLines = new Map();
    this.atomicOrbitals = new Map();
    this.elementDiscoveryQueue = [];
    
    // Game state
    this.roundStartTime = null;
    this.matchAttempts = 0;
    this.hintsUsed = 0;
  }
  
  /**
   * Get number of elements per round based on difficulty
   */
  getElementsPerRound() {
    switch (this.difficulty) {
    case 'easy':
      return 4;
    case 'medium':
      return 6;
    case 'hard':
      return 8;
    default:
      return 4;
    }
  }
  
  /**
   * Get available match types for current difficulty
   */
  getMatchTypesForDifficulty() {
    switch (this.difficulty) {
    case 'easy':
      return ['symbol', 'property'];
    case 'medium':
      return ['symbol', 'property', 'use', 'atomicNumber'];
    case 'hard':
      return ['symbol', 'property', 'use', 'atomicNumber', 'type'];
    default:
      return ['symbol', 'property'];
    }
  }
  
  /**
   * Override BaseGame's onInitialized
   */
  onInitialized() {
    super.onInitialized();
    this.setupGameLayout();
    logger.debug('Element Match game initialized successfully');
  }
  
  /**
   * Override BaseGame's onStart
   */
  onStart() {
    super.onStart();
    this.startNewGame();
  }
  
  /**
   * Override BaseGame's onRestart
   */
  onRestart() {
    super.onRestart();
    this.currentRound = 1;
    this.currentMatchType = 'symbol';
    this.elementsToMatch = [];
    this.matchOptions = [];
    this.correctMatches.clear();
    this.playerMatches.clear();
    this.selectedCard = null;
    this.matchedPairs.clear();
    this.cardAnimations.clear();
    this.matchLines = [];
    this.particles = [];
    this.connectionLines.clear();
    this.atomicOrbitals.clear();
    this.elementDiscoveryQueue = [];
    this.roundStartTime = null;
    this.matchAttempts = 0;
    this.hintsUsed = 0;
  }
  
  /**
   * Setup game layout based on canvas size
   */
  setupGameLayout() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Position Sage in top-left corner
    this.sagePosition.x = 80;
    this.sagePosition.y = 80;
    
    // Calculate card layout
    const totalCardWidth = this.elementsPerRound * (this.cardWidth + this.cardSpacing) - this.cardSpacing;
    const startX = (width - totalCardWidth) / 2;
    
    this.elementCardsArea = {
      x: startX,
      y: height * 0.3,
      width: totalCardWidth,
      height: this.cardHeight
    };
    
    this.optionCardsArea = {
      x: startX,
      y: height * 0.65,
      width: totalCardWidth,
      height: this.cardHeight
    };
  }
  
  /**
   * Start a new game session
   */
  startNewGame() {
    this.currentRound = 1;
    this.generateNewRound();
  }
  
  /**
   * Generate a new matching round
   */
  generateNewRound() {
    if (this.currentRound > this.maxRounds) {
      this.gameOver();
      return;
    }
    
    this.updateLevel(this.currentRound);
    
    // Select match type for this round
    const matchTypeIndex = (this.currentRound - 1) % this.availableMatchTypes.length;
    this.currentMatchType = this.availableMatchTypes[matchTypeIndex];
    
    // Get random elements for this round
    this.elementsToMatch = getRandomElements(this.difficulty, this.elementsPerRound);
    
    // Generate match options
    this.generateMatchOptions();
    
    // Reset game state
    this.correctMatches.clear();
    this.playerMatches.clear();
    this.selectedCard = null;
    this.matchedPairs.clear();
    this.cardAnimations.clear();
    this.matchLines = [];
    this.particles = [];
    this.connectionLines.clear();
    this.atomicOrbitals.clear();
    this.elementDiscoveryQueue = [];
    this.matchAttempts = 0;
    this.roundStartTime = performance.now();
    
    // Setup correct matches
    this.setupCorrectMatches();
    
    logger.debug(`Round ${this.currentRound}: ${matchTypes[this.currentMatchType].name}`);
  }
  
  /**
   * Generate match options for current round
   */
  generateMatchOptions() {
    const matchType = matchTypes[this.currentMatchType];
    
    // Create answer options
    this.matchOptions = this.elementsToMatch.map(element => ({
      id: element.symbol,
      text: matchType.getAnswer(element),
      type: 'answer'
    }));
    
    // Shuffle the options
    this.matchOptions.sort(() => 0.5 - Math.random());
  }
  
  /**
   * Setup correct matches mapping
   */
  setupCorrectMatches() {
    const matchType = matchTypes[this.currentMatchType];
    
    this.elementsToMatch.forEach(element => {
      this.correctMatches.set(element.symbol, matchType.getAnswer(element));
    });
  }
  
  /**
   * Handle card selection
   */
  selectCard(cardId, cardType) {
    if (this.state !== 'playing') {
      return;
    }
    
    // If same card is selected, deselect it
    if (this.selectedCard && this.selectedCard.id === cardId && this.selectedCard.type === cardType) {
      this.addCardAnimation(cardId, cardType, 'deselect');
      this.selectedCard = null;
      return;
    }
    
    const newSelection = { id: cardId, type: cardType };
    
    // If no card is selected, select this one
    if (!this.selectedCard) {
      this.selectedCard = newSelection;
      this.addCardAnimation(cardId, cardType, 'select');
      
      // Add atomic orbital animation for elements
      if (cardType === 'element') {
        this.addAtomicOrbital(cardId);
      }
      return;
    }
    
    // If cards are of same type, replace selection
    if (this.selectedCard.type === cardType) {
      // Deselect previous card
      this.addCardAnimation(this.selectedCard.id, this.selectedCard.type, 'deselect');
      
      // Select new card
      this.selectedCard = newSelection;
      this.addCardAnimation(cardId, cardType, 'select');
      
      // Add atomic orbital for new element
      if (cardType === 'element') {
        this.addAtomicOrbital(cardId);
      }
      return;
    }
    
    // Attempt to match the cards
    this.attemptMatch(this.selectedCard, newSelection);
  }
  
  /**
   * Attempt to match two cards
   */
  attemptMatch(card1, card2) {
    this.matchAttempts++;
    
    // Determine which is element and which is answer
    const elementCard = card1.type === 'element' ? card1 : card2;
    const answerCard = card1.type === 'answer' ? card1 : card2;
    
    const isCorrect = this.correctMatches.get(elementCard.id) === answerCard.text;
    
    if (isCorrect) {
      // Correct match
      this.playerMatches.set(elementCard.id, answerCard.text);
      this.matchedPairs.add(elementCard.id);
      this.matchedPairs.add(answerCard.id);
      
      // Track correct answer
      this.trackCorrectAnswer({
        element: elementCard.id,
        matchType: this.currentMatchType,
        timeToMatch: performance.now() - this.roundStartTime,
        attempts: this.matchAttempts
      });
      
      // Add success animation
      this.addMatchAnimation(elementCard.id, answerCard.id, true);
      
      // Create animated connection line
      this.createConnectionLine(elementCard.id, answerCard.id);
      
      // Enhanced particle effects for correct match
      this.createEnhancedParticleEffect(elementCard.id, answerCard.id, 'success');
      
      // Play success sound
      this.playSound(600, 200, 'sine');
      
      // Haptic feedback
      if (this.hapticFeedback) {
        navigator.vibrate(50);
      }
      
      // Award points
      const basePoints = this.difficulty === 'easy' ? 25 : this.difficulty === 'medium' ? 35 : 50;
      const efficiencyBonus = Math.max(0, (5 - this.matchAttempts) * 5);
      this.addScore(basePoints + efficiencyBonus);
      
      // Check if round is complete
      if (this.playerMatches.size === this.elementsToMatch.length) {
        // Trigger round completion celebration
        this.celebrateRoundCompletion();
        
        setTimeout(() => {
          this.completeRound();
        }, 2000);
      }
    } else {
      // Incorrect match
      this.trackIncorrectAnswer({
        element: elementCard.id,
        attempted: answerCard.text,
        correct: this.correctMatches.get(elementCard.id),
        matchType: this.currentMatchType
      });
      
      // Add error animation
      this.addMatchAnimation(elementCard.id, answerCard.id, false);
      
      // Enhanced particle effects for incorrect match
      this.createEnhancedParticleEffect(elementCard.id, answerCard.id, 'error');
      
      // Play error sound
      this.playSound(200, 300, 'sawtooth');
      
      // Error haptic feedback
      if (this.hapticFeedback) {
        navigator.vibrate([100, 50, 100]);
      }
    }
    
    // Clear selection
    this.selectedCard = null;
  }
  
  /**
   * Add match animation
   */
  addMatchAnimation(elementId, answerId, isCorrect) {
    const animation = {
      elementId,
      answerId,
      isCorrect,
      startTime: performance.now(),
      duration: 1000
    };
    
    this.cardAnimations.set(`${elementId}-${answerId}`, animation);
    
    if (isCorrect) {
      // Add particle effect for correct match
      this.addParticleEffect(elementId, answerId);
    }
  }
  
  /**
   * Add card animation
   */
  addCardAnimation(cardId, cardType, animationType) {
    const animationKey = `${cardId}-${cardType}`;
    this.cardAnimations.set(animationKey, {
      cardId,
      cardType,
      type: animationType,
      startTime: performance.now(),
      duration: animationType === 'select' ? 300 : 200
    });
  }
  
  /**
   * Add atomic orbital animation for elements
   */
  addAtomicOrbital(elementId) {
    this.atomicOrbitals.set(elementId, {
      startTime: performance.now(),
      rotationSpeed: 0.02 + Math.random() * 0.01,
      radius: 30 + Math.random() * 20
    });
  }
  
  /**
   * Create animated connection line
   */
  createConnectionLine(elementId, answerId) {
    const connectionKey = `${elementId}-${answerId}`;
    this.connectionLines.set(connectionKey, {
      elementId,
      answerId,
      startTime: performance.now(),
      duration: 800,
      progress: 0
    });
  }
  
  /**
   * Create enhanced particle effects
   */
  createEnhancedParticleEffect(elementId, answerId, effectType) {
    const elementIndex = this.elementsToMatch.findIndex(e => e.symbol === elementId);
    const answerIndex = this.matchOptions.findIndex(o => o.id === answerId);
    
    if (elementIndex === -1 || answerIndex === -1) return;
    
    const elementX = this.elementCardsArea.x + elementIndex * (this.cardWidth + this.cardSpacing) + this.cardWidth/2;
    const elementY = this.elementCardsArea.y + this.cardHeight/2;
    const answerX = this.optionCardsArea.x + answerIndex * (this.cardWidth + this.cardSpacing) + this.cardWidth/2;
    const answerY = this.optionCardsArea.y + this.cardHeight/2;
    
    if (effectType === 'success') {
      // Create electron particles
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        this.particles.push({
          x: elementX,
          y: elementY,
          vx: Math.cos(angle) * 3,
          vy: Math.sin(angle) * 3,
          life: 1.0,
          decay: 0.015,
          size: 2 + Math.random() * 2,
          color: '#4ECDC4',
          type: 'electron'
        });
      }
      
      // Create proton burst at answer
      for (let i = 0; i < 6; i++) {
        this.particles.push({
          x: answerX,
          y: answerY,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          life: 1.0,
          decay: 0.02,
          size: 3 + Math.random() * 3,
          color: '#2ECC71',
          type: 'proton'
        });
      }
      
      // Create neutron vibrations
      for (let i = 0; i < 4; i++) {
        this.particles.push({
          x: (elementX + answerX) / 2 + (Math.random() - 0.5) * 20,
          y: (elementY + answerY) / 2 + (Math.random() - 0.5) * 20,
          vx: 0,
          vy: 0,
          life: 1.0,
          decay: 0.025,
          size: 4,
          color: '#FFD700',
          type: 'neutron'
        });
      }
    } else if (effectType === 'error') {
      // Create error sparks
      for (let i = 0; i < 6; i++) {
        this.particles.push({
          x: elementX,
          y: elementY,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 1.0,
          decay: 0.03,
          size: 2,
          color: '#E74C3C',
          type: 'spark'
        });
      }
      
      for (let i = 0; i < 6; i++) {
        this.particles.push({
          x: answerX,
          y: answerY,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 1.0,
          decay: 0.03,
          size: 2,
          color: '#E74C3C',
          type: 'spark'
        });
      }
    }
  }
  
  /**
   * Add particle effect for successful matches (legacy compatibility)
   */
  addParticleEffect(elementId, answerId) {
    this.createEnhancedParticleEffect(elementId, answerId, 'success');
  }
  
  /**
   * Celebrate round completion with enhanced effects
   */
  celebrateRoundCompletion() {
    // Create celebration burst from center
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    // Create molecular burst effect
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16;
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * 8,
        vy: Math.sin(angle) * 8,
        life: 1.5,
        decay: 0.015,
        size: 4 + Math.random() * 4,
        color: '#FFD700',
        type: 'proton'
      });
    }
    
    // Add Sage celebration animation
    this.sageAnimationFrame += 2; // Speed up animation
    
    // Use BaseGame celebration method
    const tier = this.matchAttempts <= this.elementsToMatch.length ? 'gold' : 
                 this.matchAttempts <= this.elementsToMatch.length * 1.5 ? 'silver' : 'bronze';
    this.celebrateCompletion(tier);
  }
  
  /**
   * Complete current round
   */
  completeRound() {
    // Track round completion
    this.trackLevelComplete({
      round: this.currentRound,
      matchType: this.currentMatchType,
      totalAttempts: this.matchAttempts,
      elementsMatched: this.elementsToMatch.length,
      timeToComplete: performance.now() - this.roundStartTime
    });
    
    this.currentRound++;
    
    if (this.currentRound <= this.maxRounds) {
      setTimeout(() => {
        this.generateNewRound();
      }, 1500);
    } else {
      this.gameOver();
    }
  }
  
  /**
   * Show hint for current selection
   */
  showHint() {
    if (!this.selectedCard || this.selectedCard.type !== 'element') {
      return;
    }
    
    this.hintsUsed++;
    const element = this.elementsToMatch.find(e => e.symbol === this.selectedCard.id);
    
    if (element) {
      // Could show element facts or highlight correct answer
      logger.debug(`Hint for ${element.name}: ${this.correctMatches.get(element.symbol)}`);
    }
  }
  
  /**
   * Override BaseGame's update method
   */
  update(deltaTime, timestamp) {
    super.update(deltaTime, timestamp);
    
    // Update Sage animation
    this.sageAnimationFrame += deltaTime * 0.002;
    
    // Update card animations
    this.updateCardAnimations(timestamp);
    
    // Update connection lines
    this.updateConnectionLines(timestamp);
    
    // Update atomic orbitals
    this.updateAtomicOrbitals(timestamp);
    
    // Update particles
    this.updateParticles();
    
    // Process element discovery queue
    this.processElementDiscovery();
  }
  
  /**
   * Update card animations
   */
  updateCardAnimations(timestamp) {
    for (const [key, animation] of this.cardAnimations.entries()) {
      const elapsed = timestamp - animation.startTime;
      if (elapsed >= animation.duration) {
        this.cardAnimations.delete(key);
      }
    }
  }
  
  /**
   * Update connection lines
   */
  updateConnectionLines(timestamp) {
    for (const [key, connection] of this.connectionLines.entries()) {
      const elapsed = timestamp - connection.startTime;
      connection.progress = Math.min(elapsed / connection.duration, 1);
      
      if (connection.progress >= 1) {
        this.connectionLines.delete(key);
      }
    }
  }
  
  /**
   * Update atomic orbitals
   */
  updateAtomicOrbitals(timestamp) {
    for (const [elementId, orbital] of this.atomicOrbitals.entries()) {
      orbital.currentAngle = (timestamp - orbital.startTime) * orbital.rotationSpeed;
      
      // Remove orbital if element is no longer selected
      if (!this.selectedCard || this.selectedCard.id !== elementId) {
        this.atomicOrbitals.delete(elementId);
      }
    }
  }
  
  /**
   * Process element discovery queue
   */
  processElementDiscovery() {
    // Add discovery animations for newly revealed elements
    if (this.elementDiscoveryQueue.length > 0) {
      const element = this.elementDiscoveryQueue.shift();
      this.addCardAnimation(element.symbol, 'element', 'discovery');
    }
  }
  
  /**
   * Update particle effects
   */
  updateParticles() {
    this.particles = this.particles.filter(particle => {
      // Update position based on type
      switch (particle.type) {
      case 'electron':
        // Orbital motion
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.1; // slight gravity
        break;
      case 'proton':
        // Burst motion
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.98;
        particle.vy *= 0.98;
        break;
      case 'neutron':
        // Vibration (minimal movement)
        particle.x += Math.sin(performance.now() * 0.01) * 0.5;
        particle.y += Math.cos(performance.now() * 0.01) * 0.5;
        break;
      case 'spark':
        // Quick dissipation
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.95;
        particle.vy *= 0.95;
        break;
      default:
        // Standard motion
        particle.x += particle.vx;
        particle.y += particle.vy;
      }
      
      particle.life -= particle.decay;
      return particle.life > 0;
    });
  }
  
  /**
   * Override BaseGame's render method
   */
  render() {
    super.render(); // Clear canvas
    
    if (this.state !== 'playing') {
      return;
    }
    
    this.renderBackground();
    this.renderSageCharacter();
    this.renderRoundInfo();
    this.renderAtomicOrbitals(); // Render orbitals behind cards
    this.renderElementCards();
    this.renderMatchOptions();
    this.renderMatchLines();
    this.renderConnectionLines(); // Render animated connection lines
    this.renderParticles();
    this.renderGameInfo();
  }
  
  /**
   * Render game background
   */
  renderBackground() {
    // Laboratory-themed background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#2C3E50');
    gradient.addColorStop(1, '#34495E');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Add subtle pattern
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < this.canvas.width; i += 40) {
      for (let j = 0; j < this.canvas.height; j += 40) {
        this.ctx.fillRect(i, j, 1, 1);
      }
    }
  }
  
  /**
   * Render Sage the Owl character
   */
  renderSageCharacter() {
    const x = this.sagePosition.x;
    const y = this.sagePosition.y;
    const bobOffset = Math.sin(this.sageAnimationFrame) * 3;
    
    // Sage body (simplified owl)
    this.ctx.fillStyle = this.colors.sage;
    this.ctx.beginPath();
    this.ctx.arc(x, y + bobOffset, 25, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Eyes
    this.ctx.fillStyle = 'white';
    this.ctx.beginPath();
    this.ctx.arc(x - 8, y - 5 + bobOffset, 6, 0, Math.PI * 2);
    this.ctx.arc(x + 8, y - 5 + bobOffset, 6, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Pupils
    this.ctx.fillStyle = 'black';
    this.ctx.beginPath();
    this.ctx.arc(x - 8, y - 5 + bobOffset, 3, 0, Math.PI * 2);
    this.ctx.arc(x + 8, y - 5 + bobOffset, 3, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Beak
    this.ctx.fillStyle = '#F39C12';
    this.ctx.beginPath();
    this.ctx.moveTo(x, y + 5 + bobOffset);
    this.ctx.lineTo(x - 4, y + 10 + bobOffset);
    this.ctx.lineTo(x + 4, y + 10 + bobOffset);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Speech bubble
    this.renderSageSpeech(x + 40, y - 20 + bobOffset);
  }
  
  /**
   * Render Sage's speech bubble
   */
  renderSageSpeech(x, y) {
    const matchType = matchTypes[this.currentMatchType];
    const text = matchType.instruction;
    
    // Bubble background
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    this.ctx.strokeStyle = this.colors.sage;
    this.ctx.lineWidth = 2;
    
    const bubbleWidth = 200;
    const bubbleHeight = 40;
    
    this.ctx.fillRect(x, y, bubbleWidth, bubbleHeight);
    this.ctx.strokeRect(x, y, bubbleWidth, bubbleHeight);
    
    // Text
    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.wrapText(text, x + bubbleWidth/2, y + 15, bubbleWidth - 10, 14);
  }
  
  /**
   * Render round information
   */
  renderRoundInfo() {
    const matchType = matchTypes[this.currentMatchType];
    
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      `Round ${this.currentRound}: ${matchType.name}`,
      this.canvas.width / 2,
      50
    );
  }
  
  /**
   * Render element cards
   */
  renderElementCards() {
    this.elementsToMatch.forEach((element, index) => {
      const x = this.elementCardsArea.x + index * (this.cardWidth + this.cardSpacing);
      const y = this.elementCardsArea.y;
      
      const isSelected = this.selectedCard && 
        this.selectedCard.id === element.symbol && 
        this.selectedCard.type === 'element';
      const isMatched = this.matchedPairs.has(element.symbol);
      
      this.renderCard(x, y, this.cardWidth, this.cardHeight, {
        text: element.name,
        subtext: element.symbol,
        color: element.color,
        isSelected,
        isMatched,
        type: 'element'
      });
    });
  }
  
  /**
   * Render match option cards
   */
  renderMatchOptions() {
    this.matchOptions.forEach((option, index) => {
      const x = this.optionCardsArea.x + index * (this.cardWidth + this.cardSpacing);
      const y = this.optionCardsArea.y;
      
      const isSelected = this.selectedCard && 
        this.selectedCard.id === option.id && 
        this.selectedCard.type === 'answer';
      const isMatched = this.matchedPairs.has(option.id);
      
      this.renderCard(x, y, this.cardWidth, this.cardHeight, {
        text: option.text,
        isSelected,
        isMatched,
        type: 'answer'
      });
    });
  }
  
  /**
   * Render a card
   */
  renderCard(x, y, width, height, options) {
    const { text, subtext, color, isSelected, isMatched, type } = options;
    
    // Card background
    let bgColor = type === 'element' ? this.colors.elementCard : this.colors.optionCard;
    if (isMatched) {
      bgColor = this.colors.correctMatch;
    } else if (isSelected) {
      bgColor = this.colors.selectedCard;
    }
    
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(x, y, width, height);
    
    // Card border
    this.ctx.strokeStyle = isSelected ? this.colors.selectedCard : this.colors.cardBorder;
    this.ctx.lineWidth = isSelected ? 3 : 1;
    this.ctx.strokeRect(x, y, width, height);
    
    // Color indicator for elements
    if (type === 'element' && color) {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x + 5, y + 5, 10, 10);
    }
    
    // Text
    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'center';
    
    if (subtext) {
      // Element card with symbol
      this.ctx.font = 'bold 12px Arial';
      this.ctx.fillText(text, x + width/2, y + height/2 - 5);
      this.ctx.font = 'bold 16px Arial';
      this.ctx.fillText(subtext, x + width/2, y + height/2 + 12);
    } else {
      // Option card
      this.wrapText(text, x + width/2, y + height/2 + 2, width - 10, 12);
    }
  }
  
  /**
   * Render connection lines for matches
   */
  renderMatchLines() {
    for (const [elementId, answerText] of this.playerMatches.entries()) {
      const elementIndex = this.elementsToMatch.findIndex(e => e.symbol === elementId);
      const answerIndex = this.matchOptions.findIndex(o => o.text === answerText);
      
      if (elementIndex !== -1 && answerIndex !== -1) {
        const startX = this.elementCardsArea.x + elementIndex * (this.cardWidth + this.cardSpacing) + this.cardWidth/2;
        const startY = this.elementCardsArea.y + this.cardHeight;
        const endX = this.optionCardsArea.x + answerIndex * (this.cardWidth + this.cardSpacing) + this.cardWidth/2;
        const endY = this.optionCardsArea.y;
        
        this.ctx.strokeStyle = this.colors.correctMatch;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
      }
    }
  }
  
  /**
   * Render atomic orbitals
   */
  renderAtomicOrbitals() {
    for (const [elementId, orbital] of this.atomicOrbitals.entries()) {
      const elementIndex = this.elementsToMatch.findIndex(e => e.symbol === elementId);
      if (elementIndex === -1) continue;
      
      const centerX = this.elementCardsArea.x + elementIndex * (this.cardWidth + this.cardSpacing) + this.cardWidth/2;
      const centerY = this.elementCardsArea.y + this.cardHeight/2;
      
      this.ctx.save();
      this.ctx.globalAlpha = 0.3;
      this.ctx.strokeStyle = '#4ECDC4';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([5, 5]);
      
      // Draw orbital paths
      for (let i = 0; i < 3; i++) {
        const radius = orbital.radius + i * 15;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw electron
        const electronAngle = orbital.currentAngle + (i * Math.PI * 2 / 3);
        const electronX = centerX + Math.cos(electronAngle) * radius;
        const electronY = centerY + Math.sin(electronAngle) * radius;
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(electronX, electronY, 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      this.ctx.restore();
    }
  }
  
  /**
   * Render animated connection lines
   */
  renderConnectionLines() {
    for (const [key, connection] of this.connectionLines.entries()) {
      const elementIndex = this.elementsToMatch.findIndex(e => e.symbol === connection.elementId);
      const answerIndex = this.matchOptions.findIndex(o => o.id === connection.answerId);
      
      if (elementIndex === -1 || answerIndex === -1) continue;
      
      const startX = this.elementCardsArea.x + elementIndex * (this.cardWidth + this.cardSpacing) + this.cardWidth/2;
      const startY = this.elementCardsArea.y + this.cardHeight;
      const endX = this.optionCardsArea.x + answerIndex * (this.cardWidth + this.cardSpacing) + this.cardWidth/2;
      const endY = this.optionCardsArea.y;
      
      // Calculate animated end point
      const currentEndX = startX + (endX - startX) * connection.progress;
      const currentEndY = startY + (endY - startY) * connection.progress;
      
      this.ctx.save();
      this.ctx.strokeStyle = '#2ECC71';
      this.ctx.lineWidth = 4;
      this.ctx.setLineDash([10, 5]);
      this.ctx.lineDashOffset = -performance.now() * 0.05;
      
      // Add glow effect
      this.ctx.shadowColor = '#2ECC71';
      this.ctx.shadowBlur = 10;
      
      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(currentEndX, currentEndY);
      this.ctx.stroke();
      
      this.ctx.restore();
    }
  }
  
  /**
   * Render particle effects
   */
  renderParticles() {
    this.particles.forEach(particle => {
      this.ctx.save();
      this.ctx.globalAlpha = particle.life;
      
      switch (particle.type) {
      case 'electron':
        // Blue glowing particles
        this.ctx.fillStyle = particle.color;
        this.ctx.shadowColor = particle.color;
        this.ctx.shadowBlur = 5;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        break;
        
      case 'proton':
        // Green burst particles
        this.ctx.fillStyle = particle.color;
        this.ctx.shadowColor = particle.color;
        this.ctx.shadowBlur = 8;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        break;
        
      case 'neutron':
        // Golden vibrating particles
        this.ctx.fillStyle = particle.color;
        this.ctx.shadowColor = particle.color;
        this.ctx.shadowBlur = 6;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        break;
        
      case 'spark':
        // Red error sparks
        this.ctx.strokeStyle = particle.color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(particle.x - particle.size, particle.y);
        this.ctx.lineTo(particle.x + particle.size, particle.y);
        this.ctx.moveTo(particle.x, particle.y - particle.size);
        this.ctx.lineTo(particle.x, particle.y + particle.size);
        this.ctx.stroke();
        break;
        
      default:
        // Standard circular particles
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      this.ctx.restore();
    });
  }
  
  /**
   * Render game information
   */
  renderGameInfo() {
    this.ctx.fillStyle = 'white';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    
    // Score and round
    this.ctx.fillText(`Score: ${this.score}`, 20, 30);
    this.ctx.fillText(`Round: ${this.currentRound}/${this.maxRounds}`, 20, 50);
    this.ctx.fillText(`Matches: ${this.playerMatches.size}/${this.elementsToMatch.length}`, 20, 70);
  }
  
  /**
   * Wrap text to fit within specified width
   */
  wrapText(text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let testLine = '';
    let metrics = null;
    let testWidth = 0;
    
    for (let n = 0; n < words.length; n++) {
      testLine = line + words[n] + ' ';
      metrics = this.ctx.measureText(testLine);
      testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        this.ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    this.ctx.fillText(line, x, y);
  }
  
  /**
   * Handle click events
   */
  handleClick(event) {
    super.handleClick(event);
    
    const pos = this.getPointerPosition(event);
    
    // Check element card clicks
    this.elementsToMatch.forEach((element, index) => {
      const cardRect = {
        x: this.elementCardsArea.x + index * (this.cardWidth + this.cardSpacing),
        y: this.elementCardsArea.y,
        width: this.cardWidth,
        height: this.cardHeight
      };
      
      if (this.isPointInRect(pos, cardRect) && !this.matchedPairs.has(element.symbol)) {
        this.selectCard(element.symbol, 'element');
      }
    });
    
    // Check option card clicks
    this.matchOptions.forEach((option, index) => {
      const cardRect = {
        x: this.optionCardsArea.x + index * (this.cardWidth + this.cardSpacing),
        y: this.optionCardsArea.y,
        width: this.cardWidth,
        height: this.cardHeight
      };
      
      if (this.isPointInRect(pos, cardRect) && !this.matchedPairs.has(option.id)) {
        this.selectCard(option.id, 'answer');
      }
    });
  }
  
  /**
   * Check if point is within rectangle
   */
  isPointInRect(point, rect) {
    return point.x >= rect.x && 
           point.x <= rect.x + rect.width &&
           point.y >= rect.y && 
           point.y <= rect.y + rect.height;
  }
  
  /**
   * Override BaseGame's onGameEnd
   */
  onGameEnd() {
    super.onGameEnd();
    
    // Track final game statistics
    if (this.currentRound > 1) {
      this.trackLevelComplete({
        roundsCompleted: this.currentRound - 1,
        maxRounds: this.maxRounds,
        totalMatches: this.playerMatches.size,
        difficulty: this.difficulty,
        finalScore: this.score,
        hintsUsed: this.hintsUsed
      });
    }
  }
}

// Export the game class
export default ElementMatchGame;