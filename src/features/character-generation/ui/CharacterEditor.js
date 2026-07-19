/**
 * Advanced Character Editor
 * Comprehensive editing interface for existing characters
 *
 * Part of Phase F: Advanced Character Editor
 */

import BaseComponent from '../../../components/BaseComponent.js';
import { CharacterGenerationAPI, CharacterUtils, characterEvents } from '../index.js';
import CharacterPreviewRenderer from './CharacterPreviewRenderer.js';
import Modal from '../../../components/ui/Modal.js';

export default class CharacterEditor extends BaseComponent {
  constructor(options = {}) {
    super({
      tagName: 'div',
      className: 'character-editor',
      attributes: {
        role: 'application',
        'aria-label': 'Character Editor',
      },
      ...options,
    });

    // Editor state
    this.characters = [];
    this.selectedCharacter = null;
    this.originalCharacter = null; // For comparison
    this.editHistory = [];
    this.historyIndex = -1;
    this.hasUnsavedChanges = false;

    // UI state
    this.currentTab = 'appearance';
    this.isLoading = false;
    this.previewRenderer = null;
    this.autoSave = options.autoSave !== false;
    this.autoSaveTimer = null;

    // Editor tabs configuration
    this.tabs = [
      { id: 'appearance', label: 'Appearance', icon: '🎨' },
      { id: 'personality', label: 'Personality', icon: '🧠' },
      { id: 'education', label: 'Education', icon: '📚' },
      { id: 'interactions', label: 'Interactions', icon: '💬' },
      { id: 'animations', label: 'Animations', icon: '✨' },
      { id: 'metadata', label: 'Advanced', icon: '⚙️' },
    ];

    // Callbacks
    this.onSave = options.onSave || (() => {});
    this.onCancel = options.onCancel || (() => {});
    this.onChange = options.onChange || (() => {});

    this.init();
  }

  /**
   * Initialize editor
   */
  async init() {
    // Load existing characters
    await this.loadCharacters();

    // Initialize preview renderer
    this.previewRenderer = new CharacterPreviewRenderer({
      size: 'large',
      animated: true,
      interactive: true,
      theme: 'educational',
    });

    // Set up auto-save if enabled
    if (this.autoSave) {
      this.setupAutoSave();
    }
  }

