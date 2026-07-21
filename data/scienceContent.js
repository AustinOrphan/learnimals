// Verified science content for the Science subject page (facts, planets, quiz).
// Facts and quiz answers are checked, kid-friendly, and drawn from well-established
// science. Rendered randomly by science.js so the page feels fresh each visit.

/** General "Did You Know?" facts. */
export const scienceFacts = [
  { text: 'Octopuses have three hearts and blue blood.', category: 'animals' },
  { text: 'A group of flamingos is called a flamboyance.', category: 'animals' },
  {
    text: 'Honey never spoils — archaeologists have found edible honey thousands of years old.',
    category: 'chemistry',
  },
  { text: 'Sharks existed before trees did.', category: 'animals' },
  { text: 'Sloths can hold their breath longer than dolphins can.', category: 'animals' },
  { text: 'A day on Venus is longer than a year on Venus.', category: 'space' },
  {
    text: 'Bananas are slightly radioactive because they contain potassium.',
    category: 'chemistry',
  },
  { text: 'Your body has enough carbon to make about 900 pencils.', category: 'body' },
  {
    text: 'Lightning is about five times hotter than the surface of the Sun.',
    category: 'physics',
  },
  {
    text: 'Water can boil and freeze at the same time — it is called the triple point.',
    category: 'physics',
  },
  { text: 'The human nose can detect about one trillion different smells.', category: 'body' },
  {
    text: 'A bolt of lightning contains enough energy to toast about 100,000 slices of bread.',
    category: 'physics',
  },
  { text: 'Hummingbirds are the only birds that can fly backwards.', category: 'animals' },
  {
    text: 'The Eiffel Tower can grow more than 15 cm taller in summer as its metal expands in the heat.',
    category: 'physics',
  },
  { text: 'Some turtles can breathe through their back ends.', category: 'animals' },
  { text: 'Wombats produce cube-shaped poop.', category: 'animals' },
  {
    text: 'There is enough DNA in your body to stretch to the Sun and back many times.',
    category: 'body',
  },
  { text: 'A teaspoon of neutron star would weigh about a billion tons.', category: 'space' },
  { text: 'Butterflies taste with their feet.', category: 'animals' },
  { text: 'The Sun makes up about 99.8% of all the mass in our solar system.', category: 'space' },
  {
    text: 'Cold water is denser than warm water, which is why ice forms on top of lakes.',
    category: 'physics',
  },
  {
    text: 'The heart of a blue whale is so big a small child could crawl through its arteries.',
    category: 'animals',
  },
  {
    text: 'Plants can "talk" to each other by releasing chemicals into the air.',
    category: 'plants',
  },
  { text: 'A single bolt of lightning is hotter than 27,000°C.', category: 'physics' },
  {
    text: 'Your bones are about five times stronger than steel of the same weight.',
    category: 'body',
  },
  {
    text: 'The Amazon rainforest produces about 20% of the oxygen we breathe.',
    category: 'plants',
  },
  {
    text: 'Ants do not have lungs — they breathe through tiny holes in their bodies.',
    category: 'animals',
  },
  {
    text: 'The tongue is the only muscle in your body attached at just one end.',
    category: 'body',
  },
  { text: 'Rubber bands last longer when kept in the refrigerator.', category: 'chemistry' },
  {
    text: 'A rainbow is actually a full circle — from the ground we only see part of it.',
    category: 'physics',
  },
  {
    text: 'Bamboo is the fastest-growing plant and can grow almost a metre in a single day.',
    category: 'plants',
  },
  { text: 'The dot over a lowercase "i" is called a tittle.', category: 'body' },
  { text: 'Sound travels about four times faster in water than in air.', category: 'physics' },
  { text: 'Some jellyfish are considered biologically immortal.', category: 'animals' },
  {
    text: 'A cloud can weigh more than a million pounds because of all the water droplets in it.',
    category: 'physics',
  },
  { text: 'Trees are the longest-living organisms on Earth.', category: 'plants' },
  {
    text: 'The coldest place ever recorded on Earth is about -89°C in Antarctica.',
    category: 'physics',
  },
  {
    text: 'Your stomach gets a new lining every few days so it does not digest itself.',
    category: 'body',
  },
];

/** Space facts, shown one at a time in the Space Zone. */
export const spaceFacts = [
  'Space is completely silent because there is no air for sound to travel through.',
  'One million Earths could fit inside the Sun.',
  'A full NASA space suit costs about as much as a small house.',
  'The footprints left by astronauts on the Moon will likely stay there for millions of years.',
  'Neutron stars can spin up to 600 times every second.',
  'Saturn is so light for its size that it would float in a giant bathtub of water.',
  'There are more stars in the universe than grains of sand on all of Earth’s beaches.',
  'The Sun is so big that about 1.3 million Earths could fit inside it.',
  'A year on Mercury is just 88 Earth days long.',
  'The largest known volcano in the solar system, Olympus Mons, is on Mars and is about three times taller than Mount Everest.',
];

