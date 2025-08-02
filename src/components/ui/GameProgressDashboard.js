/**
 * GameProgressDashboard.js
 *
 * Dashboard component for displaying game progress and achievements
 * Integrates with EnhancedProgressTracker to show comprehensive stats
 */

import EnhancedProgressTracker from '../../utils/EnhancedProgressTracker.js';
import Card from './Card.js';

class GameProgressDashboard {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.progressTracker = new EnhancedProgressTracker();

    this.currentView = 'overview'; // overview, achievements, detailed-stats
    this.selectedGame = null;

    this.init();
  }

  init() {
    if (!this.container) {
      console.error(`Container with id ${this.containerId} not found`);
      return;
    }

    this.setupEventListeners();
    this.render();
  }

  setupEventListeners() {
    // Listen for progress updates
    window.addEventListener('gameProgressUpdate', () => {
      this.render();
    });

    window.addEventListener('achievementUnlocked', event => {
      this.showAchievementNotification(event.detail);
    });
  }

  render() {
    this.container.innerHTML = '';
    this.container.className = 'game-progress-dashboard';

    // Create navigation
    const nav = this.createNavigation();
    this.container.appendChild(nav);

    // Create main content area
    const content = document.createElement('div');
    content.className = 'dashboard-content';

    switch (this.currentView) {
    case 'overview':
      content.appendChild(this.renderOverview());
      break;
    case 'achievements':
      content.appendChild(this.renderAchievements());
      break;
    case 'detailed-stats':
      content.appendChild(this.renderDetailedStats());
      break;
    }

    this.container.appendChild(content);
  }

  createNavigation() {
    const nav = document.createElement('nav');
    nav.className = 'dashboard-nav';

    const views = [
      { id: 'overview', label: 'Overview', icon: '📊' },
      { id: 'achievements', label: 'Achievements', icon: '🏆' },
      { id: 'detailed-stats', label: 'Detailed Stats', icon: '📈' },
    ];

    views.forEach(view => {
      const button = document.createElement('button');
      button.className = `nav-button ${this.currentView === view.id ? 'active' : ''}`;
      button.innerHTML = `<span class="nav-icon">${view.icon}</span> ${view.label}`;
      button.onclick = () => {
        this.currentView = view.id;
        this.render();
      };
      nav.appendChild(button);
    });

    return nav;
  }

  renderOverview() {
    const overview = document.createElement('div');
    overview.className = 'overview-container';

    // Overall progress section
    const overallProgress = this.renderOverallProgress();
    overview.appendChild(overallProgress);

    // Game cards section
    const gameCards = this.renderGameCards();
    overview.appendChild(gameCards);

    // Recent achievements
    const recentAchievements = this.renderRecentAchievements();
    overview.appendChild(recentAchievements);

    return overview;
  }

  renderOverallProgress() {
    const progress = this.progressTracker.crossGameProgress;

    const section = document.createElement('section');
    section.className = 'overall-progress-section';

    section.innerHTML = `
      <h2>Overall Progress</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${progress.totalScore.toLocaleString()}</div>
          <div class="stat-label">Total Score</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${progress.totalChallenges}</div>
          <div class="stat-label">Challenges Completed</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${progress.gamesPlayed.size}/5</div>
          <div class="stat-label">Games Explored</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${progress.dailyStreak}</div>
          <div class="stat-label">Day Streak</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${Math.round(progress.overallAccuracy)}%</div>
          <div class="stat-label">Overall Accuracy</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${this.getTotalAchievements()}</div>
          <div class="stat-label">Achievements Earned</div>
        </div>
      </div>
    `;

    return section;
  }

  renderGameCards() {
    const section = document.createElement('section');
    section.className = 'game-cards-section';
    section.innerHTML = '<h2>Game Progress</h2>';

    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'game-cards-grid';

    const games = [
      { id: 'word-scramble', name: 'Word Scramble', subject: 'Reading', icon: '📚' },
      { id: 'number-line-jump', name: 'Number Line Jump', subject: 'Math', icon: '🔢' },
      { id: 'element-match', name: 'Element Match', subject: 'Science', icon: '🧪' },
      { id: 'sentence-builder', name: 'Sentence Builder', subject: 'Reading', icon: '✍️' },
      { id: 'color-palette', name: 'Color Palette', subject: 'Art', icon: '🎨' },
    ];

    games.forEach(game => {
      const analytics =
        this.progressTracker.gameAnalytics[game.id] ||
        this.progressTracker.getDefaultGameAnalytics();
      const cardData = {
        title: game.name,
        subtitle: game.subject,
        icon: game.icon,
        content: this.createGameCardContent(game.id, analytics),
        onclick: () => {
          this.selectedGame = game.id;
          this.currentView = 'detailed-stats';
          this.render();
        },
      };

      const card = new Card(cardData);
      cardsContainer.appendChild(card.render());
    });

    section.appendChild(cardsContainer);
    return section;
  }

  createGameCardContent(gameId, analytics) {
    const achievements = this.getGameAchievements(gameId);
    const unlockedCount = achievements.filter(a => a.unlocked).length;

    return `
      <div class="game-card-stats">
        <div class="mini-stat">
          <span class="mini-stat-value">${analytics.sessionsPlayed}</span>
          <span class="mini-stat-label">Sessions</span>
        </div>
        <div class="mini-stat">
          <span class="mini-stat-value">${analytics.highScore}</span>
          <span class="mini-stat-label">High Score</span>
        </div>
        <div class="mini-stat">
          <span class="mini-stat-value">${unlockedCount}/${achievements.length}</span>
          <span class="mini-stat-label">Achievements</span>
        </div>
      </div>
      <div class="accuracy-bar">
        <div class="accuracy-fill" style="width: ${analytics.accuracy}%"></div>
        <span class="accuracy-text">${Math.round(analytics.accuracy)}% Accuracy</span>
      </div>
    `;
  }

  renderRecentAchievements() {
    const section = document.createElement('section');
    section.className = 'recent-achievements-section';
    section.innerHTML = '<h2>Recent Achievements</h2>';

    const recentList = document.createElement('div');
    recentList.className = 'recent-achievements-list';

    const allAchievements = this.getAllUnlockedAchievements();
    const recent = allAchievements.sort((a, b) => b.unlockedAt - a.unlockedAt).slice(0, 5);

    if (recent.length === 0) {
      recentList.innerHTML =
        '<p class="no-achievements">Start playing games to unlock achievements!</p>';
    } else {
      recent.forEach(achievement => {
        const item = document.createElement('div');
        item.className = 'achievement-item';
        item.innerHTML = `
          <span class="achievement-icon">${achievement.icon}</span>
          <div class="achievement-details">
            <div class="achievement-name">${achievement.name}</div>
            <div class="achievement-time">${this.formatTimeAgo(achievement.unlockedAt)}</div>
          </div>
        `;
        recentList.appendChild(item);
      });
    }

    section.appendChild(recentList);
    return section;
  }

  renderAchievements() {
    const container = document.createElement('div');
    container.className = 'achievements-container';

    // Achievement categories
    const categories = [
      { id: 'all', label: 'All Achievements' },
      { id: 'word-scramble', label: 'Word Scramble' },
      { id: 'number-line-jump', label: 'Number Line Jump' },
      { id: 'element-match', label: 'Element Match' },
      { id: 'sentence-builder', label: 'Sentence Builder' },
      { id: 'color-palette', label: 'Color Palette' },
      { id: 'cross-game', label: 'Cross-Game' },
    ];

    // Category filter
    const filter = document.createElement('div');
    filter.className = 'achievement-filter';

    categories.forEach(cat => {
      const button = document.createElement('button');
      button.className = 'filter-button';
      button.textContent = cat.label;
      button.onclick = () => this.filterAchievements(cat.id, button);
      filter.appendChild(button);
    });

    container.appendChild(filter);

    // Achievements grid
    const grid = document.createElement('div');
    grid.className = 'achievements-grid';
    grid.id = 'achievements-grid';

    this.renderAchievementGrid(grid, 'all');
    container.appendChild(grid);

    return container;
  }

  renderAchievementGrid(container, category = 'all') {
    container.innerHTML = '';

    let achievements = [];

    if (category === 'all') {
      achievements = this.getAllAchievements();
    } else if (category === 'cross-game') {
      achievements = this.getCrossGameAchievements();
    } else {
      achievements = this.getGameAchievements(category);
    }

    achievements.forEach(achievement => {
      const card = document.createElement('div');
      card.className = `achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`;

      card.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-name">${achievement.name}</div>
        <div class="achievement-description">${achievement.description}</div>
        ${
  achievement.progress !== undefined
    ? `
          <div class="achievement-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${(achievement.progress / achievement.target) * 100}%"></div>
            </div>
            <span class="progress-text">${achievement.progress}/${achievement.target}</span>
          </div>
        `
    : ''
}
        ${
  achievement.unlocked
    ? `
          <div class="achievement-unlocked-date">
            Unlocked ${this.formatDate(achievement.unlockedAt)}
          </div>
        `
    : ''
}
      `;

      container.appendChild(card);
    });
  }

  filterAchievements(category, activeButton) {
    const grid = document.getElementById('achievements-grid');
    this.renderAchievementGrid(grid, category);

    // Update active filter button
    document.querySelectorAll('.filter-button').forEach(btn => {
      btn.classList.remove('active');
    });
    activeButton.classList.add('active');
  }

  renderDetailedStats() {
    const container = document.createElement('div');
    container.className = 'detailed-stats-container';

    if (this.selectedGame) {
      container.appendChild(this.renderGameDetailedStats());
    } else {
      container.appendChild(this.renderAllGamesStats());
    }

    return container;
  }

  renderGameDetailedStats() {
    const analytics =
      this.progressTracker.gameAnalytics[this.selectedGame] ||
      this.progressTracker.getDefaultGameAnalytics();

    const section = document.createElement('section');
    section.className = 'game-detailed-stats';

    const gameInfo = this.getGameInfo(this.selectedGame);

    section.innerHTML = `
      <div class="stats-header">
        <button class="back-button" onclick="window.gameProgressDashboard.selectedGame = null; window.gameProgressDashboard.render();">
          ← Back
        </button>
        <h2>${gameInfo.icon} ${gameInfo.name} Statistics</h2>
      </div>
      
      <div class="detailed-stats-grid">
        <div class="stat-panel">
          <h3>Performance</h3>
          <div class="stat-row">
            <span>Total Sessions:</span>
            <span>${analytics.sessionsPlayed}</span>
          </div>
          <div class="stat-row">
            <span>Total Time Played:</span>
            <span>${this.formatTime(analytics.totalTimePlayed)}</span>
          </div>
          <div class="stat-row">
            <span>Average Session Time:</span>
            <span>${this.formatTime(analytics.averageSessionTime)}</span>
          </div>
          <div class="stat-row">
            <span>High Score:</span>
            <span>${analytics.highScore}</span>
          </div>
          <div class="stat-row">
            <span>Average Score:</span>
            <span>${Math.round(analytics.averageScore)}</span>
          </div>
        </div>
        
        <div class="stat-panel">
          <h3>Accuracy & Skills</h3>
          <div class="stat-row">
            <span>Overall Accuracy:</span>
            <span>${Math.round(analytics.accuracy)}%</span>
          </div>
          <div class="stat-row">
            <span>Total Questions:</span>
            <span>${analytics.totalQuestions}</span>
          </div>
          <div class="stat-row">
            <span>Correct Answers:</span>
            <span>${analytics.correctAnswers}</span>
          </div>
          <div class="stat-row">
            <span>Mistakes Made:</span>
            <span>${analytics.mistakes}</span>
          </div>
          <div class="stat-row">
            <span>Hints Used:</span>
            <span>${analytics.hintsUsed}</span>
          </div>
        </div>
        
        <div class="stat-panel">
          <h3>Progress Tracking</h3>
          ${this.renderSkillsProgress(analytics)}
        </div>
        
        <div class="stat-panel">
          <h3>Recent Sessions</h3>
          ${this.renderRecentSessions(analytics)}
        </div>
      </div>
    `;

    return section;
  }

  renderAllGamesStats() {
    const section = document.createElement('section');
    section.className = 'all-games-stats';

    section.innerHTML = '<h2>All Games Statistics</h2>';

    // Create comparison charts
    const chartsContainer = document.createElement('div');
    chartsContainer.className = 'stats-charts';

    // Time played comparison
    chartsContainer.appendChild(
      this.createComparisonChart('Time Played', 'totalTimePlayed', this.formatTime)
    );

    // Sessions played comparison
    chartsContainer.appendChild(this.createComparisonChart('Sessions Played', 'sessionsPlayed'));

    // Accuracy comparison
    chartsContainer.appendChild(
      this.createComparisonChart('Accuracy', 'accuracy', val => `${Math.round(val)}%`)
    );

    // High scores comparison
    chartsContainer.appendChild(this.createComparisonChart('High Scores', 'highScore'));

    section.appendChild(chartsContainer);

    return section;
  }

  createComparisonChart(title, metric, formatter = val => val) {
    const chart = document.createElement('div');
    chart.className = 'comparison-chart';

    const games = [
      'word-scramble',
      'number-line-jump',
      'element-match',
      'sentence-builder',
      'color-palette',
    ];
    const maxValue = Math.max(
      ...games.map(g => this.progressTracker.gameAnalytics[g]?.[metric] || 0)
    );

    chart.innerHTML = `
      <h3>${title}</h3>
      <div class="bar-chart">
        ${games
    .map(gameId => {
      const value = this.progressTracker.gameAnalytics[gameId]?.[metric] || 0;
      const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
      const gameInfo = this.getGameInfo(gameId);

      return `
            <div class="bar-row">
              <span class="bar-label">${gameInfo.icon} ${gameInfo.shortName}</span>
              <div class="bar-container">
                <div class="bar-fill" style="width: ${percentage}%"></div>
              </div>
              <span class="bar-value">${formatter(value)}</span>
            </div>
          `;
    })
    .join('')}
      </div>
    `;

    return chart;
  }

  renderSkillsProgress(analytics) {
    if (!analytics.skillProgress || Object.keys(analytics.skillProgress).length === 0) {
      return '<p class="no-data">No skill data available yet</p>';
    }

    return Object.entries(analytics.skillProgress)
      .map(
        ([skill, data]) => `
      <div class="skill-progress">
        <div class="skill-name">${skill}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${data.accuracy}%"></div>
        </div>
        <span class="skill-accuracy">${Math.round(data.accuracy)}%</span>
      </div>
    `
      )
      .join('');
  }

  renderRecentSessions(analytics) {
    if (!analytics.sessionHistory || analytics.sessionHistory.length === 0) {
      return '<p class="no-data">No session history available</p>';
    }

    const recent = analytics.sessionHistory.slice(-5).reverse();

    return `
      <div class="session-list">
        ${recent
    .map(
      session => `
          <div class="session-item">
            <span class="session-date">${this.formatDate(session.timestamp)}</span>
            <span class="session-score">Score: ${session.score}</span>
            <span class="session-accuracy">${Math.round(session.accuracy)}%</span>
          </div>
        `
    )
    .join('')}
      </div>
    `;
  }

  showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">${achievement.icon}</div>
        <div class="notification-text">
          <div class="notification-title">Achievement Unlocked!</div>
          <div class="notification-name">${achievement.name}</div>
          <div class="notification-description">${achievement.description}</div>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);

    // Remove after delay
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  // Helper methods
  getAllAchievements() {
    return Object.values(this.progressTracker.achievements);
  }

  getGameAchievements(gameId) {
    return Object.values(this.progressTracker.achievements).filter(a =>
      a.id.startsWith(`${gameId}-`)
    );
  }

  getCrossGameAchievements() {
    return Object.values(this.progressTracker.achievements).filter(
      a => !a.id.includes('-') || a.id.startsWith('cross-')
    );
  }

  getAllUnlockedAchievements() {
    return Object.values(this.progressTracker.achievements).filter(a => a.unlocked);
  }

  getTotalAchievements() {
    return this.getAllUnlockedAchievements().length;
  }

  getGameInfo(gameId) {
    const gameMap = {
      'word-scramble': { name: 'Word Scramble', shortName: 'Word', icon: '📚' },
      'number-line-jump': { name: 'Number Line Jump', shortName: 'Number', icon: '🔢' },
      'element-match': { name: 'Element Match', shortName: 'Element', icon: '🧪' },
      'sentence-builder': { name: 'Sentence Builder', shortName: 'Sentence', icon: '✍️' },
      'color-palette': { name: 'Color Palette', shortName: 'Color', icon: '🎨' },
    };

    return gameMap[gameId] || { name: gameId, shortName: gameId, icon: '🎮' };
  }

  formatTime(seconds) {
    if (!seconds || seconds === 0) return '0m';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  formatDate(timestamp) {
    if (!timestamp) return 'Never';

    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // If today
    if (diff < 86400000 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }

    // If this year
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  formatTimeAgo(timestamp) {
    if (!timestamp) return 'Never';

    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

    return this.formatDate(timestamp);
  }
}

// Export for use in other modules
export default GameProgressDashboard;

// Also attach to window for easy access
window.GameProgressDashboard = GameProgressDashboard;
