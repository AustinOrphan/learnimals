// The 5 guided levels for Ecosystem Safari v1. Each is a small ecological puzzle
// with one teaching goal. Species in `starting`/`palette` must belong to the
// level's habitat roster (grassland/forest/ocean); `lesson` is a DiscoveryJournal
// key (underscore form); `goal.type` is one of survive|reachHealth|noExtinctions|biodiversity.

export const levels = [
  {
    id: 'meadow-food-chain',
    title: 'Build a Meadow',
    habitat: 'grassland',
    intro:
      "Sky: Every living thing needs energy. Plants catch it from the sun — let's start with grass. What eats grass?",
    starting: [{ species: 'grass', population: 45 }],
    palette: ['rabbit', 'hawk', 'bacteria'],
    goal: { type: 'survive', requires: ['grass', 'rabbit'], durationSec: 25 },
    challenge: null,
    lesson: 'food_chains',
    hint: 'Grass is a producer. Add a rabbit — a herbivore that eats grass.',
  },
  {
    id: 'meadow-predator-prey',
    title: 'Predator & Prey',
    habitat: 'grassland',
    intro:
      'Sky: Uh oh — these rabbits are eating ALL the grass! In nature, predators keep things balanced. Who hunts rabbits?',
    starting: [
      { species: 'grass', population: 40 },
      { species: 'rabbit', population: 30 },
    ],
    palette: ['hawk', 'bacteria'],
    goal: { type: 'survive', requires: ['grass', 'rabbit', 'hawk'], durationSec: 30 },
    challenge: null,
    lesson: 'biodiversity',
    hint: 'Add a hawk. It eats rabbits, so the grass gets a chance to grow back.',
  },
  {
    id: 'forest-decomposers',
    title: 'The Cleanup Crew',
    habitat: 'forest',
    intro:
      'Sky: This forest is stuffed with life, but the soil is running out of nutrients. Something needs to recycle the leftovers...',
    starting: [
      { species: 'oak_tree', population: 30 },
      { species: 'deer', population: 20 },
      { species: 'wolf', population: 6 },
    ],
    palette: ['bacteria', 'bee'],
    goal: { type: 'reachHealth', healthTarget: 70, holdSec: 4, timeoutSec: 40 },
    challenge: null,
    lesson: 'limiting_factors',
    hint: 'Add bacteria — decomposers recycle dead matter back into nutrients the trees need.',
  },
  {
    id: 'ocean-balance',
    title: 'Ocean Balance',
    habitat: 'ocean',
    intro:
      'Sky: Dive in! A healthy ocean needs producers, plant-eaters, AND predators. Build a food web that stays in balance.',
    starting: [{ species: 'seaweed', population: 50 }],
    palette: ['sea_turtle', 'shark', 'bacteria'],
    goal: { type: 'survive', requires: ['seaweed', 'sea_turtle', 'shark'], durationSec: 30 },
    challenge: null,
    lesson: 'food_chains',
    hint: 'Seaweed feeds sea turtles, and sharks hunt sea turtles. Add all three and watch the balance.',
  },
  {
    id: 'meadow-drought',
    title: 'Survive the Drought',
    habitat: 'grassland',
    intro:
      'Sky: Your meadow looks great — but a drought is coming! Diverse ecosystems survive tough times best. Keep as many species alive as you can.',
    starting: [
      { species: 'grass', population: 45 },
      { species: 'rabbit', population: 20 },
      { species: 'hawk', population: 5 },
      { species: 'bacteria', population: 15 },
    ],
    palette: ['rabbit', 'hawk', 'bacteria'],
    goal: { type: 'biodiversity', minSpecies: 3, timeoutSec: 35 },
    challenge: { type: 'drought', atSec: 8 },
    lesson: 'conservation',
    hint: 'Keep at least 3 species alive through the drought. Top up populations that start to crash.',
  },
];

export default levels;
