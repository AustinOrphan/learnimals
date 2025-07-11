// Word Scramble Game for Learnimals
// A fun educational game where players unscramble words by dragging letters
// Enhanced with BaseGame framework for progress tracking, analytics, and mobile optimization
import logger from '../../../utils/logger.js';
import BaseGame from '../../../components/games/BaseGame.js';

class WordScrambleGame extends BaseGame {
  constructor(containerId, options = {}) {
    // Initialize BaseGame with DOM container mode
    super(containerId, {
      useDOMContainer: true,
      gameType: 'word-scramble',
      subject: 'reading',
      difficulty: options.difficulty || options.difficultLevel || 'easy',
      enableProgressTracking: true,
      ...options
    });
    
    this.difficultyLevel = this.difficulty; // For backward compatibility
    // Word lists organized by difficulty
    this.words = {
      easy: [
        { word: 'CAT', hint: 'A furry pet that meows' },
        { word: 'DOG', hint: 'A pet that barks' },
        { word: 'SUN', hint: 'It gives us light during the day' },
        { word: 'HAT', hint: 'You wear it on your head' },
        { word: 'BED', hint: 'You sleep on it' }
      ],
      medium: [
        { word: 'SHARK', hint: 'A large fish with sharp teeth' },
        { word: 'TIGER', hint: 'A big cat with stripes' },
        { word: 'HOUSE', hint: 'People live in this' },
        { word: 'PLANT', hint: 'It grows in soil and needs water' },
        { word: 'APPLE', hint: 'A red or green fruit' }
      ],
      hard: [
        { word: 'ELEPHANT', hint: 'A very large gray animal with a trunk' },
        { word: 'DINOSAUR', hint: 'Extinct reptiles that lived long ago' },
        { word: 'GIRAFFE', hint: 'Animal with a very long neck' },
        { word: 'COMPUTER', hint: 'An electronic device you use to play games' },
        { word: 'SANDWICH', hint: 'Food with ingredients between bread' }
      ]
    };
    
    // Game-specific properties
    this.currentWord = '';
    this.currentHint = '';
    this.scrambledLetters = [];
    this.round = 0;
    this.maxRounds = 5;
    this.timeLimit = 60; // seconds per game
    this.roundStartTime = null;
    
    // DOM elements cache
    this.elements = {};
  }
  
  /**
   * Override BaseGame's setupDOMContainer to create Word Scramble UI
   */
  setupDOMContainer() {
    super.setupDOMContainer();
    this.createGameUI();
    this.setupWordScrambleEventListeners();
    this.setupDragAndDrop();
  }
  
  /**
   * Override BaseGame's onInitialized
   */
  onInitialized() {
    super.onInitialized();
    logger.debug('Word Scramble game initialized successfully');
  }
  
  /**
   * Override BaseGame's onStart
   */
  onStart() {
    super.onStart();
    this.startWordScrambleGame();
  }
  
  /**
   * Override BaseGame's onRestart
   */
  onRestart() {
    super.onRestart();
    this.round = 0;
    this.currentWord = '';
    this.currentHint = '';
    this.scrambledLetters = [];
    this.roundStartTime = null;
  }
  
  /**
   * Set up Word Scramble specific event listeners
   */
  setupWordScrambleEventListeners() {
    // Cache elements for performance
    this.elements = {
      startGame: document.getElementById('start-game'),
      checkWord: document.getElementById('check-word'),
      newWord: document.getElementById('new-word'),
      difficultySelect: document.getElementById('difficulty-select'),
      scoreValue: document.getElementById('score'),
      roundValue: document.getElementById('round'),
      timerValue: document.getElementById('timer'),
      wordHint: document.getElementById('word-hint'),
      scrambledArea: document.getElementById('scrambled-area'),
      solutionArea: document.getElementById('solution-area'),
      gameMessage: document.getElementById('game-message'),
      gameArea: document.querySelector('.game-area'),
      gameSettings: document.querySelector('.game-settings'),
      gameResults: document.querySelector('.game-results'),
      finalScore: document.getElementById('final-score'),
      playAgain: document.getElementById('play-again')
    };
    
    // Set up event listeners with proper binding
    if (this.elements.startGame) {
      this.elements.startGame.addEventListener('click', () => this.start());
    }
    
    if (this.elements.checkWord) {
      this.elements.checkWord.addEventListener('click', () => this.checkAnswer());
    }
    
    if (this.elements.newWord) {
      this.elements.newWord.addEventListener('click', () => this.nextWord());
    }
    
    if (this.elements.difficultySelect) {
      this.elements.difficultySelect.addEventListener('change', (e) => {
        this.changeDifficulty(e.target.value);
      });
    }
    
    if (this.elements.playAgain) {
      this.elements.playAgain.addEventListener('click', () => this.restart());
    }
  }
  
