# 🎨 Character Customization Interface Design

## Overview

This document outlines the design and technical architecture for Phase B: the Character Customization Interface. Drawing from Angular Material's component design patterns and modern UX principles, this system will allow users to create personalized learning companions.

---

## 🎯 Design Goals

### User Experience Goals
1. **Intuitive for Children**: Simple, visual interface suitable for ages 4-12
2. **Immediate Feedback**: Real-time preview of customization changes
3. **Guided Experience**: Step-by-step wizard preventing overwhelming choices
4. **Accessibility First**: Screen reader friendly, keyboard navigable, high contrast support
5. **Mobile Optimized**: Touch-friendly interface for tablets and phones

### Technical Goals
1. **Modular Architecture**: Reusable components following established patterns
2. **Performance Optimized**: Smooth real-time rendering and interactions
3. **Data Integrity**: Robust validation and error handling
4. **Storage Integration**: Seamless save/load with CharacterStorage system
5. **Extensible Design**: Easy to add new customization options

---

## 🏗 Architecture Overview

### Component Hierarchy
```
CharacterCustomizationWizard
├── WizardNavigation
├── SpeciesSelector
├── AppearanceCustomizer
│   ├── ColorPicker
│   ├── PatternSelector
│   ├── FeatureCustomizer
│   └── AccessorySelector
├── PersonalityBuilder
│   ├── TraitSlider
│   ├── StyleSelector
│   └── VoiceCustomizer
├── CharacterPreview (CharacterRenderer)
└── SaveLoadPanel
```

### Data Flow
```
User Input → Component State → Character Schema → Real-time Preview
                                        ↓
Character Validation ← Character Storage ← Save Action
```

---

## 🎨 Visual Design System

### Design Principles (Inspired by Angular Material)
1. **Material Design 3**: Clean, modern aesthetic with elevation and shadow
2. **Consistent Typography**: Clear hierarchy with playful touches for children
3. **Semantic Colors**: Meaningful color usage for status and feedback
4. **Generous Touch Targets**: 44px minimum for mobile accessibility
5. **Progressive Disclosure**: Show complexity gradually as users advance

### Color Palette
```scss
// Primary Colors
$primary-color: #4a90e2;      // Trust and learning
$secondary-color: #7ed321;    // Growth and creativity
$accent-color: #f5a623;       // Fun and excitement

// Status Colors
$success-color: #5cb85c;      // Positive feedback
$warning-color: #f39c12;      // Caution states
$error-color: #e74c3c;        // Error states
$info-color: #3498db;         // Information

// Neutral Colors
$text-primary: #2c3e50;       // Main text
$text-secondary: #7f8c8d;     // Secondary text
$background: #ffffff;         // Main background
$surface: #f8f9fa;           // Card backgrounds
```

### Typography Scale
```scss
// Headings (Playful but readable)
h1: 2.5rem, font-weight: 700  // Wizard title
h2: 2rem, font-weight: 600    // Section headers
h3: 1.5rem, font-weight: 600  // Subsection headers

// Body Text (Clear and accessible)
body: 1rem, font-weight: 400  // Main content
small: 0.875rem, font-weight: 400  // Helper text
```

---

## 🧩 Component Specifications

### 1. CharacterCustomizationWizard
**Purpose**: Main container orchestrating the customization flow
**Features**:
- Step-by-step wizard navigation
- Progress indicator
- Data persistence across steps
- Responsive layout management

