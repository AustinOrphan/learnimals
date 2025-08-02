/**
 * Educational Template JavaScript
 * Handles educational-specific functionality including progress tracking,
 * assessments, and teacher dashboard features
 */

import {
  debounce,
  throttle,
  domBatcher,
  // performanceMonitor, // unused variable
  withPerformanceMonitoring,
} from '../utils/performanceUtils.js';
import { privacyManager } from '../utils/privacyManager.js';

export class EducationalTemplate {
  constructor(gameConfig) {
    this.gameConfig = gameConfig;
    this.game = null;
    this.sessionData = {
      startTime: Date.now(),
      questionsAttempted: 0,
      correctAnswers: 0,
      totalTime: 0,
      hintUsages: 0,
      assessmentScores: [],
      learningProgress: {},
    };
    this.sidebarOpen = false;
    this.progressInterval = null;
    this.timeInterval = null;
    this.privacyConsent = null;
    this.dataCollectionPermitted = false;

    // Performance optimizations
    this.immediateProgressUpdate = true;

    // Create debounced/throttled versions of expensive operations
    this.debouncedSaveNotes = debounce(this.saveNotes.bind(this), 500);
    this.throttledProgressUpdate = throttle(this.updateProgress.bind(this), 1000);
    this.debouncedSaveSessionData = debounce(this.saveSessionData.bind(this), 300);

    // Bind methods
    this.toggleSidebar = this.toggleSidebar.bind(this);
    this.showAssessment = this.showAssessment.bind(this);
    this.updateProgress = withPerformanceMonitoring(
      this.updateProgress.bind(this),
      'educational-progress-update'
    );
    this.saveNotes = this.saveNotes.bind(this);
    this.generateReport = withPerformanceMonitoring(
      this.generateReport.bind(this),
      'educational-report-generation'
    );
  }

  /**
   * Initialize the educational template
   */
  async initialize() {
    this.initializeElements();
    this.setupEventListeners();
    this.renderLearningObjectives();
    this.renderStandards();

    // Check privacy consent before starting data collection
    await this.checkPrivacyConsent();

    this.startProgressTracking();
    this.loadSavedData();

    console.log('✅ Educational template initialized');
  }

  /**
   * Check privacy consent and apply data retention policies
   */
  async checkPrivacyConsent() {
    // Check if parental consent is required based on age range
    const requiresConsent = privacyManager.requiresParentalConsent(
      this.gameConfig.metadata?.ageRange || this.gameConfig.ageRange
    );

    if (requiresConsent) {
      // Request parental consent for data collection
      this.privacyConsent = await privacyManager.requestParentalConsent(
        this.gameConfig.metadata || this.gameConfig
      );
      this.dataCollectionPermitted = this.privacyConsent;

      if (!this.privacyConsent) {
        console.log('Educational data collection disabled - no parental consent');
        this.showAdaptiveFeedback('Data collection disabled per privacy settings', 'info');
        return;
      }
    } else {
      // For users 13+, check if data collection is still permitted
      this.dataCollectionPermitted = privacyManager.isDataCollectionPermitted(
        this.gameConfig.metadata || this.gameConfig
      );
    }

    // Apply data retention policy
    if (this.dataCollectionPermitted) {
      privacyManager.applyDataRetentionPolicy(this.gameConfig.metadata || this.gameConfig);
      console.log('Educational data collection enabled with privacy safeguards');
    }
  }

