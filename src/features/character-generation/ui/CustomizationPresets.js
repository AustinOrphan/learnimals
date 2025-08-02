/**
 * Customization Presets
 * Quick theme application and preset management system
 *
 * Part of Phase G: Character Customization Studio
 */

// Use global BaseComponent (loaded via script tag in demo page)
const BaseComponent = window.BaseComponent;
import { CharacterGenerationAPI, CharacterUtils, characterEvents } from '../index.js';

export default class CustomizationPresets extends BaseComponent {
  constructor(options = {}) {
    super({
      tagName: 'div',
      className: 'customization-presets',
      attributes: {
        role: 'region',
        'aria-label': 'Customization Presets',
      },
      ...options,
    });

    // Preset state
    this.presets = new Map();
    this.categories = new Map();
    this.selectedPreset = null;
    this.customPresets = new Map(); // User-created presets

    // UI settings
    this.settings = {
      showCategories: options.showCategories !== false,
      allowCustomPresets: options.allowCustomPresets !== false,
      showPreview: options.showPreview !== false,
      compactMode: options.compactMode || false,
    };

    // Initialize built-in presets
    this.initializeBuiltinPresets();

    // Callbacks
    this.onPresetSelect = options.onPresetSelect || (() => {});
    this.onPresetApply = options.onPresetApply || (() => {});
    this.onPresetSave = options.onPresetSave || (() => {});
    this.onPresetDelete = options.onPresetDelete || (() => {});

    this.init();
  }

