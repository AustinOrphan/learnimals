/**
 * Template Processor - Handles template variable substitution
 * This utility processes templates with URL parameters or provided data
 */

export default class TemplateProcessor {
  /**
   * Process template variables in HTML content
   * @param {string} templateContent - HTML content with template variables
   * @param {Object} data - Data to substitute
   * @returns {string} Processed HTML content
   */
  static processTemplate(templateContent, data) {
    let processedContent = templateContent;

    // Replace Handlebars-style variables {{variableName}}
    const variableRegex = /\{\{\{?([^}]+)\}?\}\}/g;

    processedContent = processedContent.replace(variableRegex, (match, variableName) => {
      const cleanVariableName = variableName.trim();

      // Handle conditional blocks {{#if condition}}
      if (cleanVariableName.startsWith('#if ')) {
        const condition = cleanVariableName.replace('#if ', '');
        return data[condition] ? '' : '<!-- ' + match + ' -->';
      }

      // Handle closing conditional blocks {{/if}}
      if (cleanVariableName === '/if') {
        return '';
      }

      // Handle triple braces for JSON objects {{{object}}}
      if (match.startsWith('{{{')) {
        const value = data[cleanVariableName];
        return typeof value === 'object' ? JSON.stringify(value) : value || '{}';
      }

      // Regular variable substitution
      return data[cleanVariableName] || '';
    });

    return processedContent;
  }

  /**
   * Get template data from URL parameters
   * @returns {Object} Template data extracted from URL
   */
  static getTemplateDataFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const data = {};

    // Basic template variables
    data.gameId = urlParams.get('gameId') || 'test-game';
    data.gameName = urlParams.get('gameName') || 'Test Game';
    data.gameDescription = urlParams.get('gameDescription') || 'A test game';
    data.characterName = urlParams.get('characterName') || 'Test Character';
    data.characterType = urlParams.get('characterType') || 'Animal';
    data.containerId = urlParams.get('containerId') || 'game-container';
    data.gameScriptPath = urlParams.get('gameScriptPath') || '';
    data.gameStyleSheet = urlParams.get('gameStyleSheet') || '';

    // UI configuration
    data.showControls = urlParams.get('showControls') === 'true';
    data.showStats = urlParams.get('showStats') === 'true';
    data.showProgress = urlParams.get('showProgress') === 'true';
    data.timeLimit = urlParams.get('timeLimit') || '';

    // Feature flags and options
    data.featureFlags = JSON.stringify({
      analytics: true,
      progress: true,
      mobile: true,
      themes: true,
      audio: true,
    });

    data.gameOptions = JSON.stringify({
      timeLimit: parseInt(data.timeLimit) || 60,
      difficulty: urlParams.get('difficulty') || 'medium',
    });

    // Theme class
    data.themeClass = urlParams.get('theme') || 'light-theme';

    // Game content (will be populated by the game script)
    data.gameContent = urlParams.get('gameContent') || '';

    return data;
  }

  /**
   * Process a template file with URL parameters
   * @param {string} templateContent - Raw template content
   * @returns {string} Processed template content
   */
  static processTemplateFromURL(templateContent) {
    const data = this.getTemplateDataFromURL();
    return this.processTemplate(templateContent, data);
  }

  /**
   * Initialize template processing for the current page
   * This should be called when the DOM is loaded
   */
  static initializeTemplatePage() {
    // Get all template variables in the document
    const templateElements = document.querySelectorAll('[data-template]');
    const data = this.getTemplateDataFromURL();

    templateElements.forEach(element => {
      const templateVar = element.getAttribute('data-template');
      if (data[templateVar]) {
        element.textContent = data[templateVar];
      }
    });

    // Process any remaining template variables in text content
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);

    const textNodes = [];
    let node;

    while ((node = walker.nextNode())) {
      if (node.textContent.includes('{{')) {
        textNodes.push(node);
      }
    }

    textNodes.forEach(textNode => {
      textNode.textContent = this.processTemplate(textNode.textContent, data);
    });
  }

  /**
   * Create a game link with proper template parameters
   * @param {string} templatePath - Path to the template
   * @param {Object} gameConfig - Game configuration
   * @returns {string} Complete URL with parameters
   */
  static createGameLink(templatePath, gameConfig) {
    const params = new URLSearchParams();

    // Add all game configuration as URL parameters
    Object.keys(gameConfig).forEach(key => {
      const value = gameConfig[key];
      if (value !== null && value !== undefined) {
        if (typeof value === 'object') {
          params.append(key, JSON.stringify(value));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    return `${templatePath}?${params.toString()}`;
  }
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  window.TemplateProcessor = TemplateProcessor;
}
