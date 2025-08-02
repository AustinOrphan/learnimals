/**
 * CharacterGallery - Interactive gallery displaying all default characters
 *
 * Features:
 * - Grid view with filtering, search, and sorting
 * - Character interactions (greet, celebrate, encourage)
 * - Real-time speech with character voice settings
 * - Character spotlight with detailed information
 * - Performance monitoring for rendering speeds
 * - Mobile responsive design
 *
 * Part of Phase C: Character Demo & Showcase (Issue #253)
 */

/* global BaseComponent */
// CharacterGallery class extends globally available BaseComponent
class CharacterGallery extends BaseComponent {
  constructor(options = {}) {
    super({
      tagName: 'div',
      className: 'character-gallery',
      attributes: {
        role: 'region',
        'aria-label': 'Character Gallery',
        'data-component': 'character-gallery',
      },
      ...options,
    });

    // Configuration
    this.characters = options.characters || this.getDefaultCharacters();
    this.filteredCharacters = [...this.characters];
    this.currentFilter = 'all';
    this.currentSort = 'name';
    this.searchTerm = '';
    this.currentSpotlight = null;
    this.gridLayout = options.gridLayout || 'cards'; // 'cards' | 'list' | 'compact'

    // Performance monitoring
    this.performanceMetrics = {
      renderStartTime: 0,
      renderEndTime: 0,
      frameCount: 0,
      memoryUsage: 0,
    };

    // Speech synthesis
    this.speechSynthesis = window.speechSynthesis;
    this.currentVoice = null;

    // Event handlers
    this.boundHandlers = {
      search: this.handleSearch.bind(this),
      filter: this.handleFilter.bind(this),
      sort: this.handleSort.bind(this),
      characterClick: this.handleCharacterClick.bind(this),
      characterInteraction: this.handleCharacterInteraction.bind(this),
      keyboardNavigation: this.handleKeyboardNavigation.bind(this),
      resize: this.handleResize.bind(this),
    };

    this.onCharacterSelect = options.onCharacterSelect || null;
    this.onCharacterInteraction = options.onCharacterInteraction || null;

    // Memory management
    this.autoplayInterval = null;
    this.boundKeydownHandler = null;

    this.init();
  }

