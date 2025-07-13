/**
 * Subject Generator Script for Learnimals
 * 
 * This script programmatically creates new subjects with their animal characters,
 * directory structures, templates, and updates the main configuration.
 * 
 * Usage:
 *   node scripts/generateSubjects.js
 *   node scripts/generateSubjects.js --subjects=music,geography
 *   node scripts/generateSubjects.js --batch-file=subjects.json
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Default subject templates with animal characters
const subjectTemplates = {
  music: {
    name: 'Music',
    character: {
      name: 'Melody',
      type: 'Songbird',
      role: 'Music Teacher',
      description: 'Teaches rhythm, melody, and musical instruments'
    },
    description: 'Learn music theory, rhythm, and instruments with fun activities',
    features: ['Music Theory', 'Virtual Instruments', 'Rhythm Games', 'Song Composition'],
    color: '#9b59b6',
    difficulty: 'beginner',
    ageRange: '4-12'
  },
  
  geography: {
    name: 'Geography',
    character: {
      name: 'Atlas',
      type: 'Eagle',
      role: 'Geography Guide',
      description: 'Explores countries, continents, and cultures from above'
    },
    description: 'Discover countries, capitals, and cultures around the world',
    features: ['World Map', 'Country Explorer', 'Capital Quiz', 'Culture Corner'],
    color: '#27ae60',
    difficulty: 'intermediate',
    ageRange: '6-12'
  },
  
  history: {
    name: 'History',
    character: {
      name: 'Chrono',
      type: 'Turtle',
      role: 'History Keeper',
      description: 'Has lived through ages and remembers ancient stories'
    },
    description: 'Journey through time and learn about historical events',
    features: ['Timeline Explorer', 'Historical Figures', 'Ancient Civilizations', 'Time Machine'],
    color: '#8e44ad',
    difficulty: 'intermediate',
    ageRange: '7-12'
  },
  
  language: {
    name: 'Language',
    character: {
      name: 'Polyglot',
      type: 'Parrot',
      role: 'Language Teacher',
      description: 'Speaks multiple languages and loves sharing words'
    },
    description: 'Learn new languages through interactive games and stories',
    features: ['Vocabulary Builder', 'Pronunciation Practice', 'Language Games', 'Cultural Stories'],
    color: '#e74c3c',
    difficulty: 'beginner',
    ageRange: '5-12'
  },
  
  physics: {
    name: 'Physics',
    character: {
      name: 'Newton',
      type: 'Owl',
      role: 'Physics Professor',
      description: 'Wise owl who understands the laws of nature'
    },
    description: 'Explore forces, motion, and the fundamental laws of physics',
    features: ['Force & Motion', 'Simple Machines', 'Energy Lab', 'Physics Playground'],
    color: '#3498db',
    difficulty: 'advanced',
    ageRange: '8-12'
  },
  
  cooking: {
    name: 'Cooking',
    character: {
      name: 'Chef',
      type: 'Bear',
      role: 'Head Chef',
      description: 'Master chef who loves teaching kitchen skills and nutrition'
    },
    description: 'Learn cooking basics, nutrition, and kitchen safety',
    features: ['Recipe Maker', 'Nutrition Guide', 'Kitchen Safety', 'Virtual Cooking'],
    color: '#f39c12',
    difficulty: 'beginner',
    ageRange: '4-10'
  },

  environment: {
    name: 'Environment',
    character: {
      name: 'Terra',
      type: 'Fox',
      role: 'Environmental Guardian',
      description: 'Protects nature and teaches about our planet'
    },
    description: 'Learn about ecosystems, conservation, and protecting our planet',
    features: ['Ecosystem Explorer', 'Recycling Center', 'Climate Lab', 'Green Living'],
    color: '#2ecc71',
    difficulty: 'intermediate',
    ageRange: '6-12'
  }
};

// Animal character image placeholders
const animalImages = {
  songbird: '🐦',
  eagle: '🦅', 
  turtle: '🐢',
  parrot: '🦜',
  owl: '🦉',
  bear: '🐻',
  fox: '🦊'
};

class SubjectGenerator {
  constructor() {
    this.configPath = path.join(rootDir, 'src', 'config.js');
    this.subjectsDir = path.join(rootDir, 'src', 'features', 'subjects');
    this.imagesDir = path.join(rootDir, 'public', 'images');
    this.stylesDir = path.join(rootDir, 'src', 'styles', 'components');
  }

  async generateSubjects(subjectKeys = []) {
    console.log('🚀 Starting Subject Generation...');
    
    const results = {
      created: [],
      updated: [],
      errors: []
    };

    for (const subjectKey of subjectKeys) {
      try {
        console.log(`\n📚 Processing subject: ${subjectKey}`);
        
        if (!subjectTemplates[subjectKey]) {
          throw new Error(`Unknown subject template: ${subjectKey}`);
        }

        const subject = subjectTemplates[subjectKey];
        await this.createSubjectStructure(subjectKey, subject);
        results.created.push(subjectKey);
        
        console.log(`✅ Successfully created ${subjectKey}`);
      } catch (error) {
        console.error(`❌ Error creating ${subjectKey}:`, error.message);
        results.errors.push({ subject: subjectKey, error: error.message });
      }
    }

    // Update main config with all new subjects
    if (results.created.length > 0) {
      await this.updateMainConfig(results.created);
      console.log(`\n🔧 Updated main config with ${results.created.length} subjects`);
    }

    return results;
  }

  async createSubjectStructure(subjectKey, subject) {
    // 1. Create directory structure
    await this.createDirectories(subjectKey);
    
    // 2. Generate HTML templates
    await this.createHTMLTemplates(subjectKey, subject);
    
    // 3. Create CSS files
    await this.createCSSFiles(subjectKey, subject);
    
    // 4. Create JavaScript files
    await this.createJavaScriptFiles(subjectKey, subject);
    
    // 5. Generate placeholder image
    await this.createPlaceholderImage(subjectKey, subject);
  }

  async createDirectories(subjectKey) {
    const directories = [
      path.join(this.subjectsDir, subjectKey),
      path.join(this.subjectsDir, 'shared')
    ];

    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async createHTMLTemplates(subjectKey, subject) {
    // Create shared template page
    const sharedTemplate = this.generateSharedTemplate(subjectKey, subject);
    const sharedPath = path.join(this.subjectsDir, 'shared', `${subjectKey}.html`);
    await fs.writeFile(sharedPath, sharedTemplate);

    // Create individual subject page
    const subjectTemplate = this.generateSubjectPage(subjectKey, subject);
    const subjectPath = path.join(this.subjectsDir, subjectKey, `${subjectKey}.html`);
    await fs.writeFile(subjectPath, subjectTemplate);
  }

  generateSharedTemplate(subjectKey, subject) {
    const features = subject.features.map((feature, index) => {
      return `
                {
                    title: '${feature}',
                    content: '<p>Interactive ${feature.toLowerCase()} activities and games!</p>',
                    linkUrl: '#${feature.toLowerCase().replace(/\s+/g, '-')}',
                    linkText: 'Explore Now',
                    theme: 'default'
                }${index < subject.features.length - 1 ? ',' : ''}`;
    }).join('');

    return `<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="${subject.description}" />
        <title>${subject.name} with ${subject.character.name} - Learnimals</title>
        <script type="module">
            import SubjectTemplateLoader from '../src/utils/subjectTemplateLoader.js';
            
            // Define content for ${subjectKey} page
            const ${subjectKey}Options = {
                subjectName: '${subject.name}',
                subjectLower: '${subjectKey}',
                subjectDescription: '${subject.description}',
                characterName: '${subject.character.name}',
                characterType: '${subject.character.type}',
                heroSubtitle: '${subject.description}',
                
                // Feature cards data for Card.js
                featureCardsData: [${features}
                ]
            };
            
            document.addEventListener('DOMContentLoaded', async () => {
                await SubjectTemplateLoader.renderTemplate(${subjectKey}Options);
            });
        </script>
        
        <!-- CSS -->
        <link rel="stylesheet" href="/src/styles/base/styles.css" />
        <link rel="stylesheet" href="/src/styles/components/navbar.css" />
        <link rel="stylesheet" href="/src/styles/components/components.css" />
        <link rel="stylesheet" href="/src/styles/components/themeSwitcher.css" />
        <link rel="stylesheet" href="/src/features/subjects/${subjectKey}/${subjectKey}.css" />
    </head>
    <body>
        <p>Loading ${subject.name} content...</p>
        
        <!-- JS -->
        <script defer type="module" src="/src/themeInitializer.js"></script>
        <script type="module" src="/src/utils/themeManager.js"></script>
        <script type="module" src="/src/components/layout/themeSwitcher.js"></script>
        <script defer src="/src/components/layout/navbarLoader.js"></script>
        <script defer src="/src/components/component-loader.js"></script>
        <script defer src="/src/features/subjects/${subjectKey}/${subjectKey}.js"></script>
    </body>
</html>`;
  }

  generateSubjectPage(subjectKey, subject) {
    const featureCards = subject.features.map(feature => `
                <div class="feature-card">
                    <h3>${feature}</h3>
                    <p>Interactive ${feature.toLowerCase()} activities!</p>
                    <button onclick="alert('${feature} coming soon!')">Explore</button>
                </div>`).join('');

    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${subject.description}">
    <title>${subject.name} - Learnimals</title>
    
    <!-- CSS -->
    <link rel="stylesheet" href="/src/styles/base/styles.css">
    <link rel="stylesheet" href="/src/styles/components/navbar.css">
    <link rel="stylesheet" href="/src/styles/components/components.css">
    <link rel="stylesheet" href="/src/styles/components/themeSwitcher.css">
    <link rel="stylesheet" href="/src/features/subjects/${subjectKey}/${subjectKey}.css">
</head>
<body>
    <!-- Navbar -->
    <div id="navbar-placeholder"></div>

    <main>
        <section class="hero">
            <h1>${subject.name} with ${subject.character.name} the ${subject.character.type}</h1>
            <p>${subject.description}</p>
            <div class="hero-image">
                <img src="/public/images/${subjectKey}-${subject.character.type.toLowerCase()}.svg" 
                     alt="${subject.character.name} the ${subject.character.type}" />
            </div>
        </section>

        <section class="features">
            <h2>Learning Activities</h2>
            <div class="features-grid">${featureCards}
            </div>
        </section>
    </main>

    <footer>
        <p>&copy; 2025 Learnimals. All rights reserved.</p>
        <div class="footer-links">
            <a href="/src/pages/about.html">About Us</a>
            <a href="/src/pages/contact.html">Contact</a>
            <a href="#">Privacy Policy</a>
            <a href="/src/pages/profile.html">My Profile</a>
        </div>
    </footer>

    <!-- JS -->
    <script defer type="module" src="/src/themeInitializer.js"></script>
    <script type="module" src="/src/utils/themeManager.js"></script>
    <script type="module" src="/src/components/layout/themeSwitcher.js"></script>
    <script defer src="/src/components/layout/navbarLoader.js"></script>
    <script defer src="/src/components/component-loader.js"></script>
    <script defer src="/src/features/subjects/${subjectKey}/${subjectKey}.js"></script>
</body>
</html>`;
  }

  async createCSSFiles(subjectKey, subject) {
    const cssContent = `/* ${subject.name} Subject Styles */

