// Sentence Builder Game for Learnimals
// An interactive reading game where Bella the Bunny teaches sentence structure and grammar
// Enhanced with BaseGame framework for progress tracking, analytics, and mobile optimization

import logger from '../../../utils/logger.js';
import BaseGame from '../../../components/games/BaseGame.js';
import { 
  getRandomSentences, 
  validateSentenceOrder, 
  shuffleWords,
  getGrammarCategory 
} from './sentenceData.js';

class SentenceBuilderGame extends BaseGame {
  constructor(containerId, options = {}) {
    // Initialize BaseGame with DOM container mode
    super(containerId, {
      useDOMContainer: true,
      gameType: 'sentence-builder',
      subject: 'reading',
      difficulty: options.difficulty || 'easy',
      enableProgressTracking: true,
      ...options
    });
    
    // Game-specific properties
    this.currentSentenceIndex = 0;
    this.maxSentences = 5;
    this.sentences = [];
    this.currentSentence = null;
    this.shuffledWords = [];
    this.sentenceArea = [];
    this.wordBank = [];
    
    // DOM elements
    this.wordBankElement = null;
    this.sentenceAreaElement = null;
    this.bellaCharacter = null;
    this.feedbackElement = null;
    this.progressElement = null;
    
    // Game state
    this.draggedElement = null;
    this.touchStartPos = { x: 0, y: 0 };
    this.isDragging = false;
    this.sentenceStartTime = null;
    this.attempts = 0;
    this.hintsUsed = 0;
    
    // Scoring
    this.streakCount = 0;
    this.maxStreak = 0;
    this.totalWordsPlaced = 0;
    this.correctPlacements = 0;
    
    // Animation state
    this.animationEnabled = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.wordAnimations = new Map();
    this.connectionLines = [];
    this.readingFlowActive = false;
  }
  
  /**
   * Override BaseGame's onInitialized
   */
  onInitialized() {
    super.onInitialized();
    this.setupGameLayout();
    this.loadSentences();
    logger.debug('Sentence Builder game initialized successfully');
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
    this.currentSentenceIndex = 0;
    this.sentences = [];
    this.sentenceArea = [];
    this.wordBank = [];
    this.streakCount = 0;
    this.maxStreak = 0;
    this.totalWordsPlaced = 0;
    this.correctPlacements = 0;
    this.attempts = 0;
    this.hintsUsed = 0;
  }
  
  /**
   * Setup game layout and DOM elements
   */
  setupGameLayout() {
    if (!this.container) {
      throw new Error('Game container not found');
    }
    
    // Apply mobile optimizations
    this.container.classList.add('sentence-builder-game');
    if (this.isMobile) {
      this.container.classList.add('mobile-optimized');
    }
    
    // Create game structure
    this.container.innerHTML = `
      <div class="game-header">
        <div class="bella-character" id="bella-character">
          <div class="bella-avatar">🐰</div>
          <div class="bella-speech" id="bella-speech">
            Hi! I'm Bella the Bunny. Let's build sentences together!
          </div>
        </div>
        <div class="game-progress" id="game-progress">
          <div class="progress-bar">
            <div class="progress-fill" id="progress-fill"></div>
          </div>
          <div class="progress-text">Sentence <span id="current-sentence">1</span> of <span id="total-sentences">5</span></div>
        </div>
      </div>
      
      <div class="game-content">
        <div class="sentence-display" id="sentence-display">
          <div class="sentence-hint" id="sentence-hint"></div>
          <div class="sentence-area" id="sentence-area">
            <div class="drop-instruction">Drag words here to build your sentence</div>
          </div>
        </div>
        
        <div class="word-bank" id="word-bank">
          <h3>Word Bank</h3>
          <div class="word-tiles" id="word-tiles"></div>
        </div>
      </div>
      
      <div class="game-controls">
        <button class="game-btn hint-btn" id="hint-btn">💡 Hint</button>
        <button class="game-btn check-btn" id="check-btn" disabled>✓ Check Sentence</button>
        <button class="game-btn clear-btn" id="clear-btn">🔄 Clear</button>
        <button class="game-btn next-btn hidden" id="next-btn">➡️ Next Sentence</button>
      </div>
      
      <div class="feedback-area" id="feedback-area"></div>
    `;
    
    // Store references to key elements
    this.wordBankElement = this.container.querySelector('#word-tiles');
    this.sentenceAreaElement = this.container.querySelector('#sentence-area');
    this.bellaCharacter = this.container.querySelector('#bella-character');
    this.feedbackElement = this.container.querySelector('#feedback-area');
    this.progressElement = this.container.querySelector('#progress-fill');
    
    // Setup event listeners
    this.setupEventListeners();
  }
  
