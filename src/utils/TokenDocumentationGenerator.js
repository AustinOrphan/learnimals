/**
 * TokenDocumentationGenerator - Theme token documentation generator utility
 * Generates comprehensive documentation for theme tokens used in the component system
 * 
 * Requirements: FR-2.5, NFR-2.2, NFR-3.4
 * - FR-2.5: Support theme token documentation generation
 * - NFR-2.2: Theme tokens MUST be documented and discoverable
 * - NFR-3.4: CSS debugging tools MUST be provided
 * 
 * Task 9.2: Create theme token documentation generator utility
 * Leverage: Documentation patterns from ComponentManifest.js
 */

import { ComponentManifest, componentRegistry } from './ComponentManifest.js';
import themeService from './ThemeService.js';

/**
 * TokenDocumentationGenerator - Generates comprehensive theme token documentation
 */
export class TokenDocumentationGenerator {
  constructor(options = {}) {
    this.options = {
      outputFormat: options.outputFormat || 'markdown', // 'markdown', 'json', 'html'
      includeUsage: options.includeUsage !== false,
      includeExamples: options.includeExamples !== false,
      includeVariants: options.includeVariants !== false,
      sortBy: options.sortBy || 'category', // 'category', 'alphabetical', 'usage'
      groupBy: options.groupBy || 'category', // 'category', 'component', 'theme'
      ...options
    };

    // Token registry for documentation
    this.tokenRegistry = new Map();
    this.usageRegistry = new Map();
    this.exampleRegistry = new Map();
    
    // Token patterns for extraction
    this.tokenPatterns = {
      definition: /^(--[\w-]+)\s*:\s*([^;]+);?\s*(?:\/\*\s*(.+?)\s*\*\/)?$/gm,
      usage: /var\(\s*(--[\w-]+)(?:\s*,\s*([^)]+))?\s*\)/g,
      fallback: /var\(\s*--[\w-]+\s*,\s*([^)]+)\s*\)/g,
      comment: /\/\*\s*(.*?)\s*\*\//g
    };

    // Token categories with metadata
    this.tokenCategories = new Map([
      ['color', { 
        label: 'Colors', 
        description: 'Color tokens including primary, secondary, and semantic colors',
        prefix: ['--color', '--bg', '--text', '--border'],
        examples: ['--color-primary', '--bg-body', '--text-primary']
      }],
      ['spacing', { 
        label: 'Spacing', 
        description: 'Spacing tokens for margins, padding, and layout',
        prefix: ['--space', '--gap', '--margin', '--padding'],
        examples: ['--space-md', '--gap-lg', '--margin-top']
      }],
      ['typography', { 
        label: 'Typography', 
        description: 'Typography tokens including font sizes, weights, and line heights',
        prefix: ['--font', '--text', '--line-height'],
        examples: ['--font-size-base', '--font-weight-bold', '--line-height-base']
      }],
      ['layout', { 
        label: 'Layout', 
        description: 'Layout tokens for containers, grids, and positioning',
        prefix: ['--container', '--grid', '--width', '--height'],
        examples: ['--container-max-width', '--grid-columns']
      }],
      ['effects', { 
        label: 'Effects', 
        description: 'Visual effect tokens including shadows, borders, and animations',
        prefix: ['--shadow', '--border', '--radius', '--opacity'],
        examples: ['--shadow-lg', '--border-radius', '--opacity-disabled']
      }],
      ['component', { 
        label: 'Components', 
        description: 'Component-specific tokens that extend base tokens',
        prefix: ['--card', '--modal', '--button', '--input'],
        examples: ['--card-background', '--modal-overlay', '--button-primary']
      }]
    ]);

    // Theme Service integration
    this.themeService = themeService;
  }

  /**
   * Generate comprehensive token documentation
   * @param {Object} options - Generation options
   * @returns {Promise<string>} - Generated documentation
   */
  async generateDocumentation(options = {}) {
    const mergedOptions = { ...this.options, ...options };
    
    // Extract all tokens from various sources
    await this.extractTokensFromSources();
    
    // Analyze token usage across components
    if (mergedOptions.includeUsage) {
      await this.analyzeTokenUsage();
    }
    
    // Generate examples for tokens
    if (mergedOptions.includeExamples) {
      this.generateTokenExamples();
    }
    
    // Organize tokens by specified grouping
    const organizedTokens = this.organizeTokens(mergedOptions.groupBy, mergedOptions.sortBy);
    
    // Generate documentation in requested format
    switch (mergedOptions.outputFormat) {
      case 'markdown':
        return this.generateMarkdownDocumentation(organizedTokens, mergedOptions);
      case 'json':
        return this.generateJSONDocumentation(organizedTokens, mergedOptions);
      case 'html':
        return this.generateHTMLDocumentation(organizedTokens, mergedOptions);
      default:
        throw new Error(`Unsupported output format: ${mergedOptions.outputFormat}`);
    }
  }

  /**
   * Extract tokens from all available sources
   * @private
   */
  async extractTokensFromSources() {
    // Clear existing registries
    this.tokenRegistry.clear();
    this.usageRegistry.clear();
    this.exampleRegistry.clear();

    // Extract from global CSS files
    await this.extractFromGlobalCSS();
    
    // Extract from component CSS files
    await this.extractFromComponentCSS();
    
    // Extract from theme files
    await this.extractFromThemeFiles();
    
    // Extract from computed styles (runtime tokens)
    this.extractFromComputedStyles();
  }

  /**
   * Extract tokens from global CSS files
   * @private
   */
  async extractFromGlobalCSS() {
    const globalCSSPaths = [
      'src/styles/base/styles.css',
      'src/styles/themes/default.css',
      'src/styles/themes/dark.css'
    ];

    for (const cssPath of globalCSSPaths) {
      try {
        const cssContent = await this.loadCSSFile(cssPath);
        if (cssContent) {
          this.extractTokensFromCSS(cssContent, {
            source: cssPath,
            type: 'global',
            category: this.inferCategoryFromPath(cssPath)
          });
        }
      } catch (error) {
        console.warn(`Could not load global CSS file ${cssPath}:`, error);
      }
    }
  }

  /**
   * Extract tokens from component CSS files
   * @private
   */
  async extractFromComponentCSS() {
    const components = componentRegistry.getAll();
    
    for (const componentName of components) {
      const manifest = componentRegistry.get(componentName);
      if (!manifest) continue;
      
      const cssFiles = manifest.getCSSFiles();
      for (const cssFile of cssFiles) {
        try {
          const cssContent = await this.loadCSSFile(cssFile);
          if (cssContent) {
            this.extractTokensFromCSS(cssContent, {
              source: cssFile,
              type: 'component',
              component: componentName,
              category: 'component'
            });
          }
        } catch (error) {
          console.warn(`Could not load component CSS file ${cssFile}:`, error);
        }
      }
    }
  }

  /**
   * Extract tokens from theme files
   * @private
   */
  async extractFromThemeFiles() {
    const themeNames = this.themeService.getAvailableThemes();
    
    for (const themeName of themeNames) {
      try {
        const themeCSS = await this.themeService.getThemeCSS(themeName);
        if (themeCSS) {
          this.extractTokensFromCSS(themeCSS, {
            source: `theme-${themeName}`,
            type: 'theme',
            theme: themeName,
            category: 'variant'
          });
        }
      } catch (error) {
        console.warn(`Could not load theme CSS for ${themeName}:`, error);
      }
    }
  }

  /**
   * Extract tokens from computed styles
   * @private
   */
  extractFromComputedStyles() {
    if (typeof document === 'undefined') return;
    
    try {
      const rootStyles = getComputedStyle(document.documentElement);
      
      // Iterate through all CSS custom properties
      for (let i = 0; i < rootStyles.length; i++) {
        const property = rootStyles[i];
        if (property.startsWith('--')) {
          const value = rootStyles.getPropertyValue(property).trim();
          
          this.registerToken(property, {
            value: value,
            source: 'computed-styles',
            type: 'computed',
            category: this.inferCategoryFromName(property)
          });
        }
      }
    } catch (error) {
      console.warn('Could not extract tokens from computed styles:', error);
    }
  }

  /**
   * Extract tokens from CSS content
   * @param {string} cssContent - CSS content to parse
   * @param {Object} metadata - Token metadata
   * @private
   */
  extractTokensFromCSS(cssContent, metadata) {
    // Extract token definitions
    let match;
    while ((match = this.tokenPatterns.definition.exec(cssContent)) !== null) {
      const [fullMatch, tokenName, tokenValue, comment] = match;
      
      this.registerToken(tokenName, {
        value: tokenValue.trim(),
        description: comment?.trim(),
        ...metadata
      });
    }

    // Extract token usages
    this.tokenPatterns.usage.lastIndex = 0;
    while ((match = this.tokenPatterns.usage.exec(cssContent)) !== null) {
      const [fullMatch, tokenName, fallback] = match;
      
      this.registerTokenUsage(tokenName, {
        context: this.extractUsageContext(cssContent, match.index),
        fallback: fallback?.trim(),
        ...metadata
      });
    }
  }

  /**
   * Register a token in the documentation registry
   * @param {string} tokenName - Token name
   * @param {Object} tokenData - Token data
   * @private
   */
  registerToken(tokenName, tokenData) {
    if (!this.tokenRegistry.has(tokenName)) {
      this.tokenRegistry.set(tokenName, {
        name: tokenName,
        category: this.inferCategoryFromName(tokenName),
        definitions: [],
        usage: new Set(),
        examples: []
      });
    }

    const token = this.tokenRegistry.get(tokenName);
    token.definitions.push(tokenData);
    
    // Update category if not already set or if component category is more specific
    if (tokenData.category && (token.category === 'unknown' || tokenData.category === 'component')) {
      token.category = tokenData.category;
    }
  }

  /**
   * Register token usage
   * @param {string} tokenName - Token name
   * @param {Object} usageData - Usage data
   * @private
   */
  registerTokenUsage(tokenName, usageData) {
    if (!this.usageRegistry.has(tokenName)) {
      this.usageRegistry.set(tokenName, []);
    }
    
    this.usageRegistry.get(tokenName).push(usageData);
    
    // Add usage to token registry if token exists
    if (this.tokenRegistry.has(tokenName)) {
      const usageKey = `${usageData.source}:${usageData.context}`;
      this.tokenRegistry.get(tokenName).usage.add(usageKey);
    }
  }

  /**
   * Analyze token usage across components
   * @private
   */
  async analyzeTokenUsage() {
    // This method would scan component files for token usage patterns
    // Implementation would depend on file system access capabilities
    console.log('Token usage analysis would require file system scanning');
  }

  /**
   * Generate examples for tokens
   * @private
   */
  generateTokenExamples() {
    for (const [tokenName, tokenData] of this.tokenRegistry) {
      const examples = this.generateTokenExamplesForToken(tokenName, tokenData);
      tokenData.examples = examples;
    }
  }

  /**
   * Generate examples for a specific token
   * @param {string} tokenName - Token name
   * @param {Object} tokenData - Token data
   * @returns {Array} Array of examples
   * @private
   */
  generateTokenExamplesForToken(tokenName, tokenData) {
    const examples = [];
    const category = tokenData.category;

    switch (category) {
      case 'color':
        examples.push({
          type: 'css',
          code: `.example { background-color: var(${tokenName}); }`,
          description: `Using ${tokenName} as a background color`
        });
        examples.push({
          type: 'css',
          code: `.example { color: var(${tokenName}); }`,
          description: `Using ${tokenName} as text color`
        });
        break;
        
      case 'spacing':
        examples.push({
          type: 'css',
          code: `.example { margin: var(${tokenName}); }`,
          description: `Using ${tokenName} for margin`
        });
        examples.push({
          type: 'css',
          code: `.example { padding: var(${tokenName}); }`,
          description: `Using ${tokenName} for padding`
        });
        break;
        
      case 'typography':
        if (tokenName.includes('font-size')) {
          examples.push({
            type: 'css',
            code: `.example { font-size: var(${tokenName}); }`,
            description: `Using ${tokenName} for text size`
          });
        }
        if (tokenName.includes('line-height')) {
          examples.push({
            type: 'css',
            code: `.example { line-height: var(${tokenName}); }`,
            description: `Using ${tokenName} for line spacing`
          });
        }
        break;
        
      default:
        examples.push({
          type: 'css',
          code: `.example { property: var(${tokenName}); }`,
          description: `Basic usage of ${tokenName}`
        });
    }

    return examples;
  }

  /**
   * Organize tokens by specified criteria
   * @param {string} groupBy - Grouping criteria
   * @param {string} sortBy - Sorting criteria
   * @returns {Map} Organized tokens
   * @private
   */
  organizeTokens(groupBy, sortBy) {
    const organized = new Map();
    
    // Group tokens
    for (const [tokenName, tokenData] of this.tokenRegistry) {
      let groupKey;
      
      switch (groupBy) {
        case 'category':
          groupKey = tokenData.category;
          break;
        case 'component':
          groupKey = tokenData.definitions.find(d => d.component)?.component || 'global';
          break;
        case 'theme':
          groupKey = tokenData.definitions.find(d => d.theme)?.theme || 'default';
          break;
        default:
          groupKey = 'all';
      }
      
      if (!organized.has(groupKey)) {
        organized.set(groupKey, []);
      }
      
      organized.get(groupKey).push([tokenName, tokenData]);
    }
    
    // Sort tokens within each group
    for (const [groupKey, tokens] of organized) {
      tokens.sort(([nameA, dataA], [nameB, dataB]) => {
        switch (sortBy) {
          case 'alphabetical':
            return nameA.localeCompare(nameB);
          case 'usage':
            return dataB.usage.size - dataA.usage.size;
          case 'category':
            return dataA.category.localeCompare(dataB.category) || nameA.localeCompare(nameB);
          default:
            return nameA.localeCompare(nameB);
        }
      });
    }
    
    return organized;
  }

  /**
   * Generate Markdown documentation
   * @param {Map} organizedTokens - Organized tokens
   * @param {Object} options - Generation options
   * @returns {string} Markdown documentation
   * @private
   */
  generateMarkdownDocumentation(organizedTokens, options) {
    let markdown = '# Theme Token Documentation\n\n';
    markdown += `Generated on: ${new Date().toLocaleString()}\n\n`;
    markdown += `Total tokens: ${this.tokenRegistry.size}\n\n`;
    
    // Add table of contents
    markdown += '## Table of Contents\n\n';
    for (const [groupKey] of organizedTokens) {
      const categoryInfo = this.tokenCategories.get(groupKey);
      const displayName = categoryInfo?.label || this.capitalizeFirst(groupKey);
      markdown += `- [${displayName}](#${groupKey.toLowerCase().replace(/\s+/g, '-')})\n`;
    }
    markdown += '\n';
    
    // Generate documentation for each group
    for (const [groupKey, tokens] of organizedTokens) {
      const categoryInfo = this.tokenCategories.get(groupKey);
      const displayName = categoryInfo?.label || this.capitalizeFirst(groupKey);
      
      markdown += `## ${displayName}\n\n`;
      
      if (categoryInfo?.description) {
        markdown += `${categoryInfo.description}\n\n`;
      }
      
      // Token table
      markdown += '| Token | Value | Description | Usage Count |\n';
      markdown += '|-------|-------|-------------|--------------|\n';
      
      for (const [tokenName, tokenData] of tokens) {
        const primaryValue = tokenData.definitions[0]?.value || 'N/A';
        const description = tokenData.definitions[0]?.description || 'No description';
        const usageCount = tokenData.usage.size;
        
        markdown += `| \`${tokenName}\` | \`${primaryValue}\` | ${description} | ${usageCount} |\n`;
      }
      
      markdown += '\n';
      
      // Examples section
      if (options.includeExamples) {
        markdown += `### ${displayName} Examples\n\n`;
        
        for (const [tokenName, tokenData] of tokens.slice(0, 3)) { // Show examples for first 3 tokens
          if (tokenData.examples.length > 0) {
            markdown += `#### ${tokenName}\n\n`;
            
            for (const example of tokenData.examples) {
              markdown += `**${example.description}**\n\n`;
              markdown += '```css\n';
              markdown += example.code + '\n';
              markdown += '```\n\n';
            }
          }
        }
      }
    }
    
    // Usage statistics
    if (options.includeUsage) {
      markdown += '## Usage Statistics\n\n';
      markdown += this.generateUsageStatistics();
    }
    
    return markdown;
  }

  /**
   * Generate JSON documentation
   * @param {Map} organizedTokens - Organized tokens
   * @param {Object} options - Generation options
   * @returns {string} JSON documentation
   * @private
   */
  generateJSONDocumentation(organizedTokens, options) {
    const documentation = {
      generatedAt: new Date().toISOString(),
      totalTokens: this.tokenRegistry.size,
      categories: {},
      tokens: {}
    };
    
    // Add category information
    for (const [categoryKey, categoryInfo] of this.tokenCategories) {
      documentation.categories[categoryKey] = categoryInfo;
    }
    
    // Add token information
    for (const [groupKey, tokens] of organizedTokens) {
      if (!documentation.tokens[groupKey]) {
        documentation.tokens[groupKey] = {};
      }
      
      for (const [tokenName, tokenData] of tokens) {
        documentation.tokens[groupKey][tokenName] = {
          name: tokenName,
          category: tokenData.category,
          definitions: tokenData.definitions,
          usage: Array.from(tokenData.usage),
          examples: options.includeExamples ? tokenData.examples : undefined
        };
      }
    }
    
    return JSON.stringify(documentation, null, 2);
  }

  /**
   * Generate HTML documentation
   * @param {Map} organizedTokens - Organized tokens
   * @param {Object} options - Generation options
   * @returns {string} HTML documentation
   * @private
   */
  generateHTMLDocumentation(organizedTokens, options) {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Theme Token Documentation</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 2rem; }
        .token { background: #f5f5f5; padding: 0.25rem; border-radius: 3px; }
        .example { background: #f9f9f9; padding: 1rem; border-left: 4px solid #007bff; margin: 1rem 0; }
        table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
        th { background: #f5f5f5; }
    </style>
</head>
<body>
    <h1>Theme Token Documentation</h1>
    <p>Generated on: ${new Date().toLocaleString()}</p>
    <p>Total tokens: ${this.tokenRegistry.size}</p>
`;
    
    for (const [groupKey, tokens] of organizedTokens) {
      const categoryInfo = this.tokenCategories.get(groupKey);
      const displayName = categoryInfo?.label || this.capitalizeFirst(groupKey);
      
      html += `<h2>${displayName}</h2>`;
      
      if (categoryInfo?.description) {
        html += `<p>${categoryInfo.description}</p>`;
      }
      
      html += '<table><thead><tr><th>Token</th><th>Value</th><th>Description</th><th>Usage Count</th></tr></thead><tbody>';
      
      for (const [tokenName, tokenData] of tokens) {
        const primaryValue = tokenData.definitions[0]?.value || 'N/A';
        const description = tokenData.definitions[0]?.description || 'No description';
        const usageCount = tokenData.usage.size;
        
        html += `<tr>
          <td><code class="token">${tokenName}</code></td>
          <td><code>${primaryValue}</code></td>
          <td>${description}</td>
          <td>${usageCount}</td>
        </tr>`;
      }
      
      html += '</tbody></table>';
    }
    
    html += '</body></html>';
    return html;
  }

  /**
   * Generate usage statistics
   * @returns {string} Usage statistics markdown
   * @private
   */
  generateUsageStatistics() {
    let stats = '';
    
    // Most used tokens
    const sortedByUsage = Array.from(this.tokenRegistry.entries())
      .sort(([, a], [, b]) => b.usage.size - a.usage.size)
      .slice(0, 10);
    
    stats += '### Most Used Tokens\n\n';
    for (const [tokenName, tokenData] of sortedByUsage) {
      stats += `- \`${tokenName}\`: ${tokenData.usage.size} usages\n`;
    }
    
    return stats;
  }

  /**
   * Infer token category from name
   * @param {string} tokenName - Token name
   * @returns {string} Inferred category
   * @private
   */
  inferCategoryFromName(tokenName) {
    for (const [category, info] of this.tokenCategories) {
      if (info.prefix.some(prefix => tokenName.startsWith(prefix))) {
        return category;
      }
    }
    return 'unknown';
  }

  /**
   * Infer category from file path
   * @param {string} path - File path
   * @returns {string} Inferred category
   * @private
   */
  inferCategoryFromPath(path) {
    if (path.includes('theme')) return 'variant';
    if (path.includes('component')) return 'component';
    return 'global';
  }

  /**
   * Extract usage context from CSS content
   * @param {string} cssContent - CSS content
   * @param {number} index - Match index
   * @returns {string} Usage context
   * @private
   */
  extractUsageContext(cssContent, index) {
    const lines = cssContent.substring(0, index).split('\n');
    const currentLine = lines[lines.length - 1];
    const selector = this.findNearestSelector(cssContent, index);
    return `${selector}: ${currentLine.trim()}`;
  }

  /**
   * Find nearest CSS selector
   * @param {string} cssContent - CSS content
   * @param {number} index - Current index
   * @returns {string} Nearest selector
   * @private
   */
  findNearestSelector(cssContent, index) {
    const beforeContent = cssContent.substring(0, index);
    const selectorMatch = beforeContent.match(/([.#]?[\w-]+(?:\s*[>+~]\s*[\w-]+)*)\s*\{[^}]*$/);
    return selectorMatch ? selectorMatch[1].trim() : 'unknown';
  }

  /**
   * Load CSS file content
   * @param {string} filePath - CSS file path
   * @returns {Promise<string|null>} CSS content or null
   * @private
   */
  async loadCSSFile(filePath) {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.warn(`Could not load CSS file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Capitalize first letter of string
   * @param {string} str - String to capitalize
   * @returns {string} Capitalized string
   * @private
   */
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Create singleton instance
const tokenDocumentationGenerator = new TokenDocumentationGenerator();

export { tokenDocumentationGenerator };
export default TokenDocumentationGenerator;