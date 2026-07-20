/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EducationalTemplate } from '../../templates/educational.js';
import { domBatcher } from '../../utils/performanceUtils.js';

// Mock the privacy manager so initialize() does not block on the parental
// consent modal and data collection is permitted in tests
vi.mock('../../utils/privacyManager.js', () => ({
  privacyManager: {
    requiresParentalConsent: vi.fn(() => false),
    requestParentalConsent: vi.fn(async () => true),
    isDataCollectionPermitted: vi.fn(() => true),
    applyDataRetentionPolicy: vi.fn(),
    sanitizeData: vi.fn(data => data),
  },
}));

// Mock console.log for testing
const originalConsoleLog = console.log;

describe('EducationalTemplate', () => {
  let template;
  let gameConfig;
  let mockGame;

  beforeEach(() => {
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };

    // Mock sessionStorage
    global.sessionStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };

    // Mock DOM elements
    document.body.innerHTML = `
      <div id="objectives-list"></div>
      <div id="session-progress-fill"></div>
      <div id="session-progress-text"></div>
      <div id="accuracy-value"></div>
      <div id="time-value"></div>
      <div id="educational-sidebar"></div>
      <div id="toggle-sidebar"></div>
      <div id="sidebar-toggle-text"></div>
      <div id="standards-list"></div>
      <div id="teacher-notes"></div>
      <div id="questions-attempted"></div>
      <div id="correct-answers"></div>
      <div id="time-spent"></div>
      <div id="skill-level"></div>
      <div id="current-objective"></div>
      <div id="hint-btn"></div>
      <div id="hint-content"></div>
      <div id="adaptive-feedback"></div>
      <div id="questions-completed"></div>
      <div id="session-time"></div>
      <div id="next-recommendation"></div>
      <div id="assessment-modal"></div>
      <div id="assessment-content"></div>
      <div id="report-modal"></div>
      <div id="report-content"></div>
      <button id="assessment-btn"></button>
      <button id="save-notes"></button>
      <button id="generate-report"></button>
      <button id="export-data"></button>
      <button id="reset-session"></button>
      <button id="pause-btn"></button>
      <button id="skip-btn"></button>
      <button id="check-understanding"></button>
      <button id="save-session"></button>
      <button id="share-progress"></button>
      <button id="continue-learning"></button>
      <button id="close-assessment"></button>
      <button id="submit-assessment"></button>
      <button id="close-report"></button>
    `;

    gameConfig = {
      id: 'test-game',
      name: 'Test Educational Game',
      learningObjectives: ['objective1', 'objective2'],
      standards: ['standard1', 'standard2'],
      assessmentType: 'formative',
      metadata: {
        gameType: 'educational-test',
        ageRange: '6-8',
        learningObjectives: ['counting', 'addition'],
        tags: ['educational', 'math'],
      },
    };

    mockGame = {
      on: vi.fn(),
      pause: vi.fn(),
      skipQuestion: vi.fn(),
    };

    // Mock console.log
    console.log = vi.fn();
  });

  afterEach(() => {
    // Clean up intervals
    if (template && template.progressInterval) {
      clearInterval(template.progressInterval);
    }
    if (template && template.timeInterval) {
      clearInterval(template.timeInterval);
    }

    // Drop any batched DOM updates scheduled by the template
    domBatcher.clear();

    // Restore console.log
    console.log = originalConsoleLog;

    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with game config', () => {
      template = new EducationalTemplate(gameConfig);

      expect(template.gameConfig).toEqual(gameConfig);
      expect(template.sessionData).toBeDefined();
      expect(template.sessionData.questionsAttempted).toBe(0);
      expect(template.sessionData.correctAnswers).toBe(0);
      expect(template.sidebarOpen).toBe(false);
    });

    it('should initialize DOM elements and event listeners', async () => {
      template = new EducationalTemplate(gameConfig);
      await template.initialize();

      expect(template.elements).toBeDefined();
      expect(template.elements.objectivesList).toBeDefined();
      expect(template.progressInterval).toBeDefined();
      expect(console.log).toHaveBeenCalledWith('✅ Educational template initialized');
    });
  });

  describe('Learning Objectives', () => {
    beforeEach(async () => {
      template = new EducationalTemplate(gameConfig);
      await template.initialize();
    });

    it('should render learning objectives', () => {
      const objectivesList = document.getElementById('objectives-list');
      expect(objectivesList.children.length).toBe(2);
      expect(objectivesList.children[0].textContent).toBe('objective1');
      expect(objectivesList.children[1].textContent).toBe('objective2');
    });

    it('should render standards', () => {
      const standardsList = document.getElementById('standards-list');
      expect(standardsList.children.length).toBe(2);
      expect(standardsList.children[0].textContent).toBe('standard1');
      expect(standardsList.children[1].textContent).toBe('standard2');
    });
  });

  describe('Progress Tracking', () => {
    beforeEach(async () => {
      template = new EducationalTemplate(gameConfig);
      await template.initialize();
    });

    it('should update session progress', () => {
      template.sessionData.questionsAttempted = 5;
      template.sessionData.correctAnswers = 4;

      template.updateProgress();
      // DOM updates are batched via requestAnimationFrame; flush synchronously
      domBatcher.flush();

      const accuracyValue = document.getElementById('accuracy-value');
      expect(accuracyValue.textContent).toBe('80%');

      const questionsAttempted = document.getElementById('questions-attempted');
      expect(questionsAttempted.textContent).toBe('5');

      const correctAnswers = document.getElementById('correct-answers');
      expect(correctAnswers.textContent).toBe('4');
    });

    it('should calculate skill level based on accuracy', () => {
      template.sessionData.questionsAttempted = 10;
      template.sessionData.correctAnswers = 9;

      template.updateProgress();
      // DOM updates are batched via requestAnimationFrame; flush synchronously
      domBatcher.flush();

      const skillLevel = document.getElementById('skill-level');
      expect(skillLevel.textContent).toBe('Advanced');
    });

    it('should handle question answered events', () => {
      const mockEvent = {
        correct: true,
      };

      template.onQuestionAnswered(mockEvent);

      expect(template.sessionData.correctAnswers).toBe(1);
    });
  });

  describe('Sidebar Functionality', () => {
    beforeEach(async () => {
      template = new EducationalTemplate(gameConfig);
      await template.initialize();
    });

    it('should toggle sidebar visibility', () => {
      const sidebar = document.getElementById('educational-sidebar');
      const toggleText = document.getElementById('sidebar-toggle-text');

      template.toggleSidebar();

      expect(template.sidebarOpen).toBe(true);
      expect(sidebar.classList.contains('active')).toBe(true);
      expect(toggleText.textContent).toBe('Hide Panel');

      template.toggleSidebar();

      expect(template.sidebarOpen).toBe(false);
      expect(sidebar.classList.contains('active')).toBe(false);
      expect(toggleText.textContent).toBe('Teacher Panel');
    });
  });

  describe('Assessment System', () => {
    beforeEach(async () => {
      template = new EducationalTemplate(gameConfig);
      await template.initialize();
    });

    it('should show assessment modal', () => {
      const assessmentModal = document.getElementById('assessment-modal');

      template.showAssessment();

      expect(assessmentModal.style.display).toBe('flex');
    });

    it('should generate assessment questions', () => {
      template.generateAssessmentQuestions();

      const assessmentContent = document.getElementById('assessment-content');
      expect(assessmentContent.children.length).toBeGreaterThan(0);
    });
  });

  describe('Game Integration', () => {
    beforeEach(async () => {
      template = new EducationalTemplate(gameConfig);
      await template.initialize();
    });

    it('should set game and listen to events', () => {
      template.setGame(mockGame);

      expect(template.game).toBe(mockGame);
      expect(mockGame.on).toHaveBeenCalledWith('questionStarted', expect.any(Function));
      expect(mockGame.on).toHaveBeenCalledWith('questionAnswered', expect.any(Function));
      expect(mockGame.on).toHaveBeenCalledWith('gameCompleted', expect.any(Function));
      expect(mockGame.on).toHaveBeenCalledWith('progressUpdated', expect.any(Function));
    });
  });

  describe('Educational Features', () => {
    beforeEach(async () => {
      template = new EducationalTemplate(gameConfig);
      await template.initialize();
    });

    it('should show adaptive feedback', () => {
      const feedbackElement = document.getElementById('adaptive-feedback');

      template.showAdaptiveFeedback('Great job!', 'success');

      expect(feedbackElement.textContent).toBe('Great job!');
      expect(feedbackElement.className).toBe('adaptive-feedback success');
    });

    it('should generate progress report', () => {
      template.sessionData.questionsAttempted = 10;
      template.sessionData.correctAnswers = 8;

      template.generateReport();

      const reportContent = document.getElementById('report-content');
      expect(reportContent.innerHTML).toContain('Session Overview');
      expect(reportContent.innerHTML).toContain('80%');
    });

    it('should save session data to localStorage', () => {
      template.saveSessionData();

      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    beforeEach(async () => {
      template = new EducationalTemplate(gameConfig);
      await template.initialize();
    });

    it('should cleanup properly', () => {
      expect(template.progressInterval).toBeTruthy();

      template.destroy();

      // Check that interval is cleared (we can't directly test clearInterval,
      // but we can verify the method calls saveSessionData)
      expect(localStorage.setItem).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        'Educational template destroyed with privacy compliance'
      );
    });
  });
});
