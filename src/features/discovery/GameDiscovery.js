/**
 * Game Discovery UI - Interactive game finder using enhanced filtering
 * Showcases the power of the GameRegistryUtil enhancements
 */

import { GameRegistryUtil } from '../../config/gameRegistry.js';

export default class GameDiscovery {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.filters = {
      subject: '',
      ageRange: '',
      playTime: '',
      gameType: '',
      competencyLevel: '',
      tags: [],
      searchText: '',
    };

    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
    this.updateResults();
  }

  render() {
    this.container.innerHTML = `
      <div class="game-discovery">
        <header class="discovery-header">
          <h1>🎮 Game Discovery</h1>
          <p>Find the perfect games using our smart filtering system</p>
        </header>
        
        <div class="discovery-content">
          <aside class="filter-panel">
            <h2>🔍 Filters</h2>
            
            <div class="filter-group">
              <label for="search-input">Search Games</label>
              <input type="text" id="search-input" placeholder="Search by name or description..." />
            </div>
            
            <div class="filter-group">
              <label for="subject-filter">Subject</label>
              <select id="subject-filter">
                <option value="">All Subjects</option>
                <option value="math">Math</option>
                <option value="reading">Reading</option>
                <option value="science">Science</option>
                <option value="art">Art</option>
                <option value="general">General</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="age-filter">Age Range</label>
              <select id="age-filter">
                <option value="">All Ages</option>
                <option value="4-6">Ages 4-6</option>
                <option value="6-8">Ages 6-8</option>
                <option value="8-10">Ages 8-10</option>
                <option value="10-12">Ages 10-12</option>
                <option value="12-14">Ages 12-14</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="playtime-filter">Play Time</label>
              <select id="playtime-filter">
                <option value="">Any Duration</option>
                <option value="short">Short (under 8 minutes)</option>
                <option value="medium">Medium (8-12 minutes)</option>
                <option value="long">Long (over 12 minutes)</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="gametype-filter">Game Type</label>
              <select id="gametype-filter">
                <option value="">All Types</option>
                <option value="word-puzzle">Word Puzzle</option>
                <option value="action-puzzle">Action Puzzle</option>
                <option value="math-puzzle">Math Puzzle</option>
                <option value="memory-puzzle">Memory Game</option>
                <option value="creative-puzzle">Creative Puzzle</option>
                <option value="simulation">Simulation</option>
                <option value="creative-writing">Creative Writing</option>
                <option value="creative-art">Art & Design</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="level-filter">Difficulty Level</label>
              <select id="level-filter">
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="beginner-intermediate">Beginner-Intermediate</option>
                <option value="intermediate">Intermediate</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label>Learning Focus</label>
              <div class="tag-checkboxes" id="tag-checkboxes">
                <label><input type="checkbox" value="vocabulary"> Vocabulary</label>
                <label><input type="checkbox" value="math"> Math Skills</label>
                <label><input type="checkbox" value="creativity"> Creativity</label>
                <label><input type="checkbox" value="memory"> Memory</label>
                <label><input type="checkbox" value="problem-solving"> Problem Solving</label>
                <label><input type="checkbox" value="science"> Science</label>
                <label><input type="checkbox" value="patterns"> Patterns</label>
              </div>
            </div>
            
            <div class="filter-actions">
              <button id="clear-filters" class="btn btn-secondary">Clear All</button>
              <button id="get-recommendations" class="btn btn-primary">Get Recommendations</button>
            </div>
          </aside>
          
          <main class="results-panel">
            <div class="results-header">
              <h2 id="results-title">All Games</h2>
              <div class="results-stats">
                <span id="results-count">12 games found</span>
                <div class="sort-options">
                  <label for="sort-select">Sort by:</label>
                  <select id="sort-select">
                    <option value="name">Name</option>
                    <option value="subject">Subject</option>
                    <option value="estimatedPlayTime">Play Time</option>
                    <option value="ageRange">Age Range</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="games-grid" id="games-grid">
              <!-- Games will be rendered here -->
            </div>
            
            <div class="recommendations-section" id="recommendations-section" style="display: none;">
              <h3>🌟 Recommended for You</h3>
              <div class="recommendations-grid" id="recommendations-grid">
                <!-- Recommendations will be rendered here -->
              </div>
            </div>
          </main>
        </div>
      </div>
    `;

    this.addStyles();
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .game-discovery {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 1400px;
        margin: 0 auto;
        padding: 20px;
        background: var(--bg-body, #f8f9fa);
      }
      
      .discovery-header {
        text-align: center;
        margin-bottom: 2rem;
      }
      
      .discovery-header h1 {
        color: var(--text-primary, #2c3e50);
        margin-bottom: 0.5rem;
      }
      
      .discovery-content {
        display: grid;
        grid-template-columns: 300px 1fr;
        gap: 2rem;
      }
      
      .filter-panel {
        background: var(--bg-card, #fff);
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        height: fit-content;
        position: sticky;
        top: 20px;
      }
      
      .filter-panel h2 {
        margin-top: 0;
        color: var(--text-primary, #2c3e50);
        border-bottom: 2px solid var(--primary-color, #007bff);
        padding-bottom: 0.5rem;
      }
      
      .filter-group {
        margin-bottom: 1.5rem;
      }
      
      .filter-group label {
        display: block;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: var(--text-primary, #2c3e50);
      }
      
      .filter-group input,
      .filter-group select {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid var(--border-color, #dee2e6);
        border-radius: 6px;
        font-size: 0.9rem;
        transition: border-color 0.2s;
      }
      
      .filter-group input:focus,
      .filter-group select:focus {
        outline: none;
        border-color: var(--primary-color, #007bff);
      }
      
      .tag-checkboxes {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      
      .tag-checkboxes label {
        display: flex;
        align-items: center;
        font-weight: normal;
        margin-bottom: 0;
        cursor: pointer;
      }
      
      .tag-checkboxes input[type="checkbox"] {
        width: auto;
        margin-right: 0.5rem;
      }
      
      .filter-actions {
        display: flex;
        gap: 0.5rem;
      }
      
      .btn {
        padding: 0.75rem 1rem;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
        flex: 1;
      }
      
      .btn-primary {
        background: var(--primary-color, #007bff);
        color: white;
      }
      
      .btn-secondary {
        background: var(--secondary-color, #6c757d);
        color: white;
      }
      
      .btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      }
      
      .results-panel {
        background: var(--bg-card, #fff);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      
      .results-header {
        padding: 1.5rem;
        border-bottom: 1px solid var(--border-color, #dee2e6);
        background: linear-gradient(135deg, var(--primary-color, #007bff), var(--secondary-color, #6c757d));
        color: white;
      }
      
      .results-header h2 {
        margin: 0 0 1rem 0;
      }
      
      .results-stats {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .sort-options {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .sort-options select {
        padding: 0.5rem;
        border: 1px solid rgba(255,255,255,0.3);
        border-radius: 4px;
        background: rgba(255,255,255,0.9);
      }
      
      .games-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
        padding: 1.5rem;
      }
      
      .game-card {
        background: var(--bg-secondary, #f8f9fa);
        border-radius: 8px;
        padding: 1.5rem;
        border-left: 4px solid var(--primary-color, #007bff);
        transition: all 0.2s;
        cursor: pointer;
      }
      
      .game-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      
      .game-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
      }
      
      .game-title {
        font-size: 1.1rem;
        font-weight: bold;
        color: var(--text-primary, #2c3e50);
        margin: 0;
      }
      
      .game-meta {
        font-size: 0.8rem;
        color: var(--text-secondary, #6c757d);
        text-align: right;
      }
      
      .game-description {
        color: var(--text-secondary, #6c757d);
        margin-bottom: 1rem;
        line-height: 1.4;
      }
      
      .game-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }
      
      .game-tag {
        background: var(--primary-color, #007bff);
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 500;
      }
      
      .game-stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
        font-size: 0.8rem;
      }
      
      .game-stat {
        display: flex;
        justify-content: space-between;
      }
      
      .recommendations-section {
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        padding: 1.5rem;
        margin-top: 1rem;
      }
      
      .recommendations-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
      }
      
      .no-results {
        text-align: center;
        padding: 3rem;
        color: var(--text-secondary, #6c757d);
      }
      
      @media (max-width: 768px) {
        .discovery-content {
          grid-template-columns: 1fr;
        }
        
        .filter-panel {
          position: static;
        }
        
        .games-grid {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.appendChild(style);
  }

  attachEventListeners() {
    // Search input
    document.getElementById('search-input').addEventListener('input', e => {
      this.filters.searchText = e.target.value;
      this.updateResults();
    });

    // Filter dropdowns
    ['subject', 'age', 'playtime', 'gametype', 'level'].forEach(filterId => {
      const element = document.getElementById(`${filterId}-filter`);
      if (element) {
        element.addEventListener('change', e => {
          this.updateFilter(filterId, e.target.value);
        });
      }
    });

    // Tag checkboxes
    document.getElementById('tag-checkboxes').addEventListener('change', e => {
      if (e.target.type === 'checkbox') {
        if (e.target.checked) {
          this.filters.tags.push(e.target.value);
        } else {
          this.filters.tags = this.filters.tags.filter(tag => tag !== e.target.value);
        }
        this.updateResults();
      }
    });

    // Sort dropdown
    document.getElementById('sort-select').addEventListener('change', e => {
      this.updateResults(e.target.value);
    });

    // Action buttons
    document.getElementById('clear-filters').addEventListener('click', () => {
      this.clearFilters();
    });

    document.getElementById('get-recommendations').addEventListener('click', () => {
      this.showRecommendations();
    });
  }

  updateFilter(filterId, value) {
    switch (filterId) {
      case 'subject':
        this.filters.subject = value;
        break;
      case 'age':
        this.filters.ageRange = value;
        break;
      case 'playtime':
        this.filters.playTime = value;
        break;
      case 'gametype':
        this.filters.gameType = value;
        break;
      case 'level':
        this.filters.competencyLevel = value;
        break;
    }
    this.updateResults();
  }

  updateResults(sortBy = 'name') {
    let games = this.getFilteredGames();
    games = this.sortGames(games, sortBy);

    this.renderGames(games);
    this.updateResultsCount(games.length);
  }

  getFilteredGames() {
    const criteria = {};

    // Basic filters
    if (this.filters.subject) criteria.subject = this.filters.subject;
    if (this.filters.gameType) criteria.gameType = this.filters.gameType;
    if (this.filters.searchText) criteria.search = this.filters.searchText;

    // Advanced filters
    let games = GameRegistryUtil.getGamesAdvanced(criteria);

    // Age range filtering
    if (this.filters.ageRange) {
      games = games.filter(game => {
        if (!game.metadata?.ageRange) return false;
        return GameRegistryUtil.isAgeRangeMatch(game.metadata.ageRange, this.filters.ageRange);
      });
    }

    // Play time filtering
    if (this.filters.playTime) {
      const timeFilters = {
        short: { max: 8 },
        medium: { min: 8, max: 12 },
        long: { min: 12 },
      };

      const timeFilter = timeFilters[this.filters.playTime];
      if (timeFilter) {
        games = GameRegistryUtil.getGamesByPlayTime(timeFilter);
      }
    }

    // Competency level filtering
    if (this.filters.competencyLevel) {
      games = games.filter(game => game.metadata?.competencyLevel === this.filters.competencyLevel);
    }

    // Tag filtering
    if (this.filters.tags.length > 0) {
      games = games.filter(game => {
        if (!game.metadata?.tags) return false;
        return this.filters.tags.some(tag =>
          game.metadata.tags.some(gameTag => gameTag.includes(tag))
        );
      });
    }

    return games;
  }

  sortGames(games, sortBy) {
    return GameRegistryUtil.sortGames(games, sortBy, 'asc');
  }

  renderGames(games) {
    const container = document.getElementById('games-grid');

    if (games.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <h3>No games found</h3>
          <p>Try adjusting your filters to find more games.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = games.map(game => this.createGameCard(game)).join('');
  }

  createGameCard(game) {
    const playTime = game.metadata?.estimatedPlayTime || 'Unknown';
    const ageRange = game.metadata?.ageRange || 'All ages';
    const tags = game.metadata?.tags?.slice(0, 3) || [];

    return `
      <div class="game-card" data-game-id="${game.id}">
        <div class="game-card-header">
          <h3 class="game-title">${game.name}</h3>
          <div class="game-meta">
            <div>${playTime} min</div>
            <div>Ages ${ageRange}</div>
          </div>
        </div>
        
        <p class="game-description">${game.description}</p>
        
        <div class="game-tags">
          ${tags.map(tag => `<span class="game-tag">${tag}</span>`).join('')}
        </div>
        
        <div class="game-stats">
          <div class="game-stat">
            <span>Subject:</span>
            <span>${game.subject}</span>
          </div>
          <div class="game-stat">
            <span>Level:</span>
            <span>${game.metadata?.competencyLevel || 'Any'}</span>
          </div>
          <div class="game-stat">
            <span>Character:</span>
            <span>${game.character}</span>
          </div>
          <div class="game-stat">
            <span>Type:</span>
            <span>${game.metadata?.gameType || 'Game'}</span>
          </div>
        </div>
      </div>
    `;
  }

  updateResultsCount(count) {
    document.getElementById('results-count').textContent = `${count} games found`;
  }

  clearFilters() {
    this.filters = {
      subject: '',
      ageRange: '',
      playTime: '',
      gameType: '',
      competencyLevel: '',
      tags: [],
      searchText: '',
    };

    // Reset form elements
    document.getElementById('search-input').value = '';
    document.querySelectorAll('select').forEach(select => (select.value = ''));
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = false;
    });

    this.updateResults();
  }

  showRecommendations() {
    const preferences = {
      subjects: this.filters.subject ? [this.filters.subject] : ['math', 'reading'],
      ageRange: this.filters.ageRange || '6-10',
      playTime: this.getPlayTimeRange(),
      learningObjectives: this.filters.tags.length > 0 ? this.filters.tags : ['problem-solving'],
    };

    const recommendations = GameRegistryUtil.getRecommendations(preferences, 6);

    const recommendationsSection = document.getElementById('recommendations-section');
    const recommendationsGrid = document.getElementById('recommendations-grid');

    if (recommendations.length > 0) {
      recommendationsGrid.innerHTML = recommendations
        .map(game => this.createGameCard(game))
        .join('');
      recommendationsSection.style.display = 'block';
    } else {
      recommendationsSection.style.display = 'none';
    }
  }

  getPlayTimeRange() {
    switch (this.filters.playTime) {
      case 'short':
        return { max: 8 };
      case 'medium':
        return { min: 8, max: 12 };
      case 'long':
        return { min: 12 };
      default:
        return { min: 5, max: 15 };
    }
  }
}