/* Hero section specific to ${subjectKey} */
.hero {
    background: linear-gradient(135deg, ${subject.color}20, ${subject.color}10);
    border-bottom: 3px solid ${subject.color};
}

.hero h1 {
    color: var(--text-heading);
}

.hero-image img {
    max-width: 200px;
    height: auto;
    border-radius: 50%;
    border: 4px solid ${subject.color};
    box-shadow: 0 4px 12px ${subject.color}40;
}

/* Feature cards for ${subjectKey} */
.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
    margin-top: 30px;
}

.feature-card {
    background-color: var(--bg-card);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    border: 2px solid transparent;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px var(--shadow-color);
}

.feature-card:hover {
    border-color: ${subject.color};
    transform: translateY(-5px);
    box-shadow: 0 4px 16px ${subject.color}30;
}

.feature-card h3 {
    color: var(--text-heading);
    margin-bottom: 10px;
    font-size: 1.2rem;
}

.feature-card p {
    color: var(--text-primary);
    margin-bottom: 15px;
    line-height: 1.5;
}

.feature-card button {
    background-color: ${subject.color};
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.3s ease;
}

.feature-card button:hover {
    background-color: ${subject.color}dd;
    transform: scale(1.05);
}

/* Subject-specific color variables */
:root {
    --${subjectKey}-primary: ${subject.color};
    --${subjectKey}-secondary: ${subject.color}80;
    --${subjectKey}-light: ${subject.color}20;
}