```javascript
class CharacterCustomizationWizard extends BaseComponent {
  constructor(options = {}) {
    super(options);
    this.currentStep = 0;
    this.characterData = this.createDefaultCharacter();
    this.steps = [
      'species',
      'appearance', 
      'personality',
      'review'
    ];
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
            <div id="character-preview-container"></div>
            <div class="preview-controls">
              <button class="test-animation-btn">Test Animations</button>
              <button class="hear-voice-btn">Hear Voice</button>
            </div>
          </div>
        </div>
        
        <div class="wizard-footer">
          <button class="btn-secondary" onclick="previousStep()" ${this.currentStep === 0 ? 'disabled' : ''}>
            Previous
          </button>
          <button class="btn-primary" onclick="nextStep()">
            ${this.currentStep === this.steps.length - 1 ? 'Create Character' : 'Next'}
          </button>
        </div>
      </div>
    `;
  }
}
```

### 2. SpeciesSelector
**Purpose**: Visual grid for selecting animal species
**Features**:
- Grid layout with animal icons
- Search/filter functionality
- Category grouping (mammals, birds, aquatic, mythical)
- Hover previews

```scss
.species-selector {
  .species-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 1rem;
    padding: 1rem;
  }
  
  .species-card {
    aspect-ratio: 1;
    border: 2px solid transparent;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.15);
    }
    
    &.selected {
      border-color: var(--primary-color);
      background: var(--primary-color-light);
    }
    
    .species-icon {
      width: 100%;
      height: 70%;
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }
    
    .species-name {
      text-align: center;
      font-weight: 600;
      padding: 0.5rem;
    }
  }
  
  .category-filter {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    
    .filter-chip {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      border: 1px solid var(--border-color);
      cursor: pointer;
      
      &.active {
        background: var(--primary-color);
        color: white;
      }
    }
  }
}
```

### 3. AppearanceCustomizer
**Purpose**: Comprehensive appearance editing interface
**Features**:
- Color picker with preset palettes
- Pattern selection with live preview
- Feature sliders (ear size, tail length, etc.)
- Accessory drag-and-drop

```javascript
class AppearanceCustomizer extends BaseComponent {
  constructor(options = {}) {
    super(options);
    this.activeTab = 'colors';
    this.tabs = ['colors', 'patterns', 'features', 'accessories'];
  }
  
  generateHTML() {
    return `
      <div class="appearance-customizer" id="${this.options.id}">
        <div class="customizer-tabs">
          ${this.tabs.map(tab => `
            <button class="tab-button ${tab === this.activeTab ? 'active' : ''}" 
                    data-tab="${tab}">
              ${this.getTabIcon(tab)} ${this.capitalizeFirst(tab)}
            </button>
          `).join('')}
        </div>
        
        <div class="customizer-content">
          ${this.generateTabContent(this.activeTab)}
        </div>
      </div>
    `;
  }
  
  generateColorTab() {
    return `
      <div class="color-section">
        <h3>Character Colors</h3>
        
        <div class="color-group">
          <label>Primary Color</label>
          <div class="color-picker-container">
            <div class="color-preview" style="background: ${this.characterData.appearance.colors.primary}"></div>
            <input type="color" class="color-input" data-color="primary" 
                   value="${this.characterData.appearance.colors.primary}">
          </div>
          <div class="preset-colors">
            ${this.generatePresetColors('primary')}
          </div>
        </div>
        
        <div class="color-group">
          <label>Secondary Color</label>
          <div class="color-picker-container">
            <div class="color-preview" style="background: ${this.characterData.appearance.colors.secondary}"></div>
            <input type="color" class="color-input" data-color="secondary" 
                   value="${this.characterData.appearance.colors.secondary}">
          </div>
          <div class="preset-colors">
            ${this.generatePresetColors('secondary')}
          </div>
        </div>
        
        <div class="color-group">
          <label>Accent Color</label>
          <div class="color-picker-container">
            <div class="color-preview" style="background: ${this.characterData.appearance.colors.accent}"></div>
            <input type="color" class="color-input" data-color="accent" 
                   value="${this.characterData.appearance.colors.accent}">
          </div>
          <div class="preset-colors">
            ${this.generatePresetColors('accent')}
          </div>
        </div>
      </div>
    `;
  }
}
```

### 4. PersonalityBuilder
**Purpose**: Interactive personality trait configuration
**Features**:
- Trait sliders with real-time descriptions
- Learning style selector
- Voice customization
- Teaching approach preferences

```javascript
class PersonalityBuilder extends BaseComponent {
  constructor(options = {}) {
    super(options);
    this.traits = [
      { key: 'enthusiasm', label: 'Enthusiasm', description: 'How excited they get about learning' },
      { key: 'patience', label: 'Patience', description: 'How they handle mistakes and struggles' },
      { key: 'curiosity', label: 'Curiosity', description: 'Interest in exploration and discovery' },
      { key: 'playfulness', label: 'Playfulness', description: 'Tendency toward games and fun' },
      { key: 'confidence', label: 'Confidence', description: 'Self-assurance in abilities' },
      { key: 'empathy', label: 'Empathy', description: 'Understanding and responding to emotions' }
    ];
  }
  
