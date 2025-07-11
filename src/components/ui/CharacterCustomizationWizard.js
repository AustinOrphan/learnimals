/**
 * Character Customization Wizard Component
 * 
 * A step-by-step wizard interface for creating and customizing learning companion characters.
 * Features species selection, appearance customization, personality building, and save/load functionality.
 */

import BaseComponent from '../BaseComponent.js';
import CharacterRenderer from './CharacterRenderer.js';
import { createCharacter, validateCharacter } from '../../data/characterSchema.js';
import { CharacterStorage } from '../../services/character/CharacterStorage.js';
import { generateCharacterMessage } from '../../utils/characterIntegration.js';

class CharacterCustomizationWizard extends BaseComponent {
  constructor(options = {}) {
    super({
      id: options.id || 'character-customization-wizard',
      cssClasses: ['character-wizard', ...(options.cssClasses || [])],
      ...options
    });
    
    // Wizard state
    this.currentStep = 0;
    this.characterData = options.characterData || createCharacter();
    this.steps = [
      { id: 'species', title: 'Choose Species', icon: '🐾' },
      { id: 'appearance', title: 'Customize Appearance', icon: '🎨' },
      { id: 'personality', title: 'Build Personality', icon: '🧠' },
      { id: 'review', title: 'Review & Save', icon: '✨' }
    ];
    
    // Component state
    this.isDirty = false;
    this.validationErrors = [];
    this.previewRenderer = null;
    this.storage = new CharacterStorage();
    
    // Event listeners
    this.listeners = new Map();
  }
  
  generateHTML() {
    return `
      <div class="character-wizard ${this.options.cssClasses.join(' ')}" id="${this.options.id}">
        <div class="wizard-header">
          <h1>Create Your Learning Companion</h1>
          <div class="progress-indicator">
            ${this.generateProgressIndicator()}
          </div>
        </div>
        
        <div class="wizard-content">
          <div class="customization-panel">
            ${this.generateCurrentStepContent()}
          </div>
          
          <div class="preview-panel">
            <h3>Character Preview</h3>
            <div id="character-preview-container" class="preview-container"></div>
            <div class="preview-controls">
              <button class="preview-btn" onclick="this.testAnimation('happy')">
                <span class="btn-icon">😊</span> Happy
              </button>
              <button class="preview-btn" onclick="this.testAnimation('celebrating')">
                <span class="btn-icon">🎉</span> Celebrate
              </button>
              <button class="preview-btn" onclick="this.testAnimation('thinking')">
                <span class="btn-icon">🤔</span> Think
              </button>
              <button class="preview-btn" onclick="this.hearVoice()">
                <span class="btn-icon">🔊</span> Hear Voice
              </button>
            </div>
            <div class="character-message" id="character-message">
              <div class="speech-bubble">
                <p id="message-text">${this.getCharacterGreeting()}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="wizard-footer">
          <button class="btn-secondary" onclick="this.previousStep()" 
                  ${this.currentStep === 0 ? 'disabled' : ''}>
            Previous
          </button>
          <button class="btn-primary" onclick="this.nextStep()">
            ${this.currentStep === this.steps.length - 1 ? 'Create Character' : 'Next'}
          </button>
        </div>
        
        ${this.generateValidationMessages()}
      </div>
    `;
  }
  
  generateProgressIndicator() {
    return this.steps.map((step, index) => `
      <div class="progress-step ${index === this.currentStep ? 'active' : ''} 
                  ${index < this.currentStep ? 'completed' : ''}">
        <div class="step-icon">${step.icon}</div>
        <div class="step-title">${step.title}</div>
        <div class="step-connector"></div>
      </div>
    `).join('');
  }
  
  generateCurrentStepContent() {
    const step = this.steps[this.currentStep];
    
    switch (step.id) {
      case 'species':
        return this.generateSpeciesSelector();
      case 'appearance':
        return this.generateAppearanceCustomizer();
      case 'personality':
        return this.generatePersonalityBuilder();
      case 'review':
        return this.generateReviewSection();
      default:
        return '<p>Unknown step</p>';
    }
  }
  
