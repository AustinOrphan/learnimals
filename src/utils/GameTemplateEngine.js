/**
 * GameTemplateEngine - Template rendering system for games
 * Provides standardized game page generation with dynamic content injection
 */
import logger from './logger.js';

export class GameTemplateEngine {
  constructor() {
    this.templates = new Map();
    this.templateCache = new Map();
    this.defaultTemplate = 'game';
    
    // Initialize with built-in templates
    this.initializeBuiltInTemplates();
  }

  /**
   * Initialize built-in template definitions
   */
  initializeBuiltInTemplates() {
    // Default game template
    this.templates.set('game', {
      path: '/src/templates/game.html',
      type: 'file',
      cached: false
    });

    // Minimal template for simple games
    this.templates.set('minimal', {
      content: this.getMinimalTemplate(),
      type: 'inline',
      cached: true
    });

    // Full-screen template for immersive games
    this.templates.set('fullscreen', {
      content: this.getFullscreenTemplate(),
      type: 'inline',
      cached: true
    });
  }

  /**
   * Register a custom template
   * @param {string} name - Template name
   * @param {Object} templateDef - Template definition
   */
  registerTemplate(name, templateDef) {
    if (!name || typeof name !== 'string') {
      throw new Error('Template name must be a non-empty string');
    }

    if (!templateDef || (!templateDef.path && !templateDef.content)) {
      throw new Error('Template definition must have either path or content');
    }

    this.templates.set(name, {
      ...templateDef,
      type: templateDef.path ? 'file' : 'inline',
      cached: false
    });

    logger.debug(`Registered template: ${name}`);
  }

  /**
   * Get template content (with caching)
   * @param {string} templateName - Name of template to retrieve
   * @returns {Promise<string>} Template content
   */
  async getTemplate(templateName) {
    const templateDef = this.templates.get(templateName);
    
    if (!templateDef) {
      logger.warn(`Template not found: ${templateName}, using default`);
      return this.getTemplate(this.defaultTemplate);
    }

    // Return cached content if available
    if (templateDef.cached && this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName);
    }

    let content;

