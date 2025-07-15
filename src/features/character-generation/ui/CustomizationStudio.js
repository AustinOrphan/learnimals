/**
 * Customization Studio
 * Advanced drag-and-drop interface for character customization
 * 
 * Part of Phase G: Character Customization Studio
 */

// Use global BaseComponent (loaded via script tag in demo page)
const BaseComponent = window.BaseComponent;
import { CharacterGenerationAPI, CharacterUtils, characterEvents } from '../index.js';
import CharacterCustomizer from './CharacterCustomizer.js';
import CharacterPreviewRenderer from './CharacterPreviewRenderer.js';

export default class CustomizationStudio extends BaseComponent {
  constructor(options = {}) {
    super({
      tagName: 'div',
      className: 'customization-studio',
      attributes: {
        'role': 'application',
        'aria-label': 'Character Customization Studio'
      },
      ...options
    });

    // Studio state
    this.characters = [];
    this.selectedCharacters = [];
    this.activePresets = [];
    this.customizations = new Map(); // Character ID -> customization
    this.isDragMode = false;
    this.draggedElement = null;

    // Components
    this.customizer = null;
    this.previewRenderer = null;

    // Studio modes
    this.modes = {
      single: 'Single Character',
      batch: 'Batch Customization',
      comparison: 'Side-by-Side Comparison',
      gallery: 'Gallery View'
    };
    this.currentMode = 'single';

    // Presets library
    this.presetLibrary = {
      educational: {
        name: 'Educational Theme',
        description: 'Clean, professional styling for learning environments',
        customization: {
          theme: 'educational',
          colorScheme: 'primary',
          effects: { shadow: { enabled: true }, glow: { enabled: false } },
          animations: { idle: 'breathe', hover: 'lift', click: 'bounce' }
        }
      },
      playful: {
        name: 'Playful Theme',
        description: 'Fun, energetic styling for younger learners',
        customization: {
          theme: 'playful',
          colorScheme: 'warm',
          effects: { sparkles: { enabled: true }, glow: { enabled: true } },
          animations: { idle: 'float', hover: 'wiggle', click: 'spin' }
        }
      },
      professional: {
        name: 'Professional Theme',
        description: 'Minimal, sophisticated styling',
        customization: {
          theme: 'professional',
          colorScheme: 'monochrome',
          effects: { shadow: { enabled: true }, outline: { enabled: true } },
          animations: { idle: 'none', hover: 'subtle', click: 'gentle' }
        }
      },
      artistic: {
        name: 'Artistic Theme',
        description: 'Creative, expressive styling with rich effects',
        customization: {
          theme: 'artistic',
          colorScheme: 'royal',
          effects: { gradient: { enabled: true }, glow: { enabled: true }, sparkles: { enabled: true } },
          animations: { idle: 'sway', hover: 'dance', click: 'jump' }
        }
      }
    };

    // Callbacks
    this.onCustomizationApplied = options.onCustomizationApplied || (() => {});
    this.onPresetSaved = options.onPresetSaved || (() => {});
    this.onClose = options.onClose || (() => {});

    this.init();
  }

  /**
   * Initialize studio
   */
  async init() {
    // Load characters
    await this.loadCharacters();

    // Initialize components
    this.previewRenderer = new CharacterPreviewRenderer({
      size: 'large',
      animated: true,
      interactive: true,
      theme: 'educational'
    });

    this.customizer = new CharacterCustomizer({
      onCustomizationChange: (customization) => {
        this.handleCustomizationChange(customization);
      },
      onSave: (customization) => {
        this.applyCustomization(customization);
      }
    });
  }

  /**
   * Load characters from storage
   */
  async loadCharacters() {
    try {
      this.characters = await CharacterGenerationAPI.loadAllCharacters();
      console.log(`📚 Loaded ${this.characters.length} characters for customization`);
    } catch (error) {
      console.error('❌ Failed to load characters:', error);
      this.characters = [];
    }
  }

