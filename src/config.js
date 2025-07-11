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
        species: 'shark',
        image: '/public/images/math-shark.png',
        role: 'Math Expert',
        personality: {
          traits: {
            enthusiasm: 75,
            patience: 85,
            curiosity: 70,
            playfulness: 60,
            confidence: 80,
            empathy: 70
          },
          learningStyle: 'analytical',
          teachingApproach: 'step-by-step',
          favoriteActivities: ['problem-solving', 'pattern-recognition', 'calculation-games'],
          catchphrase: 'Let\'s dive into numbers!',
          voiceStyle: 'confident'
        },
        colors: {
          primary: '#4a90e2',
          secondary: '#2171b5',
          accent: '#08519c'
        }
      },
      description: 'Fun math tools and games for children'
    },
    science: {
      name: 'Science',
      character: {
        name: 'Sky',
        type: 'Parrot',
        species: 'parrot',
        image: '/public/images/science-parrot.png',
        role: 'Science Specialist',
        personality: {
          traits: {
            enthusiasm: 95,
            patience: 70,
            curiosity: 100,
            playfulness: 85,
            confidence: 80,
            empathy: 75
          },
          learningStyle: 'experimental',
          teachingApproach: 'hands-on',
          favoriteActivities: ['experiments', 'discovery', 'exploration'],
          catchphrase: 'Let\'s explore and discover!',
          voiceStyle: 'excited'
        },
        colors: {
          primary: '#7ed321',
          secondary: '#5cb85c',
          accent: '#449d44'
        }
      },
      description: 'Exciting science experiments and facts for kids'
    },
    reading: {
      name: 'Reading',
      character: {
        name: 'Ruby',
        type: 'Panda',
        species: 'panda',
        image: '/public/images/reading-panda.png',
        role: 'Reading Teacher',
        personality: {
          traits: {
            enthusiasm: 70,
            patience: 95,
            curiosity: 80,
            playfulness: 65,
            confidence: 75,
            empathy: 100
          },
          learningStyle: 'visual',
          teachingApproach: 'nurturing',
          favoriteActivities: ['storytelling', 'word-games', 'comprehension'],
          catchphrase: 'Every book is an adventure!',
          voiceStyle: 'gentle'
        },
        colors: {
          primary: '#333333',
          secondary: '#ffffff',
          accent: '#f5a623'
        }
      },
      description: 'Improve reading skills with fun stories and games'
    },
    art: {
      name: 'Art',
      character: {
        name: 'Leo',
        type: 'Lion',
        species: 'lion',
        image: '/public/images/art-lion.png',
        role: 'Art Instructor',
        personality: {
          traits: {
            enthusiasm: 90,
            patience: 80,
            curiosity: 85,
            playfulness: 95,
            confidence: 90,
            empathy: 85
          },
          learningStyle: 'creative',
          teachingApproach: 'inspiring',
          favoriteActivities: ['drawing', 'coloring', 'creative-expression'],
          catchphrase: 'Let your creativity roar!',
          voiceStyle: 'encouraging'
        },
        colors: {
          primary: '#f5a623',
          secondary: '#f39c12',
          accent: '#e67e22'
        }
      },
      description: 'Creative art activities and drawing fun'
    },
    coding: {
      name: 'Coding',
      character: {
        name: 'Cody',
        type: 'Cat',
        species: 'cat',
        image: '/public/images/cody-cat.png',
        role: 'Coding Guide',
        personality: {
          traits: {
            enthusiasm: 80,
            patience: 90,
            curiosity: 85,
            playfulness: 75,
            confidence: 85,
            empathy: 80
          },
          learningStyle: 'logical',
          teachingApproach: 'methodical',
          favoriteActivities: ['problem-solving', 'debugging', 'creating'],
          catchphrase: 'Code is like a puzzle - let\'s solve it together!',
          voiceStyle: 'thoughtful'
        },
        colors: {
          primary: '#9b59b6',
          secondary: '#8e44ad',
          accent: '#7d3c98'
        }
      },
      description: 'Learn programming concepts with interactive lessons'
    },
    music: {
      name: 'Music',
      character: {
        name: 'Melody',
        type: 'Songbird',
        species: 'songbird',
        image: '/public/images/music-songbird.svg',
        role: 'Music Teacher',
        personality: {
          traits: {
            enthusiasm: 100,
            patience: 75,
            curiosity: 85,
            playfulness: 90,
            confidence: 85,
            empathy: 90
          },
          learningStyle: 'auditory',
          teachingApproach: 'rhythmic',
          favoriteActivities: ['singing', 'rhythm-games', 'composition'],
          catchphrase: 'Music makes everything better!',
          voiceStyle: 'melodic'
        },
        colors: {
          primary: '#e74c3c',
          secondary: '#c0392b',
          accent: '#a93226'
        }
      },
      description: 'Learn music theory, rhythm, and instruments with fun activities',
      color: '#e74c3c',
      difficulty: 'beginner',
      ageRange: '4-12',
      features: ['Music Theory','Virtual Instruments','Rhythm Games','Song Composition']
    },
    geography: {
      name: 'Geography',
      character: {
        name: 'Atlas',
        type: 'Eagle',
        species: 'eagle',
        image: '/public/images/geography-eagle.svg',
        role: 'Geography Guide',
        personality: {
          traits: {
            enthusiasm: 80,
            patience: 85,
            curiosity: 95,
            playfulness: 70,
            confidence: 90,
            empathy: 80
          },
          learningStyle: 'visual',
          teachingApproach: 'explorative',
          favoriteActivities: ['map-exploration', 'cultural-discovery', 'travel-stories'],
          catchphrase: 'The world is your classroom!',
          voiceStyle: 'wise'
        },
        colors: {
          primary: '#27ae60',
          secondary: '#229954',
          accent: '#1e8449'
        }
      },
      description: 'Discover countries, capitals, and cultures around the world',
      color: '#27ae60',
      difficulty: 'intermediate',
      ageRange: '6-12',
      features: ['World Map','Country Explorer','Capital Quiz','Culture Corner']
    }
  },
  
  // API endpoints (if any)
  api: {
    baseUrl: '/api',
    endpoints: {
      userProgress: '/progress',
      gameScores: '/scores'
    }
  },
};

export default config;