  /**
   * Initialize the gallery
   */
  init() {
    this.loadVoices();

    // Set up resize observer for responsive behavior
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(this.boundHandlers.resize);
    }
  }

  /**
   * Generate the gallery HTML structure
   */
  generateHTML() {
    return `
    <div id="${this.options.id}" class="character-gallery" role="region" aria-label="Character Gallery" data-component="character-gallery">
      <div class="gallery-header">
        <div class="gallery-title">
          <h1>Character Gallery</h1>
          <p class="gallery-subtitle">Meet your learning companions</p>
        </div>
        
        <div class="gallery-controls">
          <div class="search-container">
            <input 
              type="text" 
              class="search-input" 
              placeholder="Search characters..."
              aria-label="Search characters"
              autocomplete="off"
            >
            <button class="search-clear" aria-label="Clear search" style="display: none;">
              <span aria-hidden="true">×</span>
            </button>
          </div>
          
          <div class="filter-controls">
            <select class="filter-select" aria-label="Filter by subject">
              <option value="all">All Subjects</option>
              <option value="math">Math</option>
              <option value="reading">Reading</option>
              <option value="science">Science</option>
              <option value="art">Art</option>
              <option value="coding">Coding</option>
            </select>
          </div>
          
          <div class="sort-controls">
            <select class="sort-select" aria-label="Sort characters">
              <option value="name">Sort by Name</option>
              <option value="subject">Sort by Subject</option>
              <option value="popularity">Sort by Popularity</option>
            </select>
          </div>
          
          <div class="layout-controls">
            <button class="layout-btn layout-cards active" data-layout="cards" aria-label="Card view">
              <span aria-hidden="true">⊞</span>
            </button>
            <button class="layout-btn layout-list" data-layout="list" aria-label="List view">
              <span aria-hidden="true">☰</span>
            </button>
            <button class="layout-btn layout-compact" data-layout="compact" aria-label="Compact view">
              <span aria-hidden="true">⊡</span>
            </button>
          </div>
        </div>
      </div>

      <div class="gallery-content">
        <div class="characters-grid" role="grid" aria-label="Character gallery grid">
          <!-- Characters will be rendered here -->
        </div>
        
        <div class="character-spotlight" style="display: none;" role="dialog" aria-modal="true" aria-labelledby="spotlight-title">
          <div class="spotlight-backdrop"></div>
          <div class="spotlight-content">
            <div class="spotlight-header">
              <h2 id="spotlight-title">Character Details</h2>
              <button class="spotlight-close" aria-label="Close character details">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            
            <div class="spotlight-body">
              <div class="spotlight-character">
                <div class="character-preview">
                  <!-- Character SVG will be rendered here -->
                </div>
                <div class="character-info">
                  <h3 class="character-name"></h3>
                  <p class="character-subject"></p>
                  <p class="character-description"></p>
                </div>
              </div>
              
              <div class="spotlight-interactions">
                <h4>Try Interactions</h4>
                <div class="interaction-buttons">
                  <button class="interaction-btn greet-btn" data-interaction="greet">
                    <span class="btn-icon">👋</span>
                    <span class="btn-text">Greet</span>
                  </button>
                  <button class="interaction-btn celebrate-btn" data-interaction="celebrate">
                    <span class="btn-icon">🎉</span>
                    <span class="btn-text">Celebrate</span>
                  </button>
                  <button class="interaction-btn encourage-btn" data-interaction="encourage">
                    <span class="btn-icon">💪</span>
                    <span class="btn-text">Encourage</span>
                  </button>
                </div>
              </div>
              
              <div class="spotlight-stats">
                <h4>Character Stats</h4>
                <div class="stats-grid">
                  <div class="stat-item">
                    <span class="stat-label">Subject</span>
                    <span class="stat-value character-subject-stat"></span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Personality</span>
                    <span class="stat-value character-personality"></span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Voice Type</span>
                    <span class="stat-value character-voice"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="gallery-footer">
        <div class="performance-display">
          <span class="perf-item">
            <span class="perf-label">Render Time:</span>
            <span class="perf-value render-time">0ms</span>
          </span>
          <span class="perf-item">
            <span class="perf-label">Characters:</span>
            <span class="perf-value character-count">0</span>
          </span>
          <span class="perf-item">
            <span class="perf-label">Memory:</span>
            <span class="perf-value memory-usage">0MB</span>
          </span>
        </div>
      </div>
    </div>
    `;
  }

  /**
   * Attach event listeners after rendering
   */
  attachEventListeners() {
    super.attachEventListeners();

    if (!this.element) return;

    // Search functionality
    const searchInput = this.element.querySelector('.search-input');
    const searchClear = this.element.querySelector('.search-clear');

    if (searchInput) {
      searchInput.addEventListener('input', this.boundHandlers.search);
      searchInput.addEventListener('keydown', this.boundHandlers.keyboardNavigation);
    }

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        this.handleSearch();
      });
    }

    // Filter and sort controls
    const filterSelect = this.element.querySelector('.filter-select');
    const sortSelect = this.element.querySelector('.sort-select');

    if (filterSelect) {
      filterSelect.addEventListener('change', this.boundHandlers.filter);
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', this.boundHandlers.sort);
    }

    // Layout controls
    const layoutButtons = this.element.querySelectorAll('.layout-btn');
    layoutButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        const layout = e.currentTarget.dataset.layout;
        this.setGridLayout(layout);
      });
    });

    // Character grid interactions
    const charactersGrid = this.element.querySelector('.characters-grid');
    if (charactersGrid) {
      charactersGrid.addEventListener('click', this.boundHandlers.characterClick);
      charactersGrid.addEventListener('keydown', this.boundHandlers.keyboardNavigation);
    }

    // Spotlight controls
    const spotlightClose = this.element.querySelector('.spotlight-close');
    const spotlightBackdrop = this.element.querySelector('.spotlight-backdrop');

    if (spotlightClose) {
      spotlightClose.addEventListener('click', () => this.closeSpotlight());
    }

    if (spotlightBackdrop) {
      spotlightBackdrop.addEventListener('click', () => this.closeSpotlight());
    }

    // Interaction buttons in spotlight
    const interactionButtons = this.element.querySelectorAll('.interaction-btn');
    interactionButtons.forEach(btn => {
      btn.addEventListener('click', this.boundHandlers.characterInteraction);
    });

    // Set up resize observer
    if (this.resizeObserver && this.element) {
      this.resizeObserver.observe(this.element);
    }

    // Initial render of characters
    this.renderCharacters();
  }

  /**
   * Handle search input
   */
  handleSearch(_event) {
    const searchInput = this.element.querySelector('.search-input');
    const searchClear = this.element.querySelector('.search-clear');

    if (searchInput) {
      this.searchTerm = searchInput.value.toLowerCase().trim();

      // Show/hide clear button
      if (searchClear) {
        searchClear.style.display = this.searchTerm ? 'block' : 'none';
      }

      this.filterAndRenderCharacters();
    }
  }

  /**
   * Handle filter selection
   */
  handleFilter(event) {
    this.currentFilter = event.target.value;
    this.filterAndRenderCharacters();
  }

  /**
   * Handle sort selection
   */
  handleSort(event) {
    this.currentSort = event.target.value;
    this.filterAndRenderCharacters();
  }

  /**
   * Handle character card clicks
   */
  handleCharacterClick(event) {
    const characterCard = event.target.closest('.character-card');
    if (!characterCard) return;

    const characterId = characterCard.dataset.characterId;
    if (characterId) {
      const character = this.characters.find(c => c.id === characterId);
      if (character) {
        this.openSpotlight(character);
      }
    }
  }

  /**
   * Handle character interactions (greet, celebrate, encourage)
   */
  handleCharacterInteraction(event) {
    const button = event.target.closest('.interaction-btn');
    if (!button) return;

    const interaction = button.dataset.interaction;
    if (this.currentSpotlight && interaction) {
      this.performCharacterInteraction(this.currentSpotlight, interaction);
    }
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyboardNavigation(event) {
    if (event.key === 'Escape' && this.currentSpotlight) {
      this.closeSpotlight();
    }

    // Grid navigation with arrow keys
    if (event.target.closest('.characters-grid')) {
      this.handleGridKeyboardNavigation(event);
    }
  }

  /**
   * Handle grid keyboard navigation
   */
  handleGridKeyboardNavigation(event) {
    const cards = Array.from(this.element.querySelectorAll('.character-card'));
    const currentIndex = cards.findIndex(card => card === document.activeElement);

    let nextIndex = currentIndex;
    const columns = this.getGridColumns();

    switch (event.key) {
      case 'ArrowRight':
        nextIndex = Math.min(currentIndex + 1, cards.length - 1);
        break;
      case 'ArrowLeft':
        nextIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'ArrowDown':
        nextIndex = Math.min(currentIndex + columns, cards.length - 1);
        break;
      case 'ArrowUp':
        nextIndex = Math.max(currentIndex - columns, 0);
        break;
      case 'Enter':
      case ' ':
        if (currentIndex >= 0) {
          cards[currentIndex].click();
          event.preventDefault();
        }
        return;
      default:
        return;
    }

    if (nextIndex !== currentIndex && cards[nextIndex]) {
      cards[nextIndex].focus();
      event.preventDefault();
    }
  }

  /**
   * Handle resize events
   */
  handleResize() {
    // Debounce resize handling
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      this.updateGridLayout();
      this.updatePerformanceMetrics();
    }, 150);
  }

  /**
   * Filter and render characters based on current criteria
   */
  filterAndRenderCharacters() {
    this.performanceMetrics.renderStartTime = performance.now();

    // Filter by subject
    let filtered = this.characters;
    if (this.currentFilter !== 'all') {
      filtered = filtered.filter(
        character => character.subject.toLowerCase() === this.currentFilter.toLowerCase()
      );
    }

    // Filter by search term
    if (this.searchTerm) {
      filtered = filtered.filter(
        character =>
          character.name.toLowerCase().includes(this.searchTerm) ||
          character.subject.toLowerCase().includes(this.searchTerm) ||
          character.description.toLowerCase().includes(this.searchTerm) ||
          character.personality.toLowerCase().includes(this.searchTerm)
      );
    }

    // Sort characters
    filtered.sort((a, b) => {
      switch (this.currentSort) {
        case 'name':
          return a.name.localeCompare(b.name);

        case 'subject':
          return a.subject.localeCompare(b.subject) || a.name.localeCompare(b.name);

        case 'popularity':
          return (b.popularity || 0) - (a.popularity || 0);

        default:
          return a.name.localeCompare(b.name);
      }
    });

    this.filteredCharacters = filtered;
    this.renderCharacters();
  }

  /**
   * Render the character grid
   */
  renderCharacters() {
    const grid = this.element.querySelector('.characters-grid');
    if (!grid) return;

    // Clear existing content
    grid.innerHTML = '';

    if (this.filteredCharacters.length === 0) {
      grid.innerHTML = `
        <div class="no-characters">
          <div class="no-characters-icon">🔍</div>
          <h3>No characters found</h3>
          <p>Try adjusting your search or filter criteria.</p>
        </div>
      `;
      this.updatePerformanceMetrics();
      return;
    }

    // Render character cards
    const fragment = document.createDocumentFragment();

    this.filteredCharacters.forEach((character, index) => {
      const card = this.createCharacterCard(character, index);
      fragment.appendChild(card);
    });

    grid.appendChild(fragment);

    // Update grid layout class
    grid.className = `characters-grid layout-${this.gridLayout}`;

    this.updatePerformanceMetrics();
    this.updateCharacterCount();
  }

  /**
   * Create a character card element
   */
  createCharacterCard(character, _index) {
    const card = document.createElement('div');
    card.className = 'character-card';
    card.dataset.characterId = character.id;
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'gridcell');
    card.setAttribute('aria-label', `${character.name}, ${character.subject} character`);

    card.innerHTML = `
      <div class="card-header">
        <div class="character-avatar">
          ${this.renderCharacterSVG(character, 'small')}
        </div>
        <div class="character-badge subject-${character.subject.toLowerCase()}">
          ${character.subject}
        </div>
      </div>
      
      <div class="card-body">
        <h3 class="character-name">${character.name}</h3>
        <p class="character-description">${character.description}</p>
        
        <div class="character-traits">
          <span class="trait-tag">${character.personality}</span>
          ${
            character.specialties
              ? character.specialties
                  .map(specialty => `<span class="specialty-tag">${specialty}</span>`)
                  .join('')
              : ''
          }
        </div>
      </div>
      
      <div class="card-footer">
        <div class="quick-interactions">
          <button class="quick-btn greet-quick" data-interaction="greet" aria-label="Greet ${character.name}">
            <span aria-hidden="true">👋</span>
          </button>
          <button class="quick-btn celebrate-quick" data-interaction="celebrate" aria-label="Celebrate with ${character.name}">
            <span aria-hidden="true">🎉</span>
          </button>
          <button class="quick-btn encourage-quick" data-interaction="encourage" aria-label="Encourage ${character.name}">
            <span aria-hidden="true">💪</span>
          </button>
        </div>
        
        <div class="card-actions">
          <button class="view-details-btn" aria-label="View ${character.name} details">
            View Details
          </button>
        </div>
      </div>
    `;

    // Add quick interaction listeners
    const quickButtons = card.querySelectorAll('.quick-btn');
    quickButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const interaction = btn.dataset.interaction;
        this.performCharacterInteraction(character, interaction);
      });
    });

    return card;
  }

  /**
   * Render character SVG (placeholder - would integrate with actual character renderer)
   */
  renderCharacterSVG(character, size = 'medium') {
    const dimensions = {
      small: { width: 60, height: 60 },
      medium: { width: 120, height: 120 },
      large: { width: 200, height: 200 },
    };

    const { width, height } = dimensions[size];

    // Placeholder SVG - in real implementation this would use CharacterRenderer
    return `
      <svg width="${width}" height="${height}" viewBox="0 0 100 100" class="character-svg">
        <circle cx="50" cy="50" r="45" fill="${character.primaryColor || '#4A90E2'}" stroke="#333" stroke-width="2"/>
        <circle cx="35" cy="40" r="5" fill="#333"/>
        <circle cx="65" cy="40" r="5" fill="#333"/>
        <path d="M 30 65 Q 50 80 70 65" stroke="#333" stroke-width="3" fill="none" stroke-linecap="round"/>
        <text x="50" y="90" text-anchor="middle" font-size="8" fill="#333">${character.name}</text>
      </svg>
    `;
  }

  /**
   * Open character spotlight
   */
  openSpotlight(character) {
    this.currentSpotlight = character;
    const spotlight = this.element.querySelector('.character-spotlight');

    if (!spotlight) return;

    // Update spotlight content
    const title = spotlight.querySelector('#spotlight-title');
    const name = spotlight.querySelector('.character-name');
    const subject = spotlight.querySelector('.character-subject');
    const description = spotlight.querySelector('.character-description');
    const preview = spotlight.querySelector('.character-preview');
    const subjectStat = spotlight.querySelector('.character-subject-stat');
    const personality = spotlight.querySelector('.character-personality');
    const voice = spotlight.querySelector('.character-voice');

    if (title) title.textContent = `${character.name} - Character Details`;
    if (name) name.textContent = character.name;
    if (subject) subject.textContent = character.subject;
    if (description) description.textContent = character.description;
    if (subjectStat) subjectStat.textContent = character.subject;
    if (personality) personality.textContent = character.personality;
    if (voice) voice.textContent = character.voiceType || 'Default';

    if (preview) {
      preview.innerHTML = this.renderCharacterSVG(character, 'large');
    }

    // Show spotlight
    spotlight.style.display = 'block';

    // Focus management
    setTimeout(() => {
      const closeButton = spotlight.querySelector('.spotlight-close');
      if (closeButton) closeButton.focus();
    }, 100);

    // Emit event
    this.emit('character:spotlight:opened', { character });
  }

  /**
   * Close character spotlight
   */
  closeSpotlight() {
    const spotlight = this.element.querySelector('.character-spotlight');
    if (spotlight) {
      spotlight.style.display = 'none';
    }

    this.currentSpotlight = null;

    // Return focus to grid
    const grid = this.element.querySelector('.characters-grid');
    if (grid) {
      const firstCard = grid.querySelector('.character-card');
      if (firstCard) firstCard.focus();
    }

    // Emit event
    this.emit('character:spotlight:closed');
  }

  /**
   * Perform character interaction with animation and speech
   */
  performCharacterInteraction(character, interaction) {
    const messages = {
      greet: [
        `Hi there! I'm ${character.name}, ready to help with ${character.subject}!`,
        `Hello! Let's explore ${character.subject} together!`,
        `Hey! I'm excited to learn ${character.subject} with you!`,
      ],
      celebrate: [
        "Fantastic work! You're doing amazing!",
        "Woohoo! That's excellent progress!",
        'Amazing! Keep up the great work!',
      ],
      encourage: [
        "You've got this! Don't give up!",
        "Believe in yourself! You're capable of great things!",
        'Every challenge is a chance to grow stronger!',
      ],
    };

    const messageList = messages[interaction] || messages.greet;
    const message = messageList[Math.floor(Math.random() * messageList.length)];

    // Visual feedback
    this.animateCharacterInteraction(character, interaction);

    // Speech synthesis
    this.speakMessage(message, character.voiceType);

    // Emit event
    this.emit('character:interaction', {
      character,
      interaction,
      message,
      timestamp: Date.now(),
    });
  }

  /**
   * Animate character interaction
   */
  animateCharacterInteraction(character, interaction) {
    // Find character elements to animate
    const cardElement = this.element.querySelector(`[data-character-id="${character.id}"]`);
    const spotlightElement = this.element.querySelector('.character-preview');

    const elements = [cardElement, spotlightElement].filter(Boolean);

    elements.forEach(element => {
      // Remove existing animation classes
      element.classList.remove('animate-greet', 'animate-celebrate', 'animate-encourage');

      // Add interaction-specific animation
      element.classList.add(`animate-${interaction}`);

      // Remove animation class after animation completes
      setTimeout(() => {
        element.classList.remove(`animate-${interaction}`);
      }, 1000);
    });
  }

  /**
   * Speak message using Web Speech API
   */
  speakMessage(message, voiceType = 'default') {
    if (!this.speechSynthesis) return;

    // Cancel any ongoing speech
    this.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message);

    // Configure voice based on character
    if (this.currentVoice) {
      utterance.voice = this.currentVoice;
    }

    utterance.rate = 0.9;
    utterance.pitch = voiceType === 'child' ? 1.2 : 1.0;
    utterance.volume = 0.8;

    this.speechSynthesis.speak(utterance);
  }

  /**
   * Load available voices for speech synthesis
   */
  loadVoices() {
    if (!this.speechSynthesis) return;

    const voices = this.speechSynthesis.getVoices();

    // Prefer child-friendly or female voices
    this.currentVoice =
      voices.find(
        voice =>
          voice.name.toLowerCase().includes('child') ||
          voice.name.toLowerCase().includes('female') ||
          voice.name.toLowerCase().includes('karen') ||
          voice.name.toLowerCase().includes('samantha')
      ) || voices[0];

    // Reload voices when they become available
    if (voices.length === 0) {
      this.speechSynthesis.addEventListener('voiceschanged', () => {
        this.loadVoices();
      });
    }
  }

  /**
   * Set grid layout
   */
  setGridLayout(layout) {
    if (!['cards', 'list', 'compact'].includes(layout)) return;

    this.gridLayout = layout;

    // Update layout buttons
    const layoutButtons = this.element.querySelectorAll('.layout-btn');
    layoutButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.layout === layout);
    });

    // Update grid class
    const grid = this.element.querySelector('.characters-grid');
    if (grid) {
      grid.className = `characters-grid layout-${layout}`;
    }

    // Emit event
    this.emit('layout:changed', { layout });
  }

  /**
   * Get number of grid columns for keyboard navigation
   */
  getGridColumns() {
    const grid = this.element.querySelector('.characters-grid');
    if (!grid) return 1;

    const firstCard = grid.querySelector('.character-card');
    if (!firstCard) return 1;

    const gridRect = grid.getBoundingClientRect();
    const cardRect = firstCard.getBoundingClientRect();

    return Math.floor(gridRect.width / cardRect.width) || 1;
  }

  /**
   * Update grid layout responsively
   */
  updateGridLayout() {
    const grid = this.element.querySelector('.characters-grid');
    if (!grid) return;

    const containerWidth = grid.getBoundingClientRect().width;

    // Adjust grid based on container width
    if (containerWidth < 600) {
      grid.style.setProperty('--grid-columns', '1');
    } else if (containerWidth < 900) {
      grid.style.setProperty('--grid-columns', '2');
    } else if (containerWidth < 1200) {
      grid.style.setProperty('--grid-columns', '3');
    } else {
      grid.style.setProperty('--grid-columns', '4');
    }
  }

  /**
   * Start performance monitoring
   */
  startPerformanceMonitoring() {
    this.performanceMetrics.renderStartTime = performance.now();

    // Monitor memory usage if available
    if ('memory' in performance) {
      this.updateMemoryUsage();
      setInterval(() => this.updateMemoryUsage(), 5000);
    }

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
    this.boundKeydownHandler = e => {
      if (e.key === 'Escape') {
        this.selectedCharacter = null;
        document.querySelectorAll('.character-card').forEach(card => {
          card.classList.remove('selected');
        });
      }
    };
    document.addEventListener('keydown', this.boundKeydownHandler);
  }

  /**
   * Update performance metrics display
   */
  updatePerformanceMetrics() {
    this.performanceMetrics.renderEndTime = performance.now();
    const renderTime =
      this.performanceMetrics.renderEndTime - this.performanceMetrics.renderStartTime;

    const renderTimeDisplay = this.element.querySelector('.render-time');
    if (renderTimeDisplay) {
      renderTimeDisplay.textContent = `${Math.round(renderTime)}ms`;
    }
  }

  /**
   * Update character count display
   */
  updateCharacterCount() {
    const countDisplay = this.element.querySelector('.character-count');
    if (countDisplay) {
      countDisplay.textContent = `${this.filteredCharacters.length}/${this.characters.length}`;
    }
  }

  /**
   * Update memory usage display
   */
  updateMemoryUsage() {
    if ('memory' in performance) {
      const memoryInfo = performance.memory;
      const usedMB = Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024);

      // Safety check: ensure element exists before querying
      if (this.element) {
        const memoryDisplay = this.element.querySelector('.memory-usage');
        if (memoryDisplay) {
          memoryDisplay.textContent = `${usedMB}MB`;
        }
      }

      this.performanceMetrics.memoryUsage = usedMB;
    }
  }

  /**
   * Start autoplay animations for characters
   */
  startAutoplayAnimations() {
    // Clear any existing interval
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
    }

    this.autoplayInterval = setInterval(() => {
      const visibleCards = Array.from(document.querySelectorAll('.character-card')).filter(card =>
        this.isElementVisible(card)
      );

      if (visibleCards.length > 0) {
        const randomCard = visibleCards[Math.floor(Math.random() * visibleCards.length)];
        const characterId = randomCard.dataset.characterId;

        if (characterId) {
          const animations = ['happy', 'thinking', 'waving'];
          const randomAnimation = animations[Math.floor(Math.random() * animations.length)];

          // Add animation class for visual feedback
          randomCard.classList.add(`animate-${randomAnimation}`);

          // Reset animation after delay
          setTimeout(() => {
            randomCard.classList.remove(`animate-${randomAnimation}`);
          }, 2000);
        }
      }
    }, 5000);
  }

  /**
   * Check if element is visible in viewport
   */
  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  /**
   * Get default character data
   */
  getDefaultCharacters() {
    return [
      {
        id: 'ruby-reading',
        name: 'Ruby',
        subject: 'Reading',
        description: 'A wise panda who loves stories and helps with reading comprehension.',
        personality: 'Wise and Patient',
        primaryColor: '#8B4513',
        voiceType: 'female',
        specialties: ['Stories', 'Vocabulary', 'Comprehension'],
        popularity: 95,
      },
      {
        id: 'leo-math',
        name: 'Leo',
        subject: 'Math',
        description: 'An energetic lion who makes numbers fun and easy to understand.',
        personality: 'Energetic and Encouraging',
        primaryColor: '#FFA500',
        voiceType: 'male',
        specialties: ['Numbers', 'Problem Solving', 'Patterns'],
        popularity: 92,
      },
      {
        id: 'sage-science',
        name: 'Sage',
        subject: 'Science',
        description: 'A curious owl who explores the wonders of science and discovery.',
        personality: 'Curious and Methodical',
        primaryColor: '#4A90E2',
        voiceType: 'male',
        specialties: ['Experiments', 'Discovery', 'Nature'],
        popularity: 88,
      },
      {
        id: 'aria-art',
        name: 'Aria',
        subject: 'Art',
        description: 'A creative butterfly who inspires artistic expression and creativity.',
        personality: 'Creative and Inspiring',
        primaryColor: '#E91E63',
        voiceType: 'female',
        specialties: ['Drawing', 'Colors', 'Creativity'],
        popularity: 85,
      },
      {
        id: 'bit-coding',
        name: 'Bit',
        subject: 'Coding',
        description: 'A clever robot who teaches programming and logical thinking.',
        personality: 'Logical and Systematic',
        primaryColor: '#9C27B0',
        voiceType: 'male',
        specialties: ['Programming', 'Logic', 'Problem Solving'],
        popularity: 90,
      },
      {
        id: 'harmony-music',
        name: 'Harmony',
        subject: 'Music',
        description: 'A melodic songbird who makes learning music theory enjoyable.',
        personality: 'Melodic and Rhythmic',
        primaryColor: '#FF5722',
        voiceType: 'female',
        specialties: ['Rhythm', 'Melody', 'Instruments'],
        popularity: 82,
      },
      {
        id: 'terra-geography',
        name: 'Terra',
        subject: 'Geography',
        description: 'An adventurous explorer who discovers the world with you.',
        personality: 'Adventurous and Knowledgeable',
        primaryColor: '#4CAF50',
        voiceType: 'female',
        specialties: ['Maps', 'Countries', 'Cultures'],
        popularity: 78,
      },
      {
        id: 'ziggy-general',
        name: 'Ziggy',
        subject: 'General',
        description: 'A friendly companion ready to help with any learning adventure.',
        personality: 'Friendly and Adaptable',
        primaryColor: '#607D8B',
        voiceType: 'child',
        specialties: ['General Help', 'Motivation', 'Fun'],
        popularity: 75,
      },
    ];
  }

  /**
   * Public API: Add characters
   */
  addCharacters(newCharacters) {
    this.characters = [...this.characters, ...newCharacters];
    this.filterAndRenderCharacters();
    this.emit('characters:added', { characters: newCharacters });
  }

  /**
   * Public API: Remove character
   */
  removeCharacter(characterId) {
    this.characters = this.characters.filter(c => c.id !== characterId);
    this.filterAndRenderCharacters();
    this.emit('character:removed', { characterId });
  }

  /**
   * Public API: Update character
   */
  updateCharacter(characterId, updates) {
    const characterIndex = this.characters.findIndex(c => c.id === characterId);
    if (characterIndex >= 0) {
      this.characters[characterIndex] = { ...this.characters[characterIndex], ...updates };
      this.filterAndRenderCharacters();
      this.emit('character:updated', { characterId, updates });
    }
  }

  /**
   * Public API: Get performance metrics
   */
  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  /**
   * Public API: Search characters
   */
  searchCharacters(term) {
    const searchInput = this.element.querySelector('.search-input');
    if (searchInput) {
      searchInput.value = term;
      this.handleSearch();
    }
  }

  /**
   * Public API: Filter characters
   */
  filterCharacters(subject) {
    const filterSelect = this.element.querySelector('.filter-select');
    if (filterSelect) {
      filterSelect.value = subject;
      this.handleFilter({ target: filterSelect });
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    // Clean up speech synthesis
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }

    // Clean up resize observer
    if (this.resizeObserver && this.element) {
      this.resizeObserver.unobserve(this.element);
    }

    // Clear timeouts
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
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

    super.destroy();
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.CharacterGallery = CharacterGallery;
}
