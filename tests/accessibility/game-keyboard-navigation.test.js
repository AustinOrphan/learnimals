/**
 * Game-Specific Keyboard Navigation Tests
 * 
 * Tests keyboard accessibility for educational games including:
 * - WASD and arrow key controls for movement
 * - Space bar for actions and interactions
 * - Number keys for selections and answers
 * - Enter/Return for confirmations
 * - Escape for pausing and exiting
 * - Custom game controls and shortcuts
 * - Game state announcements for screen readers
 * - Focus management during game transitions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AccessibleComponent } from '../../src/components/AccessibleComponent.js';
import { accessibilityService } from '../../src/services/accessibility/AccessibilityService.js';
import { accessibilityTester } from '../../src/utils/accessibilityTester.js';

// Mock logger
vi.mock('../../src/utils/logger.js', () => ({
  default: {
    level: 2,
    enabled: true,
    getLogLevel: vi.fn().mockReturnValue(2),
    setLevel: vi.fn(),
    setEnabled: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    shouldLog: vi.fn().mockReturnValue(true),
    formatMessage: vi.fn().mockImplementation((level, message, args) => {
      const timestamp = new Date().toISOString().slice(11, 23);
      return [`[${timestamp}] ${level}:`, message, ...args];
    }),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    game: vi.fn(),
    user: vi.fn(),
    perf: vi.fn()
  },
  Logger: vi.fn(),
  LOG_LEVELS: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 }
}));

describe('Game-Specific Keyboard Navigation Tests', () => {
  let testContainer;
  let gameContainer;
  let gameState;

  beforeEach(() => {
    document.body.innerHTML = '';
    testContainer = document.createElement('div');
    testContainer.id = 'test-container';
    document.body.appendChild(testContainer);

    // Mock focus methods
    Element.prototype.focus = vi.fn(function() {
      Object.defineProperty(document, 'activeElement', {
        value: this,
        configurable: true
      });
      this.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    });

    Element.prototype.blur = vi.fn(function() {
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        configurable: true
      });
      this.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    });

    // Reset game state
    gameState = {
      score: 0,
      level: 1,
      lives: 3,
      paused: false,
      gameOver: false,
      player: { x: 100, y: 100 },
      selectedAnswer: null,
      actions: []
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('Movement Controls (WASD and Arrow Keys)', () => {
    beforeEach(() => {
      testContainer.innerHTML = `
        <div id="movement-game" class="game-container" tabindex="0" 
             role="application" aria-label="Movement Game">
          <div id="game-instructions" class="sr-only">
            Use WASD or arrow keys to move. Press Space to jump.
          </div>
          <div id="player" class="player" style="position: absolute; left: 100px; top: 100px;"></div>
          <div id="game-world" class="game-world"></div>
        </div>
      `;
      
      gameContainer = testContainer.querySelector('#movement-game');
      
      // Set up movement handler
      gameContainer.addEventListener('keydown', (e) => {
        const moveDistance = 10;
        let moved = false;
        
        switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          gameState.player.y = Math.max(0, gameState.player.y - moveDistance);
          moved = true;
          break;
        case 'a':
        case 'arrowleft':
          gameState.player.x = Math.max(0, gameState.player.x - moveDistance);
          moved = true;
          break;
        case 's':
        case 'arrowdown':
          gameState.player.y = Math.min(400, gameState.player.y + moveDistance);
          moved = true;
          break;
        case 'd':
        case 'arrowright':
          gameState.player.x = Math.min(400, gameState.player.x + moveDistance);
          moved = true;
          break;
        }
        
        if (moved) {
          e.preventDefault();
          gameState.actions.push(`moved to (${gameState.player.x}, ${gameState.player.y})`);
          
          // Update visual position
          const player = testContainer.querySelector('#player');
          player.style.left = `${gameState.player.x}px`;
          player.style.top = `${gameState.player.y}px`;
        }
      });
    });

    it('should handle WASD keys for directional movement', () => {
      gameContainer.focus();
      
      const testMoves = [
        { key: 'w', expectedY: 90, direction: 'up' },
        { key: 'a', expectedX: 90, direction: 'left' },
        { key: 's', expectedY: 100, direction: 'down' },
        { key: 'd', expectedX: 100, direction: 'right' }
      ];

      testMoves.forEach(({ key, expectedX, expectedY, direction }) => {
        const keyEvent = new KeyboardEvent('keydown', { 
          key, 
          bubbles: true, 
          cancelable: true 
        });
        keyEvent.preventDefault = vi.fn();
        
        gameContainer.dispatchEvent(keyEvent);

        expect(keyEvent.preventDefault).toHaveBeenCalled();
        
        if (expectedX !== undefined) {
          expect(gameState.player.x).toBe(expectedX);
        }
        if (expectedY !== undefined) {
          expect(gameState.player.y).toBe(expectedY);
        }
        
        expect(gameState.actions).toContain(
          expect.stringContaining(`moved to (${gameState.player.x}, ${gameState.player.y})`)
        );
      });
    });

    it('should handle arrow keys for directional movement', () => {
      gameContainer.focus();
      
      const testMoves = [
        { key: 'ArrowUp', expectedY: 90 },
        { key: 'ArrowLeft', expectedX: 90 },
        { key: 'ArrowDown', expectedY: 100 },
        { key: 'ArrowRight', expectedX: 100 }
      ];

      testMoves.forEach(({ key, expectedX, expectedY }) => {
        const keyEvent = new KeyboardEvent('keydown', { 
          key, 
          bubbles: true, 
          cancelable: true 
        });
        keyEvent.preventDefault = vi.fn();
        
        gameContainer.dispatchEvent(keyEvent);

        expect(keyEvent.preventDefault).toHaveBeenCalled();
        
        if (expectedX !== undefined) {
          expect(gameState.player.x).toBe(expectedX);
        }
        if (expectedY !== undefined) {
          expect(gameState.player.y).toBe(expectedY);
        }
      });
    });

    it('should enforce movement boundaries', () => {
      gameContainer.focus();
      
      // Move to top-left corner
      gameState.player.x = 0;
      gameState.player.y = 0;
      
      // Try to move beyond boundaries
      const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true });
      const leftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
      
      gameContainer.dispatchEvent(upEvent);
      gameContainer.dispatchEvent(leftEvent);
      
      // Should stay at boundaries
      expect(gameState.player.x).toBe(0);
      expect(gameState.player.y).toBe(0);
      
      // Move to bottom-right corner
      gameState.player.x = 400;
      gameState.player.y = 400;
      
      const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
      const rightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      
      gameContainer.dispatchEvent(downEvent);
      gameContainer.dispatchEvent(rightEvent);
      
      // Should stay at boundaries
      expect(gameState.player.x).toBe(400);
      expect(gameState.player.y).toBe(400);
    });
  });

  describe('Action Controls (Space, Enter, etc.)', () => {
    beforeEach(() => {
      testContainer.innerHTML = `
        <div id="action-game" class="game-container" tabindex="0" 
             role="application" aria-label="Action Game">
          <div id="bubbles">
            <div class="bubble active" data-id="1" data-value="5">5</div>
            <div class="bubble active" data-id="2" data-value="3">3</div>
            <div class="bubble active" data-id="3" data-value="8">8</div>
          </div>
          <div id="score">Score: <span id="score-value">0</span></div>
          <div id="status" aria-live="polite"></div>
        </div>
      `;
      
      gameContainer = testContainer.querySelector('#action-game');
      
      // Set up action handler
      gameContainer.addEventListener('keydown', (e) => {
        if (e.key === ' ') {
          e.preventDefault();
          // Pop the first active bubble
          const activeBubble = gameContainer.querySelector('.bubble.active');
          if (activeBubble) {
            const value = parseInt(activeBubble.dataset.value);
            gameState.score += value;
            activeBubble.classList.remove('active');
            activeBubble.style.display = 'none';
            
            // Update score display
            const scoreElement = gameContainer.querySelector('#score-value');
            scoreElement.textContent = gameState.score;
            
            // Announce to screen reader
            const status = gameContainer.querySelector('#status');
            status.textContent = `Bubble popped! Score: ${gameState.score}`;
            
            gameState.actions.push(`popped bubble worth ${value} points`);
          }
        } else if (e.key === 'Enter') {
          e.preventDefault();
          // Confirm action or restart
          if (gameState.gameOver) {
            gameState.gameOver = false;
            gameState.score = 0;
            gameState.actions.push('game restarted');
          }
        }
      });
    });

    it('should handle Space bar for primary game actions', () => {
      gameContainer.focus();
      
      const initialBubbles = gameContainer.querySelectorAll('.bubble.active').length;
      expect(initialBubbles).toBe(3);
      
      const spaceEvent = new KeyboardEvent('keydown', { 
        key: ' ', 
        bubbles: true, 
        cancelable: true 
      });
      spaceEvent.preventDefault = vi.fn();
      
      gameContainer.dispatchEvent(spaceEvent);

      expect(spaceEvent.preventDefault).toHaveBeenCalled();
      expect(gameState.score).toBeGreaterThan(0);
      expect(gameState.actions).toContain(
        expect.stringContaining('popped bubble worth')
      );
      
      const remainingBubbles = gameContainer.querySelectorAll('.bubble.active').length;
      expect(remainingBubbles).toBe(initialBubbles - 1);
    });

    it('should handle Enter key for confirmations and restarts', () => {
      gameContainer.focus();
      gameState.gameOver = true;
      
      const enterEvent = new KeyboardEvent('keydown', { 
        key: 'Enter', 
        bubbles: true, 
        cancelable: true 
      });
      enterEvent.preventDefault = vi.fn();
      
      gameContainer.dispatchEvent(enterEvent);

      expect(enterEvent.preventDefault).toHaveBeenCalled();
      expect(gameState.gameOver).toBe(false);
      expect(gameState.score).toBe(0);
      expect(gameState.actions).toContain('game restarted');
    });

    it('should announce actions to screen readers', () => {
      gameContainer.focus();
      
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      gameContainer.dispatchEvent(spaceEvent);
      
      const statusElement = gameContainer.querySelector('#status');
      expect(statusElement.textContent).toContain('Bubble popped!');
      expect(statusElement.textContent).toContain('Score:');
      expect(statusElement.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('Selection Controls (Number Keys)', () => {
    beforeEach(() => {
      testContainer.innerHTML = `
        <div id="quiz-game" class="game-container" tabindex="0" 
             role="application" aria-label="Math Quiz Game">
          <div id="question">What is 7 + 5?</div>
          <div id="options" role="radiogroup" aria-labelledby="question">
            <div class="option" data-answer="11" data-key="1" role="radio" tabindex="-1">1. Eleven</div>
            <div class="option" data-answer="12" data-key="2" role="radio" tabindex="-1">2. Twelve</div>
            <div class="option" data-answer="13" data-key="3" role="radio" tabindex="-1">3. Thirteen</div>
            <div class="option" data-answer="10" data-key="4" role="radio" tabindex="-1">4. Ten</div>
          </div>
          <div id="feedback" aria-live="assertive"></div>
        </div>
      `;
      
      gameContainer = testContainer.querySelector('#quiz-game');
      
      // Set up selection handler
      gameContainer.addEventListener('keydown', (e) => {
        const keyNum = e.key;
        if (keyNum >= '1' && keyNum <= '4') {
          e.preventDefault();
          
          const options = gameContainer.querySelectorAll('.option');
          const selectedOption = options[parseInt(keyNum) - 1];
          
          if (selectedOption) {
            // Clear previous selections
            options.forEach(opt => {
              opt.setAttribute('aria-checked', 'false');
              opt.classList.remove('selected');
            });
            
            // Mark selected option
            selectedOption.setAttribute('aria-checked', 'true');
            selectedOption.classList.add('selected');
            gameState.selectedAnswer = selectedOption.dataset.answer;
            
            // Provide feedback
            const feedback = gameContainer.querySelector('#feedback');
            const isCorrect = gameState.selectedAnswer === '12';
            feedback.textContent = isCorrect ? 'Correct!' : 'Try again!';
            
            if (isCorrect) {
              gameState.score += 10;
            }
            
            gameState.actions.push(`selected answer ${keyNum}: ${gameState.selectedAnswer}`);
          }
        }
      });
    });

    it('should handle number keys for option selection', () => {
      gameContainer.focus();
      
      const testSelections = [
        { key: '1', expectedAnswer: '11' },
        { key: '2', expectedAnswer: '12' },
        { key: '3', expectedAnswer: '13' },
        { key: '4', expectedAnswer: '10' }
      ];

      testSelections.forEach(({ key, expectedAnswer }) => {
        const keyEvent = new KeyboardEvent('keydown', { 
          key, 
          bubbles: true, 
          cancelable: true 
        });
        keyEvent.preventDefault = vi.fn();
        
        gameContainer.dispatchEvent(keyEvent);

        expect(keyEvent.preventDefault).toHaveBeenCalled();
        expect(gameState.selectedAnswer).toBe(expectedAnswer);
        expect(gameState.actions).toContain(
          expect.stringContaining(`selected answer ${key}`)
        );
        
        // Check ARIA state
        const selectedOption = gameContainer.querySelector(`[data-key="${key}"]`);
        expect(selectedOption.getAttribute('aria-checked')).toBe('true');
      });
    });

    it('should provide immediate feedback for correct/incorrect answers', () => {
      gameContainer.focus();
      
      // Select correct answer (12)
      const correctEvent = new KeyboardEvent('keydown', { key: '2', bubbles: true });
      gameContainer.dispatchEvent(correctEvent);
      
      const feedback = gameContainer.querySelector('#feedback');
      expect(feedback.textContent).toBe('Correct!');
      expect(gameState.score).toBe(10);
      
      // Select incorrect answer
      const incorrectEvent = new KeyboardEvent('keydown', { key: '1', bubbles: true });
      gameContainer.dispatchEvent(incorrectEvent);
      
      expect(feedback.textContent).toBe('Try again!');
      expect(feedback.getAttribute('aria-live')).toBe('assertive');
    });

    it('should handle selection state changes properly', () => {
      gameContainer.focus();
      
      // Select first option
      const firstEvent = new KeyboardEvent('keydown', { key: '1', bubbles: true });
      gameContainer.dispatchEvent(firstEvent);
      
      let selectedOptions = gameContainer.querySelectorAll('[aria-checked="true"]');
      expect(selectedOptions.length).toBe(1);
      expect(selectedOptions[0].dataset.key).toBe('1');
      
      // Select different option
      const secondEvent = new KeyboardEvent('keydown', { key: '3', bubbles: true });
      gameContainer.dispatchEvent(secondEvent);
      
      selectedOptions = gameContainer.querySelectorAll('[aria-checked="true"]');
      expect(selectedOptions.length).toBe(1);
      expect(selectedOptions[0].dataset.key).toBe('3');
      
      // Previous selection should be deselected
      const firstOption = gameContainer.querySelector('[data-key="1"]');
      expect(firstOption.getAttribute('aria-checked')).toBe('false');
    });
  });

  describe('Game State Controls (Pause, Exit, etc.)', () => {
    beforeEach(() => {
      testContainer.innerHTML = `
        <div id="state-game" class="game-container" tabindex="0" 
             role="application" aria-label="Stateful Game">
          <div id="game-area" class="game-active">
            <div id="timer">Time: <span id="time-value">60</span></div>
            <div id="score">Score: <span id="score-value">0</span></div>
          </div>
          <div id="pause-menu" class="pause-menu" hidden>
            <h2>Game Paused</h2>
            <button id="resume-btn">Resume (R)</button>
            <button id="restart-btn">Restart (N)</button>
            <button id="quit-btn">Quit (Q)</button>
          </div>
          <div id="game-status" aria-live="polite"></div>
        </div>
      `;
      
      gameContainer = testContainer.querySelector('#state-game');
      
      // Set up state control handler
      gameContainer.addEventListener('keydown', (e) => {
        switch (e.key.toLowerCase()) {
        case 'escape':
        case 'p':
          e.preventDefault();
          gameState.paused = !gameState.paused;
          togglePauseMenu(gameState.paused);
          announceGameState();
          gameState.actions.push(gameState.paused ? 'game paused' : 'game resumed');
          break;
          
        case 'r':
          if (gameState.paused) {
            e.preventDefault();
            gameState.paused = false;
            togglePauseMenu(false);
            announceGameState();
            gameState.actions.push('game resumed via hotkey');
          }
          break;
          
        case 'n':
          e.preventDefault();
          gameState.score = 0;
          gameState.paused = false;
          gameState.gameOver = false;
          togglePauseMenu(false);
          announceGameState();
          gameState.actions.push('game restarted via hotkey');
          break;
          
        case 'q':
          if (gameState.paused) {
            e.preventDefault();
            gameState.gameOver = true;
            gameState.paused = false;
            togglePauseMenu(false);
            announceGameState();
            gameState.actions.push('game quit via hotkey');
          }
          break;
        }
      });
      
      function togglePauseMenu(show) {
        const gameArea = gameContainer.querySelector('#game-area');
        const pauseMenu = gameContainer.querySelector('#pause-menu');
        
        if (show) {
          gameArea.classList.add('game-paused');
          pauseMenu.hidden = false;
          pauseMenu.querySelector('#resume-btn').focus();
        } else {
          gameArea.classList.remove('game-paused');
          pauseMenu.hidden = true;
          gameContainer.focus();
        }
      }
      
      function announceGameState() {
        const status = gameContainer.querySelector('#game-status');
        if (gameState.paused) {
          status.textContent = 'Game paused. Press R to resume, N for new game, or Q to quit.';
        } else if (gameState.gameOver) {
          status.textContent = 'Game over. Press N to start a new game.';
        } else {
          status.textContent = 'Game resumed.';
        }
      }
    });

    it('should handle Escape key for pausing/resuming game', () => {
      gameContainer.focus();
      
      expect(gameState.paused).toBe(false);
      
      const escapeEvent = new KeyboardEvent('keydown', { 
        key: 'Escape', 
        bubbles: true, 
        cancelable: true 
      });
      escapeEvent.preventDefault = vi.fn();
      
      gameContainer.dispatchEvent(escapeEvent);

      expect(escapeEvent.preventDefault).toHaveBeenCalled();
      expect(gameState.paused).toBe(true);
      expect(gameState.actions).toContain('game paused');
      
      const pauseMenu = gameContainer.querySelector('#pause-menu');
      expect(pauseMenu.hidden).toBe(false);
    });

    it('should handle P key as alternative pause control', () => {
      gameContainer.focus();
      
      const pEvent = new KeyboardEvent('keydown', { 
        key: 'p', 
        bubbles: true, 
        cancelable: true 
      });
      pEvent.preventDefault = vi.fn();
      
      gameContainer.dispatchEvent(pEvent);

      expect(pEvent.preventDefault).toHaveBeenCalled();
      expect(gameState.paused).toBe(true);
    });

    it('should handle game control hotkeys (R, N, Q)', () => {
      gameContainer.focus();
      
      // Pause game first
      gameState.paused = true;
      
      // Test Resume (R)
      const resumeEvent = new KeyboardEvent('keydown', { 
        key: 'r', 
        bubbles: true, 
        cancelable: true 
      });
      resumeEvent.preventDefault = vi.fn();
      
      gameContainer.dispatchEvent(resumeEvent);
      
      expect(resumeEvent.preventDefault).toHaveBeenCalled();
      expect(gameState.paused).toBe(false);
      expect(gameState.actions).toContain('game resumed via hotkey');
      
      // Test New Game (N)
      const newGameEvent = new KeyboardEvent('keydown', { 
        key: 'n', 
        bubbles: true, 
        cancelable: true 
      });
      newGameEvent.preventDefault = vi.fn();
      
      gameContainer.dispatchEvent(newGameEvent);
      
      expect(newGameEvent.preventDefault).toHaveBeenCalled();
      expect(gameState.actions).toContain('game restarted via hotkey');
      
      // Test Quit (Q) - only works when paused
      gameState.paused = true;
      
      const quitEvent = new KeyboardEvent('keydown', { 
        key: 'q', 
        bubbles: true, 
        cancelable: true 
      });
      quitEvent.preventDefault = vi.fn();
      
      gameContainer.dispatchEvent(quitEvent);
      
      expect(quitEvent.preventDefault).toHaveBeenCalled();
      expect(gameState.gameOver).toBe(true);
      expect(gameState.actions).toContain('game quit via hotkey');
    });

    it('should announce state changes to screen readers', () => {
      gameContainer.focus();
      
      // Pause game
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      gameContainer.dispatchEvent(escapeEvent);
      
      const statusElement = gameContainer.querySelector('#game-status');
      expect(statusElement.textContent).toContain('Game paused');
      expect(statusElement.textContent).toContain('Press R to resume');
      expect(statusElement.getAttribute('aria-live')).toBe('polite');
    });

    it('should manage focus properly during state transitions', () => {
      gameContainer.focus();
      
      // Pause game - focus should move to pause menu
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      gameContainer.dispatchEvent(escapeEvent);
      
      const resumeBtn = gameContainer.querySelector('#resume-btn');
      expect(resumeBtn.focus).toHaveBeenCalled();
      
      // Resume game - focus should return to game container
      const resumeEvent = new KeyboardEvent('keydown', { key: 'r', bubbles: true });
      gameContainer.dispatchEvent(resumeEvent);
      
      expect(gameContainer.focus).toHaveBeenCalled();
    });
  });

  describe('Complex Game Interactions', () => {
    it('should handle multi-key combinations for advanced controls', () => {
      testContainer.innerHTML = `
        <div id="advanced-game" tabindex="0" role="application" aria-label="Advanced Game">
          <div id="player-stats">Health: 100 | Mana: 50</div>
        </div>
      `;
      
      gameContainer = testContainer.querySelector('#advanced-game');
      
      const playerStats = { health: 100, mana: 50 };
      
      gameContainer.addEventListener('keydown', (e) => {
        // Ctrl+H for health potion
        if (e.ctrlKey && e.key.toLowerCase() === 'h') {
          e.preventDefault();
          playerStats.health = Math.min(100, playerStats.health + 25);
          gameState.actions.push('used health potion');
        }
        
        // Ctrl+M for mana potion
        if (e.ctrlKey && e.key.toLowerCase() === 'm') {
          e.preventDefault();
          playerStats.mana = Math.min(100, playerStats.mana + 25);
          gameState.actions.push('used mana potion');
        }
        
        // Shift+Space for special attack
        if (e.shiftKey && e.key === ' ') {
          e.preventDefault();
          if (playerStats.mana >= 20) {
            playerStats.mana -= 20;
            gameState.actions.push('performed special attack');
          }
        }
      });

      gameContainer.focus();

      // Test Ctrl+H
      const ctrlHEvent = new KeyboardEvent('keydown', { 
        key: 'h', 
        ctrlKey: true,
        bubbles: true, 
        cancelable: true 
      });
      ctrlHEvent.preventDefault = vi.fn();
      
      gameContainer.dispatchEvent(ctrlHEvent);
      
      expect(ctrlHEvent.preventDefault).toHaveBeenCalled();
      expect(gameState.actions).toContain('used health potion');

      // Test Shift+Space
      const shiftSpaceEvent = new KeyboardEvent('keydown', { 
        key: ' ', 
        shiftKey: true,
        bubbles: true, 
        cancelable: true 
      });
      shiftSpaceEvent.preventDefault = vi.fn();
      
      gameContainer.dispatchEvent(shiftSpaceEvent);
      
      expect(shiftSpaceEvent.preventDefault).toHaveBeenCalled();
      expect(gameState.actions).toContain('performed special attack');
    });

    it('should handle contextual controls that change based on game state', () => {
      testContainer.innerHTML = `
        <div id="contextual-game" tabindex="0" role="application" aria-label="Contextual Game">
          <div id="context-help" aria-live="polite"></div>
        </div>
      `;
      
      gameContainer = testContainer.querySelector('#contextual-game');
      
      let gameMode = 'explore'; // explore, combat, inventory
      
      gameContainer.addEventListener('keydown', (e) => {
        const helpElement = gameContainer.querySelector('#context-help');
        
        switch (gameMode) {
        case 'explore':
          if (e.key === 'e') {
            e.preventDefault();
            gameState.actions.push('examined object');
            helpElement.textContent = 'You examined the mysterious object.';
          } else if (e.key === 'i') {
            e.preventDefault();
            gameMode = 'inventory';
            helpElement.textContent = 'Inventory mode. Press Tab to navigate items, Escape to close.';
            gameState.actions.push('opened inventory');
          }
          break;
          
        case 'combat':
          if (e.key === 'a') {
            e.preventDefault();
            gameState.actions.push('attacked enemy');
            helpElement.textContent = 'You attacked the enemy!';
          } else if (e.key === 'd') {
            e.preventDefault();
            gameState.actions.push('defended');
            helpElement.textContent = 'You raised your shield!';
          }
          break;
          
        case 'inventory':
          if (e.key === 'Escape') {
            e.preventDefault();
            gameMode = 'explore';
            helpElement.textContent = 'Returned to exploration mode.';
            gameState.actions.push('closed inventory');
          }
          break;
        }
      });

      gameContainer.focus();

      // Test explore mode
      expect(gameMode).toBe('explore');
      
      const examineEvent = new KeyboardEvent('keydown', { key: 'e', bubbles: true });
      gameContainer.dispatchEvent(examineEvent);
      
      expect(gameState.actions).toContain('examined object');
      
      // Switch to inventory mode
      const inventoryEvent = new KeyboardEvent('keydown', { key: 'i', bubbles: true });
      gameContainer.dispatchEvent(inventoryEvent);
      
      expect(gameMode).toBe('inventory');
      expect(gameState.actions).toContain('opened inventory');
      
      // Escape from inventory
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      gameContainer.dispatchEvent(escapeEvent);
      
      expect(gameMode).toBe('explore');
      expect(gameState.actions).toContain('closed inventory');
    });
  });

  describe('Accessibility and Screen Reader Support', () => {
    it('should provide comprehensive game instructions for screen readers', () => {
      testContainer.innerHTML = `
        <div id="accessible-game" tabindex="0" role="application" 
             aria-label="Math Bubble Game" aria-describedby="game-instructions">
          <div id="game-instructions" class="sr-only">
            Welcome to Math Bubble Game. Use arrow keys or WASD to move your character. 
            Press Space to pop bubbles. Press numbers 1-4 to answer math questions. 
            Press Escape or P to pause the game. Your current score and remaining time 
            will be announced as you play.
          </div>
          <div aria-live="assertive" id="score-announcements"></div>
          <div aria-live="polite" id="game-announcements"></div>
        </div>
      `;
      
      gameContainer = testContainer.querySelector('#accessible-game');
      
      expect(gameContainer.getAttribute('aria-describedby')).toBe('game-instructions');
      
      const instructions = testContainer.querySelector('#game-instructions');
      expect(instructions.textContent).toContain('arrow keys or WASD');
      expect(instructions.textContent).toContain('Press Space');
      expect(instructions.textContent).toContain('Press numbers 1-4');
      expect(instructions.textContent).toContain('Press Escape or P');
    });

    it('should announce score changes and game events', () => {
      testContainer.innerHTML = `
        <div id="announcing-game" tabindex="0" role="application" aria-label="Announcing Game">
          <div aria-live="assertive" id="important-announcements"></div>
          <div aria-live="polite" id="casual-announcements"></div>
        </div>
      `;
      
      gameContainer = testContainer.querySelector('#announcing-game');
      
      const announceScore = (score, change) => {
        const important = gameContainer.querySelector('#important-announcements');
        important.textContent = `Score increased by ${change}. New total: ${score}`;
      };
      
      const announceEvent = (message) => {
        const casual = gameContainer.querySelector('#casual-announcements');
        casual.textContent = message;
      };
      
      // Simulate score change
      announceScore(150, 50);
      
      const importantElement = gameContainer.querySelector('#important-announcements');
      expect(importantElement.textContent).toBe('Score increased by 50. New total: 150');
      expect(importantElement.getAttribute('aria-live')).toBe('assertive');
      
      // Simulate game event
      announceEvent('Level completed!');
      
      const casualElement = gameContainer.querySelector('#casual-announcements');
      expect(casualElement.textContent).toBe('Level completed!');
      expect(casualElement.getAttribute('aria-live')).toBe('polite');
    });

    it('should provide keyboard shortcuts help', () => {
      testContainer.innerHTML = `
        <div id="help-game" tabindex="0" role="application" aria-label="Game with Help">
          <div id="shortcuts-help" hidden>
            <h2>Keyboard Shortcuts</h2>
            <dl>
              <dt>Arrow Keys / WASD</dt>
              <dd>Move character</dd>
              <dt>Space</dt>
              <dd>Primary action</dd>
              <dt>Numbers 1-9</dt>
              <dd>Select options</dd>
              <dt>Escape / P</dt>
              <dd>Pause game</dd>
              <dt>H</dt>
              <dd>Show/hide this help</dd>
            </dl>
          </div>
        </div>
      `;
      
      gameContainer = testContainer.querySelector('#help-game');
      
      gameContainer.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'h') {
          e.preventDefault();
          const help = gameContainer.querySelector('#shortcuts-help');
          const isHidden = help.hidden;
          help.hidden = !isHidden;
          
          if (!isHidden) {
            // Focus help content when showing
            help.querySelector('h2').focus();
          } else {
            // Return focus to game when hiding
            gameContainer.focus();
          }
          
          gameState.actions.push(isHidden ? 'showed help' : 'hid help');
        }
      });

      gameContainer.focus();

      const helpEvent = new KeyboardEvent('keydown', { key: 'h', bubbles: true });
      gameContainer.dispatchEvent(helpEvent);

      const helpElement = gameContainer.querySelector('#shortcuts-help');
      expect(helpElement.hidden).toBe(false);
      expect(gameState.actions).toContain('showed help');
      
      // Help should contain all shortcuts
      expect(helpElement.textContent).toContain('Arrow Keys / WASD');
      expect(helpElement.textContent).toContain('Space');
      expect(helpElement.textContent).toContain('Numbers 1-9');
      expect(helpElement.textContent).toContain('Escape / P');
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle rapid key presses without performance issues', () => {
      testContainer.innerHTML = `
        <div id="performance-game" tabindex="0">
          <div id="key-count">Keys pressed: 0</div>
        </div>
      `;
      
      gameContainer = testContainer.querySelector('#performance-game');
      let keyCount = 0;
      
      gameContainer.addEventListener('keydown', (e) => {
        keyCount++;
        const countElement = gameContainer.querySelector('#key-count');
        countElement.textContent = `Keys pressed: ${keyCount}`;
      });

      gameContainer.focus();

      const startTime = performance.now();
      
      // Simulate rapid key presses
      for (let i = 0; i < 100; i++) {
        const keyEvent = new KeyboardEvent('keydown', { 
          key: 'a', 
          bubbles: true 
        });
        gameContainer.dispatchEvent(keyEvent);
      }
      
      const endTime = performance.now();
      
      expect(keyCount).toBe(100);
      expect(endTime - startTime).toBeLessThan(50); // Should complete quickly
    });

    it('should handle invalid key combinations gracefully', () => {
      testContainer.innerHTML = `
        <div id="error-handling-game" tabindex="0">
          <div id="error-log"></div>
        </div>
      `;
      
      gameContainer = testContainer.querySelector('#error-handling-game');
      
      gameContainer.addEventListener('keydown', (e) => {
        try {
          // Simulate potential error conditions
          if (e.key === 'Delete' && e.ctrlKey && e.altKey) {
            throw new Error('Invalid key combination');
          }
          
          // Normal handling
          gameState.actions.push(`handled key: ${e.key}`);
        } catch (error) {
          // Log error but don't crash
          const errorLog = gameContainer.querySelector('#error-log');
          errorLog.textContent = `Error handled: ${error.message}`;
          gameState.actions.push('error handled gracefully');
        }
      });

      gameContainer.focus();

      // Test invalid combination
      const invalidEvent = new KeyboardEvent('keydown', { 
        key: 'Delete',
        ctrlKey: true,
        altKey: true,
        bubbles: true 
      });

      expect(() => {
        gameContainer.dispatchEvent(invalidEvent);
      }).not.toThrow();

      expect(gameState.actions).toContain('error handled gracefully');
    });
  });
});