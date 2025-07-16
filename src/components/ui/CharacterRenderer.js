/**
 * Character Renderer Component
 * 
 * Renders SVG-based character representations with animations and interactions.
 * Supports procedural generation of character features and real-time customization.
 */

import { CharacterSchema as _CharacterSchema, DefaultCharacterTemplates as _DefaultCharacterTemplates } from '../../data/characterSchema.js';

class CharacterRenderer extends BaseComponent {
  /**
   * Create a character renderer
   * @param {Object} options - Renderer options
   * @param {Object} options.character - Character data to render
   * @param {number} [options.size=200] - SVG size in pixels
   * @param {boolean} [options.interactive=true] - Enable interactive features
   * @param {boolean} [options.animated=true] - Enable animations
   * @param {string} [options.animationState='idle'] - Initial animation state
   */
  constructor(options = {}) {
    super(options);
    
    this.character = options.character || this.createDefaultCharacter();
    this.size = options.size || 200;
    this.interactive = options.interactive !== false;
    this.animated = options.animated !== false;
    this.animationState = options.animationState || 'idle';
    
    // Animation frame management
    this.animationFrame = null;
    this.animationTime = 0;
    this.animationSpeed = 0.02;
    
    // SVG namespace
    this.svgNS = 'http://www.w3.org/2000/svg';
    
    // Cache for generated paths and shapes
    this.pathCache = new Map();
    
    // Bind methods for event handlers
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.animate = this.animate.bind(this);
  }

  /**
   * Generate the main HTML structure
   * @returns {string} Component HTML
   */
  generateHTML() {
    return `
      <div id="${this.options.id}" class="character-renderer ${this.options.cssClasses.join(' ')}" 
           style="width: ${this.size}px; height: ${this.size}px;">
        <svg class="character-svg" 
             width="${this.size}" 
             height="${this.size}" 
             viewBox="0 0 400 400" 
             xmlns="${this.svgNS}">
          <!-- Character will be rendered here -->
        </svg>
        ${this.interactive ? this.generateInteractiveOverlay() : ''}
      </div>
    `;
  }

