/**
 * Customization Exporter
 * Export and import functionality for character customizations
 *
 * Part of Phase G: Character Customization Studio
 */

import { CharacterUtils, characterEvents } from '../index.js';

export default class CustomizationExporter {
  constructor(options = {}) {
    this.version = '1.0';
    this.supportedFormats = ['json', 'learnimals'];

    // Export settings
    this.settings = {
      includeCharacterData: options.includeCharacterData !== false,
      includePresets: options.includePresets !== false,
      includeMetadata: options.includeMetadata !== false,
      compressData: options.compressData || false,
      validateOnImport: options.validateOnImport !== false,
    };
  }

  /**
   * Export single customization
   */
  exportCustomization(customization, character = null, metadata = {}) {
    const exportData = {
      version: this.version,
      type: 'customization',
      exported: new Date().toISOString(),
      customization: this.sanitizeCustomization(customization),
      character: this.settings.includeCharacterData ? this.sanitizeCharacter(character) : null,
      metadata: {
        name: metadata.name || 'Exported Customization',
        description: metadata.description || 'Customization exported from Learnimals',
        tags: metadata.tags || [],
        author: metadata.author || 'Anonymous',
        ...metadata,
      },
    };

    return this.settings.compressData ? this.compressData(exportData) : exportData;
  }

  /**
   * Export multiple customizations
   */
  exportCustomizations(customizations, metadata = {}) {
    const exportData = {
      version: this.version,
      type: 'customization_collection',
      exported: new Date().toISOString(),
      customizations: customizations.map(item => ({
        id: item.id || CharacterUtils.generateId(),
        customization: this.sanitizeCustomization(item.customization),
        character: this.settings.includeCharacterData
          ? this.sanitizeCharacter(item.character)
          : null,
        metadata: item.metadata || {},
      })),
      metadata: {
        name: metadata.name || 'Customization Collection',
        description:
          metadata.description || 'Collection of customizations exported from Learnimals',
        count: customizations.length,
        tags: metadata.tags || [],
        author: metadata.author || 'Anonymous',
        ...metadata,
      },
    };

    return this.settings.compressData ? this.compressData(exportData) : exportData;
  }

  /**
   * Export preset collection
   */
  exportPresets(presets, metadata = {}) {
    const exportData = {
      version: this.version,
      type: 'preset_collection',
      exported: new Date().toISOString(),
      presets: Object.fromEntries(
        Array.from(presets.entries()).map(([id, preset]) => [
          id,
          {
            ...preset,
            customization: this.sanitizeCustomization(preset.customization),
          },
        ])
      ),
      metadata: {
        name: metadata.name || 'Preset Collection',
        description: metadata.description || 'Presets exported from Learnimals',
        count: presets.size,
        tags: metadata.tags || [],
        author: metadata.author || 'Anonymous',
        ...metadata,
      },
    };

    return this.settings.compressData ? this.compressData(exportData) : exportData;
  }

  /**
   * Export complete studio session
   */
  exportStudioSession(sessionData, metadata = {}) {
    const exportData = {
      version: this.version,
      type: 'studio_session',
      exported: new Date().toISOString(),
      session: {
        characters: sessionData.characters
          ? sessionData.characters.map(char => this.sanitizeCharacter(char))
          : [],
        customizations: sessionData.customizations
          ? Object.fromEntries(
              Array.from(sessionData.customizations.entries()).map(([id, customization]) => [
                id,
                this.sanitizeCustomization(customization),
              ])
            )
          : {},
        presets: sessionData.presets ? Object.fromEntries(sessionData.presets) : {},
        settings: sessionData.settings || {},
        history: sessionData.history || [],
      },
      metadata: {
        name: metadata.name || 'Studio Session',
        description: metadata.description || 'Complete studio session exported from Learnimals',
        sessionDate: metadata.sessionDate || new Date().toISOString(),
        duration: metadata.duration || null,
        tags: metadata.tags || [],
        author: metadata.author || 'Anonymous',
        ...metadata,
      },
    };

    return this.settings.compressData ? this.compressData(exportData) : exportData;
  }

  /**
   * Import customization data
   */
  async importCustomization(data, options = {}) {
    try {
      // Decompress if needed
      const importData = typeof data === 'string' ? this.decompressData(data) : data;

      // Validate import data
      if (this.settings.validateOnImport) {
        const validation = this.validateImportData(importData);
        if (!validation.valid) {
          throw new Error(`Invalid import data: ${validation.errors.join(', ')}`);
        }
      }

      const results = {
        success: true,
        imported: [],
        errors: [],
        warnings: [],
      };

      switch (importData.type) {
        case 'customization':
          results.imported.push(await this.importSingleCustomization(importData, options));
          break;

        case 'customization_collection':
          for (const item of importData.customizations) {
            try {
              results.imported.push(await this.importSingleCustomization(item, options));
            } catch (error) {
              results.errors.push(`Failed to import customization: ${error.message}`);
            }
          }
          break;

        case 'preset_collection':
          results.imported.push(await this.importPresetCollection(importData, options));
          break;

        case 'studio_session':
          results.imported.push(await this.importStudioSession(importData, options));
          break;

        default:
          throw new Error(`Unsupported import type: ${importData.type}`);
      }

      // Emit import event
      characterEvents.emit('customizationImported', {
        type: importData.type,
        results,
        metadata: importData.metadata,
      });

      return results;
    } catch (error) {
      console.error('Import failed:', error);
      return {
        success: false,
        error: error.message,
        imported: [],
        errors: [error.message],
        warnings: [],
      };
    }
  }