  /**
   * Setup event listeners for game interactions
   */
  setupEventListeners() {
    // Button controls
    this.container.querySelector('#hint-btn').addEventListener('click', () => this.showHint());
    this.container.querySelector('#check-btn').addEventListener('click', () => this.checkSentence());
    this.container.querySelector('#clear-btn').addEventListener('click', () => this.clearSentence());
    this.container.querySelector('#next-btn').addEventListener('click', () => this.nextSentence());
    
    // Drag and drop events (will be added to word tiles dynamically)
    // Touch events for mobile support
    this.setupDragAndDrop();
  }
  
  /**
   * Setup drag and drop functionality
   */
  setupDragAndDrop() {
    // Event delegation for dynamic word tiles
    this.wordBankElement.addEventListener('dragstart', this.handleDragStart.bind(this));
    this.wordBankElement.addEventListener('dragend', this.handleDragEnd.bind(this));
    
    this.sentenceAreaElement.addEventListener('dragover', this.handleDragOver.bind(this));
    this.sentenceAreaElement.addEventListener('drop', this.handleDrop.bind(this));
    this.sentenceAreaElement.addEventListener('click', this.handleSentenceAreaClick.bind(this));
    
    // Touch events for mobile
    this.wordBankElement.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.wordBankElement.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.wordBankElement.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }
  
  /**
   * Load sentences for the game session
   */
  loadSentences() {
    this.sentences = getRandomSentences(this.difficulty, this.maxSentences);
    logger.debug(`Loaded ${this.sentences.length} sentences for difficulty: ${this.difficulty}`);
  }
  
  /**
   * Start a new game session
   */
  startNewGame() {
    this.currentSentenceIndex = 0;
    this.loadCurrentSentence();
    this.updateProgress();
    this.updateBellaSpeech('Ready to build some sentences? Let\'s start!');
  }
  
  /**
   * Load the current sentence for building
   */
  loadCurrentSentence() {
    if (this.currentSentenceIndex >= this.sentences.length) {
      this.gameOver();
      return;
    }
    
    this.currentSentence = this.sentences[this.currentSentenceIndex];
    this.shuffledWords = shuffleWords(this.currentSentence.words);
    this.sentenceArea = [];
    this.attempts = 0;
    this.sentenceStartTime = performance.now();
    
    // Clear animations
    this.wordAnimations.clear();
    this.connectionLines = [];
    
    // Update UI with animation
    this.animateWordBankShuffle();
    this.renderWordBank();
    this.renderSentenceArea();
    this.showSentenceHint();
    this.updateGameControls();
    
    logger.debug(`Loaded sentence: ${this.currentSentence.correctOrder.join(' ')}`);
  }
  
  /**
   * Render word bank with draggable tiles
   */
  renderWordBank() {
    this.wordBankElement.innerHTML = '';
    
    this.shuffledWords.forEach((word, index) => {
      const wordTile = document.createElement('div');
      wordTile.className = 'word-tile';
      wordTile.draggable = true;
      wordTile.dataset.word = word;
      wordTile.dataset.index = index;
      wordTile.textContent = word;
      
      // Add grammar category class
      const grammarClass = getGrammarCategory(word);
      wordTile.classList.add(`grammar-${grammarClass}`);
      
      this.wordBankElement.appendChild(wordTile);
    });
  }
  
