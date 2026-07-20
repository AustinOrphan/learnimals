/**
 * Export Import Dialog
 * User interface for exporting and importing customizations
 *
 * Part of Phase G: Character Customization Studio
 */

// Use global BaseComponent (loaded via script tag in demo page)
const BaseComponent = window.BaseComponent;
import { characterEvents } from '../index.js';
import CustomizationExporter from '../utils/CustomizationExporter.js';

export default class ExportImportDialog extends BaseComponent {
  constructor(options = {}) {
    super({
      tagName: 'div',
      className: 'export-import-dialog',
      attributes: {
        role: 'dialog',
        'aria-label': 'Export Import Dialog',
      },
      ...options,
    });

    // Dialog state
    this.isVisible = false;
    this.currentTab = 'export';
    this.exporter = new CustomizationExporter();

    // Data to export/import
    this.customizations = options.customizations || new Map();
    this.presets = options.presets || new Map();
    this.characters = options.characters || [];
    this.sessionData = options.sessionData || null;

    // Export settings
    this.exportSettings = {
      format: 'json',
      includeCharacterData: true,
      includePresets: true,
      includeMetadata: true,
      compressData: false,
    };

    // Import settings
    this.importSettings = {
      validateOnImport: true,
      saveToStorage: true,
      generateNewIds: false,
      overwriteExisting: false,
    };

    // Callbacks
    this.onExport = options.onExport || (() => {});
    this.onImport = options.onImport || (() => {});
    this.onClose = options.onClose || (() => {});

    this.init();
  }

  /**
   * Initialize dialog
   */
  init() {
    this.setupEventListeners();
  }

