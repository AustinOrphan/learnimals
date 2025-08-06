/**
 * Character Creation Wizard
 * Step-by-step guided character creation interface
 *
 * Part of Phase D: Character Generator Core
 */

// Use global BaseComponent (loaded via script tag in demo page)
const BaseComponent = window.BaseComponent;
import { CharacterGenerationAPI, CharacterUtils } from '../index.js';
import Modal from '../../../components/ui/Modal.js';
import CharacterPreviewRenderer from './CharacterPreviewRenderer.js';

export default class CharacterWizard extends BaseComponent {
  constructor(options = {}) {
    super({
      tagName: 'div',
      className: 'character-wizard',
      attributes: {
        role: 'dialog',
        'aria-labelledby': 'wizard-title',
        'aria-modal': 'true',
      },
      ...options,
    });

    // Wizard state
    this.currentStep = 1;
    this.totalSteps = 6;
    this.characterData = {
      name: '',
      subject: 'math',
      appearance: {},
      personality: {},
      education: {},
      interactions: {},
      metadata: {},
    };

    // Step configuration
    this.steps = [
      { id: 1, name: 'basics', title: 'Basic Info', description: 'Name and subject' },
      { id: 2, name: 'appearance', title: 'Appearance', description: 'Look and colors' },
      { id: 3, name: 'personality', title: 'Personality', description: 'Traits and voice' },
      { id: 4, name: 'education', title: 'Education', description: 'Specialties and level' },
      { id: 5, name: 'interactions', title: 'Interactions', description: 'Messages and phrases' },
      { id: 6, name: 'review', title: 'Review', description: 'Final check' },
    ];

    // Validation state
    this.validationErrors = {};
    this.isValid = false;

    // Preview character
    this.previewCharacter = null;
    this.previewRenderer = new CharacterPreviewRenderer({
      size: 'medium',
      animated: true,
      interactive: false,
    });

    // Callbacks
    this.onComplete = options.onComplete || (() => {});
    this.onCancel = options.onCancel || (() => {});
    this.onPreviewUpdate = options.onPreviewUpdate || (() => {});

    this.init();
  }