  /**
   * Render sentence building area
   */
  renderSentenceArea() {
    const dropInstruction = this.sentenceAreaElement.querySelector('.drop-instruction');
    
    // Clear existing content except instruction
    this.sentenceAreaElement.innerHTML = '';
    if (this.sentenceArea.length === 0) {
      this.sentenceAreaElement.appendChild(dropInstruction);
    }
    
    // Create drop zones for each word position
    this.sentenceArea.forEach((word, index) => {
      const wordSlot = document.createElement('div');
      wordSlot.className = 'word-slot filled';
      wordSlot.dataset.position = index;
      wordSlot.textContent = word;
      
      // Add grammar category class
      const grammarClass = getGrammarCategory(word);
      wordSlot.classList.add(`grammar-${grammarClass}`);
      
      this.sentenceAreaElement.appendChild(wordSlot);
    });
    
    // Add empty slots for remaining words
    const remainingSlots = this.currentSentence.words.length - this.sentenceArea.length;
    for (let i = 0; i < remainingSlots; i++) {
      const emptySlot = document.createElement('div');
      emptySlot.className = 'word-slot empty';
      emptySlot.dataset.position = this.sentenceArea.length + i;
      this.sentenceAreaElement.appendChild(emptySlot);
    }
    
    this.updateGameControls();
  }
  
  /**
   * Show hint for current sentence
   */
  showSentenceHint() {
    const hintElement = this.container.querySelector('#sentence-hint');
    hintElement.innerHTML = `
      <div class="hint-content">
        <span class="hint-icon">${this.currentSentence.image}</span>
        <span class="hint-text">${this.currentSentence.hint}</span>
      </div>
    `;
  }
  
  /**
   * Handle drag start event
   */
  handleDragStart(event) {
    if (!event.target.classList.contains('word-tile')) return;
    
    this.draggedElement = event.target;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', event.target.outerHTML);
    event.target.classList.add('dragging');
  }
  
  /**
   * Handle drag end event
   */
  handleDragEnd(event) {
    if (!event.target.classList.contains('word-tile')) return;
    
    event.target.classList.remove('dragging');
    this.draggedElement = null;
  }
  
