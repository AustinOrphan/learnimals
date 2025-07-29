/**
 * Character Gallery Component
 * 
 * Interactive gallery displaying all default characters with filtering,
 * searching, and real-time character interactions.
 */

import BaseComponent from '../BaseComponent.js';
import CharacterRenderer from './CharacterRenderer.js';
import { getAllDefaultCharacters, generateCharacterMessage } from '../../utils/characterIntegration.js';
import logger from '../../utils/logger.js';

class CharacterGallery extends BaseComponent {
  constructor(options = {}) {
    super({
      id: options.id || 'character-gallery',
      cssClasses: ['character-gallery', ...(options.cssClasses || [])],
      ...options
    });
    
    // Gallery state
    this.characters = getAllDefaultCharacters();
    this.filteredCharacters = [...this.characters];
    this.currentFilter = 'all';
    this.currentSort = 'name';
    this.searchQuery = '';
    this.selectedCharacter = null;
    
    // Character renderers
    this.renderers = new Map();
    
    // UI options
    this.showFilters = options.showFilters !== false;
    this.showSearch = options.showSearch !== false;
    this.showSpotlight = options.showSpotlight !== false;
    this.autoplayAnimations = options.autoplayAnimations !== false;
    
    // Event handlers
    this.onCharacterSelect = options.onCharacterSelect || null;
    this.onCharacterInteraction = options.onCharacterInteraction || null;
    
    // Memory management
    this.autoplayInterval = null;
    this.boundKeydownHandler = null;
  }
  
  generateHTML() {
    return `
      <div class="character-gallery ${this.options.cssClasses.join(' ')}" id="${this.options.id}">
        ${this.generateGalleryHeader()}
        ${this.showFilters || this.showSearch ? this.generateGalleryControls() : ''}
        ${this.generateGalleryGrid()}
        ${this.showSpotlight ? this.generateCharacterSpotlight() : ''}
      </div>
    `;
  }
  
  generateGalleryHeader() {
    return `
      <div class="gallery-header">
        <h2 class="gallery-title">Character Gallery</h2>
        <p class="gallery-description">
          Meet our amazing cast of learning companions! Click on any character to see their personality,
          hear their voice, and watch their animations in action.
        </p>
        <div class="gallery-stats">
          <span class="stat-item">
            <span class="stat-number">${this.characters.length}</span>
            <span class="stat-label">Characters</span>
          </span>
          <span class="stat-item">
            <span class="stat-number">${this.getSubjectCount()}</span>
            <span class="stat-label">Subjects</span>
          </span>
          <span class="stat-item">
            <span class="stat-number">${this.getSpeciesCount()}</span>
            <span class="stat-label">Species</span>
          </span>
        </div>
      </div>
    `;
  }
  
  generateGalleryControls() {
    return `
      <div class="gallery-controls">
        ${this.showSearch ? this.generateSearchControls() : ''}
        ${this.showFilters ? this.generateFilterControls() : ''}
        ${this.generateSortControls()}
      </div>
    `;
  }
  
  generateSearchControls() {
    return `
      <div class="search-controls">
        <div class="search-container">
          <input type="text" 
                 class="search-input" 
                 placeholder="Search characters, species, or subjects..."
                 value="${this.searchQuery}">
          <button class="search-clear" 
                  ${this.searchQuery ? '' : 'style="display: none;"'}>
            ×
          </button>
        </div>
      </div>
    `;
  }
  