  /**
   * Generate the wizard HTML structure
   */
  generateHTML() {
    return `
      <div id="${this.options.id}" class="character-wizard" data-component="character-wizard">
        <div class="wizard-backdrop"></div>
        <div class="wizard-content">
          <div class="wizard-header">
            <h2 id="wizard-title">Create Your Character</h2>
            <button class="wizard-close" aria-label="Close wizard">
              <span aria-hidden="true">×</span>
            </button>
          </div>

          <div class="wizard-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${(this.currentStep / this.totalSteps) * 100}%"></div>
            </div>
            <div class="progress-steps">
              ${this.steps
    .map(
      step => `
                <div class="progress-step ${step.id <= this.currentStep ? 'active' : ''} ${step.id === this.currentStep ? 'current' : ''}" 
                     data-step="${step.id}">
                  <div class="step-number">${step.id}</div>
                  <div class="step-label">
                    <div class="step-title">${step.title}</div>
                    <div class="step-description">${step.description}</div>
                  </div>
                </div>
              `
    )
    .join('')}
            </div>
          </div>

          <div class="wizard-body">
            <div class="wizard-main">
              <div class="wizard-steps">
                ${this.renderAllSteps()}
              </div>
            </div>

            <div class="wizard-preview">
              <div class="preview-header">
                <h3>Preview</h3>
                <button class="preview-refresh" title="Refresh preview">
                  <span aria-hidden="true">🔄</span>
                </button>
              </div>
              <div class="preview-content">
                <div class="character-preview-container">
                  <!-- Character preview will be rendered here -->
                  <div class="preview-placeholder">
                    <div class="placeholder-icon">👤</div>
                    <p>Character preview will appear here</p>
                  </div>
                </div>
                <div class="preview-info">
                  <div class="preview-name">Character Name</div>
                  <div class="preview-subject">Subject Area</div>
                  <div class="preview-traits">
                    <!-- Personality traits will appear here -->
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="wizard-footer">
            <div class="wizard-validation">
              <div class="validation-status"></div>
            </div>
            <div class="wizard-actions">
              <button class="btn-secondary wizard-back" ${this.currentStep === 1 ? 'disabled' : ''}>
                <span class="btn-icon">←</span>
                Back
              </button>
              <button class="btn-primary wizard-next" ${this.currentStep === this.totalSteps ? 'style="display: none;"' : ''}>
                Next
                <span class="btn-icon">→</span>
              </button>
              <button class="btn-success wizard-create" ${this.currentStep === this.totalSteps ? '' : 'style="display: none;"'}>
                <span class="btn-icon">✓</span>
                Create Character
              </button>
              <button class="btn-tertiary wizard-cancel">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render all wizard steps
   */
  renderAllSteps() {
    return this.steps
      .map(
        step => `
      <div class="wizard-step ${step.id === this.currentStep ? 'active' : ''}" data-step="${step.id}">
        ${this.renderStep(step)}
      </div>
    `
      )
      .join('');
  }

  /**
   * Render individual wizard step
   */
  renderStep(step) {
    switch (step.name) {
    case 'basics':
      return this.renderBasicsStep();
    case 'appearance':
      return this.renderAppearanceStep();
    case 'personality':
      return this.renderPersonalityStep();
    case 'education':
      return this.renderEducationStep();
    case 'interactions':
      return this.renderInteractionsStep();
    case 'review':
      return this.renderReviewStep();
    default:
      return '<div>Step not implemented</div>';
    }
  }

  /**
   * Render basics step (name and subject)
   */
  renderBasicsStep() {
    const subjects = CharacterUtils.getAvailableSubjects();

    return `
      <div class="step-content">
        <div class="step-header">
          <h3>Basic Information</h3>
          <p>Let's start with the essentials - what's your character's name and subject area?</p>
        </div>

        <div class="form-group">
          <label for="character-name" class="form-label">Character Name *</label>
          <input 
            type="text" 
            id="character-name" 
            class="form-input" 
            placeholder="Enter a friendly name..."
            value="${this.characterData.name}"
            maxlength="30"
            required
          >
          <div class="form-help">Choose a memorable name that fits your character's personality</div>
          <div class="form-error" id="name-error"></div>
        </div>

        <div class="form-group">
          <label for="character-subject" class="form-label">Subject Area *</label>
          <select id="character-subject" class="form-select" required>
            ${subjects
    .map(
      subject => `
              <option value="${subject}" ${this.characterData.subject === subject ? 'selected' : ''}>
                ${subject.charAt(0).toUpperCase() + subject.slice(1)}
              </option>
            `
    )
    .join('')}
          </select>
          <div class="form-help">What subject will your character help teach?</div>
        </div>

        <div class="quick-actions">
          <button type="button" class="btn-outline random-name" data-subject="${this.characterData.subject}">
            <span class="btn-icon">🎲</span>
            Random Name
          </button>
          <button type="button" class="btn-outline use-template">
            <span class="btn-icon">📋</span>
            Use Template
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render appearance step
   */
  renderAppearanceStep() {
    const colorPalettes = CharacterUtils.getColorPalettes(this.characterData.subject);

    return `
      <div class="step-content">
        <div class="step-header">
          <h3>Character Appearance</h3>
          <p>Design how your character will look - colors, shape, and accessories</p>
        </div>

        <div class="appearance-sections">
          <div class="form-section">
            <h4>Shape & Size</h4>
            <div class="form-group">
              <label class="form-label">Base Shape</label>
              <div class="shape-selector">
                ${['circle', 'oval', 'square', 'rectangle', 'triangle', 'hexagon']
    .map(
      shape => `
                  <button type="button" class="shape-option ${(this.characterData.appearance?.baseShape || 'circle') === shape ? 'selected' : ''}" 
                          data-shape="${shape}" title="${shape}">
                    <div class="shape-preview shape-${shape}"></div>
                    <span>${shape}</span>
                  </button>
                `
    )
    .join('')}
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Size</label>
              <div class="size-selector">
                ${['small', 'medium', 'large']
    .map(
      size => `
                  <button type="button" class="size-option ${(this.characterData.appearance?.size || 'medium') === size ? 'selected' : ''}" 
                          data-size="${size}">
                    ${size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                `
    )
    .join('')}
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4>Colors</h4>
            <div class="color-palettes">
              ${colorPalettes
    .map(
      (palette, index) => `
                <button type="button" class="color-palette ${index === 0 ? 'selected' : ''}" 
                        data-palette='${JSON.stringify(palette)}'>
                  <div class="palette-colors">
                    <div class="color-swatch" style="background-color: ${palette.primary}"></div>
                    <div class="color-swatch" style="background-color: ${palette.secondary}"></div>
                    <div class="color-swatch" style="background-color: ${palette.accent}"></div>
                  </div>
                  <span class="palette-name">${palette.name}</span>
                </button>
              `
    )
    .join('')}
            </div>

            <div class="custom-colors">
              <div class="form-group-inline">
                <label for="primary-color">Primary</label>
                <input type="color" id="primary-color" value="${this.characterData.appearance?.primaryColor || '#4A90E2'}">
              </div>
              <div class="form-group-inline">
                <label for="secondary-color">Secondary</label>
                <input type="color" id="secondary-color" value="${this.characterData.appearance?.secondaryColor || '#FFFFFF'}">
              </div>
              <div class="form-group-inline">
                <label for="accent-color">Accent</label>
                <input type="color" id="accent-color" value="${this.characterData.appearance?.accentColor || '#FFD700'}">
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4>Features</h4>
            <div class="features-grid">
              <div class="form-group">
                <label class="form-label">Eyes</label>
                <select id="eye-shape" class="form-select">
                  <option value="circle">Circle</option>
                  <option value="oval">Oval</option>
                  <option value="almond">Almond</option>
                  <option value="square">Square</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Mouth</label>
                <select id="mouth-shape" class="form-select">
                  <option value="smile">Smile</option>
                  <option value="neutral">Neutral</option>
                  <option value="open">Open</option>
                  <option value="small">Small</option>
                  <option value="wide">Wide</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="quick-actions">
          <button type="button" class="btn-outline randomize-appearance">
            <span class="btn-icon">🎨</span>
            Randomize Look
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render personality step
   */
  renderPersonalityStep() {
    const traitCombinations = CharacterUtils.getPersonalityTraits();
    const allTraits = [
      'friendly',
      'energetic',
      'wise',
      'curious',
      'patient',
      'creative',
      'logical',
      'encouraging',
      'playful',
      'methodical',
      'inspiring',
      'adventurous',
      'calm',
      'enthusiastic',
      'helpful',
    ];

    return `
      <div class="step-content">
        <div class="step-header">
          <h3>Character Personality</h3>
          <p>What personality traits make your character unique?</p>
        </div>

        <div class="form-group">
          <label class="form-label">Personality Traits</label>
          <div class="trait-suggestions">
            <p class="form-help">Choose up to 3 traits that define your character:</p>
            <div class="trait-combinations">
              ${traitCombinations
    .slice(0, 5)
    .map(
      (combo, index) => `
                <button type="button" class="trait-combo ${index === 0 ? 'selected' : ''}" 
                        data-traits='${JSON.stringify(combo)}'>
                  ${combo.map(trait => `<span class="trait-tag">${trait}</span>`).join('')}
                </button>
              `
    )
    .join('')}
            </div>
          </div>

          <div class="trait-selector">
            <div class="available-traits">
              ${allTraits
    .map(
      trait => `
                <button type="button" class="trait-option" data-trait="${trait}">
                  ${trait}
                </button>
              `
    )
    .join('')}
            </div>
            <div class="selected-traits">
              <div class="selected-traits-label">Selected Traits:</div>
              <div class="selected-traits-list">
                <!-- Selected traits will appear here -->
              </div>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="primary-trait" class="form-label">Primary Trait</label>
          <select id="primary-trait" class="form-select">
            <option value="">Select primary trait...</option>
            ${allTraits
    .map(
      trait => `
              <option value="${trait}">${trait}</option>
            `
    )
    .join('')}
          </select>
          <div class="form-help">The main personality characteristic</div>
        </div>

        <div class="form-group">
          <label for="voice-type" class="form-label">Voice Type</label>
          <select id="voice-type" class="form-select">
            <option value="child">Child - High, cheerful voice</option>
            <option value="adult">Adult - Mature, clear voice</option>
            <option value="elderly">Elderly - Wise, gentle voice</option>
            <option value="robotic">Robotic - Digital, precise voice</option>
            <option value="melodic">Melodic - Musical, rhythmic voice</option>
          </select>
        </div>

        <div class="form-group">
          <label for="catchphrases" class="form-label">Catchphrases (Optional)</label>
          <textarea 
            id="catchphrases" 
            class="form-textarea" 
            placeholder="Enter unique phrases your character might say, one per line..."
            rows="3"
          ></textarea>
          <div class="form-help">Special phrases that make your character memorable</div>
        </div>
      </div>
    `;
  }

  /**
   * Render education step
   */
  renderEducationStep() {
    const specialties = CharacterUtils.getEducationSpecialties(this.characterData.subject);

    return `
      <div class="step-content">
        <div class="step-header">
          <h3>Educational Focus</h3>
          <p>Define your character's teaching specialties and approach</p>
        </div>

        <div class="form-group">
          <label class="form-label">Specialties</label>
          <div class="specialties-selector">
            ${specialties
    .map(
      specialty => `
              <button type="button" class="specialty-option" data-specialty="${specialty}">
                ${specialty}
              </button>
            `
    )
    .join('')}
          </div>
          <div class="selected-specialties">
            <div class="selected-specialties-label">Selected Specialties:</div>
            <div class="selected-specialties-list">
              <!-- Selected specialties will appear here -->
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="difficulty-level" class="form-label">Difficulty Level</label>
          <select id="difficulty-level" class="form-select">
            <option value="beginner">Beginner - Simple concepts</option>
            <option value="intermediate">Intermediate - Standard difficulty</option>
            <option value="advanced">Advanced - Complex topics</option>
            <option value="mixed" selected>Mixed - Adaptive difficulty</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Age Range</label>
          <div class="age-range-selector">
            <div class="form-group-inline">
              <label for="min-age">From</label>
              <input type="number" id="min-age" min="3" max="18" value="4" class="form-input-small">
              <span>years</span>
            </div>
            <div class="form-group-inline">
              <label for="max-age">To</label>
              <input type="number" id="max-age" min="3" max="18" value="12" class="form-input-small">
              <span>years</span>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="teaching-style" class="form-label">Teaching Style</label>
          <select id="teaching-style" class="form-select">
            <option value="visual">Visual - Charts, diagrams, images</option>
            <option value="auditory">Auditory - Sounds, music, speech</option>
            <option value="kinesthetic">Kinesthetic - Hands-on, interactive</option>
            <option value="mixed" selected>Mixed - Combination of all styles</option>
          </select>
        </div>
      </div>
    `;
  }

  /**
   * Render interactions step
   */
  renderInteractionsStep() {
    return `
      <div class="step-content">
        <div class="step-header">
          <h3>Character Interactions</h3>
          <p>Define how your character communicates with learners</p>
        </div>

        <div class="interaction-sections">
          <div class="form-group">
            <label for="greetings" class="form-label">Greetings</label>
            <textarea 
              id="greetings" 
              class="form-textarea" 
              placeholder="Hello! Ready to learn together?&#10;Hi there! Let's explore some fun activities!&#10;Welcome! I'm excited to help you learn!"
              rows="3"
            ></textarea>
            <div class="form-help">How your character greets learners (one per line)</div>
          </div>

          <div class="form-group">
            <label for="encouragements" class="form-label">Encouragements</label>
            <textarea 
              id="encouragements" 
              class="form-textarea" 
              placeholder="You're doing great! Keep it up!&#10;Excellent work! I'm proud of you!&#10;That's the right thinking! You've got this!"
              rows="3"
            ></textarea>
            <div class="form-help">Motivational messages during learning</div>
          </div>

          <div class="form-group">
            <label for="celebrations" class="form-label">Celebrations</label>
            <textarea 
              id="celebrations" 
              class="form-textarea" 
              placeholder="Fantastic! You did it!&#10;Amazing work! Well done!&#10;Perfect! You're a star!"
              rows="3"
            ></textarea>
            <div class="form-help">Success celebration messages</div>
          </div>

          <div class="form-group">
            <label for="hints" class="form-label">Hints & Tips (Optional)</label>
            <textarea 
              id="hints" 
              class="form-textarea" 
              placeholder="Try breaking the problem into smaller parts&#10;Remember to check your work&#10;Don't worry about mistakes - they help us learn!"
              rows="3"
            ></textarea>
            <div class="form-help">Helpful hints for when learners need guidance</div>
          </div>
        </div>

        <div class="quick-actions">
          <button type="button" class="btn-outline generate-messages">
            <span class="btn-icon">💬</span>
            Generate Messages
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render review step
   */
  renderReviewStep() {
    return `
      <div class="step-content">
        <div class="step-header">
          <h3>Review Your Character</h3>
          <p>Check all the details before creating your character</p>
        </div>

        <div class="character-summary">
          <div class="summary-section">
            <h4>Basic Information</h4>
            <div class="summary-item">
              <span class="label">Name:</span>
              <span class="value" id="review-name">${this.characterData.name || 'Not set'}</span>
            </div>
            <div class="summary-item">
              <span class="label">Subject:</span>
              <span class="value" id="review-subject">${this.characterData.subject || 'Not set'}</span>
            </div>
          </div>

          <div class="summary-section">
            <h4>Appearance</h4>
            <div class="summary-item">
              <span class="label">Shape:</span>
              <span class="value" id="review-shape">${this.characterData.appearance?.baseShape || 'circle'}</span>
            </div>
            <div class="summary-item">
              <span class="label">Colors:</span>
              <div class="value">
                <div class="color-preview">
                  <div class="color-swatch" style="background-color: ${this.characterData.appearance?.primaryColor || '#4A90E2'}"></div>
                  <div class="color-swatch" style="background-color: ${this.characterData.appearance?.secondaryColor || '#FFFFFF'}"></div>
                  <div class="color-swatch" style="background-color: ${this.characterData.appearance?.accentColor || '#FFD700'}"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="summary-section">
            <h4>Personality</h4>
            <div class="summary-item">
              <span class="label">Traits:</span>
              <span class="value" id="review-traits">
                ${this.characterData.personality?.traits?.map(trait => `<span class="trait-tag">${trait}</span>`).join('') || 'Not set'}
              </span>
            </div>
            <div class="summary-item">
              <span class="label">Voice:</span>
              <span class="value" id="review-voice">${this.characterData.personality?.voiceType || 'child'}</span>
            </div>
          </div>

          <div class="summary-section">
            <h4>Education</h4>
            <div class="summary-item">
              <span class="label">Specialties:</span>
              <span class="value" id="review-specialties">
                ${this.characterData.education?.specialties?.join(', ') || 'Not set'}
              </span>
            </div>
            <div class="summary-item">
              <span class="label">Level:</span>
              <span class="value" id="review-level">${this.characterData.education?.difficultyLevel || 'mixed'}</span>
            </div>
          </div>
        </div>

        <div class="creation-options">
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="save-as-template" class="form-checkbox">
              <span class="checkmark"></span>
              Save as template for future use
            </label>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="make-public" class="form-checkbox">
              <span class="checkmark"></span>
              Make character publicly shareable
            </label>
          </div>
        </div>

        <div class="validation-summary">
          <!-- Validation results will appear here -->
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

    // Wizard navigation
    const backBtn = this.element.querySelector('.wizard-back');
    const nextBtn = this.element.querySelector('.wizard-next');
    const createBtn = this.element.querySelector('.wizard-create');
    const cancelBtn = this.element.querySelector('.wizard-cancel');
    const closeBtn = this.element.querySelector('.wizard-close');
    const previewRefresh = this.element.querySelector('.preview-refresh');

    if (backBtn) backBtn.addEventListener('click', () => this.previousStep());
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());
    if (createBtn) createBtn.addEventListener('click', () => this.createCharacter());
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.cancel());
    if (closeBtn) closeBtn.addEventListener('click', () => this.cancel());
    if (previewRefresh) previewRefresh.addEventListener('click', () => this.updatePreview());

    // Step-specific event listeners
    this.attachStepEventListeners();

    // Initial preview update
    this.updatePreview();
  }

  /**
   * Attach step-specific event listeners
   */
  attachStepEventListeners() {
    // This will be called each time the step changes
    // We'll add event listeners for the current step's form elements

    const currentStepElement = this.element.querySelector(
      `.wizard-step[data-step="${this.currentStep}"]`
    );
    if (!currentStepElement) return;

    // Common form input listeners
    const inputs = currentStepElement.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('input', () => this.handleFormInput(input));
      input.addEventListener('change', () => this.handleFormInput(input));
    });

    // Step-specific listeners
    switch (this.currentStep) {
    case 1: // Basics
      this.attachBasicsListeners(currentStepElement);
      break;
    case 2: // Appearance
      this.attachAppearanceListeners(currentStepElement);
      break;
    case 3: // Personality
      this.attachPersonalityListeners(currentStepElement);
      break;
    case 4: // Education
      this.attachEducationListeners(currentStepElement);
      break;
    case 5: // Interactions
      this.attachInteractionsListeners(currentStepElement);
      break;
    case 6: // Review
      this.attachReviewListeners(currentStepElement);
      break;
    }
  }

  /**
   * Attach basics step listeners
   */
  attachBasicsListeners(stepElement) {
    const randomNameBtn = stepElement.querySelector('.random-name');
    const useTemplateBtn = stepElement.querySelector('.use-template');

    if (randomNameBtn) {
      randomNameBtn.addEventListener('click', () => {
        const names = CharacterUtils.getNameSuggestions(this.characterData.subject, 10);
        const randomName = names[Math.floor(Math.random() * names.length)];
        const nameInput = stepElement.querySelector('#character-name');
        if (nameInput) {
          nameInput.value = randomName;
          this.handleFormInput(nameInput);
        }
      });
    }

    if (useTemplateBtn) {
      useTemplateBtn.addEventListener('click', () => {
        this.showTemplateSelector();
      });
    }
  }

  /**
   * Attach appearance step listeners
   */
  attachAppearanceListeners(stepElement) {
    // Shape selector
    const shapeOptions = stepElement.querySelectorAll('.shape-option');
    shapeOptions.forEach(option => {
      option.addEventListener('click', () => {
        shapeOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        this.characterData.appearance.baseShape = option.dataset.shape;
        this.updatePreview();
      });
    });

    // Size selector
    const sizeOptions = stepElement.querySelectorAll('.size-option');
    sizeOptions.forEach(option => {
      option.addEventListener('click', () => {
        sizeOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        this.characterData.appearance.size = option.dataset.size;
        this.updatePreview();
      });
    });

    // Color palette selector
    const paletteOptions = stepElement.querySelectorAll('.color-palette');
    paletteOptions.forEach(option => {
      option.addEventListener('click', () => {
        paletteOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        const palette = JSON.parse(option.dataset.palette);
        this.characterData.appearance.primaryColor = palette.primary;
        this.characterData.appearance.secondaryColor = palette.secondary;
        this.characterData.appearance.accentColor = palette.accent;

        // Update color inputs
        const primaryInput = stepElement.querySelector('#primary-color');
        const secondaryInput = stepElement.querySelector('#secondary-color');
        const accentInput = stepElement.querySelector('#accent-color');

        if (primaryInput) primaryInput.value = palette.primary;
        if (secondaryInput) secondaryInput.value = palette.secondary;
        if (accentInput) accentInput.value = palette.accent;

        this.updatePreview();
      });
    });

    // Randomize appearance
    const randomizeBtn = stepElement.querySelector('.randomize-appearance');
    if (randomizeBtn) {
      randomizeBtn.addEventListener('click', () => {
        this.randomizeAppearance();
      });
    }
  }

  /**
   * Attach personality step listeners
   */
  attachPersonalityListeners(stepElement) {
    // Trait combinations
    const traitCombos = stepElement.querySelectorAll('.trait-combo');
    traitCombos.forEach(combo => {
      combo.addEventListener('click', () => {
        traitCombos.forEach(c => c.classList.remove('selected'));
        combo.classList.add('selected');
        const traits = JSON.parse(combo.dataset.traits);
        this.selectTraits(traits);
      });
    });

    // Individual trait selection
    const traitOptions = stepElement.querySelectorAll('.trait-option');
    traitOptions.forEach(option => {
      option.addEventListener('click', () => {
        this.toggleTrait(option.dataset.trait);
      });
    });
  }

  /**
   * Attach education step listeners
   */
  attachEducationListeners(stepElement) {
    // Specialty selection
    const specialtyOptions = stepElement.querySelectorAll('.specialty-option');
    specialtyOptions.forEach(option => {
      option.addEventListener('click', () => {
        this.toggleSpecialty(option.dataset.specialty);
      });
    });
  }

  /**
   * Attach interactions step listeners
   */
  attachInteractionsListeners(stepElement) {
    const generateBtn = stepElement.querySelector('.generate-messages');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        this.generateInteractionMessages();
      });
    }
  }

  /**
   * Attach review step listeners
   */
  attachReviewListeners(_stepElement) {
    // Any review-specific interactions
  }

  // Navigation methods

  nextStep() {
    if (this.currentStep < this.totalSteps && this.validateCurrentStep()) {
      this.currentStep++;
      this.updateWizardDisplay();
      this.updatePreview();
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateWizardDisplay();
    }
  }

  goToStep(stepNumber) {
    if (stepNumber >= 1 && stepNumber <= this.totalSteps) {
      this.currentStep = stepNumber;
      this.updateWizardDisplay();
    }
  }

  // Form handling methods

  handleFormInput(input) {
    const { id, value, type: _type } = input;

    // Update character data based on input
    switch (id) {
    case 'character-name':
      this.characterData.name = value;
      break;
    case 'character-subject':
      this.characterData.subject = value;
      break;
    case 'primary-color':
      this.characterData.appearance.primaryColor = value;
      break;
    case 'secondary-color':
      this.characterData.appearance.secondaryColor = value;
      break;
    case 'accent-color':
      this.characterData.appearance.accentColor = value;
      break;
    case 'eye-shape':
      this.characterData.appearance.eyes = {
        ...this.characterData.appearance.eyes,
        shape: value,
      };
      break;
    case 'mouth-shape':
      this.characterData.appearance.mouth = {
        ...this.characterData.appearance.mouth,
        shape: value,
      };
      break;
    case 'primary-trait':
      this.characterData.personality.primaryTrait = value;
      break;
    case 'voice-type':
      this.characterData.personality.voiceType = value;
      break;
    case 'catchphrases':
      this.characterData.personality.catchphrases = value
        .split('\n')
        .filter(phrase => phrase.trim());
      break;
    case 'difficulty-level':
      this.characterData.education.difficultyLevel = value;
      break;
    case 'min-age':
      this.characterData.education.ageRange = {
        ...this.characterData.education.ageRange,
        min: parseInt(value),
      };
      break;
    case 'max-age':
      this.characterData.education.ageRange = {
        ...this.characterData.education.ageRange,
        max: parseInt(value),
      };
      break;
    case 'teaching-style':
      this.characterData.education.teachingStyle = value;
      break;
    case 'greetings':
      this.characterData.interactions.greetings = value.split('\n').filter(msg => msg.trim());
      break;
    case 'encouragements':
      this.characterData.interactions.encouragements = value
        .split('\n')
        .filter(msg => msg.trim());
      break;
    case 'celebrations':
      this.characterData.interactions.celebrations = value.split('\n').filter(msg => msg.trim());
      break;
    case 'hints':
      this.characterData.interactions.hints = value.split('\n').filter(msg => msg.trim());
      break;
    }

    // Validate current step
    this.validateCurrentStep();

    // Update preview
    this.updatePreview();
  }

  // Validation methods

  validateCurrentStep() {
    this.validationErrors = {};

    switch (this.currentStep) {
    case 1:
      return this.validateBasics();
    case 2:
      return this.validateAppearance();
    case 3:
      return this.validatePersonality();
    case 4:
      return this.validateEducation();
    case 5:
      return this.validateInteractions();
    case 6:
      return this.validateReview();
    default:
      return true;
    }
  }

  validateBasics() {
    let isValid = true;

    if (!this.characterData.name || this.characterData.name.trim().length < 2) {
      this.validationErrors.name = 'Character name must be at least 2 characters long';
      isValid = false;
    }

    if (this.characterData.name && this.characterData.name.length > 30) {
      this.validationErrors.name = 'Character name cannot exceed 30 characters';
      isValid = false;
    }

    if (!this.characterData.subject) {
      this.validationErrors.subject = 'Please select a subject';
      isValid = false;
    }

    this.updateValidationDisplay();
    return isValid;
  }

  validateAppearance() {
    // Appearance is mostly optional, but ensure we have some basic values
    if (!this.characterData.appearance) {
      this.characterData.appearance = {};
    }

    // Set defaults if missing
    if (!this.characterData.appearance.baseShape)
      this.characterData.appearance.baseShape = 'circle';
    if (!this.characterData.appearance.size) this.characterData.appearance.size = 'medium';
    if (!this.characterData.appearance.primaryColor)
      this.characterData.appearance.primaryColor = '#4A90E2';
    if (!this.characterData.appearance.secondaryColor)
      this.characterData.appearance.secondaryColor = '#FFFFFF';
    if (!this.characterData.appearance.accentColor)
      this.characterData.appearance.accentColor = '#FFD700';

    return true;
  }

  validatePersonality() {
    let isValid = true;

    if (!this.characterData.personality) {
      this.characterData.personality = {};
    }

    if (
      !this.characterData.personality.traits ||
      this.characterData.personality.traits.length === 0
    ) {
      this.validationErrors.traits = 'Please select at least one personality trait';
      isValid = false;
    }

    if (!this.characterData.personality.primaryTrait) {
      this.validationErrors.primaryTrait = 'Please select a primary trait';
      isValid = false;
    }

    this.updateValidationDisplay();
    return isValid;
  }

  validateEducation() {
    if (!this.characterData.education) {
      this.characterData.education = {};
    }

    // Set defaults if missing
    if (!this.characterData.education.specialties) this.characterData.education.specialties = [];
    if (!this.characterData.education.difficultyLevel)
      this.characterData.education.difficultyLevel = 'mixed';
    if (!this.characterData.education.ageRange)
      this.characterData.education.ageRange = { min: 4, max: 12 };
    if (!this.characterData.education.teachingStyle)
      this.characterData.education.teachingStyle = 'mixed';

    return true;
  }

  validateInteractions() {
    if (!this.characterData.interactions) {
      this.characterData.interactions = {};
    }

    // Set defaults if missing
    if (!this.characterData.interactions.greetings)
      this.characterData.interactions.greetings = ['Hello! Ready to learn together?'];
    if (!this.characterData.interactions.encouragements)
      this.characterData.interactions.encouragements = ['You\'re doing great! Keep it up!'];
    if (!this.characterData.interactions.celebrations)
      this.characterData.interactions.celebrations = ['Fantastic! You did it!'];
    if (!this.characterData.interactions.hints) this.characterData.interactions.hints = [];

    return true;
  }

  validateReview() {
    // Final validation using the character generation API
    const preview = CharacterGenerationAPI.generatePreview(this.characterData);
    const validation = preview.validation;

    this.isValid = validation.isValid;

    if (!validation.isValid) {
      this.validationErrors = { review: validation.errors };
    }

    this.updateValidationDisplay();
    return validation.isValid;
  }

  // UI update methods

  updateWizardDisplay() {
    // Update progress bar
    const progressFill = this.element.querySelector('.progress-fill');
    if (progressFill) {
      progressFill.style.width = `${(this.currentStep / this.totalSteps) * 100}%`;
    }

    // Update step indicators
    const progressSteps = this.element.querySelectorAll('.progress-step');
    progressSteps.forEach((step, index) => {
      const stepNumber = index + 1;
      step.classList.toggle('active', stepNumber <= this.currentStep);
      step.classList.toggle('current', stepNumber === this.currentStep);
    });

    // Show/hide appropriate steps
    const wizardSteps = this.element.querySelectorAll('.wizard-step');
    wizardSteps.forEach((step, index) => {
      const stepNumber = index + 1;
      step.classList.toggle('active', stepNumber === this.currentStep);
    });

    // Update navigation buttons
    const backBtn = this.element.querySelector('.wizard-back');
    const nextBtn = this.element.querySelector('.wizard-next');
    const createBtn = this.element.querySelector('.wizard-create');

    if (backBtn) backBtn.disabled = this.currentStep === 1;
    if (nextBtn)
      nextBtn.style.display = this.currentStep === this.totalSteps ? 'none' : 'inline-flex';
    if (createBtn)
      createBtn.style.display = this.currentStep === this.totalSteps ? 'inline-flex' : 'none';

    // Re-attach event listeners for new step
    this.attachStepEventListeners();

    // Update validation
    this.validateCurrentStep();
  }

  updatePreview() {
    const preview = CharacterGenerationAPI.generatePreview(this.characterData);
    this.previewCharacter = preview.character;

    // Update preview info
    const previewName = this.element.querySelector('.preview-name');
    const previewSubject = this.element.querySelector('.preview-subject');
    const previewTraits = this.element.querySelector('.preview-traits');

    if (previewName) previewName.textContent = this.previewCharacter.name || 'Character Name';
    if (previewSubject)
      previewSubject.textContent = this.previewCharacter.subject || 'Subject Area';
    if (previewTraits) {
      previewTraits.innerHTML =
        this.previewCharacter.personality?.traits
          ?.map(trait => `<span class="trait-tag">${trait}</span>`)
          .join('') || '';
    }

    // Update visual character preview
    const previewContainer = this.element.querySelector('.character-preview-container');
    if (previewContainer && this.previewCharacter) {
      try {
        // Clear existing preview
        previewContainer.innerHTML = '';

        // Render new character preview
        const characterSVG = this.previewRenderer.renderCharacter(this.previewCharacter);
        previewContainer.appendChild(characterSVG);

        // Add preview controls if character has meaningful data
        if (this.previewCharacter.name && this.previewCharacter.appearance) {
          const controls = this.createPreviewControls();
          previewContainer.appendChild(controls);
        }
      } catch (error) {
        console.warn('Failed to render character preview:', error);
        previewContainer.innerHTML = `
          <div class="preview-placeholder">
            <div class="placeholder-icon">👤</div>
            <p>Preview unavailable</p>
          </div>
        `;
      }
    }

    // Notify parent component
    this.onPreviewUpdate(this.previewCharacter);
  }

  updateValidationDisplay() {
    const validationStatus = this.element.querySelector('.validation-status');
    if (!validationStatus) return;

    const hasErrors = Object.keys(this.validationErrors).length > 0;

    if (hasErrors) {
      validationStatus.innerHTML = `
        <div class="validation-errors">
          <div class="validation-icon">⚠️</div>
          <div class="validation-messages">
            ${Object.values(this.validationErrors)
    .map(error => `<div class="error-message">${error}</div>`)
    .join('')}
          </div>
        </div>
      `;
    } else {
      validationStatus.innerHTML = `
        <div class="validation-success">
          <div class="validation-icon">✅</div>
          <div class="validation-message">Step completed successfully</div>
        </div>
      `;
    }

    // Update form field error states
    Object.keys(this.validationErrors).forEach(field => {
      const input = this.element.querySelector(`#${field}, #${field.replace('_', '-')}`);
      const errorElement = this.element.querySelector(`#${field}-error`);

      if (input) {
        input.classList.add('error');
      }

      if (errorElement) {
        errorElement.textContent = this.validationErrors[field];
      }
    });
  }

  // Character creation methods

  async createCharacter() {
    if (!this.validateCurrentStep()) {
      return;
    }

    try {
      // Show loading state
      const createBtn = this.element.querySelector('.wizard-create');
      if (createBtn) {
        createBtn.disabled = true;
        createBtn.innerHTML = '<span class="btn-spinner">⟳</span> Creating...';
      }

      // Get additional options from review step
      const saveAsTemplate = this.element.querySelector('#save-as-template')?.checked || false;
      const makePublic = this.element.querySelector('#make-public')?.checked || false;

      // Set metadata
      this.characterData.metadata = {
        ...this.characterData.metadata,
        creator: 'user',
        isPublic: makePublic,
        tags: [this.characterData.subject],
      };

      // Create character
      const result = await CharacterGenerationAPI.createCharacter(this.characterData);

      if (result.success) {
        // Save as template if requested
        if (saveAsTemplate) {
          // This would save the character as a template
          // Implementation depends on template system
        }

        // Notify completion
        this.onComplete(result);

        // Close wizard
        this.hide();
      } else {
        // Show error
        this.showError(result.error, result.details);
      }
    } catch (error) {
      console.error('Character creation failed:', error);
      this.showError('Character creation failed', [error.message]);
    } finally {
      // Reset button state
      const createBtn = this.element.querySelector('.wizard-create');
      if (createBtn) {
        createBtn.disabled = false;
        createBtn.innerHTML = '<span class="btn-icon">✓</span> Create Character';
      }
    }
  }

  // Utility methods

  selectTraits(traits) {
    this.characterData.personality.traits = [...traits];

    // Update primary trait if not set or not in selected traits
    if (
      !this.characterData.personality.primaryTrait ||
      !traits.includes(this.characterData.personality.primaryTrait)
    ) {
      this.characterData.personality.primaryTrait = traits[0];
    }

    // Update UI
    this.updateTraitDisplay();
    this.updatePreview();
  }

  toggleTrait(trait) {
    if (!this.characterData.personality.traits) {
      this.characterData.personality.traits = [];
    }

    const traits = this.characterData.personality.traits;
    const index = traits.indexOf(trait);

    if (index >= 0) {
      traits.splice(index, 1);
    } else if (traits.length < 3) {
      traits.push(trait);
    }

    this.updateTraitDisplay();
    this.updatePreview();
  }

  toggleSpecialty(specialty) {
    if (!this.characterData.education.specialties) {
      this.characterData.education.specialties = [];
    }

    const specialties = this.characterData.education.specialties;
    const index = specialties.indexOf(specialty);

    if (index >= 0) {
      specialties.splice(index, 1);
    } else if (specialties.length < 5) {
      specialties.push(specialty);
    }

    this.updateSpecialtyDisplay();
    this.updatePreview();
  }

  updateTraitDisplay() {
    const selectedTraitsList = this.element.querySelector('.selected-traits-list');
    const traitOptions = this.element.querySelectorAll('.trait-option');

    if (selectedTraitsList) {
      selectedTraitsList.innerHTML =
        this.characterData.personality.traits
          ?.map(
            trait =>
              `<span class="selected-trait">${trait} <button type="button" data-remove-trait="${trait}">×</button></span>`
          )
          .join('') || '<span class="no-selection">No traits selected</span>';

      // Add remove listeners
      selectedTraitsList.querySelectorAll('[data-remove-trait]').forEach(btn => {
        btn.addEventListener('click', () => this.toggleTrait(btn.dataset.removeTrait));
      });
    }

    // Update trait option states
    traitOptions.forEach(option => {
      const isSelected = this.characterData.personality.traits?.includes(option.dataset.trait);
      option.classList.toggle('selected', isSelected);
    });

    // Update primary trait dropdown
    const primaryTraitSelect = this.element.querySelector('#primary-trait');
    if (primaryTraitSelect) {
      primaryTraitSelect.innerHTML = `
        <option value="">Select primary trait...</option>
        ${
  this.characterData.personality.traits
    ?.map(
      trait =>
        `<option value="${trait}" ${this.characterData.personality.primaryTrait === trait ? 'selected' : ''}>${trait}</option>`
    )
    .join('') || ''
}
      `;
    }
  }

  updateSpecialtyDisplay() {
    const selectedSpecialtiesList = this.element.querySelector('.selected-specialties-list');
    const specialtyOptions = this.element.querySelectorAll('.specialty-option');

    if (selectedSpecialtiesList) {
      selectedSpecialtiesList.innerHTML =
        this.characterData.education.specialties
          ?.map(
            specialty =>
              `<span class="selected-specialty">${specialty} <button type="button" data-remove-specialty="${specialty}">×</button></span>`
          )
          .join('') || '<span class="no-selection">No specialties selected</span>';

      // Add remove listeners
      selectedSpecialtiesList.querySelectorAll('[data-remove-specialty]').forEach(btn => {
        btn.addEventListener('click', () => this.toggleSpecialty(btn.dataset.removeSpecialty));
      });
    }

    // Update specialty option states
    specialtyOptions.forEach(option => {
      const isSelected = this.characterData.education.specialties?.includes(
        option.dataset.specialty
      );
      option.classList.toggle('selected', isSelected);
    });
  }

  randomizeAppearance() {
    // Get random values for appearance
    const shapes = ['circle', 'oval', 'square', 'rectangle', 'triangle', 'hexagon'];
    const sizes = ['small', 'medium', 'large'];
    const palettes = CharacterUtils.getColorPalettes(this.characterData.subject);

    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
    const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
    const randomPalette = palettes[Math.floor(Math.random() * palettes.length)];

    // Update character data
    this.characterData.appearance = {
      ...this.characterData.appearance,
      baseShape: randomShape,
      size: randomSize,
      primaryColor: randomPalette.primary,
      secondaryColor: randomPalette.secondary,
      accentColor: randomPalette.accent,
    };

    // Update UI
    this.updateWizardDisplay();
    this.updatePreview();
  }

  generateInteractionMessages() {
    // Generate subject-specific messages
    const subjectMessages = {
      math: {
        greetings: [
          'Let\'s solve some fun equations!',
          'Ready for number adventures?',
          'Math magic time!',
        ],
        encouragements: [
          'You\'re calculating perfectly!',
          'Great problem solving!',
          'Mathematical genius!',
        ],
        celebrations: ['Number wizard!', 'Math master!', 'Equation expert!'],
      },
      science: {
        greetings: ['Time for discovery!', 'Let\'s experiment!', 'Science adventure awaits!'],
        encouragements: ['Excellent hypothesis!', 'Great observation!', 'Scientific thinking!'],
        celebrations: ['Scientific genius!', 'Discovery master!', 'Experiment expert!'],
      },
      // Add more subjects as needed
    };

    const messages = subjectMessages[this.characterData.subject] || {
      greetings: ['Hello! Ready to learn?', 'Let\'s explore together!', 'Learning time!'],
      encouragements: ['Great work!', 'Keep it up!', 'Excellent effort!'],
      celebrations: ['Fantastic!', 'Amazing work!', 'You did it!'],
    };

    // Update form fields
    const greetingsField = this.element.querySelector('#greetings');
    const encouragementsField = this.element.querySelector('#encouragements');
    const celebrationsField = this.element.querySelector('#celebrations');

    if (greetingsField) greetingsField.value = messages.greetings.join('\n');
    if (encouragementsField) encouragementsField.value = messages.encouragements.join('\n');
    if (celebrationsField) celebrationsField.value = messages.celebrations.join('\n');

    // Update character data
    this.characterData.interactions = {
      ...this.characterData.interactions,
      greetings: messages.greetings,
      encouragements: messages.encouragements,
      celebrations: messages.celebrations,
    };

    this.updatePreview();
  }

  showTemplateSelector() {
    // Show a modal with available templates
    const modal = new Modal({
      title: 'Choose Template',
      content: this.renderTemplateSelector(),
      confirmButtonText: 'Use Template',
      showCancel: true,
      onConfirm: () => {
        const selectedTemplate = this.element.querySelector(
          'input[name="template"]:checked'
        )?.value;
        if (selectedTemplate) {
          this.applyTemplate(selectedTemplate);
        }
        modal.hide();
      },
    });
    modal.show();
  }

  renderTemplateSelector() {
    const subjects = CharacterUtils.getAvailableSubjects();

    return `
      <div class="template-selector">
        <p>Choose a template to get started quickly:</p>
        <div class="template-options">
          ${subjects
    .map(
      subject => `
            <label class="template-option">
              <input type="radio" name="template" value="${subject}">
              <div class="template-card">
                <div class="template-name">${subject.charAt(0).toUpperCase() + subject.slice(1)}</div>
                <div class="template-description">Pre-configured ${subject} character</div>
              </div>
            </label>
          `
    )
    .join('')}
        </div>
      </div>
    `;
  }

  applyTemplate(templateName) {
    // Apply template data to character
    // This would merge template data with current character data
    // Implementation depends on available templates
    console.log(`Applying template: ${templateName}`);
  }

  showError(message, details = []) {
    const modal = new Modal({
      title: 'Error',
      content: `
        <div class="error-content">
          <div class="error-message">${message}</div>
          ${
  details.length > 0
    ? `
            <div class="error-details">
              <h4>Details:</h4>
              <ul>
                ${details.map(detail => `<li>${detail}</li>`).join('')}
              </ul>
            </div>
          `
    : ''
}
        </div>
      `,
      confirmButtonText: 'OK',
      showCancel: false,
    });
    modal.show();
  }

  cancel() {
    this.onCancel();
    this.hide();
  }

  show() {
    if (this.element) {
      this.element.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    return this;
  }

  hide() {
    if (this.element) {
      this.element.classList.remove('active');
      document.body.style.overflow = '';
    }
    return this;
  }

  /**
   * Create preview controls for the character preview
   */
  createPreviewControls() {
    const controls = document.createElement('div');
    controls.className = 'preview-controls';

    controls.innerHTML = `
      <div class="preview-actions">
        <button type="button" class="preview-action" data-action="rotate" title="Rotate character">
          <span aria-hidden="true">🔄</span>
        </button>
        <button type="button" class="preview-action" data-action="zoom" title="Zoom character">
          <span aria-hidden="true">🔍</span>
        </button>
        <button type="button" class="preview-action" data-action="animate" title="Animate character">
          <span aria-hidden="true">✨</span>
        </button>
      </div>
    `;

    // Add event listeners for preview controls
    controls.addEventListener('click', e => {
      const action = e.target.closest('.preview-action')?.dataset.action;
      if (action) {
        this.handlePreviewAction(action);
      }
    });

    return controls;
  }

  /**
   * Handle preview control actions
   */
  handlePreviewAction(action) {
    const characterSVG = this.element.querySelector('.character-preview-container svg');
    if (!characterSVG) return;

    switch (action) {
    case 'rotate':
      // Apply rotation animation
      characterSVG.style.transition = 'transform 0.5s ease';
      characterSVG.style.transform = 'rotate(360deg)';
      setTimeout(() => {
        characterSVG.style.transform = 'rotate(0deg)';
      }, 500);
      break;

    case 'zoom':
      // Apply zoom animation
      characterSVG.style.transition = 'transform 0.3s ease';
      characterSVG.style.transform = 'scale(1.2)';
      setTimeout(() => {
        characterSVG.style.transform = 'scale(1)';
      }, 300);
      break;

    case 'animate':
      // Trigger character animation if supported
      if (this.previewRenderer && typeof this.previewRenderer.animateCharacter === 'function') {
        this.previewRenderer.animateCharacter(characterSVG);
      } else {
        // Fallback bounce animation
        characterSVG.style.transition = 'transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        characterSVG.style.transform = 'translateY(-20px)';
        setTimeout(() => {
          characterSVG.style.transform = 'translateY(0)';
        }, 300);
      }
      break;
    }
  }

  /**
   * Get current character data
   */
  getCharacterData() {
    return { ...this.characterData };
  }

  /**
   * Set character data (for editing existing characters)
   */
  setCharacterData(data) {
    this.characterData = { ...data };
    this.updateWizardDisplay();
    this.updatePreview();
  }

  /**
   * Reset wizard to initial state
   */
  reset() {
    this.currentStep = 1;
    this.characterData = {
      name: '',
      subject: 'math',
      appearance: {},
      personality: {},
      education: {},
      interactions: {},
      metadata: {},
    };
    this.validationErrors = {};
    this.isValid = false;
    this.previewCharacter = null;

    this.updateWizardDisplay();
    this.updatePreview();
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.CharacterWizard = CharacterWizard;
}