  /**
   * Import single customization
   */
  async importSingleCustomization(data, options = {}) {
    const customization = this.deserializeCustomization(data.customization);
    const character = data.character ? this.deserializeCharacter(data.character) : null;

    const importId = options.generateNewId
      ? CharacterUtils.generateId()
      : data.id || CharacterUtils.generateId();

    const result = {
      id: importId,
      customization,
      character,
      metadata: {
        ...data.metadata,
        imported: new Date().toISOString(),
        originalId: data.id,
      },
    };

    // Store if requested
    if (options.saveToStorage) {
      await this.saveImportedCustomization(result);
    }

    return result;
  }

  /**
   * Import preset collection
   */
  async importPresetCollection(data, options = {}) {
    const presets = new Map();

    for (const [id, preset] of Object.entries(data.presets)) {
      const importId = options.generateNewId ? CharacterUtils.generateId() : id;
      const deserializedPreset = {
        ...preset,
        id: importId,
        customization: this.deserializeCustomization(preset.customization),
        imported: new Date().toISOString(),
        originalId: id,
      };

      presets.set(importId, deserializedPreset);
    }

    const result = {
      type: 'preset_collection',
      presets,
      metadata: {
        ...data.metadata,
        imported: new Date().toISOString(),
      },
    };

    // Store if requested
    if (options.saveToStorage) {
      await this.saveImportedPresets(presets);
    }

    return result;
  }

  /**
   * Import studio session
   */
  async importStudioSession(data, options = {}) {
    const session = {
      characters: data.session.characters
        ? data.session.characters.map(char => this.deserializeCharacter(char))
        : [],
      customizations: new Map(),
      presets: new Map(),
      settings: data.session.settings || {},
      history: data.session.history || [],
    };

    // Import customizations
    if (data.session.customizations) {
      for (const [id, customization] of Object.entries(data.session.customizations)) {
        const importId = options.generateNewId ? CharacterUtils.generateId() : id;
        session.customizations.set(importId, this.deserializeCustomization(customization));
      }
    }

    // Import presets
    if (data.session.presets) {
      for (const [id, preset] of Object.entries(data.session.presets)) {
        const importId = options.generateNewId ? CharacterUtils.generateId() : id;
        session.presets.set(importId, {
          ...preset,
          customization: this.deserializeCustomization(preset.customization),
        });
      }
    }

    const result = {
      type: 'studio_session',
      session,
      metadata: {
        ...data.metadata,
        imported: new Date().toISOString(),
      },
    };

    // Store if requested
    if (options.saveToStorage) {
      await this.saveImportedSession(result);
    }

    return result;
  }

  /**
   * Sanitize customization for export
   */
  sanitizeCustomization(customization) {
    if (!customization) return null;

    return {
      theme: customization.theme || 'educational',
      colorScheme: customization.colorScheme || 'primary',
      effects: this.sanitizeEffects(customization.effects),
      animations: this.sanitizeAnimations(customization.animations),
      accessories: customization.accessories || [],
      background: customization.background || null,
    };
  }

  /**
   * Sanitize character for export
   */
  sanitizeCharacter(character) {
    if (!character) return null;

    return {
      id: character.id,
      name: character.name,
      subject: character.subject,
      appearance: character.appearance,
      personality: character.personality,
      animations: character.animations,
      metadata: {
        created: character.metadata?.created,
        version: character.metadata?.version,
        tags: character.metadata?.tags || [],
      },
    };
  }

  /**
   * Sanitize effects
   */
  sanitizeEffects(effects) {
    if (!effects) return {};

    const sanitized = {};
    for (const [effectName, effect] of Object.entries(effects)) {
      if (typeof effect === 'object' && effect !== null) {
        sanitized[effectName] = {
          enabled: effect.enabled || false,
          intensity: effect.intensity || 0.5,
          ...effect,
        };
      }
    }
    return sanitized;
  }

  /**
   * Sanitize animations
   */
  sanitizeAnimations(animations) {
    if (!animations) return {};

    return {
      idle: animations.idle || 'none',
      hover: animations.hover || 'none',
      click: animations.click || 'none',
      speed: animations.speed || 1.0,
    };
  }

  /**
   * Deserialize customization from import
   */
  deserializeCustomization(data) {
    if (!data) return null;

    return {
      theme: data.theme || 'educational',
      colorScheme: data.colorScheme || 'primary',
      effects: data.effects || {},
      animations: data.animations || {},
      accessories: data.accessories || [],
      background: data.background || null,
    };
  }

