/**
 * Subject Template Loader
 * 
 * This utility loads the subject template and replaces placeholders with subject-specific content.
 * It can be used to maintain a consistent structure across all subject pages while allowing
 * for customization of content. Enhanced with character generation system integration.
 */

import { escapeHTML } from './htmlEscape.js';
import { getCharacterBySubject, generateCharacterMessage } from './characterIntegration.js';

class SubjectTemplateLoader {
  /**
     * Load the subject template with custom content
     * 
     * @param {Object} options - Configuration options for the template
     * @param {string} options.subjectName - Name of the subject (e.g., "Math", "Science")
     * @param {string} options.subjectLower - Lowercase name of subject for file paths (e.g., "math", "science")
     * @param {string} options.subjectDescription - Meta description for the subject page
     * @param {string} options.characterName - Name of the character (e.g., "Mango", "Sky")
     * @param {string} options.characterType - Type of animal (e.g., "Shark", "Parrot")
     * @param {string} options.heroSubtitle - Subtitle text in the hero section
     * @param {string} options.featureCards - HTML content for feature cards section (fallback)
     * @param {Array} [options.featureCardsData] - Array of card data objects for Card.js component
     * @param {boolean} [options.enableCharacterRenderer=true] - Enable character renderer component
     * @param {Object} [options.characterOptions] - Options for character renderer
     * @returns {string} - Processed HTML content for the subject page
     */
  static async loadTemplate(options) {
    try {
      // Fetch the template
      const response = await fetch('/src/templates/subject.html');
      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.status}`);
      }
            
      let template = await response.text();
      
      // Get character data for enhanced functionality
      const character = getCharacterBySubject(options.subjectLower);
      const characterGreeting = character ? generateCharacterMessage(character, 'greeting') : '';
      
      // Replace placeholders with actual content (with HTML escaping for security)
      template = template.replace(/{{subjectName}}/g, escapeHTML(options.subjectName));
      template = template.replace(/{{subjectLower}}/g, escapeHTML(options.subjectLower));
      template = template.replace(/{{subjectDescription}}/g, escapeHTML(options.subjectDescription));
      template = template.replace(/{{characterName}}/g, escapeHTML(options.characterName));
      template = template.replace(/{{characterType}}/g, escapeHTML(options.characterType));
      template = template.replace(/{{heroSubtitle}}/g, escapeHTML(options.heroSubtitle || characterGreeting));
      template = template.replace(/{{featureCards}}/g, options.featureCards);
      
      // Add character-specific CSS classes to body
      const characterClasses = character ? 
        `character-${character.species.primary} subject-${options.subjectLower}` : 
        `subject-${options.subjectLower}`;
      template = template.replace('<body>', `<body class="${characterClasses}">`);
      
      // Inject character renderer CSS if enabled
      if (options.enableCharacterRenderer !== false) {
        const characterRendererCSS = `
          <link rel="stylesheet" href="/src/styles/components/CharacterRenderer.css" />`;
        template = template.replace('</head>', `${characterRendererCSS}\n    </head>`);
      }
            
      // Handle feature cards data for Card.js
      let scriptsToInject = [];
      
      if (options.featureCardsData) {
        scriptsToInject.push(`
          // Feature cards data for Card.js
          const featureCardsData = ${JSON.stringify(options.featureCardsData)};
        `);
      }
      
      // Add character data if available
      if (character) {
        scriptsToInject.push(`
          // Character data for enhanced interactions
          const characterData = ${JSON.stringify(character)};
          const characterMessages = {
            greeting: ${JSON.stringify(generateCharacterMessage(character, 'greeting'))},
            encouragement: ${JSON.stringify(generateCharacterMessage(character, 'encouragement'))},
            celebration: ${JSON.stringify(generateCharacterMessage(character, 'celebration'))}
          };
        `);
      }
      
      // Add character renderer initialization if enabled
      if (options.enableCharacterRenderer !== false && character) {
        scriptsToInject.push(`
          // Character renderer initialization
          let characterRenderer = null;
          
          function initializeCharacterRenderer() {
            if (typeof CharacterRenderer !== 'undefined' && characterData) {
              const heroSection = document.querySelector('.hero');
              if (heroSection && !characterRenderer) {
                // Create character container
                const characterContainer = document.createElement('div');
                characterContainer.className = 'hero-character-container';
                characterContainer.style.cssText = \`
                  position: absolute;
                  top: 20px;
                  right: 20px;
                  z-index: 10;
                \`;
                
                // Initialize character renderer
                characterRenderer = new CharacterRenderer({
                  character: characterData,
                  size: ${options.characterOptions?.size || 150},
                  interactive: ${options.characterOptions?.interactive !== false},
                  animated: ${options.characterOptions?.animated !== false},
                  container: characterContainer
                });
                
                characterRenderer.render();
                heroSection.appendChild(characterContainer);
                
                // Add greeting animation after a delay
                setTimeout(() => {
                  if (characterRenderer) {
                    characterRenderer.setAnimationState('happy');
                  }
                }, 1000);
              }
            }
          }
          
          // Initialize after components are loaded
          document.addEventListener('componentsLoaded', initializeCharacterRenderer);
          document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initializeCharacterRenderer, 200);
          });
        `);
      }
      
      // Inject all scripts if any exist
      if (scriptsToInject.length > 0) {
        const combinedScript = `<script>\n${scriptsToInject.join('\n')}\n</script>`;
        template = template.replace('</head>', `${combinedScript}\n    </head>`);
      }
      
      // Add character renderer component import if enabled
      if (options.enableCharacterRenderer !== false) {
        const characterImport = `
          <script type="module">
            import CharacterRenderer from '/src/components/ui/CharacterRenderer.js';
            window.CharacterRenderer = CharacterRenderer;
          </script>`;
        template = template.replace('</head>', `${characterImport}\n    </head>`);
      }
            
      return template;
    } catch (error) {
      console.error('Error loading subject template:', error);
      return null;
    }
  }

