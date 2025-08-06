/**
 * Character Customizer
 * Advanced theme and visual customization for characters
 *
 * Part of Phase G: Character Customization Studio
 */

// Use global BaseComponent (loaded via script tag in demo page)
const BaseComponent = window.BaseComponent;
import CharacterPreviewRenderer from './CharacterPreviewRenderer.js';

export default class CharacterCustomizer extends BaseComponent {
  constructor(options = {}) {
    super({
      tagName: 'div',
      className: 'character-customizer',
      attributes: {
        role: 'application',
        'aria-label': 'Character Customizer',
      },
      ...options,
    });

    // Customizer state
    this.selectedCharacter = null;
    this.currentCustomization = null;
    this.previewRenderer = null;
    this.isDirty = false;

    // Customization categories
    this.categories = [
      { id: 'themes', label: 'Visual Themes', icon: '🎨' },
      { id: 'colors', label: 'Color Schemes', icon: '🌈' },
      { id: 'effects', label: 'Visual Effects', icon: '✨' },
      { id: 'animations', label: 'Animations', icon: '🎭' },
      { id: 'accessories', label: 'Accessories', icon: '👑' },
      { id: 'backgrounds', label: 'Backgrounds', icon: '🖼️' },
    ];

    // Available themes
    this.themes = {
      educational: {
        name: 'Educational',
        description: 'Clean and professional for learning',
        borderWidth: 2,
        shadowStrength: 0.3,
        gradientIntensity: 0.4,
        roundness: 0.5,
        preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      playful: {
        name: 'Playful',
        description: 'Fun and energetic for young learners',
        borderWidth: 3,
        shadowStrength: 0.5,
        gradientIntensity: 0.6,
        roundness: 0.8,
        preview: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      },
      professional: {
        name: 'Professional',
        description: 'Minimal and sophisticated',
        borderWidth: 1,
        shadowStrength: 0.2,
        gradientIntensity: 0.2,
        roundness: 0.3,
        preview: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      },
      artistic: {
        name: 'Artistic',
        description: 'Creative and expressive',
        borderWidth: 4,
        shadowStrength: 0.4,
        gradientIntensity: 0.8,
        roundness: 0.9,
        preview: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      },
      retro: {
        name: 'Retro',
        description: 'Vintage computer aesthetic',
        borderWidth: 2,
        shadowStrength: 0.1,
        gradientIntensity: 0.3,
        roundness: 0.1,
        preview: 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)',
      },
      neon: {
        name: 'Neon',
        description: 'Glowing cyberpunk style',
        borderWidth: 3,
        shadowStrength: 0.8,
        gradientIntensity: 0.9,
        roundness: 0.6,
        preview: 'linear-gradient(135deg, #12c2e9 0%, #c471ed 50%, #f64f59 100%)',
      },
    };

    // Color schemes
    this.colorSchemes = {
      primary: {
        name: 'Primary Blue',
        colors: {
          primary: '#4A90E2',
          secondary: '#FFFFFF',
          accent: '#FFD700',
        },
      },
      warm: {
        name: 'Warm Sunset',
        colors: {
          primary: '#FF6B6B',
          secondary: '#FFE66D',
          accent: '#FF8E53',
        },
      },
      cool: {
        name: 'Cool Ocean',
        colors: {
          primary: '#4ECDC4',
          secondary: '#44A08D',
          accent: '#096B72',
        },
      },
      nature: {
        name: 'Natural Green',
        colors: {
          primary: '#6AB04C',
          secondary: '#BADC58',
          accent: '#F0932B',
        },
      },
      royal: {
        name: 'Royal Purple',
        colors: {
          primary: '#9980FA',
          secondary: '#FDA7DF',
          accent: '#F8B500',
        },
      },
      monochrome: {
        name: 'Monochrome',
        colors: {
          primary: '#2C3E50',
          secondary: '#95A5A6',
          accent: '#E74C3C',
        },
      },
    };

    // Visual effects
    this.effects = {
      glow: { name: 'Glow Effect', enabled: false },
      sparkles: { name: 'Sparkle Particles', enabled: false },
      shadow: { name: 'Drop Shadow', enabled: true },
      outline: { name: 'Outline Stroke', enabled: false },
      gradient: { name: 'Gradient Fill', enabled: true },
      texture: { name: 'Texture Overlay', enabled: false },
    };

    // Animation presets
    this.animationPresets = {
      minimal: { name: 'Minimal', idle: 'none', hover: 'subtle', click: 'gentle' },
      standard: { name: 'Standard', idle: 'breathe', hover: 'lift', click: 'bounce' },
      energetic: { name: 'Energetic', idle: 'float', hover: 'wiggle', click: 'spin' },
      playful: { name: 'Playful', idle: 'sway', hover: 'dance', click: 'jump' },
    };

    // Callbacks
    this.onCustomizationChange = options.onCustomizationChange || (() => {});
    this.onSave = options.onSave || (() => {});
    this.onCancel = options.onCancel || (() => {});

    this.init();
  }