  generateHTML() {
    return `
      <div class="personality-builder" id="${this.options.id}">
        <div class="personality-section">
          <h3>Personality Traits</h3>
          <p class="section-description">Adjust these sliders to shape your character's personality</p>
          
          <div class="traits-container">
            ${this.traits.map(trait => this.generateTraitSlider(trait)).join('')}
          </div>
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
          <h4>Preview Messages</h4>
          <div class="message-examples">
            <button class="message-btn" data-context="greeting">Greeting</button>
            <button class="message-btn" data-context="encouragement">Encouragement</button>
            <button class="message-btn" data-context="celebration">Celebration</button>
          </div>
          <div class="message-display"></div>
        </div>
      </div>
    `;
  }
  
  generateTraitSlider(trait) {
    const value = this.characterData.personality.traits[trait.key] || 50;
    
    return `
      <div class="trait-slider-container">
        <div class="trait-header">
          <label class="trait-label">${trait.label}</label>
          <span class="trait-value">${value}</span>
        </div>
        <div class="trait-description">${trait.description}</div>
        <div class="slider-container">
          <input type="range" 
                 class="trait-slider" 
                 data-trait="${trait.key}"
                 min="0" 
                 max="100" 
                 value="${value}"
                 step="5">
          <div class="slider-labels">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>
        <div class="trait-effect">${this.getTraitEffect(trait.key, value)}</div>
      </div>
    `;
  }
}
```

---

## 🔧 Technical Implementation

### State Management
```javascript
class CharacterCustomizationState {
  constructor() {
    this.character = createCharacter();
    this.validationErrors = [];
    this.isDirty = false;
    this.listeners = new Map();
  }
  
  updateCharacter(path, value) {
    // Update character data using dot notation path
    this.setNestedValue(this.character, path, value);
    this.isDirty = true;
    this.validate();
    this.notifyListeners('character:update', { path, value });
  }
  
  validate() {
    this.validationErrors = CharacterValidation.validate(this.character);
    this.notifyListeners('validation:update', this.validationErrors);
  }
  
  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }
  
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }
}
```

### Real-time Preview Integration
```javascript
class CharacterPreviewManager {
  constructor(previewContainer, characterState) {
    this.container = previewContainer;
    this.state = characterState;
    this.renderer = null;
    this.setupPreview();
    this.bindStateUpdates();
  }
  
  setupPreview() {
    this.renderer = new CharacterRenderer({
      character: this.state.character,
      size: 250,
      interactive: true,
      animated: true,
      container: this.container
    });
    this.renderer.render();
  }
  
  bindStateUpdates() {
    this.state.subscribe('character:update', ({ path, value }) => {
      // Update renderer with new character data
      this.renderer.updateCharacter(this.state.character);
      
      // Trigger appropriate animation based on change type
      if (path.includes('colors')) {
        this.animateColorChange();
      } else if (path.includes('personality')) {
        this.testPersonalityChange();
      }
    });
  }
  
  animateColorChange() {
    // Smooth color transition animation
    this.renderer.setAnimationState('happy');
    setTimeout(() => this.renderer.setAnimationState('idle'), 1500);
  }
  