  /**
   * Generate interactive overlay for mouse interactions
   * @returns {string} Overlay HTML
   */
  generateInteractiveOverlay() {
    return `
      <div class="character-overlay">
        <div class="interaction-zones">
          <div class="zone zone-head" data-zone="head"></div>
          <div class="zone zone-body" data-zone="body"></div>
          <div class="zone zone-tail" data-zone="tail"></div>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners after render
   */
  attachEventListeners() {
    if (!this.interactive) return;

    // Mouse interactions
    this.addEventListener('mousemove', this.handleMouseMove);
    this.addEventListener('click', this.handleClick);
    
    // Touch interactions for mobile
    this.addEventListener('touchstart', this.handleClick);
    
    // Animation state changes
    this.addEventListener('character:celebrate', () => this.setAnimationState('happy'));
    this.addEventListener('character:think', () => this.setAnimationState('thinking'));
    this.addEventListener('character:idle', () => this.setAnimationState('idle'));
  }

  /**
   * Called after component is rendered
   */
  onRender() {
    this.svgElement = this.element.querySelector('.character-svg');
    this.renderCharacter();
    
    if (this.animated) {
      this.startAnimation();
    }
  }

  /**
   * Main character rendering method
   */
  renderCharacter() {
    if (!this.svgElement) return;

    // Clear existing content
    this.svgElement.innerHTML = '';

    // Create defs for gradients and patterns
    this.createDefinitions();
    
    // Render character layers in order
    this.renderShadow();
    this.renderBody();
    this.renderFeatures();
    this.renderAccessories();
    this.renderAnimationElements();
  }

  /**
   * Create SVG definitions for reusable elements
   */
  createDefinitions() {
    const defs = this.createSVGElement('defs');
    
    // Create gradients based on character colors
    this.createGradients(defs);
    
    // Create patterns if character has pattern type
    if (this.character.appearance.patterns.type !== 'solid') {
      this.createPatterns(defs);
    }
    
    // Create filters for effects
    this.createFilters(defs);
    
    this.svgElement.appendChild(defs);
  }

  /**
   * Create color gradients for the character
   * @param {SVGElement} defs - Definitions element
   */
  createGradients(defs) {
    const { primary, secondary, accent: _accent } = this.character.appearance.colors;
    
    // Primary gradient
    const primaryGrad = this.createSVGElement('linearGradient', {
      id: 'primaryGradient',
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '100%'
    });
    
    primaryGrad.appendChild(this.createSVGElement('stop', {
      offset: '0%',
      'stop-color': this.lightenColor(primary, 20)
    }));
    
    primaryGrad.appendChild(this.createSVGElement('stop', {
      offset: '100%',
      'stop-color': this.darkenColor(primary, 10)
    }));
    
    defs.appendChild(primaryGrad);
    
    // Secondary gradient
    const secondaryGrad = this.createSVGElement('linearGradient', {
      id: 'secondaryGradient',
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '100%'
    });
    
    secondaryGrad.appendChild(this.createSVGElement('stop', {
      offset: '0%',
      'stop-color': this.lightenColor(secondary, 15)
    }));
    
    secondaryGrad.appendChild(this.createSVGElement('stop', {
      offset: '100%',
      'stop-color': secondary
    }));
    
    defs.appendChild(secondaryGrad);
  }

  /**
   * Create patterns for character appearance
   * @param {SVGElement} defs - Definitions element
   */
  createPatterns(defs) {
    const patternType = this.character.appearance.patterns.type;
    const density = this.character.appearance.patterns.density;
    
    switch (patternType) {
    case 'stripes':
      this.createStripesPattern(defs, density);
      break;
    case 'spots':
      this.createSpotsPattern(defs, density);
      break;
    case 'patches':
      this.createPatchesPattern(defs, density);
      break;
    }
  }

  /**
   * Create stripes pattern
   * @param {SVGElement} defs - Definitions element
   * @param {number} density - Pattern density (0-100)
   */
  createStripesPattern(defs, density) {
    const pattern = this.createSVGElement('pattern', {
      id: 'stripesPattern',
      patternUnits: 'userSpaceOnUse',
      width: Math.max(10, 50 - density * 0.4),
      height: Math.max(10, 50 - density * 0.4)
    });
    
    const rect = this.createSVGElement('rect', {
      width: '100%',
      height: '50%',
      fill: this.character.appearance.colors.pattern
    });
    
    pattern.appendChild(rect);
    defs.appendChild(pattern);
  }

  /**
   * Create spots pattern
   * @param {SVGElement} defs - Definitions element
   * @param {number} density - Pattern density (0-100)
   */
  createSpotsPattern(defs, density) {
    const pattern = this.createSVGElement('pattern', {
      id: 'spotsPattern',
      patternUnits: 'userSpaceOnUse',
      width: 30,
      height: 30
    });
    
    // Generate random spots based on density
    const spotCount = Math.floor(density * 0.05) + 1;
    
    for (let i = 0; i < spotCount; i++) {
      const spot = this.createSVGElement('circle', {
        cx: Math.random() * 30,
        cy: Math.random() * 30,
        r: Math.random() * 5 + 2,
        fill: this.character.appearance.colors.pattern,
        opacity: 0.7
      });
      pattern.appendChild(spot);
    }
    
    defs.appendChild(pattern);
  }

  /**
   * Create filters for visual effects
   * @param {SVGElement} defs - Definitions element
   */
  createFilters(defs) {
    // Drop shadow filter
    const shadowFilter = this.createSVGElement('filter', {
      id: 'dropShadow',
      x: '-50%',
      y: '-50%',
      width: '200%',
      height: '200%'
    });
    
    const shadowOffset = this.createSVGElement('feDropShadow', {
      dx: '2',
      dy: '4',
      'stdDeviation': '3',
      'flood-color': 'rgba(0,0,0,0.2)'
    });
    
    shadowFilter.appendChild(shadowOffset);
    defs.appendChild(shadowFilter);
  }

  /**
   * Render character shadow
   */
  renderShadow() {
    const shadow = this.createSVGElement('ellipse', {
      cx: '200',
      cy: '380',
      rx: '80',
      ry: '15',
      fill: 'rgba(0,0,0,0.1)',
      class: 'character-shadow'
    });
    
    this.svgElement.appendChild(shadow);
  }

  /**
   * Render main character body
   */
  renderBody() {
    const species = this.character.species.primary;
    const bodyType = this.character.appearance.bodyType;
    
    // Generate body shape based on species and body type
    const bodyPath = this.generateBodyPath(species, bodyType);
    
    const body = this.createSVGElement('path', {
      d: bodyPath,
      fill: 'url(#primaryGradient)',
      stroke: this.darkenColor(this.character.appearance.colors.primary, 20),
      'stroke-width': '2',
      filter: 'url(#dropShadow)',
      class: 'character-body'
    });
    
    // Apply pattern if not solid
    if (this.character.appearance.patterns.type !== 'solid') {
      body.setAttribute('fill', `url(#${this.character.appearance.patterns.type}Pattern)`);
    }
    
    this.svgElement.appendChild(body);
  }