  createGameUI() {
    if (!this.container) {
      logger.error('Container not found for Word Scramble game');
      return;
    }
    
    this.container.innerHTML = `
      <div class="word-scramble-game">
        <div class="game-header">
          <h2>Ruby's Word Scramble</h2>
          <p>Unscramble the letters to spell the word!</p>
        </div>
        
        <div class="game-settings">
          <label for="difficulty-select">Difficulty:</label>
          <select id="difficulty-select">
            <option value="easy" selected>Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <button id="start-game" class="game-button">Start Game</button>
        </div>
        
        <div class="game-status">
          <div class="score-display">Score: <span id="score">0</span></div>
          <div class="round-display">Round: <span id="round">0</span>/<span id="max-rounds">${this.maxRounds}</span></div>
          <div class="timer-display">Time: <span id="timer">${this.timeLimit}</span>s</div>
        </div>
        
        <div class="game-area" style="display: none;">
          <div class="word-hint">
            <p>Hint: <span id="word-hint"></span></p>
          </div>
          
          <div class="scrambled-letters" id="scrambled-area"></div>
          
          <div class="solution-area" id="solution-area"></div>
          
          <div class="game-message" id="game-message"></div>
          
          <div class="game-controls">
            <button id="check-word" class="game-button">Check Answer</button>
            <button id="new-word" class="game-button" style="display: none;">Next Word</button>
          </div>
        </div>
        
        <div class="game-results" style="display: none;">
          <h3>Game Over!</h3>
          <p>Your final score: <span id="final-score">0</span></p>
          <button id="play-again" class="game-button">Play Again</button>
        </div>
      </div>
    `;
    
    // CSS is loaded from external file: wordScramble.css
  }
  
  /**
   * Start the Word Scramble game (called by BaseGame.start())
   */
  startWordScrambleGame() {
    this.round = 0;
    this.roundStartTime = performance.now();
    
    // Update UI
    this.updateScoreDisplay();
    this.updateRoundDisplay();
    this.updateTimerDisplay();
    
    // Show game area
    if (this.elements.gameSettings) {
      this.elements.gameSettings.style.display = 'none';
    }
    if (this.elements.gameArea) {
      this.elements.gameArea.style.display = 'block';
    }
    if (this.elements.gameResults) {
      this.elements.gameResults.style.display = 'none';
    }
    
    // Show the first word
    this.nextWord();
  }
  
  nextWord() {
    if (this.round >= this.maxRounds) {
      this.gameOver();
      return;
    }
    
    this.round++;
    this.updateLevel(this.round); // Use BaseGame's level system
    this.updateRoundDisplay();
    
    // Get a random word based on difficulty
    const wordList = this.words[this.difficultyLevel];
    const randomIndex = Math.floor(Math.random() * wordList.length);
    const wordData = wordList[randomIndex];
    
    this.currentWord = wordData.word;
    this.currentHint = wordData.hint;
    
    // Set the hint
    if (this.elements.wordHint) {
      this.elements.wordHint.textContent = this.currentHint;
    }
    
    // Scramble the word
    this.scrambledLetters = this.scrambleWord(this.currentWord);
    
    // Clear previous message
    if (this.elements.gameMessage) {
      this.elements.gameMessage.textContent = '';
      this.elements.gameMessage.className = 'game-message';
    }
    
    // Update UI
    this.updateLetterTiles();
    
    // Show check button and hide next button
    if (this.elements.checkWord) {
      this.elements.checkWord.style.display = 'block';
    }
    if (this.elements.newWord) {
      this.elements.newWord.style.display = 'none';
    }
    
    // Track round start for analytics
    this.roundStartTime = performance.now();
  }
  
  scrambleWord(word) {
    // Convert word to array and shuffle
    const letters = word.split('');
    
    // Fisher-Yates shuffle algorithm
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    
    // Make sure the scrambled word is different from the original
    if (letters.join('') === word) {
      return this.scrambleWord(word); // Try again
    }
    
    return letters;
  }
  
