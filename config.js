// Global configuration settings for the Learnimals application
import { mascots } from './data/mascotsContent.js';

const config = {
  // App settings
  appName: 'Learnimals',
  version: '1.0.0',

  // Game settings
  games: {
    bubblePop: {
      defaultSpeed: 1.5,
      maxBubbles: 8,
      canvasWidth: 600,
      canvasHeight: 400,
      messageTimeout: 1000,
    },
    wordScramble: {
      difficulty: 'easy',
      timeLimit: 60,
    },
  },

  // Theme settings
  theme: {
    transitionSpeed: 300, // ms
    defaultTheme: 'day',
  },

  // Subject configurations
  subjects: {
    math: {
      name: 'Math',
      character: mascots.math,
      description: 'Fun math tools and games for children',
    },
    science: {
      name: 'Science',
      character: mascots.science,
      description: 'Exciting science experiments and facts for kids',
    },
    reading: {
      name: 'Reading',
      character: mascots.reading,
      description: 'Improve reading skills with fun stories and games',
    },
    art: {
      name: 'Art',
      character: mascots.art,
      description: 'Creative art activities and drawing fun',
    },
    coding: {
      name: 'Coding',
      character: mascots.coding,
      description: 'Learn programming concepts with interactive lessons',
    },
    music: {
      name: 'Music',
      character: mascots.music,
      description: 'Learn music theory, rhythm, and instruments with fun activities',
      color: '#e74c3c',
      difficulty: 'beginner',
      ageRange: '4-12',
      features: ['Music Theory', 'Virtual Instruments', 'Rhythm Games', 'Song Composition'],
    },
    geography: {
      name: 'Geography',
      character: mascots.geography,
      description: 'Discover countries, capitals, and cultures around the world',
      color: '#27ae60',
      difficulty: 'intermediate',
      ageRange: '6-12',
      features: ['World Map', 'Country Explorer', 'Capital Quiz', 'Culture Corner'],
    },
  },

  // API endpoints (if any)
  api: {
    baseUrl: '/api',
    endpoints: {
      userProgress: '/progress',
      gameScores: '/scores',
    },
  },
};

export default config;