  /**
   * Initialize DOM elements
   */
  initializeElements() {
    this.elements = {
      // Header elements
      objectivesList: document.getElementById('objectives-list'),
      sessionProgressFill: document.getElementById('session-progress-fill'),
      sessionProgressText: document.getElementById('session-progress-text'),
      accuracyValue: document.getElementById('accuracy-value'),
      timeValue: document.getElementById('time-value'),

      // Sidebar elements
      sidebar: document.getElementById('educational-sidebar'),
      toggleButton: document.getElementById('toggle-sidebar'),
      sidebarToggleText: document.getElementById('sidebar-toggle-text'),
      standardsList: document.getElementById('standards-list'),
      teacherNotes: document.getElementById('teacher-notes'),

      // Progress elements
      questionsAttempted: document.getElementById('questions-attempted'),
      correctAnswers: document.getElementById('correct-answers'),
      timeSpent: document.getElementById('time-spent'),
      skillLevel: document.getElementById('skill-level'),

      // Game area elements
      currentObjective: document.getElementById('current-objective'),
      hintBtn: document.getElementById('hint-btn'),
      hintContent: document.getElementById('hint-content'),
      adaptiveFeedback: document.getElementById('adaptive-feedback'),

      // Footer elements
      questionsCompleted: document.getElementById('questions-completed'),
      sessionTime: document.getElementById('session-time'),
      nextRecommendation: document.getElementById('next-recommendation'),

      // Modal elements
      assessmentModal: document.getElementById('assessment-modal'),
      assessmentContent: document.getElementById('assessment-content'),
      reportModal: document.getElementById('report-modal'),
      reportContent: document.getElementById('report-content'),
    };
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Sidebar toggle
    this.elements.toggleButton?.addEventListener('click', this.toggleSidebar);

    // Assessment button
    document.getElementById('assessment-btn')?.addEventListener('click', this.showAssessment);

    // Teacher notes
    document.getElementById('save-notes')?.addEventListener('click', this.saveNotes);

    // Quick actions
    document.getElementById('generate-report')?.addEventListener('click', this.generateReport);
    document.getElementById('export-data')?.addEventListener('click', this.exportData.bind(this));
    document
      .getElementById('reset-session')
      ?.addEventListener('click', this.resetSession.bind(this));

    // Hint system
    this.elements.hintBtn?.addEventListener('click', this.showHint.bind(this));

    // Session controls
    document.getElementById('pause-btn')?.addEventListener('click', this.pauseSession.bind(this));
    document.getElementById('skip-btn')?.addEventListener('click', this.skipQuestion.bind(this));
    document
      .getElementById('check-understanding')
      ?.addEventListener('click', this.checkUnderstanding.bind(this));

    // Footer actions
    document.getElementById('save-session')?.addEventListener('click', this.saveSession.bind(this));
    document
      .getElementById('share-progress')
      ?.addEventListener('click', this.shareProgress.bind(this));
    document
      .getElementById('continue-learning')
      ?.addEventListener('click', this.continueLearning.bind(this));

    // Modal controls
    document
      .getElementById('close-assessment')
      ?.addEventListener('click', this.closeAssessment.bind(this));
    document
      .getElementById('submit-assessment')
      ?.addEventListener('click', this.submitAssessment.bind(this));
    document.getElementById('close-report')?.addEventListener('click', this.closeReport.bind(this));

    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyboard.bind(this));
  }

  /**
   * Set the game instance
   */
  setGame(game) {
    this.game = game;

    // Listen to game events for progress tracking
    if (game.on) {
      game.on('questionStarted', this.onQuestionStarted.bind(this));
      game.on('questionAnswered', this.onQuestionAnswered.bind(this));
      game.on('gameCompleted', this.onGameCompleted.bind(this));
      game.on('progressUpdated', this.onProgressUpdated.bind(this));
    }
  }

  /**
   * Render learning objectives
   */
  renderLearningObjectives() {
    if (!this.elements.objectivesList || !this.gameConfig.learningObjectives) return;

    const objectives = Array.isArray(this.gameConfig.learningObjectives)
      ? this.gameConfig.learningObjectives
      : this.gameConfig.metadata?.learningObjectives || [];

    this.elements.objectivesList.innerHTML = objectives
      .map(objective => `<li>${objective}</li>`)
      .join('');
  }

  /**
   * Render curriculum standards
   */
  renderStandards() {
    if (!this.elements.standardsList || !this.gameConfig.standards) return;

    const standards = Array.isArray(this.gameConfig.standards) ? this.gameConfig.standards : [];

    this.elements.standardsList.innerHTML = standards
      .map(standard => `<div class="standard-item">${standard}</div>`)
      .join('');
  }

  /**
   * Toggle sidebar visibility
   */
  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;

    if (this.sidebarOpen) {
      this.elements.sidebar?.classList.add('active');
      if (this.elements.sidebarToggleText) {
        this.elements.sidebarToggleText.textContent = 'Hide Panel';
      }
    } else {
      this.elements.sidebar?.classList.remove('active');
      if (this.elements.sidebarToggleText) {
        this.elements.sidebarToggleText.textContent = 'Teacher Panel';
      }
    }
  }

  /**
   * Start progress tracking
   */
  startProgressTracking() {
    // Optimized progress tracking with throttling
    // Update time more frequently, but throttle expensive operations
    this.timeInterval = setInterval(() => {
      this.updateSessionTime();
    }, 1000);

    // Throttle progress updates to every 5 seconds to reduce performance impact
    this.progressInterval = setInterval(() => {
      this.updateProgress();
    }, 5000);

    // Update progress immediately on question events for responsiveness
    this.immediateProgressUpdate = true;
  }

  /**
   * Update session time display
   */
  updateSessionTime() {
    const elapsed = Date.now() - this.sessionData.startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);

    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    if (this.elements.timeSpent) {
      this.elements.timeSpent.textContent = timeStr;
    }
    if (this.elements.sessionTime) {
      this.elements.sessionTime.textContent = `Session time: ${timeStr}`;
    }
  }

  /**
   * Update progress indicators
   */
  updateProgress() {
    // Calculate values first
    const accuracy =
      this.sessionData.questionsAttempted > 0
        ? Math.round((this.sessionData.correctAnswers / this.sessionData.questionsAttempted) * 100)
        : 0;

    const progress = Math.min(this.sessionData.questionsAttempted * 10, 100);

    // Batch DOM updates for better performance
    domBatcher.add(() => {
      if (this.elements.accuracyValue) {
        this.elements.accuracyValue.textContent = `${accuracy}%`;
      }

      if (this.elements.sessionProgressFill) {
        this.elements.sessionProgressFill.style.width = `${progress}%`;
      }
      if (this.elements.sessionProgressText) {
        this.elements.sessionProgressText.textContent = `${progress}%`;
      }

      if (this.elements.questionsAttempted) {
        this.elements.questionsAttempted.textContent = this.sessionData.questionsAttempted;
      }
      if (this.elements.correctAnswers) {
        this.elements.correctAnswers.textContent = this.sessionData.correctAnswers;
      }
      if (this.elements.questionsCompleted) {
        this.elements.questionsCompleted.textContent = `${this.sessionData.correctAnswers} questions completed`;
      }

      // Update skill level
      this.updateSkillLevel(accuracy);
    });
  }

  /**
   * Update skill level based on performance
   */
  updateSkillLevel(accuracy) {
    let skillLevel = 'Beginner';

    if (accuracy >= 90) skillLevel = 'Advanced';
    else if (accuracy >= 75) skillLevel = 'Proficient';
    else if (accuracy >= 60) skillLevel = 'Developing';
    else if (accuracy >= 40) skillLevel = 'Emerging';

    if (this.elements.skillLevel) {
      this.elements.skillLevel.textContent = skillLevel;
    }
  }

  /**
   * Game event handlers
   */
  onQuestionStarted(event) {
    this.sessionData.questionsAttempted++;

    if (this.elements.currentObjective) {
      this.elements.currentObjective.textContent =
        event.objective || 'Working on current problem...';
    }
  }

  onQuestionAnswered(event) {
    if (event.correct) {
      this.sessionData.correctAnswers++;
      this.showAdaptiveFeedback('Great job! Keep it up!', 'success');
    } else {
      this.showAdaptiveFeedback('Try again! You\'re learning!', 'warning');
    }

    // Immediate progress update for responsiveness
    if (this.immediateProgressUpdate) {
      this.updateProgress();
    }

    // Use debounced save to avoid excessive localStorage writes
    this.debouncedSaveSessionData();
  }

  onGameCompleted(_event) {
    this.showAdaptiveFeedback('Excellent work! You completed the session!', 'success');
    this.generateReport();
  }

  onProgressUpdated(_event) {
    this.updateProgress();
  }

  /**
   * Show adaptive feedback
   */
  showAdaptiveFeedback(message, type = 'info') {
    if (!this.elements.adaptiveFeedback) return;

    this.elements.adaptiveFeedback.textContent = message;
    this.elements.adaptiveFeedback.className = `adaptive-feedback ${type}`;

    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.elements.adaptiveFeedback.textContent = '';
      this.elements.adaptiveFeedback.className = 'adaptive-feedback';
    }, 3000);
  }

  /**
   * Show hint system
   */
  showHint() {
    if (!this.elements.hintContent) return;

    this.sessionData.hintUsages++;

    // Generate contextual hint (could be enhanced with AI)
    const hints = [
      'Break down the problem into smaller steps.',
      'Look for patterns or relationships.',
      'Try working backwards from the answer.',
      'Use visual aids or draw it out.',
      'Check your work by trying a different approach.',
    ];

    const randomHint = hints[Math.floor(Math.random() * hints.length)];
    this.elements.hintContent.textContent = randomHint;

    // Toggle visibility
    const isVisible = this.elements.hintContent.style.display !== 'none';
    this.elements.hintContent.style.display = isVisible ? 'none' : 'block';
  }

  /**
   * Show assessment modal
   */
  showAssessment() {
    if (!this.elements.assessmentModal) return;

    this.generateAssessmentQuestions();
    this.elements.assessmentModal.style.display = 'flex';
  }

  /**
   * Generate assessment questions
   */
  generateAssessmentQuestions() {
    if (!this.elements.assessmentContent) return;

    const questions = [
      {
        question: 'How confident do you feel about the material covered?',
        options: [
          'Very confident',
          'Somewhat confident',
          'Not very confident',
          'Need more practice',
        ],
        type: 'confidence',
      },
      {
        question: 'Which part was most challenging?',
        options: [
          'Understanding the concept',
          'Applying the method',
          'Time management',
          'Nothing was challenging',
        ],
        type: 'difficulty',
      },
      {
        question: 'What would help you learn better?',
        options: [
          'More examples',
          'Different explanations',
          'Practice problems',
          'Interactive tools',
        ],
        type: 'learning',
      },
    ];

    this.elements.assessmentContent.innerHTML = questions
      .map(
        (q, index) => `
      <div class="assessment-question">
        <h4>${q.question}</h4>
        <div class="assessment-options">
          ${q.options
    .map(
      (option, _optIndex) => `
            <label class="assessment-option">
              <input type="radio" name="question-${index}" value="${option}">
              <span>${option}</span>
            </label>
          `
    )
    .join('')}
        </div>
      </div>
    `
      )
      .join('');
  }

  /**
   * Close assessment modal
   */
  closeAssessment() {
    if (this.elements.assessmentModal) {
      this.elements.assessmentModal.style.display = 'none';
    }
  }

  /**
   * Submit assessment
   */
  submitAssessment() {
    const formData = new FormData();
    const questions = this.elements.assessmentContent.querySelectorAll('.assessment-question');

    questions.forEach((question, index) => {
      const selected = question.querySelector(`input[name="question-${index}"]:checked`);
      if (selected) {
        formData.append(`question-${index}`, selected.value);
      }
    });

    // Store assessment data
    this.sessionData.assessmentScores.push({
      timestamp: Date.now(),
      responses: Object.fromEntries(formData),
    });

    this.showAdaptiveFeedback('Assessment submitted! Thank you for your feedback.', 'success');
    this.closeAssessment();
    this.saveSessionData();
  }

  /**
   * Generate progress report
   */
  generateReport() {
    if (!this.elements.reportContent) return;

    const accuracy =
      this.sessionData.questionsAttempted > 0
        ? Math.round((this.sessionData.correctAnswers / this.sessionData.questionsAttempted) * 100)
        : 0;

    const sessionTime = Math.floor((Date.now() - this.sessionData.startTime) / 60000);

    this.elements.reportContent.innerHTML = `
      <div class="report-section">
        <h3>Session Overview</h3>
        <div class="report-metrics">
          <div class="report-metric">
            <span class="value">${this.sessionData.questionsAttempted}</span>
            <span class="label">Questions Attempted</span>
          </div>
          <div class="report-metric">
            <span class="value">${accuracy}%</span>
            <span class="label">Accuracy</span>
          </div>
          <div class="report-metric">
            <span class="value">${sessionTime}</span>
            <span class="label">Minutes Played</span>
          </div>
          <div class="report-metric">
            <span class="value">${this.sessionData.hintUsages}</span>
            <span class="label">Hints Used</span>
          </div>
        </div>
      </div>
      
      <div class="report-section">
        <h3>Learning Progress</h3>
        <p>Based on this session, the student demonstrates:</p>
        <ul>
          <li>${accuracy >= 80 ? 'Strong understanding' : 'Developing understanding'} of core concepts</li>
          <li>${this.sessionData.hintUsages <= 2 ? 'Good' : 'Needs improvement in'} independent problem solving</li>
          <li>${sessionTime >= 10 ? 'Good engagement' : 'Consider shorter sessions'} with the material</li>
        </ul>
      </div>
      
      <div class="report-section">
        <h3>Recommendations</h3>
        <p>${this.generateRecommendations(accuracy)}</p>
      </div>
    `;

    if (this.elements.reportModal) {
      this.elements.reportModal.style.display = 'flex';
    }
  }

  /**
   * Generate learning recommendations
   */
  generateRecommendations(accuracy) {
    if (accuracy >= 90) {
      return 'Excellent performance! Consider advancing to more challenging problems or helping peers.';
    } else if (accuracy >= 75) {
      return 'Good progress! Continue practicing similar problems to strengthen understanding.';
    } else if (accuracy >= 60) {
      return 'Making progress! Focus on areas where mistakes were made and consider additional practice.';
    } else {
      return 'Keep trying! Consider reviewing foundational concepts and working with a teacher or tutor.';
    }
  }

  /**
   * Close report modal
   */
  closeReport() {
    if (this.elements.reportModal) {
      this.elements.reportModal.style.display = 'none';
    }
  }

  /**
   * Save teacher notes
   */
  saveNotes() {
    if (!this.elements.teacherNotes) return;

    const notes = this.elements.teacherNotes.value;
    localStorage.setItem(`teacher-notes-${this.gameConfig.id}`, notes);

    this.showAdaptiveFeedback('Notes saved successfully!', 'success');
  }

  /**
   * Save session data with privacy safeguards
   */
  saveSessionData() {
    if (!this.dataCollectionPermitted) {
      console.log('Session data not saved - data collection not permitted');
      return;
    }

    // Sanitize data based on privacy settings
    const sanitizedData = privacyManager.sanitizeData(
      this.sessionData,
      this.gameConfig.metadata || this.gameConfig
    );

    const sessionKey = `educational-session-${this.gameConfig.id}-${Date.now()}`;
    localStorage.setItem(sessionKey, JSON.stringify(sanitizedData));

    console.log('Session data saved with privacy safeguards applied');
  }

  /**
   * Load saved data
   */
  loadSavedData() {
    // Load teacher notes
    const savedNotes = localStorage.getItem(`teacher-notes-${this.gameConfig.id}`);
    if (savedNotes && this.elements.teacherNotes) {
      this.elements.teacherNotes.value = savedNotes;
    }
  }

  /**
   * Export session data with privacy safeguards
   */
  exportData() {
    if (!this.dataCollectionPermitted) {
      this.showAdaptiveFeedback('Data export not available - privacy restrictions', 'warning');
      return;
    }

    // Sanitize data for export
    const sanitizedSessionData = privacyManager.sanitizeData(
      this.sessionData,
      this.gameConfig.metadata || this.gameConfig
    );

    const exportData = {
      gameId: this.gameConfig.id,
      gameName: this.gameConfig.name,
      sessionData: sanitizedSessionData,
      timestamp: new Date().toISOString(),
      privacyNotice: 'Data has been sanitized according to privacy settings and COPPA compliance',
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `educational-session-${this.gameConfig.id}-${Date.now()}.json`;
    link.click();

    this.showAdaptiveFeedback('Data exported with privacy safeguards', 'success');
  }

  /**
   * Session control methods
   */
  pauseSession() {
    if (this.game && this.game.pause) {
      this.game.pause();
    }
    this.showAdaptiveFeedback('Session paused. Click continue when ready.', 'info');
  }

  skipQuestion() {
    if (this.game && this.game.skipQuestion) {
      this.game.skipQuestion();
    }
    this.sessionData.questionsAttempted++;
    this.updateProgress();
  }

  checkUnderstanding() {
    this.showAssessment();
  }

  saveSession() {
    this.saveSessionData();
    this.showAdaptiveFeedback('Progress saved!', 'success');
  }

  shareProgress() {
    if (navigator.share) {
      navigator.share({
        title: 'Learning Progress',
        text: `Check out my progress in ${this.gameConfig.name}!`,
        url: window.location.href,
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      this.showAdaptiveFeedback('Link copied to clipboard!', 'success');
    }
  }

  continueLearning() {
    // Navigate to next recommended activity
    this.showAdaptiveFeedback('Great job! Keep up the excellent work!', 'success');
  }

  resetSession() {
    if (confirm('Are you sure you want to reset this session? All progress will be lost.')) {
      this.sessionData = {
        startTime: Date.now(),
        questionsAttempted: 0,
        correctAnswers: 0,
        totalTime: 0,
        hintUsages: 0,
        assessmentScores: [],
        learningProgress: {},
      };

      this.updateProgress();
      this.showAdaptiveFeedback('Session reset successfully.', 'info');
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboard(event) {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
      case 't':
        event.preventDefault();
        this.toggleSidebar();
        break;
      case 'h':
        event.preventDefault();
        this.showHint();
        break;
      case 's':
        event.preventDefault();
        this.saveSession();
        break;
      case 'a':
        event.preventDefault();
        this.showAssessment();
        break;
      }
    }
  }

  /**
   * Cleanup method with privacy-aware data handling
   */
  destroy() {
    // Clean up both intervals
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }

    // Save final session data only if permitted
    if (this.dataCollectionPermitted) {
      this.saveSessionData();
    }

    // Apply data retention policy on cleanup
    const gameMetadata = this.gameConfig.metadata || this.gameConfig;
    if (gameMetadata.dataCollection?.retention === 'session_only') {
      // Data will be automatically deleted by privacy manager
      console.log('Session data will be deleted per retention policy');
    }

    console.log('Educational template destroyed with privacy compliance');
  }
}

// Export for use in templates
window.EducationalTemplate = EducationalTemplate;