  updateLetterTiles() {
    const scrambledArea = this.elements.scrambledArea;
    const solutionArea = this.elements.solutionArea;
    
    if (!scrambledArea || !solutionArea) {
      logger.warn('Scrambled or solution area not found');
      return;
    }
    
    // Trigger new word transition animation
    this.container.classList.add('new-word');
    setTimeout(() => {
      this.container.classList.remove('new-word');
    }, 800);
    
    // Clear previous content
    scrambledArea.innerHTML = '';
    solutionArea.innerHTML = '';
    
    // Add letter tiles to scrambled area with staggered animation
    this.scrambledLetters.forEach((letter, index) => {
      const tile = document.createElement('div');
      tile.className = 'letter-tile';
      tile.textContent = letter;
      tile.setAttribute('draggable', 'true');
      tile.setAttribute('data-letter', letter);
      tile.setAttribute('data-index', index);
      
      // Add touch feedback for mobile
      if (this.isMobile) {
        tile.addEventListener('touchstart', () => {
          tile.classList.add('touch-feedback');
          setTimeout(() => tile.classList.remove('touch-feedback'), 200);
        });
      }
      
      scrambledArea.appendChild(tile);
    });
    
    // Add empty tiles to solution area
    for (let i = 0; i < this.currentWord.length; i++) {
      const emptyTile = document.createElement('div');
      emptyTile.className = 'empty-tile';
      emptyTile.setAttribute('data-position', i);
      
      solutionArea.appendChild(emptyTile);
    }
  }
  

  
  checkAnswer() {
    const solutionArea = document.getElementById('solution-area');
    const letterTiles = solutionArea.querySelectorAll('.letter-tile');
    
    // Get the current answer
    let answer = '';
    letterTiles.forEach(tile => {
      answer += tile.getAttribute('data-letter');
    });
    
    // Check if answer is correct
    if (answer === this.currentWord) {
      // Animate correct answer
      this.animateCorrectAnswer(letterTiles, solutionArea);
      
      // Correct answer - use BaseGame's scoring system
      const points = this.difficultyLevel === 'easy' ? 10 : 
        this.difficultyLevel === 'medium' ? 20 : 30;
      this.addScore(points);
      
      // Show score popup animation
      this.showScorePopup(points, solutionArea);
      
      // Track correct answer with analytics and progress
      this.trackCorrectAnswer({
        word: this.currentWord,
        difficulty: this.difficultyLevel,
        timeToSolve: performance.now() - this.roundStartTime,
        round: this.round
      });
      
      // Update UI with delay for animations
      setTimeout(() => {
        this.updateScoreDisplay();
        if (this.elements.gameMessage) {
          this.elements.gameMessage.textContent = 'Correct! Well done!';
          this.elements.gameMessage.className = 'game-message success-message';
        }
        
        // Hide check button and show next button
        if (this.elements.checkWord) {
          this.elements.checkWord.style.display = 'none';
        }
        if (this.elements.newWord) {
          this.elements.newWord.style.display = 'block';
        }
      }, 600);
      
      // Use BaseGame's correct feedback animation
      this.showCorrectFeedback('Correct! Well done!');
      
      // Play success sound using BaseGame's audio system
      this.playSound(800, 200, 'sine'); // High pitch success sound
    } else {
      // Animate incorrect answer
      this.animateIncorrectAnswer(letterTiles);
      
      // Wrong answer - track with analytics
      this.trackIncorrectAnswer({
        word: this.currentWord,
        attempt: answer,
        difficulty: this.difficultyLevel,
        round: this.round
      });
      
      // Update UI
      if (this.elements.gameMessage) {
        this.elements.gameMessage.textContent = 'Not quite right, try again!';
        this.elements.gameMessage.className = 'game-message error-message';
      }
      
      // Return letters to scrambled area with animation
      setTimeout(() => {
        this.returnLettersToScrambledAreaAnimated();
      }, 500);
      
      // Use BaseGame's incorrect feedback animation
      this.showIncorrectFeedback('Not quite right, try again!');
      
      // Play error sound using BaseGame's audio system
      this.playSound(200, 300, 'sawtooth'); // Low pitch error sound
    }
  }
  