  generateSpeciesSelector() {
    const species = [
      { id: 'cat', name: 'Cat', icon: '🐱', description: 'Curious and independent' },
      { id: 'dog', name: 'Dog', icon: '🐕', description: 'Loyal and energetic' },
      { id: 'panda', name: 'Panda', icon: '🐼', description: 'Gentle and wise' },
      { id: 'shark', name: 'Shark', icon: '🦈', description: 'Determined and focused' },
      { id: 'parrot', name: 'Parrot', icon: '🦜', description: 'Talkative and colorful' },
      { id: 'lion', name: 'Lion', icon: '🦁', description: 'Brave and confident' },
      { id: 'owl', name: 'Owl', icon: '🦉', description: 'Wise and observant' },
      { id: 'dolphin', name: 'Dolphin', icon: '🐬', description: 'Playful and intelligent' }
    ];
    
    return `
      <div class="species-selector">
        <h2>Choose Your Character's Species</h2>
        <p>Select the animal that will be your learning companion</p>
        
        <div class="species-search">
          <input type="text" 
                 class="search-input" 
                 placeholder="Search species..."
                 onkeyup="this.filterSpecies(event)">
        </div>
        
        <div class="species-categories">
          <button class="category-chip active" data-category="all">All</button>
          <button class="category-chip" data-category="mammal">Mammals</button>
          <button class="category-chip" data-category="bird">Birds</button>
          <button class="category-chip" data-category="aquatic">Aquatic</button>
        </div>
        
        <div class="species-grid">
          ${species.map(s => `
            <div class="species-card ${this.characterData.species.primary === s.id ? 'selected' : ''}"
                 data-species="${s.id}"
                 onclick="this.selectSpecies('${s.id}')"
                 role="button"
                 tabindex="0"
                 aria-label="Select ${s.name}">
              <div class="species-icon">${s.icon}</div>
              <div class="species-name">${s.name}</div>
              <div class="species-description">${s.description}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  generateAppearanceCustomizer() {
    return `
      <div class="appearance-customizer">
        <h2>Customize Appearance</h2>
        
        <div class="customizer-tabs">
          <button class="tab-button active" data-tab="colors">
            <span class="tab-icon">🎨</span> Colors
          </button>
          <button class="tab-button" data-tab="patterns">
            <span class="tab-icon">🔷</span> Patterns
          </button>
          <button class="tab-button" data-tab="features">
            <span class="tab-icon">✨</span> Features
          </button>
          <button class="tab-button" data-tab="accessories">
            <span class="tab-icon">🎁</span> Accessories
          </button>
        </div>
        
        <div class="tab-content active" id="colors-tab">
          ${this.generateColorControls()}
        </div>
        
        <div class="tab-content" id="patterns-tab">
          ${this.generatePatternControls()}
        </div>
        
        <div class="tab-content" id="features-tab">
          ${this.generateFeatureControls()}
        </div>
        
        <div class="tab-content" id="accessories-tab">
          ${this.generateAccessoryControls()}
        </div>
      </div>
    `;
  }
  
  generateColorControls() {
    const colors = this.characterData.appearance.colors;
    
    return `
      <div class="color-controls">
        <div class="color-group">
          <label>Primary Color</label>
          <div class="color-picker-container">
            <div class="color-preview" 
                 style="background: ${colors.primary}"
                 id="primary-color-preview"></div>
            <input type="color" 
                   class="color-input" 
                   id="primary-color"
                   value="${colors.primary}"
                   onchange="this.updateColor('primary', this.value)">
          </div>
          <div class="preset-colors">
            ${this.generatePresetColors('primary')}
          </div>
        </div>
        
        <div class="color-group">
          <label>Secondary Color</label>
          <div class="color-picker-container">
            <div class="color-preview" 
                 style="background: ${colors.secondary}"
                 id="secondary-color-preview"></div>
            <input type="color" 
                   class="color-input" 
                   id="secondary-color"
                   value="${colors.secondary}"
                   onchange="this.updateColor('secondary', this.value)">
          </div>
          <div class="preset-colors">
            ${this.generatePresetColors('secondary')}
          </div>
        </div>
        
        <div class="color-group">
          <label>Accent Color</label>
          <div class="color-picker-container">
            <div class="color-preview" 
                 style="background: ${colors.accent}"
                 id="accent-color-preview"></div>
            <input type="color" 
                   class="color-input" 
                   id="accent-color"
                   value="${colors.accent}"
                   onchange="this.updateColor('accent', this.value)">
          </div>
          <div class="preset-colors">
            ${this.generatePresetColors('accent')}
          </div>
        </div>
      </div>
    `;
  }
  
  generatePresetColors(colorType) {
    const presets = {
      primary: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'],
      secondary: ['#F8B500', '#FF6348', '#A8E6CF', '#FFD3B6', '#DDA0DD'],
      accent: ['#FFD93D', '#6BCF7E', '#FF6B9D', '#C7CEEA', '#FFA07A']
    };
    
    return presets[colorType].map(color => `
      <button class="preset-color" 
              style="background: ${color}"
              onclick="this.updateColor('${colorType}', '${color}')"
              aria-label="Select ${color}">
      </button>
    `).join('');
  }
  
  generatePatternControls() {
    const patterns = ['none', 'stripes', 'spots', 'patches', 'gradient'];
    
    return `
      <div class="pattern-controls">
        <h3>Body Pattern</h3>
        <div class="pattern-grid">
          ${patterns.map(pattern => `
            <div class="pattern-option ${this.characterData.appearance.pattern === pattern ? 'selected' : ''}"
                 data-pattern="${pattern}"
                 onclick="this.updatePattern('${pattern}')">
              <div class="pattern-preview pattern-${pattern}"></div>
              <div class="pattern-name">${pattern.charAt(0).toUpperCase() + pattern.slice(1)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  generateFeatureControls() {
    return `
      <div class="feature-controls">
        <h3>Character Features</h3>
        
        <div class="feature-slider">
          <label>Ear Size</label>
          <input type="range" 
                 min="50" max="150" 
                 value="${this.characterData.appearance.features.earSize || 100}"
                 onchange="this.updateFeature('earSize', this.value)">
          <span class="slider-value">${this.characterData.appearance.features.earSize || 100}%</span>
        </div>
        
        <div class="feature-slider">
          <label>Eye Size</label>
          <input type="range" 
                 min="80" max="120" 
                 value="${this.characterData.appearance.features.eyeSize || 100}"
                 onchange="this.updateFeature('eyeSize', this.value)">
          <span class="slider-value">${this.characterData.appearance.features.eyeSize || 100}%</span>
        </div>
        
        <div class="feature-slider">
          <label>Body Roundness</label>
          <input type="range" 
                 min="0" max="100" 
                 value="${this.characterData.appearance.features.bodyRoundness || 50}"
                 onchange="this.updateFeature('bodyRoundness', this.value)">
          <span class="slider-value">${this.characterData.appearance.features.bodyRoundness || 50}%</span>
        </div>
      </div>
    `;
  }
  
  generateAccessoryControls() {
    const accessories = {
      head: ['hat', 'bow', 'glasses', 'headphones'],
      body: ['scarf', 'backpack', 'shirt', 'cape'],
      special: ['wand', 'book', 'paintbrush', 'calculator']
    };
    
    return `
      <div class="accessory-controls">
        ${Object.entries(accessories).map(([category, items]) => `
          <div class="accessory-category">
            <h3>${category.charAt(0).toUpperCase() + category.slice(1)} Accessories</h3>
            <div class="accessory-grid">
              ${items.map(item => `
                <div class="accessory-item ${this.hasAccessory(category, item) ? 'selected' : ''}"
                     onclick="this.toggleAccessory('${category}', '${item}')">
                  <div class="accessory-icon">${this.getAccessoryIcon(item)}</div>
                  <div class="accessory-name">${item}</div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  generatePersonalityBuilder() {
    const traits = [
      { key: 'enthusiasm', label: 'Enthusiasm', description: 'How excited they get about learning', icon: '⚡' },
      { key: 'patience', label: 'Patience', description: 'How they handle mistakes and struggles', icon: '⏳' },
      { key: 'curiosity', label: 'Curiosity', description: 'Interest in exploration and discovery', icon: '🔍' },
      { key: 'playfulness', label: 'Playfulness', description: 'Tendency toward games and fun', icon: '🎮' },
      { key: 'confidence', label: 'Confidence', description: 'Self-assurance in abilities', icon: '💪' },
      { key: 'empathy', label: 'Empathy', description: 'Understanding and responding to emotions', icon: '💝' }
    ];
    
    return `
      <div class="personality-builder">
        <h2>Build Your Character's Personality</h2>
        <p>Adjust these traits to create a unique personality</p>
        
        <div class="traits-container">
          ${traits.map(trait => this.generateTraitSlider(trait)).join('')}
        </div>
        
        <div class="learning-style-section">
          <h3>Learning Style</h3>
          <div class="style-selector">
            ${this.generateLearningStyleOptions()}
          </div>
        </div>
        
        <div class="voice-section">
          <h3>Voice & Communication</h3>
          <div class="voice-controls">
            ${this.generateVoiceControls()}
          </div>
        </div>
        
        <div class="preview-messages">
          <h3>Preview Messages</h3>
          <div class="message-buttons">
            <button class="message-btn" onclick="this.previewMessage('greeting')">
              Greeting
            </button>
            <button class="message-btn" onclick="this.previewMessage('encouragement')">
              Encouragement
            </button>
            <button class="message-btn" onclick="this.previewMessage('celebration')">
              Celebration
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  generateTraitSlider(trait) {
    const value = this.characterData.personality.traits[trait.key] || 50;
    
    return `
      <div class="trait-slider-container">
        <div class="trait-header">
          <span class="trait-icon">${trait.icon}</span>
          <label class="trait-label">${trait.label}</label>
          <span class="trait-value" id="${trait.key}-value">${value}</span>
        </div>
        <div class="trait-description">${trait.description}</div>
        <div class="slider-container">
          <input type="range" 
                 class="trait-slider" 
                 id="${trait.key}-slider"
                 data-trait="${trait.key}"
                 min="0" 
                 max="100" 
                 value="${value}"
                 step="5"
                 oninput="this.updateTrait('${trait.key}', this.value)">
          <div class="slider-labels">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
        </div>
        <div class="trait-effect" id="${trait.key}-effect">
          ${this.getTraitEffect(trait.key, value)}
        </div>
      </div>
    `;
  }
  
  generateLearningStyleOptions() {
    const styles = [
      { id: 'visual', name: 'Visual', icon: '👁️', description: 'Learns through images and demonstrations' },
      { id: 'auditory', name: 'Auditory', icon: '👂', description: 'Learns through listening and discussion' },
      { id: 'kinesthetic', name: 'Kinesthetic', icon: '🤹', description: 'Learns through hands-on activities' },
      { id: 'balanced', name: 'Balanced', icon: '⚖️', description: 'Combines all learning approaches' }
    ];
    
    return styles.map(style => `
      <div class="style-option ${this.characterData.personality.learningStyle === style.id ? 'selected' : ''}"
           onclick="this.updateLearningStyle('${style.id}')">
        <div class="style-icon">${style.icon}</div>
        <div class="style-name">${style.name}</div>
        <div class="style-description">${style.description}</div>
      </div>
    `).join('');
  }
  
  generateVoiceControls() {
    const voice = this.characterData.personality.voice || {};
    
    return `
      <div class="voice-control-grid">
        <div class="voice-slider">
          <label>Pitch</label>
          <input type="range" 
                 min="0.5" max="2" step="0.1"
                 value="${voice.pitch || 1}"
                 onchange="this.updateVoice('pitch', this.value)">
          <span class="voice-value">${voice.pitch || 1}</span>
        </div>
        
        <div class="voice-slider">
          <label>Speed</label>
          <input type="range" 
                 min="0.5" max="1.5" step="0.1"
                 value="${voice.speed || 1}"
                 onchange="this.updateVoice('speed', this.value)">
          <span class="voice-value">${voice.speed || 1}</span>
        </div>
        
        <div class="voice-accent">
          <label>Accent Style</label>
          <select onchange="this.updateVoice('accent', this.value)">
            <option value="friendly" ${voice.accent === 'friendly' ? 'selected' : ''}>Friendly</option>
            <option value="gentle" ${voice.accent === 'gentle' ? 'selected' : ''}>Gentle</option>
            <option value="energetic" ${voice.accent === 'energetic' ? 'selected' : ''}>Energetic</option>
            <option value="wise" ${voice.accent === 'wise' ? 'selected' : ''}>Wise</option>
          </select>
        </div>
      </div>
    `;
  }
  
  generateReviewSection() {
    return `
      <div class="review-section">
        <h2>Review Your Character</h2>
        
        <div class="character-summary">
          <div class="summary-item">
            <span class="summary-label">Name:</span>
            <input type="text" 
                   class="name-input" 
                   value="${this.characterData.name}"
                   placeholder="Enter character name..."
                   onchange="this.updateName(this.value)">
          </div>
          
          <div class="summary-item">
            <span class="summary-label">Species:</span>
            <span class="summary-value">${this.characterData.species.primary}</span>
          </div>
          
          <div class="summary-item">
            <span class="summary-label">Primary Color:</span>
            <span class="color-badge" style="background: ${this.characterData.appearance.colors.primary}"></span>
          </div>
          
          <div class="summary-item">
            <span class="summary-label">Personality:</span>
            <span class="summary-value">${this.getPersonalitySummary()}</span>
          </div>
          
          <div class="summary-item">
            <span class="summary-label">Learning Style:</span>
            <span class="summary-value">${this.characterData.personality.learningStyle || 'Balanced'}</span>
          </div>
        </div>
        
        <div class="save-options">
          <h3>Save Options</h3>
          <div class="save-buttons">
            <button class="save-btn primary" onclick="this.saveCharacter()">
              <span class="btn-icon">💾</span> Save Character
            </button>
            <button class="save-btn secondary" onclick="this.exportCharacter()">
              <span class="btn-icon">📤</span> Export Data
            </button>
            <button class="save-btn secondary" onclick="this.shareCharacter()">
              <span class="btn-icon">🔗</span> Share Character
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  generateValidationMessages() {
    if (this.validationErrors.length === 0) return '';
    
    return `
      <div class="validation-messages">
        ${this.validationErrors.map(error => `
          <div class="validation-error">
            <span class="error-icon">⚠️</span>
            <span class="error-message">${error}</span>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  // Event Handlers
  selectSpecies(speciesId) {
    this.characterData.species.primary = speciesId;
    this.isDirty = true;
    this.updatePreview();
    this.updateUI();
  }
  
  updateColor(colorType, value) {
    this.characterData.appearance.colors[colorType] = value;
    this.isDirty = true;
    this.updatePreview();
    
    // Update color preview
    const preview = document.getElementById(`${colorType}-color-preview`);
    if (preview) {
      preview.style.background = value;
    }
  }
  
  updatePattern(pattern) {
    this.characterData.appearance.pattern = pattern;
    this.isDirty = true;
    this.updatePreview();
    this.updateUI();
  }
  
  updateFeature(feature, value) {
    this.characterData.appearance.features[feature] = parseInt(value);
    this.isDirty = true;
    this.updatePreview();
  }
  
  toggleAccessory(category, item) {
    const accessories = this.characterData.appearance.accessories[category];
    const index = accessories.indexOf(item);
    
    if (index > -1) {
      accessories.splice(index, 1);
    } else {
      accessories.push(item);
    }
    
    this.isDirty = true;
    this.updatePreview();
    this.updateUI();
  }
  
  updateTrait(trait, value) {
    this.characterData.personality.traits[trait] = parseInt(value);
    this.isDirty = true;
    
    // Update value display
    const valueDisplay = document.getElementById(`${trait}-value`);
    if (valueDisplay) {
      valueDisplay.textContent = value;
    }
    
    // Update effect description
    const effectDisplay = document.getElementById(`${trait}-effect`);
    if (effectDisplay) {
      effectDisplay.textContent = this.getTraitEffect(trait, value);
    }
    
    // Update character message if visible
    this.updateCharacterMessage();
  }
  
  updateLearningStyle(style) {
    this.characterData.personality.learningStyle = style;
    this.isDirty = true;
    this.updateUI();
  }
  
  updateVoice(property, value) {
    if (!this.characterData.personality.voice) {
      this.characterData.personality.voice = {};
    }
    this.characterData.personality.voice[property] = property === 'accent' ? value : parseFloat(value);
    this.isDirty = true;
  }
  
  updateName(name) {
    this.characterData.name = name;
    this.isDirty = true;
  }
  
  // Navigation
  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.updateUI();
    }
  }
  
  async nextStep() {
    // Validate current step
    if (!this.validateCurrentStep()) {
      return;
    }
    
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.updateUI();
    } else {
      // Final step - save character
      await this.saveCharacter();
    }
  }
  
  // Validation
  validateCurrentStep() {
    this.validationErrors = [];
    
    switch (this.steps[this.currentStep].id) {
      case 'species':
        if (!this.characterData.species.primary) {
          this.validationErrors.push('Please select a species');
        }
        break;
      
      case 'review':
        if (!this.characterData.name || this.characterData.name.trim().length === 0) {
          this.validationErrors.push('Please enter a name for your character');
        }
        break;
    }
    
    this.updateUI();
    return this.validationErrors.length === 0;
  }
  
  // Character Preview
  async updatePreview() {
    const container = document.getElementById('character-preview-container');
    if (!container) return;
    
    // Create or update renderer
    if (!this.previewRenderer) {
      this.previewRenderer = new CharacterRenderer({
        character: this.characterData,
        size: 200,
        interactive: true,
        animated: true,
        container: container
      });
      await this.previewRenderer.render();
    } else {
      this.previewRenderer.updateCharacter(this.characterData);
    }
  }
  
  testAnimation(state) {
    if (this.previewRenderer) {
      this.previewRenderer.setAnimationState(state);
    }
  }
  
  hearVoice() {
    const message = generateCharacterMessage(this.characterData, 'greeting');
    this.speak(message);
  }
  
  speak(text) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = this.characterData.personality.voice || {};
      
      utterance.pitch = voice.pitch || 1;
      utterance.rate = voice.speed || 1;
      utterance.volume = 1;
      
      speechSynthesis.speak(utterance);
    }
  }
  
  // Message Preview
  previewMessage(context) {
    const message = generateCharacterMessage(this.characterData, context);
    const messageElement = document.getElementById('message-text');
    if (messageElement) {
      messageElement.textContent = message;
      
      // Trigger appropriate animation
      if (this.previewRenderer) {
        const animationMap = {
          greeting: 'waving',
          encouragement: 'encouraging',
          celebration: 'celebrating'
        };
        this.previewRenderer.setAnimationState(animationMap[context] || 'happy');
      }
    }
  }
  
  updateCharacterMessage() {
    const message = generateCharacterMessage(this.characterData, 'greeting');
    const messageElement = document.getElementById('message-text');
    if (messageElement) {
      messageElement.textContent = message;
    }
  }
  
  getCharacterGreeting() {
    return generateCharacterMessage(this.characterData, 'greeting');
  }
  
  // Save/Export Functions
  async saveCharacter() {
    try {
      await this.storage.init();
      
      // Set metadata
      this.characterData.created = this.characterData.created || new Date();
      this.characterData.lastModified = new Date();
      this.characterData.isCustom = true;
      
      // Validate character
      const validation = validateCharacter(this.characterData);
      if (!validation.valid) {
        this.validationErrors = validation.errors;
        this.updateUI();
        return;
      }
      
      // Save to storage
      const characterId = await this.storage.saveCharacter(this.characterData);
      
      // Show success message
      this.showSuccess(`Character "${this.characterData.name}" saved successfully!`);
      
      // Emit save event
      this.emit('character:saved', { characterId, character: this.characterData });
      
      // Mark as clean
      this.isDirty = false;
      
    } catch (error) {
      console.error('Failed to save character:', error);
      this.showError('Failed to save character. Please try again.');
    }
  }
  
  exportCharacter() {
    const data = JSON.stringify(this.characterData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.characterData.name || 'character'}-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }
  
  shareCharacter() {
    // TODO: Implement sharing functionality
    this.showInfo('Sharing feature coming soon!');
  }
  
  // Helper Methods
  hasAccessory(category, item) {
    return this.characterData.appearance.accessories[category].includes(item);
  }
  
  getAccessoryIcon(item) {
    const icons = {
      hat: '🎩',
      bow: '🎀',
      glasses: '👓',
      headphones: '🎧',
      scarf: '🧣',
      backpack: '🎒',
      shirt: '👕',
      cape: '🦸',
      wand: '🪄',
      book: '📚',
      paintbrush: '🖌️',
      calculator: '🧮'
    };
    return icons[item] || '🎁';
  }
  
  getTraitEffect(trait, value) {
    const val = parseInt(value);
    
    const effects = {
      enthusiasm: {
        low: 'Calm and measured in approach',
        medium: 'Balanced excitement about learning',
        high: 'Very energetic and enthusiastic!'
      },
      patience: {
        low: 'Quick to move on to new topics',
        medium: 'Takes reasonable time to explain',
        high: 'Very patient with mistakes'
      },
      curiosity: {
        low: 'Focused on core concepts',
        medium: 'Open to exploring related topics',
        high: 'Loves discovering new things!'
      },
      playfulness: {
        low: 'Serious and focused approach',
        medium: 'Mixes fun with learning',
        high: 'Makes everything a game!'
      },
      confidence: {
        low: 'Humble and encouraging',
        medium: 'Balanced self-assurance',
        high: 'Bold and inspiring!'
      },
      empathy: {
        low: 'Task-focused helper',
        medium: 'Understands feelings well',
        high: 'Deeply caring and supportive'
      }
    };
    
    const level = val < 33 ? 'low' : val < 67 ? 'medium' : 'high';
    return effects[trait]?.[level] || 'Balanced trait';
  }
  
  getPersonalitySummary() {
    const traits = this.characterData.personality.traits;
    const topTraits = Object.entries(traits)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([trait]) => trait);
    
    return topTraits.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' & ');
  }
  
  // UI Updates
  updateUI() {
    const wizardElement = document.getElementById(this.options.id);
    if (wizardElement) {
      wizardElement.innerHTML = this.generateHTML();
      this.bindEvents();
      this.updatePreview();
    }
  }
  
  bindEvents() {
    // Make component methods available globally for onclick handlers
    window.characterWizard = this;
    
    // Bind this context to methods
    this.selectSpecies = this.selectSpecies.bind(this);
    this.updateColor = this.updateColor.bind(this);
    this.updatePattern = this.updatePattern.bind(this);
    this.updateFeature = this.updateFeature.bind(this);
    this.toggleAccessory = this.toggleAccessory.bind(this);
    this.updateTrait = this.updateTrait.bind(this);
    this.updateLearningStyle = this.updateLearningStyle.bind(this);
    this.updateVoice = this.updateVoice.bind(this);
    this.updateName = this.updateName.bind(this);
    this.previousStep = this.previousStep.bind(this);
    this.nextStep = this.nextStep.bind(this);
    this.testAnimation = this.testAnimation.bind(this);
    this.hearVoice = this.hearVoice.bind(this);
    this.previewMessage = this.previewMessage.bind(this);
    this.saveCharacter = this.saveCharacter.bind(this);
    this.exportCharacter = this.exportCharacter.bind(this);
    this.shareCharacter = this.shareCharacter.bind(this);
    
    // Bind tab switching
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });
    
    // Bind category filters
    const categoryChips = document.querySelectorAll('.category-chip');
    categoryChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        this.filterByCategory(e.target.dataset.category);
      });
    });
  }
  
  switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabId}-tab`);
    });
  }
  
  filterByCategory(category) {
    // Update category chips
    document.querySelectorAll('.category-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.category === category);
    });
    
    // Filter species cards
    // TODO: Implement category filtering
  }
  
  filterSpecies(event) {
    const searchTerm = event.target.value.toLowerCase();
    const speciesCards = document.querySelectorAll('.species-card');
    
    speciesCards.forEach(card => {
      const name = card.querySelector('.species-name').textContent.toLowerCase();
      const description = card.querySelector('.species-description').textContent.toLowerCase();
      const matches = name.includes(searchTerm) || description.includes(searchTerm);
      card.style.display = matches ? 'block' : 'none';
    });
  }
  
  // Notification Methods
  showSuccess(message) {
    // TODO: Implement toast notification
    alert(message);
  }
  
  showError(message) {
    // TODO: Implement toast notification
    alert('Error: ' + message);
  }
  
  showInfo(message) {
    // TODO: Implement toast notification
    alert(message);
  }
  
  // Event Emitter
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }
  
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }
  
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  // Lifecycle
  async afterRender() {
    await super.afterRender();
    this.bindEvents();
    await this.updatePreview();
  }
  
  destroy() {
    // Clean up event listeners
    this.listeners.clear();
    
    // Clean up preview renderer
    if (this.previewRenderer) {
      this.previewRenderer.destroy();
    }
    
    // Clean up global reference
    if (window.characterWizard === this) {
      delete window.characterWizard;
    }
    
    super.destroy();
  }
}

export default CharacterCustomizationWizard;