  /**
   * Load characters from storage
   */
  async loadCharacters() {
    this.isLoading = true;
    try {
      this.characters = await CharacterGenerationAPI.loadAllCharacters();
      console.log(`📚 Loaded ${this.characters.length} characters for editing`);
    } catch (error) {
      console.error('❌ Failed to load characters:', error);
      this.characters = [];
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Generate editor HTML
   */
  generateHTML() {
    return `
      <div id="${this.options.id}" class="character-editor" data-component="character-editor">
        <div class="editor-header">
          <h2>Character Editor</h2>
          <div class="editor-actions">
            <button class="btn-secondary" id="editor-undo" disabled title="Undo (Ctrl+Z)">
              <span aria-hidden="true">↶</span>
              Undo
            </button>
            <button class="btn-secondary" id="editor-redo" disabled title="Redo (Ctrl+Y)">
              <span aria-hidden="true">↷</span>
              Redo
            </button>
            <button class="btn-secondary" id="editor-compare" title="Compare with original">
              <span aria-hidden="true">⚖️</span>
              Compare
            </button>
            <button class="btn-primary" id="editor-save" disabled>
              <span aria-hidden="true">💾</span>
              Save Changes
            </button>
            <button class="btn-tertiary" id="editor-close">
              <span aria-hidden="true">✕</span>
              Close
            </button>
          </div>
        </div>

        <div class="editor-body">
          <!-- Character Selector -->
          <div class="character-selector">
            <h3>Select Character</h3>
            <div class="selector-search">
              <input type="text" 
                     id="character-search" 
                     placeholder="Search characters..." 
                     class="search-input">
            </div>
            <div class="character-list" id="character-list">
              ${this.renderCharacterList()}
            </div>
            <div class="selector-actions">
              <button class="btn-secondary" id="import-character">
                <span aria-hidden="true">📥</span>
                Import
              </button>
              <button class="btn-secondary" id="export-character" disabled>
                <span aria-hidden="true">📤</span>
                Export
              </button>
            </div>
          </div>

          <!-- Editor Panel -->
          <div class="editor-panel">
            <div class="editor-tabs">
              ${this.tabs
                .map(
                  tab => `
                <button class="editor-tab ${tab.id === this.currentTab ? 'active' : ''}" 
                        data-tab="${tab.id}"
                        title="${tab.label}">
                  <span class="tab-icon">${tab.icon}</span>
                  <span class="tab-label">${tab.label}</span>
                </button>
              `
                )
                .join('')}
            </div>

            <div class="editor-content">
              <div class="tab-panels">
                ${this.tabs
                  .map(
                    tab => `
                  <div class="tab-panel ${tab.id === this.currentTab ? 'active' : ''}" 
                       data-panel="${tab.id}">
                    ${this.renderTabContent(tab.id)}
                  </div>
                `
                  )
                  .join('')}
              </div>
            </div>

            <div class="editor-status">
              <div class="status-indicator" id="save-status">
                <span class="status-icon">✓</span>
                <span class="status-text">All changes saved</span>
              </div>
              <div class="auto-save-toggle">
                <label>
                  <input type="checkbox" id="auto-save" ${this.autoSave ? 'checked' : ''}>
                  Auto-save
                </label>
              </div>
            </div>
          </div>

          <!-- Preview Panel -->
          <div class="preview-panel">
            <h3>Live Preview</h3>
            <div class="preview-controls">
              <select id="preview-theme" class="theme-selector">
                <option value="educational">Educational</option>
                <option value="playful">Playful</option>
                <option value="professional">Professional</option>
                <option value="artistic">Artistic</option>
              </select>
              <select id="preview-expression" class="expression-selector">
                <option value="happy">Happy</option>
                <option value="excited">Excited</option>
                <option value="thinking">Thinking</option>
                <option value="proud">Proud</option>
              </select>
            </div>
            <div class="character-preview-container" id="editor-preview">
              <div class="preview-placeholder">
                <span aria-hidden="true">👤</span>
                <p>Select a character to preview</p>
              </div>
            </div>
            <div class="preview-info" id="preview-info">
              <!-- Character info will be displayed here -->
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render character list
   */
  renderCharacterList() {
    if (this.isLoading) {
      return '<div class="loading">Loading characters...</div>';
    }

    if (this.characters.length === 0) {
      return '<div class="empty-state">No characters found. Create some characters first!</div>';
    }

    return this.characters
      .map(
        character => `
      <div class="character-item ${this.selectedCharacter?.id === character.id ? 'selected' : ''}" 
           data-character-id="${character.id}">
        <div class="character-avatar" style="background-color: ${character.appearance?.primaryColor || '#4A90E2'}">
          ${character.name?.charAt(0) || '?'}
        </div>
        <div class="character-info">
          <div class="character-name">${character.name || 'Unnamed'}</div>
          <div class="character-subject">${character.subject || 'No subject'}</div>
        </div>
      </div>
    `
      )
      .join('');
  }

  /**
   * Render tab content based on tab ID
   */
  renderTabContent(tabId) {
    switch (tabId) {
      case 'appearance':
        return this.renderAppearanceTab();
      case 'personality':
        return this.renderPersonalityTab();
      case 'education':
        return this.renderEducationTab();
      case 'interactions':
        return this.renderInteractionsTab();
      case 'animations':
        return this.renderAnimationsTab();
      case 'metadata':
        return this.renderMetadataTab();
      default:
        return '<div>Tab content not implemented</div>';
    }
  }

  /**
   * Render appearance editing tab
   */
  renderAppearanceTab() {
    return `
      <div class="tab-content appearance-tab">
        <h4>Character Appearance</h4>
        
        <div class="form-section">
          <label class="form-label">Base Shape</label>
          <div class="shape-selector">
            ${['circle', 'oval', 'square', 'triangle', 'hexagon']
              .map(
                shape => `
              <button class="shape-option" data-shape="${shape}" title="${shape}">
                <svg width="40" height="40" viewBox="0 0 40 40">
                  ${this.renderShapePreview(shape)}
                </svg>
              </button>
            `
              )
              .join('')}
          </div>
        </div>

        <div class="form-section">
          <label class="form-label">Colors</label>
          <div class="color-inputs">
            <div class="color-input-group">
              <label for="primary-color">Primary Color</label>
              <input type="color" id="primary-color" class="color-picker" value="#4A90E2">
            </div>
            <div class="color-input-group">
              <label for="secondary-color">Secondary Color</label>
              <input type="color" id="secondary-color" class="color-picker" value="#FFFFFF">
            </div>
            <div class="color-input-group">
              <label for="accent-color">Accent Color</label>
              <input type="color" id="accent-color" class="color-picker" value="#FFD700">
            </div>
          </div>
        </div>

        <div class="form-section">
          <label class="form-label">Eyes</label>
          <div class="eye-options">
            <select id="eye-shape" class="form-select">
              <option value="circle">Circle</option>
              <option value="oval">Oval</option>
              <option value="almond">Almond</option>
              <option value="square">Square</option>
            </select>
            <input type="color" id="eye-color" class="color-picker" value="#333333">
          </div>
        </div>

        <div class="form-section">
          <label class="form-label">Mouth</label>
          <select id="mouth-shape" class="form-select">
            <option value="smile">Smile</option>
            <option value="neutral">Neutral</option>
            <option value="frown">Frown</option>
            <option value="oh">Surprised</option>
            <option value="grin">Big Grin</option>
          </select>
        </div>

        <div class="form-section">
          <label class="form-label">Accessories</label>
          <div class="accessory-options">
            ${['glasses', 'hat', 'bowtie', 'headband', 'crown']
              .map(
                accessory => `
              <label class="checkbox-label">
                <input type="checkbox" value="${accessory}" class="accessory-checkbox">
                ${accessory.charAt(0).toUpperCase() + accessory.slice(1)}
              </label>
            `
              )
              .join('')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render personality editing tab
   */
  renderPersonalityTab() {
    return `
      <div class="tab-content personality-tab">
        <h4>Character Personality</h4>
        
        <div class="form-section">
          <label class="form-label">Personality Type</label>
          <select id="personality-type" class="form-select">
            <option value="friendly">Friendly & Outgoing</option>
            <option value="wise">Wise & Patient</option>
            <option value="energetic">Energetic & Enthusiastic</option>
            <option value="creative">Creative & Imaginative</option>
            <option value="logical">Logical & Analytical</option>
            <option value="caring">Caring & Nurturing</option>
          </select>
        </div>

        <div class="form-section">
          <label class="form-label">Character Traits</label>
          <div class="traits-selector">
            ${['helpful', 'curious', 'brave', 'funny', 'patient', 'clever', 'kind', 'adventurous']
              .map(
                trait => `
              <label class="trait-option">
                <input type="checkbox" value="${trait}" class="trait-checkbox">
                <span class="trait-label">${trait}</span>
              </label>
            `
              )
              .join('')}
          </div>
        </div>

        <div class="form-section">
          <label class="form-label">Voice Settings</label>
          <div class="voice-settings">
            <div class="form-group">
              <label for="voice-type">Voice Type</label>
              <select id="voice-type" class="form-select">
                <option value="child">Child</option>
                <option value="teen">Teen</option>
                <option value="adult-female">Adult Female</option>
                <option value="adult-male">Adult Male</option>
                <option value="elderly">Elderly</option>
                <option value="robotic">Robotic</option>
              </select>
            </div>
            <div class="form-group">
              <label for="voice-pitch">Pitch</label>
              <input type="range" id="voice-pitch" min="0.5" max="2" step="0.1" value="1">
            </div>
            <div class="form-group">
              <label for="voice-speed">Speed</label>
              <input type="range" id="voice-speed" min="0.5" max="2" step="0.1" value="1">
            </div>
          </div>
        </div>

        <div class="form-section">
          <label class="form-label">Mood Settings</label>
          <select id="default-mood" class="form-select">
            <option value="happy">Happy</option>
            <option value="excited">Excited</option>
            <option value="calm">Calm</option>
            <option value="thoughtful">Thoughtful</option>
            <option value="playful">Playful</option>
          </select>
        </div>
      </div>
    `;
  }

  /**
   * Render education editing tab
   */
  renderEducationTab() {
    return `
      <div class="tab-content education-tab">
        <h4>Educational Settings</h4>
        
        <div class="form-section">
          <label class="form-label">Teaching Level</label>
          <select id="teaching-level" class="form-select">
            <option value="preschool">Preschool (Ages 3-5)</option>
            <option value="elementary">Elementary (Ages 6-8)</option>
            <option value="intermediate">Intermediate (Ages 9-11)</option>
            <option value="advanced">Advanced (Ages 12+)</option>
          </select>
        </div>

        <div class="form-section">
          <label class="form-label">Specialties</label>
          <div class="specialties-input">
            <input type="text" id="specialty-input" placeholder="Add a specialty..." class="form-input">
            <button class="btn-secondary btn-small" id="add-specialty">Add</button>
          </div>
          <div class="specialties-list" id="specialties-list">
            <!-- Specialties will be listed here -->
          </div>
        </div>

        <div class="form-section">
          <label class="form-label">Teaching Style</label>
          <textarea id="teaching-style" class="form-textarea" rows="3" 
                    placeholder="Describe the character's teaching approach..."></textarea>
        </div>

        <div class="form-section">
          <label class="form-label">Fun Facts</label>
          <div class="fun-facts-input">
            <input type="text" id="fun-fact-input" placeholder="Add a fun fact..." class="form-input">
            <button class="btn-secondary btn-small" id="add-fun-fact">Add</button>
          </div>
          <div class="fun-facts-list" id="fun-facts-list">
            <!-- Fun facts will be listed here -->
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render interactions editing tab
   */
  renderInteractionsTab() {
    return `
      <div class="tab-content interactions-tab">
        <h4>Character Interactions</h4>
        
        <div class="form-section">
          <label class="form-label">Greeting Messages</label>
          <div class="message-list" id="greeting-messages">
            <div class="message-input-group">
              <textarea class="message-input" placeholder="Enter greeting message..."></textarea>
              <button class="btn-small add-message" data-type="greeting">Add</button>
            </div>
          </div>
        </div>

        <div class="form-section">
          <label class="form-label">Encouragement Messages</label>
          <div class="message-list" id="encouragement-messages">
            <div class="message-input-group">
              <textarea class="message-input" placeholder="Enter encouragement message..."></textarea>
              <button class="btn-small add-message" data-type="encouragement">Add</button>
            </div>
          </div>
        </div>

        <div class="form-section">
          <label class="form-label">Celebration Messages</label>
          <div class="message-list" id="celebration-messages">
            <div class="message-input-group">
              <textarea class="message-input" placeholder="Enter celebration message..."></textarea>
              <button class="btn-small add-message" data-type="celebration">Add</button>
            </div>
          </div>
        </div>

        <div class="form-section">
          <label class="form-label">Hint Messages</label>
          <div class="message-list" id="hint-messages">
            <div class="message-input-group">
              <textarea class="message-input" placeholder="Enter hint message..."></textarea>
              <button class="btn-small add-message" data-type="hint">Add</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render animations editing tab
   */
  renderAnimationsTab() {
    return `
      <div class="tab-content animations-tab">
        <h4>Animation Settings</h4>
        
        <div class="form-section">
          <label class="form-label">Idle Animation</label>
          <select id="idle-animation" class="form-select">
            <option value="none">None</option>
            <option value="float">Gentle Float</option>
            <option value="breathe">Breathing</option>
            <option value="sway">Swaying</option>
            <option value="bounce">Subtle Bounce</option>
          </select>
        </div>

        <div class="form-section">
          <label class="form-label">Interaction Animations</label>
          <div class="animation-settings">
            <div class="form-group">
              <label for="click-animation">On Click</label>
              <select id="click-animation" class="form-select">
                <option value="bounce">Bounce</option>
                <option value="spin">Spin</option>
                <option value="shake">Shake</option>
                <option value="grow">Grow</option>
              </select>
            </div>
            <div class="form-group">
              <label for="hover-animation">On Hover</label>
              <select id="hover-animation" class="form-select">
                <option value="glow">Glow</option>
                <option value="lift">Lift</option>
                <option value="wiggle">Wiggle</option>
                <option value="pulse">Pulse</option>
              </select>
            </div>
          </div>
        </div>

        <div class="form-section">
          <label class="form-label">Expression Animations</label>
          <div class="expression-animations">
            ${['happy', 'excited', 'thinking', 'surprised']
              .map(
                expression => `
              <div class="form-group">
                <label for="${expression}-animation">${expression.charAt(0).toUpperCase() + expression.slice(1)}</label>
                <select id="${expression}-animation" class="form-select">
                  <option value="default">Default</option>
                  <option value="enhanced">Enhanced</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <div class="form-section">
          <label class="checkbox-label">
            <input type="checkbox" id="enable-particles">
            Enable particle effects
          </label>
          <label class="checkbox-label">
            <input type="checkbox" id="enable-sound-effects">
            Enable sound effects
          </label>
        </div>
      </div>
    `;
  }

  /**
   * Render metadata/advanced editing tab
   */
  renderMetadataTab() {
    return `
      <div class="tab-content metadata-tab">
        <h4>Advanced Settings</h4>
        
        <div class="form-section">
          <label class="form-label">Character ID</label>
          <input type="text" id="character-id" class="form-input" readonly>
        </div>

        <div class="form-section">
          <label class="form-label">Tags</label>
          <div class="tags-input">
            <input type="text" id="tag-input" placeholder="Add tags..." class="form-input">
            <button class="btn-secondary btn-small" id="add-tag">Add</button>
          </div>
          <div class="tags-list" id="tags-list">
            <!-- Tags will be listed here -->
          </div>
        </div>

        <div class="form-section">
          <label class="form-label">Custom Attributes</label>
          <div class="json-editor">
            <textarea id="custom-attributes" class="code-editor" rows="10" 
                      placeholder='{"customField": "value"}'></textarea>
          </div>
        </div>

        <div class="form-section">
          <label class="form-label">Character Data (JSON)</label>
          <div class="json-viewer">
            <button class="btn-secondary" id="view-json">View Full JSON</button>
            <button class="btn-secondary" id="validate-json">Validate</button>
          </div>
        </div>

        <div class="form-section danger-zone">
          <h5>Danger Zone</h5>
          <button class="btn-danger" id="reset-character">Reset to Original</button>
          <button class="btn-danger" id="delete-character">Delete Character</button>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    super.attachEventListeners();

    if (!this.element) return;

    // Header actions
    this.element.querySelector('#editor-undo')?.addEventListener('click', () => this.undo());
    this.element.querySelector('#editor-redo')?.addEventListener('click', () => this.redo());
    this.element
      .querySelector('#editor-compare')
      ?.addEventListener('click', () => this.compareWithOriginal());
    this.element.querySelector('#editor-save')?.addEventListener('click', () => this.saveChanges());
    this.element.querySelector('#editor-close')?.addEventListener('click', () => this.close());

    // Character selection
    this.element.querySelector('#character-list')?.addEventListener('click', e => {
      const item = e.target.closest('.character-item');
      if (item) {
        const characterId = item.dataset.characterId;
        this.selectCharacter(characterId);
      }
    });

    // Search
    this.element.querySelector('#character-search')?.addEventListener('input', e => {
      this.filterCharacters(e.target.value);
    });

    // Import/Export
    this.element
      .querySelector('#import-character')
      ?.addEventListener('click', () => this.importCharacter());
    this.element
      .querySelector('#export-character')
      ?.addEventListener('click', () => this.exportCharacter());

    // Tab switching
    this.element.querySelectorAll('.editor-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchTab(tab.dataset.tab);
      });
    });

    // Auto-save toggle
    this.element.querySelector('#auto-save')?.addEventListener('change', e => {
      this.autoSave = e.target.checked;
      if (this.autoSave) {
        this.setupAutoSave();
      } else {
        this.clearAutoSave();
      }
    });

    // Preview controls
    this.element.querySelector('#preview-theme')?.addEventListener('change', e => {
      this.updatePreviewTheme(e.target.value);
    });

    this.element.querySelector('#preview-expression')?.addEventListener('change', e => {
      this.updatePreviewExpression(e.target.value);
    });

    // Attach tab-specific listeners
    this.attachTabListeners();

    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
  }

  /**
   * Attach tab-specific event listeners
   */
  attachTabListeners() {
    // Appearance tab
    this.attachAppearanceListeners();

    // Personality tab
    this.attachPersonalityListeners();

    // Education tab
    this.attachEducationListeners();

    // Interactions tab
    this.attachInteractionsListeners();

    // Animations tab
    this.attachAnimationsListeners();

    // Metadata tab
    this.attachMetadataListeners();
  }

  /**
   * Select a character for editing
   */
  async selectCharacter(characterId) {
    const character = this.characters.find(c => c.id === characterId);
    if (!character) return;

    // Save current changes if any
    if (this.hasUnsavedChanges) {
      const shouldSave = await this.confirmUnsavedChanges();
      if (!shouldSave) return;
    }

    // Set selected character
    this.selectedCharacter = JSON.parse(JSON.stringify(character)); // Deep clone
    this.originalCharacter = JSON.parse(JSON.stringify(character)); // Keep original for comparison

    // Reset edit history
    this.editHistory = [JSON.parse(JSON.stringify(character))];
    this.historyIndex = 0;
    this.hasUnsavedChanges = false;

    // Update UI
    this.updateCharacterList();
    this.populateEditorFields();
    this.updatePreview();
    this.updateSaveStatus('saved');

    // Enable/disable buttons
    this.element.querySelector('#export-character').disabled = false;
    this.element.querySelector('#editor-save').disabled = true;

    // Emit selection event
    characterEvents.emit('characterSelected', { character: this.selectedCharacter });
  }

  /**
   * Update preview with current character data
   */
  updatePreview() {
    if (!this.selectedCharacter || !this.previewRenderer) return;

    const previewContainer = this.element.querySelector('#editor-preview');
    if (!previewContainer) return;

    // Clear existing preview
    previewContainer.innerHTML = '';

    // Get current theme and expression
    const theme = this.element.querySelector('#preview-theme')?.value || 'educational';
    const expression = this.element.querySelector('#preview-expression')?.value || 'happy';

    // Update renderer theme
    this.previewRenderer.theme = theme;

    // Render character with expression
    this.previewRenderer.renderWithExpression(previewContainer, this.selectedCharacter, expression);

    // Update preview info
    this.updatePreviewInfo();
  }

  /**
   * Update preview info panel
   */
  updatePreviewInfo() {
    const infoContainer = this.element.querySelector('#preview-info');
    if (!infoContainer || !this.selectedCharacter) return;

    infoContainer.innerHTML = `
      <div class="preview-details">
        <div class="detail-item">
          <span class="detail-label">Name:</span>
          <span class="detail-value">${this.selectedCharacter.name || 'Unnamed'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Subject:</span>
          <span class="detail-value">${this.selectedCharacter.subject || 'None'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Personality:</span>
          <span class="detail-value">${this.selectedCharacter.personality?.type || 'Not set'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Last Modified:</span>
          <span class="detail-value">${new Date(this.selectedCharacter.metadata?.lastModified || Date.now()).toLocaleDateString()}</span>
        </div>
      </div>
    `;
  }

  /**
   * Record a change for undo/redo
   */
  recordChange() {
    if (!this.selectedCharacter) return;

    // Remove any redo states
    this.editHistory = this.editHistory.slice(0, this.historyIndex + 1);

    // Add new state
    const newState = JSON.parse(JSON.stringify(this.selectedCharacter));
    this.editHistory.push(newState);
    this.historyIndex++;

    // Limit history size
    if (this.editHistory.length > 50) {
      this.editHistory.shift();
      this.historyIndex--;
    }

    // Update UI
    this.hasUnsavedChanges = true;
    this.updateUndoRedoButtons();
    this.updateSaveButton();
    this.updateSaveStatus('unsaved');

    // Trigger change callback
    this.onChange(this.selectedCharacter);
  }

  /**
   * Undo last change
   */
  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.selectedCharacter = JSON.parse(JSON.stringify(this.editHistory[this.historyIndex]));
      this.populateEditorFields();
      this.updatePreview();
      this.updateUndoRedoButtons();
    }
  }

