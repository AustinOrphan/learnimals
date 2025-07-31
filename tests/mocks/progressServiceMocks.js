/**
 * Progress Service Test Mocks
 * Dedicated mocks for progress service testing
 */

import { vi } from 'vitest';

// Mock DOM element with innerHTML property
export const mockProgressElement = {
  innerHTML: '',
  appendChild: vi.fn(),
  removeChild: vi.fn(),
  style: {},
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(() => false)
  }
};

// Mock progress display dependencies
export const mockProgressDisplay = {
  element: mockProgressElement,
  show: vi.fn(),
  hide: vi.fn(),
  update: vi.fn(),
  clear: vi.fn()
};

// Mock storage service
export const mockStorageService = {
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn(),
  exists: vi.fn(() => false)
};

// Mock event emitter
export const mockEventEmitter = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  once: vi.fn()
};

// Mock streak service
export const mockStreakService = {
  updateStreak: vi.fn(),
  getCurrentStreak: vi.fn(() => ({ count: 0, lastDate: null })),
  resetStreak: vi.fn()
};

// Setup function for progress service tests
export function setupProgressServiceMocks() {
  // Mock document.createElement to return our mock element
  const originalCreateElement = document.createElement.bind(document);
  document.createElement = vi.fn((tagName) => {
    if (tagName === 'div' || tagName === 'span') {
      return { ...mockProgressElement };
    }
    return originalCreateElement(tagName);
  });

  // Mock document.getElementById
  document.getElementById = vi.fn((id) => {
    if (id === 'progress-display') {
      return mockProgressElement;
    }
    return null;
  });

  return {
    progressDisplay: mockProgressDisplay,
    storageService: mockStorageService,
    eventEmitter: mockEventEmitter,
    streakService: mockStreakService
  };
}

// Reset all mocks
export function resetProgressServiceMocks() {
  vi.clearAllMocks();
  mockProgressElement.innerHTML = '';
}