  testPersonalityChange() {
    // Show personality-based reaction
    const enthusiasm = this.state.character.personality.traits.enthusiasm;
    if (enthusiasm > 70) {
      this.renderer.setAnimationState('excited');
    } else if (enthusiasm < 30) {
      this.renderer.setAnimationState('calm');
    } else {
      this.renderer.setAnimationState('thinking');
    }
  }
}
```

### Form Validation System
```javascript
class CharacterFormValidator {
  constructor() {
    this.rules = {
      'name': {
        required: true,
        minLength: 1,
        maxLength: 50,
        pattern: /^[a-zA-Z\s]+$/
      },
      'species.primary': {
        required: true,
        enum: ['cat', 'dog', 'shark', 'panda', 'parrot', 'lion', 'eagle', 'songbird']
      },
      'appearance.colors.primary': {
        required: true,
        pattern: /^#[0-9A-Fa-f]{6}$/
      }
    };
  }
  
  validateField(fieldPath, value) {
    const rule = this.rules[fieldPath];
    if (!rule) return { valid: true };
    
    const errors = [];
    
    if (rule.required && !value) {
      errors.push(`${fieldPath} is required`);
    }
    
    if (rule.minLength && value.length < rule.minLength) {
      errors.push(`${fieldPath} must be at least ${rule.minLength} characters`);
    }
    
    if (rule.maxLength && value.length > rule.maxLength) {
      errors.push(`${fieldPath} must be no more than ${rule.maxLength} characters`);
    }
    
    if (rule.pattern && !rule.pattern.test(value)) {
      errors.push(`${fieldPath} format is invalid`);
    }
    
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push(`${fieldPath} must be one of: ${rule.enum.join(', ')}`);
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
  
  validateCharacter(character) {
    const allErrors = [];
    
    Object.keys(this.rules).forEach(fieldPath => {
      const value = this.getNestedValue(character, fieldPath);
      const result = this.validateField(fieldPath, value);
      if (!result.valid) {
        allErrors.push(...result.errors);
      }
    });
    
    return {
      valid: allErrors.length === 0,
      errors: allErrors
    };
  }
}
```

---

## 🎯 User Experience Flow

### Step 1: Species Selection
```
Welcome Screen → Species Categories → Animal Grid → Preview Selection → Confirm
     ↓               ↓                  ↓              ↓               ↓
  Instructions   Filter Options    Hover Effects   Character Loads    Next Step
```

### Step 2: Appearance Customization
```
Color Tab → Pattern Tab → Features Tab → Accessories Tab → Review
    ↓          ↓            ↓              ↓             ↓
Color Picker  Pattern Grid  Feature Sliders  Accessory DnD  Final Preview
```

### Step 3: Personality Building
```
Trait Sliders → Learning Style → Voice Settings → Message Preview → Confirm
      ↓             ↓               ↓               ↓             ↓
Real-time Effects  Style Cards   Voice Controls   Test Messages   Next Step
```

### Step 4: Review & Save
```
Character Summary → Name Input → Save Options → Storage → Complete
        ↓             ↓           ↓            ↓         ↓
    All Settings   Validation   Local/Cloud   Success   Use Character
```

---

## 📱 Responsive Design

### Breakpoints
```scss
// Mobile First Approach
$mobile: 320px;      // Small phones
$mobile-lg: 480px;   // Large phones
$tablet: 768px;      // Tablets
$desktop: 1024px;    // Small desktops
$desktop-lg: 1440px; // Large desktops

// Component responsive behavior
.character-wizard {
  @media (max-width: $tablet) {
    .wizard-content {
      flex-direction: column;
      
      .customization-panel {
        order: 2;
      }
      
      .preview-panel {
        order: 1;
        margin-bottom: 2rem;
      }
    }
  }
  
  @media (max-width: $mobile-lg) {
    .species-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .trait-slider-container {
      margin-bottom: 2rem;
    }
  }
}
```

### Touch Optimization
```scss
// Touch-friendly controls
.touch-control {
  min-height: 44px;
  min-width: 44px;
  padding: 12px;
  border-radius: 8px;
  
  &:active {
    transform: scale(0.95);
  }
}

// Large sliders for mobile
.trait-slider {
  height: 8px;
  
  &::-webkit-slider-thumb {
    width: 24px;
    height: 24px;
  }
  
  @media (max-width: $tablet) {
    height: 12px;
    
    &::-webkit-slider-thumb {
      width: 32px;
      height: 32px;
    }
  }
}
```

---

## ♿ Accessibility Implementation

### ARIA Labels and Roles
```html
<div class="character-wizard" role="application" aria-label="Character Customization Wizard">
  <div class="wizard-header">
    <h1 id="wizard-title">Create Your Learning Companion</h1>
    <div class="progress-indicator" role="progressbar" 
         aria-valuenow="1" aria-valuemin="1" aria-valuemax="4"
         aria-labelledby="wizard-title">
      <span class="sr-only">Step 1 of 4: Species Selection</span>
    </div>
  </div>
  