  /**
   * Generate body path based on species and body type
   * @param {string} species - Animal species
   * @param {string} bodyType - Body type (slim, chubby, etc.)
   * @returns {string} SVG path data
   */
  generateBodyPath(species, bodyType) {
    const cacheKey = `${species}-${bodyType}`;
    
    if (this.pathCache.has(cacheKey)) {
      return this.pathCache.get(cacheKey);
    }
    
    let path;
    
    switch (species) {
    case 'cat':
      path = this.generateCatBody(bodyType);
      break;
    case 'dog':
      path = this.generateDogBody(bodyType);
      break;
    case 'shark':
      path = this.generateSharkBody(bodyType);
      break;
    case 'panda':
      path = this.generatePandaBody(bodyType);
      break;
    case 'parrot':
      path = this.generateParrotBody(bodyType);
      break;
    default:
      path = this.generateGenericBody(bodyType);
    }
    
    this.pathCache.set(cacheKey, path);
    return path;
  }

  /**
   * Generate cat body shape
   * @param {string} bodyType - Body type
   * @returns {string} SVG path
   */
  generateCatBody(bodyType) {
    const baseWidth = bodyType === 'chubby' ? 100 : bodyType === 'slim' ? 70 : 85;
    const baseHeight = bodyType === 'chubby' ? 120 : bodyType === 'slim' ? 100 : 110;
    
    return `M ${200 - baseWidth/2} 250 
            Q ${200 - baseWidth/2} ${250 - baseHeight/4} ${200} ${250 - baseHeight/2}
            Q ${200 + baseWidth/2} ${250 - baseHeight/4} ${200 + baseWidth/2} 250
            Q ${200 + baseWidth/3} ${250 + baseHeight/2} ${200} ${250 + baseHeight/2}
            Q ${200 - baseWidth/3} ${250 + baseHeight/2} ${200 - baseWidth/2} 250 Z`;
  }

  /**
   * Generate dog body shape
   * @param {string} bodyType - Body type
   * @returns {string} SVG path
   */
  generateDogBody(bodyType) {
    const baseWidth = bodyType === 'chubby' ? 110 : bodyType === 'slim' ? 75 : 90;
    const baseHeight = bodyType === 'chubby' ? 130 : bodyType === 'slim' ? 105 : 115;
    
    return `M ${200 - baseWidth/2} 260
            C ${200 - baseWidth/2} ${260 - baseHeight/3} ${200 - baseWidth/4} ${260 - baseHeight/2} ${200} ${260 - baseHeight/2}
            C ${200 + baseWidth/4} ${260 - baseHeight/2} ${200 + baseWidth/2} ${260 - baseHeight/3} ${200 + baseWidth/2} 260
            L ${200 + baseWidth/3} ${260 + baseHeight/2}
            C ${200 + baseWidth/3} ${260 + baseHeight/2 + 10} ${200 - baseWidth/3} ${260 + baseHeight/2 + 10} ${200 - baseWidth/3} ${260 + baseHeight/2}
            Z`;
  }

  /**
   * Generate shark body shape
   * @param {string} bodyType - Body type
   * @returns {string} SVG path
   */
  generateSharkBody(bodyType) {
    const baseWidth = bodyType === 'chubby' ? 120 : bodyType === 'slim' ? 80 : 100;
    const baseHeight = bodyType === 'chubby' ? 100 : bodyType === 'slim' ? 80 : 90;
    
    return `M ${200 - baseWidth/2} 270
            C ${200 - baseWidth/2 - 20} 250 ${200 - baseWidth/4} ${270 - baseHeight} ${200} ${270 - baseHeight}
            C ${200 + baseWidth/4} ${270 - baseHeight} ${200 + baseWidth/2 + 20} 250 ${200 + baseWidth/2} 270
            C ${200 + baseWidth/3} ${270 + baseHeight/2} ${200 - baseWidth/3} ${270 + baseHeight/2} ${200 - baseWidth/2} 270 Z`;
  }

