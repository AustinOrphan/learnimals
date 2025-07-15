/**
 * Character Preview Renderer
 * Renders visual previews of characters during creation
 * 
 * Part of Phase D: Character Generator Core
 */

export default class CharacterPreviewRenderer {
  constructor(options = {}) {
    this.container = null;
    this.character = null;
    this.size = options.size || 'medium';
    this.animated = options.animated !== false;
    this.interactive = options.interactive !== false;
    this.theme = options.theme || 'educational'; // Phase E: Enhanced themes
    
    // Rendering dimensions
    this.dimensions = {
      small: { width: 80, height: 80 },
      medium: { width: 120, height: 120 },
      large: { width: 200, height: 200 }
    };
    
    // Phase E: Enhanced visual themes
    this.themes = {
      educational: {
        borderWidth: 2,
        shadowStrength: 0.3,
        gradientIntensity: 0.4,
        accessoryStyle: 'realistic'
      },
      playful: {
        borderWidth: 3,
        shadowStrength: 0.5,
        gradientIntensity: 0.6,
        accessoryStyle: 'cartoon'
      },
      professional: {
        borderWidth: 1,
        shadowStrength: 0.2,
        gradientIntensity: 0.2,
        accessoryStyle: 'minimal'
      },
      artistic: {
        borderWidth: 4,
        shadowStrength: 0.4,
        gradientIntensity: 0.8,
        accessoryStyle: 'stylized'
      }
    };
    
    // Phase E: Subject-specific visual elements
    this.subjectElements = {
      math: { symbol: '∑', patterns: ['grid', 'spiral'], tools: ['calculator', 'protractor'] },
      science: { symbol: '⚛', patterns: ['atom', 'molecule'], tools: ['microscope', 'flask'] },
      reading: { symbol: '📖', patterns: ['letters', 'words'], tools: ['book', 'bookmark'] },
      art: { symbol: '🎨', patterns: ['rainbow', 'palette'], tools: ['brush', 'palette'] },
      coding: { symbol: '</>', patterns: ['binary', 'circuit'], tools: ['laptop', 'code'] }
    };
    
    // Phase E: Enhanced emotion expressions
    this.expressions = {
      happy: { eyeShape: 'circle', mouthShape: 'smile', eyebrows: 'raised' },
      excited: { eyeShape: 'wide', mouthShape: 'grin', eyebrows: 'raised', sparkles: true },
      thinking: { eyeShape: 'almond', mouthShape: 'neutral', eyebrows: 'concentrated' },
      surprised: { eyeShape: 'wide', mouthShape: 'oh', eyebrows: 'raised' },
      proud: { eyeShape: 'confident', mouthShape: 'smile', eyebrows: 'satisfied' },
      encouraging: { eyeShape: 'warm', mouthShape: 'smile', eyebrows: 'gentle' }
    };
  }

  /**
   * Render character preview to container
   * @param {HTMLElement} container - Container element
   * @param {Object} character - Character data
   */
  render(container, character) {
    this.container = container;
    this.character = character;
    
    if (!container || !character) {
      this.renderPlaceholder();
      return;
    }

    // Clear container
    container.innerHTML = '';
    
    // Create SVG element
    const svg = this.createCharacterSVG();
    container.appendChild(svg);
    
    // Add character info if requested
    if (this.size === 'large') {
      const info = this.createCharacterInfo();
      container.appendChild(info);
    }
    
    // Add animations if enabled
    if (this.animated) {
      this.addAnimations(svg);
    }
    
    // Add interactivity if enabled
    if (this.interactive) {
      this.addInteractivity(svg);
    }
  }

