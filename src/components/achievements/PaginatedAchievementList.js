/**
 * PaginatedAchievementList.js
 * 
 * Performance-optimized achievement list with pagination and lazy loading
 * Efficiently handles large datasets by loading achievements in chunks
 */

import BadgeDisplay from '../badges/BadgeDisplay.js';
import { getAllBadges, BADGE_RARITY } from '../../utils/badgeDefinitions.js';

class PaginatedAchievementList {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.achievements = options.achievements || [];
    this.pageSize = options.pageSize || 20;
    this.loadMoreThreshold = options.loadMoreThreshold || 0.8; // Load more when 80% scrolled
    this.showLoadMoreButton = options.showLoadMoreButton !== false;
    this.showPageInfo = options.showPageInfo !== false;
    this.badgeSize = options.badgeSize || 'normal';
    this.layout = options.layout || 'grid'; // 'grid' or 'list'
    this.onBadgeClick = options.onBadgeClick || null;
    this.onLoadComplete = options.onLoadComplete || null;
    
    // Pagination state
    this.currentPage = 0;
    this.totalPages = 0;
    this.loadedAchievements = [];
    this.isLoading = false;
    this.hasMorePages = true;
    this.filteredAchievements = [];
    
    // Filter state
    this.currentFilter = 'all';
    this.currentSearch = '';
    this.currentCategory = 'all';
    this.currentRarity = 'all';
    this.sortBy = 'default'; // 'default', 'name', 'rarity', 'date'
    this.sortOrder = 'asc'; // 'asc' or 'desc'
    
    // Performance tracking
    this.loadTime = 0;
    this.renderTime = 0;
    this.totalItemsLoaded = 0;
    
    // Intersection Observer for auto-loading
    this.intersectionObserver = null;
    
