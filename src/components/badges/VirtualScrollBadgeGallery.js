/**
 * VirtualScrollBadgeGallery.js
 * 
 * Performance-optimized BadgeGallery with virtual scrolling for large datasets
 * Only renders visible badges to maintain smooth performance with thousands of items
 */

import BadgeDisplay from './BadgeDisplay.js';
import { getAllBadges, BADGE_RARITY } from '../../utils/badgeDefinitions.js';

class VirtualScrollBadgeGallery {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.achievements = options.achievements || [];
    this.showFilters = options.showFilters !== false;
    this.showSearch = options.showSearch !== false;
    this.showStats = options.showStats !== false;
    this.badgeSize = options.badgeSize || 'normal';
    this.onBadgeClick = options.onBadgeClick || null;
    
    // Virtual scrolling configuration
    this.itemHeight = this.getBadgeHeight();
    this.itemWidth = this.getBadgeWidth();
    this.itemsPerRow = 1; // Will be calculated dynamically
    this.containerHeight = options.containerHeight || 400;
    this.overscan = options.overscan || 3; // Extra rows to render for smooth scrolling
    this.scrollThrottle = 16; // ~60fps
    
    // Virtual scrolling state
    this.scrollTop = 0;
    this.visibleStartIndex = 0;
    this.visibleEndIndex = 0;
    this.totalRows = 0;
    this.filteredAchievements = [];
    
    // Filter state
    this.currentFilter = 'all';
    this.currentSearch = '';
    this.currentCategory = 'all';
    this.currentRarity = 'all';
    
    // Performance tracking
    this.renderCount = 0;
    this.lastRenderTime = 0;
    