/* Responsive design */
@media (max-width: 768px) {
    .features-grid {
        grid-template-columns: 1fr;
        gap: 15px;
    }
    
    .hero-image img {
        max-width: 150px;
    }
    
    .feature-card {
        padding: 15px;
    }
}

/* Loading states */
.loading-placeholder {
    text-align: center;
    padding: 40px;
    color: var(--text-secondary);
    font-style: italic;
}

/* Accessibility enhancements */
.feature-card:focus-within {
    outline: 2px solid ${subject.color};
    outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
    .feature-card {
        transition: none;
    }
    
    .feature-card:hover {
        transform: none;
    }
}`;

    const cssPath = path.join(this.subjectsDir, subjectKey, `${subjectKey}.css`);
    await fs.writeFile(cssPath, cssContent);
  }

  async createJavaScriptFiles(subjectKey, subject) {
    const jsContent = `/**
 * ${subject.name} Subject JavaScript
 * Interactive features for ${subject.character.name} the ${subject.character.type}
 */
import Modal from '../../../components/ui/Modal.js';
import { escapeHTML } from '../../../utils/common.js';

class ${subject.name.replace(/\s+/g, '')}Subject {
    constructor() {
        this.subjectName = '${subject.name}';
        this.character = {
            name: '${subject.character.name}',
            type: '${subject.character.type}',
            role: '${subject.character.role}'
        };
        this.features = ${JSON.stringify(subject.features, null, 8)};
        
        this.init();
    }

