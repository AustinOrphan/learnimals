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
  
  // Subject configurations
  subjects: {
    math: {
      name: 'Math',
      character: {
        name: 'Mango',
        type: 'Shark',
        image: '/public/images/math-shark.png',
        role: 'Math Expert'
      },
      description: 'Fun math tools and games for children'
    },
    science: {
      name: 'Science',
      character: {
        name: 'Sky',
        type: 'Parrot',
        image: '/public/images/science-parrot.png',
        role: 'Science Specialist'
      },
      description: 'Exciting science experiments and facts for kids'
    },
    reading: {
      name: 'Reading',
      character: {
        name: 'Ruby',
        type: 'Panda',
        image: '/public/images/reading-panda.png',
        role: 'Reading Teacher'
      },
      description: 'Improve reading skills with fun stories and games'
    },
    art: {
      name: 'Art',
      character: {
        name: 'Leo',
        type: 'Lion',
        image: '/public/images/art-lion.png',
        role: 'Art Instructor'
      },
      description: 'Creative art activities and drawing fun'
    },
    coding: {
      name: 'Coding',
      character: {
        name: 'Cody',
        type: 'Cat',
        image: '/public/images/cody-cat.png',
        role: 'Coding Guide'
      },
      description: 'Learn programming concepts with interactive lessons'
    }
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
