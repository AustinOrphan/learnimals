/**
 * Customization Preview
 * Real-time preview component for character customizations
 *
 * Part of Phase G: Character Customization Studio
 */

// Use global BaseComponent (loaded via script tag in demo page)
const BaseComponent = window.BaseComponent;
import { characterEvents } from '../index.js';
import CharacterPreviewRenderer from './CharacterPreviewRenderer.js';

export default class CustomizationPreview extends BaseComponent {
  constructor(options = {}) {
    super({
      tagName: 'div',
      className: 'customization-preview',
      attributes: {
        role: 'region',
        'aria-label': 'Character Customization Preview',
      },
      ...options,
    });

    // Preview state
    this.character = null;
    this.customization = null;
    this.previewRenderer = null;
    this.isAnimationEnabled = true;
    this.currentExpression = 'happy';
    this.currentBackground = null;

    // Preview modes
    this.modes = {
      single: 'Single Character',
      comparison: 'Before/After Comparison',
      gallery: 'Gallery View',
      animation: 'Animation Test',
    };
    this.currentMode = 'single';

    // Preview settings
    this.settings = {
      size: options.size || 'large',
      showControls: options.showControls !== false,
      enableAnimation: options.enableAnimation !== false,
      enableInteraction: options.enableInteraction !== false,
      autoUpdate: options.autoUpdate !== false,
      showCustomizationInfo: options.showCustomizationInfo !== false,
    };

    // Callbacks
    this.onPreviewClick = options.onPreviewClick || (() => {});
    this.onModeChange = options.onModeChange || (() => {});
    this.onSettingsChange = options.onSettingsChange || (() => {});

    this.init();
  }

  /**
   * Initialize preview component
   */
  async init() {
    // Initialize preview renderer
    this.previewRenderer = new CharacterPreviewRenderer({
      size: this.settings.size,
      animated: this.settings.enableAnimation,
      interactive: this.settings.enableInteraction,
    });

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Listen for customization changes
    characterEvents.on('customizationChanged', this.handleCustomizationChange.bind(this));
    characterEvents.on('characterChanged', this.handleCharacterChange.bind(this));
    characterEvents.on('previewSettingsChanged', this.handleSettingsChange.bind(this));
  }

  /**
   * Generate preview HTML
   */
  generateHTML() {
    return `
      <div id="${this.options.id}" class="customization-preview" data-component="customization-preview">
        ${this.settings.showControls ? this.renderControls() : ''}
        
        <div class="preview-content">
          ${this.renderPreviewModes()}
        </div>

        ${this.settings.showCustomizationInfo ? this.renderCustomizationInfo() : ''}
      </div>
    `;
  }