  /**
   * Redo last undone change
   */
  redo() {
    if (this.historyIndex < this.editHistory.length - 1) {
      this.historyIndex++;
      this.selectedCharacter = JSON.parse(JSON.stringify(this.editHistory[this.historyIndex]));
      this.populateEditorFields();
      this.updatePreview();
      this.updateUndoRedoButtons();
    }
  }

  /**
   * Update undo/redo button states
   */
  updateUndoRedoButtons() {
    const undoBtn = this.element.querySelector('#editor-undo');
    const redoBtn = this.element.querySelector('#editor-redo');

    if (undoBtn) undoBtn.disabled = this.historyIndex <= 0;
    if (redoBtn) redoBtn.disabled = this.historyIndex >= this.editHistory.length - 1;
  }

  /**
   * Save character changes
   */
  async saveChanges() {
    if (!this.selectedCharacter || !this.hasUnsavedChanges) return;

    try {
      // Validate character
      const validation = await CharacterGenerationAPI.validateCharacter(this.selectedCharacter);
      if (!validation.isValid) {
        this.showValidationErrors(validation.errors);
        return;
      }

      // Update metadata
      this.selectedCharacter.metadata = {
        ...this.selectedCharacter.metadata,
        lastModified: new Date().toISOString(),
        version: (this.selectedCharacter.metadata?.version || 0) + 1,
      };

      // Save to storage
      const result = await CharacterGenerationAPI.updateCharacter(this.selectedCharacter);

      if (result.success) {
        // Update original reference
        this.originalCharacter = JSON.parse(JSON.stringify(this.selectedCharacter));

        // Update in characters list
        const index = this.characters.findIndex(c => c.id === this.selectedCharacter.id);
        if (index >= 0) {
          this.characters[index] = JSON.parse(JSON.stringify(this.selectedCharacter));
        }

        // Reset save state
        this.hasUnsavedChanges = false;
        this.updateSaveStatus('saved');
        this.updateSaveButton();

        // Emit save event
        characterEvents.emit('characterUpdated', { character: this.selectedCharacter });
        this.onSave(this.selectedCharacter);

        // Show success message
        this.showNotification('Character saved successfully!', 'success');
      } else {
        throw new Error(result.error || 'Failed to save character');
      }
    } catch (error) {
      console.error('❌ Save failed:', error);
      this.showNotification(`Save failed: ${error.message}`, 'error');
    }
  }