  /**
   * Generate studio HTML
   */
  generateHTML() {
    return `
      <div id="${this.options.id}" class="customization-studio" data-component="customization-studio">
        <div class="studio-header">
          <div class="header-info">
            <h1>Character Customization Studio</h1>
            <p class="header-subtitle">Advanced theme and visual customization workspace</p>
          </div>
          
          <div class="studio-modes">
            ${Object.entries(this.modes).map(([id, name]) => `
              <button class="mode-btn ${this.currentMode === id ? 'active' : ''}" 
                      data-mode="${id}">
                ${name}
              </button>
            `).join('')}
          </div>

          <div class="header-actions">
            <button class="btn-secondary" id="import-preset">
              <span>📥</span>
              Import Preset
            </button>
            <button class="btn-secondary" id="export-customizations">
              <span>📤</span>
              Export All
            </button>
            <button class="btn-primary" id="apply-all">
              <span>✅</span>
              Apply All
            </button>
            <button class="btn-tertiary" id="close-studio">
              <span>✕</span>
              Close
            </button>
          </div>
        </div>

        <div class="studio-body">
          <!-- Character Library Panel -->
          <div class="character-library">
            <div class="library-header">
              <h3>Character Library</h3>
              <div class="library-controls">
                <input type="text" id="character-search" placeholder="Search characters..." class="search-input">
                <button class="btn-small" id="refresh-characters">
                  <span>🔄</span>
                </button>
              </div>
            </div>
            
            <div class="character-list" id="character-list">
              <!-- Characters will be populated here -->
            </div>

            <div class="library-stats">
              <div class="stat-item">
                <span class="stat-label">Total:</span>
                <span class="stat-value" id="total-characters">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Selected:</span>
                <span class="stat-value" id="selected-count">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Customized:</span>
                <span class="stat-value" id="customized-count">0</span>
              </div>
            </div>
          </div>

          <!-- Presets Library Panel -->
          <div class="presets-library">
            <div class="library-header">
              <h3>Preset Library</h3>
              <button class="btn-small" id="create-preset">
                <span>➕</span>
                New Preset
              </button>
            </div>

            <div class="preset-categories">
              <div class="preset-category">
                <h4>Built-in Presets</h4>
                <div class="preset-list" id="builtin-presets">
                  ${Object.entries(this.presetLibrary).map(([id, preset]) => `
                    <div class="preset-item" data-preset="${id}" draggable="true">
                      <div class="preset-preview">
                        <div class="preset-icon">${this.getPresetIcon(preset.customization.theme)}</div>
                      </div>
                      <div class="preset-info">
                        <h5 class="preset-name">${preset.name}</h5>
                        <p class="preset-description">${preset.description}</p>
                      </div>
                      <div class="preset-actions">
                        <button class="btn-small preset-apply" data-preset="${id}">
                          Apply
                        </button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <div class="preset-category">
                <h4>Custom Presets</h4>
                <div class="preset-list" id="custom-presets">
                  <!-- Custom presets will be populated here -->
                </div>
              </div>
            </div>
          </div>

          <!-- Workspace Area -->
          <div class="workspace-area">
            <div class="workspace-header">
              <h3>Customization Workspace</h3>
              <div class="workspace-tools">
                <button class="btn-small" id="clear-workspace">
                  <span>🗑️</span>
                  Clear
                </button>
                <button class="btn-small" id="undo-changes">
                  <span>↶</span>
                  Undo
                </button>
                <button class="btn-small" id="redo-changes">
                  <span>↷</span>
                  Redo
                </button>
              </div>
            </div>

            <div class="workspace-content" id="workspace-content">
              ${this.renderWorkspaceForMode(this.currentMode)}
            </div>
          </div>

          <!-- Properties Panel -->
          <div class="properties-panel">
            <div class="panel-header">
              <h3>Properties</h3>
              <button class="btn-small" id="toggle-properties">
                <span>⚙️</span>
              </button>
            </div>

            <div class="properties-content" id="properties-content">
              <div class="property-section">
                <h4>Quick Actions</h4>
                <div class="quick-actions">
                  <button class="quick-action" data-action="randomize">
                    <span>🎲</span>
                    Randomize
                  </button>
                  <button class="quick-action" data-action="reset">
                    <span>🔄</span>
                    Reset
                  </button>
                  <button class="quick-action" data-action="duplicate">
                    <span>📋</span>
                    Duplicate
                  </button>
                  <button class="quick-action" data-action="variations">
                    <span>🎨</span>
                    Variations
                  </button>
                </div>
              </div>

              <div class="property-section">
                <h4>Batch Operations</h4>
                <div class="batch-operations">
                  <button class="batch-operation" data-operation="apply-theme">
                    Apply Theme to All
                  </button>
                  <button class="batch-operation" data-operation="apply-colors">
                    Apply Colors to All
                  </button>
                  <button class="batch-operation" data-operation="sync-animations">
                    Sync Animations
                  </button>
                </div>
              </div>

              <div class="property-section">
                <h4>Export Options</h4>
                <div class="export-options">
                  <label class="option-label">
                    <input type="checkbox" id="export-animations" checked>
                    Include Animations
                  </label>
                  <label class="option-label">
                    <input type="checkbox" id="export-effects" checked>
                    Include Effects
                  </label>
                  <label class="option-label">
                    <input type="checkbox" id="export-metadata" checked>
                    Include Metadata
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="studio-footer">
          <div class="footer-info">
            <span class="workspace-status" id="workspace-status">
              Ready to customize characters
            </span>
          </div>
          
          <div class="footer-actions">
            <button class="btn-secondary" id="save-session">
              <span>💾</span>
              Save Session
            </button>
            <button class="btn-secondary" id="load-session">
              <span>📂</span>
              Load Session
            </button>
            <button class="btn-primary" id="export-results">
              <span>🎉</span>
              Export Results
            </button>
          </div>
        </div>

        <!-- Drop Zone Overlay -->
        <div class="drop-zone-overlay" id="drop-zone-overlay">
          <div class="drop-zone-content">
            <div class="drop-zone-icon">📋</div>
            <div class="drop-zone-text">Drop preset here to apply</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render workspace content based on current mode
   */
  renderWorkspaceForMode(mode) {
    switch (mode) {
    case 'single':
      return this.renderSingleCharacterWorkspace();
    case 'batch':
      return this.renderBatchCustomizationWorkspace();
    case 'comparison':
      return this.renderComparisonWorkspace();
    case 'gallery':
      return this.renderGalleryWorkspace();
    default:
      return this.renderSingleCharacterWorkspace();
    }
  }

  /**
   * Render single character workspace
   */
  renderSingleCharacterWorkspace() {
    return `
      <div class="single-workspace">
        <div class="character-slot drop-zone" data-slot="character">
          <div class="slot-placeholder">
            <span class="placeholder-icon">👤</span>
            <p>Drag a character here</p>
          </div>
        </div>
        
        <div class="customization-area">
          <div class="preset-slot drop-zone" data-slot="preset">
            <div class="slot-placeholder">
              <span class="placeholder-icon">🎨</span>
              <p>Drag a preset here</p>
            </div>
          </div>
          
          <div class="preview-area">
            <div class="preview-container" id="single-preview">
              <!-- Live preview will be rendered here -->
            </div>
            
            <div class="preview-controls">
              <button class="preview-btn" data-action="rotate">🔄</button>
              <button class="preview-btn" data-action="zoom-in">🔍+</button>
              <button class="preview-btn" data-action="zoom-out">🔍-</button>
              <button class="preview-btn" data-action="animate">▶️</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render batch customization workspace
   */
  renderBatchCustomizationWorkspace() {
    return `
      <div class="batch-workspace">
        <div class="batch-slots">
          <div class="batch-characters drop-zone" data-slot="characters">
            <div class="slot-header">
              <h4>Characters (${this.selectedCharacters.length})</h4>
              <button class="btn-small" id="clear-batch">Clear</button>
            </div>
            <div class="character-slots" id="batch-character-slots">
              <!-- Selected characters will appear here -->
            </div>
          </div>
          
          <div class="batch-presets drop-zone" data-slot="presets">
            <div class="slot-header">
              <h4>Presets Queue</h4>
              <button class="btn-small" id="clear-presets">Clear</button>
            </div>
            <div class="preset-queue" id="preset-queue">
              <!-- Queued presets will appear here -->
            </div>
          </div>
        </div>
        
        <div class="batch-preview">
          <div class="preview-grid" id="batch-preview-grid">
            <!-- Batch preview will be rendered here -->
          </div>
          
          <div class="batch-controls">
            <button class="btn-primary" id="apply-batch">
              Apply to All (${this.selectedCharacters.length})
            </button>
            <button class="btn-secondary" id="preview-batch">
              Preview Changes
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render comparison workspace
   */
  renderComparisonWorkspace() {
    return `
      <div class="comparison-workspace">
        <div class="comparison-slots">
          <div class="comparison-character drop-zone" data-slot="character-a">
            <h4>Character A</h4>
            <div class="slot-placeholder">
              <span class="placeholder-icon">👤</span>
              <p>Drag character here</p>
            </div>
          </div>
          
          <div class="comparison-character drop-zone" data-slot="character-b">
            <h4>Character B</h4>
            <div class="slot-placeholder">
              <span class="placeholder-icon">👤</span>
              <p>Drag character here</p>
            </div>
          </div>
        </div>
        
        <div class="comparison-presets">
          <div class="preset-option drop-zone" data-slot="preset-a">
            <h5>Preset A</h5>
            <div class="slot-placeholder">
              <span class="placeholder-icon">🎨</span>
              <p>Drag preset</p>
            </div>
          </div>
          
          <div class="preset-option drop-zone" data-slot="preset-b">
            <h5>Preset B</h5>
            <div class="slot-placeholder">
              <span class="placeholder-icon">🎨</span>
              <p>Drag preset</p>
            </div>
          </div>
        </div>
        
        <div class="comparison-results">
          <div class="result-preview" id="comparison-a">
            <!-- Comparison A preview -->
          </div>
          <div class="result-preview" id="comparison-b">
            <!-- Comparison B preview -->
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render gallery workspace
   */
  renderGalleryWorkspace() {
    return `
      <div class="gallery-workspace">
        <div class="gallery-controls">
          <div class="view-options">
            <button class="view-btn active" data-view="grid">
              <span>⊞</span>
              Grid
            </button>
            <button class="view-btn" data-view="list">
              <span>☰</span>
              List
            </button>
            <button class="view-btn" data-view="masonry">
              <span>⊟</span>
              Masonry
            </button>
          </div>
          
          <div class="gallery-filters">
            <select id="filter-subject" class="filter-select">
              <option value="">All Subjects</option>
              <option value="math">Math</option>
              <option value="science">Science</option>
              <option value="reading">Reading</option>
              <option value="art">Art</option>
            </select>
            
            <select id="filter-theme" class="filter-select">
              <option value="">All Themes</option>
              <option value="educational">Educational</option>
              <option value="playful">Playful</option>
              <option value="professional">Professional</option>
              <option value="artistic">Artistic</option>
            </select>
          </div>
        </div>
        
        <div class="gallery-grid" id="gallery-grid">
          <!-- Gallery items will be rendered here -->
        </div>
      </div>
    `;
  }

  /**
   * Get preset icon based on theme
   */
  getPresetIcon(theme) {
    const icons = {
      educational: '📚',
      playful: '🎈',
      professional: '💼',
      artistic: '🎨',
      retro: '📺',
      neon: '⚡'
    };
    return icons[theme] || '🎨';
  }

  /**
   * Handle customization change
   */
  handleCustomizationChange(customization) {
    // Update workspace based on current mode
    this.updateWorkspacePreview();
    this.updateWorkspaceStatus('Customization changed');
  }

  /**
   * Apply customization to selected characters
   */
  applyCustomization(customization) {
    this.selectedCharacters.forEach(character => {
      this.customizations.set(character.id, customization);
    });
    
    this.updateWorkspacePreview();
    this.updateStats();
    this.updateWorkspaceStatus('Customization applied');
    
    // Emit event
    this.onCustomizationApplied(customization, this.selectedCharacters);
  }

  /**
   * Update workspace preview
   */
  updateWorkspacePreview() {
    switch (this.currentMode) {
    case 'single':
      this.updateSinglePreview();
      break;
    case 'batch':
      this.updateBatchPreview();
      break;
    case 'comparison':
      this.updateComparisonPreview();
      break;
    case 'gallery':
      this.updateGalleryPreview();
      break;
    }
  }

  /**
   * Update single character preview
   */
  updateSinglePreview() {
    const previewContainer = this.element.querySelector('#single-preview');
    if (!previewContainer || this.selectedCharacters.length === 0) return;

    const character = this.selectedCharacters[0];
    const customization = this.customizations.get(character.id);
    
    if (customization && this.previewRenderer) {
      // Apply customization to character
      const customizedCharacter = this.applyCustomizationToCharacter(character, customization);
      
      // Clear and render
      previewContainer.innerHTML = '';
      this.previewRenderer.theme = customization.theme;
      this.previewRenderer.render(previewContainer, customizedCharacter);
    }
  }

  /**
   * Update batch preview
   */
  updateBatchPreview() {
    const previewGrid = this.element.querySelector('#batch-preview-grid');
    if (!previewGrid) return;

    previewGrid.innerHTML = this.selectedCharacters.map(character => {
      const customization = this.customizations.get(character.id);
      return `
        <div class="batch-preview-item" data-character="${character.id}">
          <div class="preview-container" id="batch-preview-${character.id}">
            <!-- Preview will be rendered here -->
          </div>
          <div class="preview-info">
            <h5>${character.name}</h5>
            <span class="customization-status">
              ${customization ? 'Customized' : 'Default'}
            </span>
          </div>
        </div>
      `;
    }).join('');

    // Render previews
    this.selectedCharacters.forEach(character => {
      const container = previewGrid.querySelector(`#batch-preview-${character.id}`);
      if (container && this.previewRenderer) {
        const customization = this.customizations.get(character.id);
        if (customization) {
          const customizedCharacter = this.applyCustomizationToCharacter(character, customization);
          this.previewRenderer.theme = customization.theme;
          this.previewRenderer.render(container, customizedCharacter);
        } else {
          this.previewRenderer.render(container, character);
        }
      }
    });
  }