  returnLettersToScrambledArea() {
    const scrambledArea = this.elements.scrambledArea;
    const solutionArea = this.elements.solutionArea;
    
    if (!scrambledArea || !solutionArea) {
      return;
    }
    
    // Get all letter tiles in solution area
    const letterTiles = Array.from(solutionArea.querySelectorAll('.letter-tile'));
    
    // Return the letters to the scrambled area
    letterTiles.forEach(tile => {
      const letter = tile.getAttribute('data-letter');
      
      // Create a new letter tile
      const newTile = document.createElement('div');
      newTile.className = 'letter-tile';
      newTile.textContent = letter;
      newTile.setAttribute('draggable', 'true');
      newTile.setAttribute('data-letter', letter);
      newTile.setAttribute('data-index', this.scrambledLetters.length);
      
      scrambledArea.appendChild(newTile);
    });
    
    // Update scrambled letters array
    this.scrambledLetters = Array.from(scrambledArea.querySelectorAll('.letter-tile')).map(tile => 
      tile.getAttribute('data-letter')
    );
    
    // Reset solution area
    solutionArea.innerHTML = '';
    for (let i = 0; i < this.currentWord.length; i++) {
      const emptyTile = document.createElement('div');
      emptyTile.className = 'empty-tile';
      emptyTile.setAttribute('data-position', i);
      
      solutionArea.appendChild(emptyTile);
    }
  }
  
  /**
   * Change difficulty level
   */
  changeDifficulty(newDifficulty) {
    this.difficultyLevel = newDifficulty;
    this.difficulty = newDifficulty;
    
    // Track difficulty change in analytics
    this.analytics.difficultyChanges.push({
      timestamp: performance.now(),
      from: this.difficulty,
      to: newDifficulty
    });
    
    logger.debug(`Difficulty changed to: ${newDifficulty}`);
  }
  
  /**
   * Override BaseGame's update method for timer logic
   */
  update(deltaTime, timestamp) {
    super.update(deltaTime, timestamp);
    
    if (this.state === 'playing' && this.roundStartTime) {
      const elapsed = (timestamp - this.analytics.sessionStartTime) / 1000;
      const remaining = Math.max(0, this.timeLimit - elapsed);
      
      this.updateTimerDisplay(Math.ceil(remaining));
      
      if (remaining <= 10 && this.elements.timerValue) {
        this.elements.timerValue.style.color = '#e74c3c';
      }
      
      if (remaining <= 0) {
        this.gameOver();
      }
    }
  }
  
  /**
   * Override BaseGame's onGameEnd
   */
  onGameEnd() {
    super.onGameEnd();
    
    // Track level completion if any rounds were completed
    if (this.round > 0) {
      this.trackLevelComplete({
        roundsCompleted: this.round,
        maxRounds: this.maxRounds,
        wordsCorrect: this.analytics.correctAnswers,
        difficulty: this.difficultyLevel
      });
    }
    
    // Update UI
    if (this.elements.gameArea) {
      this.elements.gameArea.style.display = 'none';
    }
    if (this.elements.gameResults) {
      this.elements.gameResults.style.display = 'block';
    }
    if (this.elements.finalScore) {
      this.elements.finalScore.textContent = this.score;
    }
  }
  
  /**
   * Update score display
   */
  updateScoreDisplay() {
    if (this.elements.scoreValue) {
      this.elements.scoreValue.textContent = this.score;
    }
  }
  
  /**
   * Update round display
   */
  updateRoundDisplay() {
    if (this.elements.roundValue) {
      this.elements.roundValue.textContent = this.round;
    }
  }
  
  /**
   * Update timer display
   */
  updateTimerDisplay(timeRemaining = null) {
    if (this.elements.timerValue) {
      const displayTime = timeRemaining !== null ? timeRemaining : this.timeLimit;
      this.elements.timerValue.textContent = displayTime;
    }
  }
  
  /**
   * Enhanced mobile-friendly drag and drop with BaseGame optimizations
   */
  setupDragAndDrop() {
    this.enhanceDragAndDrop();
    
    // Enhanced touch support for mobile devices
    if (this.isMobile) {
      this.setupMobileDragAndDrop();
    }
  }
  