  /**
   * Set up auto-save functionality
   */
  setupAutoSave() {
    this.clearAutoSave();

    this.autoSaveTimer = setInterval(() => {
      if (this.hasUnsavedChanges) {
        this.saveChanges();
      }
    }, 30000); // Auto-save every 30 seconds
  }

  /**
   * Clear auto-save timer
   */
  clearAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboardShortcuts(e) {
    if (!this.element || !this.element.contains(document.activeElement)) return;

    // Ctrl/Cmd + Z: Undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      this.undo();
    }

    // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z: Redo
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      this.redo();
    }

    // Ctrl/Cmd + S: Save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      this.saveChanges();
    }
  }

  /**
   * Close the editor
   */
  async close() {
    if (this.hasUnsavedChanges) {
      const shouldClose = await this.confirmUnsavedChanges();
      if (!shouldClose) return;
    }

    this.clearAutoSave();
    this.onCancel();

    // Clean up
    if (this.element) {
      this.element.remove();
    }
  }

  /**
   * Helper method to render shape previews
   */
  renderShapePreview(shape) {
    const shapes = {
      circle: '<circle cx="20" cy="20" r="15" fill="currentColor"/>',
      oval: '<ellipse cx="20" cy="20" rx="15" ry="10" fill="currentColor"/>',
      square: '<rect x="5" y="5" width="30" height="30" rx="2" fill="currentColor"/>',
      triangle: '<polygon points="20,5 35,30 5,30" fill="currentColor"/>',
      hexagon: '<polygon points="20,5 32,12 32,28 20,35 8,28 8,12" fill="currentColor"/>',
    };
    return shapes[shape] || shapes.circle;
  }

  /**
   * Show notification message
   */
  showNotification(message, type = 'info') {
    // Implementation would show a toast notification
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  /**
   * Update save status indicator
   */
  updateSaveStatus(status) {
    const statusElement = this.element.querySelector('#save-status');
    if (!statusElement) return;

    const statusConfig = {
      saved: { icon: '✓', text: 'All changes saved', class: 'saved' },
      unsaved: { icon: '●', text: 'Unsaved changes', class: 'unsaved' },
      saving: { icon: '⟳', text: 'Saving...', class: 'saving' },
      error: { icon: '✕', text: 'Save failed', class: 'error' },
    };

    const config = statusConfig[status] || statusConfig.saved;

    statusElement.className = `status-indicator ${config.class}`;
    statusElement.querySelector('.status-icon').textContent = config.icon;
    statusElement.querySelector('.status-text').textContent = config.text;
  }

  /**
   * Update save button state
   */
  updateSaveButton() {
    const saveBtn = this.element.querySelector('#editor-save');
    if (saveBtn) {
      saveBtn.disabled = !this.hasUnsavedChanges || !this.selectedCharacter;
    }
  }

  /**
   * Placeholder methods for tab-specific functionality
   * These would be implemented with actual editing logic
   */

  attachAppearanceListeners() {
    // Shape selection
    this.element.querySelectorAll('.shape-option').forEach(option => {
      option.addEventListener('click', () => {
        const shape = option.dataset.shape;
        if (this.selectedCharacter && shape) {
          this.selectedCharacter.appearance.shape = shape;
          this.updateShapeSelection();
          this.recordChange();
          this.updatePreview();
        }
      });
    });

    // Color pickers
    this.element.querySelectorAll('.color-picker').forEach(picker => {
      picker.addEventListener('change', e => {
        const colorType = e.target.id.replace('color-', '');
        if (this.selectedCharacter && colorType) {
          const colorKey = colorType + 'Color';
          this.selectedCharacter.appearance[colorKey] = e.target.value;
          this.recordChange();
          this.updatePreview();
        }
      });
    });

    // Eye shape selection
    const eyeShapeSelect = this.element.querySelector('#eye-shape');
    if (eyeShapeSelect) {
      eyeShapeSelect.addEventListener('change', e => {
        if (this.selectedCharacter) {
          this.selectedCharacter.appearance.eyes.shape = e.target.value;
          this.recordChange();
          this.updatePreview();
        }
      });
    }

    // Mouth shape selection
    const mouthShapeSelect = this.element.querySelector('#mouth-shape');
    if (mouthShapeSelect) {
      mouthShapeSelect.addEventListener('change', e => {
        if (this.selectedCharacter) {
          this.selectedCharacter.appearance.mouth.shape = e.target.value;
          this.recordChange();
          this.updatePreview();
        }
      });
    }
  }

  attachPersonalityListeners() {
    // Personality type
    const personalitySelect = this.element.querySelector('#personality-type');
    if (personalitySelect) {
      personalitySelect.addEventListener('change', e => {
        if (this.selectedCharacter) {
          this.selectedCharacter.personality.type = e.target.value;
          this.recordChange();
        }
      });
    }

    // Traits checkboxes
    this.element.querySelectorAll('.trait-option input').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        if (this.selectedCharacter) {
          const selectedTraits = Array.from(
            this.element.querySelectorAll('.trait-option input:checked')
          ).map(cb => cb.value);
          this.selectedCharacter.personality.traits = selectedTraits;
          this.recordChange();
        }
      });
    });

    // Voice pitch slider
    const voicePitch = this.element.querySelector('#voice-pitch');
    if (voicePitch) {
      voicePitch.addEventListener('input', e => {
        if (this.selectedCharacter) {
          this.selectedCharacter.personality.voice = {
            ...this.selectedCharacter.personality.voice,
            pitch: e.target.value,
          };
          this.recordChange();
        }
      });
    }

    // Voice speed slider
    const voiceSpeed = this.element.querySelector('#voice-speed');
    if (voiceSpeed) {
      voiceSpeed.addEventListener('input', e => {
        if (this.selectedCharacter) {
          this.selectedCharacter.personality.voice = {
            ...this.selectedCharacter.personality.voice,
            speed: e.target.value,
          };
          this.recordChange();
        }
      });
    }

    // Speech pattern
    const speechPattern = this.element.querySelector('#speech-pattern');
    if (speechPattern) {
      speechPattern.addEventListener('change', e => {
        if (this.selectedCharacter) {
          this.selectedCharacter.personality.voice = {
            ...this.selectedCharacter.personality.voice,
            pattern: e.target.value,
          };
          this.recordChange();
        }
      });
    }
  }

  attachEducationListeners() {
    // Teaching level
    const teachingLevel = this.element.querySelector('#teaching-level');
    if (teachingLevel) {
      teachingLevel.addEventListener('change', e => {
        if (this.selectedCharacter) {
          this.selectedCharacter.educationalContent.level = e.target.value;
          this.recordChange();
        }
      });
    }

    // Age range sliders
    const ageMin = this.element.querySelector('#age-range-min');
    const ageMax = this.element.querySelector('#age-range-max');

    if (ageMin) {
      ageMin.addEventListener('input', e => {
        if (this.selectedCharacter) {
          this.selectedCharacter.educationalContent.ageRange[0] = parseInt(e.target.value);
          this.recordChange();
        }
      });
    }

    if (ageMax) {
      ageMax.addEventListener('input', e => {
        if (this.selectedCharacter) {
          this.selectedCharacter.educationalContent.ageRange[1] = parseInt(e.target.value);
          this.recordChange();
        }
      });
    }

    // Specialties checkboxes
    this.element.querySelectorAll('.specialty-option input').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        if (this.selectedCharacter) {
          const selectedSpecialties = Array.from(
            this.element.querySelectorAll('.specialty-option input:checked')
          ).map(cb => cb.value);
          this.selectedCharacter.educationalContent.specialties = selectedSpecialties;
          this.recordChange();
        }
      });
    });

    // Teaching method
    const teachingMethod = this.element.querySelector('#teaching-method');
    if (teachingMethod) {
      teachingMethod.addEventListener('change', e => {
        if (this.selectedCharacter) {
          this.selectedCharacter.educationalContent.teachingMethod = e.target.value;
          this.recordChange();
        }
      });
    }
  }

  attachInteractionsListeners() {
    // Add message buttons
    this.element.querySelectorAll('.add-message').forEach(button => {
      button.addEventListener('click', e => {
        const messageType = e.target.dataset.type;
        const input = e.target.previousElementSibling;
        if (input && input.value.trim() && this.selectedCharacter) {
          if (!this.selectedCharacter.interactions[messageType + 'Messages']) {
            this.selectedCharacter.interactions[messageType + 'Messages'] = [];
          }
          this.selectedCharacter.interactions[messageType + 'Messages'].push(input.value.trim());
          input.value = '';
          this.updateMessageList(messageType);
          this.recordChange();
        }
      });
    });

    // Interactive checkbox
    const isInteractive = this.element.querySelector('#is-interactive');
    if (isInteractive) {
      isInteractive.addEventListener('change', e => {
        if (this.selectedCharacter) {
          this.selectedCharacter.interactions.isInteractive = e.target.checked;
          this.recordChange();
        }
      });
    }

    // Responds to clicks checkbox
    const respondsToClicks = this.element.querySelector('#responds-to-clicks');
    if (respondsToClicks) {
      respondsToClicks.addEventListener('change', e => {
        if (this.selectedCharacter) {
          this.selectedCharacter.interactions.respondsToClicks = e.target.checked;
          this.recordChange();
        }
      });
    }
  }

  attachAnimationsListeners() {
    // Idle animation
    const idleAnimation = this.element.querySelector('#idle-animation');
    if (idleAnimation) {
      idleAnimation.addEventListener('change', e => {
        if (this.selectedCharacter) {
          if (!this.selectedCharacter.animations) {
            this.selectedCharacter.animations = {};
          }
          this.selectedCharacter.animations.idle = e.target.value;
          this.recordChange();
        }
      });
    }

    // Click animation
    const clickAnimation = this.element.querySelector('#click-animation');
    if (clickAnimation) {
      clickAnimation.addEventListener('change', e => {
        if (this.selectedCharacter) {
          if (!this.selectedCharacter.animations) {
            this.selectedCharacter.animations = {};
          }
          this.selectedCharacter.animations.click = e.target.value;
          this.recordChange();
        }
      });
    }

    // Hover animation
    const hoverAnimation = this.element.querySelector('#hover-animation');
    if (hoverAnimation) {
      hoverAnimation.addEventListener('change', e => {
        if (this.selectedCharacter) {
          if (!this.selectedCharacter.animations) {
            this.selectedCharacter.animations = {};
          }
          this.selectedCharacter.animations.hover = e.target.value;
          this.recordChange();
        }
      });
    }

    // Enable particles checkbox
    const enableParticles = this.element.querySelector('#enable-particles');
    if (enableParticles) {
      enableParticles.addEventListener('change', e => {
        if (this.selectedCharacter) {
          if (!this.selectedCharacter.animations) {
            this.selectedCharacter.animations = {};
          }
          this.selectedCharacter.animations.enableParticles = e.target.checked;
          this.recordChange();
        }
      });
    }

    // Enable sound effects checkbox
    const enableSound = this.element.querySelector('#enable-sound-effects');
    if (enableSound) {
      enableSound.addEventListener('change', e => {
        if (this.selectedCharacter) {
          if (!this.selectedCharacter.animations) {
            this.selectedCharacter.animations = {};
          }
          this.selectedCharacter.animations.enableSoundEffects = e.target.checked;
          this.recordChange();
        }
      });
    }
  }

  attachMetadataListeners() {
    // Add tag button
    const addTagBtn = this.element.querySelector('#add-tag');
    const tagInput = this.element.querySelector('#tag-input');

    if (addTagBtn && tagInput) {
      const addTag = () => {
        const tag = tagInput.value.trim();
        if (tag && this.selectedCharacter) {
          if (!this.selectedCharacter.metadata.tags) {
            this.selectedCharacter.metadata.tags = [];
          }
          if (!this.selectedCharacter.metadata.tags.includes(tag)) {
            this.selectedCharacter.metadata.tags.push(tag);
            this.updateTagsList();
            tagInput.value = '';
            this.recordChange();
          }
        }
      };

      addTagBtn.addEventListener('click', addTag);
      tagInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addTag();
        }
      });
    }

    // View JSON button
    const viewJsonBtn = this.element.querySelector('#view-json');
    if (viewJsonBtn) {
      viewJsonBtn.addEventListener('click', () => {
        this.showCharacterJSON();
      });
    }

    // Validate JSON button
    const validateBtn = this.element.querySelector('#validate-json');
    if (validateBtn) {
      validateBtn.addEventListener('click', async () => {
        if (this.selectedCharacter) {
          const validation = await CharacterGenerationAPI.validateCharacter(this.selectedCharacter);
          if (validation.isValid) {
            this.showNotification('Character data is valid!', 'success');
          } else {
            this.showValidationErrors(validation.errors);
          }
        }
      });
    }

    // Custom attributes editor
    const customAttrs = this.element.querySelector('#custom-attributes');
    if (customAttrs) {
      customAttrs.addEventListener('blur', () => {
        try {
          const customData = customAttrs.value.trim() ? JSON.parse(customAttrs.value) : {};
          if (this.selectedCharacter) {
            this.selectedCharacter.metadata.customAttributes = customData;
            this.recordChange();
          }
        } catch (error) {
          this.showNotification('Invalid JSON in custom attributes', 'error');
        }
      });
    }

    // Reset character button
    const resetBtn = this.element.querySelector('#reset-character');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetCharacter();
      });
    }

    // Delete character button
    const deleteBtn = this.element.querySelector('#delete-character');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        this.deleteCharacter();
      });
    }
  }

  filterCharacters(searchTerm) {
    const characterItems = this.element.querySelectorAll('.character-item');
    const lowerSearch = searchTerm.toLowerCase();

    characterItems.forEach(item => {
      const character = this.characters.find(c => c.id === item.dataset.characterId);
      if (character) {
        const matches =
          character.name.toLowerCase().includes(lowerSearch) ||
          character.subject.toLowerCase().includes(lowerSearch) ||
          (character.personality?.traits || []).some(trait =>
            trait.toLowerCase().includes(lowerSearch)
          );

        item.style.display = matches ? 'flex' : 'none';
      }
    });
  }

  importCharacter() {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const character = JSON.parse(text);

        // Validate imported character
        const validation = await CharacterGenerationAPI.validateCharacter(character);
        if (!validation.isValid) {
          this.showValidationErrors(validation.errors);
          return;
        }

        // Generate new ID if importing
        character.id = CharacterUtils.generateId();
        character.metadata = {
          ...character.metadata,
          created: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          version: 1,
        };

        // Save character
        const result = await CharacterGenerationAPI.saveCharacter(character);
        if (result.success) {
          this.characters.push(character);
          this.updateCharacterList();
          this.selectCharacter(character.id);
          this.showNotification('Character imported successfully!', 'success');
        }
      } catch (error) {
        console.error('❌ Import failed:', error);
        this.showNotification(`Import failed: ${error.message}`, 'error');
      }
    });

    input.click();
  }

  exportCharacter() {
    if (!this.selectedCharacter) return;

    try {
      // Create clean copy for export
      const exportData = JSON.parse(JSON.stringify(this.selectedCharacter));

      // Create blob and download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportData.name.replace(/\s+/g, '-').toLowerCase()}-character.json`;
      a.click();

      URL.revokeObjectURL(url);

      this.showNotification('Character exported successfully!', 'success');
    } catch (error) {
      console.error('❌ Export failed:', error);
      this.showNotification(`Export failed: ${error.message}`, 'error');
    }
  }

  switchTab(tabId) {
    this.currentTab = tabId;

    // Update tab buttons
    this.element.querySelectorAll('.editor-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabId);
    });

    // Update tab panels
    this.element.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `${tabId}-tab`);
    });
  }

  /**
   * Populate editor fields with character data
   */
  populateEditorFields() {
    if (!this.selectedCharacter) return;

    // Character name
    const nameInput = this.element.querySelector('#character-name');
    if (nameInput) nameInput.value = this.selectedCharacter.name || '';

    // Subject
    const subjectSelect = this.element.querySelector('#character-subject');
    if (subjectSelect) subjectSelect.value = this.selectedCharacter.subject || '';

    // Appearance tab
    const shapeOptions = this.element.querySelectorAll('.shape-option');
    shapeOptions.forEach(option => {
      option.classList.toggle(
        'selected',
        option.dataset.shape === this.selectedCharacter.appearance?.shape
      );
    });

    // Color pickers
    if (this.selectedCharacter.appearance) {
      const primaryColor = this.element.querySelector('#color-primary');
      const secondaryColor = this.element.querySelector('#color-secondary');
      const accentColor = this.element.querySelector('#color-accent');

      if (primaryColor) primaryColor.value = this.selectedCharacter.appearance.primaryColor;
      if (secondaryColor) secondaryColor.value = this.selectedCharacter.appearance.secondaryColor;
      if (accentColor) accentColor.value = this.selectedCharacter.appearance.accentColor;
    }

    // Personality fields
    const personalityType = this.element.querySelector('#personality-type');
    if (personalityType && this.selectedCharacter.personality) {
      personalityType.value = this.selectedCharacter.personality.type;
    }

    // Update traits
    this.element.querySelectorAll('.trait-option input').forEach(checkbox => {
      checkbox.checked =
        this.selectedCharacter.personality?.traits?.includes(checkbox.value) || false;
    });

    // Education fields
    const teachingLevel = this.element.querySelector('#teaching-level');
    if (teachingLevel && this.selectedCharacter.educationalContent) {
      teachingLevel.value = this.selectedCharacter.educationalContent.level;
    }

    // Character ID
    const characterId = this.element.querySelector('#character-id');
    if (characterId) {
      characterId.value = this.selectedCharacter.id;
    }

    // Custom attributes
    const customAttrs = this.element.querySelector('#custom-attributes');
    if (customAttrs && this.selectedCharacter.metadata?.customAttributes) {
      customAttrs.value = JSON.stringify(this.selectedCharacter.metadata.customAttributes, null, 2);
    }

    // Update tags list
    this.updateTagsList();
  }

  /**
   * Update character list UI
   */
  updateCharacterList() {
    const listContainer = this.element.querySelector('#character-list');
    if (!listContainer) return;

    listContainer.innerHTML = this.characters
      .map(
        character => `
      <div class="character-item ${character.id === this.selectedCharacter?.id ? 'selected' : ''}" 
           data-character-id="${character.id}">
        <div class="character-avatar" style="background: ${character.appearance?.primaryColor || '#4A90E2'}">
          ${character.name?.charAt(0).toUpperCase() || '?'}
        </div>
        <div class="character-info">
          <div class="character-name">${character.name || 'Unnamed'}</div>
          <div class="character-subject">${character.subject || 'No subject'}</div>
        </div>
      </div>
    `
      )
      .join('');
  }

  /**
   * Update shape selection UI
   */
  updateShapeSelection() {
    const shapeOptions = this.element.querySelectorAll('.shape-option');
    shapeOptions.forEach(option => {
      option.classList.toggle(
        'selected',
        option.dataset.shape === this.selectedCharacter?.appearance?.shape
      );
    });
  }

  /**
   * Update message list for a specific type
   */
  updateMessageList(messageType) {
    const listContainer = this.element.querySelector(`#${messageType}-messages`);
    if (!listContainer || !this.selectedCharacter) return;

    const messages = this.selectedCharacter.interactions[messageType + 'Messages'] || [];

    listContainer.innerHTML =
      messages
        .map(
          (message, index) => `
      <div class="message-item">
        <span class="message-text">${message}</span>
        <button class="btn-tertiary btn-small remove-message" 
                data-type="${messageType}" 
                data-index="${index}">✕</button>
      </div>
    `
        )
        .join('') +
      `
      <div class="message-input-group">
        <textarea class="message-input" placeholder="Enter ${messageType} message..."></textarea>
        <button class="btn-small add-message" data-type="${messageType}">Add</button>
      </div>
    `;

    // Re-attach listeners for new remove buttons
    listContainer.querySelectorAll('.remove-message').forEach(btn => {
      btn.addEventListener('click', e => {
        const type = e.target.dataset.type;
        const index = parseInt(e.target.dataset.index);
        this.selectedCharacter.interactions[type + 'Messages'].splice(index, 1);
        this.updateMessageList(type);
        this.recordChange();
      });
    });
  }

  /**
   * Update tags list UI
   */
  updateTagsList() {
    const tagsContainer = this.element.querySelector('#tags-list');
    if (!tagsContainer || !this.selectedCharacter) return;

    const tags = this.selectedCharacter.metadata?.tags || [];

    tagsContainer.innerHTML = tags
      .map(
        (tag, index) => `
      <span class="tag-item">
        ${tag}
        <button class="btn-tertiary btn-small remove-tag" data-index="${index}">✕</button>
      </span>
    `
      )
      .join('');

    // Attach remove listeners
    tagsContainer.querySelectorAll('.remove-tag').forEach(btn => {
      btn.addEventListener('click', e => {
        const index = parseInt(e.target.dataset.index);
        this.selectedCharacter.metadata.tags.splice(index, 1);
        this.updateTagsList();
        this.recordChange();
      });
    });
  }

  /**
   * Update preview theme
   */
  updatePreviewTheme(theme) {
    if (this.previewRenderer) {
      this.previewRenderer.theme = theme;
      this.updatePreview();
    }
  }

  /**
   * Update preview expression
   */
  updatePreviewExpression(_expression) {
    this.updatePreview(); // Expression is passed in updatePreview method
  }

  /**
   * Show character JSON in modal
   */
  showCharacterJSON() {
    if (!this.selectedCharacter) return;

    const modal = new Modal({
      title: 'Character JSON Data',
      content: `
        <pre style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; overflow: auto; max-height: 400px;">
${JSON.stringify(this.selectedCharacter, null, 2)}
        </pre>
      `,
      buttons: [
        {
          text: 'Copy to Clipboard',
          className: 'btn-primary',
          onClick: () => {
            navigator.clipboard.writeText(JSON.stringify(this.selectedCharacter, null, 2));
            this.showNotification('JSON copied to clipboard!', 'success');
          },
        },
        {
          text: 'Close',
          className: 'btn-secondary',
          onClick: modal => modal.close(),
        },
      ],
    });

    modal.show();
  }

  /**
   * Show validation errors
   */
  showValidationErrors(errors) {
    const errorList = errors.map(err => `• ${err.field}: ${err.message}`).join('\n');

    const modal = new Modal({
      title: 'Validation Errors',
      content: `
        <div class="validation-errors">
          <p>The character data has the following validation errors:</p>
          <pre style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px;">
${errorList}
          </pre>
        </div>
      `,
      buttons: [
        {
          text: 'OK',
          className: 'btn-primary',
          onClick: modal => modal.close(),
        },
      ],
    });

    modal.show();
  }

  /**
   * Compare with original character
   */
  compareWithOriginal() {
    if (!this.selectedCharacter || !this.originalCharacter) return;

    // Simple diff display - in production would use a proper diff library
    const currentJSON = JSON.stringify(this.selectedCharacter, null, 2);
    const originalJSON = JSON.stringify(this.originalCharacter, null, 2);

    const modal = new Modal({
      title: 'Compare Changes',
      content: `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <h4>Current</h4>
            <pre style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; overflow: auto; max-height: 400px;">
${currentJSON}
            </pre>
          </div>
          <div>
            <h4>Original</h4>
            <pre style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; overflow: auto; max-height: 400px;">
${originalJSON}
            </pre>
          </div>
        </div>
      `,
      buttons: [
        {
          text: 'Close',
          className: 'btn-primary',
          onClick: modal => modal.close(),
        },
      ],
    });

    modal.show();
  }

  /**
   * Reset character to original state
   */
  async resetCharacter() {
    if (!this.originalCharacter) return;

    const confirmed = await this.confirm(
      'Reset Character',
      'Are you sure you want to reset this character to its original state? All unsaved changes will be lost.'
    );

    if (confirmed) {
      this.selectedCharacter = JSON.parse(JSON.stringify(this.originalCharacter));
      this.populateEditorFields();
      this.updatePreview();
      this.hasUnsavedChanges = false;
      this.updateSaveStatus('saved');
      this.updateSaveButton();
      this.showNotification('Character reset to original state', 'info');
    }
  }

  /**
   * Delete character
   */
  async deleteCharacter() {
    if (!this.selectedCharacter) return;

    const confirmed = await this.confirm(
      'Delete Character',
      `Are you sure you want to permanently delete "${this.selectedCharacter.name}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        // Remove from storage
        const characters = CharacterGenerationAPI.loadAllCharacters();
        const filtered = characters.filter(c => c.id !== this.selectedCharacter.id);
        localStorage.setItem('learnimals_characters', JSON.stringify(filtered));

        // Remove from local list
        this.characters = this.characters.filter(c => c.id !== this.selectedCharacter.id);

        // Clear selection
        this.selectedCharacter = null;
        this.originalCharacter = null;

        // Update UI
        this.updateCharacterList();
        this.element.querySelector('#editor-preview').innerHTML = '';
        this.element.querySelector('#preview-info').innerHTML = '';

        // Clear form fields
        this.element.querySelectorAll('.tab-panel').forEach(panel => {
          panel.innerHTML = '<div class="empty-state">Select a character to edit</div>';
        });

        this.showNotification('Character deleted successfully', 'success');
        characterEvents.emit('characterDeleted', { characterId: this.selectedCharacter.id });
      } catch (error) {
        console.error('❌ Delete failed:', error);
        this.showNotification(`Delete failed: ${error.message}`, 'error');
      }
    }
  }

  /**
   * Confirm unsaved changes
   */
  async confirmUnsavedChanges() {
    return await this.confirm(
      'Unsaved Changes',
      'You have unsaved changes. Do you want to save them before continuing?',
      [
        { text: 'Save', value: 'save', className: 'btn-primary' },
        { text: "Don't Save", value: 'discard', className: 'btn-secondary' },
        { text: 'Cancel', value: 'cancel', className: 'btn-tertiary' },
      ]
    ).then(result => {
      if (result === 'save') {
        this.saveChanges();
        return true;
      } else if (result === 'discard') {
        return true;
      }
      return false;
    });
  }

  /**
   * Show confirmation dialog
   */
  async confirm(title, message, buttons = null) {
    return new Promise(resolve => {
      const modal = new Modal({
        title,
        content: `<p>${message}</p>`,
        buttons: buttons || [
          {
            text: 'Yes',
            className: 'btn-primary',
            onClick: modal => {
              modal.close();
              resolve(true);
            },
          },
          {
            text: 'No',
            className: 'btn-secondary',
            onClick: modal => {
              modal.close();
              resolve(false);
            },
          },
        ],
      });

      // Handle custom button values
      if (buttons) {
        modal.options.buttons = buttons.map(btn => ({
          ...btn,
          onClick: modal => {
            modal.close();
            resolve(btn.value);
          },
        }));
      }

      modal.show();
    });
  }

  /**
   * Clean up when destroyed
   */
  destroy() {
    this.clearAutoSave();
    document.removeEventListener('keydown', this.handleKeyboardShortcuts);
    super.destroy();
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.CharacterEditor = CharacterEditor;
}