  /**
   * Generate generic body shape for unknown species
   * @param {string} bodyType - Body type
   * @returns {string} SVG path
   */
  generateGenericBody(bodyType) {
    const baseWidth = bodyType === 'chubby' ? 100 : bodyType === 'slim' ? 70 : 85;
    const baseHeight = bodyType === 'chubby' ? 120 : bodyType === 'slim' ? 100 : 110;
    
    return `M ${200 - baseWidth/2} 250
            Q ${200} ${250 - baseHeight/2} ${200 + baseWidth/2} 250
            Q ${200 + baseWidth/2} ${250 + baseHeight/2} ${200} ${250 + baseHeight/2}
            Q ${200 - baseWidth/2} ${250 + baseHeight/2} ${200 - baseWidth/2} 250 Z`;
  }

  /**
   * Render facial features (eyes, mouth, nose)
   */
  renderFeatures() {
    this.renderEyes();
    this.renderMouth();
    this.renderNose();
    this.renderEars();
  }

  /**
   * Render character eyes
   */
  renderEyes() {
    const eyeType = this.character.appearance.features.eyes;
    const eyeSize = this.character.appearance.features.eyeSize === 'large' ? 20 : 
      this.character.appearance.features.eyeSize === 'small' ? 12 : 16;
    
    const leftEye = this.createEye(175, 200, eyeSize, eyeType);
    const rightEye = this.createEye(225, 200, eyeSize, eyeType);
    
    this.svgElement.appendChild(leftEye);
    this.svgElement.appendChild(rightEye);
  }

  /**
   * Create individual eye element
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} size - Eye size
   * @param {string} type - Eye type
   * @returns {SVGElement} Eye element
   */
  createEye(x, y, size, type) {
    const eyeGroup = this.createSVGElement('g', {
      class: 'character-eye',
      transform: `translate(${x}, ${y})`
    });
    
    switch (type) {
    case 'round':
      eyeGroup.appendChild(this.createSVGElement('circle', {
        cx: '0',
        cy: '0',
        r: size,
        fill: 'white',
        stroke: '#333'
      }));
      eyeGroup.appendChild(this.createSVGElement('circle', {
        cx: '0',
        cy: '0',
        r: size * 0.6,
        fill: this.character.appearance.colors.eyes,
        class: 'eye-pupil'
      }));
      break;
        
    case 'star':
      eyeGroup.appendChild(this.createStarShape(0, 0, size, 'white'));
      eyeGroup.appendChild(this.createSVGElement('circle', {
        cx: '0',
        cy: '0',
        r: size * 0.5,
        fill: this.character.appearance.colors.eyes
      }));
      break;
        
    case 'heart':
      eyeGroup.appendChild(this.createHeartShape(0, 0, size, 'white'));
      eyeGroup.appendChild(this.createSVGElement('circle', {
        cx: '0',
        cy: '2',
        r: size * 0.4,
        fill: this.character.appearance.colors.eyes
      }));
      break;
        
    default:
      // Default to round eyes
      eyeGroup.appendChild(this.createSVGElement('circle', {
        cx: '0',
        cy: '0',
        r: size,
        fill: 'white',
        stroke: '#333'
      }));
      eyeGroup.appendChild(this.createSVGElement('circle', {
        cx: '0',
        cy: '0',
        r: size * 0.6,
        fill: this.character.appearance.colors.eyes
      }));
    }
    
    return eyeGroup;
  }

  /**
   * Render character mouth
   */
  renderMouth() {
    const mouthType = this.character.appearance.features.mouth;
    const mouth = this.createMouth(200, 230, mouthType);
    this.svgElement.appendChild(mouth);
  }

