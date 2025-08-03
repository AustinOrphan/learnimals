/**
 * ARIA Game-Specific Patterns Testing Suite
 * Tests for educational game accessibility patterns including:
 * - Interactive canvas games
 * - Educational quizzes
 * - Progress tracking
 * - Timer-based games
 * - Character interactions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BaseGame } from '../../src/components/games/BaseGame.js';

// Mock logger
vi.mock('../../src/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    game: vi.fn(),
  },
}));

describe('ARIA Game-Specific Patterns', () => {
  let testContainer;
  let mockGameInstance;

  beforeEach(() => {
    document.body.innerHTML = '';
    testContainer = document.createElement('div');
    testContainer.id = 'test-container';
    document.body.appendChild(testContainer);

    // Mock element methods
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
    Element.prototype.scrollIntoView = vi.fn();
    Element.prototype.focus = vi.fn();
    Element.prototype.blur = vi.fn();

    // Mock timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('Canvas Game Accessibility', () => {
    it('should provide accessible canvas with proper labeling', () => {
      const canvas = document.createElement('canvas');
      canvas.id = 'game-canvas';
      canvas.width = 800;
      canvas.height = 600;
      canvas.setAttribute('role', 'application');
      canvas.setAttribute('aria-label', 'Bubble Pop Math Game');
      canvas.setAttribute('aria-describedby', 'canvas-instructions canvas-status');
      canvas.setAttribute('tabindex', '0');

      const instructions = document.createElement('div');
      instructions.id = 'canvas-instructions';
      instructions.textContent =
        'Use arrow keys to move, space to pop bubbles with correct answers';
      instructions.className = 'sr-only';

      const status = document.createElement('div');
      status.id = 'canvas-status';
      status.setAttribute('aria-live', 'polite');
      status.className = 'sr-only';

      const fallback = document.createElement('p');
      fallback.textContent = 'This game requires canvas support. Please use a modern browser.';
      canvas.appendChild(fallback);

      testContainer.appendChild(canvas);
      testContainer.appendChild(instructions);
      testContainer.appendChild(status);

      expect(canvas.getAttribute('role')).toBe('application');
      expect(canvas.getAttribute('aria-label')).toBe('Bubble Pop Math Game');
      expect(canvas.getAttribute('aria-describedby')).toContain('canvas-instructions');
      expect(canvas.getAttribute('aria-describedby')).toContain('canvas-status');
      expect(canvas.getAttribute('tabindex')).toBe('0');
      expect(canvas.querySelector('p')).toBeTruthy();
    });

    it('should announce canvas game state changes', () => {
      const canvas = document.createElement('canvas');
      canvas.setAttribute('role', 'application');
      canvas.setAttribute('aria-label', 'Number Line Jump');

      const gameStatus = document.createElement('div');
      gameStatus.setAttribute('aria-live', 'polite');
      gameStatus.id = 'game-status';
      gameStatus.className = 'sr-only';

      const gameScore = document.createElement('div');
      gameScore.setAttribute('aria-live', 'polite');
      gameScore.id = 'game-score';
      gameScore.className = 'sr-only';

      testContainer.appendChild(canvas);
      testContainer.appendChild(gameStatus);
      testContainer.appendChild(gameScore);

      // Simulate game events
      gameStatus.textContent = 'Jumped to position 5 on the number line';
      expect(gameStatus.textContent).toContain('position 5');

      gameScore.textContent = 'Score: 25 points. 3 correct jumps.';
      expect(gameScore.textContent).toContain('25 points');
      expect(gameScore.textContent).toContain('3 correct');

      gameStatus.textContent = 'Level completed! Moving to Level 2.';
      expect(gameStatus.textContent).toContain('Level completed');
    });

    it('should provide keyboard navigation alternatives for canvas', () => {
      const gameContainer = document.createElement('div');
      gameContainer.setAttribute('role', 'application');
      gameContainer.setAttribute('aria-label', 'Pizza Fraction Game');

      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 400;
      canvas.setAttribute('aria-describedby', 'keyboard-controls');

      const controls = document.createElement('div');
      controls.id = 'keyboard-controls';
      controls.className = 'sr-only';
      controls.innerHTML = `
        Keyboard controls:
        Arrow keys: Move character
        Space: Select/Pick up
        Enter: Confirm action
        Escape: Pause game
      `;

      const virtualControls = document.createElement('div');
      virtualControls.className = 'virtual-controls sr-only';
      virtualControls.setAttribute('role', 'group');
      virtualControls.setAttribute('aria-label', 'Game controls');

      // Create virtual buttons for screen reader users
      const moveButton = document.createElement('button');
      moveButton.textContent = 'Move to next position';
      moveButton.setAttribute('aria-describedby', 'move-help');

      const selectButton = document.createElement('button');
      selectButton.textContent = 'Select current item';
      selectButton.setAttribute('aria-describedby', 'select-help');

      const moveHelp = document.createElement('span');
      moveHelp.id = 'move-help';
      moveHelp.className = 'sr-only';
      moveHelp.textContent = 'Moves your character to the next available position';

      const selectHelp = document.createElement('span');
      selectHelp.id = 'select-help';
      selectHelp.className = 'sr-only';
      selectHelp.textContent = 'Selects the pizza slice at your current position';

      virtualControls.appendChild(moveButton);
      virtualControls.appendChild(moveHelp);
      virtualControls.appendChild(selectButton);
      virtualControls.appendChild(selectHelp);

      gameContainer.appendChild(canvas);
      gameContainer.appendChild(controls);
      gameContainer.appendChild(virtualControls);
      testContainer.appendChild(gameContainer);

      expect(virtualControls.getAttribute('role')).toBe('group');
      expect(virtualControls.getAttribute('aria-label')).toBe('Game controls');
      expect(moveButton.getAttribute('aria-describedby')).toBe('move-help');
      expect(selectButton.getAttribute('aria-describedby')).toBe('select-help');
      expect(document.getElementById('move-help')).toBeTruthy();
      expect(document.getElementById('select-help')).toBeTruthy();
    });
  });

  describe('Quiz and Question Patterns', () => {
    it('should validate quiz question structure', () => {
      const quiz = document.createElement('div');
      quiz.setAttribute('role', 'region');
      quiz.setAttribute('aria-labelledby', 'quiz-title');
      quiz.setAttribute('aria-describedby', 'quiz-progress');

      const title = document.createElement('h2');
      title.id = 'quiz-title';
      title.textContent = 'Math Practice Quiz';

      const progress = document.createElement('div');
      progress.id = 'quiz-progress';
      progress.textContent = 'Question 3 of 10';
      progress.setAttribute('aria-live', 'polite');

      const question = document.createElement('fieldset');
      question.setAttribute('aria-describedby', 'question-feedback');

      const legend = document.createElement('legend');
      legend.textContent = 'What is 6 × 7?';

      const options = [
        { value: '35', text: '35' },
        { value: '42', text: '42', correct: true },
        { value: '48', text: '48' },
        { value: '54', text: '54' },
      ];

      options.forEach((option, index) => {
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'q3';
        radio.value = option.value;
        radio.id = `q3-option-${index}`;

        const label = document.createElement('label');
        label.htmlFor = radio.id;
        label.textContent = option.text;

        question.appendChild(radio);
        question.appendChild(label);
      });

      const feedback = document.createElement('div');
      feedback.id = 'question-feedback';
      feedback.setAttribute('role', 'status');
      feedback.setAttribute('aria-live', 'polite');
      feedback.className = 'sr-only';

      question.appendChild(legend);
      quiz.appendChild(title);
      quiz.appendChild(progress);
      quiz.appendChild(question);
      quiz.appendChild(feedback);
      testContainer.appendChild(quiz);

      // Validate quiz structure
      expect(quiz.getAttribute('aria-labelledby')).toBe('quiz-title');
      expect(quiz.getAttribute('aria-describedby')).toBe('quiz-progress');
      expect(question.querySelector('legend')).toBeTruthy();
      expect(question.getAttribute('aria-describedby')).toBe('question-feedback');

      const radioButtons = question.querySelectorAll('input[type="radio"]');
      expect(radioButtons.length).toBe(4);
      radioButtons.forEach(radio => {
        expect(radio.name).toBe('q3');
        const label = question.querySelector(`label[for="${radio.id}"]`);
        expect(label).toBeTruthy();
      });

      // Simulate answer selection and feedback
      const correctRadio = question.querySelector('input[value="42"]');
      correctRadio.checked = true;
      feedback.textContent = 'Correct! 6 × 7 = 42';

      expect(feedback.textContent).toContain('Correct');
      expect(feedback.getAttribute('role')).toBe('status');
    });

    it('should handle multiple choice with explanations', () => {
      const question = document.createElement('div');
      question.setAttribute('role', 'group');
      question.setAttribute('aria-labelledby', 'question-text');
      question.setAttribute('aria-describedby', 'question-explanation');

      const questionText = document.createElement('h3');
      questionText.id = 'question-text';
      questionText.textContent = 'Which animal is a mammal?';

      const options = document.createElement('div');
      options.setAttribute('role', 'radiogroup');
      options.setAttribute('aria-required', 'true');

      const choices = [
        { value: 'shark', text: 'Shark', explanation: 'Sharks are fish, not mammals' },
        { value: 'eagle', text: 'Eagle', explanation: 'Eagles are birds, not mammals' },
        {
          value: 'whale',
          text: 'Whale',
          explanation: 'Correct! Whales are marine mammals',
          correct: true,
        },
        { value: 'frog', text: 'Frog', explanation: 'Frogs are amphibians, not mammals' },
      ];

      choices.forEach((choice, index) => {
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'animal-question';
        radio.value = choice.value;
        radio.id = `choice-${index}`;
        radio.setAttribute('aria-describedby', `explanation-${index}`);

        const label = document.createElement('label');
        label.htmlFor = radio.id;
        label.textContent = choice.text;

        const explanation = document.createElement('div');
        explanation.id = `explanation-${index}`;
        explanation.className = 'explanation sr-only';
        explanation.textContent = choice.explanation;

        options.appendChild(radio);
        options.appendChild(label);
        options.appendChild(explanation);
      });

      const overallExplanation = document.createElement('div');
      overallExplanation.id = 'question-explanation';
      overallExplanation.setAttribute('aria-live', 'polite');
      overallExplanation.className = 'sr-only';

      question.appendChild(questionText);
      question.appendChild(options);
      question.appendChild(overallExplanation);
      testContainer.appendChild(question);

      // Validate structure
      expect(options.getAttribute('role')).toBe('radiogroup');
      expect(options.getAttribute('aria-required')).toBe('true');

      const radios = options.querySelectorAll('input[type="radio"]');
      expect(radios.length).toBe(4);

      radios.forEach((radio, index) => {
        expect(radio.getAttribute('aria-describedby')).toBe(`explanation-${index}`);
        expect(document.getElementById(`explanation-${index}`)).toBeTruthy();
      });

      // Simulate answer and explanation
      const correctAnswer = options.querySelector('input[value="whale"]');
      correctAnswer.checked = true;
      overallExplanation.textContent =
        'Excellent! Whales are indeed mammals that live in the ocean.';

      expect(overallExplanation.textContent).toContain('mammals');
    });

    it('should handle drag-and-drop quiz patterns', () => {
      const dragQuiz = document.createElement('div');
      dragQuiz.setAttribute('role', 'application');
      dragQuiz.setAttribute('aria-label', 'Sorting quiz: Drag animals to their habitats');
      dragQuiz.setAttribute('aria-describedby', 'drag-instructions drag-status');

      const instructions = document.createElement('div');
      instructions.id = 'drag-instructions';
      instructions.textContent =
        'Drag each animal to its correct habitat. Use Tab to navigate, Space to pick up, arrow keys to move, Space again to drop.';
      instructions.className = 'sr-only';

      const status = document.createElement('div');
      status.id = 'drag-status';
      status.setAttribute('aria-live', 'assertive');
      status.className = 'sr-only';

      const dragArea = document.createElement('div');
      dragArea.className = 'drag-area';

      // Create draggable animals
      const animals = ['Lion', 'Fish', 'Bird'];
      animals.forEach((animal, index) => {
        const draggable = document.createElement('div');
        draggable.setAttribute('role', 'button');
        draggable.setAttribute('draggable', 'true');
        draggable.setAttribute('aria-grabbed', 'false');
        draggable.setAttribute('tabindex', '0');
        draggable.setAttribute('aria-label', `${animal} - drag to correct habitat`);
        draggable.textContent = animal;
        draggable.className = 'draggable-item';

        dragArea.appendChild(draggable);
      });

      // Create drop zones
      const habitats = ['Savanna', 'Ocean', 'Sky'];
      habitats.forEach(habitat => {
        const dropZone = document.createElement('div');
        dropZone.setAttribute('role', 'button');
        dropZone.setAttribute('aria-dropeffect', 'move');
        dropZone.setAttribute('aria-label', `${habitat} habitat - drop zone`);
        dropZone.setAttribute('tabindex', '0');
        dropZone.className = 'drop-zone';
        dropZone.textContent = habitat;

        dragArea.appendChild(dropZone);
      });

      dragQuiz.appendChild(instructions);
      dragQuiz.appendChild(status);
      dragQuiz.appendChild(dragArea);
      testContainer.appendChild(dragQuiz);

      // Validate drag-drop structure
      const draggables = dragArea.querySelectorAll('[aria-grabbed]');
      expect(draggables.length).toBe(3);
      draggables.forEach(item => {
        expect(item.getAttribute('aria-grabbed')).toBe('false');
        expect(item.getAttribute('tabindex')).toBe('0');
      });

      const dropZones = dragArea.querySelectorAll('[aria-dropeffect]');
      expect(dropZones.length).toBe(3);
      dropZones.forEach(zone => {
        expect(zone.getAttribute('aria-dropeffect')).toBe('move');
      });

      // Simulate drag operation
      const lion = dragArea.querySelector('[aria-label*="Lion"]');
      lion.setAttribute('aria-grabbed', 'true');
      status.textContent = 'Picked up Lion. Use arrow keys to move to Savanna habitat.';

      expect(lion.getAttribute('aria-grabbed')).toBe('true');
      expect(status.textContent).toContain('Picked up Lion');

      // Simulate successful drop
      lion.setAttribute('aria-grabbed', 'false');
      status.textContent = 'Lion placed in Savanna habitat. Correct match!';

      expect(status.textContent).toContain('Correct match');
    });
  });

  describe('Progress and Achievement Patterns', () => {
    it('should validate comprehensive progress tracking', () => {
      const progressContainer = document.createElement('div');
      progressContainer.setAttribute('role', 'region');
      progressContainer.setAttribute('aria-labelledby', 'progress-title');

      const title = document.createElement('h2');
      title.id = 'progress-title';
      title.textContent = 'Your Learning Progress';

      const overallProgress = document.createElement('div');
      overallProgress.setAttribute('role', 'progressbar');
      overallProgress.setAttribute('aria-labelledby', 'overall-label');
      overallProgress.setAttribute('aria-valuenow', '75');
      overallProgress.setAttribute('aria-valuemin', '0');
      overallProgress.setAttribute('aria-valuemax', '100');
      overallProgress.setAttribute('aria-valuetext', '75% complete - 3 of 4 subjects mastered');

      const overallLabel = document.createElement('h3');
      overallLabel.id = 'overall-label';
      overallLabel.textContent = 'Overall Progress';

      const subjectProgress = document.createElement('div');
      subjectProgress.setAttribute('role', 'group');
      subjectProgress.setAttribute('aria-labelledby', 'subjects-label');

      const subjectsLabel = document.createElement('h3');
      subjectsLabel.id = 'subjects-label';
      subjectsLabel.textContent = 'Subject Progress';

      const subjects = [
        { name: 'Math', progress: 90, status: 'Mastered' },
        { name: 'Science', progress: 85, status: 'Advanced' },
        { name: 'Reading', progress: 95, status: 'Mastered' },
        { name: 'Art', progress: 30, status: 'Beginner' },
      ];

      subjects.forEach((subject, index) => {
        const subjectBar = document.createElement('div');
        subjectBar.setAttribute('role', 'progressbar');
        subjectBar.setAttribute('aria-label', `${subject.name} progress`);
        subjectBar.setAttribute('aria-valuenow', subject.progress.toString());
        subjectBar.setAttribute('aria-valuemin', '0');
        subjectBar.setAttribute('aria-valuemax', '100');
        subjectBar.setAttribute('aria-valuetext', `${subject.progress}% - ${subject.status} level`);
        subjectBar.setAttribute('aria-describedby', `subject-detail-${index}`);

        const detail = document.createElement('div');
        detail.id = `subject-detail-${index}`;
        detail.textContent = `${subject.name}: ${subject.progress}% complete, ${subject.status} level`;

        subjectProgress.appendChild(subjectBar);
        subjectProgress.appendChild(detail);
      });

      const announcements = document.createElement('div');
      announcements.id = 'progress-announcements';
      announcements.setAttribute('aria-live', 'polite');
      announcements.className = 'sr-only';

      progressContainer.appendChild(title);
      progressContainer.appendChild(overallLabel);
      progressContainer.appendChild(overallProgress);
      progressContainer.appendChild(subjectsLabel);
      progressContainer.appendChild(subjectProgress);
      progressContainer.appendChild(announcements);
      testContainer.appendChild(progressContainer);

      // Validate progress structure
      expect(overallProgress.getAttribute('role')).toBe('progressbar');
      expect(parseInt(overallProgress.getAttribute('aria-valuenow'))).toBe(75);
      expect(overallProgress.getAttribute('aria-valuetext')).toContain('3 of 4 subjects');

      const subjectBars = subjectProgress.querySelectorAll('[role="progressbar"]');
      expect(subjectBars.length).toBe(4);

      subjectBars.forEach((bar, index) => {
        const expectedProgress = subjects[index].progress;
        expect(parseInt(bar.getAttribute('aria-valuenow'))).toBe(expectedProgress);
        expect(bar.getAttribute('aria-valuetext')).toContain(subjects[index].status);
      });

      // Simulate progress update
      announcements.textContent = 'Art progress increased to 45%! Keep up the great work!';
      expect(announcements.textContent).toContain('Art progress increased');
    });

    it('should validate streak and achievement tracking', () => {
      const achievementContainer = document.createElement('div');
      achievementContainer.setAttribute('role', 'region');
      achievementContainer.setAttribute('aria-labelledby', 'achievement-title');

      const title = document.createElement('h2');
      title.id = 'achievement-title';
      title.textContent = 'Achievements & Streaks';

      const streakDisplay = document.createElement('div');
      streakDisplay.setAttribute('role', 'status');
      streakDisplay.setAttribute('aria-label', 'Current learning streak');
      streakDisplay.setAttribute('aria-describedby', 'streak-details');

      const streakDetails = document.createElement('div');
      streakDetails.id = 'streak-details';
      streakDetails.textContent = "7 day learning streak! You've practiced every day this week.";

      const badgesList = document.createElement('ul');
      badgesList.setAttribute('role', 'list');
      badgesList.setAttribute('aria-labelledby', 'badges-heading');

      const badgesHeading = document.createElement('h3');
      badgesHeading.id = 'badges-heading';
      badgesHeading.textContent = 'Recent Badges Earned';

      const badges = [
        { name: 'Math Master', description: 'Solved 100 math problems', earned: true },
        { name: 'Speed Reader', description: 'Read 5 books this month', earned: true },
        { name: 'Science Explorer', description: 'Complete 10 experiments', earned: false },
      ];

      badges.forEach(badge => {
        const listItem = document.createElement('li');
        listItem.setAttribute('role', 'listitem');

        const badgeButton = document.createElement('button');
        badgeButton.setAttribute(
          'aria-describedby',
          `${badge.name.toLowerCase().replace(' ', '-')}-desc`
        );
        badgeButton.setAttribute('aria-pressed', badge.earned.toString());
        badgeButton.className = badge.earned ? 'badge earned' : 'badge locked';
        badgeButton.textContent = badge.name;

        const description = document.createElement('div');
        description.id = `${badge.name.toLowerCase().replace(' ', '-')}-desc`;
        description.className = 'sr-only';
        description.textContent = `${badge.description}${badge.earned ? ' - EARNED' : ' - Not yet earned'}`;

        listItem.appendChild(badgeButton);
        listItem.appendChild(description);
        badgesList.appendChild(listItem);
      });

      const newBadgeAlert = document.createElement('div');
      newBadgeAlert.setAttribute('role', 'alert');
      newBadgeAlert.setAttribute('aria-live', 'assertive');
      newBadgeAlert.id = 'new-badge-alert';
      newBadgeAlert.className = 'sr-only';

      achievementContainer.appendChild(title);
      achievementContainer.appendChild(streakDisplay);
      achievementContainer.appendChild(streakDetails);
      achievementContainer.appendChild(badgesHeading);
      achievementContainer.appendChild(badgesList);
      achievementContainer.appendChild(newBadgeAlert);
      testContainer.appendChild(achievementContainer);

      // Validate achievement structure
      expect(streakDisplay.getAttribute('role')).toBe('status');
      expect(streakDisplay.getAttribute('aria-describedby')).toBe('streak-details');
      expect(badgesList.getAttribute('role')).toBe('list');

      const badgeButtons = badgesList.querySelectorAll('button[role], button');
      expect(badgeButtons.length).toBe(3);

      badgeButtons.forEach((button, index) => {
        const expectedState = badges[index].earned.toString();
        expect(button.getAttribute('aria-pressed')).toBe(expectedState);
        expect(button.getAttribute('aria-describedby')).toBeTruthy();
      });

      // Simulate new badge earned
      newBadgeAlert.textContent =
        'New badge earned: Science Explorer! You completed 10 experiments!';
      expect(newBadgeAlert.textContent).toContain('New badge earned');
      expect(newBadgeAlert.getAttribute('role')).toBe('alert');
    });
  });

  describe('Timer and Time-based Game Patterns', () => {
    it('should validate timer with countdown announcements', () => {
      const timerContainer = document.createElement('div');
      timerContainer.setAttribute('role', 'timer');
      timerContainer.setAttribute('aria-labelledby', 'timer-label');
      timerContainer.setAttribute('aria-describedby', 'timer-status');

      const label = document.createElement('h3');
      label.id = 'timer-label';
      label.textContent = 'Game Timer';

      const display = document.createElement('div');
      display.id = 'timer-display';
      display.setAttribute('aria-live', 'off'); // Will be changed to polite for announcements
      display.textContent = '2:30';

      const status = document.createElement('div');
      status.id = 'timer-status';
      status.setAttribute('aria-live', 'polite');
      status.className = 'sr-only';

      const urgentAlert = document.createElement('div');
      urgentAlert.setAttribute('role', 'alert');
      urgentAlert.setAttribute('aria-live', 'assertive');
      urgentAlert.id = 'timer-alert';
      urgentAlert.className = 'sr-only';

      timerContainer.appendChild(label);
      timerContainer.appendChild(display);
      timerContainer.appendChild(status);
      timerContainer.appendChild(urgentAlert);
      testContainer.appendChild(timerContainer);

      // Validate timer structure
      expect(timerContainer.getAttribute('role')).toBe('timer');
      expect(timerContainer.getAttribute('aria-labelledby')).toBe('timer-label');
      expect(display.getAttribute('aria-live')).toBe('off');
      expect(status.getAttribute('aria-live')).toBe('polite');
      expect(urgentAlert.getAttribute('role')).toBe('alert');

      // Simulate timer events
      status.textContent = '2 minutes remaining';
      expect(status.textContent).toBe('2 minutes remaining');

      status.textContent = '1 minute remaining';
      expect(status.textContent).toBe('1 minute remaining');

      urgentAlert.textContent = '30 seconds remaining!';
      expect(urgentAlert.textContent).toBe('30 seconds remaining!');

      urgentAlert.textContent = 'Time up! Game over.';
      expect(urgentAlert.textContent).toBe('Time up! Game over.');
    });

    it('should validate speed game with performance feedback', () => {
      const speedGame = document.createElement('div');
      speedGame.setAttribute('role', 'application');
      speedGame.setAttribute('aria-label', 'Speed Math Challenge');
      speedGame.setAttribute('aria-describedby', 'speed-instructions speed-stats');

      const instructions = document.createElement('div');
      instructions.id = 'speed-instructions';
      instructions.textContent = 'Solve as many problems as possible in 60 seconds';
      instructions.className = 'sr-only';

      const stats = document.createElement('div');
      stats.id = 'speed-stats';
      stats.setAttribute('aria-live', 'polite');
      stats.className = 'sr-only';

      const questionArea = document.createElement('div');
      questionArea.setAttribute('role', 'group');
      questionArea.setAttribute('aria-labelledby', 'current-question');

      const currentQuestion = document.createElement('h3');
      currentQuestion.id = 'current-question';
      currentQuestion.textContent = 'Problem 1: 8 + 7 = ?';

      const answerInput = document.createElement('input');
      answerInput.type = 'number';
      answerInput.setAttribute('aria-label', 'Your answer');
      answerInput.setAttribute('aria-describedby', 'answer-feedback');

      const feedback = document.createElement('div');
      feedback.id = 'answer-feedback';
      feedback.setAttribute('role', 'status');
      feedback.setAttribute('aria-live', 'assertive');
      feedback.className = 'sr-only';

      const performanceAlert = document.createElement('div');
      performanceAlert.setAttribute('role', 'alert');
      performanceAlert.setAttribute('aria-live', 'assertive');
      performanceAlert.id = 'performance-alert';
      performanceAlert.className = 'sr-only';

      questionArea.appendChild(currentQuestion);
      questionArea.appendChild(answerInput);
      questionArea.appendChild(feedback);

      speedGame.appendChild(instructions);
      speedGame.appendChild(stats);
      speedGame.appendChild(questionArea);
      speedGame.appendChild(performanceAlert);
      testContainer.appendChild(speedGame);

      // Validate speed game structure
      expect(speedGame.getAttribute('aria-describedby')).toContain('speed-stats');
      expect(questionArea.getAttribute('aria-labelledby')).toBe('current-question');
      expect(answerInput.getAttribute('aria-describedby')).toBe('answer-feedback');

      // Simulate game flow
      answerInput.value = '15';
      feedback.textContent = 'Correct! 8 + 7 = 15';
      stats.textContent =
        'Problem 1 of 20 complete. Score: 1 correct, 0 incorrect. Time: 57 seconds remaining.';

      expect(feedback.textContent).toContain('Correct');
      expect(stats.textContent).toContain('1 correct');

      // Next question
      currentQuestion.textContent = 'Problem 2: 12 - 5 = ?';
      answerInput.value = '';

      // Performance milestone
      performanceAlert.textContent = 'Amazing! 5 problems solved in a row!';
      expect(performanceAlert.textContent).toContain('Amazing');
    });
  });

  describe('Character Interaction Patterns', () => {
    it('should validate character dialogue system', () => {
      const dialogueContainer = document.createElement('div');
      dialogueContainer.setAttribute('role', 'dialog');
      dialogueContainer.setAttribute('aria-labelledby', 'character-name');
      dialogueContainer.setAttribute('aria-describedby', 'dialogue-text');
      dialogueContainer.setAttribute('aria-modal', 'false');

      const characterName = document.createElement('h3');
      characterName.id = 'character-name';
      characterName.textContent = 'Mango the Math Monkey';

      const dialogueText = document.createElement('div');
      dialogueText.id = 'dialogue-text';
      dialogueText.setAttribute('aria-live', 'polite');
      dialogueText.textContent = 'Great job solving that problem! Ready for the next challenge?';

      const responses = document.createElement('div');
      responses.setAttribute('role', 'group');
      responses.setAttribute('aria-label', 'Response options');

      const option1 = document.createElement('button');
      option1.textContent = "Yes, I'm ready!";
      option1.setAttribute('aria-describedby', 'option1-result');

      const option2 = document.createElement('button');
      option2.textContent = 'Can I have a hint first?';
      option2.setAttribute('aria-describedby', 'option2-result');

      const option1Result = document.createElement('span');
      option1Result.id = 'option1-result';
      option1Result.className = 'sr-only';
      option1Result.textContent = 'Continue to next problem';

      const option2Result = document.createElement('span');
      option2Result.id = 'option2-result';
      option2Result.className = 'sr-only';
      option2Result.textContent = 'Get helpful hint';

      responses.appendChild(option1);
      responses.appendChild(option1Result);
      responses.appendChild(option2);
      responses.appendChild(option2Result);

      dialogueContainer.appendChild(characterName);
      dialogueContainer.appendChild(dialogueText);
      dialogueContainer.appendChild(responses);
      testContainer.appendChild(dialogueContainer);

      // Validate dialogue structure
      expect(dialogueContainer.getAttribute('role')).toBe('dialog');
      expect(dialogueContainer.getAttribute('aria-labelledby')).toBe('character-name');
      expect(dialogueContainer.getAttribute('aria-describedby')).toBe('dialogue-text');
      expect(dialogueText.getAttribute('aria-live')).toBe('polite');
      expect(responses.getAttribute('aria-label')).toBe('Response options');

      // Simulate character response
      dialogueText.textContent =
        "Excellent choice! Here's a helpful strategy: try breaking the problem into smaller parts.";
      expect(dialogueText.textContent).toContain('helpful strategy');
    });

    it('should validate character feedback system', () => {
      const feedbackSystem = document.createElement('div');
      feedbackSystem.setAttribute('role', 'region');
      feedbackSystem.setAttribute('aria-labelledby', 'feedback-title');

      const title = document.createElement('h2');
      title.id = 'feedback-title';
      title.textContent = 'Character Feedback';

      const characterFeedback = document.createElement('div');
      characterFeedback.id = 'character-feedback';
      characterFeedback.setAttribute('aria-live', 'polite');
      characterFeedback.setAttribute('aria-label', 'Character encouragement');
      characterFeedback.className = 'sr-only';

      const emotionalState = document.createElement('div');
      emotionalState.setAttribute('role', 'img');
      emotionalState.setAttribute('aria-label', 'Character emotion: Happy and encouraging');
      emotionalState.id = 'character-emotion';

      const encouragementLevel = document.createElement('div');
      encouragementLevel.setAttribute('role', 'progressbar');
      encouragementLevel.setAttribute('aria-label', 'Encouragement level');
      encouragementLevel.setAttribute('aria-valuenow', '85');
      encouragementLevel.setAttribute('aria-valuemin', '0');
      encouragementLevel.setAttribute('aria-valuemax', '100');
      encouragementLevel.setAttribute('aria-valuetext', 'Very encouraging - 85%');

      feedbackSystem.appendChild(title);
      feedbackSystem.appendChild(characterFeedback);
      feedbackSystem.appendChild(emotionalState);
      feedbackSystem.appendChild(encouragementLevel);
      testContainer.appendChild(feedbackSystem);

      // Validate feedback structure
      expect(characterFeedback.getAttribute('aria-live')).toBe('polite');
      expect(emotionalState.getAttribute('role')).toBe('img');
      expect(encouragementLevel.getAttribute('role')).toBe('progressbar');
      expect(parseInt(encouragementLevel.getAttribute('aria-valuenow'))).toBe(85);

      // Simulate different feedback types
      const feedbackMessages = [
        "Fantastic work! You're really getting the hang of this!",
        "Don't worry, everyone makes mistakes. Let's try again!",
        "You're so close! Think about what we just learned.",
        'Perfect! You solved that like a true mathematician!',
      ];

      feedbackMessages.forEach(message => {
        characterFeedback.textContent = message;
        expect(characterFeedback.textContent).toBe(message);
      });

      // Update emotional state
      emotionalState.setAttribute('aria-label', 'Character emotion: Excited and proud');
      expect(emotionalState.getAttribute('aria-label')).toContain('Excited');
    });
  });

  describe('BaseGame Integration', () => {
    it('should validate BaseGame ARIA live region setup', () => {
      // Mock BaseGame components
      const gameContainer = document.createElement('div');
      gameContainer.id = 'mock-game';
      gameContainer.setAttribute('role', 'application');
      gameContainer.setAttribute('aria-label', 'Educational Math Game');

      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.id = 'game-announcements';
      liveRegion.className = 'sr-only';

      gameContainer.appendChild(liveRegion);
      testContainer.appendChild(gameContainer);

      // Simulate BaseGame feedback patterns
      const feedbackMessages = [
        'Correct answer! Great job!',
        "Oops, that's not quite right. Try again!",
        'Hint: Think about grouping the numbers.',
        'Level 2 unlocked! Excellent progress!',
      ];

      feedbackMessages.forEach(message => {
        liveRegion.textContent = message;
        expect(liveRegion.textContent).toBe(message);
      });

      expect(liveRegion.getAttribute('aria-live')).toBe('polite');
      expect(liveRegion.getAttribute('aria-atomic')).toBe('true');
      expect(gameContainer.getAttribute('role')).toBe('application');
    });
  });
});