  /**
   * Setup mobile-specific touch drag and drop
   */
  setupMobileDragAndDrop() {
    let draggedElement = null;
    
    this.container.addEventListener('touchstart', (e) => {
      const target = e.target.closest('.letter-tile');
      if (target && target.getAttribute('draggable') === 'true') {
        draggedElement = target;
        
        target.classList.add('dragging');
        e.preventDefault();
        
        // Haptic feedback
        if (this.hapticFeedback) {
          navigator.vibrate(25);
        }
      }
    }, { passive: false });
    
    this.container.addEventListener('touchmove', (e) => {
      if (draggedElement) {
        e.preventDefault();
        
        const touch = e.touches[0];
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        
        // Visual feedback for valid drop zones
        document.querySelectorAll('.empty-tile').forEach(tile => {
          tile.style.backgroundColor = '';
        });
        
        if (elementBelow && elementBelow.classList.contains('empty-tile')) {
          elementBelow.style.backgroundColor = '#ffecb3';
        }
      }
    }, { passive: false });
    
    this.container.addEventListener('touchend', (e) => {
      if (draggedElement) {
        const touch = e.changedTouches[0];
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if (elementBelow && elementBelow.classList.contains('empty-tile')) {
          // Perform the drop
          const clone = draggedElement.cloneNode(true);
          clone.setAttribute('draggable', 'false');
          elementBelow.parentNode.replaceChild(clone, elementBelow);
          draggedElement.remove();
          
          // Haptic feedback for successful drop
          if (this.hapticFeedback) {
            navigator.vibrate(50);
          }
          
          // Check completion
          const scrambledArea = this.elements.scrambledArea;
          if (scrambledArea && scrambledArea.children.length === 0) {
            setTimeout(() => this.checkAnswer(), 100);
          }
        }
        
        // Clean up
        draggedElement.classList.remove('dragging');
        document.querySelectorAll('.empty-tile').forEach(tile => {
          tile.style.backgroundColor = '';
        });
        draggedElement = null;
      }
    });
  }
  
  /**
   * Animation Methods for Enhanced Visual Feedback
   */
  
  /**
   * Animate correct answer with bouncing letters and area completion
   */
  animateCorrectAnswer(letterTiles, solutionArea) {
    // Add bounce animation to each letter
    letterTiles.forEach((tile, index) => {
      setTimeout(() => {
        tile.classList.add('correct-bounce');
        setTimeout(() => tile.classList.remove('correct-bounce'), 600);
      }, index * 100);
    });
    
    // Animate solution area completion
    setTimeout(() => {
      solutionArea.classList.add('word-complete');
      setTimeout(() => solutionArea.classList.remove('word-complete'), 800);
    }, 200);
  }
  
  /**
   * Animate incorrect answer with shaking letters
   */
  animateIncorrectAnswer(letterTiles) {
    letterTiles.forEach((tile, index) => {
      setTimeout(() => {
        tile.classList.add('incorrect-shake');
        setTimeout(() => tile.classList.remove('incorrect-shake'), 500);
      }, index * 50);
    });
  }
  
  /**
   * Show animated score popup
   */
  showScorePopup(points, parentElement) {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = `+${points}`;
    
    // Position relative to parent
    const rect = parentElement.getBoundingClientRect();
    popup.style.position = 'fixed';
    popup.style.left = `${rect.left + rect.width / 2}px`;
    popup.style.top = `${rect.top + rect.height / 2}px`;
    popup.style.transform = 'translate(-50%, -50%)';
    
    document.body.appendChild(popup);
    
    // Remove after animation
    setTimeout(() => {
      if (popup.parentNode) {
        popup.parentNode.removeChild(popup);
      }
    }, 1500);
  }
  