  /**
   * Handle drag over event
   */
  handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }
  
  /**
   * Handle drop event
   */
  handleDrop(event) {
    event.preventDefault();
    
    if (!this.draggedElement) return;
    
    const word = this.draggedElement.dataset.word;
    this.addWordToSentence(word);
    
    // Remove word from bank
    this.draggedElement.remove();
    this.draggedElement = null;
  }
  
  /**
   * Handle sentence area click (for mobile and alternative input)
   */
  handleSentenceAreaClick(event) {
    if (event.target.classList.contains('word-slot') && event.target.classList.contains('filled')) {
      // Return word to bank
      const word = event.target.textContent;
      this.removeWordFromSentence(word);
      this.addWordToBank(word);
    }
  }
  
  /**
   * Handle touch start for mobile drag
   */
  handleTouchStart(event) {
    if (!event.target.classList.contains('word-tile')) return;
    
    event.preventDefault();
    this.draggedElement = event.target;
    this.isDragging = true;
    
    const touch = event.touches[0];
    this.touchStartPos = { x: touch.clientX, y: touch.clientY };
    
    event.target.classList.add('dragging');
  }
  
  /**
   * Handle touch move for mobile drag
   */
  handleTouchMove(event) {
    if (!this.isDragging || !this.draggedElement) return;
    
    event.preventDefault();
    const touch = event.touches[0];
    
    // Move the element with touch
    this.draggedElement.style.position = 'fixed';
    this.draggedElement.style.left = `${touch.clientX - 50}px`;
    this.draggedElement.style.top = `${touch.clientY - 25}px`;
    this.draggedElement.style.zIndex = '1000';
  }
  
  /**
   * Handle touch end for mobile drag
   */
  handleTouchEnd(event) {
    if (!this.isDragging || !this.draggedElement) return;
    
    event.preventDefault();
    this.isDragging = false;
    
    const touch = event.changedTouches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // Reset dragged element position
    this.draggedElement.style.position = '';
    this.draggedElement.style.left = '';
    this.draggedElement.style.top = '';
    this.draggedElement.style.zIndex = '';
    this.draggedElement.classList.remove('dragging');
    
    // Check if dropped on sentence area
    if (elementBelow && (
      elementBelow.classList.contains('sentence-area') ||
      elementBelow.classList.contains('word-slot') ||
      elementBelow.closest('.sentence-area')
    )) {
      const word = this.draggedElement.dataset.word;
      this.addWordToSentence(word);
      this.draggedElement.remove();
    }
    
    this.draggedElement = null;
  }
  
  /**
   * Add word to sentence building area
   */
  addWordToSentence(word) {
    this.sentenceArea.push(word);
    this.totalWordsPlaced++;
    
    // Animate word placement
    this.animateWordPlacement(word, this.sentenceArea.length - 1);
    
    this.renderSentenceArea();
    
    // Provide audio feedback
    this.playSound(400, 100, 'sine');
    
    // Track word placement
    this.trackProgress();
    
    // Check grammar as words are placed
    this.checkGrammarProgress();
  }
  
  /**
   * Remove word from sentence area
   */
  removeWordFromSentence(word) {
    const index = this.sentenceArea.indexOf(word);
    if (index > -1) {
      // Animate word removal
      this.animateWordRemoval(word, index);
      
      this.sentenceArea.splice(index, 1);
      
      setTimeout(() => {
        this.renderSentenceArea();
      }, 400);
    }
  }
  
  /**
   * Add word back to word bank
   */
  addWordToBank(word) {
    const wordTile = document.createElement('div');
    wordTile.className = 'word-tile';
    wordTile.draggable = true;
    wordTile.dataset.word = word;
    wordTile.textContent = word;
    
    const grammarClass = getGrammarCategory(word);
    wordTile.classList.add(`grammar-${grammarClass}`);
    
    this.wordBankElement.appendChild(wordTile);
  }
  
  /**
   * Show hint for current sentence
   */
  showHint() {
    this.hintsUsed++;
    
    if (this.sentenceArea.length < this.currentSentence.words.length) {
      const nextWordIndex = this.sentenceArea.length;
      const nextWord = this.currentSentence.correctOrder[nextWordIndex];
      
      this.updateBellaSpeech(`💡 The next word should be "${nextWord}". Can you find it?`);
      
      // Highlight the correct word in word bank
      const wordTiles = this.wordBankElement.querySelectorAll('.word-tile');
      wordTiles.forEach(tile => {
        tile.classList.remove('highlight');
        if (tile.dataset.word === nextWord) {
          tile.classList.add('highlight');
          setTimeout(() => tile.classList.remove('highlight'), 2000);
        }
      });
    } else {
      this.updateBellaSpeech('💡 Check your sentence order. Is everything in the right place?');
    }
  }
  
  /**
   * Check if current sentence is correct
   */
  checkSentence() {
    this.attempts++;
    
    const validation = validateSentenceOrder(this.sentenceArea, this.currentSentence.correctOrder);
    
    if (validation.isCorrect) {
      this.handleCorrectSentence(validation);
    } else {
      this.handleIncorrectSentence(validation);
    }
  }
  
  /**
   * Handle correct sentence completion
   */
  handleCorrectSentence(validation) {
    this.correctPlacements += this.sentenceArea.length;
    this.streakCount++;
    this.maxStreak = Math.max(this.maxStreak, this.streakCount);
    
    // Calculate score with bonuses
    const baseScore = validation.score;
    const speedBonus = this.calculateSpeedBonus();
    const efficiencyBonus = this.calculateEfficiencyBonus();
    const streakBonus = this.streakCount * 5;
    
    const totalScore = baseScore + speedBonus + efficiencyBonus + streakBonus;
    this.addScore(totalScore);
    
    // Track correct answer
    this.trackCorrectAnswer({
      sentence: this.currentSentence.id,
      timeToComplete: performance.now() - this.sentenceStartTime,
      attempts: this.attempts,
      hintsUsed: this.hintsUsed,
      streakCount: this.streakCount
    });
    
    // Animate sentence completion
    this.animateSentenceCompletion();
    
    // Show success feedback with grammar lesson
    this.showFeedback('success grammar-lesson', 'Excellent! You built the sentence perfectly!', this.currentSentence.explanation);
    this.updateBellaSpeech('🎉 Wonderful! That sentence is perfect!');
    this.animateBellaEncouragement();
    
    // Play success sound
    this.playSound(600, 200, 'sine');
    
    // Haptic feedback
    if (this.hapticFeedback) {
      navigator.vibrate(100);
    }
    
    // Show next button after animation
    setTimeout(() => {
      this.container.querySelector('#next-btn').classList.remove('hidden');
    }, 800);
  }
  
  /**
   * Handle incorrect sentence attempt
   */
  handleIncorrectSentence(validation) {
    this.streakCount = 0;
    
    // Track incorrect answer
    this.trackIncorrectAnswer({
      sentence: this.currentSentence.id,
      userOrder: [...this.sentenceArea],
      correctOrder: [...this.currentSentence.correctOrder],
      attempts: this.attempts
    });
    
    // Show feedback
    this.showFeedback('error', validation.feedback, 'Try rearranging the words. Remember to start with a capital letter!');
    this.updateBellaSpeech('🤔 Not quite right. Let\'s try again!');
    
    // Play error sound
    this.playSound(200, 300, 'sawtooth');
    
    // Error haptic feedback
    if (this.hapticFeedback) {
      navigator.vibrate([100, 50, 100]);
    }
  }
  
  /**
   * Calculate speed bonus based on completion time
   */
  calculateSpeedBonus() {
    const timeSpent = (performance.now() - this.sentenceStartTime) / 1000;
    const targetTime = this.currentSentence.words.length * 5; // 5 seconds per word
    
    if (timeSpent < targetTime) {
      return Math.round((targetTime - timeSpent) * 2);
    }
    return 0;
  }
  
  /**
   * Calculate efficiency bonus based on attempts
   */
  calculateEfficiencyBonus() {
    if (this.attempts === 1) return 20;
    if (this.attempts === 2) return 10;
    return 0;
  }
  
  /**
   * Clear current sentence and return words to bank
   */
  clearSentence() {
    // Return all words to bank
    this.sentenceArea.forEach(word => this.addWordToBank(word));
    this.sentenceArea = [];
    this.renderSentenceArea();
    this.updateBellaSpeech('Let\'s start fresh! Drag words to build your sentence.');
  }
  
  /**
   * Move to next sentence
   */
  nextSentence() {
    this.currentSentenceIndex++;
    this.hideFeedback();
    this.container.querySelector('#next-btn').classList.add('hidden');
    
    if (this.currentSentenceIndex < this.sentences.length) {
      this.loadCurrentSentence();
      this.updateProgress();
    } else {
      this.gameOver();
    }
  }
  
  /**
   * Show feedback message
   */
  showFeedback(type, message, explanation = '') {
    this.feedbackElement.innerHTML = `
      <div class="feedback ${type}">
        <div class="feedback-message">${message}</div>
        ${explanation ? `<div class="feedback-explanation">${explanation}</div>` : ''}
      </div>
    `;
    this.feedbackElement.classList.remove('hidden');
  }
  
  /**
   * Hide feedback message
   */
  hideFeedback() {
    this.feedbackElement.classList.add('hidden');
  }
  
  /**
   * Update Bella's speech bubble
   */
  updateBellaSpeech(message) {
    const speechBubble = this.container.querySelector('#bella-speech');
    speechBubble.textContent = message;
    
    // Add animation
    speechBubble.classList.add('new-message');
    setTimeout(() => speechBubble.classList.remove('new-message'), 500);
  }
  
  /**
   * Update game progress display
   */
  updateProgress() {
    const progressPercentage = ((this.currentSentenceIndex + 1) / this.sentences.length) * 100;
    this.progressElement.style.width = `${progressPercentage}%`;
    
    // Add building animation when active
    if (this.sentenceArea.length > 0) {
      this.progressElement.classList.add('building');
    } else {
      this.progressElement.classList.remove('building');
    }
    
    this.container.querySelector('#current-sentence').textContent = this.currentSentenceIndex + 1;
    this.container.querySelector('#total-sentences').textContent = this.sentences.length;
  }
  
  /**
   * Update game controls based on current state
   */
  updateGameControls() {
    const checkBtn = this.container.querySelector('#check-btn');
    const clearBtn = this.container.querySelector('#clear-btn');
    
    checkBtn.disabled = this.sentenceArea.length !== this.currentSentence.words.length;
    clearBtn.disabled = this.sentenceArea.length === 0;
  }
  
  /**
   * Track progress for analytics
   */
  trackProgress() {
    // Track word placement accuracy
    const currentIndex = this.sentenceArea.length - 1;
    const isCorrectPosition = this.sentenceArea[currentIndex] === this.currentSentence.correctOrder[currentIndex];
    
    if (isCorrectPosition) {
      this.correctPlacements++;
    }
    
    // Update level based on accuracy
    const accuracy = this.totalWordsPlaced > 0 ? (this.correctPlacements / this.totalWordsPlaced) * 100 : 0;
    this.updateLevel(Math.floor(accuracy / 20) + 1);
  }
  
  /**
   * Override BaseGame's onGameEnd
   */
  onGameEnd() {
    super.onGameEnd();
    
    // Track final game statistics
    const accuracy = this.totalWordsPlaced > 0 ? (this.correctPlacements / this.totalWordsPlaced) * 100 : 0;
    
    this.trackLevelComplete({
      sentencesCompleted: this.currentSentenceIndex,
      totalSentences: this.sentences.length,
      accuracy: accuracy,
      maxStreak: this.maxStreak,
      totalHintsUsed: this.hintsUsed,
      difficulty: this.difficulty,
      finalScore: this.score
    });
    
    // Show final message
    this.updateBellaSpeech(`🎉 Great job! You completed ${this.currentSentenceIndex} sentences with ${Math.round(accuracy)}% accuracy!`);
  }
  
  /**
   * Animate word placement effect
   */
  animateWordPlacement(word, position) {
    if (!this.animationEnabled) return;
    
    // Track animation state
    this.wordAnimations.set(word, {
      position,
      timestamp: Date.now(),
      type: 'placement'
    });
    
    // Apply animation class to sentence area
    const slots = this.sentenceAreaElement.querySelectorAll('.word-slot');
    if (slots[position]) {
      slots[position].classList.add('word-placed');
      
      // Grammar highlight animation
      const grammarClass = getGrammarCategory(word);
      slots[position].classList.add(`grammar-${grammarClass}`, 'active');
      
      setTimeout(() => {
        slots[position].classList.remove('active');
      }, 1000);
    }
    
    // Update reading flow
    this.updateReadingFlow();
  }
  
  /**
   * Animate word removal effect
   */
  animateWordRemoval(word, position) {
    if (!this.animationEnabled) return;
    
    const slots = this.sentenceAreaElement.querySelectorAll('.word-slot');
    if (slots[position]) {
      slots[position].classList.add('word-removed');
    }
  }
  
  /**
   * Animate word bank shuffle
   */
  animateWordBankShuffle() {
    if (!this.animationEnabled) return;
    
    this.wordBankElement.classList.add('shuffling');
    
    setTimeout(() => {
      this.wordBankElement.classList.remove('shuffling');
    }, 800);
  }
  
  /**
   * Animate sentence completion celebration
   */
  animateSentenceCompletion() {
    if (!this.animationEnabled) return;
    
    // Animate sentence area
    this.sentenceAreaElement.classList.add('sentence-complete', 'valid');
    
    // Animate each word in sequence
    const slots = this.sentenceAreaElement.querySelectorAll('.word-slot');
    slots.forEach((slot, index) => {
      setTimeout(() => {
        slot.classList.add('grammar-correct');
      }, index * 100);
    });
    
    // Punctuation emphasis
    const lastSlot = slots[slots.length - 1];
    if (lastSlot && lastSlot.textContent.match(/[.!?]$/)) {
      setTimeout(() => {
        lastSlot.classList.add('punctuation-emphasis');
      }, slots.length * 100);
    }
    
    // Clean up classes after animation
    setTimeout(() => {
      this.sentenceAreaElement.classList.remove('sentence-complete');
      slots.forEach(slot => {
        slot.classList.remove('grammar-correct', 'punctuation-emphasis');
      });
    }, 2000);
  }
  
  /**
   * Animate Bella's encouragement
   */
  animateBellaEncouragement() {
    if (!this.animationEnabled) return;
    
    const bellaAvatar = this.container.querySelector('.bella-avatar');
    bellaAvatar.classList.add('bella-encourage');
    
    setTimeout(() => {
      bellaAvatar.classList.remove('bella-encourage');
    }, 1000);
  }
  
  /**
   * Update reading flow visualization
   */
  updateReadingFlow() {
    if (!this.animationEnabled || this.sentenceArea.length < 2) return;
    
    this.sentenceAreaElement.classList.add('reading-pattern');
    
    setTimeout(() => {
      this.sentenceAreaElement.classList.remove('reading-pattern');
    }, 3000);
  }
  
  /**
   * Check grammar progress as words are placed
   */
  checkGrammarProgress() {
    if (this.sentenceArea.length === 0) return;
    
    // Check if first word is capitalized
    const firstWord = this.sentenceArea[0];
    const shouldCapitalize = this.currentSentence.correctOrder[0];
    
    if (firstWord === shouldCapitalize) {
      // Correct placement
      this.animateGrammarValidation(0, true);
    } else if (firstWord.toLowerCase() === shouldCapitalize.toLowerCase()) {
      // Capitalization issue
      this.updateBellaSpeech('💡 Remember, sentences start with a capital letter!');
      this.animateGrammarValidation(0, false);
    }
    
    // Check word order validity
    if (this.sentenceArea.length >= 2) {
      const isValidOrder = this.checkPartialOrder();
      if (!isValidOrder) {
        this.sentenceAreaElement.classList.add('invalid');
        setTimeout(() => {
          this.sentenceAreaElement.classList.remove('invalid');
        }, 600);
      }
    }
  }
  
  /**
   * Animate grammar validation feedback
   */
  animateGrammarValidation(position, isCorrect) {
    if (!this.animationEnabled) return;
    
    const slots = this.sentenceAreaElement.querySelectorAll('.word-slot');
    if (slots[position]) {
      slots[position].classList.add(isCorrect ? 'grammar-correct' : 'grammar-incorrect');
      
      setTimeout(() => {
        slots[position].classList.remove('grammar-correct', 'grammar-incorrect');
      }, 800);
    }
  }
  
  /**
   * Check partial sentence order validity
   */
  checkPartialOrder() {
    for (let i = 0; i < this.sentenceArea.length; i++) {
      if (this.sentenceArea[i].toLowerCase() !== this.currentSentence.correctOrder[i].toLowerCase()) {
        return false;
      }
    }
    return true;
  }
}

// Export the game class
export default SentenceBuilderGame;