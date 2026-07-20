// SafariJournal.js - Vocabulary tracking and progress mapping system for Story Safari
// Manages discovered words, story progress visualization, and achievement tracking

import logger from '../../utils/logger.js';
import { formatDate } from '../../utils/common.js';

/**
 * SafariJournal - Interactive journal system for Story Safari
 * Features:
 * - Vocabulary discovery and definition tracking
 * - Visual story progress mapping
 * - Achievement and badge collection
 * - Reading statistics and progress analytics
 * - Export capabilities for offline review
 */
export default class SafariJournal {
  constructor(options = {}) {
    this.options = {
      enableVocabularyTracking: true,
      enableProgressMapping: true,
      enableAchievements: true,
      autoSave: true,
      maxVocabularyWords: 100,
      ...options,
    };

    // Journal data structure
    this.journalData = {
      vocabulary: new Map(), // word -> { definition, context, dateDiscovered, timesEncountered }
      storyProgress: [], // Array of scene IDs visited
      achievements: [], // Array of earned badges and achievements
      readingStats: {
        totalScenesVisited: 0,
        totalWordsDiscovered: 0,
        averageReadingSpeed: 0,
        comprehensionAccuracy: 0,
        favoriteStoryPath: '',
        totalPlayTime: 0,
      },
      personalNotes: new Map(), // sceneId -> user notes
      bookmarks: [], // Favorite scenes for quick access
      createdDate: new Date(),
      lastUpdated: new Date(),
    };

    // UI state
    this.isOpen = false;
    this.currentTab = 'vocabulary'; // vocabulary, progress, achievements, stats
    this.modalElement = null;

    // Progress visualization
    this.storyMap = null;
    this.progressIndicator = null;

    this.init();
  }

  /**
   * Initialize the Safari Journal system
   */
  init() {
    try {
      // Load saved journal data if available
      this.loadFromStorage();

      // Set up auto-save if enabled
      if (this.options.autoSave) {
        this.setupAutoSave();
      }

      logger.info('Safari Journal initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Safari Journal:', error);
    }
  }

  /**
   * Add a new vocabulary word to the journal
   */
  addVocabularyWord(word, definition, context = '', sceneId = '') {
    if (!this.options.enableVocabularyTracking) return;

    const wordLower = word.toLowerCase();
    const now = new Date();

    if (this.journalData.vocabulary.has(wordLower)) {
      // Word already exists, increment encounter count
      const existing = this.journalData.vocabulary.get(wordLower);
      existing.timesEncountered++;
      existing.lastEncountered = now;

      // Add new context if different
      if (context && !existing.contexts.includes(context)) {
        existing.contexts.push(context);
      }
    } else {
      // New word discovery
      this.journalData.vocabulary.set(wordLower, {
        word: word,
        definition: definition,
        contexts: context ? [context] : [],
        dateDiscovered: now,
        lastEncountered: now,
        timesEncountered: 1,
        sceneDiscovered: sceneId,
        difficulty: this.categorizeWordDifficulty(word),
        mastered: false,
      });

      this.journalData.readingStats.totalWordsDiscovered++;

      // Trigger achievement check
      this.checkVocabularyAchievements();

      logger.info(`New vocabulary word added: ${word}`);
    }

    this.journalData.lastUpdated = now;
    this.saveToStorage();
  }

  /**
   * Categorize word difficulty for appropriate grouping
   */
  categorizeWordDifficulty(word) {
    const wordLength = word.length;
    const syllables = this.estimateSyllables(word);

    if (wordLength <= 4 && syllables <= 1) return 'easy';
    if (wordLength <= 7 && syllables <= 2) return 'medium';
    if (wordLength <= 10 && syllables <= 3) return 'hard';
    return 'expert';
  }

  /**
   * Estimate syllable count for difficulty assessment
   */
  estimateSyllables(word) {
    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      if (vowels.includes(word[i].toLowerCase())) {
        if (!previousWasVowel) count++;
        previousWasVowel = true;
      } else {
        previousWasVowel = false;
      }
    }