  generateFilterControls() {
    const subjects = [...new Set(this.characters.map(c => c.personality?.favoriteSubject || 'general'))];
    const species = [...new Set(this.characters.map(c => c.species.primary))];
    
    return `
      <div class="filter-controls">
        <div class="filter-group">
          <label>Filter by Subject:</label>
          <select class="filter-select" data-filter-type="subject">
            <option value="all" ${this.currentFilter === 'all' ? 'selected' : ''}>All Subjects</option>
            ${subjects.map(subject => `
              <option value="${subject}" ${this.currentFilter === subject ? 'selected' : ''}>
                ${subject.charAt(0).toUpperCase() + subject.slice(1)}
              </option>
            `).join('')}
          </select>
        </div>
        
        <div class="filter-group">
          <label>Filter by Species:</label>
          <select class="filter-select" data-filter-type="species">
            <option value="all" ${this.currentFilter === 'all' ? 'selected' : ''}>All Species</option>
            ${species.map(s => `
              <option value="${s}" ${this.currentFilter === s ? 'selected' : ''}>
                ${s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            `).join('')}
          </select>
        </div>
        
        <div class="filter-chips">
          <button class="filter-chip ${this.currentFilter === 'all' ? 'active' : ''}"
                  data-filter-type="subject" data-filter-value="all">
            All
          </button>
          ${subjects.slice(0, 4).map(subject => `
            <button class="filter-chip ${this.currentFilter === subject ? 'active' : ''}"
                    data-filter-type="subject" data-filter-value="${subject}">
              ${this.getSubjectIcon(subject)} ${subject.charAt(0).toUpperCase() + subject.slice(1)}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  generateSortControls() {
    return `
      <div class="sort-controls">
        <label>Sort by:</label>
        <select class="sort-select">
          <option value="name" ${this.currentSort === 'name' ? 'selected' : ''}>Name</option>
          <option value="subject" ${this.currentSort === 'subject' ? 'selected' : ''}>Subject</option>
          <option value="species" ${this.currentSort === 'species' ? 'selected' : ''}>Species</option>
          <option value="enthusiasm" ${this.currentSort === 'enthusiasm' ? 'selected' : ''}>Enthusiasm</option>
          <option value="patience" ${this.currentSort === 'patience' ? 'selected' : ''}>Patience</option>
        </select>
      </div>
    `;
  }
  
  generateGalleryGrid() {
    return `
      <div class="gallery-grid" id="character-gallery-grid">
        ${this.filteredCharacters.map(character => this.generateCharacterCard(character)).join('')}
      </div>
      
      ${this.filteredCharacters.length === 0 ? this.generateEmptyState() : ''}
    `;
  }
  
  generateCharacterCard(character) {
    const subject = character.personality?.favoriteSubject || 'general';
    const topTraits = this.getTopTraits(character.personality.traits);
    
    return `
      <div class="character-card" 
           data-character-id="${character.id}"
           data-subject="${subject}"
           data-species="${character.species.primary}"
           role="button"
           tabindex="0"
           aria-label="Select ${character.name} the ${character.species.primary}">
        
        <div class="card-header">
          <div class="character-container" id="card-char-${character.id}">
            <!-- Character renderer will be inserted here -->
          </div>
          <div class="character-status" id="status-${character.id}">
            <span class="status-indicator"></span>
          </div>
        </div>
        
        <div class="card-content">
          <h3 class="character-name">${character.name}</h3>
          <div class="character-meta">
            <span class="character-species">
              ${this.getSpeciesIcon(character.species.primary)} ${character.species.primary}
            </span>
            <span class="character-subject">
              ${this.getSubjectIcon(subject)} ${subject}
            </span>
          </div>
          
          <div class="personality-preview">
            <div class="trait-bars">
              ${topTraits.map(([trait, value]) => `
                <div class="trait-bar">
                  <span class="trait-name">${trait}</span>
                  <div class="trait-progress">
                    <div class="trait-fill" style="width: ${value}%"></div>
                  </div>
                  <span class="trait-value">${value}</span>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="card-actions">
            <button class="interaction-btn" 
                    data-action="greet"
                    aria-label="Greet ${character.name}">
              <span class="btn-icon">👋</span>
              <span class="btn-text">Say Hi</span>
            </button>
            <button class="interaction-btn" 
                    data-action="celebrate"
                    aria-label="Celebrate with ${character.name}">
              <span class="btn-icon">🎉</span>
              <span class="btn-text">Celebrate</span>
            </button>
            <button class="interaction-btn" 
                    data-action="encourage"
                    aria-label="Get encouragement from ${character.name}">
              <span class="btn-icon">💪</span>
              <span class="btn-text">Encourage</span>
            </button>
          </div>
        </div>
        
        <div class="card-overlay">
          <div class="overlay-content">
            <div class="overlay-message" id="message-${character.id}">
              Click to learn more about ${character.name}!
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  generateCharacterSpotlight() {
    return `
      <div class="character-spotlight" id="character-spotlight">
        <div class="spotlight-content">
          <div class="spotlight-placeholder">
            <div class="placeholder-icon">🎭</div>
            <h3>Character Spotlight</h3>
            <p>Click on any character above to see detailed information, personality traits, and interactive features.</p>
          </div>
        </div>
      </div>
    `;
  }
  
  generateEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>No Characters Found</h3>
        <p>Try adjusting your search or filter criteria.</p>
        <button class="empty-action">
          Clear All Filters
        </button>
      </div>
    `;
  }
  
  // Event Handlers
  handleSearch(event) {
    this.searchQuery = event.target.value.toLowerCase();
    this.applyFilters();
    this.updateUI();
  }
  
  clearSearch() {
    this.searchQuery = '';
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      searchInput.value = '';
    }
    this.applyFilters();
    this.updateUI();
  }
  
  handleFilter(type, value) {
    this.currentFilter = value;
    this.applyFilters();
    this.updateUI();
  }
  
  handleSort(sortBy) {
    this.currentSort = sortBy;
    this.sortCharacters();
    this.updateUI();
  }
  
  selectCharacter(characterId) {
    const character = this.characters.find(c => c.id === characterId);
    if (!character) return;
    
    this.selectedCharacter = character;
    this.updateSpotlight(character);
    
    // Update card states
    document.querySelectorAll('.character-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.characterId === characterId);
    });
    
    // Callback
    if (this.onCharacterSelect) {
      this.onCharacterSelect(character);
    }
    
    // Emit event
    this.emit('character:selected', { character });
  }
  
  async triggerInteraction(characterId, action) {
    const character = this.characters.find(c => c.id === characterId);
    const renderer = this.renderers.get(characterId);
    
    if (!character || !renderer) return;
    
    // Update character animation
    const animationMap = {
      greet: 'waving',
      celebrate: 'celebrating',
      encourage: 'encouraging'
    };
    
    renderer.setAnimationState(animationMap[action] || 'happy');
    
    // Show message
    const message = generateCharacterMessage(character, action === 'greet' ? 'greeting' : action);
    this.showCharacterMessage(characterId, message);
    
    // Update status indicator
    this.updateCharacterStatus(characterId, action);
    
    // Callback
    if (this.onCharacterInteraction) {
      this.onCharacterInteraction(character, action, message);
    }
    
    // Emit event
    this.emit('character:interaction', { character, action, message });
    
    // Reset after delay
    import('../../../utils/AnimationManager.js').then(({ animationManager }) => {
      animationManager.delay(() => {
        renderer.setAnimationState('idle');
        this.clearCharacterMessage(characterId);
        this.updateCharacterStatus(characterId, 'idle');
      }, 3000);
    });
  }
  
  // Helper Methods
  applyFilters() {
    this.filteredCharacters = this.characters.filter(character => {
      // Search filter
      if (this.searchQuery) {
        const searchFields = [
          character.name.toLowerCase(),
          character.species.primary.toLowerCase(),
          character.personality?.favoriteSubject?.toLowerCase() || '',
          ...Object.keys(character.personality.traits)
        ];
        
        if (!searchFields.some(field => field.includes(this.searchQuery))) {
          return false;
        }
      }
      
      // Subject/Species filter
      if (this.currentFilter !== 'all') {
        const subject = character.personality?.favoriteSubject || 'general';
        const species = character.species.primary;
        
        if (this.currentFilter !== subject && this.currentFilter !== species) {
          return false;
        }
      }
      
      return true;
    });
    
    this.sortCharacters();
  }
  
  sortCharacters() {
    this.filteredCharacters.sort((a, b) => {
      switch (this.currentSort) {
      case 'name':
        return a.name.localeCompare(b.name);
        
      case 'subject': {
        const subjectA = a.personality?.favoriteSubject || 'general';
        const subjectB = b.personality?.favoriteSubject || 'general';
        return subjectA.localeCompare(subjectB);
      }
        
      case 'species':
        return a.species.primary.localeCompare(b.species.primary);
        
      case 'enthusiasm':
      case 'patience': {
        const valueA = a.personality.traits[this.currentSort] || 0;
        const valueB = b.personality.traits[this.currentSort] || 0;
        return valueB - valueA; // Descending order
      }
        
      default:
        return 0;
      }
    });
  }
  
  clearFilters() {
    this.searchQuery = '';
    this.currentFilter = 'all';
    this.applyFilters();
    this.updateUI();
  }
  
  getTopTraits(traits) {
    return Object.entries(traits)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
  }
  
  getSubjectCount() {
    return new Set(this.characters.map(c => c.personality?.favoriteSubject || 'general')).size;
  }
  
  getSpeciesCount() {
    return new Set(this.characters.map(c => c.species.primary)).size;
  }
  
  getSubjectIcon(subject) {
    const icons = {
      math: '🔢',
      science: '🔬',
      reading: '📚',
      art: '🎨',
      coding: '💻',
      music: '🎵',
      geography: '🌍',
      general: '📖'
    };
    return icons[subject] || icons.general;
  }
  
  getSpeciesIcon(species) {
    const icons = {
      cat: '🐱',
      dog: '🐕',
      panda: '🐼',
      shark: '🦈',
      parrot: '🦜',
      lion: '🦁',
      owl: '🦉',
      dolphin: '🐬'
    };
    return icons[species] || '🐾';
  }
  
  showCharacterMessage(characterId, message) {
    const messageElement = document.getElementById(`message-${characterId}`);
    if (messageElement) {
      messageElement.textContent = message;
      messageElement.parentElement.parentElement.classList.add('show-message');
    }
  }
  
  clearCharacterMessage(characterId) {
    const messageElement = document.getElementById(`message-${characterId}`);
    if (messageElement) {
      messageElement.parentElement.parentElement.classList.remove('show-message');
    }
  }
  
  updateCharacterStatus(characterId, status) {
    const statusElement = document.getElementById(`status-${characterId}`);
    if (statusElement) {
      statusElement.className = `character-status ${status}`;
    }
  }
  
  updateSpotlight(character) {
    const spotlight = document.getElementById('character-spotlight');
    if (!spotlight) return;
    
    const topTraits = this.getTopTraits(character.personality.traits);
    const subject = character.personality?.favoriteSubject || 'general';
    
    spotlight.innerHTML = `
      <div class="spotlight-content">
        <div class="spotlight-header">
          <div class="spotlight-character" id="spotlight-char-${character.id}">
            <!-- Large character renderer -->
          </div>
          <div class="spotlight-info">
            <h3>${character.name}</h3>
            <div class="spotlight-meta">
              <span class="spotlight-species">
                ${this.getSpeciesIcon(character.species.primary)} ${character.species.primary}
              </span>
              <span class="spotlight-subject">
                ${this.getSubjectIcon(subject)} ${subject} Teacher
              </span>
            </div>
          </div>
        </div>
        
        <div class="spotlight-details">
          <div class="personality-details">
            <h4>Personality Traits</h4>
            <div class="trait-list">
              ${topTraits.map(([trait, value]) => `
                <div class="trait-item">
                  <span class="trait-label">${trait.charAt(0).toUpperCase() + trait.slice(1)}</span>
                  <div class="trait-bar-large">
                    <div class="trait-fill" style="width: ${value}%"></div>
                  </div>
                  <span class="trait-value">${value}%</span>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="spotlight-actions">
            <button class="spotlight-btn primary" data-action="greet" data-character-id="${character.id}">
              <span class="btn-icon">👋</span> Meet ${character.name}
            </button>
            <button class="spotlight-btn secondary" data-action="voice" data-character-id="${character.id}">
              <span class="btn-icon">🔊</span> Hear Voice
            </button>
            <button class="spotlight-btn secondary" data-action="learn" data-character-id="${character.id}">
              <span class="btn-icon">ℹ️</span> Learn More
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Initialize large character renderer
    this.initializeSpotlightRenderer(character);
  }
  
  async initializeSpotlightRenderer(character) {
    const container = document.getElementById(`spotlight-char-${character.id}`);
    if (!container) return;
    
    const renderer = new CharacterRenderer({
      character: character,
      size: 250,
      interactive: true,
      animated: true,
      container: container
    });
    
    await renderer.render();
    this.renderers.set(`spotlight-${character.id}`, renderer);
  }
  
  hearCharacterVoice(characterId) {
    const character = this.characters.find(c => c.id === characterId);
    if (!character) return;
    
    const message = generateCharacterMessage(character, 'greeting');
    
    if ('speechSynthesis' in window) {
      const utterance = new window.SpeechSynthesisUtterance(message);
      const voice = character.personality.voice || {};
      
      utterance.pitch = voice.pitch || 1;
      utterance.rate = voice.speed || 1;
      utterance.volume = 1;
      
      window.speechSynthesis.speak(utterance);
    }
  }
  
  learnMoreAbout(characterId) {
    // TODO: Open detailed character information modal
    logger.info(`Learn more about character: ${characterId}`);
  }
  
  // Lifecycle Methods
  async afterRender() {
    await super.afterRender();
    this.bindEvents();
    await this.initializeCharacterRenderers();
    
    if (this.autoplayAnimations) {
      this.startAutoplayAnimations();
    }
  }
  
  bindEvents() {
    // Bind this context to methods
    this.handleSearch = this.handleSearch.bind(this);
    this.clearSearch = this.clearSearch.bind(this);
    this.handleFilter = this.handleFilter.bind(this);
    this.handleSort = this.handleSort.bind(this);
    this.selectCharacter = this.selectCharacter.bind(this);
    this.triggerInteraction = this.triggerInteraction.bind(this);
    this.clearFilters = this.clearFilters.bind(this);
    this.hearCharacterVoice = this.hearCharacterVoice.bind(this);
    this.learnMoreAbout = this.learnMoreAbout.bind(this);
    
    // Event delegation for all click events
    this.handleDelegatedClick = this.handleDelegatedClick.bind(this);
    this.element.addEventListener('click', this.handleDelegatedClick);
    
    // Event delegation for input events  
    this.handleDelegatedInput = this.handleDelegatedInput.bind(this);
    this.element.addEventListener('input', this.handleDelegatedInput);
    
    // Event delegation for change events
    this.handleDelegatedChange = this.handleDelegatedChange.bind(this);
    this.element.addEventListener('change', this.handleDelegatedChange);
    
    // Keyboard navigation - store bound handler for cleanup
    this.boundKeydownHandler = (e) => {
      if (e.key === 'Escape') {
        this.selectedCharacter = null;
        document.querySelectorAll('.character-card').forEach(card => {
          card.classList.remove('selected');
        });
      }
    };
    document.addEventListener('keydown', this.boundKeydownHandler);
  }
  
  async initializeCharacterRenderers() {
    const promises = this.filteredCharacters.map(async (character) => {
      const container = document.getElementById(`card-char-${character.id}`);
      if (container) {
        const renderer = new CharacterRenderer({
          character: character,
          size: 120,
          interactive: true,
          animated: true,
          container: container
        });
        
        await renderer.render();
        this.renderers.set(character.id, renderer);
      }
    });
    
    await Promise.all(promises);
  }
  
  startAutoplayAnimations() {
    // Clear any existing interval
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
    }
    
    this.autoplayInterval = setInterval(() => {
      const visibleCards = Array.from(document.querySelectorAll('.character-card'))
        .filter(card => this.isElementVisible(card));
      
      if (visibleCards.length > 0) {
        const randomCard = visibleCards[Math.floor(Math.random() * visibleCards.length)];
        const characterId = randomCard.dataset.characterId;
        const renderer = this.renderers.get(characterId);
        
        if (renderer) {
          const animations = ['happy', 'thinking', 'waving'];
          const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
          
          renderer.setAnimationState(randomAnimation);
          
          // Reset animation after delay
          setTimeout(() => {
            renderer.setAnimationState('idle');
          }, 2000);
        }
      }
    }, 5000);
  }
  
  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }
  
  updateUI() {
    const gridElement = document.getElementById('character-gallery-grid');
    if (gridElement) {
      gridElement.innerHTML = this.filteredCharacters.map(character => 
        this.generateCharacterCard(character)
      ).join('') + (this.filteredCharacters.length === 0 ? this.generateEmptyState() : '');
      
      // Re-initialize renderers for new cards
      this.initializeCharacterRenderers();
    }
    
    // Update search clear button
    const clearButton = document.querySelector('.search-clear');
    if (clearButton) {
      clearButton.style.display = this.searchQuery ? 'block' : 'none';
    }
    
    // Update filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
      const filterValue = chip.dataset.filterValue;
      const isActive = filterValue === this.currentFilter || (filterValue === 'all' && this.currentFilter === 'all');
      chip.classList.toggle('active', isActive);
    });
  }
  
  // Event delegation handlers
  handleDelegatedClick(event) {
    const target = event.target;
    const characterCard = target.closest('.character-card');
    const actionBtn = target.closest('[data-action]');
    
    // Handle character card selection
    if (characterCard && !actionBtn) {
      const characterId = characterCard.dataset.characterId;
      if (characterId) {
        this.selectCharacter(characterId);
      }
      return;
    }
    
    // Handle interaction buttons
    if (actionBtn) {
      event.stopPropagation();
      const action = actionBtn.dataset.action;
      
      // Get characterId from multiple sources for robustness
      const characterId = actionBtn.dataset.characterId || // Direct on button (spotlight buttons)
                          characterCard?.dataset.characterId; // From parent card (card buttons)
      
      if (characterId && action) {
        // Handle different action types
        if (action === 'greet' || action === 'celebrate' || action === 'encourage') {
          this.triggerInteraction(characterId, action);
        } else if (action === 'voice') {
          this.hearCharacterVoice(characterId);
        } else if (action === 'learn') {
          this.learnMoreAbout(characterId);
        }
      }
      return;
    }
    
    // Handle search clear button
    if (target.classList.contains('search-clear')) {
      this.clearSearch();
      return;
    }
    
    // Handle filter chips
    if (target.classList.contains('filter-chip')) {
      const filterType = target.dataset.filterType || 'subject';
      const filterValue = target.dataset.filterValue || 'all';
      this.handleFilter(filterType, filterValue);
      return;
    }
    
    // Handle clear filters button
    if (target.classList.contains('empty-action')) {
      this.clearFilters();
      return;
    }
    
    // Handle spotlight buttons (legacy support)
    if (target.classList.contains('spotlight-btn')) {
      const action = target.dataset.action;
      const characterId = target.dataset.characterId;
      if (action === 'greet' && characterId) {
        this.triggerInteraction(characterId, 'greet');
      } else if (action === 'voice' && characterId) {
        this.hearCharacterVoice(characterId);
      } else if (action === 'learn' && characterId) {
        this.learnMoreAbout(characterId);
      }
      return;
    }
  }
  
  handleDelegatedInput(event) {
    const target = event.target;
    
    // Handle search input
    if (target.classList.contains('search-input')) {
      this.handleSearch(event);
      return;
    }
  }
  
  handleDelegatedChange(event) {
    const target = event.target;
    
    // Handle filter selects
    if (target.classList.contains('filter-select')) {
      const filterType = target.dataset.filterType || 'subject';
      this.handleFilter(filterType, target.value);
      return;
    }
    
    // Handle sort select
    if (target.classList.contains('sort-select')) {
      this.handleSort(target.value);
      return;
    }
  }
  
  destroy() {
    // Clean up event listeners
    if (this.element) {
      this.element.removeEventListener('click', this.handleDelegatedClick);
      this.element.removeEventListener('input', this.handleDelegatedInput);
      this.element.removeEventListener('change', this.handleDelegatedChange);
    }
    
    // Clean up document event listener
    if (this.boundKeydownHandler) {
      document.removeEventListener('keydown', this.boundKeydownHandler);
      this.boundKeydownHandler = null;
    }
    
    // Clean up autoplay interval
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
    
    // Clean up renderers
    this.renderers.forEach(renderer => {
      renderer.destroy();
    });
    this.renderers.clear();
    
    super.destroy();
  }
}

export default CharacterGallery;