  <div class="species-selector" role="radiogroup" aria-labelledby="species-heading">
    <h2 id="species-heading">Choose Your Character's Species</h2>
    <div class="species-grid">
      <div class="species-card" role="radio" tabindex="0" 
           aria-labelledby="cat-label" aria-describedby="cat-desc">
        <div class="species-icon cat-icon" aria-hidden="true"></div>
        <div id="cat-label" class="species-name">Cat</div>
        <div id="cat-desc" class="sr-only">Playful and curious, great for coding and problem-solving</div>
      </div>
    </div>
  </div>
</div>
```

### Keyboard Navigation
```javascript
class KeyboardNavigationManager {
  constructor(wizard) {
    this.wizard = wizard;
    this.focusableElements = [];
    this.currentFocusIndex = 0;
    this.setupKeyboardHandlers();
  }
  
  setupKeyboardHandlers() {
    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'Tab':
          this.handleTabNavigation(e);
          break;
        case 'Enter':
        case ' ':
          this.handleActivation(e);
          break;
        case 'Escape':
          this.handleEscape(e);
          break;
        case 'ArrowLeft':
        case 'ArrowRight':
          this.handleArrowNavigation(e);
          break;
      }
    });
  }
  
  handleTabNavigation(e) {
    this.updateFocusableElements();
    
    if (e.shiftKey) {
      // Shift+Tab (backward)
      this.currentFocusIndex = Math.max(0, this.currentFocusIndex - 1);
    } else {
      // Tab (forward)
      this.currentFocusIndex = Math.min(
        this.focusableElements.length - 1, 
        this.currentFocusIndex + 1
      );
    }
    
    this.focusableElements[this.currentFocusIndex]?.focus();
    e.preventDefault();
  }
}
```

### Screen Reader Support
```javascript
class ScreenReaderAnnouncements {
  constructor() {
    this.announcementRegion = this.createAnnouncementRegion();
  }
  
  createAnnouncementRegion() {
    const region = document.createElement('div');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    document.body.appendChild(region);
    return region;
  }
  
  announce(message, priority = 'polite') {
    this.announcementRegion.setAttribute('aria-live', priority);
    this.announcementRegion.textContent = message;
    
    // Clear after announcement to allow repeat announcements
    setTimeout(() => {
      this.announcementRegion.textContent = '';
    }, 1000);
  }
  
  announceCharacterChange(changeType, value) {
    const announcements = {
      'species': `Character species changed to ${value}`,
      'color': `Character color updated`,
      'personality': `Personality trait ${changeType} adjusted to ${value}%`,
      'save': `Character saved successfully as ${value}`
    };
    
    this.announce(announcements[changeType] || `Character updated`);
  }
}
```

---

## 🚀 Performance Optimization

### Rendering Optimization
```javascript
class PerformanceOptimizedRenderer {
  constructor() {
    this.frameQueue = [];
    this.isAnimating = false;
    this.lastFrameTime = 0;
    this.targetFPS = 60;
    this.frameInterval = 1000 / this.targetFPS;
  }
  
  queueUpdate(updateFunction) {
    this.frameQueue.push(updateFunction);
    if (!this.isAnimating) {
      this.startAnimationLoop();
    }
  }
  