  /**
   * Deserialize character from import
   */
  deserializeCharacter(data) {
    if (!data) return null;

    return {
      id: data.id || CharacterUtils.generateId(),
      name: data.name || 'Imported Character',
      subject: data.subject || 'general',
      appearance: data.appearance || {},
      personality: data.personality || {},
      animations: data.animations || {},
      metadata: {
        created: data.metadata?.created || new Date().toISOString(),
        version: data.metadata?.version || 1,
        tags: data.metadata?.tags || ['imported'],
      },
    };
  }

  /**
   * Validate import data
   */
  validateImportData(data) {
    const errors = [];

    if (!data || typeof data !== 'object') {
      errors.push('Data must be a valid object');
      return { valid: false, errors };
    }

    if (!data.version) {
      errors.push('Missing version information');
    }

    if (!data.type) {
      errors.push('Missing data type');
    } else if (
      ![
        'customization',
        'customization_collection',
        'preset_collection',
        'studio_session',
      ].includes(data.type)
    ) {
      errors.push(`Unsupported data type: ${data.type}`);
    }

    // Type-specific validation
    switch (data.type) {
      case 'customization':
        if (!data.customization) {
          errors.push('Missing customization data');
        }
        break;

      case 'customization_collection':
        if (!Array.isArray(data.customizations)) {
          errors.push('Customizations must be an array');
        }
        break;

      case 'preset_collection':
        if (!data.presets || typeof data.presets !== 'object') {
          errors.push('Presets must be an object');
        }
        break;

      case 'studio_session':
        if (!data.session || typeof data.session !== 'object') {
          errors.push('Session data must be an object');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Compress data for export
   */
  compressData(data) {
    // Simple compression - in a real implementation, you might use LZString or similar
    try {
      const json = JSON.stringify(data);
      return btoa(unescape(encodeURIComponent(json)));
    } catch (error) {
      console.warn('Compression failed, returning uncompressed data');
      return data;
    }
  }

  /**
   * Decompress data for import
   */
  decompressData(data) {
    // Simple decompression
    try {
      const json = decodeURIComponent(escape(atob(data)));
      return JSON.parse(json);
    } catch (error) {
      // If decompression fails, assume it's already decompressed JSON
      return typeof data === 'string' ? JSON.parse(data) : data;
    }
  }

  /**
   * Download export data as file
   */
  downloadExport(data, filename, format = 'json') {
    let content, mimeType;

    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        break;
      case 'learnimals':
        content = this.settings.compressData ? this.compressData(data) : JSON.stringify(data);
        mimeType = 'application/octet-stream';
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Read import file
   */
  readImportFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = e => {
        try {
          const content = e.target.result;
          let data;

          if (file.name.endsWith('.json')) {
            data = JSON.parse(content);
          } else if (file.name.endsWith('.learnimals')) {
            data = this.decompressData(content);
          } else {
            // Try to parse as JSON first
            try {
              data = JSON.parse(content);
            } catch {
              data = this.decompressData(content);
            }
          }

          resolve(data);
        } catch (error) {
          reject(new Error(`Failed to read file: ${error.message}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Save imported customization to storage
   */
  async saveImportedCustomization(customization) {
    try {
      const existing = localStorage.getItem('learnimals_imported_customizations');
      const imported = existing ? JSON.parse(existing) : {};

      imported[customization.id] = customization;

      localStorage.setItem('learnimals_imported_customizations', JSON.stringify(imported));
    } catch (error) {
      console.error('Failed to save imported customization:', error);
    }
  }

  /**
   * Save imported presets to storage
   */
  async saveImportedPresets(presets) {
    try {
      const existing = localStorage.getItem('learnimals_customization_presets');
      const stored = existing ? JSON.parse(existing) : {};

      for (const [id, preset] of presets) {
        stored[id] = preset;
      }

      localStorage.setItem('learnimals_customization_presets', JSON.stringify(stored));
    } catch (error) {
      console.error('Failed to save imported presets:', error);
    }
  }

  /**
   * Save imported session to storage
   */
  async saveImportedSession(session) {
    try {
      const sessionData = {
        ...session,
        id: CharacterUtils.generateId(),
        saved: new Date().toISOString(),
      };

      const existing = localStorage.getItem('learnimals_imported_sessions');
      const sessions = existing ? JSON.parse(existing) : {};

      sessions[sessionData.id] = sessionData;

      localStorage.setItem('learnimals_imported_sessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save imported session:', error);
    }
  }

  /**
   * Get export statistics
   */
  getExportStats() {
    return {
      version: this.version,
      supportedFormats: this.supportedFormats,
      settings: { ...this.settings },
    };
  }

  /**
   * Create export filename
   */
  createExportFilename(type, metadata = {}) {
    const timestamp = new Date().toISOString().split('T')[0];
    const name = metadata.name ? metadata.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : type;
    return `learnimals-${name}-${timestamp}`;
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.CustomizationExporter = CustomizationExporter;
}
