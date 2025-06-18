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
};

export default config;
