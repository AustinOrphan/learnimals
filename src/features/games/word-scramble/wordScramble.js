// Word Scramble Game for Learnimals
// A fun educational game where players unscramble words by dragging letters

class WordScrambleGame {
  constructor(containerId, difficultLevel = 'easy') {
    this.container = document.getElementById(containerId);
    this.difficultyLevel = difficultLevel; // 'easy', 'medium', 'hard'
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
    
    this.currentWord = '';
    this.currentHint = '';
    this.scrambledLetters = [];
    this.score = 0;
    this.round = 0;
    this.maxRounds = 5;
    this.gameActive = false;
    this.remainingTime = 60; // seconds
    this.timer = null;
    
    this.init();
  }
  
  init() {
    // Create game UI
    this.createGameUI();
    
    // Set up event listeners
    document.getElementById('start-game').addEventListener('click', () => this.startGame());
    document.getElementById('check-word').addEventListener('click', () => this.checkAnswer());
    document.getElementById('new-word').addEventListener('click', () => this.nextWord());
    document.getElementById('difficulty-select').addEventListener('change', (e) => {
      this.difficultyLevel = e.target.value;
    });
    
    // Set up drag and drop functionality
    this.setupDragAndDrop();
  }
  
  createGameUI() {
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
          <div class="timer-display">Time: <span id="timer">60</span>s</div>
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
    
    // CSS is now in external file: wordScramble.css
    
    // Add event listener for the play again button
    document.getElementById('play-again').addEventListener('click', () => {
      document.querySelector('.game-results').style.display = 'none';
      document.querySelector('.game-settings').style.display = 'flex';
      this.score = 0;
      this.round = 0;
      document.getElementById('score').textContent = this.score;
      document.getElementById('round').textContent = this.round;
    });
  }
  
  startGame() {
    this.gameActive = true;
    this.score = 0;
    this.round = 0;
    this.remainingTime = 60;
    
    document.getElementById('score').textContent = this.score;
    document.getElementById('round').textContent = this.round;
    document.getElementById('timer').textContent = this.remainingTime;
    
    document.querySelector('.game-settings').style.display = 'none';
    document.querySelector('.game-area').style.display = 'block';
    document.querySelector('.game-results').style.display = 'none';
    
    // Start the timer
    this.startTimer();
    
    // Show the first word
    this.nextWord();
  }
  
  nextWord() {
    if (this.round >= this.maxRounds) {
      this.endGame();
      return;
    }
    
    this.round++;
    document.getElementById('round').textContent = this.round;
    
    // Get a random word based on difficulty
    const wordList = this.words[this.difficultyLevel];
    const randomIndex = Math.floor(Math.random() * wordList.length);
    const wordData = wordList[randomIndex];
    
    this.currentWord = wordData.word;
    this.currentHint = wordData.hint;
    
    // Set the hint
    document.getElementById('word-hint').textContent = this.currentHint;
    
    // Scramble the word
    this.scrambledLetters = this.scrambleWord(this.currentWord);
    
    // Clear previous message
    document.getElementById('game-message').textContent = '';
    document.getElementById('game-message').className = 'game-message';
    
    // Update UI
    this.updateLetterTiles();
    
    // Show check button and hide next button
    document.getElementById('check-word').style.display = 'block';
    document.getElementById('new-word').style.display = 'none';
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
    const scrambledArea = document.getElementById('scrambled-area');
    const solutionArea = document.getElementById('solution-area');
    
    // Clear previous content
    scrambledArea.innerHTML = '';
    solutionArea.innerHTML = '';
    
    // Add letter tiles to scrambled area
    this.scrambledLetters.forEach((letter, index) => {
      const tile = document.createElement('div');
      tile.className = 'letter-tile';
      tile.textContent = letter;
      tile.setAttribute('draggable', 'true');
      tile.setAttribute('data-letter', letter);
      tile.setAttribute('data-index', index);
      
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
  
  setupDragAndDrop() {
    // Use event delegation for drag and drop
    this.container.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('letter-tile')) {
        e.target.classList.add('dragging');
        e.dataTransfer.setData('text/plain', e.target.getAttribute('data-index'));
      }
    });
    
    this.container.addEventListener('dragend', (e) => {
      if (e.target.classList.contains('letter-tile')) {
        e.target.classList.remove('dragging');
      }
    });
    
    this.container.addEventListener('dragover', (e) => {
      e.preventDefault(); // Allow drop
      
      if (e.target.classList.contains('empty-tile')) {
        e.target.style.backgroundColor = '#ffecb3';
      }
    });
    
    this.container.addEventListener('dragleave', (e) => {
      if (e.target.classList.contains('empty-tile')) {
        e.target.style.backgroundColor = '';
      }
    });
    
    this.container.addEventListener('drop', (e) => {
      e.preventDefault();
      
      if (e.target.classList.contains('empty-tile')) {
        const letterIndex = e.dataTransfer.getData('text/plain');
        const letter = document.querySelector(`.letter-tile[data-index="${letterIndex}"]`);
        
        // Clone the letter tile
        const clone = letter.cloneNode(true);
        clone.setAttribute('draggable', 'false');
        
        // Replace the empty tile with the letter
        e.target.parentNode.replaceChild(clone, e.target);
        
        // Remove the original letter from scrambled area
        letter.remove();
      }
      
      // Check if all letters have been placed
      const scrambledArea = document.getElementById('scrambled-area');
      if (scrambledArea.children.length === 0) {
        this.checkAnswer();
      }
    });
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
      // Correct answer
      this.score += this.difficultyLevel === 'easy' ? 1 : 
                   this.difficultyLevel === 'medium' ? 2 : 3;
      document.getElementById('score').textContent = this.score;
      
      document.getElementById('game-message').textContent = 'Correct! Well done!';
      document.getElementById('game-message').className = 'game-message success-message';
      
      // Hide check button and show next button
      document.getElementById('check-word').style.display = 'none';
      document.getElementById('new-word').style.display = 'block';
      
      // Play success sound
      this.playSound('success');
    } else {
      // Wrong answer
      document.getElementById('game-message').textContent = 'Not quite right, try again!';
      document.getElementById('game-message').className = 'game-message error-message';
      
      // Return letters to scrambled area
      this.returnLettersToScrambledArea();
      
      // Play error sound
      this.playSound('error');
    }
  }
  
  returnLettersToScrambledArea() {
    const scrambledArea = document.getElementById('scrambled-area');
    const solutionArea = document.getElementById('solution-area');
    
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
  
  playSound(type) {
    const audio = new Audio();
    if (type === 'success') {
      audio.src = '/public/audio/success.mp3';
    } else {
      audio.src = '/public/audio/error.mp3';
    }
    audio.play().catch(e => console.log('Audio play failed:', e));
  }
  
  startTimer() {
    // Clear any existing timer
    if (this.timer) clearInterval(this.timer);
    
    this.timer = setInterval(() => {
      this.remainingTime--;
      document.getElementById('timer').textContent = this.remainingTime;
      
      if (this.remainingTime <= 10) {
        document.getElementById('timer').style.color = '#e74c3c';
      }
      
      if (this.remainingTime <= 0) {
        this.endGame();
      }
    }, 1000);
  }
  
  endGame() {
    // Stop the timer
    clearInterval(this.timer);
    
    // Update UI
    document.querySelector('.game-area').style.display = 'none';
    document.querySelector('.game-results').style.display = 'block';
    document.getElementById('final-score').textContent = this.score;
    
    // Reset game state
    this.gameActive = false;
  }
}

// Export the game class
export default WordScrambleGame;