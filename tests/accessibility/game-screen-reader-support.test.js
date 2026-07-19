/**
 * Game Screen Reader Support Tests
 * Specialized tests for screen reader accessibility in educational games
 * Focuses on real-time announcements, game state changes, and interactive feedback
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '../../src/components/AccessibleComponent.js';
import { AccessibilityService } from '../../src/services/accessibility/AccessibilityService.js';

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
    perf: vi.fn(),
  },
  Logger: vi.fn(),
  LOG_LEVELS: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 },
}));

describe('Game Screen Reader Support Tests', () => {
  let testContainer;
  let service;

  beforeEach(() => {
    // Set up clean DOM
    document.body.innerHTML = '';
    testContainer = document.createElement('div');
    testContainer.id = 'test-container';
    document.body.appendChild(testContainer);

    // Mock timers for announcement testing
    vi.useFakeTimers();

    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      top: 0,
      left: 0,
      bottom: 100,
      right: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
    }));

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();

    service = new AccessibilityService();
  });

  afterEach(() => {
    if (service) {
      service.destroy();
    }
    document.body.innerHTML = '';
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('Math Game Screen Reader Support', () => {
    it('should announce math problem presentation and solutions', () => {
      testContainer.innerHTML = `
        <div class="math-game" role="application" aria-labelledby="game-title">
          <h1 id="game-title">Addition Practice Game</h1>
          
          <div class="game-area">
            <div class="problem-display" aria-live="polite" aria-atomic="true">
              <div id="current-problem" aria-label="Current math problem">
                What is 7 + 5?
              </div>
            </div>

            <div class="answer-options" role="radiogroup" aria-labelledby="current-problem" aria-required="true">
              <label class="answer-option">
                <input type="radio" name="answer" value="10" aria-describedby="option-1-feedback">
                <span class="option-text">10</span>
                <div id="option-1-feedback" class="sr-only">Option A: 10</div>
              </label>
              <label class="answer-option">
                <input type="radio" name="answer" value="12" aria-describedby="option-2-feedback">
                <span class="option-text">12</span>
                <div id="option-2-feedback" class="sr-only">Option B: 12</div>
              </label>
              <label class="answer-option">
                <input type="radio" name="answer" value="11" aria-describedby="option-3-feedback">
                <span class="option-text">11</span>
                <div id="option-3-feedback" class="sr-only">Option C: 11</div>
              </label>
            </div>

            <button type="button" class="submit-answer" aria-describedby="submit-help">
              Submit Answer
            </button>
            <div id="submit-help" class="sr-only">
              Submit your selected answer to receive feedback
            </div>
          </div>

          <div class="game-status" aria-live="polite" class="sr-only">
            Problem 1 of 10. Score: 0 points. Time remaining: 2 minutes.
          </div>

          <div class="answer-feedback" aria-live="assertive" class="sr-only"></div>
          
          <div class="score-announcements" aria-live="polite" class="sr-only"></div>
          
          <div class="level-announcements" aria-live="assertive" class="sr-only"></div>
        </div>
      `;

      const problemDisplay = testContainer.querySelector('.problem-display');
      const gameStatus = testContainer.querySelector('.game-status');
      const answerFeedback = testContainer.querySelector('.answer-feedback');
      const scoreAnnouncements = testContainer.querySelector('.score-announcements');
      const levelAnnouncements = testContainer.querySelector('.level-announcements');
      const radioGroup = testContainer.querySelector('[role="radiogroup"]');

      // Verify problem display setup
      expect(problemDisplay.getAttribute('aria-live')).toBe('polite');
      expect(problemDisplay.getAttribute('aria-atomic')).toBe('true');

      // Verify radio group setup
      expect(radioGroup.getAttribute('aria-labelledby')).toBe('current-problem');
      expect(radioGroup.getAttribute('aria-required')).toBe('true');

      // Test problem announcement
      problemDisplay.textContent = 'New problem: What is 9 + 4?';
      expect(problemDisplay.textContent).toContain('What is 9 + 4?');

      // Test game status updates
      gameStatus.textContent =
        'Problem 2 of 10. Score: 10 points. Time remaining: 1 minute 45 seconds.';
      expect(gameStatus.textContent).toContain('Problem 2 of 10');
      expect(gameStatus.textContent).toContain('Score: 10 points');

      // Test answer feedback
      answerFeedback.textContent = 'Correct! 7 + 5 equals 12. Well done!';
      expect(answerFeedback.textContent).toContain('Correct!');
      expect(answerFeedback.getAttribute('aria-live')).toBe('assertive');

      // Test score announcements
      scoreAnnouncements.textContent = 'Score increased to 20 points!';
      expect(scoreAnnouncements.textContent).toContain('Score increased');

      // Test level announcements
      levelAnnouncements.textContent = 'Level completed! Moving to Level 2: Subtraction.';
      expect(levelAnnouncements.textContent).toContain('Level completed');
      expect(levelAnnouncements.getAttribute('aria-live')).toBe('assertive');
    });

    it('should handle bubble pop game with spatial audio descriptions', () => {
      testContainer.innerHTML = `
        <div class="bubble-game" role="application" aria-labelledby="bubble-game-title">
          <h1 id="bubble-game-title">Math Bubble Pop</h1>
          
          <div class="game-instructions" id="bubble-instructions">
            Pop bubbles containing correct answers to the math problems. 
            Bubbles are arranged in a 5x4 grid. Use arrow keys to navigate, 
            space bar to pop bubbles.
          </div>

          <div class="game-field" 
               role="grid" 
               aria-label="Game playing field with math bubbles"
               aria-describedby="bubble-instructions current-objective"
               tabindex="0"
               aria-rowcount="4"
               aria-colcount="5">
            
            <div role="row" aria-rowindex="1">
              <div role="gridcell" 
                   aria-colindex="1" 
                   class="bubble"
                   aria-label="Bubble at row 1, column 1, contains answer 15"
                   data-answer="15"
                   tabindex="-1">
                15
              </div>
              <div role="gridcell" 
                   aria-colindex="2" 
                   class="bubble"
                   aria-label="Bubble at row 1, column 2, contains answer 8"
                   data-answer="8"
                   tabindex="-1">
                8
              </div>
              <div role="gridcell" 
                   aria-colindex="3" 
                   class="bubble"
                   aria-label="Bubble at row 1, column 3, contains answer 12"
                   data-answer="12"
                   tabindex="-1">
                12
              </div>
            </div>
          </div>

          <div id="current-objective" class="game-objective" aria-live="polite">
            Find and pop bubbles with the answer to: 7 + 8
          </div>

          <div class="bubble-feedback" aria-live="assertive" class="sr-only"></div>
          
          <div class="position-announcements" aria-live="polite" class="sr-only"></div>
          
          <div class="game-progress" aria-live="polite" class="sr-only"></div>
        </div>
      `;

      const gameField = testContainer.querySelector('.game-field');
      const bubbles = testContainer.querySelectorAll('.bubble');
      const objective = testContainer.querySelector('#current-objective');
      const bubbleFeedback = testContainer.querySelector('.bubble-feedback');
      const positionAnnouncements = testContainer.querySelector('.position-announcements');
      const gameProgress = testContainer.querySelector('.game-progress');

      // Verify game field setup
      expect(gameField.getAttribute('role')).toBe('grid');
      expect(gameField.getAttribute('aria-rowcount')).toBe('4');
      expect(gameField.getAttribute('aria-colcount')).toBe('5');
      expect(gameField.getAttribute('tabindex')).toBe('0');

      // Verify bubble labeling includes position
      bubbles.forEach(bubble => {
        const label = bubble.getAttribute('aria-label');
        expect(label).toContain('row');
        expect(label).toContain('column');
        expect(label).toContain('contains answer');
      });

      // Test objective announcement
      expect(objective.getAttribute('aria-live')).toBe('polite');
      expect(objective.textContent).toContain('Find and pop bubbles');

      // Test position navigation announcements
      positionAnnouncements.textContent = 'Moved to row 1, column 2. Bubble contains 8.';
      expect(positionAnnouncements.textContent).toContain('Moved to row 1, column 2');

      // Test bubble interaction feedback
      bubbleFeedback.textContent = 'Bubble popped! 15 is correct for 7 + 8.';
      expect(bubbleFeedback.textContent).toContain('Bubble popped!');
      expect(bubbleFeedback.getAttribute('aria-live')).toBe('assertive');

      // Test game progress updates
      gameProgress.textContent = '3 of 10 correct bubbles found. Keep going!';
      expect(gameProgress.textContent).toContain('3 of 10 correct');
    });

    it('should provide comprehensive word scramble game announcements', () => {
      testContainer.innerHTML = `
        <div class="word-scramble-game" role="application" aria-labelledby="scramble-title">
          <h1 id="scramble-title">Vocabulary Word Scramble</h1>
          
          <div class="game-setup">
            <div class="topic-display" id="current-topic">
              Current Topic: Animals
            </div>
            
            <div class="scrambled-word" aria-live="polite" aria-atomic="true">
              <div id="scramble-display" aria-label="Scrambled letters">
                TAC (unscramble to find the animal)
              </div>
            </div>

            <div class="hint-section">
              <button type="button" 
                      class="hint-button" 
                      aria-expanded="false"
                      aria-controls="current-hint"
                      aria-describedby="hint-help">
                Show Hint
              </button>
              <div id="hint-help" class="sr-only">
                Get a clue to help solve the word scramble
              </div>
              <div id="current-hint" 
                   aria-hidden="true" 
                   aria-live="polite"
                   class="hint-content">
                <!-- Hint appears here when button is pressed -->
              </div>
            </div>
          </div>

          <div class="answer-input-section">
            <label for="word-input">Your Answer:</label>
            <input type="text" 
                   id="word-input" 
                   name="wordAnswer"
                   aria-describedby="input-help answer-status"
                   aria-invalid="false"
                   autocomplete="off"
                   placeholder="Type the unscrambled word">
            <div id="input-help" class="help-text">
              Type your answer and press Enter or click Submit
            </div>
            <div id="answer-status" aria-live="polite" class="sr-only"></div>
            
            <button type="submit" class="submit-word" aria-describedby="submit-help">
              Submit Answer
            </button>
            <div id="submit-help" class="sr-only">
              Submit your unscrambled word for checking
            </div>
          </div>

          <div class="game-feedback" aria-live="assertive" class="sr-only"></div>
          
          <div class="word-progress" aria-live="polite" class="sr-only">
            Word 1 of 10. Score: 0 points.
          </div>
          
          <div class="achievement-announcements" aria-live="polite" class="sr-only"></div>
        </div>
      `;

      const scrambledDisplay = testContainer.querySelector('.scrambled-word');
      const hintButton = testContainer.querySelector('.hint-button');
      const hintContent = testContainer.querySelector('#current-hint');
      testContainer.querySelector('#word-input');
      const answerStatus = testContainer.querySelector('#answer-status');
      const gameFeedback = testContainer.querySelector('.game-feedback');
      const wordProgress = testContainer.querySelector('.word-progress');
      const achievements = testContainer.querySelector('.achievement-announcements');

      // Verify scrambled word display
      expect(scrambledDisplay.getAttribute('aria-live')).toBe('polite');
      expect(scrambledDisplay.getAttribute('aria-atomic')).toBe('true');

      // Verify hint functionality
      expect(hintButton.getAttribute('aria-expanded')).toBe('false');
      expect(hintButton.getAttribute('aria-controls')).toBe('current-hint');
      expect(hintContent.getAttribute('aria-hidden')).toBe('true');

      // Test hint reveal
      hintButton.setAttribute('aria-expanded', 'true');
      hintContent.setAttribute('aria-hidden', 'false');
      hintContent.textContent = 'This animal says meow and catches mice.';

      expect(hintContent.getAttribute('aria-live')).toBe('polite');
      expect(hintContent.textContent).toContain('This animal says meow');

      // Test input status updates
      answerStatus.textContent = 'You typed: CAT. Press submit to check your answer.';
      expect(answerStatus.textContent).toContain('You typed: CAT');

      // Test answer feedback
      gameFeedback.textContent = 'Correct! CAT is the right answer. Well done!';
      expect(gameFeedback.textContent).toContain('Correct! CAT');
      expect(gameFeedback.getAttribute('aria-live')).toBe('assertive');

      // Test progress updates
      wordProgress.textContent = 'Word 2 of 10. Score: 10 points. Great progress!';
      expect(wordProgress.textContent).toContain('Word 2 of 10');

      // Test achievement announcements
      achievements.textContent = 'Achievement unlocked: Word Wizard! Solved 5 words in a row.';
      expect(achievements.textContent).toContain('Achievement unlocked');
    });
  });

  describe('Game Timer and Countdown Announcements', () => {
    it('should announce timer milestones and urgency', () => {
      testContainer.innerHTML = `
        <div class="timed-game" role="application" aria-labelledby="timer-game-title">
          <h1 id="timer-game-title">Speed Math Challenge</h1>
          
          <div class="timer-display" role="timer" aria-live="polite" aria-atomic="true">
            <div id="time-remaining" aria-label="Time remaining">
              2:00
            </div>
          </div>

          <div class="timer-announcements" aria-live="polite" class="sr-only"></div>
          
          <div class="urgent-timer-alerts" aria-live="assertive" class="sr-only"></div>
          
          <div class="countdown-announcements" aria-live="assertive" class="sr-only"></div>
        </div>
      `;

      const timerDisplay = testContainer.querySelector('.timer-display');
      const timerAnnouncements = testContainer.querySelector('.timer-announcements');
      const urgentAlerts = testContainer.querySelector('.urgent-timer-alerts');
      const countdownAnnouncements = testContainer.querySelector('.countdown-announcements');

      // Verify timer setup
      expect(timerDisplay.getAttribute('role')).toBe('timer');
      expect(timerDisplay.getAttribute('aria-live')).toBe('polite');

      // Test regular timer announcements (polite)
      timerAnnouncements.textContent = '1 minute remaining';
      expect(timerAnnouncements.textContent).toBe('1 minute remaining');
      expect(timerAnnouncements.getAttribute('aria-live')).toBe('polite');

      // Test urgent timer alerts (assertive)
      urgentAlerts.textContent = '30 seconds left! Work quickly!';
      expect(urgentAlerts.textContent).toContain('30 seconds left');
      expect(urgentAlerts.getAttribute('aria-live')).toBe('assertive');

      urgentAlerts.textContent = '10 seconds remaining!';
      expect(urgentAlerts.textContent).toBe('10 seconds remaining!');

      // Test countdown sequence
      const countdownSequence = ['3', '2', '1', "Time's up!"];
      countdownSequence.forEach(announcement => {
        countdownAnnouncements.textContent = announcement;
        expect(countdownAnnouncements.textContent).toBe(announcement);
      });

      expect(countdownAnnouncements.getAttribute('aria-live')).toBe('assertive');
    });

    it('should handle pause and resume announcements', () => {
      testContainer.innerHTML = `
        <div class="pausable-game" role="application">
          <div class="game-controls">
            <button type="button" 
                    id="pause-button" 
                    aria-pressed="false"
                    aria-describedby="pause-help">
              Pause Game
            </button>
            <div id="pause-help" class="sr-only">
              Pause or resume the current game
            </div>
          </div>

          <div class="pause-status" aria-live="assertive" class="sr-only"></div>
          
          <div class="resume-countdown" aria-live="assertive" class="sr-only"></div>
        </div>
      `;

      const pauseButton = testContainer.querySelector('#pause-button');
      const pauseStatus = testContainer.querySelector('.pause-status');
      const resumeCountdown = testContainer.querySelector('.resume-countdown');

      // Test pause announcement
      pauseButton.setAttribute('aria-pressed', 'true');
      pauseButton.textContent = 'Resume Game';
      pauseStatus.textContent = 'Game paused. Press Resume to continue or use keyboard shortcuts.';

      expect(pauseButton.getAttribute('aria-pressed')).toBe('true');
      expect(pauseStatus.textContent).toContain('Game paused');
      expect(pauseStatus.getAttribute('aria-live')).toBe('assertive');

      // Test resume countdown
      const resumeSequence = ['Resuming in 3', 'Resuming in 2', 'Resuming in 1', 'Game resumed!'];
      resumeSequence.forEach(announcement => {
        resumeCountdown.textContent = announcement;
        expect(resumeCountdown.textContent).toBe(announcement);
      });

      // Test final resume state
      pauseButton.setAttribute('aria-pressed', 'false');
      pauseButton.textContent = 'Pause Game';
      pauseStatus.textContent = 'Game resumed. Timer is now running.';

      expect(pauseStatus.textContent).toContain('Game resumed');
    });
  });

  describe('Game Help and Instruction Announcements', () => {
    it('should provide context-sensitive help announcements', () => {
      testContainer.innerHTML = `
        <div class="educational-game" role="application" aria-labelledby="help-game-title">
          <h1 id="help-game-title">Fraction Pizza Game</h1>
          
          <div class="help-system">
            <button type="button" 
                    class="help-button" 
                    aria-expanded="false"
                    aria-controls="context-help"
                    aria-describedby="help-button-desc">
              Get Help
            </button>
            <div id="help-button-desc" class="sr-only">
              Get context-sensitive help for the current game situation
            </div>
            
            <div id="context-help" 
                 aria-hidden="true" 
                 aria-live="polite"
                 role="dialog"
                 aria-labelledby="help-title">
              <h2 id="help-title">Game Help</h2>
              <div class="help-content">
                <!-- Context-sensitive help content -->
              </div>
              <button type="button" class="close-help" aria-label="Close help">×</button>
            </div>
          </div>

          <div class="tutorial-announcements" aria-live="polite" class="sr-only"></div>
          
          <div class="hint-system">
            <button type="button" 
                    class="smart-hint-button"
                    aria-describedby="hint-button-desc">
              Smart Hint
            </button>
            <div id="hint-button-desc" class="sr-only">
              Get a personalized hint based on your current progress
            </div>
            
            <div class="smart-hints" aria-live="polite" class="sr-only"></div>
          </div>

          <div class="mistake-feedback" aria-live="assertive" class="sr-only"></div>
        </div>
      `;

      const helpButton = testContainer.querySelector('.help-button');
      const contextHelp = testContainer.querySelector('#context-help');
      const tutorialAnnouncements = testContainer.querySelector('.tutorial-announcements');
      const smartHints = testContainer.querySelector('.smart-hints');
      const mistakeFeedback = testContainer.querySelector('.mistake-feedback');

      // Test context help activation
      helpButton.setAttribute('aria-expanded', 'true');
      contextHelp.setAttribute('aria-hidden', 'false');

      expect(contextHelp.getAttribute('role')).toBe('dialog');
      expect(contextHelp.getAttribute('aria-labelledby')).toBe('help-title');

      // Test tutorial announcements
      tutorialAnnouncements.textContent =
        "Welcome to the Fraction Pizza Game! Your goal is to divide pizzas into equal parts. Let's start with halves.";
      expect(tutorialAnnouncements.textContent).toContain('Welcome to the Fraction Pizza Game');
      expect(tutorialAnnouncements.getAttribute('aria-live')).toBe('polite');

      // Test smart hints
      smartHints.textContent =
        'Hint: Try dividing the pizza into 2 equal pieces first. Each piece will be 1/2 of the whole pizza.';
      expect(smartHints.textContent).toContain('Try dividing the pizza');
      expect(smartHints.getAttribute('aria-live')).toBe('polite');

      // Test mistake feedback
      mistakeFeedback.textContent =
        "That's not quite right. Remember, for halves, you need 2 equal pieces. Try again!";
      expect(mistakeFeedback.textContent).toContain('not quite right');
      expect(mistakeFeedback.getAttribute('aria-live')).toBe('assertive');
    });

    it('should handle progressive skill building announcements', () => {
      testContainer.innerHTML = `
        <div class="skill-building-game" role="application">
          <div class="skill-level-display" aria-live="polite">
            Current Skill Level: Beginner Addition (Level 1)
          </div>

          <div class="skill-progress" aria-live="polite" class="sr-only"></div>
          
          <div class="mastery-announcements" aria-live="assertive" class="sr-only"></div>
          
          <div class="next-skill-preview" aria-live="polite" class="sr-only"></div>
          
          <div class="encouragement-messages" aria-live="polite" class="sr-only"></div>
        </div>
      `;

      const skillProgress = testContainer.querySelector('.skill-progress');
      const masteryAnnouncements = testContainer.querySelector('.mastery-announcements');
      const nextSkillPreview = testContainer.querySelector('.next-skill-preview');
      const encouragementMessages = testContainer.querySelector('.encouragement-messages');

      // Test skill progress updates
      skillProgress.textContent =
        "Skill Progress: 7 out of 10 problems correct. You're doing great!";
      expect(skillProgress.textContent).toContain('7 out of 10 problems correct');

      // Test mastery announcements
      masteryAnnouncements.textContent =
        "Skill Mastered! You've successfully completed Beginner Addition. Ready for the next challenge?";
      expect(masteryAnnouncements.textContent).toContain('Skill Mastered!');
      expect(masteryAnnouncements.getAttribute('aria-live')).toBe('assertive');

      // Test next skill preview
      nextSkillPreview.textContent =
        "Next up: Double-Digit Addition. You'll learn to add numbers like 25 + 17.";
      expect(nextSkillPreview.textContent).toContain('Next up: Double-Digit Addition');

      // Test encouragement messages
      const encouragementMessages_array = [
        "Great job! You're getting better at this.",
        'Keep it up! Practice makes perfect.',
        "You're on fire! Three correct answers in a row!",
      ];

      encouragementMessages_array.forEach(message => {
        encouragementMessages.textContent = message;
        expect(encouragementMessages.textContent).toBe(message);
      });
    });
  });

  describe('Multiplayer Game Screen Reader Support', () => {
    it('should announce player actions and turn management', () => {
      testContainer.innerHTML = `
        <div class="multiplayer-game" role="application" aria-labelledby="multiplayer-title">
          <h1 id="multiplayer-title">Math Team Challenge</h1>
          
          <div class="player-info" role="group" aria-label="Player information">
            <div class="current-player" aria-live="polite">
              Current Turn: Sarah (You)
            </div>
            
            <div class="player-list" role="list" aria-label="All players">
              <div role="listitem" class="player" aria-describedby="player-1-status">
                <span class="player-name">Sarah (You)</span>
                <span id="player-1-status" class="player-status">Score: 150 points, Turn: Active</span>
              </div>
              <div role="listitem" class="player" aria-describedby="player-2-status">
                <span class="player-name">Mike</span>
                <span id="player-2-status" class="player-status">Score: 130 points, Turn: Waiting</span>
              </div>
              <div role="listitem" class="player" aria-describedby="player-3-status">
                <span class="player-name">Emma</span>
                <span id="player-3-status" class="player-status">Score: 140 points, Turn: Waiting</span>
              </div>
            </div>
          </div>

          <div class="turn-announcements" aria-live="assertive" class="sr-only"></div>
          
          <div class="player-action-feed" aria-live="polite" class="sr-only"></div>
          
          <div class="chat-announcements" aria-live="polite" class="sr-only"></div>
          
          <div class="game-events" aria-live="assertive" class="sr-only"></div>
        </div>
      `;

      testContainer.querySelector('.current-player');
      const turnAnnouncements = testContainer.querySelector('.turn-announcements');
      const playerActionFeed = testContainer.querySelector('.player-action-feed');
      const chatAnnouncements = testContainer.querySelector('.chat-announcements');
      const gameEvents = testContainer.querySelector('.game-events');

      // Test turn announcements
      turnAnnouncements.textContent =
        "It's now Mike's turn. Sarah, please wait for your next turn.";
      expect(turnAnnouncements.textContent).toContain("It's now Mike's turn");
      expect(turnAnnouncements.getAttribute('aria-live')).toBe('assertive');

      // Test player action feed
      playerActionFeed.textContent = 'Mike answered: 15. Correct! Mike earned 10 points.';
      expect(playerActionFeed.textContent).toContain('Mike answered: 15. Correct!');

      // Test chat announcements
      chatAnnouncements.textContent = 'Emma says: Good job everyone!';
      expect(chatAnnouncements.textContent).toContain('Emma says:');

      // Test game events
      gameEvents.textContent = 'Round 2 complete! Leading player: Sarah with 160 points.';
      expect(gameEvents.textContent).toContain('Round 2 complete!');
      expect(gameEvents.getAttribute('aria-live')).toBe('assertive');
    });

    it('should handle collaborative problem-solving announcements', () => {
      testContainer.innerHTML = `
        <div class="collaborative-game" role="application">
          <div class="team-problem" aria-live="polite" aria-atomic="true">
            Team Challenge: Work together to solve this word problem.
          </div>

          <div class="collaboration-status" aria-live="polite" class="sr-only">
            3 team members online. Sarah is typing an answer.
          </div>
          
          <div class="team-progress" aria-live="polite" class="sr-only"></div>
          
          <div class="teammate-actions" aria-live="polite" class="sr-only"></div>
          
          <div class="team-achievements" aria-live="assertive" class="sr-only"></div>
        </div>
      `;

      const collaborationStatus = testContainer.querySelector('.collaboration-status');
      const teamProgress = testContainer.querySelector('.team-progress');
      const teammateActions = testContainer.querySelector('.teammate-actions');
      const teamAchievements = testContainer.querySelector('.team-achievements');

      // Test collaboration status updates
      collaborationStatus.textContent = '2 team members online. Mike is reviewing the problem.';
      expect(collaborationStatus.textContent).toContain('2 team members online');

      // Test team progress
      teamProgress.textContent = 'Team Progress: Step 1 complete. Now working on Step 2 of 4.';
      expect(teamProgress.textContent).toContain('Step 1 complete');

      // Test teammate actions
      teammateActions.textContent =
        'Emma added a helpful hint: Remember to multiply before adding.';
      expect(teammateActions.textContent).toContain('Emma added a helpful hint');

      // Test team achievements
      teamAchievements.textContent =
        'Team Achievement: Perfect Collaboration! All members contributed to the solution.';
      expect(teamAchievements.textContent).toContain('Team Achievement');
      expect(teamAchievements.getAttribute('aria-live')).toBe('assertive');
    });
  });

  describe('Game Accessibility Settings and Preferences', () => {
    it('should announce accessibility option changes', () => {
      testContainer.innerHTML = `
        <div class="game-accessibility-settings" role="dialog" aria-labelledby="settings-title">
          <h2 id="settings-title">Accessibility Settings</h2>
          
          <fieldset>
            <legend>Screen Reader Options</legend>
            
            <label>
              <input type="checkbox" 
                     id="verbose-announcements" 
                     name="verboseAnnouncements"
                     aria-describedby="verbose-help">
              Enable Verbose Announcements
            </label>
            <div id="verbose-help" class="help-text">
              Provides detailed descriptions of all game actions and events
            </div>

            <label>
              <input type="checkbox" 
                     id="position-announcements" 
                     name="positionAnnouncements"
                     aria-describedby="position-help">
              Announce Position Changes
            </label>
            <div id="position-help" class="help-text">
              Announces your position when navigating game elements
            </div>

            <label>
              <input type="checkbox" 
                     id="score-announcements" 
                     name="scoreAnnouncements"
                     checked
                     aria-describedby="score-help">
              Announce Score Changes
            </label>
            <div id="score-help" class="help-text">
              Announces when your score increases or decreases
            </div>
          </fieldset>

          <fieldset>
            <legend>Audio Preferences</legend>
            
            <div class="form-group">
              <label for="announcement-speed">Announcement Speed</label>
              <input type="range" 
                     id="announcement-speed" 
                     name="announcementSpeed"
                     min="0.5" 
                     max="2" 
                     step="0.1" 
                     value="1"
                     aria-describedby="speed-help speed-value">
              <div id="speed-value" class="sr-only">Current speed: Normal (1.0x)</div>
              <div id="speed-help" class="help-text">
                Adjust how fast announcements are spoken
              </div>
            </div>
          </fieldset>

          <div class="settings-status" aria-live="polite" class="sr-only"></div>
        </div>
      `;

      const verboseCheckbox = testContainer.querySelector('#verbose-announcements');
      const positionCheckbox = testContainer.querySelector('#position-announcements');
      const speedSlider = testContainer.querySelector('#announcement-speed');
      const speedValue = testContainer.querySelector('#speed-value');
      const settingsStatus = testContainer.querySelector('.settings-status');

      // Test verbose announcements toggle
      verboseCheckbox.checked = true;
      settingsStatus.textContent =
        'Verbose announcements enabled. You will now receive detailed descriptions.';
      expect(settingsStatus.textContent).toContain('Verbose announcements enabled');

      // Test position announcements toggle
      positionCheckbox.checked = true;
      settingsStatus.textContent =
        'Position announcements enabled. Navigation changes will be announced.';
      expect(settingsStatus.textContent).toContain('Position announcements enabled');

      // Test speed adjustment
      speedSlider.value = '1.5';
      speedValue.textContent = 'Current speed: Fast (1.5x)';
      settingsStatus.textContent = 'Announcement speed changed to 1.5x normal speed.';

      expect(speedValue.textContent).toContain('Fast (1.5x)');
      expect(settingsStatus.textContent).toContain('speed changed to 1.5x');
    });

    it('should handle game difficulty adjustments with announcements', () => {
      testContainer.innerHTML = `
        <div class="difficulty-settings">
          <div class="current-difficulty" aria-live="polite">
            Current Difficulty: Medium
          </div>

          <div class="difficulty-controls" role="group" aria-labelledby="difficulty-label">
            <div id="difficulty-label">Game Difficulty</div>
            <button type="button" class="difficulty-btn" data-level="easy" aria-pressed="false">
              Easy
            </button>
            <button type="button" class="difficulty-btn" data-level="medium" aria-pressed="true">
              Medium
            </button>
            <button type="button" class="difficulty-btn" data-level="hard" aria-pressed="false">
              Hard
            </button>
          </div>

          <div class="difficulty-description" id="difficulty-desc" aria-live="polite">
            Medium difficulty: 5-10 problems, hints available, 3 minutes per problem.
          </div>

          <div class="adaptive-difficulty-status" aria-live="polite" class="sr-only"></div>
        </div>
      `;

      const currentDifficulty = testContainer.querySelector('.current-difficulty');
      const difficultyButtons = testContainer.querySelectorAll('.difficulty-btn');
      const difficultyDescription = testContainer.querySelector('#difficulty-desc');
      const adaptiveStatus = testContainer.querySelector('.adaptive-difficulty-status');

      // Test difficulty change
      difficultyButtons[0].setAttribute('aria-pressed', 'true'); // Easy
      difficultyButtons[1].setAttribute('aria-pressed', 'false'); // Medium

      currentDifficulty.textContent = 'Current Difficulty: Easy';
      difficultyDescription.textContent =
        'Easy difficulty: 3-5 problems, extra hints available, 5 minutes per problem.';

      expect(currentDifficulty.textContent).toBe('Current Difficulty: Easy');
      expect(difficultyDescription.textContent).toContain('Easy difficulty');

      // Test adaptive difficulty
      adaptiveStatus.textContent =
        'Difficulty automatically adjusted to Medium based on your performance.';
      expect(adaptiveStatus.textContent).toContain('automatically adjusted to Medium');
    });
  });
});