    this.init();
  }
  
  init() {
    if (!this.container) {
      console.error(`Container ${this.containerId} not found`);
      return;
    }
    
    this.render();
    this.setupResizeObserver();
  }
  
  /**
   * Get badge dimensions based on size setting
   */
  getBadgeHeight() {
    const heights = {
      small: 80,
      normal: 120,
      large: 160
    };
    return heights[this.badgeSize] || heights.normal;
  }
  
  getBadgeWidth() {
    const widths = {
      small: 80,
      normal: 120,
      large: 160
    };
    return widths[this.badgeSize] || widths.normal;
  }
  
  /**
   * Calculate how many items fit per row
   */
  calculateItemsPerRow() {
    const containerWidth = this.virtualContainer.clientWidth;
    const gap = 16; // CSS gap between items
    const availableWidth = containerWidth - gap;
    const itemWithGap = this.itemWidth + gap;
    
    this.itemsPerRow = Math.max(1, Math.floor(availableWidth / itemWithGap));
    this.totalRows = Math.ceil(this.filteredAchievements.length / this.itemsPerRow);
  }
  
  /**
   * Setup ResizeObserver to recalculate layout on container size changes
   */
  setupResizeObserver() {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.calculateItemsPerRow();
        this.updateVirtualScroll();
      });
      
      this.resizeObserver.observe(this.container);
    }
  }
  
  /**
   * Render the entire gallery structure
   */
  render() {
    this.container.className = 'virtual-badge-gallery';
    this.container.innerHTML = `
      ${this.showStats ? this.getStatsHTML() : ''}
      ${this.showFilters || this.showSearch ? this.getControlsHTML() : ''}
      <div class="virtual-scroll-container" style="height: ${this.containerHeight}px; overflow-y: auto;">
        <div class="virtual-content" style="position: relative;">
          <div class="virtual-spacer-top"></div>
          <div class="virtual-viewport"></div>
          <div class="virtual-spacer-bottom"></div>
        </div>
      </div>
      <div class="performance-info" style="display: none;"></div>
    `;
    
    this.virtualContainer = this.container.querySelector('.virtual-scroll-container');
    this.virtualContent = this.container.querySelector('.virtual-content');
    this.virtualViewport = this.container.querySelector('.virtual-viewport');
    this.spacerTop = this.container.querySelector('.virtual-spacer-top');
    this.spacerBottom = this.container.querySelector('.virtual-spacer-bottom');
    
    this.setupEventListeners();
    this.applyFiltersAndRender();
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
        <div class="stat-item performance-stat">
          <span class="stat-value" id="render-count">0</span>
          <span class="stat-label">Renders</span>
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
    // Virtual scroll listener with throttling
    this.virtualContainer.addEventListener('scroll', this.throttle(() => {
      this.scrollTop = this.virtualContainer.scrollTop;
      this.updateVirtualScroll();
    }, this.scrollThrottle));
    
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
    
    // Search with debouncing
    if (this.showSearch) {
      const searchInput = this.container.querySelector('.search-input');
      const clearBtn = this.container.querySelector('.search-clear');
      
      if (searchInput) {
        searchInput.addEventListener('input', this.debounce((e) => {
          this.setSearch(e.target.value);
        }, 300));
        
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
   * Throttle function for scroll events
   */
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  
  /**
   * Debounce function for search input
   */
  debounce(func, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
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
    
    this.applyFiltersAndRender();
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
    
    this.applyFiltersAndRender();
  }
  
  /**
   * Set category filter
   */
  setCategoryFilter(category) {
    this.currentCategory = category;
    this.applyFiltersAndRender();
  }
  
  /**
   * Set search term
   */
  setSearch(search) {
    this.currentSearch = search.toLowerCase();
    this.applyFiltersAndRender();
    
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
   * Apply filters and trigger virtual render
   */
  applyFiltersAndRender() {
    this.filteredAchievements = this.getFilteredAchievements();
    this.calculateItemsPerRow();
    this.updateVirtualScroll();
    this.updateStats();
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
   * Update virtual scroll viewport
   */
  updateVirtualScroll() {
    if (this.filteredAchievements.length === 0) {
      this.renderEmptyState();
      return;
    }
    
    const startTime = performance.now();
    
    // Calculate visible range
    const containerHeight = this.virtualContainer.clientHeight;
    const scrollTop = this.scrollTop;
    
    const startRow = Math.floor(scrollTop / this.itemHeight);
    const endRow = Math.min(
      Math.ceil((scrollTop + containerHeight) / this.itemHeight) + this.overscan,
      this.totalRows
    );
    
    const startIndex = Math.max(0, (startRow - this.overscan) * this.itemsPerRow);
    const endIndex = Math.min(endRow * this.itemsPerRow, this.filteredAchievements.length);
    
    // Only re-render if visible range changed
    if (startIndex !== this.visibleStartIndex || endIndex !== this.visibleEndIndex) {
      this.visibleStartIndex = startIndex;
      this.visibleEndIndex = endIndex;
      
      this.renderVisibleItems();
      this.updateSpacers();
    }
    
    // Performance tracking
    this.renderCount++;
    this.lastRenderTime = performance.now() - startTime;
    this.updatePerformanceStats();
  }
  
  /**
   * Render only the visible badge items
   */
  renderVisibleItems() {
    const fragment = document.createDocumentFragment();
    
    // Clear viewport
    this.virtualViewport.innerHTML = '';
    
    // Create grid container
    const grid = document.createElement('div');
    grid.className = 'virtual-badge-grid';
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(${this.itemsPerRow}, 1fr);
      gap: 16px;
      padding: 16px;
    `;
    
    // Render visible items
    for (let i = this.visibleStartIndex; i < this.visibleEndIndex; i++) {
      const achievement = this.filteredAchievements[i];
      if (!achievement) continue;
      
      const badgeElement = BadgeDisplay.createElement(achievement, {
        size: this.badgeSize,
        onClick: this.onBadgeClick
      });
      
      grid.appendChild(badgeElement);
    }
    
    fragment.appendChild(grid);
    this.virtualViewport.appendChild(fragment);
  }
  
  /**
   * Update spacer elements to maintain scroll height
   */
  updateSpacers() {
    const totalHeight = this.totalRows * this.itemHeight;
    const topHeight = Math.floor(this.visibleStartIndex / this.itemsPerRow) * this.itemHeight;
    const bottomHeight = totalHeight - topHeight - (Math.ceil((this.visibleEndIndex - this.visibleStartIndex) / this.itemsPerRow) * this.itemHeight);
    
    this.spacerTop.style.height = `${Math.max(0, topHeight)}px`;
    this.spacerBottom.style.height = `${Math.max(0, bottomHeight)}px`;
  }
  
  /**
   * Render empty state
   */
  renderEmptyState() {
    this.virtualViewport.innerHTML = this.getEmptyStateHTML();
    this.spacerTop.style.height = '0px';
    this.spacerBottom.style.height = '0px';
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
      <div class="empty-state" style="padding: 40px; text-align: center;">
        <div class="empty-icon" style="font-size: 3rem; margin-bottom: 16px;">🏆</div>
        <div class="empty-message" style="font-size: 1.2rem; margin-bottom: 8px; color: var(--text-primary);">${message}</div>
        ${suggestion ? `<div class="empty-suggestion" style="color: var(--text-secondary);">${suggestion}</div>` : ''}
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
    
    if (statValues.length >= 4) {
      statValues[0].textContent = stats.unlocked;
      statValues[1].textContent = stats.total;
      statValues[2].textContent = stats.points;
      statValues[3].textContent = `${stats.completion}%`;
    }
  }
  
  /**
   * Update performance statistics
   */
  updatePerformanceStats() {
    const renderCountElement = this.container.querySelector('#render-count');
    if (renderCountElement) {
      renderCountElement.textContent = this.renderCount;
    }
  }
  
  /**
   * Public API methods
   */
  updateAchievements(achievements) {
    this.achievements = achievements;
    this.applyFiltersAndRender();
  }
  
  addAchievement(achievement) {
    this.achievements.push(achievement);
    this.applyFiltersAndRender();
  }
  
  removeAchievement(achievementId) {
    this.achievements = this.achievements.filter(a => a.id !== achievementId);
    this.applyFiltersAndRender();
  }
  
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
    
    this.applyFiltersAndRender();
  }
  
  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      renderCount: this.renderCount,
      lastRenderTime: this.lastRenderTime,
      totalItems: this.achievements.length,
      filteredItems: this.filteredAchievements.length,
      visibleItems: this.visibleEndIndex - this.visibleStartIndex,
      itemsPerRow: this.itemsPerRow,
      totalRows: this.totalRows
    };
  }
  
  /**
   * Scroll to specific achievement
   */
  scrollToAchievement(achievementId) {
    const index = this.filteredAchievements.findIndex(a => a.id === achievementId);
    if (index === -1) return;
    
    const row = Math.floor(index / this.itemsPerRow);
    const targetScrollTop = row * this.itemHeight;
    
    this.virtualContainer.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    });
  }
  
  /**
   * Cleanup resources
   */
  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}

export default VirtualScrollBadgeGallery;