    return Math.max(1, count);
  }

  /**
   * Record story progress when visiting a new scene
   */
  recordSceneVisit(sceneId, sceneTitle, choices = []) {
    const visitData = {
      sceneId,
      sceneTitle,
      visitTime: new Date(),
      choicesMade: choices,
      readingTime: 0, // Will be updated by game
      notesAdded: false,
    };

    this.journalData.storyProgress.push(visitData);
    this.journalData.readingStats.totalScenesVisited++;
    this.journalData.lastUpdated = new Date();

    this.saveToStorage();
  }

  /**
   * Add achievement or badge to the journal
   */
  addAchievement(achievementId, title, description, iconUrl = '') {
    const achievement = {
      id: achievementId,
      title,
      description,
      dateEarned: new Date(),
      iconUrl,
      category: this.getAchievementCategory(achievementId),
    };

    this.journalData.achievements.push(achievement);

    // Show achievement notification
    this.showAchievementNotification(achievement);

    logger.info(`Achievement earned: ${title}`);
    this.saveToStorage();
  }

  /**
   * Get achievement category for organization
   */
  getAchievementCategory(achievementId) {
    const categories = {
      vocabulary: ['word_discoverer', 'definition_master', 'context_expert'],
      exploration: ['scene_explorer', 'path_finder', 'completionist'],
      friendship: ['team_player', 'helper', 'inclusive_leader'],
      courage: ['brave_choice', 'risk_taker', 'adventure_seeker'],
      learning: ['quick_learner', 'comprehension_master', 'analytical_thinker'],
    };

    for (const [category, achievements] of Object.entries(categories)) {
      if (achievements.includes(achievementId)) return category;
    }

    return 'general';
  }

  /**
   * Check and award vocabulary-related achievements
   */
  checkVocabularyAchievements() {
    const wordCount = this.journalData.vocabulary.size;
    const difficultyLevels = this.getVocabularyByDifficulty();

    // Word count achievements
    if (wordCount >= 5 && !this.hasAchievement('word_discoverer_5')) {
      this.addAchievement(
        'word_discoverer_5',
        'Word Discoverer',
        'Discovered 5 new vocabulary words!'
      );
    }

    if (wordCount >= 15 && !this.hasAchievement('word_discoverer_15')) {
      this.addAchievement(
        'word_discoverer_15',
        'Vocabulary Explorer',
        'Discovered 15 new vocabulary words!'
      );
    }

    if (wordCount >= 30 && !this.hasAchievement('word_discoverer_30')) {
      this.addAchievement(
        'word_discoverer_30',
        'Word Master',
        'Discovered 30 new vocabulary words!'
      );
    }

    // Difficulty achievements
    if (difficultyLevels.expert.length >= 3 && !this.hasAchievement('expert_words')) {
      this.addAchievement(
        'expert_words',
        'Expert Explorer',
        'Mastered challenging vocabulary words!'
      );
    }
  }

  /**
   * Check if user has a specific achievement
   */
  hasAchievement(achievementId) {
    return this.journalData.achievements.some(a => a.id === achievementId);
  }

  /**
   * Get vocabulary words organized by difficulty
   */
  getVocabularyByDifficulty() {
    const organized = {
      easy: [],
      medium: [],
      hard: [],
      expert: [],
    };

    this.journalData.vocabulary.forEach(wordData => {
      organized[wordData.difficulty].push(wordData);
    });

    return organized;
  }

  /**
   * Open the Safari Journal modal interface
   */
  open(initialTab = 'vocabulary') {
    this.currentTab = initialTab;
    this.isOpen = true;

    this.createJournalModal();
    this.renderJournalContent();

    // Add to DOM
    document.body.appendChild(this.modalElement);

    // Animate entrance
    requestAnimationFrame(() => {
      this.modalElement.classList.add('journal-open');
    });
  }

  /**
   * Close the Safari Journal
   */
  close() {
    if (!this.isOpen || !this.modalElement) return;

    this.modalElement.classList.remove('journal-open');

    setTimeout(() => {
      if (this.modalElement && this.modalElement.parentNode) {
        this.modalElement.parentNode.removeChild(this.modalElement);
      }
      this.modalElement = null;
      this.isOpen = false;
    }, 300);
  }

  /**
   * Create the journal modal interface
   */
  createJournalModal() {
    this.modalElement = document.createElement('div');
    this.modalElement.className = 'safari-journal-modal';

    this.modalElement.innerHTML = `
      <div class="journal-overlay"></div>
      <div class="journal-container">
        <header class="journal-header">
          <h2 class="journal-title">📖 Ruby's Safari Journal</h2>
          <button class="journal-close" aria-label="Close Journal">×</button>
        </header>
        
        <nav class="journal-tabs">
          <button class="journal-tab ${this.currentTab === 'vocabulary' ? 'active' : ''}" data-tab="vocabulary">
            📚 Words Discovered
          </button>
          <button class="journal-tab ${this.currentTab === 'progress' ? 'active' : ''}" data-tab="progress">
            🗺️ Story Map
          </button>
          <button class="journal-tab ${this.currentTab === 'achievements' ? 'active' : ''}" data-tab="achievements">
            🏆 Achievements
          </button>
          <button class="journal-tab ${this.currentTab === 'stats' ? 'active' : ''}" data-tab="stats">
            📊 Reading Stats
          </button>
        </nav>
        
        <main class="journal-content">
          <!-- Content will be dynamically rendered -->
        </main>
        
        <footer class="journal-footer">
          <div class="journal-stats-summary">
            <span>Words: ${this.journalData.vocabulary.size}</span>
            <span>Scenes: ${this.journalData.storyProgress.length}</span>
            <span>Achievements: ${this.journalData.achievements.length}</span>
          </div>
          <button class="export-journal-btn">📤 Export Journal</button>
        </footer>
      </div>
    `;

    // Add event listeners
    this.modalElement.querySelector('.journal-close').addEventListener('click', () => this.close());
    this.modalElement
      .querySelector('.journal-overlay')
      .addEventListener('click', () => this.close());
    this.modalElement
      .querySelector('.export-journal-btn')
      .addEventListener('click', () => this.exportJournal());

    // Tab switching
    this.modalElement.querySelectorAll('.journal-tab').forEach(tab => {
      tab.addEventListener('click', e => {
        this.switchTab(e.target.dataset.tab);
      });
    });
  }

  /**
   * Switch journal tabs
   */
  switchTab(tabName) {
    this.currentTab = tabName;

    // Update tab appearance
    this.modalElement.querySelectorAll('.journal-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Render new content
    this.renderJournalContent();
  }

  /**
   * Render journal content based on current tab
   */
  renderJournalContent() {
    const contentArea = this.modalElement.querySelector('.journal-content');

    switch (this.currentTab) {
      case 'vocabulary':
        contentArea.innerHTML = this.renderVocabularyTab();
        break;
      case 'progress':
        contentArea.innerHTML = this.renderProgressTab();
        break;
      case 'achievements':
        contentArea.innerHTML = this.renderAchievementsTab();
        break;
      case 'stats':
        contentArea.innerHTML = this.renderStatsTab();
        break;
      default:
        contentArea.innerHTML = '<p>Tab content not found.</p>';
    }
  }

  /**
   * Render vocabulary tab content
   */
  renderVocabularyTab() {
    const vocabularyByDifficulty = this.getVocabularyByDifficulty();

    let html = '<div class="vocabulary-content">';

    if (this.journalData.vocabulary.size === 0) {
      html += `
        <div class="empty-state">
          <h3>Start Your Word Adventure!</h3>
          <p>As you read Ruby's story, click on highlighted words to discover their meanings and add them to your journal.</p>
        </div>
      `;
    } else {
      Object.entries(vocabularyByDifficulty).forEach(([difficulty, words]) => {
        if (words.length > 0) {
          html += `
            <div class="vocabulary-section">
              <h3 class="difficulty-header ${difficulty}">${this.capitalizeDifficulty(difficulty)} Words (${words.length})</h3>
              <div class="vocabulary-grid">
          `;

          words.forEach(wordData => {
            html += `
              <div class="vocabulary-card ${wordData.mastered ? 'mastered' : ''}">
                <div class="word-header">
                  <h4 class="vocabulary-word">${wordData.word}</h4>
                  <span class="encounter-count">${wordData.timesEncountered}x</span>
                </div>
                <p class="word-definition">${wordData.definition}</p>
                ${
                  wordData.contexts.length > 0
                    ? `
                  <div class="word-contexts">
                    <strong>Seen in context:</strong>
                    ${wordData.contexts.map(context => `<span class="context-example">"${context}"</span>`).join('')}
                  </div>
                `
                    : ''
                }
                <div class="word-meta">
                  <small>Discovered: ${formatDate(wordData.dateDiscovered, 'short')}</small>
                </div>
              </div>
            `;
          });

          html += '</div></div>';
        }
      });
    }

    html += '</div>';
    return html;
  }

  /**
   * Render progress tab content
   */
  renderProgressTab() {
    let html = '<div class="progress-content">';

    if (this.journalData.storyProgress.length === 0) {
      html += `
        <div class="empty-state">
          <h3>Your Safari Adventure Awaits!</h3>
          <p>Your story map will show all the places Ruby visits on her safari adventure.</p>
        </div>
      `;
    } else {
      html += `
        <div class="story-map">
          <h3>Ruby's Safari Journey</h3>
          <div class="progress-timeline">
      `;

      this.journalData.storyProgress.forEach((visit, index) => {
        html += `
          <div class="timeline-item">
            <div class="timeline-marker">${index + 1}</div>
            <div class="timeline-content">
              <h4>${visit.sceneTitle}</h4>
              <time>${formatDate(visit.visitTime, 'time')}</time>
              ${
                visit.choicesMade.length > 0
                  ? `
                <div class="choices-made">
                  <strong>Choices:</strong> ${visit.choicesMade.join(', ')}
                </div>
              `
                  : ''
              }
            </div>
          </div>
        `;
      });

      html += '</div></div>';
    }

    html += '</div>';
    return html;
  }

  /**
   * Render achievements tab content
   */
  renderAchievementsTab() {
    let html = '<div class="achievements-content">';

    if (this.journalData.achievements.length === 0) {
      html += `
        <div class="empty-state">
          <h3>Earn Your Explorer Badges!</h3>
          <p>Complete reading challenges and make story choices to earn special achievement badges.</p>
        </div>
      `;
    } else {
      // Group achievements by category
      const achievementsByCategory = {};
      this.journalData.achievements.forEach(achievement => {
        const category = achievement.category;
        if (!achievementsByCategory[category]) {
          achievementsByCategory[category] = [];
        }
        achievementsByCategory[category].push(achievement);
      });

      Object.entries(achievementsByCategory).forEach(([category, achievements]) => {
        html += `
          <div class="achievement-category">
            <h3>${this.capitalizeCategory(category)} Achievements</h3>
            <div class="achievements-grid">
        `;

        achievements.forEach(achievement => {
          html += `
            <div class="achievement-card">
              <div class="achievement-icon">${achievement.iconUrl || '🏆'}</div>
              <div class="achievement-info">
                <h4>${achievement.title}</h4>
                <p>${achievement.description}</p>
                <time>Earned: ${formatDate(achievement.dateEarned, 'short')}</time>
              </div>
            </div>
          `;
        });

        html += '</div></div>';
      });
    }

    html += '</div>';
    return html;
  }

  /**
   * Render stats tab content
   */
  renderStatsTab() {
    const stats = this.journalData.readingStats;

    return `
      <div class="stats-content">
        <h3>Your Reading Adventure Statistics</h3>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">${stats.totalScenesVisited}</div>
            <div class="stat-label">Scenes Explored</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-number">${stats.totalWordsDiscovered}</div>
            <div class="stat-label">Words Discovered</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-number">${Math.round(stats.comprehensionAccuracy * 100)}%</div>
            <div class="stat-label">Comprehension Score</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-number">${Math.round(stats.averageReadingSpeed)}</div>
            <div class="stat-label">Words per Minute</div>
          </div>
        </div>
        
        <div class="reading-progress">
          <h4>Reading Level Progress</h4>
          <div class="progress-indicators">
            <div class="level-indicator">
              <span>Vocabulary Growth</span>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(100, (stats.totalWordsDiscovered / 30) * 100)}%"></div>
              </div>
            </div>
            
            <div class="level-indicator">
              <span>Story Exploration</span>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(100, (stats.totalScenesVisited / 20) * 100)}%"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="journal-meta">
          <p><strong>Journal Created:</strong> ${formatDate(this.journalData.createdDate, 'long')}</p>
          <p><strong>Last Updated:</strong> ${formatDate(this.journalData.lastUpdated, 'long')}</p>
        </div>
      </div>
    `;
  }

  /**
   * Export journal data for offline review
   */
  exportJournal() {
    const exportData = {
      journalData: {
        vocabulary: Array.from(this.journalData.vocabulary.entries()),
        storyProgress: this.journalData.storyProgress,
        achievements: this.journalData.achievements,
        readingStats: this.journalData.readingStats,
      },
      exportDate: new Date(),
      version: '1.0.0',
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `ruby-safari-journal-${formatDate(new Date(), 'short').replace(/\//g, '-')}.json`;
    link.click();

    logger.info('Safari Journal exported successfully');
  }

  /**
   * Save journal data to local storage
   */
  saveToStorage() {
    try {
      const saveData = {
        vocabulary: Array.from(this.journalData.vocabulary.entries()),
        storyProgress: this.journalData.storyProgress,
        achievements: this.journalData.achievements,
        readingStats: this.journalData.readingStats,
        personalNotes: Array.from(this.journalData.personalNotes.entries()),
        bookmarks: this.journalData.bookmarks,
        createdDate: this.journalData.createdDate,
        lastUpdated: this.journalData.lastUpdated,
      };

      localStorage.setItem('safari-journal-data', JSON.stringify(saveData));
    } catch (error) {
      logger.error('Failed to save journal data:', error);
    }
  }

  /**
   * Load journal data from local storage
   */
  loadFromStorage() {
    try {
      const savedData = localStorage.getItem('safari-journal-data');
      if (savedData) {
        const parsed = JSON.parse(savedData);

        this.journalData.vocabulary = new Map(parsed.vocabulary || []);
        this.journalData.storyProgress = parsed.storyProgress || [];
        this.journalData.achievements = parsed.achievements || [];
        this.journalData.readingStats = {
          ...this.journalData.readingStats,
          ...parsed.readingStats,
        };
        this.journalData.personalNotes = new Map(parsed.personalNotes || []);
        this.journalData.bookmarks = parsed.bookmarks || [];
        this.journalData.createdDate = new Date(parsed.createdDate) || new Date();
        this.journalData.lastUpdated = new Date(parsed.lastUpdated) || new Date();

        logger.info('Safari Journal data loaded from storage');
      }
    } catch (error) {
      logger.error('Failed to load journal data:', error);
    }
  }

  /**
   * Set up auto-save functionality
   */
  setupAutoSave() {
    // Save every 30 seconds if there are changes
    setInterval(() => {
      this.saveToStorage();
    }, 30000);

    // Save on page unload
    window.addEventListener('beforeunload', () => {
      this.saveToStorage();
    });
  }

  /**
   * Show achievement notification
   */
  showAchievementNotification(achievement) {
    // This would create a toast notification
    // Implementation would depend on the main app's notification system
    logger.info(`Achievement notification: ${achievement.title}`);
  }

  /**
   * Helper method to capitalize difficulty levels
   */
  capitalizeDifficulty(difficulty) {
    const mapping = {
      easy: 'Beginner',
      medium: 'Intermediate',
      hard: 'Advanced',
      expert: 'Expert',
    };
    return mapping[difficulty] || difficulty;
  }

  /**
   * Helper method to capitalize category names
   */
  capitalizeCategory(category) {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.isOpen) {
      this.close();
    }

    this.saveToStorage();

    // Clear any intervals or timeouts
    // Remove event listeners if any
  }
}
