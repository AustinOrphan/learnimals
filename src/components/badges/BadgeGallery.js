/**
 * BadgeGallery.js
 * 
 * Component for displaying collections of badges with filtering and search
 */

import BadgeDisplay from './BadgeDisplay.js';
import { getAllBadges, BADGE_RARITY } from '../../utils/badgeDefinitions.js';

class BadgeGallery {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.achievements = options.achievements || [];
    this.showFilters = options.showFilters !== false;
    this.showSearch = options.showSearch !== false;
    this.showStats = options.showStats !== false;
    this.badgeSize = options.badgeSize || 'normal';
    this.columns = options.columns || 'auto';
    this.onBadgeClick = options.onBadgeClick || null;
    
    // Filter state
    this.currentFilter = 'all';
    this.currentSearch = '';
    this.currentCategory = 'all';
    
    this.init();
  }
  
  init() {
    if (!this.container) {
      console.error(`Container ${this.containerId} not found`);
      return;
    }
    
    this.render();
  }
  
  /**
   * Render the entire gallery
   */
  render() {
    this.container.className = 'badge-gallery';
    this.container.innerHTML = `
      ${this.showStats ? this.getStatsHTML() : ''}
      ${this.showFilters || this.showSearch ? this.getControlsHTML() : ''}
      <div class="badge-grid" id="${this.containerId}-grid"></div>
    `;
    
    this.setupEventListeners();
    this.renderBadges();
  }
  
  /**
   * Get stats HTML
   */
  getStatsHTML() {
    const stats = this.calculateStats();
    
    return `
      <div class="gallery-stats">
        <div class="stat-item">
          <span class="stat-value">${stats.unlocked}</span>
          <span class="stat-label">Unlocked</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.total}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.points}</span>
          <span class="stat-label">Points</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.completion}%</span>
          <span class="stat-label">Complete</span>
        </div>
      </div>
    `;
  }
  
  /**
   * Get controls HTML (filters and search)
   */
  getControlsHTML() {
    return `
      <div class="gallery-controls">
        ${this.showFilters ? this.getFiltersHTML() : ''}
        ${this.showSearch ? this.getSearchHTML() : ''}
      </div>
    `;
  }
  
  /**
   * Get filters HTML
   */
  getFiltersHTML() {
    return `
      <div class="gallery-filters">
        <div class="filter-group">
          <label>Status:</label>
          <div class="filter-buttons">
            <button class="filter-btn active" data-filter="all">All</button>
            <button class="filter-btn" data-filter="unlocked">Unlocked</button>
            <button class="filter-btn" data-filter="locked">Locked</button>
            <button class="filter-btn" data-filter="progress">In Progress</button>
          </div>
        </div>
        
        <div class="filter-group">
          <label>Rarity:</label>
          <div class="filter-buttons">
            <button class="rarity-btn active" data-rarity="all">All</button>
            <button class="rarity-btn common" data-rarity="${BADGE_RARITY.COMMON}">Common</button>
            <button class="rarity-btn rare" data-rarity="${BADGE_RARITY.RARE}">Rare</button>
            <button class="rarity-btn epic" data-rarity="${BADGE_RARITY.EPIC}">Epic</button>
            <button class="rarity-btn legendary" data-rarity="${BADGE_RARITY.LEGENDARY}">Legendary</button>
          </div>
        </div>
        
        <div class="filter-group">
          <label>Category:</label>
          <select class="category-select" id="${this.containerId}-category">
            <option value="all">All Categories</option>
            <option value="word-scramble">Word Scramble</option>
            <option value="number-line-jump">Number Jump</option>
            <option value="element-match">Element Match</option>
            <option value="sentence-builder">Sentence Builder</option>
            <option value="color-palette">Color Palette</option>
            <option value="cross-game">Cross-Game</option>
          </select>
        </div>
      </div>
    `;
  }
  
  /**
   * Get search HTML
   */
  getSearchHTML() {
    return `
      <div class="gallery-search">
        <div class="search-container">
          <input type="text" 
                 class="search-input" 
                 id="${this.containerId}-search"
                 placeholder="Search badges..."
                 maxlength="50">
          <button class="search-clear" id="${this.containerId}-clear">✕</button>
        </div>
      </div>
    `;
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Filter buttons
    if (this.showFilters) {
      this.container.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.setFilter(btn.dataset.filter);
        });
      });
      
      this.container.querySelectorAll('.rarity-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.setRarityFilter(btn.dataset.rarity);
        });
      });
      
      const categorySelect = this.container.querySelector('.category-select');
      if (categorySelect) {
        categorySelect.addEventListener('change', () => {
          this.setCategoryFilter(categorySelect.value);
        });
      }
    }
    
    // Search
    if (this.showSearch) {
      const searchInput = this.container.querySelector('.search-input');
      const clearBtn = this.container.querySelector('.search-clear');
      
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.setSearch(e.target.value);
        });
        
        searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            this.clearSearch();
          }
        });
      }
      
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          this.clearSearch();
        });
      }
    }
  }
  
  /**
   * Set status filter
   */
  setFilter(filter) {
    this.currentFilter = filter;
    
    // Update active state
    this.container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    
    this.renderBadges();
  }
  
  /**
   * Set rarity filter
   */
  setRarityFilter(rarity) {
    this.currentRarity = rarity;
    
    // Update active state
    this.container.querySelectorAll('.rarity-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.rarity === rarity);
    });
    
    this.renderBadges();
  }
  
  /**
   * Set category filter
   */
  setCategoryFilter(category) {
    this.currentCategory = category;
    this.renderBadges();
  }
  
  /**
   * Set search term
   */
  setSearch(search) {
    this.currentSearch = search.toLowerCase();
    this.renderBadges();
    
    // Show/hide clear button
    const clearBtn = this.container.querySelector('.search-clear');
    if (clearBtn) {
      clearBtn.style.display = search ? 'block' : 'none';
    }
  }
  
  /**
   * Clear search
   */
  clearSearch() {
    const searchInput = this.container.querySelector('.search-input');
    if (searchInput) {
      searchInput.value = '';
    }
    this.setSearch('');
  }
  
  /**
   * Render filtered badges
   */
  renderBadges() {
    const grid = this.container.querySelector('.badge-grid');
    if (!grid) return;
    
    const filteredAchievements = this.getFilteredAchievements();
    
    if (filteredAchievements.length === 0) {
      grid.innerHTML = this.getEmptyStateHTML();
      return;
    }
    
    // Set grid columns based on options
    if (this.columns !== 'auto') {
      grid.style.gridTemplateColumns = `repeat(${this.columns}, 1fr)`;
    }
    
    // Clear existing badges
    grid.innerHTML = '';
    
    // Create badge elements
    filteredAchievements.forEach(achievement => {
      const badgeElement = BadgeDisplay.createElement(achievement, {
        size: this.badgeSize,
        onClick: this.onBadgeClick
      });
      
      grid.appendChild(badgeElement);
    });
    
    // Update stats if showing
    if (this.showStats) {
      this.updateStats();
    }
  }
  
  /**
   * Get filtered achievements based on current filters
   */
  getFilteredAchievements() {
    let filtered = [...this.achievements];
    
    // Status filter
    switch (this.currentFilter) {
    case 'unlocked':
      filtered = filtered.filter(a => a.unlocked);
      break;
    case 'locked':
      filtered = filtered.filter(a => !a.unlocked);
      break;
    case 'progress':
      filtered = filtered.filter(a => !a.unlocked && a.progress?.current > 0);
      break;
    }
    
    // Rarity filter
    if (this.currentRarity && this.currentRarity !== 'all') {
      filtered = filtered.filter(a => {
        const badge = getAllBadges().find(b => b.id === a.id);
        return badge && badge.rarity === this.currentRarity;
      });
    }
    
    // Category filter
    if (this.currentCategory && this.currentCategory !== 'all') {
      filtered = filtered.filter(a => {
        return a.gameType === this.currentCategory || 
               (this.currentCategory === 'cross-game' && !a.gameType);
      });
    }
    
    // Search filter
    if (this.currentSearch) {
      filtered = filtered.filter(a => {
        const badge = getAllBadges().find(b => b.id === a.id);
        if (!badge) return false;
        
        return badge.name.toLowerCase().includes(this.currentSearch) ||
               badge.description.toLowerCase().includes(this.currentSearch);
      });
    }
    
    // Sort by rarity and unlock status
    filtered.sort((a, b) => {
      const badgeA = getAllBadges().find(badge => badge.id === a.id);
      const badgeB = getAllBadges().find(badge => badge.id === b.id);
      
      if (!badgeA || !badgeB) return 0;
      
      // Sort by unlock status first (unlocked first)
      if (a.unlocked !== b.unlocked) {
        return b.unlocked - a.unlocked;
      }
      
      // Then by rarity
      const rarityOrder = {
        [BADGE_RARITY.LEGENDARY]: 4,
        [BADGE_RARITY.EPIC]: 3,
        [BADGE_RARITY.RARE]: 2,
        [BADGE_RARITY.COMMON]: 1
      };
      
      return (rarityOrder[badgeB.rarity] || 0) - (rarityOrder[badgeA.rarity] || 0);
    });
    
    return filtered;
  }
  
  /**
   * Get empty state HTML
   */
  getEmptyStateHTML() {
    let message = 'No badges found';
    let suggestion = '';
    
    if (this.currentFilter === 'unlocked') {
      message = 'No unlocked badges yet';
      suggestion = 'Play games to unlock your first badges!';
    } else if (this.currentFilter === 'locked') {
      message = 'All badges unlocked!';
      suggestion = 'Congratulations on your achievement!';
    } else if (this.currentSearch) {
      message = 'No badges match your search';
      suggestion = 'Try a different search term';
    }
    
    return `
      <div class="empty-state">
        <div class="empty-icon">🏆</div>
        <div class="empty-message">${message}</div>
        ${suggestion ? `<div class="empty-suggestion">${suggestion}</div>` : ''}
      </div>
    `;
  }
  
  /**
   * Calculate statistics
   */
  calculateStats() {
    const unlocked = this.achievements.filter(a => a.unlocked).length;
    const total = this.achievements.length;
    const points = this.achievements
      .filter(a => a.unlocked)
      .reduce((sum, a) => {
        const badge = getAllBadges().find(b => b.id === a.id);
        return sum + (badge?.points || 0);
      }, 0);
    const completion = total > 0 ? Math.round((unlocked / total) * 100) : 0;
    
    return { unlocked, total, points, completion };
  }
  
  /**
   * Update stats display
   */
  updateStats() {
    const statsElement = this.container.querySelector('.gallery-stats');
    if (!statsElement) return;
    
    const stats = this.calculateStats();
    const statValues = statsElement.querySelectorAll('.stat-value');
    
    statValues[0].textContent = stats.unlocked;
    statValues[1].textContent = stats.total;
    statValues[2].textContent = stats.points;
    statValues[3].textContent = `${stats.completion}%`;
  }
  
  /**
   * Update achievements and re-render
   */
  updateAchievements(achievements) {
    this.achievements = achievements;
    this.renderBadges();
  }
  
  /**
   * Add achievement
   */
  addAchievement(achievement) {
    this.achievements.push(achievement);
    this.renderBadges();
  }
  
  /**
   * Remove achievement
   */
  removeAchievement(achievementId) {
    this.achievements = this.achievements.filter(a => a.id !== achievementId);
    this.renderBadges();
  }
  
  /**
   * Reset all filters
   */
  resetFilters() {
    this.currentFilter = 'all';
    this.currentRarity = 'all';
    this.currentCategory = 'all';
    this.clearSearch();
    
    // Update UI
    this.container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === 'all');
    });
    
    this.container.querySelectorAll('.rarity-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.rarity === 'all');
    });
    
    const categorySelect = this.container.querySelector('.category-select');
    if (categorySelect) {
      categorySelect.value = 'all';
    }
    
    this.renderBadges();
  }
}

export default BadgeGallery;