/** The eight planets, in order from the Sun, with a kid-friendly fact each. */
export const planets = [
  {
    name: 'Mercury',
    emoji: '🌑',
    fact: 'The smallest planet and closest to the Sun. A year lasts only 88 days.',
  },
  {
    name: 'Venus',
    emoji: '🌕',
    fact: 'The hottest planet, wrapped in thick clouds. It spins backwards!',
  },
  {
    name: 'Earth',
    emoji: '🌍',
    fact: 'Our home — the only planet we know of with life and liquid water.',
  },
  {
    name: 'Mars',
    emoji: '🔴',
    fact: 'The "Red Planet," rusty from iron in its soil. It has the tallest volcano.',
  },
  {
    name: 'Jupiter',
    emoji: '🪐',
    fact: 'The biggest planet — a giant ball of gas with a storm bigger than Earth.',
  },
  { name: 'Saturn', emoji: '💍', fact: 'Famous for its beautiful rings made of ice and rock.' },
  { name: 'Uranus', emoji: '🔵', fact: 'An icy giant that rolls around the Sun on its side.' },
  { name: 'Neptune', emoji: '🌊', fact: 'The windiest planet, deep blue and far from the Sun.' },
];

/** Multiple-choice quiz bank. `answer` must match one of `options`. */
export const scienceQuiz = [
  {
    question: 'What planet is known as the Red Planet?',
    options: ['Mars', 'Venus', 'Jupiter', 'Saturn'],
    answer: 'Mars',
  },
  {
    question: 'What do plants need from the Sun to make food?',
    options: ['Sunlight', 'Juice', 'Milk', 'Sugar'],
    answer: 'Sunlight',
  },
  {
    question: 'How many hearts does an octopus have?',
    options: ['Three', 'One', 'Two', 'Five'],
    answer: 'Three',
  },
  {
    question: 'What gas do we breathe in to stay alive?',
    options: ['Oxygen', 'Carbon dioxide', 'Helium', 'Hydrogen'],
    answer: 'Oxygen',
  },
  {
    question: 'Which is the largest planet in our solar system?',
    options: ['Jupiter', 'Earth', 'Mars', 'Saturn'],
    answer: 'Jupiter',
  },
  {
    question: 'What do we call animals that eat only plants?',
    options: ['Herbivores', 'Carnivores', 'Omnivores', 'Predators'],
    answer: 'Herbivores',
  },
  {
    question: 'What is the closest star to Earth?',
    options: ['The Sun', 'The Moon', 'Mars', 'Polaris'],
    answer: 'The Sun',
  },
  {
    question: 'What is water made of?',
    options: ['Hydrogen and oxygen', 'Only oxygen', 'Salt and sugar', 'Carbon and iron'],
    answer: 'Hydrogen and oxygen',
  },
  {
    question: 'Which part of a plant takes in water from the soil?',
    options: ['Roots', 'Leaves', 'Flowers', 'Petals'],
    answer: 'Roots',
  },
  {
    question: 'What do we call it when water turns into a gas?',
    options: ['Evaporation', 'Freezing', 'Melting', 'Raining'],
    answer: 'Evaporation',
  },
  {
    question: 'How many legs does an insect have?',
    options: ['Six', 'Four', 'Eight', 'Ten'],
    answer: 'Six',
  },
  {
    question: 'What is the center of our solar system?',
    options: ['The Sun', 'Earth', 'The Moon', 'Jupiter'],
    answer: 'The Sun',
  },
  {
    question: 'Which animal is the largest on Earth?',
    options: ['Blue whale', 'Elephant', 'Giraffe', 'Great white shark'],
    answer: 'Blue whale',
  },
  {
    question: 'What force pulls objects toward the Earth?',
    options: ['Gravity', 'Magnetism', 'Wind', 'Friction'],
    answer: 'Gravity',
  },
  {
    question: 'What do bees collect from flowers to make honey?',
    options: ['Nectar', 'Water', 'Leaves', 'Seeds'],
    answer: 'Nectar',
  },
  {
    question: 'Which planet do we live on?',
    options: ['Earth', 'Mars', 'Venus', 'Neptune'],
    answer: 'Earth',
  },
  {
    question: 'What is a baby frog called?',
    options: ['Tadpole', 'Kitten', 'Cub', 'Chick'],
    answer: 'Tadpole',
  },
  {
    question: 'What do we call frozen water?',
    options: ['Ice', 'Steam', 'Fog', 'Mud'],
    answer: 'Ice',
  },
  {
    question: 'Which planet has beautiful rings around it?',
    options: ['Saturn', 'Mercury', 'Earth', 'Mars'],
    answer: 'Saturn',
  },
  {
    question: 'What part of your body helps you think?',
    options: ['Brain', 'Heart', 'Lungs', 'Stomach'],
    answer: 'Brain',
  },
  {
    question: 'What do caterpillars turn into?',
    options: ['Butterflies', 'Bees', 'Spiders', 'Birds'],
    answer: 'Butterflies',
  },
  {
    question: 'Which season comes after winter?',
    options: ['Spring', 'Summer', 'Autumn', 'Fall'],
    answer: 'Spring',
  },
  {
    question: 'What do we call the study of living things?',
    options: ['Biology', 'Geology', 'Astronomy', 'Chemistry'],
    answer: 'Biology',
  },
  {
    question: 'What color is chlorophyll, which helps plants make food?',
    options: ['Green', 'Red', 'Blue', 'Yellow'],
    answer: 'Green',
  },
  {
    question: 'Which of these is a mammal?',
    options: ['Dolphin', 'Shark', 'Octopus', 'Frog'],
    answer: 'Dolphin',
  },
];