  /**
   * Create SVG representation of character
   */
  createCharacterSVG() {
    const { width, height } = this.dimensions[this.size];
    const appearance = this.character.appearance || {};
    
    // Extract appearance properties
    const baseShape = appearance.baseShape || 'circle';
    const primaryColor = appearance.primaryColor || '#4A90E2';
    const secondaryColor = appearance.secondaryColor || '#FFFFFF';
    const accentColor = appearance.accentColor || '#FFD700';
    const eyeShape = appearance.eyes?.shape || 'circle';
    const eyeColor = appearance.eyes?.color || '#333333';
    const mouthShape = appearance.mouth?.shape || 'smile';
    const accessories = appearance.accessories || [];

    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.classList.add('character-preview-svg');
    
    // Add gradient definitions
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <linearGradient id="character-gradient-${this.generateId()}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${this.darkenColor(primaryColor, 0.2)};stop-opacity:1" />
      </linearGradient>
      <filter id="character-shadow-${this.generateId()}" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.2)"/>
      </filter>
    `;
    svg.appendChild(defs);

    // Create character base shape
    const baseElement = this.createBaseShape(baseShape, width, height, primaryColor);
    svg.appendChild(baseElement);

    // Add face elements
    const face = this.createFace(width, height, eyeShape, eyeColor, mouthShape);
    svg.appendChild(face);

    // Add accessories
    accessories.forEach(accessory => {
      const accessoryElement = this.createAccessory(accessory, width, height);
      if (accessoryElement) {
        svg.appendChild(accessoryElement);
      }
    });

    // Phase E: Add subject background pattern
    if (this.theme !== 'minimal') {
      const background = this.createSubjectBackground(width, height, this.character.subject);
      svg.insertBefore(background, svg.firstChild);
    }

    // Phase E: Use enhanced subject badge
    const subjectBadge = this.createEnhancedSubjectBadge(width, height, this.character.subject, accentColor);
    svg.appendChild(subjectBadge);

    // Phase E: Add advanced animations if enabled
    if (this.animated) {
      this.addAdvancedAnimations(svg);
    }

    return svg;
  }

  /**
   * Create base shape for character
   */
  createBaseShape(shape, width, height, color) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.classList.add('character-base');
    
    const centerX = width / 2;
    const centerY = height / 2;
    const size = Math.min(width, height) * 0.8;
    
    let shapeElement;
    
    switch (shape) {
    case 'circle':
      shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      shapeElement.setAttribute('cx', centerX);
      shapeElement.setAttribute('cy', centerY);
      shapeElement.setAttribute('r', size / 2);
      break;
      
    case 'oval':
      shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      shapeElement.setAttribute('cx', centerX);
      shapeElement.setAttribute('cy', centerY);
      shapeElement.setAttribute('rx', size / 2);
      shapeElement.setAttribute('ry', size / 2.5);
      break;
      
    case 'square':
    case 'rectangle':
      shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const rectWidth = shape === 'square' ? size : size * 1.2;
      const rectHeight = shape === 'square' ? size : size * 0.8;
      shapeElement.setAttribute('x', centerX - rectWidth / 2);
      shapeElement.setAttribute('y', centerY - rectHeight / 2);
      shapeElement.setAttribute('width', rectWidth);
      shapeElement.setAttribute('height', rectHeight);
      shapeElement.setAttribute('rx', size * 0.1);
      break;
      
    case 'triangle':
      shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      const points = [
        [centerX, centerY - size / 2],
        [centerX - size / 2, centerY + size / 2],
        [centerX + size / 2, centerY + size / 2]
      ].map(p => p.join(',')).join(' ');
      shapeElement.setAttribute('points', points);
      break;
      
    case 'hexagon':
      shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      const hexSize = size / 2;
      const hexPoints = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60 - 90) * Math.PI / 180;
        const x = centerX + hexSize * Math.cos(angle);
        const y = centerY + hexSize * Math.sin(angle);
        hexPoints.push([x, y].join(','));
      }
      shapeElement.setAttribute('points', hexPoints.join(' '));
      break;
      
    default:
      shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      shapeElement.setAttribute('cx', centerX);
      shapeElement.setAttribute('cy', centerY);
      shapeElement.setAttribute('r', size / 2);
    }
    
    shapeElement.setAttribute('fill', `url(#character-gradient-${this.generateId()})`);
    shapeElement.setAttribute('stroke', this.darkenColor(color, 0.3));
    shapeElement.setAttribute('stroke-width', '2');
    shapeElement.setAttribute('filter', `url(#character-shadow-${this.generateId()})`);
    
    group.appendChild(shapeElement);
    return group;
  }