  /**
   * Initialize customizer
   */
  async init() {
    // Initialize preview renderer
    this.previewRenderer = new CharacterPreviewRenderer({
      size: 'large',
      animated: true,
      interactive: true,
      theme: 'educational',
    });

    // Set default customization
    this.currentCustomization = {
      theme: 'educational',
      colorScheme: 'primary',
      effects: { ...this.effects },
      animations: { ...this.animationPresets.standard },
      accessories: [],
      background: null,
    };
  }

  /**
   * Generate customizer HTML
   */
  generateHTML() {
    return `
      <div id="${this.options.id}" class="character-customizer" data-component="character-customizer">
        <div class="customizer-header">
          <div class="header-info">
            <h2>Character Customizer</h2>
            <p class="header-subtitle">Customize visual themes and effects</p>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" id="reset-customization">
              <span>🔄</span>
              Reset
            </button>
            <button class="btn-secondary" id="save-preset">
              <span>💾</span>
              Save Preset
            </button>
            <button class="btn-primary" id="apply-customization">
              <span>✅</span>
              Apply
            </button>
            <button class="btn-tertiary" id="close-customizer">
              <span>✕</span>
              Close
            </button>
          </div>
        </div>

        <div class="customizer-body">
          <!-- Character Selection Panel -->
          <div class="character-panel">
            <h3>Select Character</h3>
            <div class="character-selector">
              <div class="character-grid" id="character-grid">
                <!-- Characters will be populated here -->
              </div>
            </div>
          </div>

          <!-- Customization Categories -->
          <div class="customization-panel">
            <div class="category-tabs">
              ${this.categories
    .map(
      category => `
                <button class="category-tab ${category.id === 'themes' ? 'active' : ''}" 
                        data-category="${category.id}">
                  <span class="tab-icon">${category.icon}</span>
                  <span class="tab-label">${category.label}</span>
                </button>
              `
    )
    .join('')}
            </div>

            <div class="category-content">
              ${this.renderThemesCategory()}
              ${this.renderColorsCategory()}
              ${this.renderEffectsCategory()}
              ${this.renderAnimationsCategory()}
              ${this.renderAccessoriesCategory()}
              ${this.renderBackgroundsCategory()}
            </div>
          </div>

          <!-- Preview Panel -->
          <div class="preview-panel">
            <h3>Live Preview</h3>
            <div class="preview-container">
              <div class="character-preview-stage" id="preview-stage">
                <div class="preview-placeholder">
                  <span class="placeholder-icon">👤</span>
                  <p>Select a character to customize</p>
                </div>
              </div>
              
              <div class="preview-controls">
                <label for="preview-expression">Expression:</label>
                <select id="preview-expression" class="preview-select">
                  <option value="happy">Happy</option>
                  <option value="excited">Excited</option>
                  <option value="thinking">Thinking</option>
                  <option value="surprised">Surprised</option>
                  <option value="proud">Proud</option>
                  <option value="encouraging">Encouraging</option>
                </select>
                
                <button class="btn-small" id="preview-animation">
                  <span>▶️</span>
                  Test Animation
                </button>
              </div>
            </div>

            <div class="customization-summary" id="customization-summary">
              <!-- Customization details will be shown here -->
            </div>
          </div>
        </div>

        <div class="customizer-footer">
          <div class="customization-status">
            <span class="status-indicator" id="customization-status">
              <span class="status-icon">⚪</span>
              <span class="status-text">No changes</span>
            </span>
          </div>
          
          <div class="footer-actions">
            <button class="btn-secondary" id="load-preset">
              <span>📂</span>
              Load Preset
            </button>
            <button class="btn-secondary" id="export-customization">
              <span>📤</span>
              Export
            </button>
            <button class="btn-secondary" id="import-customization">
              <span>📥</span>
              Import
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render themes category
   */
  renderThemesCategory() {
    return `
      <div class="category-panel active" id="themes-panel">
        <h4>Visual Themes</h4>
        <p class="category-description">Choose a visual style that matches your character's personality</p>
        
        <div class="theme-grid">
          ${Object.entries(this.themes)
    .map(
      ([id, theme]) => `
            <div class="theme-option ${this.currentCustomization.theme === id ? 'selected' : ''}" 
                 data-theme="${id}">
              <div class="theme-preview" style="background: ${theme.preview}"></div>
              <div class="theme-info">
                <h5 class="theme-name">${theme.name}</h5>
                <p class="theme-description">${theme.description}</p>
              </div>
              <div class="theme-properties">
                <span class="property-tag">Border: ${theme.borderWidth}px</span>
                <span class="property-tag">Shadow: ${Math.round(theme.shadowStrength * 100)}%</span>
                <span class="property-tag">Gradient: ${Math.round(theme.gradientIntensity * 100)}%</span>
              </div>
            </div>
          `
    )
    .join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render colors category
   */
  renderColorsCategory() {
    return `
      <div class="category-panel" id="colors-panel">
        <h4>Color Schemes</h4>
        <p class="category-description">Select or create custom color combinations</p>
        
        <div class="color-schemes">
          ${Object.entries(this.colorSchemes)
    .map(
      ([id, scheme]) => `
            <div class="color-scheme ${this.currentCustomization.colorScheme === id ? 'selected' : ''}" 
                 data-scheme="${id}">
              <div class="color-preview">
                <div class="color-swatch primary" style="background: ${scheme.colors.primary}"></div>
                <div class="color-swatch secondary" style="background: ${scheme.colors.secondary}"></div>
                <div class="color-swatch accent" style="background: ${scheme.colors.accent}"></div>
              </div>
              <h5 class="scheme-name">${scheme.name}</h5>
            </div>
          `
    )
    .join('')}
        </div>

        <div class="custom-colors">
          <h5>Custom Colors</h5>
          <div class="color-inputs">
            <div class="color-input-group">
              <label for="custom-primary">Primary</label>
              <input type="color" id="custom-primary" class="color-picker" value="#4A90E2">
            </div>
            <div class="color-input-group">
              <label for="custom-secondary">Secondary</label>
              <input type="color" id="custom-secondary" class="color-picker" value="#FFFFFF">
            </div>
            <div class="color-input-group">
              <label for="custom-accent">Accent</label>
              <input type="color" id="custom-accent" class="color-picker" value="#FFD700">
            </div>
          </div>
          <button class="btn-secondary btn-small" id="apply-custom-colors">Apply Custom</button>
        </div>
      </div>
    `;
  }

  /**
   * Render effects category
   */
  renderEffectsCategory() {
    return `
      <div class="category-panel" id="effects-panel">
        <h4>Visual Effects</h4>
        <p class="category-description">Add special visual effects to enhance your character</p>
        
        <div class="effects-list">
          ${Object.entries(this.effects)
    .map(
      ([id, effect]) => `
            <div class="effect-option">
              <label class="effect-label">
                <input type="checkbox" class="effect-checkbox" 
                       data-effect="${id}" 
                       ${this.currentCustomization.effects[id]?.enabled ? 'checked' : ''}>
                <span class="effect-name">${effect.name}</span>
              </label>
              <div class="effect-preview">
                <div class="effect-demo ${id}" data-effect="${id}"></div>
              </div>
            </div>
          `
    )
    .join('')}
        </div>

        <div class="effect-intensity">
          <h5>Effect Intensity</h5>
          <div class="intensity-controls">
            <div class="intensity-slider">
              <label for="glow-intensity">Glow Intensity</label>
              <input type="range" id="glow-intensity" min="0" max="100" value="50" class="slider">
            </div>
            <div class="intensity-slider">
              <label for="shadow-intensity">Shadow Intensity</label>
              <input type="range" id="shadow-intensity" min="0" max="100" value="30" class="slider">
            </div>
            <div class="intensity-slider">
              <label for="particle-density">Particle Density</label>
              <input type="range" id="particle-density" min="0" max="100" value="25" class="slider">
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render animations category
   */
  renderAnimationsCategory() {
    return `
      <div class="category-panel" id="animations-panel">
        <h4>Animation Settings</h4>
        <p class="category-description">Configure character movement and interaction animations</p>
        
        <div class="animation-presets">
          <h5>Animation Presets</h5>
          <div class="preset-grid">
            ${Object.entries(this.animationPresets)
    .map(
      ([id, preset]) => `
              <div class="animation-preset ${this.currentCustomization.animations === preset ? 'selected' : ''}" 
                   data-preset="${id}">
                <h6 class="preset-name">${preset.name}</h6>
                <div class="preset-details">
                  <span class="animation-detail">Idle: ${preset.idle}</span>
                  <span class="animation-detail">Hover: ${preset.hover}</span>
                  <span class="animation-detail">Click: ${preset.click}</span>
                </div>
              </div>
            `
    )
    .join('')}
          </div>
        </div>

        <div class="custom-animations">
          <h5>Custom Animation Settings</h5>
          <div class="animation-controls">
            <div class="animation-setting">
              <label for="idle-animation">Idle Animation</label>
              <select id="idle-animation" class="animation-select">
                <option value="none">None</option>
                <option value="breathe">Breathing</option>
                <option value="float">Floating</option>
                <option value="sway">Swaying</option>
                <option value="pulse">Pulsing</option>
              </select>
            </div>
            <div class="animation-setting">
              <label for="hover-animation">Hover Animation</label>
              <select id="hover-animation" class="animation-select">
                <option value="none">None</option>
                <option value="subtle">Subtle</option>
                <option value="lift">Lift</option>
                <option value="wiggle">Wiggle</option>
                <option value="glow">Glow</option>
              </select>
            </div>
            <div class="animation-setting">
              <label for="click-animation">Click Animation</label>
              <select id="click-animation" class="animation-select">
                <option value="none">None</option>
                <option value="gentle">Gentle</option>
                <option value="bounce">Bounce</option>
                <option value="spin">Spin</option>
                <option value="jump">Jump</option>
              </select>
            </div>
          </div>

          <div class="animation-speed">
            <label for="animation-speed">Animation Speed</label>
            <input type="range" id="animation-speed" min="0.5" max="2" step="0.1" value="1" class="slider">
            <span class="speed-value">1.0x</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render accessories category
   */
  renderAccessoriesCategory() {
    return `
      <div class="category-panel" id="accessories-panel">
        <h4>Character Accessories</h4>
        <p class="category-description">Add accessories and decorative elements</p>
        
        <div class="accessory-categories">
          <div class="accessory-type">
            <h5>Hats & Headwear</h5>
            <div class="accessory-grid">
              <div class="accessory-item" data-accessory="hat-graduation">🎓</div>
              <div class="accessory-item" data-accessory="hat-wizard">🧙‍♂️</div>
              <div class="accessory-item" data-accessory="hat-chef">👨‍🍳</div>
              <div class="accessory-item" data-accessory="crown">👑</div>
            </div>
          </div>

          <div class="accessory-type">
            <h5>Tools & Objects</h5>
            <div class="accessory-grid">
              <div class="accessory-item" data-accessory="book">📚</div>
              <div class="accessory-item" data-accessory="calculator">🧮</div>
              <div class="accessory-item" data-accessory="paintbrush">🖌️</div>
              <div class="accessory-item" data-accessory="microscope">🔬</div>
            </div>
          </div>

          <div class="accessory-type">
            <h5>Decorative Elements</h5>
            <div class="accessory-grid">
              <div class="accessory-item" data-accessory="stars">⭐</div>
              <div class="accessory-item" data-accessory="hearts">💖</div>
              <div class="accessory-item" data-accessory="lightning">⚡</div>
              <div class="accessory-item" data-accessory="rainbow">🌈</div>
            </div>
          </div>
        </div>

        <div class="selected-accessories">
          <h5>Selected Accessories</h5>
          <div class="accessories-list" id="selected-accessories">
            <!-- Selected accessories will appear here -->
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render backgrounds category
   */
  renderBackgroundsCategory() {
    return `
      <div class="category-panel" id="backgrounds-panel">
        <h4>Background Themes</h4>
        <p class="category-description">Choose background environments for your character</p>
        
        <div class="background-options">
          <div class="background-item ${!this.currentCustomization.background ? 'selected' : ''}" 
               data-background="none">
            <div class="background-preview none">
              <span>None</span>
            </div>
            <h5>No Background</h5>
          </div>

          <div class="background-item" data-background="classroom">
            <div class="background-preview classroom">
              <span>🏫</span>
            </div>
            <h5>Classroom</h5>
          </div>

          <div class="background-item" data-background="nature">
            <div class="background-preview nature">
              <span>🌳</span>
            </div>
            <h5>Nature</h5>
          </div>

          <div class="background-item" data-background="space">
            <div class="background-preview space">
              <span>🌌</span>
            </div>
            <h5>Space</h5>
          </div>

          <div class="background-item" data-background="underwater">
            <div class="background-preview underwater">
              <span>🌊</span>
            </div>
            <h5>Underwater</h5>
          </div>

          <div class="background-item" data-background="library">
            <div class="background-preview library">
              <span>📚</span>
            </div>
            <h5>Library</h5>
          </div>
        </div>

        <div class="background-customization">
          <h5>Background Settings</h5>
          <div class="background-controls">
            <div class="background-setting">
              <label for="background-opacity">Opacity</label>
              <input type="range" id="background-opacity" min="0" max="100" value="50" class="slider">
            </div>
            <div class="background-setting">
              <label for="background-blur">Blur Amount</label>
              <input type="range" id="background-blur" min="0" max="10" value="2" class="slider">
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Set character for customization
   */
  setCharacter(character) {
    this.selectedCharacter = character;
    this.updatePreview();
    this.updateCustomizationSummary();
  }

  /**
   * Update live preview
   */
  updatePreview() {
    if (!this.selectedCharacter || !this.previewRenderer) return;

    const previewStage = this.element.querySelector('#preview-stage');
    if (!previewStage) return;

    // Clear existing preview
    previewStage.innerHTML = '';

    // Apply current customization to character
    const customizedCharacter = this.applyCustomizationToCharacter(
      this.selectedCharacter,
      this.currentCustomization
    );

    // Get expression
    const expression = this.element.querySelector('#preview-expression')?.value || 'happy';

    // Update renderer theme
    this.previewRenderer.theme = this.currentCustomization.theme;

    // Render character
    this.previewRenderer.renderWithExpression(previewStage, customizedCharacter, expression);

    // Apply visual effects
    this.applyVisualEffects(previewStage);
  }

  /**
   * Apply customization to character
   */
  applyCustomizationToCharacter(character, customization) {
    const customized = JSON.parse(JSON.stringify(character));

    // Apply color scheme
    if (customization.colorScheme) {
      const scheme = this.colorSchemes[customization.colorScheme];
      if (scheme) {
        customized.appearance.primaryColor = scheme.colors.primary;
        customized.appearance.secondaryColor = scheme.colors.secondary;
        customized.appearance.accentColor = scheme.colors.accent;
      }
    }

    // Apply animation settings
    if (customization.animations) {
      customized.animations = {
        ...customized.animations,
        ...customization.animations,
      };
    }

    return customized;
  }

  /**
   * Apply visual effects to preview
   */
  applyVisualEffects(container) {
    const effects = this.currentCustomization.effects;

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
   * Add sparkle particle effect
   */
  addSparkleEffect(container) {
    // Create sparkle particles
    for (let i = 0; i < 5; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle-particle';
      sparkle.style.position = 'absolute';
      sparkle.style.width = '4px';
      sparkle.style.height = '4px';
      sparkle.style.background = '#FFD700';
      sparkle.style.borderRadius = '50%';
      sparkle.style.left = Math.random() * 100 + '%';
      sparkle.style.top = Math.random() * 100 + '%';
      sparkle.style.animation = 'sparkle-twinkle 2s infinite';
      sparkle.style.animationDelay = Math.random() * 2 + 's';
      container.appendChild(sparkle);
    }
  }

  /**
   * Update customization summary
   */
  updateCustomizationSummary() {
    const summaryElement = this.element.querySelector('#customization-summary');
    if (!summaryElement) return;

    const theme = this.themes[this.currentCustomization.theme];
    const colorScheme = this.colorSchemes[this.currentCustomization.colorScheme];

    summaryElement.innerHTML = `
      <h4>Current Customization</h4>
      <div class="summary-details">
        <div class="summary-item">
          <span class="summary-label">Theme:</span>
          <span class="summary-value">${theme?.name || 'None'}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Colors:</span>
          <span class="summary-value">${colorScheme?.name || 'Custom'}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Effects:</span>
          <span class="summary-value">${Object.values(this.currentCustomization.effects).filter(e => e.enabled).length} active</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Accessories:</span>
          <span class="summary-value">${this.currentCustomization.accessories.length} items</span>
        </div>
      </div>
    `;
  }

  /**
   * Clean up when destroyed
   */
  destroy() {
    super.destroy();
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.CharacterCustomizer = CharacterCustomizer;
}