  /**
   * Create mouth element
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} type - Mouth type
   * @returns {SVGElement} Mouth element
   */
  createMouth(x, y, type) {
    const mouthGroup = this.createSVGElement('g', {
      class: 'character-mouth',
      transform: `translate(${x}, ${y})`
    });
    
    switch (type) {
    case 'smile':
      mouthGroup.appendChild(this.createSVGElement('path', {
        d: 'M -15 0 Q 0 15 15 0',
        stroke: '#333',
        'stroke-width': '3',
        fill: 'none',
        'stroke-linecap': 'round'
      }));
      break;
        
    case 'grin':
      mouthGroup.appendChild(this.createSVGElement('path', {
        d: 'M -20 0 Q 0 20 20 0',
        stroke: '#333',
        'stroke-width': '3',
        fill: 'pink',
        'stroke-linecap': 'round'
      }));
      break;
        
    case 'serious':
      mouthGroup.appendChild(this.createSVGElement('line', {
        x1: '-12',
        y1: '0',
        x2: '12',
        y2: '0',
        stroke: '#333',
        'stroke-width': '3',
        'stroke-linecap': 'round'
      }));
      break;
        
    default:
      mouthGroup.appendChild(this.createSVGElement('path', {
        d: 'M -15 0 Q 0 15 15 0',
        stroke: '#333',
        'stroke-width': '3',
        fill: 'none'
      }));
    }
    
    return mouthGroup;
  }

  /**
   * Render character nose
   */
  renderNose() {
    const noseType = this.character.appearance.features.nose;
    const nose = this.createNose(200, 215, noseType);
    this.svgElement.appendChild(nose);
  }

  /**
   * Create nose element
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} type - Nose type
   * @returns {SVGElement} Nose element
   */
  createNose(x, y, type) {
    const noseGroup = this.createSVGElement('g', {
      class: 'character-nose',
      transform: `translate(${x}, ${y})`
    });
    
    const nose = this.createSVGElement('ellipse', {
      cx: '0',
      cy: '0',
      rx: type === 'large' ? '8' : type === 'small' ? '4' : '6',
      ry: type === 'large' ? '6' : type === 'small' ? '3' : '4',
      fill: this.darkenColor(this.character.appearance.colors.primary, 30)
    });
    
    noseGroup.appendChild(nose);
    return noseGroup;
  }

  /**
   * Render character ears
   */
  renderEars() {
    const earType = this.character.appearance.features.ears;
    const species = this.character.species.primary;
    
    const leftEar = this.createEar(160, 180, earType, species, 'left');
    const rightEar = this.createEar(240, 180, earType, species, 'right');
    
    this.svgElement.appendChild(leftEar);
    this.svgElement.appendChild(rightEar);
  }

  /**
   * Create ear element
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} type - Ear type
   * @param {string} species - Animal species
   * @param {string} side - 'left' or 'right'
   * @returns {SVGElement} Ear element
   */
  createEar(x, y, type, species, side) {
    const earGroup = this.createSVGElement('g', {
      class: `character-ear ear-${side}`,
      transform: `translate(${x}, ${y})`
    });
    
    // Species-specific ear shapes
    let earPath;
    
    if (species === 'cat') {
      earPath = side === 'left' ? 
        'M 0 0 L -20 -30 L 5 -25 Z' : 
        'M 0 0 L 20 -30 L -5 -25 Z';
    } else if (species === 'dog') {
      earPath = side === 'left' ? 
        'M 0 0 Q -25 -15 -15 -35 Q -5 -30 0 -25 Z' : 
        'M 0 0 Q 25 -15 15 -35 Q 5 -30 0 -25 Z';
    } else {
      // Generic ears
      earPath = side === 'left' ? 
        'M 0 0 L -15 -25 L 0 -20 Z' : 
        'M 0 0 L 15 -25 L 0 -20 Z';
    }
    
    const ear = this.createSVGElement('path', {
      d: earPath,
      fill: 'url(#primaryGradient)',
      stroke: this.darkenColor(this.character.appearance.colors.primary, 20),
      'stroke-width': '1'
    });
    
    earGroup.appendChild(ear);
    return earGroup;
  }

  /**
   * Render accessories if any
   */
  renderAccessories() {
    const accessories = this.character.appearance.accessories;
    
    // Render head accessories
    accessories.head.forEach(accessory => {
      this.renderAccessory(accessory, 'head');
    });
    
    // Render body accessories
    accessories.body.forEach(accessory => {
      this.renderAccessory(accessory, 'body');
    });
    
    // Render special accessories
    accessories.special.forEach(accessory => {
      this.renderAccessory(accessory, 'special');
    });
  }

  /**
   * Render individual accessory
   * @param {string} accessory - Accessory type
   * @param {string} category - Accessory category
   */
  renderAccessory(accessory, category) {
    // This would be expanded with specific accessory rendering logic
    console.log(`Rendering ${accessory} accessory in ${category} category`);
  }

