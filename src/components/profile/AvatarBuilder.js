/**
 * AvatarBuilder.js
 *
 * Interactive avatar customization component
 */

import {
  AVATAR_BASES,
  AVATAR_COLORS,
  AVATAR_EYES,
  AVATAR_MOUTHS,
  AVATAR_ACCESSORIES,
  AVATAR_BACKGROUNDS,
  AvatarConfiguration,
  getUnlockedItems,
} from '../../features/profile/avatarSystem.js';
import Avatar from './Avatar.js';
import Modal from '../ui/Modal.js';

class AvatarBuilder {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.profile = options.profile || null;
    this.onSave = options.onSave || null;
    this.onCancel = options.onCancel || null;

    this.currentConfig = null;
    this.previewAvatar = null;
    this.selectedCategory = 'base';
    this.unlockedItems = null;

    this.init();
  }

  init() {
    if (!this.container) {
      console.error(`Container ${this.containerId} not found`);
      return;
    }

    if (!this.profile) {
      console.error('Profile is required for AvatarBuilder');
      return;
    }

    // Get current config or create default
    this.currentConfig = this.profile.avatar
      ? AvatarConfiguration.fromJSON(this.profile.avatar)
      : new AvatarConfiguration();

    // Get unlocked items
    this.unlockedItems = getUnlockedItems(this.profile);

    this.render();
  }

  render() {
    this.container.className = 'avatar-builder';
    this.container.innerHTML = `
      <div class="builder-header">
        <h2>Customize Your Avatar</h2>
        <button class="btn-close" aria-label="Close">✕</button>
      </div>
      
      <div class="builder-content">
        <div class="builder-preview">
          <div id="avatar-preview"></div>
          <div class="preview-actions">
            <button class="btn-random">🎲 Random</button>
            <button class="btn-reset">↺ Reset</button>
          </div>
        </div>
        
        <div class="builder-customization">
          <div class="category-tabs">
            <button class="category-tab active" data-category="base">
              <span class="tab-icon">🦁</span>
              <span class="tab-label">Animal</span>
            </button>
            <button class="category-tab" data-category="color">
              <span class="tab-icon">🎨</span>
              <span class="tab-label">Color</span>
            </button>
            <button class="category-tab" data-category="eyes">
              <span class="tab-icon">👀</span>
              <span class="tab-label">Eyes</span>
            </button>
            <button class="category-tab" data-category="mouth">
              <span class="tab-icon">😊</span>
              <span class="tab-label">Mouth</span>
            </button>
            <button class="category-tab" data-category="accessories">
              <span class="tab-icon">👓</span>
              <span class="tab-label">Accessories</span>
            </button>
            <button class="category-tab" data-category="background">
              <span class="tab-icon">🌈</span>
              <span class="tab-label">Background</span>
            </button>
          </div>
          
          <div class="category-content">
            <div id="items-grid" class="items-grid"></div>
          </div>
        </div>
      </div>
      
      <div class="builder-footer">
        <button class="btn btn-secondary btn-cancel">Cancel</button>
        <button class="btn btn-primary btn-save">Save Avatar</button>
      </div>
    `;

    this.setupEventListeners();
    this.setupPreview();
    this.loadCategory(this.selectedCategory);
  }

  setupEventListeners() {
    // Category tabs
    this.container.querySelectorAll('.category-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const category = tab.dataset.category;
        this.selectCategory(category);
      });
    });

    // Action buttons
    this.container.querySelector('.btn-random').addEventListener('click', () => {
      this.randomizeAvatar();
    });

    this.container.querySelector('.btn-reset').addEventListener('click', () => {
      this.resetAvatar();
    });

    this.container.querySelector('.btn-save').addEventListener('click', () => {
      this.saveAvatar();
    });

    this.container.querySelector('.btn-cancel').addEventListener('click', () => {
      if (this.onCancel) this.onCancel();
    });

    this.container.querySelector('.btn-close').addEventListener('click', () => {
      if (this.onCancel) this.onCancel();
    });
  }

  setupPreview() {
    this.previewAvatar = new Avatar('avatar-preview', {
      size: 200,
      showName: false,
      showLevel: false,
    });

    this.updatePreview();
  }

  updatePreview() {
    // Create temporary profile with current config
    const tempProfile = {
      ...this.profile,
      avatar: this.currentConfig.toJSON(),
    };

    this.previewAvatar.updateFromProfile(tempProfile);
  }

  selectCategory(category) {
    this.selectedCategory = category;

    // Update tab states
    this.container.querySelectorAll('.category-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.category === category);
    });

    // Load category items
    this.loadCategory(category);
  }

  loadCategory(category) {
    const grid = this.container.querySelector('#items-grid');
    grid.innerHTML = '';

    switch (category) {
      case 'base':
        this.loadBases(grid);
        break;
      case 'color':
        this.loadColors(grid);
        break;
      case 'eyes':
        this.loadEyes(grid);
        break;
      case 'mouth':
        this.loadMouths(grid);
        break;
      case 'accessories':
        this.loadAccessories(grid);
        break;
      case 'background':
        this.loadBackgrounds(grid);
        break;
    }
  }

  loadBases(grid) {
    Object.entries(AVATAR_BASES).forEach(([id, base]) => {
      const unlocked = this.unlockedItems.bases.includes(id);
      const selected = this.currentConfig.base === id;

      const item = this.createItemElement({
        id,
        name: base.name,
        icon: base.icon,
        unlocked,
        selected,
        requirement: base.requiresLevel ? `Level ${base.requiresLevel}` : null,
        onClick: () => {
          if (unlocked) {
            this.currentConfig.base = id;
            this.updatePreview();
            this.loadCategory('base');
          }
        },
      });

      grid.appendChild(item);
    });
  }

  loadColors(grid) {
    Object.entries(AVATAR_COLORS).forEach(([id, color]) => {
      const unlocked = this.unlockedItems.colors.includes(id);
      const selected = this.currentConfig.color === id;

      const item = this.createColorElement({
        id,
        name: color.name,
        hex: color.hex,
        unlocked,
        selected,
        special: color.special,
        requirement: color.requiresLevel ? `Level ${color.requiresLevel}` : null,
        onClick: () => {
          if (unlocked) {
            this.currentConfig.color = id;
            this.updatePreview();
            this.loadCategory('color');
          }
        },
      });

      grid.appendChild(item);
    });
  }

  loadEyes(grid) {
    Object.entries(AVATAR_EYES).forEach(([id, eyes]) => {
      const unlocked = this.unlockedItems.eyes.includes(id);
      const selected = this.currentConfig.eyes === id;

      const item = this.createItemElement({
        id,
        name: eyes.name,
        icon: eyes.emoji,
        unlocked,
        selected,
        requirement: this.getRequirementText(eyes),
        onClick: () => {
          if (unlocked) {
            this.currentConfig.eyes = id;
            this.updatePreview();
            this.loadCategory('eyes');
          }
        },
      });

      grid.appendChild(item);
    });
  }

  loadMouths(grid) {
    Object.entries(AVATAR_MOUTHS).forEach(([id, mouth]) => {
      const unlocked = this.unlockedItems.mouths.includes(id);
      const selected = this.currentConfig.mouth === id;

      const item = this.createItemElement({
        id,
        name: mouth.name,
        icon: mouth.emoji,
        unlocked,
        selected,
        requirement: this.getRequirementText(mouth),
        onClick: () => {
          if (unlocked) {
            this.currentConfig.mouth = id;
            this.updatePreview();
            this.loadCategory('mouth');
          }
        },
      });

      grid.appendChild(item);
    });
  }

  loadAccessories(grid) {
    // Add "None" option
    const noneItem = this.createItemElement({
      id: 'none',
      name: 'None',
      icon: '🚫',
      unlocked: true,
      selected: this.currentConfig.accessories.length === 0,
      onClick: () => {
        this.currentConfig.accessories = [];
        this.updatePreview();
        this.loadCategory('accessories');
      },
    });
    grid.appendChild(noneItem);

    Object.entries(AVATAR_ACCESSORIES).forEach(([id, accessory]) => {
      const unlocked = this.unlockedItems.accessories.includes(id);
      const selected = this.currentConfig.accessories.includes(id);

      const item = this.createItemElement({
        id,
        name: accessory.name,
        icon: accessory.icon,
        unlocked,
        selected,
        requirement: this.getRequirementText(accessory),
        isToggle: true,
        onClick: () => {
          if (unlocked) {
            if (selected) {
              // Remove accessory
              this.currentConfig.accessories = this.currentConfig.accessories.filter(a => a !== id);
            } else {
              // Add accessory (check category limits)
              const sameCategory = this.currentConfig.accessories.filter(
                a => AVATAR_ACCESSORIES[a].category === accessory.category
              );

              if (accessory.category === 'head' && sameCategory.length > 0) {
                // Replace head accessory
                this.currentConfig.accessories = this.currentConfig.accessories.filter(
                  a => AVATAR_ACCESSORIES[a].category !== 'head'
                );
              }

              this.currentConfig.accessories.push(id);
            }

            this.updatePreview();
            this.loadCategory('accessories');
          }
        },
      });

      grid.appendChild(item);
    });
  }

  loadBackgrounds(grid) {
    Object.entries(AVATAR_BACKGROUNDS).forEach(([id, bg]) => {
      const unlocked = this.unlockedItems.backgrounds.includes(id);
      const selected = this.currentConfig.background === id;

      const item = this.createItemElement({
        id,
        name: bg.name,
        icon: bg.icon,
        unlocked,
        selected,
        requirement: bg.requiresLevel ? `Level ${bg.requiresLevel}` : null,
        onClick: () => {
          if (unlocked) {
            this.currentConfig.background = id;
            this.updatePreview();
            this.loadCategory('background');
          }
        },
      });

      grid.appendChild(item);
    });
  }

  createItemElement(options) {
    const item = document.createElement('div');
    item.className = `item-card ${options.selected ? 'selected' : ''} ${!options.unlocked ? 'locked' : ''}`;

    item.innerHTML = `
      <div class="item-icon">${options.icon}</div>
      <div class="item-name">${options.name}</div>
      ${!options.unlocked ? '<div class="item-lock">🔒</div>' : ''}
      ${options.requirement && !options.unlocked ? `<div class="item-requirement">${options.requirement}</div>` : ''}
      ${options.selected && options.isToggle ? '<div class="item-checkmark">✓</div>' : ''}
    `;

    if (options.onClick) {
      item.addEventListener('click', options.onClick);
    }

    if (!options.unlocked) {
      item.addEventListener('click', () => {
        this.showLockedItemTooltip(options);
      });
    }

    return item;
  }

  createColorElement(options) {
    const item = document.createElement('div');
    item.className = `color-card ${options.selected ? 'selected' : ''} ${!options.unlocked ? 'locked' : ''}`;

    let colorStyle = '';
    if (options.special && options.hex === 'rainbow') {
      colorStyle =
        'background: linear-gradient(45deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082, #9400D3);';
    } else {
      colorStyle = `background-color: ${options.hex};`;
    }

    item.innerHTML = `
      <div class="color-swatch" style="${colorStyle}"></div>
      <div class="color-name">${options.name}</div>
      ${!options.unlocked ? '<div class="color-lock">🔒</div>' : ''}
      ${options.requirement && !options.unlocked ? `<div class="color-requirement">${options.requirement}</div>` : ''}
    `;

    if (options.onClick) {
      item.addEventListener('click', options.onClick);
    }

    if (!options.unlocked) {
      item.addEventListener('click', () => {
        this.showLockedItemTooltip(options);
      });
    }

    return item;
  }

  getRequirementText(item) {
    if (item.requiresLevel) {
      return `Level ${item.requiresLevel}`;
    }
    if (item.requiresAchievement) {
      return `Achievement: ${item.requiresAchievement}`;
    }
    return null;
  }

  showLockedItemTooltip(options) {
    const tooltip = document.createElement('div');
    tooltip.className = 'locked-tooltip show';
    tooltip.innerHTML = `
      <div class="tooltip-content">
        <div class="tooltip-title">🔒 Locked</div>
        <div class="tooltip-text">${options.requirement || 'Complete requirements to unlock'}</div>
      </div>
    `;

    document.body.appendChild(tooltip);

    // Position near cursor
    const positionTooltip = e => {
      tooltip.style.left = e.pageX + 10 + 'px';
      tooltip.style.top = e.pageY - 30 + 'px';
    };

    document.addEventListener('mousemove', positionTooltip);

    // Remove after delay
    setTimeout(() => {
      tooltip.classList.remove('show');
      document.removeEventListener('mousemove', positionTooltip);
      setTimeout(() => tooltip.remove(), 300);
    }, 2000);
  }

  randomizeAvatar() {
    // Random base
    const bases = this.unlockedItems.bases;
    this.currentConfig.base = bases[Math.floor(Math.random() * bases.length)];

    // Random color
    const colors = this.unlockedItems.colors;
    this.currentConfig.color = colors[Math.floor(Math.random() * colors.length)];

    // Random eyes
    const eyes = this.unlockedItems.eyes;
    this.currentConfig.eyes = eyes[Math.floor(Math.random() * eyes.length)];

    // Random mouth
    const mouths = this.unlockedItems.mouths;
    this.currentConfig.mouth = mouths[Math.floor(Math.random() * mouths.length)];

    // Random background
    const backgrounds = this.unlockedItems.backgrounds;
    this.currentConfig.background = backgrounds[Math.floor(Math.random() * backgrounds.length)];

    // Random accessories (0-2)
    this.currentConfig.accessories = [];
    const accessories = this.unlockedItems.accessories;
    const numAccessories = Math.floor(Math.random() * 3);

    for (let i = 0; i < numAccessories && i < accessories.length; i++) {
      const accessory = accessories[Math.floor(Math.random() * accessories.length)];
      if (!this.currentConfig.accessories.includes(accessory)) {
        this.currentConfig.accessories.push(accessory);
      }
    }

    this.updatePreview();
    this.loadCategory(this.selectedCategory);
  }

  resetAvatar() {
    this.currentConfig = this.profile.avatar
      ? AvatarConfiguration.fromJSON(this.profile.avatar)
      : new AvatarConfiguration();

    this.updatePreview();
    this.loadCategory(this.selectedCategory);
  }

  saveAvatar() {
    if (!this.currentConfig.isValid(this.profile)) {
      Modal.show({
        title: 'Invalid Avatar',
        content:
          '<p>Your avatar configuration contains locked items. Please remove them before saving.</p>',
        buttons: [{ text: 'OK', primary: true }],
      });
      return;
    }

    if (this.onSave) {
      this.onSave(this.currentConfig.toJSON());
    }
  }

  /**
   * Show as modal
   */
  static showModal(profile, onSave) {
    const modal = Modal.create({
      title: '',
      content: '<div id="avatar-builder-modal"></div>',
      className: 'avatar-builder-modal',
      width: '900px',
      buttons: [],
    });

    new AvatarBuilder('avatar-builder-modal', {
      profile,
      onSave: avatarConfig => {
        modal.close();
        if (onSave) onSave(avatarConfig);
      },
      onCancel: () => {
        modal.close();
      },
    });

    return modal;
  }
}

export default AvatarBuilder;
