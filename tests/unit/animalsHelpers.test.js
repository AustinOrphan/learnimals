import { describe, it, expect } from 'vitest';
import {
  buildAnimals,
  resolveSpecies,
  shuffle,
  scoreQuiz,
} from '../../subjects/animals/animalsHelpers.js';

const mascots = {
  math: {
    name: 'Mango',
    type: 'Shark',
    species: 'shark',
    image: '/img/shark.png',
    role: 'Math Expert',
  },
  science: {
    name: 'Sky',
    type: 'Parrot',
    species: 'parrot',
    image: '/img/parrot.png',
    role: 'Science Specialist',
  },
};
const content = [
  {
    subject: 'math',
    species: 'shark',
    facts: ['f1'],
    reaction: { emoji: '🦈', animation: 'wiggle' },
    quiz: [],
  },
  {
    subject: 'science',
    species: 'parrot',
    facts: ['f2'],
    reaction: { emoji: '🦜', animation: 'bob' },
    quiz: [],
  },
  {
    subject: 'ghost',
    species: 'ghost',
    facts: ['boo'],
    reaction: { emoji: '👻', animation: 'bob' },
    quiz: [],
  },
];

describe('buildAnimals', () => {
  it('joins content with mascot identity and skips animals without a mascot', () => {
    const animals = buildAnimals(content, mascots);
    expect(animals).toHaveLength(2);
    const shark = animals.find(a => a.species === 'shark');
    expect(shark.name).toBe('Mango');
    expect(shark.type).toBe('Shark');
    expect(shark.image).toBe('/img/shark.png');
    expect(shark.mascot).toBe(mascots.math);
    expect(shark.facts).toEqual(['f1']);
  });
});

describe('resolveSpecies', () => {
  const animals = buildAnimals(content, mascots);
  it('matches with a leading hash', () => {
    expect(resolveSpecies('#parrot', animals).name).toBe('Sky');
  });
  it('matches without a hash', () => {
    expect(resolveSpecies('shark', animals).name).toBe('Mango');
  });
  it('returns null for empty or unknown hash', () => {
    expect(resolveSpecies('', animals)).toBeNull();
    expect(resolveSpecies('#nope', animals)).toBeNull();
  });
});

describe('shuffle', () => {
  it('returns a new array with the same members', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input);
    expect(out).not.toBe(input);
    expect(out.slice().sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('scoreQuiz', () => {
  const quiz = [
    { question: 'q0', options: ['a', 'b'], answer: 'a' },
    { question: 'q1', options: ['c', 'd'], answer: 'd' },
    { question: 'q2', options: ['e', 'f'], answer: 'e' },
  ];
  it('counts answered and correct', () => {
    const answers = { 0: 'a', 1: 'c', 2: 'e' };
    expect(scoreQuiz(quiz, answers)).toEqual({ answered: 3, correct: 2, total: 3 });
  });
  it('counts partial answers', () => {
    expect(scoreQuiz(quiz, { 0: 'a' })).toEqual({ answered: 1, correct: 1, total: 3 });
  });
});
