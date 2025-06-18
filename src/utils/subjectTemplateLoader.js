/**
 * Subject Template Loader
 * 
 * This utility loads the subject template and replaces placeholders with subject-specific content.
 * It can be used to maintain a consistent structure across all subject pages while allowing
 * for customization of content.
 */

class SubjectTemplateLoader {    /**
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
              // Replace placeholders with actual content
            template = template.replace(/{{subjectName}}/g, options.subjectName);
            template = template.replace(/{{subjectLower}}/g, options.subjectLower);
            template = template.replace(/{{subjectDescription}}/g, options.subjectDescription);
            template = template.replace(/{{characterName}}/g, options.characterName);
            template = template.replace(/{{characterType}}/g, options.characterType);
            template = template.replace(/{{heroSubtitle}}/g, options.heroSubtitle);
            template = template.replace(/{{featureCards}}/g, options.featureCards);
            
            // Handle feature cards data for Card.js
            if (options.featureCardsData) {
                // Add the feature cards data as a JavaScript variable
                const scriptTag = `<script>
                    // Feature cards data for Card.js
                    const featureCardsData = ${JSON.stringify(options.featureCardsData)};
                </script>`;
                
                // Insert the script tag before the closing head tag
                template = template.replace('</head>', `${scriptTag}\n    </head>`);
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
}

// Export the class for use in modules
export default SubjectTemplateLoader;