    init() {
        console.log(\`🎓 Initializing \${this.subjectName} with \${this.character.name} the \${this.character.type}\`);
        
        // Set up event listeners when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        // Add interactive features here
        this.setupFeatureCards();
        this.setupCharacterInteraction();
        this.setupThemeIntegration();
    }

    setupFeatureCards() {
        const featureCards = document.querySelectorAll('.feature-card');
        
        featureCards.forEach((card, index) => {
            const feature = this.features[index];
            if (feature) {
                card.addEventListener('click', () => this.handleFeatureClick(feature));
                card.setAttribute('data-feature', feature.toLowerCase().replace(/\\s+/g, '-'));
            }
        });
    }

    setupCharacterInteraction() {
        const characterImage = document.querySelector('.hero-image img');
        if (characterImage) {
            characterImage.addEventListener('click', () => {
                this.showCharacterMessage();
            });
            
            // Add hover effect
            characterImage.style.cursor = 'pointer';
            characterImage.title = \`Click to interact with \${this.character.name}!\`;
        }
    }

    setupThemeIntegration() {
        // Listen for theme changes and update character accordingly
        document.addEventListener('themeChanged', (event) => {
            this.onThemeChange(event.detail.theme);
        });
    }

    handleFeatureClick(feature) {
        console.log(\`🎯 User clicked on: \${feature}\`);
        
        // Show character encouragement
        this.showCharacterMessage(\`Great choice! Let's explore \${feature} together!\`);
        
        // Here you can add specific functionality for each feature
        switch (feature.toLowerCase()) {
            case '${subject.features[0]?.toLowerCase()}':
                this.startFirstFeature();
                break;
            case '${subject.features[1]?.toLowerCase()}':
                this.startSecondFeature();
                break;
            default:
                this.showComingSoon(feature);
        }
    }

    startFirstFeature() {
        // Implement first feature functionality
        console.log(\`🚀 Starting \${this.features[0]}\`);
        // Add your interactive content here
    }

    startSecondFeature() {
        // Implement second feature functionality
        console.log(\`🚀 Starting \${this.features[1]}\`);
        // Add your interactive content here
    }

    showComingSoon(feature) {
        const message = \`\${feature} is coming soon! \${this.character.name} is working hard to prepare exciting activities for you.\`;
        this.showCharacterMessage(message);
    }

    showCharacterMessage(message = null) {
        const defaultMessages = [
            \`Hi! I'm \${this.character.name} the \${this.character.type}!\`,
            \`Ready to learn some amazing \${this.subjectName.toLowerCase()}?\`,
            \`Let's explore and have fun together!\`,
            \`Click on any activity to get started!\`
        ];
        
        const displayMessage = message || defaultMessages[Math.floor(Math.random() * defaultMessages.length)];
        
        // Create and show message modal or toast
        this.displayMessage(displayMessage);
    }

    displayMessage(message) {
        // Use custom modal component with character theming
        // SECURITY: Escape HTML to prevent XSS attacks
        const modal = new Modal({
            id: '${subjectKey.toLowerCase()}-message-modal',
            title: \`\${escapeHTML(this.character.name)} the \${escapeHTML(this.character.type)}\`,
            content: \`<div class="character-message">
                <div class="character-icon">${subject.character.icon || '🎓'}</div>
                <p>\${escapeHTML(message)}</p>
            </div>\`,
            confirmButtonText: 'Got it!',
            showClose: true,
            size: 'medium',
            onConfirm: () => modal.hide()
        });
        modal.show();
    }

    onThemeChange(theme) {
        console.log(\`🎨 Theme changed to: \${theme}\`);
        // Update character appearance or animations based on theme
        // This can be used to change character expressions, colors, etc.
    }

    // Utility methods for future enhancements
    getProgress() {
        // Return user progress for this subject
        return {
            subject: this.subjectName,
            completedFeatures: [],
            totalFeatures: this.features.length,
            level: 1
        };
    }

    saveProgress(featureCompleted) {
        // Save user progress
        console.log(\`💾 Saving progress: \${featureCompleted}\`);
        // Implement progress saving logic
    }
}

// Initialize the subject when script loads
const ${subjectKey}Subject = new ${subject.name}Subject();

// Export for potential use by other modules
export default ${subject.name}Subject;`;

    const jsPath = path.join(this.subjectsDir, subjectKey, `${subjectKey}.js`);
    await fs.writeFile(jsPath, jsContent);
  }

  async createPlaceholderImage(subjectKey, subject) {
    // Create a simple SVG placeholder image
    const animalEmoji = animalImages[subject.character.type.toLowerCase()] || '🐾';
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${subject.color}40;stop-opacity:1" />
      <stop offset="100%" style="stop-color:${subject.color}80;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="100" cy="100" r="95" fill="url(#gradient)" stroke="${subject.color}" stroke-width="4"/>
  
  <!-- Character emoji -->
  <text x="100" y="120" font-size="80" text-anchor="middle" font-family="Arial, sans-serif">
    ${animalEmoji}
  </text>
  
  <!-- Character name -->
  <text x="100" y="160" font-size="16" text-anchor="middle" font-family="Arial, sans-serif" 
        fill="${subject.color}" font-weight="bold">
    ${subject.character.name}
  </text>
  
  <!-- Subject name -->
  <text x="100" y="180" font-size="12" text-anchor="middle" font-family="Arial, sans-serif" 
        fill="${subject.color}cc">
    ${subject.character.role}
  </text>
</svg>`;

    const imagePath = path.join(this.imagesDir, `${subjectKey}-${subject.character.type.toLowerCase()}.svg`);
    await fs.writeFile(imagePath, svgContent);
    
    console.log(`📸 Created placeholder image: ${subjectKey}-${subject.character.type.toLowerCase()}.svg`);
  }

  async updateMainConfig(createdSubjects) {
    try {
      // Read current config
      const configContent = await fs.readFile(this.configPath, 'utf8');
      
      // Generate new subjects object
      const newSubjects = createdSubjects.map(subjectKey => {
        const subject = subjectTemplates[subjectKey];
        return `    ${subjectKey}: {
      name: '${subject.name}',
      character: {
        name: '${subject.character.name}',
        type: '${subject.character.type}',
        image: '/public/images/${subjectKey}-${subject.character.type.toLowerCase()}.svg',
        role: '${subject.character.role}'
      },
      description: '${subject.description}',
      color: '${subject.color}',
      difficulty: '${subject.difficulty}',
      ageRange: '${subject.ageRange}',
      features: ${JSON.stringify(subject.features)}
    }`;
      }).join(',\n\n');

      // Find subjects section and update it
      const subjectsRegex = /(\/\/ Subject configurations\s+subjects:\s*{)([\s\S]*?)(}\s*,?\s*\n)/;
      const match = configContent.match(subjectsRegex);
      
      if (match) {
        const existingSubjects = match[2].trim();
        const updatedSubjects = existingSubjects 
          ? `${existingSubjects},\n\n${newSubjects}`
          : newSubjects;
          
        const updatedConfig = configContent.replace(
          subjectsRegex,
          `$1\n${updatedSubjects}\n  $3`
        );
        
        await fs.writeFile(this.configPath, updatedConfig);
      } else {
        // If subjects section doesn't exist, add it
        const subjectsSection = `\n  // Subject configurations\n  subjects: {\n${newSubjects}\n  },\n`;
        const insertPoint = configContent.search(/^};?\s*$/m);
        const updatedConfig = configContent.slice(0, insertPoint) + subjectsSection + configContent.slice(insertPoint);
        
        await fs.writeFile(this.configPath, updatedConfig);
      }
    } catch (error) {
      console.error('❌ Error updating config:', error.message);
      throw error;
    }
  }

  async generateBatchFromFile(filePath) {
    try {
      const batchContent = await fs.readFile(filePath, 'utf8');
      const batchData = JSON.parse(batchContent);
      
      if (batchData.subjects && Array.isArray(batchData.subjects)) {
        return await this.generateSubjects(batchData.subjects);
      } else {
        throw new Error('Batch file must contain a "subjects" array');
      }
    } catch (error) {
      console.error('❌ Error reading batch file:', error.message);
      throw error;
    }
  }

  listAvailableTemplates() {
    console.log('\n📋 Available Subject Templates:');
    console.log('================================');
    
    Object.keys(subjectTemplates).forEach(key => {
      const subject = subjectTemplates[key];
      console.log(`\n🎓 ${key.toUpperCase()}`);
      console.log(`   Name: ${subject.name}`);
      console.log(`   Character: ${subject.character.name} the ${subject.character.type}`);
      console.log(`   Role: ${subject.character.role}`);
      console.log(`   Description: ${subject.description}`);
      console.log(`   Features: ${subject.features.join(', ')}`);
      console.log(`   Difficulty: ${subject.difficulty} | Age: ${subject.ageRange}`);
    });
    
    console.log(`\n📊 Total Templates Available: ${Object.keys(subjectTemplates).length}`);
  }
}