  /**
   * Add animation elements for movement
   */
  renderAnimationElements() {
    // Add invisible elements for animation tracking
    const animationLayer = this.createSVGElement('g', {
      class: 'animation-layer'
    });
    
    this.svgElement.appendChild(animationLayer);
  }

  /**
   * Start the animation loop
   */
  startAnimation() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    this.animate();
  }

  /**
   * Main animation loop
   */
  animate() {
    this.animationTime += this.animationSpeed;
    
    // Apply current animation state
    this.applyAnimationState();
    
    // Continue animation
    this.animationFrame = requestAnimationFrame(this.animate);
  }

  /**
   * Apply animation based on current state
   */
  applyAnimationState() {
    const body = this.svgElement.querySelector('.character-body');
    const eyes = this.svgElement.querySelectorAll('.character-eye');
    
    if (!body) return;
    
    switch (this.animationState) {
    case 'idle':
      this.applyIdleAnimation(body, eyes);
      break;
    case 'happy':
      this.applyHappyAnimation(body, eyes);
      break;
    case 'thinking':
      this.applyThinkingAnimation(body, eyes);
      break;
    }
  }

  /**
   * Apply idle animation (gentle breathing)
   * @param {SVGElement} body - Body element
   * @param {NodeList} eyes - Eye elements
   */
  applyIdleAnimation(body, eyes) {
    const breatheScale = 1 + Math.sin(this.animationTime) * 0.02;
    body.style.transform = `scale(${breatheScale})`;
    body.style.transformOrigin = 'center';
    
    // Occasional blinking
    if (Math.sin(this.animationTime * 0.1) > 0.95) {
      eyes.forEach(eye => {
        eye.style.transform = 'scaleY(0.1)';
        setTimeout(() => {
          eye.style.transform = 'scaleY(1)';
        }, 100);
      });
    }
  }

  /**
   * Apply happy animation (bouncing)
   * @param {SVGElement} body - Body element
   * @param {NodeList} eyes - Eye elements
   */
  applyHappyAnimation(body, eyes) {
    const bounceY = Math.abs(Math.sin(this.animationTime * 2)) * 10;
    body.style.transform = `translateY(-${bounceY}px)`;
    
    // Happy eye sparkle effect
    eyes.forEach(eye => {
      const sparkle = Math.sin(this.animationTime * 3) * 0.2 + 1;
      eye.style.transform = `scale(${sparkle})`;
    });
  }

  /**
   * Apply thinking animation (head tilt)
   * @param {SVGElement} body - Body element
   * @param {NodeList} eyes - Eye elements
   */
  applyThinkingAnimation(body, _eyes) {
    const tiltAngle = Math.sin(this.animationTime * 0.5) * 5;
    body.style.transform = `rotate(${tiltAngle}deg)`;
    body.style.transformOrigin = 'center';
  }

  /**
   * Set animation state
   * @param {string} state - Animation state
   */
  setAnimationState(state) {
    this.animationState = state;
    
    // Reset any temporary animations
    const body = this.svgElement?.querySelector('.character-body');
    if (body) {
      body.style.transition = 'transform 0.3s ease';
    }
    
    // Auto-return to idle after some animations
    if (state === 'happy') {
      setTimeout(() => {
        if (this.animationState === 'happy') {
          this.setAnimationState('idle');
        }
      }, 2000);
    }
  }

  /**
   * Handle mouse movement for interactive features
   * @param {MouseEvent} e - Mouse event
   */
  handleMouseMove(e) {
    const rect = this.element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Make eyes follow mouse
    this.updateEyeTracking(x, y);
  }

  /**
   * Update eye tracking to follow mouse
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   */
  updateEyeTracking(mouseX, mouseY) {
    const eyes = this.svgElement?.querySelectorAll('.eye-pupil');
    if (!eyes) return;
    
    eyes.forEach((pupil, index) => {
      const eyeX = index === 0 ? 175 : 225; // Left/right eye positions
      const eyeY = 200;
      
      // Calculate relative mouse position to eye
      const relativeX = (mouseX / this.size * 400) - eyeX;
      const relativeY = (mouseY / this.size * 400) - eyeY;
      
      // Limit pupil movement within eye bounds
      const distance = Math.sqrt(relativeX * relativeX + relativeY * relativeY);
      const maxDistance = 5; // Maximum pupil offset
      
      let offsetX = relativeX;
      let offsetY = relativeY;
      
      if (distance > maxDistance) {
        offsetX = (relativeX / distance) * maxDistance;
        offsetY = (relativeY / distance) * maxDistance;
      }
      
      pupil.setAttribute('cx', offsetX);
      pupil.setAttribute('cy', offsetY);
    });
  }

  /**
   * Handle click interactions
   * @param {MouseEvent} e - Mouse event
   */
  handleClick(_e) {
    // Trigger happy animation on click
    this.setAnimationState('happy');
    
    // Emit custom event
    this.emit('character:interact', {
      type: 'click',
      character: this.character
    });
  }

  /**
   * Update character data and re-render
   * @param {Object} newCharacterData - New character data
   */
  updateCharacter(newCharacterData) {
    this.character = { ...this.character, ...newCharacterData };
    this.pathCache.clear(); // Clear cache for new character
    this.renderCharacter();
  }

  /**
   * Create default character for fallback
   * @returns {Object} Default character data
   */
  createDefaultCharacter() {
    return {
      id: 'default-character',
      name: 'Friend',
      species: { primary: 'cat', category: 'mammal' },
      appearance: {
        size: 'medium',
        bodyType: 'balanced',
        colors: {
          primary: '#4a90e2',
          secondary: '#7ed321',
          accent: '#f5a623',
          eyes: '#333333',
          pattern: '#ffffff'
        },
        patterns: {
          type: 'solid',
          density: 50,
          variation: 30
        },
        features: {
          eyes: 'round',
          eyeSize: 'medium',
          mouth: 'smile',
          ears: 'medium',
          nose: 'default'
        },
        accessories: {
          head: [],
          body: [],
          special: []
        }
      }
    };
  }

  /**
   * Utility: Create SVG element with attributes
   * @param {string} tag - SVG tag name
   * @param {Object} [attributes] - Element attributes
   * @returns {SVGElement} Created element
   */
  createSVGElement(tag, attributes = {}) {
    const element = document.createElementNS(this.svgNS, tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    
    return element;
  }

  /**
   * Utility: Lighten a color by percentage
   * @param {string} color - Hex color
   * @param {number} percent - Percentage to lighten
   * @returns {string} Lightened color
   */
  lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  /**
   * Utility: Darken a color by percentage
   * @param {string} color - Hex color
   * @param {number} percent - Percentage to darken
   * @returns {string} Darkened color
   */
  darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    
    return '#' + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
      (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
      (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
  }

  /**
   * Create star shape for eyes
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} size - Star size
   * @param {string} fill - Fill color
   * @returns {SVGElement} Star element
   */
  createStarShape(x, y, size, fill) {
    const starPath = `M ${x} ${y - size} 
                      L ${x + size * 0.3} ${y - size * 0.3}
                      L ${x + size} ${y}
                      L ${x + size * 0.3} ${y + size * 0.3}
                      L ${x} ${y + size}
                      L ${x - size * 0.3} ${y + size * 0.3}
                      L ${x - size} ${y}
                      L ${x - size * 0.3} ${y - size * 0.3} Z`;
    
    return this.createSVGElement('path', {
      d: starPath,
      fill: fill,
      stroke: '#333'
    });
  }

  /**
   * Create heart shape for eyes
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} size - Heart size
   * @param {string} fill - Fill color
   * @returns {SVGElement} Heart element
   */
  createHeartShape(x, y, size, fill) {
    const heartPath = `M ${x} ${y + size * 0.3}
                       C ${x} ${y} ${x - size} ${y} ${x - size} ${y - size * 0.5}
                       C ${x - size} ${y - size} ${x - size * 0.5} ${y - size} ${x} ${y - size * 0.3}
                       C ${x + size * 0.5} ${y - size} ${x + size} ${y - size} ${x + size} ${y - size * 0.5}
                       C ${x + size} ${y} ${x} ${y} ${x} ${y + size * 0.3} Z`;
    
    return this.createSVGElement('path', {
      d: heartPath,
      fill: fill,
      stroke: '#333'
    });
  }

  /**
   * Stop animation and clean up
   */
  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    super.destroy();
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CharacterRenderer;
} else {
  window.CharacterRenderer = CharacterRenderer;
}