  /**
   * Initialize component
   */
  async init() {
    // Load custom presets from storage
    await this.loadCustomPresets();

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Initialize built-in presets
   */
  initializeBuiltinPresets() {
    // Educational presets
    this.addPreset('educational-basic', {
      name: 'Educational Basic',
      description: 'Clean, minimal styling for learning environments',
      category: 'educational',
      builtIn: true,
      customization: {
        theme: 'educational',
        colorScheme: 'primary',
        effects: {
          shadow: { enabled: true, intensity: 0.3 },
          glow: { enabled: false },
          sparkles: { enabled: false },
          outline: { enabled: false },
          gradient: { enabled: true, intensity: 0.4 },
          texture: { enabled: false },
        },
        animations: {
          idle: 'breathe',
          hover: 'lift',
          click: 'bounce',
          speed: 1.0,
        },
        accessories: [],
        background: null,
      },
    });

    this.addPreset('educational-professional', {
      name: 'Educational Professional',
      description: 'Sophisticated styling for advanced learners',
      category: 'educational',
      builtIn: true,
      customization: {
        theme: 'professional',
        colorScheme: 'monochrome',
        effects: {
          shadow: { enabled: true, intensity: 0.2 },
          glow: { enabled: false },
          sparkles: { enabled: false },
          outline: { enabled: true, intensity: 0.5 },
          gradient: { enabled: true, intensity: 0.2 },
          texture: { enabled: false },
        },
        animations: {
          idle: 'none',
          hover: 'subtle',
          click: 'gentle',
          speed: 0.8,
        },
        accessories: [],
        background: null,
      },
    });

    // Playful presets
    this.addPreset('playful-energetic', {
      name: 'Playful Energetic',
      description: 'Fun, vibrant styling for young learners',
      category: 'playful',
      builtIn: true,
      customization: {
        theme: 'playful',
        colorScheme: 'warm',
        effects: {
          shadow: { enabled: true, intensity: 0.5 },
          glow: { enabled: true, intensity: 0.6 },
          sparkles: { enabled: true, density: 0.3 },
          outline: { enabled: false },
          gradient: { enabled: true, intensity: 0.6 },
          texture: { enabled: false },
        },
        animations: {
          idle: 'float',
          hover: 'wiggle',
          click: 'spin',
          speed: 1.2,
        },
        accessories: ['stars', 'hearts'],
        background: null,
      },
    });

    this.addPreset('playful-magical', {
      name: 'Playful Magical',
      description: 'Whimsical styling with magical effects',
      category: 'playful',
      builtIn: true,
      customization: {
        theme: 'artistic',
        colorScheme: 'royal',
        effects: {
          shadow: { enabled: true, intensity: 0.4 },
          glow: { enabled: true, intensity: 0.8 },
          sparkles: { enabled: true, density: 0.5 },
          outline: { enabled: false },
          gradient: { enabled: true, intensity: 0.8 },
          texture: { enabled: true, type: 'sparkle' },
        },
        animations: {
          idle: 'sway',
          hover: 'dance',
          click: 'jump',
          speed: 1.0,
        },
        accessories: ['wizard-hat', 'stars', 'lightning'],
        background: 'space',
      },
    });

    // Technical presets
    this.addPreset('tech-modern', {
      name: 'Tech Modern',
      description: 'Sleek, modern styling for STEM subjects',
      category: 'technical',
      builtIn: true,
      customization: {
        theme: 'professional',
        colorScheme: 'cool',
        effects: {
          shadow: { enabled: true, intensity: 0.3 },
          glow: { enabled: true, intensity: 0.4 },
          sparkles: { enabled: false },
          outline: { enabled: true, intensity: 0.3 },
          gradient: { enabled: true, intensity: 0.5 },
          texture: { enabled: false },
        },
        animations: {
          idle: 'breathe',
          hover: 'glow',
          click: 'pulse',
          speed: 0.9,
        },
        accessories: ['calculator', 'microscope'],
        background: null,
      },
    });

    this.addPreset('tech-futuristic', {
      name: 'Tech Futuristic',
      description: 'Cyberpunk-inspired styling with neon effects',
      category: 'technical',
      builtIn: true,
      customization: {
        theme: 'neon',
        colorScheme: 'primary',
        effects: {
          shadow: { enabled: true, intensity: 0.8 },
          glow: { enabled: true, intensity: 0.9 },
          sparkles: { enabled: true, density: 0.2 },
          outline: { enabled: true, intensity: 0.7 },
          gradient: { enabled: true, intensity: 0.9 },
          texture: { enabled: true, type: 'circuit' },
        },
        animations: {
          idle: 'pulse',
          hover: 'electric',
          click: 'flash',
          speed: 1.1,
        },
        accessories: ['lightning', 'calculator'],
        background: 'space',
      },
    });

    // Creative presets
    this.addPreset('creative-artistic', {
      name: 'Creative Artistic',
      description: 'Expressive styling for art and creativity',
      category: 'creative',
      builtIn: true,
      customization: {
        theme: 'artistic',
        colorScheme: 'royal',
        effects: {
          shadow: { enabled: true, intensity: 0.4 },
          glow: { enabled: true, intensity: 0.6 },
          sparkles: { enabled: true, density: 0.4 },
          outline: { enabled: false },
          gradient: { enabled: true, intensity: 0.8 },
          texture: { enabled: true, type: 'brush' },
        },
        animations: {
          idle: 'sway',
          hover: 'dance',
          click: 'splash',
          speed: 1.0,
        },
        accessories: ['paintbrush', 'rainbow'],
        background: 'nature',
      },
    });

    this.addPreset('creative-retro', {
      name: 'Creative Retro',
      description: 'Vintage-inspired styling with classic effects',
      category: 'creative',
      builtIn: true,
      customization: {
        theme: 'retro',
        colorScheme: 'warm',
        effects: {
          shadow: { enabled: true, intensity: 0.1 },
          glow: { enabled: false },
          sparkles: { enabled: false },
          outline: { enabled: true, intensity: 0.4 },
          gradient: { enabled: true, intensity: 0.3 },
          texture: { enabled: true, type: 'paper' },
        },
        animations: {
          idle: 'none',
          hover: 'lift',
          click: 'bounce',
          speed: 0.8,
        },
        accessories: [],
        background: 'library',
      },
    });

    // Initialize categories
    this.initializeCategories();
  }

  /**
   * Initialize preset categories
   */
  initializeCategories() {
    this.categories.set('educational', {
      name: 'Educational',
      description: 'Professional themes for learning environments',
      icon: '🎓',
      color: '#4A90E2',
    });

    this.categories.set('playful', {
      name: 'Playful',
      description: 'Fun and energetic themes for young learners',
      icon: '🎈',
      color: '#FF6B6B',
    });

    this.categories.set('technical', {
      name: 'Technical',
      description: 'Modern themes for STEM and technical subjects',
      icon: '⚙️',
      color: '#4ECDC4',
    });

    this.categories.set('creative', {
      name: 'Creative',
      description: 'Artistic themes for creative expression',
      icon: '🎨',
      color: '#9980FA',
    });

    this.categories.set('custom', {
      name: 'Custom',
      description: 'User-created and saved presets',
      icon: '💾',
      color: '#6AB04C',
    });
  }

  /**
   * Add preset to collection
   */
  addPreset(id, preset) {
    this.presets.set(id, {
      id,
      ...preset,
      created: preset.created || new Date().toISOString(),
      lastUsed: null,
      useCount: 0,
    });
  }

  /**
   * Generate presets HTML
   */
  generateHTML() {
    return `
      <div id="${this.options.id}" class="customization-presets" data-component="customization-presets">
        ${this.settings.showCategories ? this.renderCategories() : ''}
        
        <div class="presets-content">
          ${this.renderPresetsList()}
        </div>

        ${this.settings.allowCustomPresets ? this.renderCustomPresetControls() : ''}
      </div>
    `;
  }

  /**
   * Render category tabs
   */
  renderCategories() {
    return `
      <div class="preset-categories">
        <button class="category-tab active" data-category="all">
          <span class="category-icon">🌟</span>
          <span class="category-label">All Presets</span>
        </button>
        ${Array.from(this.categories.entries())
    .map(
      ([id, category]) => `
          <button class="category-tab" data-category="${id}">
            <span class="category-icon">${category.icon}</span>
            <span class="category-label">${category.name}</span>
          </button>
        `
    )
    .join('')}
      </div>
    `;
  }

  /**
   * Render presets list
   */
  renderPresetsList() {
    return `
      <div class="presets-list" id="presets-list">
        ${this.renderPresetsByCategory()}
      </div>
    `;
  }

  /**
   * Render presets grouped by category
   */
  renderPresetsByCategory() {
    const presetsByCategory = new Map();

    // Group presets by category
    for (const [id, preset] of this.presets) {
      const category = preset.category || 'custom';
      if (!presetsByCategory.has(category)) {
        presetsByCategory.set(category, []);
      }
      presetsByCategory.get(category).push({ id, ...preset });
    }

    // Add custom presets
    for (const [id, preset] of this.customPresets) {
      if (!presetsByCategory.has('custom')) {
        presetsByCategory.set('custom', []);
      }
      presetsByCategory.get('custom').push({ id, ...preset });
    }

    let html = '';

    for (const [categoryId, presets] of presetsByCategory) {
      const category = this.categories.get(categoryId);
      if (!category || presets.length === 0) continue;

      html += `
        <div class="preset-category-section" data-category="${categoryId}">
          <div class="category-header">
            <h3>
              <span class="category-icon">${category.icon}</span>
              ${category.name}
            </h3>
            <p class="category-description">${category.description}</p>
          </div>
          
          <div class="preset-grid">
            ${presets.map(preset => this.renderPresetCard(preset)).join('')}
          </div>
        </div>
      `;
    }

    return html || '<p class="no-presets">No presets available</p>';
  }

  /**
   * Render individual preset card
   */
  renderPresetCard(preset) {
    const isSelected = this.selectedPreset === preset.id;
    const category = this.categories.get(preset.category) || { color: '#666' };

    return `
      <div class="preset-card ${isSelected ? 'selected' : ''}" 
           data-preset-id="${preset.id}"
           data-category="${preset.category}">
        
        <div class="preset-header">
          <div class="preset-indicator" style="background: ${category.color}"></div>
          <div class="preset-meta">
            ${preset.builtIn ? '<span class="built-in-badge">Built-in</span>' : ''}
            ${preset.useCount ? `<span class="use-count">${preset.useCount} uses</span>` : ''}
          </div>
        </div>

        ${this.settings.showPreview ? this.renderPresetPreview(preset) : ''}
        
        <div class="preset-info">
          <h4 class="preset-name">${preset.name}</h4>
          <p class="preset-description">${preset.description}</p>
          
          <div class="preset-features">
            ${this.renderPresetFeatures(preset.customization)}
          </div>
        </div>

        <div class="preset-actions">
          <button class="btn-small btn-apply" data-action="apply" data-preset-id="${preset.id}">
            <span>✓</span>
            Apply
          </button>
          <button class="btn-small btn-preview" data-action="preview" data-preset-id="${preset.id}">
            <span>👁️</span>
            Preview
          </button>
          ${
  !preset.builtIn
    ? `
            <button class="btn-small btn-edit" data-action="edit" data-preset-id="${preset.id}">
              <span>✏️</span>
              Edit
            </button>
            <button class="btn-small btn-delete" data-action="delete" data-preset-id="${preset.id}">
              <span>🗑️</span>
              Delete
            </button>
          `
    : ''
}
        </div>
      </div>
    `;
  }

  /**
   * Render preset preview
   */
  renderPresetPreview(preset) {
    const customization = preset.customization;
    const theme = customization.theme || 'educational';
    const colorScheme = customization.colorScheme || 'primary';

    // Generate preview based on customization
    const previewStyle = this.generatePreviewStyle(customization);

    return `
      <div class="preset-preview" style="${previewStyle}">
        <div class="preview-character">
          ${this.getPreviewCharacterIcon(preset)}
        </div>
      </div>
    `;
  }

  /**
   * Generate preview style from customization
   */
  generatePreviewStyle(customization) {
    let style = '';

    // Base background
    const colorSchemes = {
      primary: '#4A90E2',
      warm: '#FF6B6B',
      cool: '#4ECDC4',
      nature: '#6AB04C',
      royal: '#9980FA',
      monochrome: '#2C3E50',
    };

    const baseColor = colorSchemes[customization.colorScheme] || '#4A90E2';
    style += `background: linear-gradient(135deg, ${baseColor}20, ${baseColor}40);`;

    // Effects
    if (customization.effects?.glow?.enabled) {
      style += `box-shadow: 0 0 20px ${baseColor}40;`;
    }

    if (customization.effects?.shadow?.enabled) {
      style += 'box-shadow: 0 4px 12px rgba(0,0,0,0.2);';
    }

    return style;
  }

  /**
   * Get preview character icon
   */
  getPreviewCharacterIcon(preset) {
    const accessories = preset.customization.accessories || [];

    if (accessories.includes('wizard-hat')) return '🧙‍♂️';
    if (accessories.includes('graduation-hat')) return '🎓';
    if (accessories.includes('chef-hat')) return '👨‍🍳';
    if (accessories.includes('crown')) return '👑';

    return '😊';
  }

  /**
   * Render preset features
   */
  renderPresetFeatures(customization) {
    const features = [];

    if (customization.theme) {
      features.push(`<span class="feature-tag theme">${customization.theme}</span>`);
    }

    if (customization.effects) {
      const activeEffects = Object.entries(customization.effects)
        .filter(([_, effect]) => effect.enabled)
        .map(([name, _]) => name);

      if (activeEffects.length > 0) {
        features.push(`<span class="feature-tag effects">${activeEffects.length} effects</span>`);
      }
    }

    if (customization.animations?.idle && customization.animations.idle !== 'none') {
      features.push('<span class="feature-tag animated">Animated</span>');
    }

    if (customization.accessories?.length > 0) {
      features.push(
        `<span class="feature-tag accessories">${customization.accessories.length} accessories</span>`
      );
    }

    return features.join('');
  }

  /**
   * Render custom preset controls
   */
  renderCustomPresetControls() {
    return `
      <div class="custom-preset-controls">
        <div class="controls-header">
          <h4>Custom Presets</h4>
          <p>Save and manage your own customization presets</p>
        </div>
        
        <div class="controls-actions">
          <button class="btn-primary" id="save-new-preset">
            <span>💾</span>
            Save Current as Preset
          </button>
          <button class="btn-secondary" id="import-preset">
            <span>📥</span>
            Import Preset
          </button>
          <button class="btn-secondary" id="export-presets">
            <span>📤</span>
            Export All
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    this.element.addEventListener('click', this.handleClick.bind(this));

    // Listen for customization events
    characterEvents.on('customizationChanged', this.handleCustomizationChange.bind(this));
  }

  /**
   * Handle click events
   */
  handleClick(event) {
    const target = event.target.closest('[data-action], [data-category], [data-preset-id]');
    if (!target) return;

    const action = target.dataset.action;
    const category = target.dataset.category;
    const presetId = target.dataset.presetId;

    if (action) {
      this.handleAction(action, presetId, target);
    } else if (category) {
      this.filterByCategory(category);
    } else if (presetId && !action) {
      this.selectPreset(presetId);
    }
  }

  /**
   * Handle preset actions
   */
  handleAction(action, presetId, target) {
    switch (action) {
    case 'apply':
      this.applyPreset(presetId);
      break;
    case 'preview':
      this.previewPreset(presetId);
      break;
    case 'edit':
      this.editPreset(presetId);
      break;
    case 'delete':
      this.deletePreset(presetId);
      break;
    }
  }

  /**
   * Apply preset to current character
   */
  applyPreset(presetId) {
    const preset = this.getPreset(presetId);
    if (!preset) return;

    // Update use count
    preset.useCount = (preset.useCount || 0) + 1;
    preset.lastUsed = new Date().toISOString();

    // Save updated preset
    if (preset.builtIn) {
      this.presets.set(presetId, preset);
    } else {
      this.customPresets.set(presetId, preset);
      this.saveCustomPresets();
    }

    // Select the preset
    this.selectedPreset = presetId;
    this.updateSelectedPreset();

    // Emit event
    characterEvents.emit('presetApplied', {
      presetId,
      preset,
      customization: preset.customization,
    });

    // Call callback
    this.onPresetApply(preset);

    console.log(`Applied preset: ${preset.name}`);
  }

  /**
   * Preview preset without applying
   */
  previewPreset(presetId) {
    const preset = this.getPreset(presetId);
    if (!preset) return;

    // Emit preview event
    characterEvents.emit('presetPreviewed', {
      presetId,
      preset,
      customization: preset.customization,
    });

    console.log(`Previewing preset: ${preset.name}`);
  }

  /**
   * Edit custom preset
   */
  editPreset(presetId) {
    const preset = this.getPreset(presetId);
    if (!preset || preset.builtIn) return;

    // Emit edit event
    characterEvents.emit('presetEditRequested', {
      presetId,
      preset,
    });

    console.log(`Edit requested for preset: ${preset.name}`);
  }

  /**
   * Delete custom preset
   */
  deletePreset(presetId) {
    const preset = this.getPreset(presetId);
    if (!preset || preset.builtIn) return;

    if (confirm(`Delete preset "${preset.name}"?`)) {
      this.customPresets.delete(presetId);
      this.saveCustomPresets();

      // Update UI
      this.updatePresetsList();

      // Emit event
      characterEvents.emit('presetDeleted', { presetId, preset });
      this.onPresetDelete(preset);

      console.log(`Deleted preset: ${preset.name}`);
    }
  }

  /**
   * Filter presets by category
   */
  filterByCategory(category) {
    // Update active category tab
    this.element.querySelectorAll('.category-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.category === category);
    });

    // Show/hide preset sections
    this.element.querySelectorAll('.preset-category-section').forEach(section => {
      const shouldShow = category === 'all' || section.dataset.category === category;
      section.style.display = shouldShow ? 'block' : 'none';
    });
  }

  /**
   * Select preset
   */
  selectPreset(presetId) {
    this.selectedPreset = presetId;
    this.updateSelectedPreset();

    const preset = this.getPreset(presetId);
    if (preset) {
      this.onPresetSelect(preset);
    }
  }

  /**
   * Update selected preset UI
   */
  updateSelectedPreset() {
    this.element.querySelectorAll('.preset-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.presetId === this.selectedPreset);
    });
  }

  /**
   * Get preset by ID
   */
  getPreset(presetId) {
    return this.presets.get(presetId) || this.customPresets.get(presetId);
  }

  /**
   * Save current customization as preset
   */
  async saveCustomizationAsPreset(customization, metadata = {}) {
    const presetId = `custom_${Date.now()}`;
    const preset = {
      id: presetId,
      name: metadata.name || 'Custom Preset',
      description: metadata.description || 'User-created preset',
      category: 'custom',
      builtIn: false,
      customization,
      created: new Date().toISOString(),
      useCount: 0,
      lastUsed: null,
    };

    this.customPresets.set(presetId, preset);
    await this.saveCustomPresets();

    // Update UI
    this.updatePresetsList();

    // Emit event
    characterEvents.emit('presetSaved', { presetId, preset });
    this.onPresetSave(preset);

    return preset;
  }

  /**
   * Load custom presets from storage
   */
  async loadCustomPresets() {
    try {
      const stored = localStorage.getItem('learnimals_customization_presets');
      if (stored) {
        const presets = JSON.parse(stored);
        this.customPresets = new Map(Object.entries(presets));
        console.log(`Loaded ${this.customPresets.size} custom presets`);
      }
    } catch (error) {
      console.warn('Failed to load custom presets:', error);
    }
  }

  /**
   * Save custom presets to storage
   */
  async saveCustomPresets() {
    try {
      const presets = Object.fromEntries(this.customPresets);
      localStorage.setItem('learnimals_customization_presets', JSON.stringify(presets));
    } catch (error) {
      console.error('Failed to save custom presets:', error);
    }
  }

  /**
   * Update presets list
   */
  updatePresetsList() {
    const listContainer = this.element.querySelector('#presets-list');
    if (listContainer) {
      listContainer.innerHTML = this.renderPresetsByCategory();
    }
  }

  /**
   * Export presets
   */
  exportPresets() {
    const allPresets = {
      builtin: Object.fromEntries(this.presets),
      custom: Object.fromEntries(this.customPresets),
      exported: new Date().toISOString(),
      version: '1.0',
    };

    const blob = new Blob([JSON.stringify(allPresets, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learnimals-presets-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Import presets
   */
  importPresets(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = e => {
        try {
          const data = JSON.parse(e.target.result);

          if (data.custom) {
            // Import custom presets
            for (const [id, preset] of Object.entries(data.custom)) {
              this.customPresets.set(id, preset);
            }

            this.saveCustomPresets();
            this.updatePresetsList();

            resolve({
              success: true,
              imported: Object.keys(data.custom).length,
            });
          } else {
            reject(new Error('Invalid preset file format'));
          }
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Handle customization change
   */
  handleCustomizationChange(data) {
    // Could update UI based on current customization
  }

  /**
   * Get preset statistics
   */
  getPresetStats() {
    const stats = {
      total: this.presets.size + this.customPresets.size,
      builtin: this.presets.size,
      custom: this.customPresets.size,
      byCategory: {},
    };

    // Count by category
    for (const category of this.categories.keys()) {
      stats.byCategory[category] = 0;
    }

    for (const preset of this.presets.values()) {
      const category = preset.category || 'custom';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    }

    for (const preset of this.customPresets.values()) {
      stats.byCategory.custom = (stats.byCategory.custom || 0) + 1;
    }

    return stats;
  }

  /**
   * Clean up when destroyed
   */
  destroy() {
    characterEvents.off('customizationChanged', this.handleCustomizationChange);
    super.destroy();
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.CustomizationPresets = CustomizationPresets;
}