// CLI functionality
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    subjects: [],
    batchFile: null,
    listTemplates: false,
    help: false
  };

  for (const arg of args) {
    if (arg.startsWith('--subjects=')) {
      options.subjects = arg.split('=')[1].split(',').map(s => s.trim());
    } else if (arg.startsWith('--batch-file=')) {
      options.batchFile = arg.split('=')[1];
    } else if (arg === '--list-templates' || arg === '-l') {
      options.listTemplates = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
🎓 Learnimals Subject Generator
==============================

Generate new subjects with animal characters programmatically.

Usage:
  node scripts/generateSubjects.js [options]

Options:
  --subjects=music,geography    Generate specific subjects (comma-separated)
  --batch-file=subjects.json    Generate from batch file
  --list-templates, -l          List all available subject templates
  --help, -h                    Show this help message

Examples:
  node scripts/generateSubjects.js --subjects=music,geography
  node scripts/generateSubjects.js --batch-file=my-subjects.json
  node scripts/generateSubjects.js --list-templates

Batch File Format (JSON):
{
  "subjects": ["music", "geography", "history"]
}

Available Templates: music, geography, history, language, physics, cooking, environment
`);
}

// Main execution
async function main() {
  const options = parseArgs();
  const generator = new SubjectGenerator();

  try {
    if (options.help) {
      showHelp();
      return;
    }

    if (options.listTemplates) {
      generator.listAvailableTemplates();
      return;
    }

    let results;
    
    if (options.batchFile) {
      console.log(`📁 Processing batch file: ${options.batchFile}`);
      results = await generator.generateBatchFromFile(options.batchFile);
    } else if (options.subjects.length > 0) {
      console.log(`🎯 Generating subjects: ${options.subjects.join(', ')}`);
      results = await generator.generateSubjects(options.subjects);
    } else {
      // Interactive mode - generate all available templates
      console.log('🎪 Interactive mode: Generating all available subjects...');
      const allSubjects = Object.keys(subjectTemplates);
      results = await generator.generateSubjects(allSubjects);
    }

    // Show results summary
    console.log('\n🎉 Generation Complete!');
    console.log('======================');
    console.log(`✅ Created: ${results.created.length} subjects`);
    console.log(`📝 Updated: ${results.updated.length} configurations`);
    console.log(`❌ Errors: ${results.errors.length} failures`);
    
    if (results.created.length > 0) {
      console.log(`\n🎓 New Subjects Created: ${results.created.join(', ')}`);
    }
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach(error => {
        console.log(`   ${error.subject}: ${error.error}`);
      });
    }

    console.log('\n🚀 Next Steps:');
    console.log('   1. Check the generated files in src/features/subjects/');
    console.log('   2. Review the updated config.js file');
    console.log('   3. Test the new subjects in your browser');
    console.log('   4. Customize the generated templates as needed');
    console.log('   5. The About page will automatically show new animal educators!');

  } catch (error) {
    console.error('\n💥 Fatal Error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { SubjectGenerator, subjectTemplates };