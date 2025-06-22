/**
 * Utility functions for dynamically generating animal educator content
 */
import config from '../config.js';

/**
 * Generate HTML for all animal educators from config
 * @returns {string} HTML string for team grid
 */
export function generateEducatorsHTML() {
  const subjects = config.subjects;
  
  return Object.keys(subjects).map(subjectKey => {
    const subject = subjects[subjectKey];
    const character = subject.character;
    
    return `
      <div class="team-member">
        <img
          src="${character.image}"
          alt="${character.name} the ${character.type}"
        />
        <h4>${character.name} the ${character.type}</h4>
        <p>${character.role}</p>
      </div>
    `;
  }).join('');
}

/**
 * Generate educator data for Card.js component
 * @returns {Array} Array of educator card data
 */
export function generateEducatorsCardData() {
  const subjects = config.subjects;
  
  return Object.keys(subjects).map(subjectKey => {
    const subject = subjects[subjectKey];
    const character = subject.character;
    
    return {
      title: `${character.name} the ${character.type}`,
      content: `<p>${character.role}</p>`,
      imageUrl: character.image,
      imageAlt: `${character.name} the ${character.type}`,
      theme: 'educator'
    };
  });
}

/**
 * Load educators into a container element
 * @param {string} containerId - ID of the container element
 * @param {boolean} useCards - Whether to use Card.js components
 */
export function loadEducators(containerId = 'team-grid', useCards = false) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container with ID "${containerId}" not found`);
    return;
  }
  
  if (useCards && typeof Card !== 'undefined') {
    // Use Card.js components
    const educatorData = generateEducatorsCardData();
    educatorData.forEach(data => {
      const card = new Card(data);
      card.render(container);
    });
  } else {
    // Use simple HTML
    container.innerHTML = generateEducatorsHTML();
  }
}

/**
 * Get subject list for dynamic content generation
 * @returns {Array} Array of subject objects
 */
export function getSubjects() {
  return Object.keys(config.subjects).map(key => ({
    key,
    ...config.subjects[key]
  }));
}

/**
 * Get a specific subject by key
 * @param {string} subjectKey - The subject key
 * @returns {Object|null} Subject object or null if not found
 */
export function getSubject(subjectKey) {
  return config.subjects[subjectKey] || null;
}

export default {
  generateEducatorsHTML,
  generateEducatorsCardData,
  loadEducators,
  getSubjects,
  getSubject
};