    try {
      if (templateDef.type === 'file') {
        // Load from file
        const response = await fetch(templateDef.path);
        if (!response.ok) {
          throw new Error(`Failed to load template: ${response.status}`);
        }
        content = await response.text();
      } else {
        // Use inline content
        content = templateDef.content;
      }

      // Cache the content
      this.templateCache.set(templateName, content);
      
      // Mark as cached
      templateDef.cached = true;

      return content;
    } catch (error) {
      logger.error(`Error loading template ${templateName}:`, error);
      
      // Fallback to minimal template
      if (templateName !== 'minimal') {
        return this.getTemplate('minimal');
      }
      
      throw error;
    }
  }

  /**
   * Render a game page with the specified template and variables
   * @param {Object} gameConfig - Game configuration
   * @param {string} containerId - Target container ID
   * @returns {Promise<string>} Rendered HTML
   */
  async renderGamePage(gameConfig, containerId) {
    try {
      // Get template content
      const templateContent = await this.getTemplate(gameConfig.template || this.defaultTemplate);
      
      // Build template variables
      const templateVars = this.buildTemplateVars(gameConfig, containerId);
      
      // Process template with variables
      const renderedContent = this.processTemplate(templateContent, templateVars);
      
      // If we're updating an existing container, inject the content
      if (containerId && containerId !== 'body') {
        const container = document.getElementById(containerId);
        if (container) {
          container.innerHTML = renderedContent;
          
          // Process any scripts in the rendered content
          this.processScripts(container);
        } else {
          logger.warn(`Container not found: ${containerId}`);
        }
      }
      
      logger.debug(`Rendered game page for: ${gameConfig.id}`);
      return renderedContent;
      
    } catch (error) {
      logger.error(`Failed to render game page for ${gameConfig.id}:`, error);
      throw error;
    }
  }

  /**
   * Build template variables from game configuration
   * @param {Object} gameConfig - Game configuration
   * @param {string} containerId - Container ID
   * @returns {Object} Template variables
   */
  buildTemplateVars(gameConfig, containerId) {
    return {
      // Game identification
      gameId: gameConfig.id,
      gameName: gameConfig.name || 'Untitled Game',
      gameDescription: gameConfig.description || 'An educational game',
      
      // Character and subject info
      characterName: gameConfig.character || 'Learnimals Friend',
      characterType: gameConfig.characterType || 'Animal',
      subjectName: gameConfig.subject || 'General',
      
      // File paths
      gameScriptPath: gameConfig.scriptPath,
      gameStyleSheet: gameConfig.styleSheet || this.getDefaultStyleSheet(gameConfig),
      
      // Game content and options
      gameContent: gameConfig.templateContent || this.getDefaultGameContent(),
      gameOptions: JSON.stringify(gameConfig.options || {}),
      
      // UI configuration
      timeLimit: gameConfig.timeLimit || '60s',
      progressText: gameConfig.progressText || 'Progress',
      showControls: gameConfig.showControls !== false,
      showProgress: gameConfig.showProgress !== false,
      showStats: gameConfig.showStats !== false,
      
      // Container
      containerId: containerId,
      
      // Theme and styling
      themeClass: gameConfig.themeClass || '',
      customStyles: gameConfig.customStyles || '',
      
      // Features
      features: gameConfig.features || [],
      featureFlags: this.buildFeatureFlags(gameConfig.features || [])
    };
  }

  /**
   * Process template content by replacing variables
   * @param {string} template - Template content
   * @param {Object} variables - Variables to substitute
   * @returns {string} Processed template
   */
  processTemplate(template, variables) {
    let result = template;

    // Replace template variables {{variableName}}
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, this.escapeHtml(String(value)));
    }

    // Handle conditional blocks {{#if condition}}...{{/if}}
    result = this.processConditionals(result, variables);

    // Handle loops {{#each array}}...{{/each}}
    result = this.processLoops(result, variables);

    // Remove any unprocessed template variables
    result = result.replace(/{{[^}]*}}/g, '');

    return result;
  }

  /**
   * Process conditional template blocks
   * @param {string} template - Template content
   * @param {Object} variables - Template variables
   * @returns {string} Processed template
   */
  processConditionals(template, variables) {
    const conditionalRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
    
    return template.replace(conditionalRegex, (match, condition, content) => {
      const value = variables[condition];
      
      // Evaluate condition
      if (this.isTruthy(value)) {
        return content;
      }
      
      return '';
    });
  }

  /**
   * Process loop template blocks
   * @param {string} template - Template content
   * @param {Object} variables - Template variables
   * @returns {string} Processed template
   */
  processLoops(template, variables) {
    const loopRegex = /{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g;
    
    return template.replace(loopRegex, (match, arrayName, content) => {
      const array = variables[arrayName];
      
      if (!Array.isArray(array)) {
        return '';
      }
      
      return array.map((item, index) => {
        let itemContent = content;
        
        // Replace {{this}} with current item
        if (typeof item === 'string' || typeof item === 'number') {
          itemContent = itemContent.replace(/{{this}}/g, this.escapeHtml(String(item)));
        } else if (typeof item === 'object') {
          // Replace object properties
          for (const [key, value] of Object.entries(item)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            itemContent = itemContent.replace(regex, this.escapeHtml(String(value)));
          }
        }
        
        // Replace {{@index}} with current index
        itemContent = itemContent.replace(/{{@index}}/g, String(index));
        
        return itemContent;
      }).join('');
    });
  }

  /**
   * Process script tags in rendered content
   * @param {Element} container - Container element
   */
  processScripts(container) {
    const scripts = container.querySelectorAll('script');
    
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      
      // Copy attributes
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      
      // Copy content
      newScript.textContent = oldScript.textContent;
      
      // Replace old script with new one to execute it
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }

  /**
   * Build feature flags object from features array
   * @param {Array} features - Array of feature names
   * @returns {Object} Feature flags object
   */
  buildFeatureFlags(features) {
    const flags = {};
    const knownFeatures = ['analytics', 'progress', 'mobile', 'themes', 'audio', 'multiplayer'];
    
    knownFeatures.forEach(feature => {
      flags[feature] = features.includes(feature);
    });
    
    return flags;
  }

  /**
   * Get default stylesheet path for a game
   * @param {Object} gameConfig - Game configuration
   * @returns {string} Stylesheet path
   */
  getDefaultStyleSheet(gameConfig) {
    return `/src/features/games/${gameConfig.id}/${gameConfig.id}.css`;
  }

  /**
   * Get default game content
   * @returns {string} Default content
   */
  getDefaultGameContent() {
    return `
      <div class="game-loading">
        <div class="loading-spinner"></div>
        <p>Loading game...</p>
      </div>
    `;
  }

  /**
   * Escape HTML special characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Check if a value is truthy for template conditions
   * @param {*} value - Value to check
   * @returns {boolean} True if truthy
   */
  isTruthy(value) {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return Boolean(value);
  }

  /**
   * Get minimal template content
   * @returns {string} Minimal template HTML
   */
  getMinimalTemplate() {
    return `
      <!doctype html>
      <html lang="en">
      <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>{{gameName}} - Learnimals</title>
          <link rel="stylesheet" href="/src/styles/base/styles.css" />
          {{#if gameStyleSheet}}<link rel="stylesheet" href="{{gameStyleSheet}}" />{{/if}}
      </head>
      <body>
          <main id="{{containerId}}" class="game-minimal">
              {{gameContent}}
          </main>
          
          <script type="module" src="{{gameScriptPath}}"></script>
          <script>
              document.addEventListener('DOMContentLoaded', () => {
                  console.log('Minimal game template loaded: {{gameName}}');
              });
          </script>
      </body>
      </html>
    `;
  }

  /**
   * Get fullscreen template content
   * @returns {string} Fullscreen template HTML
   */
  getFullscreenTemplate() {
    return `
      <!doctype html>
      <html lang="en">
      <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>{{gameName}} - Learnimals</title>
          <link rel="stylesheet" href="/src/styles/base/styles.css" />
          {{#if gameStyleSheet}}<link rel="stylesheet" href="{{gameStyleSheet}}" />{{/if}}
          <style>
              body { margin: 0; padding: 0; overflow: hidden; }
              .game-fullscreen { width: 100vw; height: 100vh; }
          </style>
      </head>
      <body>
          <main id="{{containerId}}" class="game-fullscreen">
              {{gameContent}}
          </main>
          
          <script type="module" src="{{gameScriptPath}}"></script>
          <script>
              document.addEventListener('DOMContentLoaded', () => {
                  console.log('Fullscreen game template loaded: {{gameName}}');
              });
          </script>
      </body>
      </html>
    `;
  }

  /**
   * Clear template cache
   */
  clearCache() {
    this.templateCache.clear();
    
    // Reset cached flags
    for (const templateDef of this.templates.values()) {
      if (templateDef.type === 'file') {
        templateDef.cached = false;
      }
    }
    
    logger.debug('Template cache cleared');
  }

  /**
   * Get template engine statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      registeredTemplates: this.templates.size,
      cachedTemplates: this.templateCache.size,
      defaultTemplate: this.defaultTemplate,
      templateNames: Array.from(this.templates.keys())
    };
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.templates.clear();
    this.templateCache.clear();
    logger.debug('GameTemplateEngine destroyed');
  }
}