  /**
     * Render the template directly into the current page
     * 
     * @param {Object} options - Configuration options for the template
     */
  static async renderTemplate(options) {
    const content = await this.loadTemplate(options);
    if (content) {
      document.open();
      document.write(content);
      document.close();
    } else {
      console.error('Failed to render subject template');
    }
  }

  /**
   * Create enhanced template options from subject config
   * 
   * @param {string} subjectKey - Subject key (math, science, etc.)
   * @param {Object} customOptions - Custom options to override defaults
   * @returns {Object} Enhanced template options
   */
  static createEnhancedOptions(subjectKey, customOptions = {}) {
    const character = getCharacterBySubject(subjectKey);
    
    if (!character) {
      console.warn(`No character found for subject: ${subjectKey}`);
      return customOptions;
    }

    const defaultOptions = {
      subjectName: character.personality?.favoriteSubject?.charAt(0).toUpperCase() + 
                   character.personality?.favoriteSubject?.slice(1) || subjectKey,
      subjectLower: subjectKey,
      subjectDescription: `Learn ${subjectKey} with ${character.name} the ${character.species.primary}`,
      characterName: character.name,
      characterType: character.species.primary.charAt(0).toUpperCase() + character.species.primary.slice(1),
      heroSubtitle: generateCharacterMessage(character, 'greeting'),
      enableCharacterRenderer: true,
      characterOptions: {
        size: 150,
        interactive: true,
        animated: true
      }
    };

    return { ...defaultOptions, ...customOptions };
  }

  /**
   * Initialize character interactions for the current page
   * 
   * @param {string} subjectKey - Subject key
   */
  static initializeCharacterInteractions(subjectKey) {
    const character = getCharacterBySubject(subjectKey);
    if (!character) return;

    // Set up global character interaction functions
    window.triggerCharacterCelebration = () => {
      if (window.characterRenderer) {
        window.characterRenderer.setAnimationState('celebrating');
        console.log(generateCharacterMessage(character, 'celebration'));
      }
    };

    window.triggerCharacterEncouragement = () => {
      if (window.characterRenderer) {
        window.characterRenderer.setAnimationState('encouraging');
        console.log(generateCharacterMessage(character, 'encouragement'));
      }
    };

    window.getCharacterMessage = (context) => {
      return generateCharacterMessage(character, context);
    };

    // Set up automatic encouragement for failed attempts
    let failureCount = 0;
    window.reportActivityFailure = () => {
      failureCount++;
      if (failureCount >= 2) {
        window.triggerCharacterEncouragement();
        failureCount = 0;
      }
    };

    // Set up celebration for successes
    window.reportActivitySuccess = () => {
      window.triggerCharacterCelebration();
      failureCount = 0;
    };
  }

  /**
   * Add character-specific styling to the page
   * 
   * @param {string} subjectKey - Subject key
   */
  static applyCharacterStyling(subjectKey) {
    const character = getCharacterBySubject(subjectKey);
    if (!character) return;

    // Add dynamic CSS variables for character colors
    const root = document.documentElement;
    const colors = character.appearance?.colors;
    
    if (colors) {
      root.style.setProperty('--character-primary', colors.primary);
      root.style.setProperty('--character-secondary', colors.secondary);
      root.style.setProperty('--character-accent', colors.accent);
    }

    // Add character-specific CSS classes
    document.body.classList.add(
      `character-${character.species.primary}`,
      `subject-${subjectKey}`,
      `personality-${character.personality.learningStyle || 'balanced'}`
    );
  }

  /**
   * Load and render a subject template with automatic enhancements
   * 
   * @param {string} subjectKey - Subject key
   * @param {Object} customOptions - Custom options to override defaults
   */
  static async renderEnhancedTemplate(subjectKey, customOptions = {}) {
    const enhancedOptions = this.createEnhancedOptions(subjectKey, customOptions);
    
    // Apply character styling before loading template
    this.applyCharacterStyling(subjectKey);
    
    // Render the template
    await this.renderTemplate(enhancedOptions);
    
    // Initialize character interactions after rendering
    setTimeout(() => {
      this.initializeCharacterInteractions(subjectKey);
    }, 500);
  }
}

// Export the class for use in modules
export default SubjectTemplateLoader;