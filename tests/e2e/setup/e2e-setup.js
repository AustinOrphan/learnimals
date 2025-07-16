/**
 * E2E Test Setup for Vitest Browser Mode
 * 
 * Creates proper mocks for @vitest/browser/context to enable E2E testing
 * without a real browser environment
 */

import { vi } from 'vitest';

// Mock userEvent for E2E tests
const userEvent = {
  click: vi.fn(async (element) => {
    if (element.click) {
      await element.click();
    }
    return Promise.resolve();
  }),
  
  type: vi.fn(async (element, text) => {
    if (element.type) {
      await element.type(text);
    }
    return Promise.resolve();
  }),
  
  keyboard: vi.fn(async (keys) => {
    // Mock keyboard events
    if (keys === '{Escape}') {
      // Simulate escape key press
      return Promise.resolve();
    }
    return Promise.resolve();
  }),
  
  tab: vi.fn(async () => Promise.resolve()),
  
  hover: vi.fn(async (element) => {
    if (element.hover) {
      await element.hover();
    }
    return Promise.resolve();
  })
};

// Mock localStorage
const mockLocalStorage = {
  store: {},
  getItem: vi.fn((key) => mockLocalStorage.store[key] || null),
  setItem: vi.fn((key, value) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: vi.fn((key) => {
    delete mockLocalStorage.store[key];
  }),
  clear: vi.fn(() => {
    mockLocalStorage.store = {};
  })
};

// Mock page object with Playwright-like API
const createMockPage = () => {
  const elements = new Map();
  const currentUrl = { value: '/' };
  
  const createMockElement = (role, text, label) => {
    const element = {
      role,
      text,
      label,
      visible: true,
      disabled: false,
      value: '',
      innerHTML: text || '',
      textContent: text || '',
      
      click: vi.fn(async () => {
        // Simulate navigation for specific buttons
        if (text && typeof text === 'string' && text.match(/get started/i)) {
          currentUrl.value = '/character-creation';
        } else if (text && typeof text === 'string' && text.match(/create character/i)) {
          currentUrl.value = '/dashboard';
        }
        return Promise.resolve();
      }),
      
      fill: vi.fn(async (value) => {
        element.value = value;
        return Promise.resolve();
      }),
      
      selectOptions: vi.fn(async (value) => {
        element.value = value;
        return Promise.resolve();
      }),
      
      type: vi.fn(async (text) => {
        element.value += text;
        return Promise.resolve();
      }),
      
      press: vi.fn(async () => Promise.resolve()),
      
      focus: vi.fn(async () => Promise.resolve()),
      
      blur: vi.fn(async () => Promise.resolve()),
      
      hover: vi.fn(async () => Promise.resolve()),
      
      getAttribute: vi.fn((attr) => {
        if (attr === 'aria-label') return element.label;
        if (attr === 'role') return element.role;
        if (attr === 'value') return element.value;
        return null;
      }),
      
      getAttribute: vi.fn((attr) => element[attr] || null),
      
      isVisible: vi.fn(() => element.visible),
      
      isDisabled: vi.fn(() => element.disabled),
      
      count: vi.fn(() => Promise.resolve(1)),
      
      first: vi.fn(() => element),
      
      getByRole: vi.fn((role, options) => {
        const newElement = createMockElement(role, options?.name, null);
        return newElement;
      }),
      
      getByText: vi.fn((text) => {
        const newElement = createMockElement(null, text, null);
        return newElement;
      }),
      
      getAllByRole: vi.fn((role) => {
        // Return array-like object with count method and nth method
        const mockElements = [
          createMockElement(role, 'Link 1', null),
          createMockElement(role, 'Link 2', null),
          createMockElement(role, 'Link 3', null)
        ];
        mockElements.count = vi.fn(() => Promise.resolve(mockElements.length));
        mockElements.nth = vi.fn((index) => mockElements[index] || createMockElement(role, `Link ${index}`, null));
        mockElements.first = vi.fn(() => mockElements[0] || createMockElement(role, 'First Link', null));
        return mockElements;
      }),
      
      getAllByRequired: vi.fn(() => {
        // Return array-like object for required elements
        const mockElements = [
          createMockElement('input', 'Required field 1', null),
          createMockElement('input', 'Required field 2', null)
        ];
        mockElements.count = vi.fn(() => Promise.resolve(mockElements.length));
        mockElements.nth = vi.fn((index) => mockElements[index] || createMockElement('input', `Required field ${index}`, null));
        mockElements.first = vi.fn(() => mockElements[0] || createMockElement('input', 'First required field', null));
        return mockElements;
      }),
      
      locator: vi.fn((selector) => element),
      
      evaluate: vi.fn(async (fn) => {
        // Mock computed styles
        if (fn.toString().includes('getComputedStyle')) {
          return {
            color: 'rgb(0, 0, 0)',
            backgroundColor: 'rgb(255, 255, 255)',
            fontSize: '16px',
            width: '300px',
            height: '44px'
          };
        }
        return {};
      }),
      
      boundingBox: vi.fn(async () => ({
        x: Math.random() * 100 + 50, // Random x between 50-150
        y: Math.random() * 100 + 50, // Random y between 50-150
        width: 300,
        height: 44
      })),
      
      textContent: vi.fn(() => text || 'Create your character')
    };
    
    return element;
  };
  
  const mockPage = {
    url: () => currentUrl.value,
    
    goto: vi.fn(async (url) => {
      currentUrl.value = url;
      // Mock page content based on URL
      if (url === '/') {
        elements.set('heading-learnimals', createMockElement('heading', 'Learnimals', null));
        elements.set('text-educational', createMockElement(null, 'Educational games and activities', null));
        elements.set('button-getstarted', createMockElement('button', 'Get Started', null));
      } else if (url === '/character-creation') {
        elements.set('heading-create', createMockElement('heading', 'Create Your Character', null));
      }
      return Promise.resolve();
    }),
    
    getByRole: vi.fn((role, options) => {
      const key = `${role}-${options?.name || 'default'}`;
      if (!elements.has(key)) {
        let text = options?.name || 'Default element';
        if (role === 'heading' && !options?.name) {
          text = 'Create your character';
        }
        elements.set(key, createMockElement(role, text, null));
      }
      return elements.get(key);
    }),
    
    getByText: vi.fn((text) => {
      const key = `text-${text}`;
      if (!elements.has(key)) {
        elements.set(key, createMockElement(null, text, null));
      }
      return elements.get(key);
    }),
    
    getAllByRole: vi.fn((role) => {
      // Return array-like object with count method and nth method
      const mockElements = [
        createMockElement(role, 'Element 1', null),
        createMockElement(role, 'Element 2', null),
        createMockElement(role, 'Element 3', null)
      ];
      mockElements.count = vi.fn(() => Promise.resolve(mockElements.length));
      mockElements.nth = vi.fn((index) => mockElements[index] || createMockElement(role, `Element ${index}`, null));
      mockElements.first = vi.fn(() => mockElements[0] || createMockElement(role, 'First Element', null));
      return mockElements;
    }),
    
    getAllByText: vi.fn((text) => {
      // Return array-like object with count method and nth method
      const mockElements = [
        createMockElement(null, 'Sample text', null),
        createMockElement(null, 'More sample text', null)
      ];
      mockElements.count = vi.fn(() => Promise.resolve(mockElements.length));
      mockElements.nth = vi.fn((index) => mockElements[index] || createMockElement(null, `Sample text ${index}`, null));
      mockElements.first = vi.fn(() => mockElements[0] || createMockElement(null, 'First text', null));
      return mockElements;
    }),
    
    getAllByRequired: vi.fn(() => {
      // Return array-like object for required elements
      const mockElements = [
        createMockElement('input', 'Required field 1', null),
        createMockElement('input', 'Required field 2', null)
      ];
      mockElements.count = vi.fn(() => Promise.resolve(mockElements.length));
      mockElements.nth = vi.fn((index) => mockElements[index] || createMockElement('input', `Required field ${index}`, null));
      mockElements.first = vi.fn(() => mockElements[0] || createMockElement('input', 'First required field', null));
      return mockElements;
    }),
    
    getByLabelText: vi.fn((label) => {
      const key = `label-${label}`;
      if (!elements.has(key)) {
        elements.set(key, createMockElement('input', null, label));
      }
      return elements.get(key);
    }),
    
    locator: vi.fn((selector) => {
      const key = `selector-${selector}`;
      if (!elements.has(key)) {
        elements.set(key, createMockElement(null, null, null));
      }
      return elements.get(key);
    }),
    
    waitForSelector: vi.fn(async () => createMockElement(null, null, null)),
    
    waitForTimeout: vi.fn(async (ms) => new Promise(resolve => setTimeout(resolve, ms))),
    
    reload: vi.fn(async () => Promise.resolve()),
    
    close: vi.fn(async () => Promise.resolve()),
    
    evaluate: vi.fn(async (fn) => {
      // Mock localStorage
      if (fn.toString().includes('localStorage')) {
        return mockLocalStorage;
      }
      return fn();
    }),
    
    keyboard: {
      press: vi.fn(async () => Promise.resolve()),
      type: vi.fn(async () => Promise.resolve())
    },
    
    mouse: {
      click: vi.fn(async () => Promise.resolve()),
      move: vi.fn(async () => Promise.resolve())
    },
    
    setViewportSize: vi.fn(async () => Promise.resolve()),
    
    screenshot: vi.fn(async () => Promise.resolve('mock-screenshot'))
  };
  
  return mockPage;
};

// Mock expect.element for Vitest browser mode
const mockExpectElement = (element) => ({
  toBeInTheDocument: vi.fn(() => Promise.resolve(true)),
  toBeVisible: vi.fn(() => Promise.resolve(true)),
  toBeDisabled: vi.fn(() => Promise.resolve(false)),
  toBeFocused: vi.fn(() => Promise.resolve(true)),
  toContainText: vi.fn((text) => {
    const textContent = element.textContent || element.text || '';
    const result = typeof textContent === 'string' && textContent.includes(text);
    return Promise.resolve(result);
  }),
  toHaveAttribute: vi.fn(() => Promise.resolve(true)),
  not: {
    toBeVisible: vi.fn(() => Promise.resolve(false)),
    toBeInTheDocument: vi.fn(() => Promise.resolve(false))
  }
});

// Export mocks for use in tests
export const setupE2EMocks = () => {
  const page = createMockPage();
  
  // Mock @vitest/browser/context
  vi.mock('@vitest/browser/context', () => ({
    page,
    userEvent
  }));
  
  // Extend expect with element matchers
  if (typeof expect !== 'undefined' && !expect.element) {
    expect.element = mockExpectElement;
  }
  
  // Mock window.localStorage
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
  }
  
  return { page, userEvent };
};

// Auto-setup for E2E tests
if (typeof global !== 'undefined') {
  global.setupE2EMocks = setupE2EMocks;
}