  /**
   * Generate dialog HTML
   */
  generateHTML() {
    return `
      <div id="${this.options.id}" class="export-import-dialog ${this.isVisible ? 'visible' : ''}" data-component="export-import-dialog">
        <div class="dialog-backdrop" id="dialog-backdrop"></div>
        
        <div class="dialog-content">
          <div class="dialog-header">
            <h2>Export & Import Customizations</h2>
            <button class="close-button" id="close-dialog">
              <span>✕</span>
            </button>
          </div>

          <div class="dialog-tabs">
            <button class="tab-button ${this.currentTab === 'export' ? 'active' : ''}" 
                    data-tab="export">
              <span>📤</span>
              Export
            </button>
            <button class="tab-button ${this.currentTab === 'import' ? 'active' : ''}" 
                    data-tab="import">
              <span>📥</span>
              Import
            </button>
          </div>

          <div class="dialog-body">
            ${this.renderExportTab()}
            ${this.renderImportTab()}
          </div>

          <div class="dialog-footer">
            <div class="footer-info">
              <span class="version-info">Export Format v${this.exporter.version}</span>
            </div>
            <div class="footer-actions">
              <button class="btn-secondary" id="cancel-dialog">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render export tab
   */
  renderExportTab() {
    return `
      <div class="tab-content export-tab ${this.currentTab === 'export' ? 'active' : ''}" id="export-tab">
        <div class="export-options">
          <div class="option-section">
            <h3>What to Export</h3>
            <div class="export-types">
              <label class="export-type-option">
                <input type="radio" name="export-type" value="customization" id="export-customization">
                <div class="option-content">
                  <h4>Current Customization</h4>
                  <p>Export the current character customization only</p>
                </div>
              </label>
              
              <label class="export-type-option">
                <input type="radio" name="export-type" value="collection" id="export-collection" checked>
                <div class="option-content">
                  <h4>Customization Collection</h4>
                  <p>Export multiple customizations as a collection</p>
                </div>
              </label>
              
              <label class="export-type-option">
                <input type="radio" name="export-type" value="presets" id="export-presets">
                <div class="option-content">
                  <h4>Preset Library</h4>
                  <p>Export your saved presets for sharing</p>
                </div>
              </label>
              
              <label class="export-type-option">
                <input type="radio" name="export-type" value="session" id="export-session">
                <div class="option-content">
                  <h4>Complete Studio Session</h4>
                  <p>Export everything from your current session</p>
                </div>
              </label>
            </div>
          </div>

          <div class="option-section">
            <h3>Export Settings</h3>
            <div class="export-settings">
              <div class="setting-group">
                <label for="export-format">Format:</label>
                <select id="export-format" class="setting-select">
                  <option value="json">JSON (Human-readable)</option>
                  <option value="learnimals">Learnimals (Compressed)</option>
                </select>
              </div>
              
              <div class="setting-toggles">
                <label class="toggle-setting">
                  <input type="checkbox" id="include-character-data" checked>
                  <span>Include Character Data</span>
                </label>
                <label class="toggle-setting">
                  <input type="checkbox" id="include-presets" checked>
                  <span>Include Presets</span>
                </label>
                <label class="toggle-setting">
                  <input type="checkbox" id="include-metadata" checked>
                  <span>Include Metadata</span>
                </label>
                <label class="toggle-setting">
                  <input type="checkbox" id="compress-data">
                  <span>Compress Data</span>
                </label>
              </div>
            </div>
          </div>

          <div class="option-section">
            <h3>Export Details</h3>
            <div class="export-metadata">
              <div class="metadata-input">
                <label for="export-name">Export Name:</label>
                <input type="text" id="export-name" placeholder="My Customizations" class="text-input">
              </div>
              <div class="metadata-input">
                <label for="export-description">Description:</label>
                <textarea id="export-description" placeholder="Describe your customizations..." class="text-area"></textarea>
              </div>
              <div class="metadata-input">
                <label for="export-tags">Tags (comma-separated):</label>
                <input type="text" id="export-tags" placeholder="educational, playful, colorful" class="text-input">
              </div>
              <div class="metadata-input">
                <label for="export-author">Author:</label>
                <input type="text" id="export-author" placeholder="Your name" class="text-input">
              </div>
            </div>
          </div>
        </div>

        <div class="export-actions">
          <button class="btn-primary" id="perform-export">
            <span>📤</span>
            Export
          </button>
          <button class="btn-secondary" id="preview-export">
            <span>👁️</span>
            Preview
          </button>
        </div>

        <div class="export-preview" id="export-preview" style="display: none;">
          <h4>Export Preview</h4>
          <pre class="preview-content" id="preview-content"></pre>
        </div>
      </div>
    `;
  }

  /**
   * Render import tab
   */
  renderImportTab() {
    return `
      <div class="tab-content import-tab ${this.currentTab === 'import' ? 'active' : ''}" id="import-tab">
        <div class="import-options">
          <div class="option-section">
            <h3>Import Source</h3>
            <div class="import-methods">
              <div class="import-method">
                <h4>Upload File</h4>
                <div class="file-upload">
                  <input type="file" id="import-file" accept=".json,.learnimals" class="file-input">
                  <label for="import-file" class="file-upload-label">
                    <span class="upload-icon">📁</span>
                    <span class="upload-text">Choose file to import</span>
                  </label>
                </div>
                <p class="help-text">Supported formats: .json, .learnimals</p>
              </div>
              
              <div class="import-method">
                <h4>Paste Data</h4>
                <textarea id="import-data" class="import-textarea" 
                         placeholder="Paste exported JSON or Learnimals data here..."></textarea>
              </div>
            </div>
          </div>

          <div class="option-section">
            <h3>Import Settings</h3>
            <div class="import-settings">
              <div class="setting-toggles">
                <label class="toggle-setting">
                  <input type="checkbox" id="validate-import" checked>
                  <span>Validate Data</span>
                </label>
                <label class="toggle-setting">
                  <input type="checkbox" id="save-to-storage" checked>
                  <span>Save to Storage</span>
                </label>
                <label class="toggle-setting">
                  <input type="checkbox" id="generate-new-ids">
                  <span>Generate New IDs</span>
                </label>
                <label class="toggle-setting">
                  <input type="checkbox" id="overwrite-existing">
                  <span>Overwrite Existing</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="import-actions">
          <button class="btn-primary" id="perform-import" disabled>
            <span>📥</span>
            Import
          </button>
          <button class="btn-secondary" id="validate-import-data" disabled>
            <span>✓</span>
            Validate
          </button>
        </div>

        <div class="import-results" id="import-results" style="display: none;">
          <h4>Import Results</h4>
          <div class="results-content" id="results-content"></div>
        </div>
      </div>
    `;
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    this.element.addEventListener('click', this.handleClick.bind(this));
    this.element.addEventListener('change', this.handleChange.bind(this));
    this.element.addEventListener('input', this.handleInput.bind(this));
  }

  /**
   * Handle click events
   */
  handleClick(event) {
    const target = event.target.closest('[id], [data-tab]');
    if (!target) return;

    const id = target.id;
    const tab = target.dataset.tab;

    if (tab) {
      this.switchTab(tab);
    } else {
      switch (id) {
        case 'close-dialog':
        case 'cancel-dialog':
        case 'dialog-backdrop':
          this.close();
          break;
        case 'perform-export':
          this.performExport();
          break;
        case 'preview-export':
          this.previewExport();
          break;
        case 'perform-import':
          this.performImport();
          break;
        case 'validate-import-data':
          this.validateImportData();
          break;
      }
    }
  }

  /**
   * Handle change events
   */
  handleChange(event) {
    const target = event.target;

    if (target.type === 'file' && target.id === 'import-file') {
      this.handleFileSelect(target.files[0]);
    } else if (
      target.type === 'checkbox' ||
      target.type === 'radio' ||
      target.tagName === 'SELECT'
    ) {
      this.updateSettings();
    }
  }

  /**
   * Handle input events
   */
  handleInput(event) {
    const target = event.target;

    if (target.id === 'import-data') {
      this.updateImportButtons();
    }
  }

  /**
   * Switch dialog tab
   */
  switchTab(tab) {
    this.currentTab = tab;

    // Update tab buttons
    this.element.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Update tab content
    this.element.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tab}-tab`);
    });
  }

  /**
   * Update export/import settings from form
   */
  updateSettings() {
    // Export settings
    this.exportSettings.format = this.element.querySelector('#export-format')?.value || 'json';
    this.exportSettings.includeCharacterData =
      this.element.querySelector('#include-character-data')?.checked || false;
    this.exportSettings.includePresets =
      this.element.querySelector('#include-presets')?.checked || false;
    this.exportSettings.includeMetadata =
      this.element.querySelector('#include-metadata')?.checked || false;
    this.exportSettings.compressData =
      this.element.querySelector('#compress-data')?.checked || false;

    // Import settings
    this.importSettings.validateOnImport =
      this.element.querySelector('#validate-import')?.checked || false;
    this.importSettings.saveToStorage =
      this.element.querySelector('#save-to-storage')?.checked || false;
    this.importSettings.generateNewIds =
      this.element.querySelector('#generate-new-ids')?.checked || false;
    this.importSettings.overwriteExisting =
      this.element.querySelector('#overwrite-existing')?.checked || false;

    // Update exporter settings
    this.exporter.settings = {
      ...this.exporter.settings,
      ...this.exportSettings,
    };
  }

  /**
   * Handle file selection
   */
  async handleFileSelect(file) {
    if (!file) return;

    try {
      const data = await this.exporter.readImportFile(file);

      // Display in textarea
      const textarea = this.element.querySelector('#import-data');
      if (textarea) {
        textarea.value = JSON.stringify(data, null, 2);
      }

      this.updateImportButtons();
    } catch (error) {
      this.showImportError(`Failed to read file: ${error.message}`);
    }
  }

  /**
   * Update import button states
   */
  updateImportButtons() {
    const importData = this.element.querySelector('#import-data')?.value;
    const hasData = importData && importData.trim().length > 0;

    const importButton = this.element.querySelector('#perform-import');
    const validateButton = this.element.querySelector('#validate-import-data');

    if (importButton) importButton.disabled = !hasData;
    if (validateButton) validateButton.disabled = !hasData;
  }

  /**
   * Perform export
   */
  async performExport() {
    try {
      const exportType = this.element.querySelector('input[name="export-type"]:checked')?.value;
      if (!exportType) {
        throw new Error('Please select an export type');
      }

      this.updateSettings();

      // Collect metadata
      const metadata = {
        name: this.element.querySelector('#export-name')?.value || 'Export',
        description: this.element.querySelector('#export-description')?.value || '',
        tags: this.element
          .querySelector('#export-tags')
          ?.value.split(',')
          .map(t => t.trim())
          .filter(t => t),
        author: this.element.querySelector('#export-author')?.value || 'Anonymous',
      };

      let exportData;
      let filename;

      switch (exportType) {
        case 'customization':
          // Export current customization
          exportData = this.exporter.exportCustomization(
            this.getCurrentCustomization(),
            this.getCurrentCharacter(),
            metadata
          );
          filename = this.exporter.createExportFilename('customization', metadata);
          break;

        case 'collection': {
          // Export customization collection
          const customizations = Array.from(this.customizations.entries()).map(
            ([id, customization]) => ({
              id,
              customization,
              character: this.getCharacterForCustomization(id),
              metadata: {},
            })
          );
          exportData = this.exporter.exportCustomizations(customizations, metadata);
          filename = this.exporter.createExportFilename('collection', metadata);
          break;
        }

        case 'presets':
          // Export presets
          exportData = this.exporter.exportPresets(this.presets, metadata);
          filename = this.exporter.createExportFilename('presets', metadata);
          break;

        case 'session':
          // Export session
          exportData = this.exporter.exportStudioSession(
            {
              characters: this.characters,
              customizations: this.customizations,
              presets: this.presets,
              settings: this.getSessionSettings(),
              history: this.getSessionHistory(),
            },
            metadata
          );
          filename = this.exporter.createExportFilename('session', metadata);
          break;

        default:
          throw new Error(`Unknown export type: ${exportType}`);
      }

      // Download the file
      this.exporter.downloadExport(exportData, filename, this.exportSettings.format);

      // Emit event
      characterEvents.emit('dataExported', {
        type: exportType,
        format: this.exportSettings.format,
        filename: `${filename}.${this.exportSettings.format}`,
        metadata,
      });

      // Call callback
      this.onExport({
        type: exportType,
        data: exportData,
        filename,
        metadata,
      });

      // Show success message
      this.showExportSuccess(`Successfully exported ${exportType}`);
    } catch (error) {
      console.error('Export failed:', error);
      this.showExportError(error.message);
    }
  }

  /**
   * Preview export data
   */
  previewExport() {
    try {
      const exportType = this.element.querySelector('input[name="export-type"]:checked')?.value;
      if (!exportType) {
        throw new Error('Please select an export type');
      }

      this.updateSettings();

      // Generate preview data (limited)
      let previewData = {};

      switch (exportType) {
        case 'customization':
          previewData = {
            type: 'customization',
            customization: this.getCurrentCustomization(),
            metadata: { preview: true },
          };
          break;
        case 'collection':
          previewData = {
            type: 'customization_collection',
            count: this.customizations.size,
            metadata: { preview: true },
          };
          break;
        case 'presets':
          previewData = {
            type: 'preset_collection',
            count: this.presets.size,
            metadata: { preview: true },
          };
          break;
        case 'session':
          previewData = {
            type: 'studio_session',
            summary: {
              characters: this.characters.length,
              customizations: this.customizations.size,
              presets: this.presets.size,
            },
            metadata: { preview: true },
          };
          break;
      }

      // Show preview
      const previewContainer = this.element.querySelector('#export-preview');
      const previewContent = this.element.querySelector('#preview-content');

      if (previewContainer && previewContent) {
        previewContent.textContent = JSON.stringify(previewData, null, 2);
        previewContainer.style.display = 'block';
      }
    } catch (error) {
      this.showExportError(`Preview failed: ${error.message}`);
    }
  }

  /**
   * Perform import
   */
  async performImport() {
    try {
      const importData = this.element.querySelector('#import-data')?.value;
      if (!importData || !importData.trim()) {
        throw new Error('No import data provided');
      }

      this.updateSettings();

      // Parse data
      let data;
      try {
        data = JSON.parse(importData);
      } catch {
        // Try decompressing
        data = this.exporter.decompressData(importData);
      }

      // Perform import
      const results = await this.exporter.importCustomization(data, this.importSettings);

      // Show results
      this.showImportResults(results);

      // Emit event
      characterEvents.emit('dataImported', {
        type: data.type,
        results,
        metadata: data.metadata,
      });

      // Call callback
      this.onImport({
        type: data.type,
        data,
        results,
      });
    } catch (error) {
      console.error('Import failed:', error);
      this.showImportError(error.message);
    }
  }

  /**
   * Validate import data
   */
  validateImportData() {
    try {
      const importData = this.element.querySelector('#import-data')?.value;
      if (!importData || !importData.trim()) {
        throw new Error('No data to validate');
      }

      // Parse data
      let data;
      try {
        data = JSON.parse(importData);
      } catch {
        data = this.exporter.decompressData(importData);
      }

      // Validate
      const validation = this.exporter.validateImportData(data);

      if (validation.valid) {
        this.showImportSuccess('Data is valid and ready to import');
      } else {
        this.showImportError(`Validation failed:\n${validation.errors.join('\n')}`);
      }
    } catch (error) {
      this.showImportError(`Validation failed: ${error.message}`);
    }
  }

  /**
   * Show export success message
   */
  showExportSuccess(message) {
    // Create temporary success indicator
    const indicator = document.createElement('div');
    indicator.className = 'success-message';
    indicator.textContent = message;

    const actionsContainer = this.element.querySelector('.export-actions');
    if (actionsContainer) {
      actionsContainer.appendChild(indicator);
      setTimeout(() => indicator.remove(), 3000);
    }
  }

  /**
   * Show export error
   */
  showExportError(message) {
    const indicator = document.createElement('div');
    indicator.className = 'error-message';
    indicator.textContent = message;

    const actionsContainer = this.element.querySelector('.export-actions');
    if (actionsContainer) {
      actionsContainer.appendChild(indicator);
      setTimeout(() => indicator.remove(), 5000);
    }
  }

  /**
   * Show import success message
   */
  showImportSuccess(message) {
    const indicator = document.createElement('div');
    indicator.className = 'success-message';
    indicator.textContent = message;

    const actionsContainer = this.element.querySelector('.import-actions');
    if (actionsContainer) {
      actionsContainer.appendChild(indicator);
      setTimeout(() => indicator.remove(), 3000);
    }
  }

  /**
   * Show import error
   */
  showImportError(message) {
    const indicator = document.createElement('div');
    indicator.className = 'error-message';
    indicator.textContent = message;

    const actionsContainer = this.element.querySelector('.import-actions');
    if (actionsContainer) {
      actionsContainer.appendChild(indicator);
      setTimeout(() => indicator.remove(), 5000);
    }
  }

  /**
   * Show import results
   */
  showImportResults(results) {
    const resultsContainer = this.element.querySelector('#import-results');
    const resultsContent = this.element.querySelector('#results-content');

    if (!resultsContainer || !resultsContent) return;

    let html = '';

    if (results.success) {
      html += '<div class="result-success">✅ Import successful!</div>';
      html += `<div class="result-summary">Imported ${results.imported.length} items</div>`;

      if (results.warnings.length > 0) {
        html += `<div class="result-warnings">⚠️ Warnings: ${results.warnings.join(', ')}</div>`;
      }
    } else {
      html += `<div class="result-error">❌ Import failed: ${results.error}</div>`;

      if (results.errors.length > 0) {
        html += `<div class="result-errors">Errors: ${results.errors.join(', ')}</div>`;
      }
    }

    resultsContent.innerHTML = html;
    resultsContainer.style.display = 'block';
  }

  /**
   * Get current customization
   */
  getCurrentCustomization() {
    // This would be provided by the parent component
    return this.options.currentCustomization || {};
  }

  /**
   * Get current character
   */
  getCurrentCharacter() {
    // This would be provided by the parent component
    return this.options.currentCharacter || null;
  }

  /**
   * Get character for customization
   */
  getCharacterForCustomization(customizationId) {
    // Find character associated with customization
    return this.characters.find(char => char.customizationId === customizationId) || null;
  }

  /**
   * Get session settings
   */
  getSessionSettings() {
    return this.options.sessionSettings || {};
  }

  /**
   * Get session history
   */
  getSessionHistory() {
    return this.options.sessionHistory || [];
  }

  /**
   * Show dialog
   */
  show() {
    this.isVisible = true;
    this.element.classList.add('visible');
    document.body.style.overflow = 'hidden';

    // Focus first interactive element
    const firstInput = this.element.querySelector('input, button, select, textarea');
    if (firstInput) {
      firstInput.focus();
    }
  }

  /**
   * Hide dialog
   */
  hide() {
    this.isVisible = false;
    this.element.classList.remove('visible');
    document.body.style.overflow = '';
  }

  /**
   * Close dialog
   */
  close() {
    this.hide();
    this.onClose();
  }

  /**
   * Update data for export
   */
  updateData(data) {
    if (data.customizations) this.customizations = data.customizations;
    if (data.presets) this.presets = data.presets;
    if (data.characters) this.characters = data.characters;
    if (data.sessionData) this.sessionData = data.sessionData;
  }

  /**
   * Clean up when destroyed
   */
  destroy() {
    if (this.isVisible) {
      document.body.style.overflow = '';
    }
    super.destroy();
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.ExportImportDialog = ExportImportDialog;
}