    this.init();
  }
  
  init() {
    if (!this.container) {
      console.error(`Container ${this.containerId} not found`);
      return;
    }
    
    this.render();
    this.setupIntersectionObserver();
    this.loadFirstPage();
  }
  
  /**
   * Render the component structure
   */
  render() {
    this.container.className = 'paginated-achievement-list';
    this.container.innerHTML = `
      <div class="achievement-list-header">
        <div class="list-controls">
          <div class="view-controls">
            <button class="view-btn ${this.layout === 'grid' ? 'active' : ''}" data-layout="grid" title="Grid View">
              <span class="icon">⊞</span>
            </button>
            <button class="view-btn ${this.layout === 'list' ? 'active' : ''}" data-layout="list" title="List View">
              <span class="icon">☰</span>
            </button>
          </div>
          
          <div class="sort-controls">
            <select class="sort-select" id="${this.containerId}-sort">
              <option value="default">Default Order</option>
              <option value="name">Name (A-Z)</option>
              <option value="rarity">Rarity</option>
              <option value="date">Date Unlocked</option>
              <option value="progress">Progress</option>
            </select>
            <button class="sort-order-btn" id="${this.containerId}-order" title="Toggle Sort Order">
              <span class="icon">${this.sortOrder === 'asc' ? '↑' : '↓'}</span>
            </button>
          </div>
        </div>
        
        ${this.showPageInfo ? this.getPageInfoHTML() : ''}
      </div>
      
      <div class="achievement-list-content ${this.layout}">
        <div class="achievement-items" id="${this.containerId}-items"></div>
        
        <div class="load-more-section" id="${this.containerId}-load-more">
          ${this.showLoadMoreButton ? '<button class="load-more-btn" id="${this.containerId}-load-btn">Load More</button>' : ''}
          <div class="loading-indicator" style="display: none;">
            <div class="loading-spinner"></div>
            <span class="loading-text">Loading achievements...</span>
          </div>
          <div class="load-sentinel" id="${this.containerId}-sentinel" style="height: 1px;"></div>
        </div>
      </div>
      
      <div class="achievement-list-footer">
        <div class="performance-info" style="display: none;">
          <span class="perf-stat">Loaded: <span id="items-loaded">0</span></span>
          <span class="perf-stat">Load Time: <span id="load-time">0ms</span></span>
          <span class="perf-stat">Render Time: <span id="render-time">0ms</span></span>
        </div>
      </div>
    `;
    
    this.itemsContainer = this.container.querySelector('#${this.containerId}-items');
    this.loadMoreSection = this.container.querySelector('#${this.containerId}-load-more');
    this.loadMoreBtn = this.container.querySelector('#${this.containerId}-load-btn');
    this.loadingSentinel = this.container.querySelector('#${this.containerId}-sentinel');
    this.loadingIndicator = this.container.querySelector('.loading-indicator');
    
    this.setupEventListeners();
  }
  
  /**
   * Get page info HTML
   */
  getPageInfoHTML() {
    return `
      <div class="page-info">
        <span class="page-stats" id="${this.containerId}-stats">
          Showing <span class="loaded-count">0</span> of <span class="total-count">0</span> achievements
        </span>
        <div class="page-controls" style="display: none;">
          <button class="page-btn prev-btn" id="${this.containerId}-prev" disabled>Previous</button>
          <span class="page-indicator">
            Page <span class="current-page">1</span> of <span class="total-pages">1</span>
          </span>
          <button class="page-btn next-btn" id="${this.containerId}-next">Next</button>
        </div>
      </div>
    `;
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // View toggle buttons
    this.container.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setLayout(btn.dataset.layout);
      });
    });
    
    // Sort controls
    const sortSelect = this.container.querySelector('.sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        this.setSortBy(sortSelect.value);
      });
    }
    
    const sortOrderBtn = this.container.querySelector('.sort-order-btn');
    if (sortOrderBtn) {
      sortOrderBtn.addEventListener('click', () => {
        this.toggleSortOrder();
      });
    }
    
    // Load more button
    if (this.loadMoreBtn) {
      this.loadMoreBtn.addEventListener('click', () => {
        this.loadNextPage();
      });
    }
    
    // Page navigation (if using manual pagination)
    const prevBtn = this.container.querySelector('#${this.containerId}-prev');
    const nextBtn = this.container.querySelector('#${this.containerId}-next');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.goToPreviousPage();
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.goToNextPage();
      });
    }
  }
  
  /**
   * Setup Intersection Observer for auto-loading
   */
  setupIntersectionObserver() {
    if (!this.loadingSentinel || typeof IntersectionObserver === 'undefined') return;
    
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.isLoading && this.hasMorePages) {
            this.loadNextPage();
          }
        });
      },
      {
        root: null,
        rootMargin: '100px', // Start loading 100px before the sentinel comes into view
        threshold: 0.1
      }
    );
    
    this.intersectionObserver.observe(this.loadingSentinel);
  }
  
  /**
   * Set layout mode
   */
  setLayout(layout) {
    if (layout === this.layout) return;
    
    this.layout = layout;
    
    // Update button states
    this.container.querySelectorAll('.view-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.layout === layout);
    });
    
    // Update content container class
    const content = this.container.querySelector('.achievement-list-content');
    content.className = `achievement-list-content ${layout}`;
    
    // Re-render current items with new layout
    this.renderCurrentItems();
  }
  
  /**
   * Set sort criteria
   */
  setSortBy(sortBy) {
    this.sortBy = sortBy;
    this.resetPagination();
    this.applyFiltersAndSort();
    this.loadFirstPage();
  }
  
  /**
   * Toggle sort order
   */
  toggleSortOrder() {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    
    // Update button icon
    const orderBtn = this.container.querySelector('.sort-order-btn .icon');
    if (orderBtn) {
      orderBtn.textContent = this.sortOrder === 'asc' ? '↑' : '↓';
    }
    
    this.resetPagination();
    this.applyFiltersAndSort();
    this.loadFirstPage();
  }
  
  /**
   * Set filters and triggers reload
   */
  setFilters(filters) {
    this.currentFilter = filters.status || 'all';
    this.currentSearch = filters.search || '';
    this.currentCategory = filters.category || 'all';
    this.currentRarity = filters.rarity || 'all';
    
    this.resetPagination();
    this.applyFiltersAndSort();
    this.loadFirstPage();
  }
  
  /**
   * Apply filters and sorting to achievements
   */
  applyFiltersAndSort() {
    let filtered = [...this.achievements];
    
    // Apply filters
    filtered = this.applyFilters(filtered);
    
    // Apply sorting
    filtered = this.applySorting(filtered);
    
    this.filteredAchievements = filtered;
    this.totalPages = Math.ceil(filtered.length / this.pageSize);
    this.hasMorePages = this.totalPages > 1;
  }
  
  /**
   * Apply current filters
   */
  applyFilters(achievements) {
    let filtered = [...achievements];
    
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
      const searchTerm = this.currentSearch.toLowerCase();
      filtered = filtered.filter(a => {
        const badge = getAllBadges().find(b => b.id === a.id);
        if (!badge) return false;
        
        return badge.name.toLowerCase().includes(searchTerm) ||
               badge.description.toLowerCase().includes(searchTerm);
      });
    }
    
    return filtered;
  }
  
  /**
   * Apply current sorting
   */
  applySorting(achievements) {
    const sorted = [...achievements];
    
    sorted.sort((a, b) => {
      let result = 0;
      
      switch (this.sortBy) {
      case 'name': {
        const badgeA = getAllBadges().find(badge => badge.id === a.id);
        const badgeB = getAllBadges().find(badge => badge.id === b.id);
        if (badgeA && badgeB) {
          result = badgeA.name.localeCompare(badgeB.name);
        }
        break;
      }
        
      case 'rarity': {
        const rarityOrder = {
          [BADGE_RARITY.LEGENDARY]: 4,
          [BADGE_RARITY.EPIC]: 3,
          [BADGE_RARITY.RARE]: 2,
          [BADGE_RARITY.COMMON]: 1
        };
        const badgeARarity = getAllBadges().find(badge => badge.id === a.id);
        const badgeBRarity = getAllBadges().find(badge => badge.id === b.id);
        if (badgeARarity && badgeBRarity) {
          result = (rarityOrder[badgeBRarity.rarity] || 0) - (rarityOrder[badgeARarity.rarity] || 0);
        }
        break;
      }
        
      case 'date': {
        const dateA = a.unlockedAt ? new Date(a.unlockedAt) : new Date(0);
        const dateB = b.unlockedAt ? new Date(b.unlockedAt) : new Date(0);
        result = dateB - dateA;
        break;
      }
        
      case 'progress': {
        const progressA = a.progress?.current || 0;
        const progressB = b.progress?.current || 0;
        result = progressB - progressA;
        break;
      }
        
      default: // 'default'
        // Sort by unlock status first, then by rarity
        if (a.unlocked !== b.unlocked) {
          result = b.unlocked - a.unlocked;
        } else {
          const badgeADefault = getAllBadges().find(badge => badge.id === a.id);
          const badgeBDefault = getAllBadges().find(badge => badge.id === b.id);
          if (badgeADefault && badgeBDefault) {
            const rarityOrderDefault = {
              [BADGE_RARITY.LEGENDARY]: 4,
              [BADGE_RARITY.EPIC]: 3,
              [BADGE_RARITY.RARE]: 2,
              [BADGE_RARITY.COMMON]: 1
            };
            result = (rarityOrderDefault[badgeBDefault.rarity] || 0) - (rarityOrderDefault[badgeADefault.rarity] || 0);
          }
        }
        break;
      }
      
      return this.sortOrder === 'desc' ? -result : result;
    });
    
    return sorted;
  }
  
  /**
   * Reset pagination state
   */
  resetPagination() {
    this.currentPage = 0;
    this.loadedAchievements = [];
    this.totalItemsLoaded = 0;
    this.hasMorePages = true;
    
    if (this.itemsContainer) {
      this.itemsContainer.innerHTML = '';
    }
  }
  
  /**
   * Load first page
   */
  async loadFirstPage() {
    this.resetPagination();
    await this.loadNextPage();
  }
  
  /**
   * Load next page of achievements
   */
  async loadNextPage() {
    if (this.isLoading || !this.hasMorePages) return;
    
    this.isLoading = true;
    this.showLoading();
    
    const startTime = performance.now();
    
    try {
      const startIndex = this.currentPage * this.pageSize;
      const endIndex = Math.min(startIndex + this.pageSize, this.filteredAchievements.length);
      const pageAchievements = this.filteredAchievements.slice(startIndex, endIndex);
      
      // Simulate async loading delay for demonstration
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.loadedAchievements.push(...pageAchievements);
      this.currentPage++;
      this.hasMorePages = endIndex < this.filteredAchievements.length;
      this.totalItemsLoaded = this.loadedAchievements.length;
      
      this.loadTime = performance.now() - startTime;
      
      await this.renderPage(pageAchievements);
      this.updatePageInfo();
      this.updatePerformanceInfo();
      
      if (this.onLoadComplete) {
        this.onLoadComplete(this.loadedAchievements.length, this.filteredAchievements.length);
      }
      
    } catch (error) {
      console.error('Error loading achievements page:', error);
    } finally {
      this.isLoading = false;
      this.hideLoading();
    }
  }
  
  /**
   * Render a page of achievements
   */
  async renderPage(achievements) {
    const startTime = performance.now();
    
    const fragment = document.createDocumentFragment();
    
    achievements.forEach(achievement => {
      const itemElement = this.createAchievementItem(achievement);
      fragment.appendChild(itemElement);
    });
    
    this.itemsContainer.appendChild(fragment);
    
    this.renderTime = performance.now() - startTime;
  }
  
  /**
   * Re-render all currently loaded items (for layout changes)
   */
  renderCurrentItems() {
    if (!this.itemsContainer) return;
    
    this.itemsContainer.innerHTML = '';
    
    const fragment = document.createDocumentFragment();
    
    this.loadedAchievements.forEach(achievement => {
      const itemElement = this.createAchievementItem(achievement);
      fragment.appendChild(itemElement);
    });
    
    this.itemsContainer.appendChild(fragment);
  }
  
  /**
   * Create achievement item element
   */
  createAchievementItem(achievement) {
    const itemElement = document.createElement('div');
    itemElement.className = `achievement-item ${this.layout}-item`;
    
    if (this.layout === 'list') {
      itemElement.innerHTML = this.createListItemHTML(achievement);
    } else {
      // Grid layout - use BadgeDisplay component
      const badgeElement = BadgeDisplay.createElement(achievement, {
        size: this.badgeSize,
        onClick: this.onBadgeClick
      });
      itemElement.appendChild(badgeElement);
    }
    
    return itemElement;
  }
  
  /**
   * Create list item HTML
   */
  createListItemHTML(achievement) {
    const badge = getAllBadges().find(b => b.id === achievement.id);
    if (!badge) return '<div class="achievement-item-error">Badge not found</div>';
    
    const progressHTML = achievement.progress ? `
      <div class="achievement-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${(achievement.progress.current / achievement.progress.required) * 100}%"></div>
        </div>
        <span class="progress-text">${achievement.progress.current}/${achievement.progress.required}</span>
      </div>
    ` : '';
    
    const dateHTML = achievement.unlockedAt ? `
      <div class="achievement-date">
        Unlocked: ${new Date(achievement.unlockedAt).toLocaleDateString()}
      </div>
    ` : '';
    
    return `
      <div class="achievement-list-item" ${this.onBadgeClick ? 'role="button" tabindex="0"' : ''}>
        <div class="achievement-icon">
          <span class="badge-emoji">${badge.icon}</span>
        </div>
        <div class="achievement-info">
          <div class="achievement-header">
            <h4 class="achievement-name">${badge.name}</h4>
            <span class="achievement-rarity ${badge.rarity}">${badge.rarity}</span>
          </div>
          <p class="achievement-description">${badge.description}</p>
          ${progressHTML}
          ${dateHTML}
        </div>
        <div class="achievement-points">
          <span class="points-value">${badge.points}</span>
          <span class="points-label">pts</span>
        </div>
      </div>
    `;
  }
  
  /**
   * Show loading indicator
   */
  showLoading() {
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = 'flex';
    }
    
    if (this.loadMoreBtn) {
      this.loadMoreBtn.disabled = true;
      this.loadMoreBtn.textContent = 'Loading...';
    }
  }
  
  /**
   * Hide loading indicator
   */
  hideLoading() {
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = 'none';
    }
    
    if (this.loadMoreBtn) {
      this.loadMoreBtn.disabled = false;
      this.loadMoreBtn.textContent = this.hasMorePages ? 'Load More' : 'All Loaded';
      this.loadMoreBtn.style.display = this.hasMorePages ? 'block' : 'none';
    }
  }
  
  /**
   * Update page information display
   */
  updatePageInfo() {
    const statsElement = this.container.querySelector(`#${this.containerId}-stats`);
    if (statsElement) {
      const loadedCount = statsElement.querySelector('.loaded-count');
      const totalCount = statsElement.querySelector('.total-count');
      
      if (loadedCount) loadedCount.textContent = this.loadedAchievements.length;
      if (totalCount) totalCount.textContent = this.filteredAchievements.length;
    }
  }
  
  /**
   * Update performance information
   */
  updatePerformanceInfo() {
    const itemsLoadedElement = this.container.querySelector('#items-loaded');
    const loadTimeElement = this.container.querySelector('#load-time');
    const renderTimeElement = this.container.querySelector('#render-time');
    
    if (itemsLoadedElement) itemsLoadedElement.textContent = this.totalItemsLoaded;
    if (loadTimeElement) loadTimeElement.textContent = `${Math.round(this.loadTime)}ms`;
    if (renderTimeElement) renderTimeElement.textContent = `${Math.round(this.renderTime)}ms`;
  }
  
  /**
   * Go to previous page (manual pagination)
   */
  goToPreviousPage() {
    // Implementation for manual pagination if needed
  }
  
  /**
   * Go to next page (manual pagination)
   */
  goToNextPage() {
    // Implementation for manual pagination if needed
  }
  
  /**
   * Public API methods
   */
  updateAchievements(achievements) {
    this.achievements = achievements;
    this.resetPagination();
    this.applyFiltersAndSort();
    this.loadFirstPage();
  }
  
  addAchievement(achievement) {
    this.achievements.push(achievement);
    this.applyFiltersAndSort();
    // Optionally reload if the new achievement should be visible
  }
  
  removeAchievement(achievementId) {
    this.achievements = this.achievements.filter(a => a.id !== achievementId);
    this.applyFiltersAndSort();
    // Remove from loaded achievements if present
    this.loadedAchievements = this.loadedAchievements.filter(a => a.id !== achievementId);
    this.renderCurrentItems();
    this.updatePageInfo();
  }
  
  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      totalAchievements: this.achievements.length,
      filteredAchievements: this.filteredAchievements.length,
      loadedAchievements: this.loadedAchievements.length,
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      pageSize: this.pageSize,
      loadTime: this.loadTime,
      renderTime: this.renderTime,
      hasMorePages: this.hasMorePages
    };
  }
  
  /**
   * Cleanup resources
   */
  destroy() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }
}

export default PaginatedAchievementList;