  /**
   * Create face elements (eyes and mouth)
   */
  createFace(width, height, eyeShape, eyeColor, mouthShape) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.classList.add('character-face');
    
    const centerX = width / 2;
    const centerY = height / 2;
    const faceSize = Math.min(width, height) * 0.6;
    
    // Create eyes
    const eyeSize = faceSize * 0.12;
    const eyeOffset = faceSize * 0.15;
    const eyeY = centerY - faceSize * 0.1;
    
    // Left eye
    const leftEye = this.createEye(centerX - eyeOffset, eyeY, eyeSize, eyeShape, eyeColor);
    group.appendChild(leftEye);
    
    // Right eye
    const rightEye = this.createEye(centerX + eyeOffset, eyeY, eyeSize, eyeShape, eyeColor);
    group.appendChild(rightEye);
    
    // Create mouth
    const mouth = this.createMouth(centerX, centerY + faceSize * 0.15, faceSize * 0.3, mouthShape);
    group.appendChild(mouth);
    
    return group;
  }

  /**
   * Create individual eye
   */
  createEye(x, y, size, shape, color) {
    let eyeElement;
    
    switch (shape) {
    case 'circle':
      eyeElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      eyeElement.setAttribute('cx', x);
      eyeElement.setAttribute('cy', y);
      eyeElement.setAttribute('r', size);
      break;
      
    case 'oval':
      eyeElement = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      eyeElement.setAttribute('cx', x);
      eyeElement.setAttribute('cy', y);
      eyeElement.setAttribute('rx', size);
      eyeElement.setAttribute('ry', size * 0.8);
      break;
      
    case 'almond':
      eyeElement = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      eyeElement.setAttribute('cx', x);
      eyeElement.setAttribute('cy', y);
      eyeElement.setAttribute('rx', size * 1.2);
      eyeElement.setAttribute('ry', size * 0.6);
      break;
      
    case 'square':
      eyeElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      eyeElement.setAttribute('x', x - size);
      eyeElement.setAttribute('y', y - size);
      eyeElement.setAttribute('width', size * 2);
      eyeElement.setAttribute('height', size * 2);
      eyeElement.setAttribute('rx', size * 0.2);
      break;
      
    default:
      eyeElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      eyeElement.setAttribute('cx', x);
      eyeElement.setAttribute('cy', y);
      eyeElement.setAttribute('r', size);
    }
    
    eyeElement.setAttribute('fill', color);
    eyeElement.classList.add('character-eye');
    
    return eyeElement;
  }

  /**
   * Create mouth based on shape
   */
  createMouth(x, y, width, shape) {
    let mouthElement;
    
    switch (shape) {
    case 'smile':
      mouthElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      mouthElement.setAttribute('d', `M ${x - width/2} ${y} Q ${x} ${y + width/3} ${x + width/2} ${y}`);
      mouthElement.setAttribute('stroke', '#333333');
      mouthElement.setAttribute('stroke-width', '3');
      mouthElement.setAttribute('fill', 'none');
      mouthElement.setAttribute('stroke-linecap', 'round');
      break;
      
    case 'neutral':
      mouthElement = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      mouthElement.setAttribute('x1', x - width/2);
      mouthElement.setAttribute('y1', y);
      mouthElement.setAttribute('x2', x + width/2);
      mouthElement.setAttribute('y2', y);
      mouthElement.setAttribute('stroke', '#333333');
      mouthElement.setAttribute('stroke-width', '3');
      mouthElement.setAttribute('stroke-linecap', 'round');
      break;
      
    case 'open':
      mouthElement = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      mouthElement.setAttribute('cx', x);
      mouthElement.setAttribute('cy', y);
      mouthElement.setAttribute('rx', width/3);
      mouthElement.setAttribute('ry', width/4);
      mouthElement.setAttribute('fill', '#333333');
      break;
      
    case 'small':
      mouthElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      mouthElement.setAttribute('cx', x);
      mouthElement.setAttribute('cy', y);
      mouthElement.setAttribute('r', width/6);
      mouthElement.setAttribute('fill', '#333333');
      break;
      
    case 'wide':
      mouthElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      mouthElement.setAttribute('d', `M ${x - width/2} ${y} Q ${x} ${y + width/4} ${x + width/2} ${y}`);
      mouthElement.setAttribute('stroke', '#333333');
      mouthElement.setAttribute('stroke-width', '4');
      mouthElement.setAttribute('fill', 'none');
      mouthElement.setAttribute('stroke-linecap', 'round');
      break;
      
    default:
      mouthElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      mouthElement.setAttribute('d', `M ${x - width/2} ${y} Q ${x} ${y + width/3} ${x + width/2} ${y}`);
      mouthElement.setAttribute('stroke', '#333333');
      mouthElement.setAttribute('stroke-width', '3');
      mouthElement.setAttribute('fill', 'none');
      mouthElement.setAttribute('stroke-linecap', 'round');
    }
    
    mouthElement.classList.add('character-mouth');
    return mouthElement;
  }

  /**
   * Create accessory elements
   */
  createAccessory(accessory, width, height) {
    const { type, color, position } = accessory;
    const centerX = width / 2;
    const centerY = height / 2;
    const x = centerX + (position?.x || 0) * width * 0.3;
    const y = centerY + (position?.y || 0) * height * 0.3;
    
    let accessoryElement;
    
    switch (type) {
    case 'hat':
      accessoryElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      accessoryElement.setAttribute('x', x - width * 0.25);
      accessoryElement.setAttribute('y', y - height * 0.15);
      accessoryElement.setAttribute('width', width * 0.5);
      accessoryElement.setAttribute('height', height * 0.1);
      accessoryElement.setAttribute('rx', width * 0.02);
      accessoryElement.setAttribute('fill', color || '#8B4513');
      break;
      
    case 'glasses':
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      // Left lens
      const leftLens = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      leftLens.setAttribute('cx', x - width * 0.08);
      leftLens.setAttribute('cy', y);
      leftLens.setAttribute('r', width * 0.06);
      leftLens.setAttribute('fill', 'none');
      leftLens.setAttribute('stroke', color || '#333333');
      leftLens.setAttribute('stroke-width', '2');
      group.appendChild(leftLens);
      
      // Right lens
      const rightLens = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      rightLens.setAttribute('cx', x + width * 0.08);
      rightLens.setAttribute('cy', y);
      rightLens.setAttribute('r', width * 0.06);
      rightLens.setAttribute('fill', 'none');
      rightLens.setAttribute('stroke', color || '#333333');
      rightLens.setAttribute('stroke-width', '2');
      group.appendChild(rightLens);
      
      // Bridge
      const bridge = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      bridge.setAttribute('x1', x - width * 0.02);
      bridge.setAttribute('y1', y);
      bridge.setAttribute('x2', x + width * 0.02);
      bridge.setAttribute('y2', y);
      bridge.setAttribute('stroke', color || '#333333');
      bridge.setAttribute('stroke-width', '2');
      group.appendChild(bridge);
      
      accessoryElement = group;
      break;
      
    case 'bow':
      accessoryElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      const bowPoints = [
        [x - width * 0.05, y],
        [x - width * 0.02, y - height * 0.03],
        [x, y],
        [x + width * 0.02, y - height * 0.03],
        [x + width * 0.05, y],
        [x + width * 0.02, y + height * 0.03],
        [x, y],
        [x - width * 0.02, y + height * 0.03]
      ].map(p => p.join(',')).join(' ');
      accessoryElement.setAttribute('points', bowPoints);
      accessoryElement.setAttribute('fill', color || '#FF69B4');
      break;
      
    case 'badge':
      accessoryElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      accessoryElement.setAttribute('cx', x);
      accessoryElement.setAttribute('cy', y);
      accessoryElement.setAttribute('r', width * 0.04);
      accessoryElement.setAttribute('fill', color || '#FFD700');
      accessoryElement.setAttribute('stroke', '#FFA500');
      accessoryElement.setAttribute('stroke-width', '1');
      break;
      
    default:
      return null;
    }
    
    if (accessoryElement) {
      accessoryElement.classList.add('character-accessory', `accessory-${type}`);
    }
    
    return accessoryElement;
  }

  /**
   * Create subject badge
   */
  createSubjectBadge(width, height, color) {
    const x = width - 20;
    const y = 20;
    
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.classList.add('subject-badge');
    
    // Badge background
    const badge = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    badge.setAttribute('cx', x);
    badge.setAttribute('cy', y);
    badge.setAttribute('r', 10);
    badge.setAttribute('fill', color);
    badge.setAttribute('stroke', this.darkenColor(color, 0.3));
    badge.setAttribute('stroke-width', '1');
    
    // Subject initial
    const initial = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    initial.setAttribute('x', x);
    initial.setAttribute('y', y + 4);
    initial.setAttribute('text-anchor', 'middle');
    initial.setAttribute('font-size', '10');
    initial.setAttribute('font-weight', 'bold');
    initial.setAttribute('fill', '#FFFFFF');
    initial.textContent = (this.character.subject || 'G').charAt(0).toUpperCase();
    
    group.appendChild(badge);
    group.appendChild(initial);
    
    return group;
  }

  /**
   * Create character info display
   */
  createCharacterInfo() {
    const info = document.createElement('div');
    info.className = 'character-preview-info';
    
    const personality = this.character.personality || {};
    const traits = personality.traits || [];
    const specialties = this.character.education?.specialties || [];
    
    info.innerHTML = `
      <div class="character-name">${this.character.name || 'Unnamed Character'}</div>
      <div class="character-subject">${this.character.subject || 'General'}</div>
      ${traits.length > 0 ? `
        <div class="character-traits">
          ${traits.map(trait => `<span class="trait-tag">${trait}</span>`).join('')}
        </div>
      ` : ''}
      ${specialties.length > 0 ? `
        <div class="character-specialties">
          <div class="specialties-label">Specialties:</div>
          <div class="specialties-list">${specialties.slice(0, 3).join(', ')}</div>
        </div>
      ` : ''}
    `;
    
    return info;
  }

  /**
   * Add animations to SVG
   */
  addAnimations(svg) {
    // Breathing animation for base shape
    const base = svg.querySelector('.character-base');
    if (base) {
      const baseShape = base.firstElementChild;
      if (baseShape) {
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
        animate.setAttribute('attributeName', 'transform');
        animate.setAttribute('type', 'scale');
        animate.setAttribute('values', '1;1.02;1');
        animate.setAttribute('dur', '3s');
        animate.setAttribute('repeatCount', 'indefinite');
        baseShape.appendChild(animate);
      }
    }
    
    // Blinking animation for eyes
    const eyes = svg.querySelectorAll('.character-eye');
    eyes.forEach((eye, index) => {
      const blink = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      blink.setAttribute('attributeName', 'opacity');
      blink.setAttribute('values', '1;1;0;1;1');
      blink.setAttribute('dur', '4s');
      blink.setAttribute('begin', `${index * 0.1}s`);
      blink.setAttribute('repeatCount', 'indefinite');
      eye.appendChild(blink);
    });
  }

  /**
   * Add interactivity to SVG
   */
  addInteractivity(svg) {
    svg.style.cursor = 'pointer';
    svg.addEventListener('click', () => this.handleClick());
    svg.addEventListener('mouseenter', () => this.handleHover(true));
    svg.addEventListener('mouseleave', () => this.handleHover(false));
  }

  /**
   * Handle click events
   */
  handleClick() {
    if (this.character) {
      // Trigger a fun animation
      const svg = this.container.querySelector('svg');
      if (svg) {
        svg.style.transform = 'scale(1.1)';
        svg.style.transition = 'transform 0.2s ease';
        
        setTimeout(() => {
          svg.style.transform = 'scale(1)';
        }, 200);
      }
      
      // Emit event
      const event = new CustomEvent('characterPreviewClick', {
        detail: { character: this.character }
      });
      this.container.dispatchEvent(event);
    }
  }

  /**
   * Handle hover events
   */
  handleHover(isHovering) {
    const svg = this.container.querySelector('svg');
    if (svg) {
      if (isHovering) {
        svg.style.filter = 'brightness(1.1)';
        svg.style.transition = 'filter 0.2s ease';
      } else {
        svg.style.filter = 'brightness(1)';
      }
    }
  }

  /**
   * Render placeholder when no character is available
   */
  renderPlaceholder() {
    if (!this.container) return;
    
    const { width, height } = this.dimensions[this.size];
    
    this.container.innerHTML = `
      <div class="character-preview-placeholder" style="
        width: ${width}px;
        height: ${height}px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: var(--bg-tertiary);
        border: 2px dashed var(--border-color);
        border-radius: 12px;
        color: var(--text-secondary);
      ">
        <div style="font-size: ${width * 0.3}px; margin-bottom: 8px;">👤</div>
        <div style="font-size: 12px; text-align: center;">No Character</div>
      </div>
    `;
  }

  /**
   * Update character and re-render
   */
  updateCharacter(character) {
    this.character = character;
    if (this.container) {
      this.render(this.container, character);
    }
  }

  /**
   * Utility methods
   */
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  darkenColor(color, amount) {
    // Convert hex to RGB, darken, and convert back
    const hex = color.replace('#', '');
    const r = Math.floor(parseInt(hex.substr(0, 2), 16) * (1 - amount));
    const g = Math.floor(parseInt(hex.substr(2, 2), 16) * (1 - amount));
    const b = Math.floor(parseInt(hex.substr(4, 2), 16) * (1 - amount));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  /**
   * Phase E: Enhanced animation system
   */
  addAdvancedAnimations(svg) {
    const currentTheme = this.themes[this.theme];
    
    // Add floating animation for playful theme
    if (this.theme === 'playful') {
      svg.style.animation = 'character-float 3s ease-in-out infinite';
    }
    
    // Add breathing effect for all themes
    const baseShape = svg.querySelector('.character-base');
    if (baseShape) {
      baseShape.style.animation = 'character-breathe 4s ease-in-out infinite';
    }
    
    // Add blinking animation to eyes
    const eyes = svg.querySelectorAll('.character-eye');
    eyes.forEach((eye, index) => {
      eye.style.animation = `character-blink 5s infinite ${index * 0.1}s`;
    });
    
    // Add sparkle effects for excited expression
    if (this.character.personality?.mood === 'excited') {
      this.addSparkleEffects(svg);
    }
  }

  /**
   * Phase E: Add sparkle effects for excited characters
   */
  addSparkleEffects(svg) {
    const sparkleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    sparkleGroup.classList.add('sparkle-effects');
    
    const { width, height } = this.dimensions[this.size];
    
    for (let i = 0; i < 6; i++) {
      const sparkle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      sparkle.setAttribute('r', '2');
      sparkle.setAttribute('fill', '#FFD700');
      sparkle.setAttribute('opacity', '0');
      
      // Random position around character
      const angle = (i * 60) * Math.PI / 180;
      const distance = Math.min(width, height) * 0.6;
      const x = width / 2 + Math.cos(angle) * distance;
      const y = height / 2 + Math.sin(angle) * distance;
      
      sparkle.setAttribute('cx', x);
      sparkle.setAttribute('cy', y);
      sparkle.style.animation = `sparkle-twinkle 2s infinite ${i * 0.3}s`;
      
      sparkleGroup.appendChild(sparkle);
    }
    
    svg.appendChild(sparkleGroup);
  }

  /**
   * Phase E: Render character with expression
   */
  renderWithExpression(container, character, expression = 'happy') {
    this.character = character;
    
    // Apply expression to character appearance
    if (this.expressions[expression]) {
      const expr = this.expressions[expression];
      character.appearance = {
        ...character.appearance,
        eyeShape: expr.eyeShape,
        mouthShape: expr.mouthShape,
        eyebrows: expr.eyebrows
      };
      
      if (expr.sparkles) {
        character.personality = { ...character.personality, mood: 'excited' };
      }
    }
    
    this.render(container, character);
  }

  /**
   * Phase E: Add subject-themed background patterns
   */
  createSubjectBackground(width, height, subject) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.classList.add('subject-background');
    group.setAttribute('opacity', '0.1');
    
    const elements = this.subjectElements[subject] || this.subjectElements['math'];
    const pattern = elements.patterns[0];
    
    switch (pattern) {
    case 'grid':
      // Math grid pattern
      for (let x = 0; x < width; x += 20) {
        for (let y = 0; y < height; y += 20) {
          const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          dot.setAttribute('cx', x);
          dot.setAttribute('cy', y);
          dot.setAttribute('r', '1');
          dot.setAttribute('fill', '#333');
          group.appendChild(dot);
        }
      }
      break;
      
    case 'atom':
      // Science atom pattern
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Nucleus
      const nucleus = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      nucleus.setAttribute('cx', centerX);
      nucleus.setAttribute('cy', centerY);
      nucleus.setAttribute('r', '3');
      nucleus.setAttribute('fill', '#333');
      group.appendChild(nucleus);
      
      // Electron orbits
      for (let i = 0; i < 3; i++) {
        const orbit = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        orbit.setAttribute('cx', centerX);
        orbit.setAttribute('cy', centerY);
        orbit.setAttribute('rx', 20 + i * 15);
        orbit.setAttribute('ry', 10 + i * 8);
        orbit.setAttribute('fill', 'none');
        orbit.setAttribute('stroke', '#333');
        orbit.setAttribute('stroke-width', '0.5');
        orbit.setAttribute('transform', `rotate(${i * 60} ${centerX} ${centerY})`);
        group.appendChild(orbit);
      }
      break;
      
    case 'letters':
      // Reading letters pattern
      const letters = ['A', 'B', 'C', 'D', 'E'];
      letters.forEach((letter, index) => {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', 20 + index * 25);
        text.setAttribute('y', height - 20);
        text.setAttribute('font-size', '12');
        text.setAttribute('fill', '#333');
        text.textContent = letter;
        group.appendChild(text);
      });
      break;
      
    case 'rainbow':
      // Art rainbow pattern
      const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
      colors.forEach((color, index) => {
        const arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const radius = 30 + index * 3;
        arc.setAttribute('d', `M ${width/2 - radius} ${height/2} A ${radius} ${radius} 0 0 1 ${width/2 + radius} ${height/2}`);
        arc.setAttribute('stroke', color);
        arc.setAttribute('stroke-width', '2');
        arc.setAttribute('fill', 'none');
        group.appendChild(arc);
      });
      break;
      
    case 'binary':
      // Coding binary pattern
      const binary = ['1', '0', '1', '1', '0', '1', '0', '0'];
      binary.forEach((bit, index) => {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', 10 + (index % 4) * 20);
        text.setAttribute('y', 20 + Math.floor(index / 4) * 15);
        text.setAttribute('font-size', '8');
        text.setAttribute('fill', '#333');
        text.textContent = bit;
        group.appendChild(text);
      });
      break;
    }
    
    return group;
  }

  /**
   * Phase E: Create enhanced subject badge with tools
   */
  createEnhancedSubjectBadge(width, height, subject, accentColor) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.classList.add('subject-badge-enhanced');
    
    const elements = this.subjectElements[subject] || this.subjectElements['math'];
    const currentTheme = this.themes[this.theme];
    
    // Badge background
    const badge = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    badge.setAttribute('cx', width - 20);
    badge.setAttribute('cy', 20);
    badge.setAttribute('r', '12');
    badge.setAttribute('fill', accentColor);
    badge.setAttribute('stroke', this.darkenColor(accentColor, 0.3));
    badge.setAttribute('stroke-width', currentTheme.borderWidth);
    group.appendChild(badge);
    
    // Subject symbol
    const symbol = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    symbol.setAttribute('x', width - 20);
    symbol.setAttribute('y', 25);
    symbol.setAttribute('text-anchor', 'middle');
    symbol.setAttribute('font-size', '10');
    symbol.setAttribute('fill', 'white');
    symbol.textContent = elements.symbol;
    group.appendChild(symbol);
    
    // Add tool icon for larger sizes
    if (this.size === 'large') {
      const tool = elements.tools[0];
      const toolIcon = this.createToolIcon(tool, width - 35, 35, 8);
      group.appendChild(toolIcon);
    }
    
    return group;
  }

  /**
   * Phase E: Create tool icons for subjects
   */
  createToolIcon(tool, x, y, size) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    switch (tool) {
    case 'calculator':
      const calc = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      calc.setAttribute('x', x - size/2);
      calc.setAttribute('y', y - size/2);
      calc.setAttribute('width', size);
      calc.setAttribute('height', size * 1.2);
      calc.setAttribute('fill', '#333');
      calc.setAttribute('rx', '1');
      group.appendChild(calc);
      break;
      
    case 'microscope':
      const scope = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      scope.setAttribute('d', `M ${x-size/2} ${y+size/2} L ${x} ${y-size/2} L ${x+size/2} ${y+size/2}`);
      scope.setAttribute('stroke', '#333');
      scope.setAttribute('stroke-width', '2');
      scope.setAttribute('fill', 'none');
      group.appendChild(scope);
      break;
      
    case 'book':
      const book = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      book.setAttribute('x', x - size/2);
      book.setAttribute('y', y - size/3);
      book.setAttribute('width', size);
      book.setAttribute('height', size * 0.8);
      book.setAttribute('fill', '#8B4513');
      book.setAttribute('rx', '1');
      group.appendChild(book);
      break;
      
    case 'brush':
      const brush = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      brush.setAttribute('x1', x - size/2);
      brush.setAttribute('y1', y + size/2);
      brush.setAttribute('x2', x + size/2);
      brush.setAttribute('y2', y - size/2);
      brush.setAttribute('stroke', '#8B4513');
      brush.setAttribute('stroke-width', '2');
      brush.setAttribute('stroke-linecap', 'round');
      group.appendChild(brush);
      break;
      
    case 'laptop':
      const laptop = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      laptop.setAttribute('x', x - size/2);
      laptop.setAttribute('y', y - size/3);
      laptop.setAttribute('width', size);
      laptop.setAttribute('height', size * 0.6);
      laptop.setAttribute('fill', '#666');
      laptop.setAttribute('rx', '1');
      group.appendChild(laptop);
      break;
    }
    
    return group;
  }

  /**
   * Static method to quickly render a character
   */
  static quickRender(container, character, size = 'medium') {
    const renderer = new CharacterPreviewRenderer({ size, animated: false, interactive: false });
    renderer.render(container, character);
    return renderer;
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.CharacterPreviewRenderer = CharacterPreviewRenderer;
}