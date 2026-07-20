// Story data for Ruby's Story Safari adventure
// A branching interactive story featuring Ruby the Panda on an African safari

export const safariStoryData = {
  metadata: {
    title: "Ruby's Story Safari",
    author: 'Learnimals Educational Team',
    version: '1.0.0',
    targetAge: '6-10 years',
    readingLevel: 'Grade 2-4',
    estimatedPlayTime: '15-30 minutes',
    themes: ['friendship', 'courage', 'discovery', 'nature'],
    description:
      'Join Ruby the Panda on an exciting safari adventure where every choice leads to new discoveries and friendships.',
  },

  startingScene: 'safari_departure',

  scenes: [
    {
      id: 'safari_departure',
      title: 'The Adventure Begins',
      mood: 'excited',
      estimatedReadingTime: 2,
      content: `Ruby the Panda bounced with excitement as she packed her bright yellow backpack. Today was the day she had been dreaming about for months - her very first African safari adventure!
      
      "I can't wait to see all the magnificent animals," Ruby said to herself, carefully placing her binoculars and safari journal in her bag. The sun was just rising over the horizon, painting the sky in beautiful shades of orange and pink.
      
      As Ruby approached the safari jeep, she noticed two other young explorers already waiting. There was Max the Monkey, who was sketching in a notebook, and Luna the Leopard, who was reading a book about African wildlife.`,

      characterSpeech: 'This is going to be the most extraordinary adventure ever!',

      vocabulary: [
        {
          word: 'magnificent',
          definition: 'very beautiful or impressive',
          context: 'magnificent animals',
        },
        {
          word: 'extraordinary',
          definition: 'very unusual or remarkable',
          context: 'extraordinary adventure',
        },
        {
          word: 'horizon',
          definition: 'the line where earth meets sky',
          context: 'over the horizon',
        },
      ],

      choices: [
        {
          text: 'Walk over to Max and ask about his drawings',
          traits: ['curious', 'friendly'],
          nextScene: 'meet_max',
          effects: [{ variable: 'friendship_max', change: 1 }],
          readingLevel: 'easy',
        },
        {
          text: 'Approach Luna and discuss the wildlife book',
          traits: ['thoughtful', 'studious'],
          nextScene: 'meet_luna',
          effects: [{ variable: 'knowledge_bonus', change: 1 }],
          readingLevel: 'medium',
        },
        {
          text: 'Climb into the jeep and wait for the others',
          traits: ['patient', 'independent'],
          nextScene: 'jeep_waiting',
          effects: [{ variable: 'independence', change: 1 }],
          readingLevel: 'easy',
        },
      ],
    },

    {
      id: 'meet_max',
      title: 'Making Friends with Max',
      mood: 'friendly',
      estimatedReadingTime: 2,
      content: `Ruby approached Max the Monkey, who was carefully sketching a picture of a giraffe in his notebook. His drawings were incredibly detailed, showing every spot and the gentle curve of the giraffe's long neck.
      
      "Wow, Max! Your drawings are amazing," Ruby said admiringly. "You are such a talented artist!"
      
      Max looked up with a shy smile. "Thank you, Ruby! I love drawing animals. My dream is to sketch every animal we see on this safari. Would you like to be my safari partner? We could explore together!"
      
      Just then, their safari guide, Captain Kito, called out: "All aboard, young explorers! Our first stop is the watering hole where many animals gather in the morning."`,

      characterSpeech: "I'd love to explore with you, Max! Two explorers are better than one!",

      vocabulary: [
        { word: 'admiringly', definition: 'with respect and approval', context: 'said admiringly' },
        { word: 'talented', definition: 'having natural skill', context: 'talented artist' },
        {
          word: 'incredibly',
          definition: 'extremely or amazingly',
          context: 'incredibly detailed',
        },
      ],

      choices: [
        {
          text: "Accept Max's partnership and sit together in the jeep",
          traits: ['friendly', 'collaborative'],
          nextScene: 'watering_hole_with_max',
          effects: [
            { variable: 'friendship_max', change: 2 },
            { variable: 'team_bonus', change: 1 },
          ],
        },
        {
          text: 'Suggest that Luna should join your exploration team too',
          traits: ['inclusive', 'thoughtful'],
          nextScene: 'trio_formation',
          effects: [
            { variable: 'friendship_max', change: 1 },
            { variable: 'friendship_luna', change: 1 },
          ],
        },
        {
          text: 'Tell Max you prefer to explore on your own today',
          traits: ['independent', 'focused'],
          nextScene: 'solo_exploration',
          effects: [{ variable: 'independence', change: 2 }],
        },
      ],
    },

    {
      id: 'meet_luna',
      title: 'A Conversation with Luna',
      mood: 'thoughtful',
      estimatedReadingTime: 2,
      content: `Ruby walked over to Luna the Leopard, who was completely absorbed in reading "The Complete Guide to African Safari Animals." Luna's eyes sparkled with intelligence as she turned the pages filled with fascinating facts and colorful photographs.
      
      "That looks like an interesting book," Ruby said politely. "Are you learning about the animals we might see today?"
      
      Luna looked up with enthusiasm. "Oh yes! Did you know that elephants can communicate with sounds so deep that humans can't even hear them? And giraffes only need to sleep for 30 minutes to 2 hours each day! I'm trying to memorize all these facts so I can share them during our safari."
      
      Captain Kito interrupted their conversation: "Time to begin our adventure! Everyone into the safari jeep!"`,

      characterSpeech: "Luna, you know so many fascinating facts! I'd love to learn more!",

      vocabulary: [
        {
          word: 'absorbed',
          definition: 'completely focused on something',
          context: 'completely absorbed',
        },
        {
          word: 'intelligence',
          definition: 'the ability to learn and understand',
          context: 'sparkled with intelligence',
        },
        {
          word: 'communicate',
          definition: 'to share information or feelings',
          context: 'elephants can communicate',
        },
        {
          word: 'memorize',
          definition: 'to learn something by heart',
          context: 'trying to memorize',
        },
      ],

      choices: [
        {
          text: 'Ask Luna to teach you more animal facts during the safari',
          traits: ['curious', 'studious'],
          nextScene: 'watering_hole_with_luna',
          effects: [
            { variable: 'friendship_luna', change: 2 },
            { variable: 'knowledge_bonus', change: 2 },
          ],
        },
        {
          text: 'Suggest forming a team with both Luna and Max',
          traits: ['inclusive', 'collaborative'],
          nextScene: 'trio_formation',
          effects: [
            { variable: 'friendship_luna', change: 1 },
            { variable: 'friendship_max', change: 1 },
          ],
        },
        {
          text: 'Politely excuse yourself and board the jeep alone',
          traits: ['polite', 'independent'],
          nextScene: 'jeep_waiting',
          effects: [{ variable: 'independence', change: 1 }],
        },
      ],
    },

    {
      id: 'jeep_waiting',
      title: 'Quiet Moments Before Adventure',
      mood: 'contemplative',
      estimatedReadingTime: 2,
      content: `Ruby climbed into the comfortable safari jeep and chose a seat by the window. She enjoyed these quiet moments before the adventure truly began. The morning air was crisp and fresh, carrying the sounds of birds chirping and the distant rumble of the African wilderness awakening.
      
      As she waited, Ruby pulled out her own safari journal and began writing about her expectations for the day. She drew a simple sketch of a tree and wondered what amazing creatures might be hiding in its branches.
      
      Soon, Max and Luna joined her in the jeep, and Captain Kito started the engine. "Welcome, young explorers, to your African safari adventure! Our first destination is the famous Mwangi Watering Hole, where animals gather every morning to drink and socialize."`,

      characterSpeech: 'I wonder what incredible animals are waiting to meet us today!',

      vocabulary: [
        {
          word: 'contemplative',
          definition: 'thoughtful and reflective',
          context: 'quiet contemplative moment',
        },
        {
          word: 'expectations',
          definition: 'things you think will happen',
          context: 'expectations for the day',
        },
        {
          word: 'destination',
          definition: 'the place you are going to',
          context: 'first destination',
        },
        {
          word: 'socialize',
          definition: 'to spend time with others',
          context: 'drink and socialize',
        },
      ],

      choices: [
        {
          text: 'Share your journal drawings with Max and Luna',
          traits: ['sharing', 'friendly'],
          nextScene: 'trio_formation',
          effects: [
            { variable: 'friendship_max', change: 1 },
            { variable: 'friendship_luna', change: 1 },
          ],
        },
        {
          text: 'Ask Captain Kito questions about the watering hole',
          traits: ['curious', 'respectful'],
          nextScene: 'captain_stories',
          effects: [{ variable: 'wisdom_bonus', change: 2 }],
        },
        {
          text: 'Continue writing quietly in your journal',
          traits: ['focused', 'observant'],
          nextScene: 'watering_hole_observer',
          effects: [{ variable: 'observation_skill', change: 2 }],
        },
      ],
    },

    {
      id: 'watering_hole_with_max',
      title: 'Art at the Watering Hole',
      mood: 'creative',
      estimatedReadingTime: 3,
      content: `The safari jeep came to a gentle stop at the edge of Mwangi Watering Hole. Ruby and Max gasped in amazement at the beautiful scene before them. Elegant zebras with their distinctive black and white stripes stood alongside graceful gazelles. A family of warthogs rolled happily in the mud nearby.
      
      "This is perfect for sketching!" Max exclaimed, immediately pulling out his art supplies. "Ruby, look at how the morning light makes the water sparkle like diamonds!"
      
      Ruby watched as Max began drawing, his pencil moving quickly but carefully across the paper. She noticed how he paid attention to every detail - the curve of a zebra's neck, the delicate legs of the gazelles, even the playful splashing of the warthogs.
      
      Suddenly, a magnificent elephant emerged from behind the acacia trees, moving slowly and majestically toward the water.`,

      characterSpeech: 'Max, your artwork captures the magic of this place perfectly!',

      vocabulary: [
        {
          word: 'distinctive',
          definition: 'easily recognizable as different',
          context: 'distinctive black and white stripes',
        },
        {
          word: 'graceful',
          definition: 'moving in a smooth, elegant way',
          context: 'graceful gazelles',
        },
        {
          word: 'emerged',
          definition: 'came out from a hidden place',
          context: 'emerged from behind',
        },
        {
          word: 'majestically',
          definition: 'in a grand and impressive way',
          context: 'moving majestically',
        },
      ],

      choices: [
        {
          text: 'Help Max by pointing out interesting details to draw',
          traits: ['helpful', 'observant'],
          nextScene: 'elephant_encounter_artistic',
          effects: [
            { variable: 'friendship_max', change: 2 },
            { variable: 'art_skill', change: 1 },
          ],
        },
        {
          text: "Quietly observe the elephant's behavior for your journal",
          traits: ['patient', 'studious'],
          nextScene: 'elephant_study',
          effects: [
            { variable: 'observation_skill', change: 2 },
            { variable: 'knowledge_bonus', change: 1 },
          ],
        },
        {
          text: 'Ask Captain Kito if you can get closer to the animals',
          traits: ['brave', 'adventurous'],
          nextScene: 'closer_approach',
          effects: [{ variable: 'courage', change: 2 }],
        },
      ],
    },

    {
      id: 'watering_hole_with_luna',
      title: 'Learning at the Watering Hole',
      mood: 'educational',
      estimatedReadingTime: 3,
      content: `As their jeep arrived at the watering hole, Luna immediately began sharing her knowledge with Ruby. "Look, Ruby! Those are Grant's gazelles - you can tell by their white rumps and the black stripe along their sides. And see those birds on the zebras' backs? Those are oxpeckers, and they help the zebras by eating ticks and other parasites!"
      
      Ruby was fascinated by Luna's explanations. Everything seemed more interesting when she understood the relationships between the different animals. She watched a small bird hop fearlessly on a large buffalo's head, pecking at insects.
      
      "That's called a symbiotic relationship," Luna explained proudly. "Both animals help each other - the bird gets food, and the buffalo gets cleaned!"
      
      Just then, a tremendous trumpeting sound echoed across the watering hole as a large elephant family approached the water.`,

      characterSpeech: 'Luna, you make everything so much more fascinating to understand!',

      vocabulary: [
        {
          word: 'parasites',
          definition: 'small creatures that live on other animals',
          context: 'eating ticks and other parasites',
        },
        { word: 'fascinated', definition: 'extremely interested', context: 'Ruby was fascinated' },
        {
          word: 'relationships',
          definition: 'connections between things',
          context: 'relationships between animals',
        },
        {
          word: 'symbiotic',
          definition: 'living together and helping each other',
          context: 'symbiotic relationship',
        },
        {
          word: 'tremendous',
          definition: 'very loud or powerful',
          context: 'tremendous trumpeting sound',
        },
      ],

      choices: [
        {
          text: 'Ask Luna to explain more about elephant families',
          traits: ['curious', 'studious'],
          nextScene: 'elephant_family_lesson',
          effects: [
            { variable: 'friendship_luna', change: 2 },
            { variable: 'knowledge_bonus', change: 2 },
          ],
        },
        {
          text: 'Try to identify other animal relationships yourself',
          traits: ['independent', 'analytical'],
          nextScene: 'pattern_recognition',
          effects: [
            { variable: 'observation_skill', change: 2 },
            { variable: 'confidence', change: 1 },
          ],
        },
        {
          text: 'Suggest moving closer to observe the elephant family',
          traits: ['brave', 'adventurous'],
          nextScene: 'elephant_approach_educational',
          effects: [
            { variable: 'courage', change: 1 },
            { variable: 'friendship_luna', change: 1 },
          ],
        },
      ],
    },

    {
      id: 'trio_formation',
      title: 'Three Friends Unite',
      mood: 'collaborative',
      estimatedReadingTime: 3,
      content: `Ruby looked at her two new friends and had a wonderful idea. "Max, Luna, what if we all work together on this safari? Max could draw what we see, Luna could teach us about the animals, and I could write about our discoveries in my journal!"
      
      Max's eyes lit up with excitement. "That's a brilliant plan! Luna could tell me interesting facts to include with my drawings!"
      
      Luna nodded enthusiastically. "And Ruby could help us remember everything by writing detailed observations! We'd make an incredible exploration team!"
      
      Captain Kito smiled as he listened to their conversation. "Teamwork is one of the most important skills for any explorer," he said approvingly. "Now, let's see what you three can discover together at the watering hole."
      
      As they arrived, the friends immediately saw a breathtaking scene: a parade of elephants was slowly making their way to the water, led by the oldest and largest female.`,

      characterSpeech: 'Together, we can learn so much more than any of us could alone!',

      vocabulary: [
        { word: 'brilliant', definition: 'extremely good or clever', context: 'brilliant plan' },
        {
          word: 'enthusiastically',
          definition: 'with great excitement and energy',
          context: 'nodded enthusiastically',
        },
        {
          word: 'incredible',
          definition: 'amazing or hard to believe',
          context: 'incredible exploration team',
        },
        {
          word: 'approvingly',
          definition: 'showing you agree or are pleased',
          context: 'said approvingly',
        },
        {
          word: 'breathtaking',
          definition: 'so beautiful it takes your breath away',
          context: 'breathtaking scene',
        },
      ],

      choices: [
        {
          text: 'Divide tasks: Max draws, Luna explains, Ruby writes',
          traits: ['organized', 'collaborative'],
          nextScene: 'elephant_team_study',
          effects: [
            { variable: 'friendship_max', change: 1 },
            { variable: 'friendship_luna', change: 1 },
            { variable: 'team_bonus', change: 3 },
          ],
        },
        {
          text: 'All focus together on the elephant matriarch',
          traits: ['focused', 'unified'],
          nextScene: 'matriarch_focus',
          effects: [
            { variable: 'observation_skill', change: 3 },
            { variable: 'team_bonus', change: 2 },
          ],
        },
        {
          text: 'Ask Captain Kito to teach all three of you together',
          traits: ['respectful', 'eager-to-learn'],
          nextScene: 'captain_group_lesson',
          effects: [
            { variable: 'wisdom_bonus', change: 3 },
            { variable: 'respect', change: 2 },
          ],
        },
      ],
    },

    {
      id: 'elephant_encounter_artistic',
      title: "The Artist's Eye",
      mood: 'inspired',
      estimatedReadingTime: 3,
      content: `Ruby and Max worked together like a perfect team. While Max sketched the magnificent elephant, Ruby pointed out details that made his artwork even more special.
      
      "Look, Max! See how the elephant's ears are so much larger than African elephants we saw in books? And notice the wrinkles in her skin - they're like a map of all her adventures!"
      
      Max nodded, adding careful shading to capture the elephant's wise expression. "You are right, Ruby! And look at her trunk - it is so flexible, like she is using it as both a hand and a nose!"
      
      The elephant seemed to notice their attention and slowly turned toward them. For a magical moment, the ancient creature and the young artists looked at each other across the distance. The elephant flapped her ears gently, almost as if she was posing for Max's drawing.
      
      "She knows we're here," Ruby whispered in wonder. "I think she likes being drawn!"`,

      characterSpeech: 'Art helps us see the world in such a beautiful way!',

      vocabulary: [
        {
          word: 'magnificent',
          definition: 'extremely beautiful or impressive',
          context: 'magnificent elephant',
        },
        {
          word: 'flexible',
          definition: 'able to bend and move easily',
          context: 'trunk is so flexible',
        },
        { word: 'ancient', definition: 'very old', context: 'ancient creature' },
        {
          word: 'expression',
          definition: "the look on someone's face",
          context: 'wise expression',
        },
      ],

      choices: [
        {
          text: 'Continue drawing and observing respectfully from distance',
          traits: ['respectful', 'patient'],
          nextScene: 'respectful_observation',
          effects: [
            { variable: 'respect', change: 2 },
            { variable: 'art_skill', change: 2 },
          ],
        },
        {
          text: 'Try to communicate with the elephant through gestures',
          traits: ['brave', 'creative'],
          nextScene: 'elephant_communication',
          effects: [
            { variable: 'courage', change: 2 },
            { variable: 'empathy', change: 1 },
          ],
        },
        {
          text: 'Share this moment with Luna so she can add facts',
          traits: ['inclusive', 'collaborative'],
          nextScene: 'collaborative_learning',
          effects: [
            { variable: 'friendship_luna', change: 1 },
            { variable: 'team_bonus', change: 2 },
          ],
        },
      ],
    },
  ],

  // Story completion conditions
  endings: [
    {
      id: 'courage_explorer',
      title: 'The Brave Explorer',
      condition: 'courage >= 5',
      description:
        'Ruby discovered her inner courage and became known as the bravest young explorer!',
      achievement: 'Courage Badge',
    },
    {
      id: 'wise_naturalist',
      title: 'The Young Naturalist',
      condition: 'knowledge_bonus >= 8',
      description: "Ruby's thirst for knowledge made her an expert on African wildlife!",
      achievement: 'Wisdom Badge',
    },
    {
      id: 'friendship_ambassador',
      title: 'The Friendship Ambassador',
      condition: 'friendship_max >= 3 && friendship_luna >= 3',
      description: "Ruby's kindness brought everyone together in lasting friendships!",
      achievement: 'Friendship Badge',
    },
    {
      id: 'team_leader',
      title: 'The Team Leader',
      condition: 'team_bonus >= 5',
      description: 'Ruby learned that the best adventures happen when friends work together!',
      achievement: 'Leadership Badge',
    },
  ],

  // Vocabulary words by reading level
  vocabularyLevels: {
    'grade-1': ['big', 'happy', 'look', 'friend', 'help'],
    'grade-2': ['adventure', 'animal', 'forest', 'water', 'family'],
    'grade-3': ['magnificent', 'cautiously', 'discover', 'investigate', 'journey'],
    'grade-4': ['extraordinary', 'tremendous', 'fascinated', 'collaborative', 'breathtaking'],
    'grade-5': ['symbiotic', 'majestically', 'contemplative', 'enthusiastically', 'incredible'],
  },

  // Reading comprehension challenge templates
  challengeTemplates: {
    'context-clues': {
      template: "Based on the context, what does '{word}' mean?",
      types: ['vocabulary', 'inference'],
    },
    'character-motivation': {
      template: 'Why did {character} make this choice?',
      types: ['character-analysis', 'cause-effect'],
    },
    'plot-prediction': {
      template: 'What do you think will happen next?',
      types: ['prediction', 'story-structure'],
    },
    vocabulary: {
      template: "What clues in the story help you understand what '{word}' means?",
      types: ['context-clues', 'vocabulary'],
    },
  },
};