  /**
   * Render preview controls
   */
  renderControls() {
    return `
      <div class="preview-controls">
        <div class="preview-modes">
          ${Object.entries(this.modes)
            .map(
              ([id, label]) => `
            <button class="mode-btn ${this.currentMode === id ? 'active' : ''}" 
                    data-mode="${id}">
              ${this.getModeIcon(id)}
              <span>${label}</span>
            </button>
          `
            )
            .join('')}
        </div>

        <div class="preview-settings">
          <div class="setting-group">
            <label for="expression-select">Expression:</label>
            <select id="expression-select" class="setting-select">
              <option value="happy">Happy</option>
              <option value="excited">Excited</option>
              <option value="thinking">Thinking</option>
              <option value="surprised">Surprised</option>
              <option value="proud">Proud</option>
              <option value="encouraging">Encouraging</option>
            </select>
          </div>

          <div class="setting-group">
            <label for="background-select">Background:</label>
            <select id="background-select" class="setting-select">
              <option value="">None</option>
              <option value="classroom">Classroom</option>
              <option value="nature">Nature</option>
              <option value="space">Space</option>
              <option value="underwater">Underwater</option>
              <option value="library">Library</option>
            </select>
          </div>

          <div class="setting-toggles">
            <label class="toggle-setting">
              <input type="checkbox" id="animation-toggle" ${this.isAnimationEnabled ? 'checked' : ''}>
              <span>Animation</span>
            </label>
            <label class="toggle-setting">
              <input type="checkbox" id="interaction-toggle" ${this.settings.enableInteraction ? 'checked' : ''}>
              <span>Interactive</span>
            </label>
          </div>

          <div class="action-buttons">
            <button class="btn-small" id="refresh-preview">
              <span>🔄</span>
              Refresh
            </button>
            <button class="btn-small" id="test-animation">
              <span>▶️</span>
              Test Animation
            </button>
            <button class="btn-small" id="export-preview">
              <span>📸</span>
              Export
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render preview modes
   */
  renderPreviewModes() {
    return `
      <div class="preview-modes-content">
        <div class="preview-mode single-mode ${this.currentMode === 'single' ? 'active' : ''}" 
             id="single-mode">
          <div class="preview-stage" id="single-preview">
            ${this.renderPlaceholder('Select a character to preview')}
          </div>
        </div>

        <div class="preview-mode comparison-mode ${this.currentMode === 'comparison' ? 'active' : ''}" 
             id="comparison-mode">
          <div class="comparison-container">
            <div class="before-preview">
              <h4>Original</h4>
              <div class="preview-stage" id="before-preview">
                ${this.renderPlaceholder('Original')}
              </div>
            </div>
            <div class="after-preview">
              <h4>Customized</h4>
              <div class="preview-stage" id="after-preview">
                ${this.renderPlaceholder('Customized')}
              </div>
            </div>
          </div>
        </div>

        <div class="preview-mode gallery-mode ${this.currentMode === 'gallery' ? 'active' : ''}" 
             id="gallery-mode">
          <div class="gallery-grid" id="gallery-preview">
            ${this.renderGalleryPlaceholder()}
          </div>
        </div>

        <div class="preview-mode animation-mode ${this.currentMode === 'animation' ? 'active' : ''}" 
             id="animation-mode">
          <div class="animation-container">
            <div class="animation-preview">
              <div class="preview-stage" id="animation-preview">
                ${this.renderPlaceholder('Character Animation Test')}
              </div>
            </div>
            <div class="animation-controls">
              <h4>Animation Controls</h4>
              <div class="animation-test-buttons">
                <button class="btn-small" data-animation="idle">Idle</button>
                <button class="btn-small" data-animation="hover">Hover</button>
                <button class="btn-small" data-animation="click">Click</button>
                <button class="btn-small" data-animation="bounce">Bounce</button>
                <button class="btn-small" data-animation="spin">Spin</button>
              </div>
              <div class="speed-control">
                <label for="animation-speed">Speed:</label>
                <input type="range" id="animation-speed" min="0.5" max="3" step="0.1" value="1">
                <span class="speed-value">1.0x</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render customization info panel
   */
  renderCustomizationInfo() {
    return `
      <div class="customization-info">
        <h4>Customization Details</h4>
        <div class="info-content" id="customization-details">
          <p class="no-customization">No customization applied</p>
        </div>
      </div>
    `;
  }

  /**
   * Render placeholder content
   */
  renderPlaceholder(text) {
    return `
      <div class="preview-placeholder">
        <span class="placeholder-icon">👤</span>
        <p>${text}</p>
      </div>
    `;
  }

  /**
   * Render gallery placeholder
   */
  renderGalleryPlaceholder() {
    return `
      <div class="gallery-placeholder">
        <span class="placeholder-icon">🖼️</span>
        <p>Gallery view shows multiple customization variations</p>
      </div>
    `;
  }

  /**
   * Get mode icon
   */
  getModeIcon(mode) {
    const icons = {
      single: '👤',
      comparison: '⚖️',
      gallery: '🖼️',
      animation: '🎭',
    };
    return icons[mode] || '📱';
  }

  /**
   * Set character for preview
   */
  setCharacter(character) {
    this.character = character;
    this.updatePreview();
  }

  /**
   * Set customization for preview
   */
  setCustomization(customization) {
    this.customization = customization;
    this.updatePreview();
  }

  /**
   * Update preview in real-time
   */
  updatePreview() {
    if (!this.character) return;

    switch (this.currentMode) {
      case 'single':
        this.updateSinglePreview();
        break;
      case 'comparison':
        this.updateComparisonPreview();
        break;
      case 'gallery':
        this.updateGalleryPreview();
        break;
      case 'animation':
        this.updateAnimationPreview();
        break;
    }

    // Update customization info
    if (this.settings.showCustomizationInfo) {
      this.updateCustomizationInfo();
    }
  }

  /**
   * Update single character preview
   */
  updateSinglePreview() {
    const previewContainer = this.element.querySelector('#single-preview');
    if (!previewContainer) return;

    // Clear existing content
    previewContainer.innerHTML = '';

    // Apply customization to character
    const customizedCharacter = this.applyCustomizationToCharacter();

    // Render character
    try {
      const characterElement = this.previewRenderer.renderCharacter(customizedCharacter);

      // Apply background if selected
      if (this.currentBackground) {
        this.applyBackground(previewContainer, this.currentBackground);
      }

      // Add character to container
      previewContainer.appendChild(characterElement);

      // Apply expression
      if (this.currentExpression !== 'happy') {
        this.previewRenderer.updateExpression(characterElement, this.currentExpression);
      }

      // Apply visual effects from customization
      this.applyVisualEffects(previewContainer);
    } catch (error) {
      console.error('Preview render error:', error);
      previewContainer.innerHTML = this.renderPlaceholder('Preview error');
    }
  }

  /**
   * Update comparison preview (before/after)
   */
  updateComparisonPreview() {
    const beforeContainer = this.element.querySelector('#before-preview');
    const afterContainer = this.element.querySelector('#after-preview');

    if (!beforeContainer || !afterContainer) return;

    // Clear existing content
    beforeContainer.innerHTML = '';
    afterContainer.innerHTML = '';

    try {
      // Render original character
      const originalElement = this.previewRenderer.renderCharacter(this.character);
      beforeContainer.appendChild(originalElement);

      // Render customized character
      const customizedCharacter = this.applyCustomizationToCharacter();
      const customizedElement = this.previewRenderer.renderCharacter(customizedCharacter);
      afterContainer.appendChild(customizedElement);

      // Apply visual effects to customized version
      this.applyVisualEffects(afterContainer);
    } catch (error) {
      console.error('Comparison preview error:', error);
      beforeContainer.innerHTML = this.renderPlaceholder('Original');
      afterContainer.innerHTML = this.renderPlaceholder('Error');
    }
  }

  /**
   * Update gallery preview (multiple variations)
   */
  updateGalleryPreview() {
    const galleryContainer = this.element.querySelector('#gallery-preview');
    if (!galleryContainer) return;

    // Clear existing content
    galleryContainer.innerHTML = '';

    if (!this.character || !this.customization) {
      galleryContainer.innerHTML = this.renderGalleryPlaceholder();
      return;
    }

    try {
      // Generate multiple variations
      const variations = this.generateCustomizationVariations();

      galleryContainer.innerHTML = variations
        .map(
          (variation, index) => `
        <div class="gallery-item" data-variation="${index}">
          <div class="gallery-preview-stage" id="gallery-item-${index}">
            <!-- Character will be rendered here -->
          </div>
          <div class="variation-info">
            <h5>${variation.name}</h5>
            <p>${variation.description}</p>
          </div>
        </div>
      `
        )
        .join('');

      // Render each variation
      variations.forEach((variation, index) => {
        const itemContainer = this.element.querySelector(`#gallery-item-${index}`);
        if (itemContainer) {
          const variedCharacter = this.applyCustomizationToCharacter(variation.customization);
          const characterElement = this.previewRenderer.renderCharacter(variedCharacter);
          itemContainer.appendChild(characterElement);
        }
      });
    } catch (error) {
      console.error('Gallery preview error:', error);
      galleryContainer.innerHTML = this.renderGalleryPlaceholder();
    }
  }

  /**
   * Update animation preview
   */
  updateAnimationPreview() {
    const previewContainer = this.element.querySelector('#animation-preview');
    if (!previewContainer) return;

    // Similar to single preview but with enhanced animation controls
    this.updateSinglePreview();

    // Add animation test event handlers
    const animationButtons = this.element.querySelectorAll('[data-animation]');
    animationButtons.forEach(button => {
      button.addEventListener('click', () => {
        const animationType = button.dataset.animation;
        this.testAnimation(animationType);
      });
    });
  }

  /**
   * Apply customization to character
   */
  applyCustomizationToCharacter(customization = this.customization) {
    if (!this.character || !customization) return this.character;

    const customized = JSON.parse(JSON.stringify(this.character));

    // Apply theme settings
    if (customization.theme) {
      // Theme-specific modifications would go here
    }

    // Apply color scheme
    if (customization.colorScheme) {
      // Color modifications would go here
    }

    // Apply animations
    if (customization.animations) {
      customized.animations = {
        ...customized.animations,
        ...customization.animations,
      };
    }

    // Apply effects
    if (customization.effects) {
      customized.effects = customization.effects;
    }

    return customized;
  }

  /**
   * Apply visual effects to preview container
   */
  applyVisualEffects(container) {
    if (!this.customization?.effects) return;

    const effects = this.customization.effects;

    // Reset filters
    container.style.filter = '';

    // Apply glow effect
    if (effects.glow?.enabled) {
      container.style.filter += ' drop-shadow(0 0 10px rgba(74, 144, 226, 0.6))';
    }

    // Apply shadow effect
    if (effects.shadow?.enabled) {
      container.style.filter += ' drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))';
    }

    // Add sparkle particles
    if (effects.sparkles?.enabled) {
      this.addSparkleEffect(container);
    }
  }

  /**
   * Apply background to preview
   */
  applyBackground(container, backgroundType) {
    const backgrounds = {
      classroom: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      nature: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
      space: 'linear-gradient(135deg, #2d3436 0%, #636e72 100%)',
      underwater: 'linear-gradient(135deg, #00cec9 0%, #55efc4 100%)',
      library: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
    };

    if (backgrounds[backgroundType]) {
      container.style.background = backgrounds[backgroundType];
    }
  }

  /**
   * Add sparkle particle effect
   */
  addSparkleEffect(container) {
    // Remove existing sparkles
    container.querySelectorAll('.sparkle-particle').forEach(p => p.remove());

    // Create new sparkles
    for (let i = 0; i < 5; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle-particle';
      sparkle.style.position = 'absolute';
      sparkle.style.left = Math.random() * 100 + '%';
      sparkle.style.top = Math.random() * 100 + '%';
      sparkle.style.animationDelay = Math.random() * 2 + 's';
      container.appendChild(sparkle);
    }
  }

  /**
   * Generate customization variations for gallery
   */
  generateCustomizationVariations() {
    const baseCustomization = this.customization || {};

    return [
      {
        name: 'Original',
        description: 'No customization applied',
        customization: {},
      },
      {
        name: 'Educational',
        description: 'Clean professional theme',
        customization: {
          ...baseCustomization,
          theme: 'educational',
          colorScheme: 'primary',
        },
      },
      {
        name: 'Playful',
        description: 'Fun energetic theme',
        customization: {
          ...baseCustomization,
          theme: 'playful',
          colorScheme: 'warm',
        },
      },
      {
        name: 'Professional',
        description: 'Minimal sophisticated theme',
        customization: {
          ...baseCustomization,
          theme: 'professional',
          colorScheme: 'monochrome',
        },
      },
    ];
  }

  /**
   * Test animation
   */
  testAnimation(animationType) {
    const previewContainer = this.element.querySelector('#animation-preview');
    const character = previewContainer.querySelector('[data-component="character-preview"]');

    if (!character) return;

    // Apply animation class
    character.classList.remove('test-animation');
    character.offsetHeight; // Force reflow
    character.classList.add('test-animation', `animation-${animationType}`);

    // Remove animation class after completion
    setTimeout(() => {
      character.classList.remove('test-animation', `animation-${animationType}`);
    }, 2000);
  }

  /**
   * Switch preview mode
   */
  setMode(mode) {
    if (!this.modes[mode]) return;

    this.currentMode = mode;

    // Update mode buttons
    this.element.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Update mode content
    this.element.querySelectorAll('.preview-mode').forEach(modeEl => {
      modeEl.classList.toggle('active', modeEl.id === `${mode}-mode`);
    });

    // Update preview for new mode
    this.updatePreview();

    // Notify callback
    this.onModeChange(mode);
  }

  /**
   * Update customization info panel
   */
  updateCustomizationInfo() {
    const infoContainer = this.element.querySelector('#customization-details');
    if (!infoContainer) return;

    if (!this.customization) {
      infoContainer.innerHTML = '<p class="no-customization">No customization applied</p>';
      return;
    }

    const info = [];

    if (this.customization.theme) {
      info.push(`<div class="info-item"><strong>Theme:</strong> ${this.customization.theme}</div>`);
    }

    if (this.customization.colorScheme) {
      info.push(
        `<div class="info-item"><strong>Colors:</strong> ${this.customization.colorScheme}</div>`
      );
    }

    if (this.customization.effects) {
      const activeEffects = Object.entries(this.customization.effects)
        .filter(([_, effect]) => effect.enabled)
        .map(([name, _]) => name);

      if (activeEffects.length > 0) {
        info.push(
          `<div class="info-item"><strong>Effects:</strong> ${activeEffects.join(', ')}</div>`
        );
      }
    }

    if (this.customization.animations) {
      info.push(
        `<div class="info-item"><strong>Animation:</strong> ${this.customization.animations.idle || 'none'}</div>`
      );
    }

    infoContainer.innerHTML =
      info.length > 0
        ? info.join('')
        : '<p class="no-customization">Basic customization applied</p>';
  }

  /**
   * Handle customization change event
   */
  handleCustomizationChange(data) {
    if (this.settings.autoUpdate) {
      this.setCustomization(data.customization);
    }
  }

  /**
   * Handle character change event
   */
  handleCharacterChange(data) {
    if (this.settings.autoUpdate) {
      this.setCharacter(data.character);
    }
  }

  /**
   * Handle settings change event
   */
  handleSettingsChange(data) {
    this.settings = { ...this.settings, ...data.settings };
    this.updatePreview();
    this.onSettingsChange(this.settings);
  }

  /**
   * Export preview as image
   */
  async exportPreview() {
    const previewStage = this.element.querySelector('.preview-stage.active');
    if (!previewStage) return null;

    try {
      // Use html2canvas or similar library to capture the preview
      // For now, return a placeholder
      return {
        success: true,
        data: 'data:image/png;base64,placeholder',
        filename: `character-preview-${Date.now()}.png`,
      };
    } catch (error) {
      console.error('Export preview error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Clean up when destroyed
   */
  destroy() {
    // Remove event listeners
    characterEvents.off('customizationChanged', this.handleCustomizationChange);
    characterEvents.off('characterChanged', this.handleCharacterChange);
    characterEvents.off('previewSettingsChanged', this.handleSettingsChange);

    super.destroy();
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.CustomizationPreview = CustomizationPreview;
}