  startAnimationLoop() {
    this.isAnimating = true;
    const animate = (currentTime) => {
      if (currentTime - this.lastFrameTime >= this.frameInterval) {
        // Process all queued updates
        while (this.frameQueue.length > 0) {
          const update = this.frameQueue.shift();
          update();
        }
        this.lastFrameTime = currentTime;
      }
      
      if (this.frameQueue.length > 0) {
        requestAnimationFrame(animate);
      } else {
        this.isAnimating = false;
      }
    };
    
    requestAnimationFrame(animate);
  }
}
```

### Memory Management
```javascript
class ComponentLifecycleManager {
  constructor() {
    this.activeComponents = new Set();
    this.cleanupCallbacks = new Map();
  }
  
  registerComponent(component) {
    this.activeComponents.add(component);
    
    // Set up cleanup when component is destroyed
    const cleanup = () => {
      this.cleanupComponent(component);
    };
    
    this.cleanupCallbacks.set(component, cleanup);
    
    // Listen for page unload
    window.addEventListener('beforeunload', cleanup);
  }
  
  cleanupComponent(component) {
    if (this.activeComponents.has(component)) {
      // Remove event listeners
      component.removeEventListeners?.();
      
      // Clear intervals and timeouts
      component.clearTimers?.();
      
      // Clean up canvas contexts
      component.cleanupCanvas?.();
      
      // Remove from active set
      this.activeComponents.delete(component);
      
      const cleanup = this.cleanupCallbacks.get(component);
      if (cleanup) {
        window.removeEventListener('beforeunload', cleanup);
        this.cleanupCallbacks.delete(component);
      }
    }
  }
}
```

---

## 🧪 Testing Strategy

### Unit Tests
```javascript
describe('CharacterCustomizationWizard', () => {
  let wizard;
  let mockCharacterState;
  
  beforeEach(() => {
    mockCharacterState = new CharacterCustomizationState();
    wizard = new CharacterCustomizationWizard({
      characterState: mockCharacterState
    });
  });
  
  test('should initialize with default character', () => {
    expect(wizard.characterData).toBeDefined();
    expect(wizard.characterData.species.primary).toBe('cat');
  });
  
  test('should validate required fields', () => {
    wizard.characterData.name = '';
    const validation = wizard.validate();
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('Name is required');
  });
  
  test('should update character preview on changes', () => {
    const spy = jest.spyOn(wizard.previewManager, 'updateCharacter');
    wizard.updateCharacterProperty('appearance.colors.primary', '#ff0000');
    expect(spy).toHaveBeenCalledWith(wizard.characterData);
  });
});
```

### Integration Tests
```javascript
describe('Character Customization Integration', () => {
  test('should save and load character correctly', async () => {
    const wizard = new CharacterCustomizationWizard();
    const storage = new CharacterStorage();
    await storage.init();
    
    // Customize character
    wizard.updateCharacterProperty('name', 'Test Character');
    wizard.updateCharacterProperty('species.primary', 'dog');
    
    // Save character
    const characterId = await wizard.saveCharacter();
    expect(characterId).toBeDefined();
    
    // Load character
    const loadedCharacter = await storage.loadCharacter(characterId);
    expect(loadedCharacter.name).toBe('Test Character');
    expect(loadedCharacter.species.primary).toBe('dog');
  });
});
```

### Visual Regression Tests
```javascript
describe('Character Customization Visual Tests', () => {
  test('should match species selector layout', async () => {
    const wizard = new CharacterCustomizationWizard();
    wizard.render('#test-container');
    
    const screenshot = await page.screenshot({
      clip: wizard.getSpeciesSelectorBounds()
    });
    
    expect(screenshot).toMatchSnapshot('species-selector.png');
  });
  
  test('should show correct character preview', async () => {
    const wizard = new CharacterCustomizationWizard();
    wizard.setCharacterSpecies('panda');
    wizard.render('#test-container');
    
    await wizard.waitForPreviewRender();
    const screenshot = await page.screenshot({
      clip: wizard.getPreviewBounds()
    });
    
    expect(screenshot).toMatchSnapshot('panda-preview.png');
  });
});
```

---

This comprehensive design document provides the foundation for building a world-class character customization interface that will delight children while maintaining technical excellence and accessibility standards.