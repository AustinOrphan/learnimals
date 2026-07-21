// Learning content for the Animals subject: kid-friendly, verified facts plus
// a short quiz for each mascot animal. Identity (name, image, colors, greeting)
// is resolved from data/mascotsContent.js by `subject`, so nothing is duplicated.
// This is a children's app — every fact and answer here is accurate and safe.

export const animalsContent = [
  {
    subject: 'math',
    species: 'shark',
    facts: [
      'Sharks have been swimming in the ocean since before there were trees!',
      'Some sharks grow a brand-new tooth in just a day, and can go through thousands in a lifetime.',
      'A shark can smell a single drop of blood mixed into a huge amount of water.',
      'Sharks are fish, but unlike most fish their skeleton is made of bendy cartilage — the same stuff as your ears and nose.',
    ],
    reaction: { emoji: '🦈', animation: 'wiggle' },
    quiz: [
      {
        question: 'What do most sharks like to eat?',
        options: ['Fish', 'Leaves', 'Rocks'],
        answer: 'Fish',
      },
      {
        question: 'Sharks have lived on Earth longer than which of these?',
        options: ['Trees', 'Cars', 'Phones'],
        answer: 'Trees',
      },
      {
        question: 'How does a shark find food far away?',
        options: ['By smelling', 'By reading', 'By texting'],
        answer: 'By smelling',
      },
    ],
  },
  {
    subject: 'science',
    species: 'parrot',
    facts: [
      'Parrots can copy sounds they hear — some even learn to say words like people do!',
      'Parrots hold their food up to their mouths with their feet, almost like using hands.',
      'Some big parrots can live to be 60 years old or even older.',
      'Parrots are very clever birds and can solve puzzles to reach a treat.',
    ],
    reaction: { emoji: '🦜', animation: 'bob' },
    quiz: [
      {
        question: 'What can many parrots do that most birds cannot?',
        options: ['Copy sounds and words', 'Breathe underwater', 'Turn invisible'],
        answer: 'Copy sounds and words',
      },
      {
        question: 'What does a parrot use to hold its food?',
        options: ['Its feet', 'Its tail', 'Its wings'],
        answer: 'Its feet',
      },
      { question: 'A parrot is a kind of…', options: ['Bird', 'Fish', 'Bug'], answer: 'Bird' },
    ],
  },
  {
    subject: 'reading',
    species: 'panda',
    facts: [
      'Giant pandas spend most of the day eating bamboo — sometimes more than 12 hours!',
      'A newborn panda is tiny — about the size of a stick of butter — and pink instead of black-and-white.',
      'Pandas have a special wrist bone that works like a thumb to help them grip bamboo.',
      'Giant pandas are great tree climbers, even though they look big and heavy.',
    ],
    reaction: { emoji: '🐼', animation: 'wiggle' },
    quiz: [
      {
        question: 'What do giant pandas eat most of the time?',
        options: ['Bamboo', 'Ice cream', 'Sand'],
        answer: 'Bamboo',
      },
      {
        question: 'How big is a baby panda when it is born?',
        options: ['Very tiny', 'As big as a car', 'As big as a house'],
        answer: 'Very tiny',
      },
      {
        question: 'What are pandas surprisingly good at?',
        options: ['Climbing trees', 'Flying', 'Swimming across oceans'],
        answer: 'Climbing trees',
      },
    ],
  },
  {
    subject: 'art',
    species: 'lion',
    facts: [
      "A lion's roar is so loud it can be heard from about 5 miles (8 kilometers) away.",
      'Lions live together in family groups called prides.',
      'In a pride, the female lions (lionesses) do most of the hunting.',
      'Lions rest and sleep for a big part of the day — sometimes up to 20 hours!',
    ],
    reaction: { emoji: '🦁', animation: 'bob' },
    quiz: [
      {
        question: 'What is a group of lions called?',
        options: ['A pride', 'A flock', 'A school'],
        answer: 'A pride',
      },
      {
        question: 'What do lions do for much of the day?',
        options: ['Rest and sleep', 'Build nests', 'Go to school'],
        answer: 'Rest and sleep',
      },
      {
        question: 'What can you hear from far away when a lion makes it?',
        options: ['Its roar', 'Its whisper', 'Its song'],
        answer: 'Its roar',
      },
    ],
  },
  {
    subject: 'coding',
    species: 'cat',
    facts: [
      'Cats sleep a lot — about two-thirds of their whole lives!',
      "A cat's whiskers help it feel whether it can fit through a narrow space.",
      'Cats cannot taste sweet things the way people can.',
      'Cats can make many different sounds, including meows, purrs, and chirps.',
    ],
    reaction: { emoji: '🐱', animation: 'wiggle' },
    quiz: [
      {
        question: 'What do cats do for most of their lives?',
        options: ['Sleep', 'Read books', 'Drive cars'],
        answer: 'Sleep',
      },
      {
        question: "What do a cat's whiskers help it do?",
        options: ['Feel spaces around it', 'See in color', 'Fly'],
        answer: 'Feel spaces around it',
      },
      {
        question: 'Which sound does a cat make?',
        options: ['Meow', 'Moo', 'Quack'],
        answer: 'Meow',
      },
    ],
  },
  {
    subject: 'music',
    species: 'songbird',
    facts: [
      'Baby songbirds learn their songs by listening to grown-up birds — a lot like how you learned to talk.',
      'Many birds sing the most at sunrise, in what people call the "dawn chorus."',
      'Each kind of songbird has its own special tune, so birds can tell each other apart.',
      'Some songbirds can even sing two notes at the very same time!',
    ],
    reaction: { emoji: '🐦', animation: 'bob' },
    quiz: [
      {
        question: 'How do young songbirds learn their songs?',
        options: ['By listening', 'By reading music', 'By magic'],
        answer: 'By listening',
      },
      {
        question: 'When do many birds sing the most?',
        options: ['At sunrise', 'At midnight', 'Never'],
        answer: 'At sunrise',
      },
      {
        question: 'How does a songbird make music?',
        options: ['By singing', 'By clapping', 'By stomping'],
        answer: 'By singing',
      },
    ],
  },
  {
    subject: 'geography',
    species: 'eagle',
    facts: [
      'Eagles have amazing eyesight — they can see much more sharply than people can.',
      'Eagles can soar high in the sky for a long time by riding on warm rising air.',
      'Bald eagles build some of the biggest nests of any bird, adding to them year after year.',
      'An eagle has a very strong grip in its feet, called talons, for holding on tight.',
    ],
    reaction: { emoji: '🦅', animation: 'bob' },
    quiz: [
      {
        question: 'What are eagles famous for?',
        options: ['Amazing eyesight', 'Glowing in the dark', 'Talking'],
        answer: 'Amazing eyesight',
      },
      {
        question: 'How do eagles stay up in the sky for a long time?',
        options: ['They ride warm rising air', 'They flap the whole time', 'They hold balloons'],
        answer: 'They ride warm rising air',
      },
      {
        question: 'What do eagles build that is very big?',
        options: ['Nests', 'Houses', 'Bridges'],
        answer: 'Nests',
      },
    ],
  },
];

export default animalsContent;
