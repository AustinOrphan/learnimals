// Global configuration settings for the Learnimals application
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
      messageTimeout: 1000
    },
    wordScramble: {
      difficulty: 'easy',
      timeLimit: 60
    }
  },
  
  // Theme settings
  theme: {
    transitionSpeed: 300, // ms
    defaultTheme: 'day'
  },
  
  // API endpoints (if any)
  api: {
    baseUrl: '/api',
    endpoints: {
      userProgress: '/progress',
      gameScores: '/scores'
    }
  }

  // Subject configurations
  subjects: {
    music: {
      name: 'Music',
      character: {
        name: 'Melody',
        type: 'Songbird',
        image: '/public/images/music-songbird.svg',
        role: 'Music Teacher'
      },
      description: 'Learn music theory, rhythm, and instruments with fun activities',
      color: '#9b59b6',
      difficulty: 'beginner',
      ageRange: '4-12',
      features: ["Music Theory","Virtual Instruments","Rhythm Games","Song Composition"]
    },

    geography: {
      name: 'Geography',
      character: {
        name: 'Atlas',
        type: 'Eagle',
        image: '/public/images/geography-eagle.svg',
        role: 'Geography Guide'
      },
      description: 'Discover countries, capitals, and cultures around the world',
      color: '#27ae60',
      difficulty: 'intermediate',
      ageRange: '6-12',
      features: ["World Map","Country Explorer","Capital Quiz","Culture Corner"]
    }
  },
};

export default config;