  /**
   * Return letters to scrambled area with animation
   */
  returnLettersToScrambledAreaAnimated() {
    const scrambledArea = this.elements.scrambledArea;
    const solutionArea = this.elements.solutionArea;
    
    if (!scrambledArea || !solutionArea) {
      return;
    }
    
    // Get all letter tiles in solution area
    const letterTiles = Array.from(solutionArea.querySelectorAll('.letter-tile'));
    
    // Animate return of each letter
    letterTiles.forEach((tile, index) => {
      setTimeout(() => {
        const letter = tile.getAttribute('data-letter');
        
        // Add return animation
        tile.classList.add('returning');
        
        setTimeout(() => {
          // Create a new letter tile in scrambled area
          const newTile = document.createElement('div');
          newTile.className = 'letter-tile';
          newTile.textContent = letter;
          newTile.setAttribute('draggable', 'true');
          newTile.setAttribute('data-letter', letter);
          newTile.setAttribute('data-index', this.scrambledLetters.length);
          
          // Add touch feedback for mobile
          if (this.isMobile) {
            newTile.addEventListener('touchstart', () => {
              newTile.classList.add('touch-feedback');
              setTimeout(() => newTile.classList.remove('touch-feedback'), 200);
            });
          }
          
          scrambledArea.appendChild(newTile);
        }, 250);
      }, index * 100);
    });
    
    // Clean up solution area and reset after animations
    setTimeout(() => {
      // Update scrambled letters array
      this.scrambledLetters = Array.from(scrambledArea.querySelectorAll('.letter-tile')).map(tile => 
        tile.getAttribute('data-letter')
      );
      
      // Reset solution area
      solutionArea.innerHTML = '';
      for (let i = 0; i < this.currentWord.length; i++) {
        const emptyTile = document.createElement('div');
        emptyTile.className = 'empty-tile';
        emptyTile.setAttribute('data-position', i);
        
        solutionArea.appendChild(emptyTile);
      }
      
      // Remove depleted state from scrambled area
      scrambledArea.classList.remove('letters-depleted');
    }, letterTiles.length * 100 + 300);
  }
  
  /**
   * Enhanced drag and drop with visual effects
   */
  enhanceDragAndDrop() {
    // Override the original setupDragAndDrop with enhanced animations
    this.container.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('letter-tile')) {
        e.target.classList.add('dragging');
        e.dataTransfer.setData('text/plain', e.target.getAttribute('data-index'));
        
        // Mobile haptic feedback for drag start
        if (this.hapticFeedback) {
          navigator.vibrate(25);
        }
        
        // Highlight all empty tiles
        document.querySelectorAll('.empty-tile').forEach(tile => {
          tile.classList.add('drop-target');
        });
      }
    });
    
    this.container.addEventListener('dragend', (e) => {
      if (e.target.classList.contains('letter-tile')) {
        e.target.classList.remove('dragging');
        
        // Remove highlights from empty tiles
        document.querySelectorAll('.empty-tile').forEach(tile => {
          tile.classList.remove('drop-target');
        });
      }
    });
    
    this.container.addEventListener('drop', (e) => {
      e.preventDefault();
      
      if (e.target.classList.contains('empty-tile')) {
        const letterIndex = e.dataTransfer.getData('text/plain');
        const letter = document.querySelector(`.letter-tile[data-index="${letterIndex}"]`);
        
        if (letter) {
          // Clone the letter tile
          const clone = letter.cloneNode(true);
          clone.setAttribute('draggable', 'false');
          clone.classList.add('placing'); // Add placement animation
          
          // Replace the empty tile with the letter
          e.target.parentNode.replaceChild(clone, e.target);
          
          // Remove the original letter from scrambled area
          letter.remove();
          
          // Mobile haptic feedback for successful drop
          if (this.hapticFeedback) {
            navigator.vibrate(50);
          }
          
          // Check if scrambled area is depleted
          const scrambledArea = this.elements.scrambledArea;
          if (scrambledArea && scrambledArea.children.length === 0) {
            scrambledArea.classList.add('letters-depleted');
            
            // Add ready-to-check glow to solution area
            const solutionArea = this.elements.solutionArea;
            if (solutionArea) {
              solutionArea.classList.add('ready-to-check');
              setTimeout(() => solutionArea.classList.remove('ready-to-check'), 3000);
            }
            
            setTimeout(() => this.checkAnswer(), 100); // Small delay for smooth animation
          }
          
          // Remove placement animation
          setTimeout(() => {
            clone.classList.remove('placing');
          }, 400);
        }
      }
      
      // Remove highlights
      document.querySelectorAll('.empty-tile').forEach(tile => {
        tile.classList.remove('drop-target');
      });
    });
  }
  
  /**
   * Add hint animation to suggest next letter
   */
  showHintAnimation() {
    const scrambledLetters = this.elements.scrambledArea.querySelectorAll('.letter-tile');
    if (scrambledLetters.length > 0) {
      // Pick a random letter to wiggle as a hint
      const randomLetter = scrambledLetters[Math.floor(Math.random() * scrambledLetters.length)];
      randomLetter.classList.add('hint-wiggle');
      setTimeout(() => randomLetter.classList.remove('hint-wiggle'), 600);
    }
  }
  
}

// Export the enhanced game class
export default WordScrambleGame;