  /**
   * Apply customization to character
   */
  applyCustomizationToCharacter(character, customization) {
    // Create deep copy
    const customized = JSON.parse(JSON.stringify(character));
    
    // Apply customization properties
    if (customization.colorScheme) {
      // Apply color scheme logic here
    }
    
    if (customization.animations) {
      customized.animations = { ...customized.animations, ...customization.animations };
    }
    
    return customized;
  }

  /**
   * Update workspace status
   */
  updateWorkspaceStatus(message) {
    const statusElement = this.element.querySelector('#workspace-status');
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  /**
   * Update statistics
   */
  updateStats() {
    const totalElement = this.element.querySelector('#total-characters');
    const selectedElement = this.element.querySelector('#selected-count');
    const customizedElement = this.element.querySelector('#customized-count');
    
    if (totalElement) totalElement.textContent = this.characters.length;
    if (selectedElement) selectedElement.textContent = this.selectedCharacters.length;
    if (customizedElement) customizedElement.textContent = this.customizations.size;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    super.attachEventListeners();

    if (!this.element) return;

    // Header actions
    this.element.querySelector('#import-preset')?.addEventListener('click', () => this.importPreset());
    this.element.querySelector('#export-customizations')?.addEventListener('click', () => this.exportCustomizations());
    this.element.querySelector('#apply-all')?.addEventListener('click', () => this.applyAllCustomizations());
    this.element.querySelector('#close-studio')?.addEventListener('click', () => this.close());

    // Mode switching
    this.element.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchMode(btn.dataset.mode);
      });
    });

    // Character search
    this.element.querySelector('#character-search')?.addEventListener('input', (e) => {
      this.filterCharacters(e.target.value);
    });

    // Character selection
    this.element.querySelector('#character-list')?.addEventListener('click', (e) => {
      const characterItem = e.target.closest('.character-list-item');
      if (characterItem) {
        this.selectCharacter(characterItem.dataset.characterId);
      }
    });

    // Preset application
    this.element.querySelectorAll('.preset-apply').forEach(btn => {
      btn.addEventListener('click', () => {
        this.applyPreset(btn.dataset.preset);
      });
    });

    // Quick actions
    this.element.querySelectorAll('.quick-action').forEach(btn => {
      btn.addEventListener('click', () => {
        this.handleQuickAction(btn.dataset.action);
      });
    });

    // Batch operations
    this.element.querySelectorAll('.batch-operation').forEach(btn => {
      btn.addEventListener('click', () => {
        this.handleBatchOperation(btn.dataset.operation);
      });
    });

    // Workspace tools
    this.element.querySelector('#clear-workspace')?.addEventListener('click', () => this.clearWorkspace());
    this.element.querySelector('#undo-changes')?.addEventListener('click', () => this.undoChanges());
    this.element.querySelector('#redo-changes')?.addEventListener('click', () => this.redoChanges());

    // Footer actions
    this.element.querySelector('#save-session')?.addEventListener('click', () => this.saveSession());
    this.element.querySelector('#load-session')?.addEventListener('click', () => this.loadSession());
    this.element.querySelector('#export-results')?.addEventListener('click', () => this.exportResults());

    // Drag and drop setup
    this.setupDragAndDrop();

    // Listen for character events
    characterEvents.on('characterCreated', () => this.loadCharacters());
    characterEvents.on('characterUpdated', () => this.loadCharacters());
    characterEvents.on('characterDeleted', () => this.loadCharacters());
  }

  /**
   * Setup drag and drop functionality
   */
  setupDragAndDrop() {
    // Make character items draggable
    this.element.addEventListener('dragstart', (e) => {
      if (e.target.closest('.character-list-item')) {
        e.dataTransfer.setData('text/character-id', e.target.closest('.character-list-item').dataset.characterId);
        this.draggedElement = e.target.closest('.character-list-item');
        this.isDragMode = true;
      } else if (e.target.closest('.preset-item')) {
        e.dataTransfer.setData('text/preset-id', e.target.closest('.preset-item').dataset.preset);
        this.draggedElement = e.target.closest('.preset-item');
        this.isDragMode = true;
      }
    });

    // Handle drop zones
    this.element.addEventListener('dragover', (e) => {
      if (this.isDragMode) {
        e.preventDefault();
        const dropZone = e.target.closest('.drop-zone');
        if (dropZone) {
          dropZone.classList.add('drag-hover');
        }
      }
    });

    this.element.addEventListener('dragleave', (e) => {
      const dropZone = e.target.closest('.drop-zone');
      if (dropZone) {
        dropZone.classList.remove('drag-hover');
      }
    });

    this.element.addEventListener('drop', (e) => {
      e.preventDefault();
      const dropZone = e.target.closest('.drop-zone');
      if (dropZone) {
        dropZone.classList.remove('drag-hover');
        this.handleDrop(e, dropZone);
      }
      this.isDragMode = false;
      this.draggedElement = null;
    });

    this.element.addEventListener('dragend', () => {
      this.isDragMode = false;
      this.draggedElement = null;
    });
  }

  /**
   * Handle drop events
   */
  handleDrop(event, dropZone) {
    const characterId = event.dataTransfer.getData('text/character-id');
    const presetId = event.dataTransfer.getData('text/preset-id');
    const slotType = dropZone.dataset.slot;

    if (characterId && slotType) {
      this.handleCharacterDrop(characterId, slotType);
    } else if (presetId && slotType) {
      this.handlePresetDrop(presetId, slotType);
    }
  }

  /**
   * Handle character drop
   */
  handleCharacterDrop(characterId, slotType) {
    const character = this.characters.find(c => c.id === characterId);
    if (!character) return;

    switch (slotType) {
    case 'character':
      this.selectedCharacters = [character];
      break;
    case 'characters':
      if (!this.selectedCharacters.find(c => c.id === characterId)) {
        this.selectedCharacters.push(character);
      }
      break;
    case 'character-a':
    case 'character-b':
      this.handleComparisonCharacterDrop(character, slotType);
      break;
    }

    this.updateWorkspaceContent();
    this.updateStats();
    this.updateWorkspaceStatus(`Added ${character.name} to workspace`);
  }

  /**
   * Handle preset drop
   */
  handlePresetDrop(presetId, slotType) {
    const preset = this.presetLibrary[presetId];
    if (!preset) return;

    switch (slotType) {
    case 'preset':
      this.applyPresetToSelected(preset);
      break;
    case 'presets':
      this.activePresets.push(preset);
      break;
    case 'preset-a':
    case 'preset-b':
      this.handleComparisonPresetDrop(preset, slotType);
      break;
    }

    this.updateWorkspaceContent();
    this.updateWorkspaceStatus(`Applied ${preset.name} preset`);
  }

  /**
   * Switch workspace mode
   */
  switchMode(mode) {
    if (this.currentMode === mode) return;

    this.currentMode = mode;
    
    // Update mode buttons
    this.element.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Update workspace content
    this.updateWorkspaceContent();
  }

  /**
   * Update workspace content
   */
  updateWorkspaceContent() {
    const workspaceContent = this.element.querySelector('#workspace-content');
    if (workspaceContent) {
      workspaceContent.innerHTML = this.renderWorkspaceForMode(this.currentMode);
      this.updateWorkspacePreview();
    }
  }

  /**
   * Apply preset to selected characters
   */
  applyPresetToSelected(preset) {
    this.selectedCharacters.forEach(character => {
      this.customizations.set(character.id, preset.customization);
    });
    this.updateWorkspacePreview();
  }

  /**
   * Handle quick actions
   */
  handleQuickAction(action) {
    switch (action) {
    case 'randomize':
      this.randomizeSelectedCharacters();
      break;
    case 'reset':
      this.resetSelectedCharacters();
      break;
    case 'duplicate':
      this.duplicateSelectedCharacters();
      break;
    case 'variations':
      this.createCharacterVariations();
      break;
    }
  }

  /**
   * Handle batch operations
   */
  handleBatchOperation(operation) {
    switch (operation) {
    case 'apply-theme':
      this.applyThemeToAll();
      break;
    case 'apply-colors':
      this.applyColorsToAll();
      break;
    case 'sync-animations':
      this.syncAnimationsToAll();
      break;
    }
  }

  /**
   * Randomize selected characters
   */
  randomizeSelectedCharacters() {
    const presets = Object.values(this.presetLibrary);
    this.selectedCharacters.forEach(character => {
      const randomPreset = presets[Math.floor(Math.random() * presets.length)];
      this.customizations.set(character.id, randomPreset.customization);
    });
    this.updateWorkspacePreview();
    this.updateWorkspaceStatus('Applied random customizations');
  }

  /**
   * Reset selected characters
   */
  resetSelectedCharacters() {
    this.selectedCharacters.forEach(character => {
      this.customizations.delete(character.id);
    });
    this.updateWorkspacePreview();
    this.updateWorkspaceStatus('Reset characters to default');
  }

  /**
   * Select character
   */
  selectCharacter(characterId) {
    const character = this.characters.find(c => c.id === characterId);
    if (character) {
      if (this.currentMode === 'single') {
        this.selectedCharacters = [character];
      } else {
        const index = this.selectedCharacters.findIndex(c => c.id === characterId);
        if (index >= 0) {
          this.selectedCharacters.splice(index, 1);
        } else {
          this.selectedCharacters.push(character);
        }
      }
      this.updateCharacterList();
      this.updateWorkspaceContent();
      this.updateStats();
    }
  }

  /**
   * Update character list UI
   */
  updateCharacterList() {
    const listContainer = this.element.querySelector('#character-list');
    if (!listContainer) return;

    listContainer.innerHTML = this.characters.map(character => `
      <div class="character-list-item ${this.selectedCharacters.find(c => c.id === character.id) ? 'selected' : ''}" 
           data-character-id="${character.id}" 
           draggable="true">
        <div class="character-avatar" style="background: ${character.appearance?.primaryColor || '#4A90E2'}">
          ${character.name?.charAt(0).toUpperCase() || '?'}
        </div>
        <div class="character-info">
          <div class="character-name">${character.name || 'Unnamed'}</div>
          <div class="character-subject">${character.subject || 'No subject'}</div>
        </div>
        <div class="character-status">
          ${this.customizations.has(character.id) ? '🎨' : '⚪'}
        </div>
      </div>
    `).join('');
  }

  /**
   * Filter characters
   */
  filterCharacters(searchTerm) {
    const items = this.element.querySelectorAll('.character-list-item');
    const lowerSearch = searchTerm.toLowerCase();
    
    items.forEach(item => {
      const character = this.characters.find(c => c.id === item.dataset.characterId);
      if (character) {
        const matches = 
          character.name.toLowerCase().includes(lowerSearch) ||
          character.subject.toLowerCase().includes(lowerSearch);
        item.style.display = matches ? 'flex' : 'none';
      }
    });
  }

  /**
   * Apply preset
   */
  applyPreset(presetId) {
    const preset = this.presetLibrary[presetId];
    if (preset && this.selectedCharacters.length > 0) {
      this.applyPresetToSelected(preset);
      this.updateWorkspaceStatus(`Applied ${preset.name} to ${this.selectedCharacters.length} character(s)`);
    }
  }

  /**
   * Apply all customizations
   */
  async applyAllCustomizations() {
    try {
      for (const [characterId, customization] of this.customizations) {
        const character = this.characters.find(c => c.id === characterId);
        if (character) {
          const customizedCharacter = this.applyCustomizationToCharacter(character, customization);
          await CharacterGenerationAPI.updateCharacter(customizedCharacter);
        }
      }
      
      this.updateWorkspaceStatus('All customizations applied successfully');
      this.onCustomizationApplied(Array.from(this.customizations.values()), this.selectedCharacters);
    } catch (error) {
      console.error('❌ Failed to apply customizations:', error);
      this.updateWorkspaceStatus('Failed to apply some customizations');
    }
  }

  /**
   * Export customizations
   */
  exportCustomizations() {
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      customizations: Array.from(this.customizations.entries()).map(([id, customization]) => ({
        characterId: id,
        characterName: this.characters.find(c => c.id === id)?.name || 'Unknown',
        customization
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learnimals-customizations-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.updateWorkspaceStatus('Customizations exported successfully');
  }

  /**
   * Import preset
   */
  importPreset() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (data.customizations) {
          // Import customizations
          data.customizations.forEach(item => {
            const character = this.characters.find(c => c.id === item.characterId);
            if (character) {
              this.customizations.set(item.characterId, item.customization);
            }
          });
          
          this.updateWorkspacePreview();
          this.updateStats();
          this.updateWorkspaceStatus(`Imported ${data.customizations.length} customizations`);
        } else {
          throw new Error('Invalid customization file format');
        }
      } catch (error) {
        console.error('❌ Import failed:', error);
        this.updateWorkspaceStatus(`Import failed: ${error.message}`);
      }
    });
    
    input.click();
  }

  /**
   * Save session
   */
  saveSession() {
    const sessionData = {
      mode: this.currentMode,
      selectedCharacters: this.selectedCharacters.map(c => c.id),
      customizations: Array.from(this.customizations.entries()),
      activePresets: this.activePresets
    };
    
    localStorage.setItem('learnimals_customization_session', JSON.stringify(sessionData));
    this.updateWorkspaceStatus('Session saved');
  }

  /**
   * Load session
   */
  loadSession() {
    try {
      const sessionData = JSON.parse(localStorage.getItem('learnimals_customization_session') || '{}');
      
      if (sessionData.mode) {
        this.switchMode(sessionData.mode);
      }
      
      if (sessionData.selectedCharacters) {
        this.selectedCharacters = sessionData.selectedCharacters
          .map(id => this.characters.find(c => c.id === id))
          .filter(Boolean);
      }
      
      if (sessionData.customizations) {
        this.customizations = new Map(sessionData.customizations);
      }
      
      if (sessionData.activePresets) {
        this.activePresets = sessionData.activePresets;
      }
      
      this.updateCharacterList();
      this.updateWorkspaceContent();
      this.updateStats();
      this.updateWorkspaceStatus('Session loaded');
    } catch (error) {
      console.error('❌ Failed to load session:', error);
      this.updateWorkspaceStatus('Failed to load session');
    }
  }

  /**
   * Clear workspace
   */
  clearWorkspace() {
    this.selectedCharacters = [];
    this.customizations.clear();
    this.activePresets = [];
    
    this.updateCharacterList();
    this.updateWorkspaceContent();
    this.updateStats();
    this.updateWorkspaceStatus('Workspace cleared');
  }

  /**
   * Close studio
   */
  close() {
    if (this.customizations.size > 0) {
      const confirmed = confirm('You have unsaved customizations. Are you sure you want to close?');
      if (!confirmed) return;
    }
    
    this.onClose();
    this.destroy();
  }

  /**
   * Update comparison preview
   */
  updateComparisonPreview() {
    // Implementation for comparison mode preview
  }

  /**
   * Update gallery preview
   */
  updateGalleryPreview() {
    // Implementation for gallery mode preview
  }

  /**
   * Apply theme to all characters
   */
  applyThemeToAll() {
    // Implementation for batch theme application
  }

  /**
   * Apply colors to all characters
   */
  applyColorsToAll() {
    // Implementation for batch color application
  }

  /**
   * Sync animations to all characters
   */
  syncAnimationsToAll() {
    // Implementation for batch animation sync
  }

  /**
   * Undo changes
   */
  undoChanges() {
    // Implementation for undo functionality
  }

  /**
   * Redo changes
   */
  redoChanges() {
    // Implementation for redo functionality
  }

  /**
   * Export results
   */
  exportResults() {
    this.exportCustomizations();
  }

  /**
   * Handle comparison character drop
   */
  handleComparisonCharacterDrop(character, slotType) {
    // Implementation for comparison mode character handling
  }

  /**
   * Handle comparison preset drop
   */
  handleComparisonPresetDrop(preset, slotType) {
    // Implementation for comparison mode preset handling
  }

  /**
   * Duplicate selected characters
   */
  duplicateSelectedCharacters() {
    // Implementation for character duplication
  }

  /**
   * Create character variations
   */
  createCharacterVariations() {
    // Implementation for creating character variations
  }

  /**
   * Clean up when destroyed
   */
  destroy() {
    if (this.customizer) {
      this.customizer.destroy();
    }
    super.destroy();
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.CustomizationStudio = CustomizationStudio;
}