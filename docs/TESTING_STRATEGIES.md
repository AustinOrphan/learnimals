# Testing Strategies and Patterns

## Overview

This guide outlines comprehensive testing strategies for the Learnimals platform. We follow a test-driven development (TDD) approach with multiple layers of testing to ensure quality, reliability, and maintainability.

---

## Testing Philosophy

### Core Principles

1. **Test Early, Test Often**: Write tests before or alongside code
2. **Test Pyramid**: More unit tests, fewer integration tests, minimal E2E tests
3. **Fast Feedback**: Tests should run quickly to encourage frequent execution
4. **Isolation**: Tests should be independent and not affect each other
5. **Clarity**: Tests serve as documentation - they should be readable

### Testing Pyramid

```
         /\
        /E2E\        (5%)  - Critical user journeys
       /------\      
      /Integration\  (15%) - Component interactions
     /------------\
    /  Unit Tests  \ (80%) - Individual functions/components
   /----------------\
```

---

## Test Environment Setup

### Vitest Configuration

```javascript
// vitest.config.js
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        ...configDefaults.coverage.exclude,
        'src/test/**',
        '**/*.config.js',
        '**/mockData/**'
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@': '/src',
      '@test': '/src/test'
    }
  }
});
```

### Global Test Setup

```javascript
// src/test/setup.js
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/dom';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';

// Auto cleanup after each test
afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

// Global test utilities
global.TestUtils = {
  waitFor: (fn, timeout = 1000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        try {
          const result = fn();
          if (result) {
            resolve(result);
          } else if (Date.now() - startTime > timeout) {
            reject(new Error('Timeout waiting for condition'));
          } else {
            setTimeout(check, 50);
          }
        } catch (error) {
          if (Date.now() - startTime > timeout) {
            reject(error);
          } else {
            setTimeout(check, 50);
          }
        }
      };
      check();
    });
  }
};

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});
```

---

## Unit Testing

### Testing Utilities

```javascript
// src/utils/__tests__/formatters.test.js
import { describe, it, expect } from 'vitest';
import { formatDate, formatCurrency, formatPercentage } from '../formatters';

describe('formatters', () => {
  describe('formatDate', () => {
    it('formats date in default format', () => {
      const date = new Date('2024-01-15T10:30:00');
      expect(formatDate(date)).toBe('01/15/2024');
    });

    it('formats date with custom format', () => {
      const date = new Date('2024-01-15T10:30:00');
      expect(formatDate(date, 'long')).toBe('January 15, 2024');
    });

    it('handles invalid dates gracefully', () => {
      expect(formatDate('invalid')).toBe('Invalid Date');
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
    });
  });

  describe('formatCurrency', () => {
    it('formats positive amounts', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('formats negative amounts', () => {
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
    });

    it('handles edge cases', () => {
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(null)).toBe('$0.00');
      expect(formatCurrency(undefined)).toBe('$0.00');
    });
  });
});
```

### Testing Pure Functions

```javascript
// src/utils/__tests__/validators.test.js
import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword, validateAge } from '../validators';

describe('validators', () => {
  describe('validateEmail', () => {
    it.each([
      ['valid@email.com', true],
      ['user.name@domain.co.uk', true],
      ['invalid.email', false],
      ['@invalid.com', false],
      ['invalid@', false],
      ['', false],
      [null, false],
      [undefined, false]
    ])('validateEmail(%s) returns %s', (input, expected) => {
      expect(validateEmail(input)).toBe(expected);
    });
  });

  describe('validatePassword', () => {
    it('validates password strength', () => {
      const result = validatePassword('StrongP@ss123');
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns specific errors for weak passwords', () => {
      const result = validatePassword('weak');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
      expect(result.errors).toContain('Password must contain an uppercase letter');
      expect(result.errors).toContain('Password must contain a number');
    });
  });
});
```

### Testing Async Functions

```javascript
// src/services/__tests__/apiService.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiService } from '../apiService';

describe('ApiService', () => {
  let apiService;
  let mockFetch;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    apiService = new ApiService('https://api.test.com');
  });

  describe('get', () => {
    it('makes GET request with correct headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' })
      });

      const result = await apiService.get('/users');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/users',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      expect(result).toEqual({ data: 'test' });
    });

    it('throws error for non-ok responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(apiService.get('/users')).rejects.toThrow('Not Found');
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiService.get('/users')).rejects.toThrow('Network error');
    });
  });
});
```

---

## Component Testing

### Testing DOM Components

```javascript
// src/components/ui/__tests__/Button.test.js
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/dom';
import { Button } from '../Button';

describe('Button', () => {
  it('renders with text', () => {
    const button = new Button({
      text: 'Click me',
      onClick: vi.fn()
    });

    document.body.appendChild(button.render());

    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    const button = new Button({
      text: 'Click me',
      onClick: handleClick
    });

    document.body.appendChild(button.render());
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    const handleClick = vi.fn();
    const button = new Button({
      text: 'Click me',
      onClick: handleClick,
      disabled: true
    });

    document.body.appendChild(button.render());
    
    const buttonElement = screen.getByRole('button');
    expect(buttonElement).toBeDisabled();
    
    fireEvent.click(buttonElement);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies variant classes', () => {
    const button = new Button({
      text: 'Click me',
      variant: 'primary',
      size: 'large'
    });

    document.body.appendChild(button.render());
    
    const buttonElement = screen.getByRole('button');
    expect(buttonElement).toHaveClass('button--primary');
    expect(buttonElement).toHaveClass('button--large');
  });
});
```

### Testing Interactive Components

```javascript
// src/components/forms/__tests__/Form.test.js
import { describe, it, expect, vi, waitFor } from 'vitest';
import { screen, fireEvent } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { Form } from '../Form';

describe('Form', () => {
  it('validates required fields', async () => {
    const handleSubmit = vi.fn();
    const form = new Form({
      fields: [
        { name: 'email', type: 'email', required: true },
        { name: 'password', type: 'password', required: true }
      ],
      onSubmit: handleSubmit
    });

    document.body.appendChild(form.render());
    
    // Submit without filling fields
    fireEvent.submit(screen.getByRole('form'));
    
    // Check error messages appear
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
    
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('submits valid form data', async () => {
    const handleSubmit = vi.fn();
    const form = new Form({
      fields: [
        { name: 'email', type: 'email', required: true },
        { name: 'password', type: 'password', required: true }
      ],
      onSubmit: handleSubmit
    });

    document.body.appendChild(form.render());
    
    // Fill form
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    
    // Submit
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  it('shows real-time validation', async () => {
    const form = new Form({
      fields: [
        { 
          name: 'email', 
          type: 'email', 
          required: true,
          validate: (value) => {
            if (!value.includes('@')) {
              return 'Please enter a valid email';
            }
          }
        }
      ]
    });

    document.body.appendChild(form.render());
    
    const emailInput = screen.getByLabelText('Email');
    const user = userEvent.setup();
    
    // Type invalid email
    await user.type(emailInput, 'invalid');
    fireEvent.blur(emailInput);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
    });
    
    // Fix email
    await user.clear(emailInput);
    await user.type(emailInput, 'valid@email.com');
    fireEvent.blur(emailInput);
    
    await waitFor(() => {
      expect(screen.queryByText('Please enter a valid email')).not.toBeInTheDocument();
    });
  });
});
```

---

## Integration Testing

### Testing Component Interactions

```javascript
// src/features/activities/__tests__/ActivityFlow.integration.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import { ActivityManager } from '../ActivityManager';
import { ProgressService } from '../../progress/ProgressService';
import { MockDatabase } from '@test/mocks/database';

describe('Activity Flow Integration', () => {
  let activityManager;
  let progressService;
  let mockDb;

  beforeEach(() => {
    mockDb = new MockDatabase();
    progressService = new ProgressService(mockDb);
    activityManager = new ActivityManager(progressService);
  });

  it('completes full activity lifecycle', async () => {
    // Setup
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    await activityManager.loadActivity('math-basics', container);
    
    // Start activity
    const startButton = screen.getByRole('button', { name: 'Start Activity' });
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
    });
    
    // Answer questions
    for (let i = 0; i < 5; i++) {
      const correctAnswer = screen.getByRole('button', { name: /correct/i });
      fireEvent.click(correctAnswer);
      
      if (i < 4) {
        await waitFor(() => {
          expect(screen.getByText(`Question ${i + 2} of 5`)).toBeInTheDocument();
        });
      }
    }
    
    // Check completion
    await waitFor(() => {
      expect(screen.getByText('Activity Complete!')).toBeInTheDocument();
      expect(screen.getByText('Score: 100%')).toBeInTheDocument();
    });
    
    // Verify progress saved
    const progress = await progressService.getActivityProgress('math-basics');
    expect(progress).toMatchObject({
      completed: true,
      score: 100,
      attempts: 1
    });
  });

  it('handles activity errors gracefully', async () => {
    // Simulate network error
    vi.spyOn(activityManager, 'loadActivity').mockRejectedValueOnce(
      new Error('Network error')
    );
    
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    await activityManager.initialize('math-basics', container);
    
    await waitFor(() => {
      expect(screen.getByText(/Unable to load activity/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    });
  });
});
```

### Testing Service Integration

```javascript
// src/services/__tests__/UserProgress.integration.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { UserService } from '../UserService';
import { ProgressService } from '../ProgressService';
import { AchievementService } from '../AchievementService';
import { MockDatabase } from '@test/mocks/database';

describe('User Progress Integration', () => {
  let userService;
  let progressService;
  let achievementService;
  let mockDb;

  beforeEach(() => {
    mockDb = new MockDatabase();
    userService = new UserService(mockDb);
    progressService = new ProgressService(mockDb);
    achievementService = new AchievementService(progressService);
    
    // Connect services
    progressService.on('progress:updated', (data) => {
      achievementService.checkAchievements(data.userId);
    });
  });

  it('unlocks achievement when completing first activity', async () => {
    // Create user
    const user = await userService.createUser({
      name: 'Test User',
      email: 'test@example.com'
    });
    
    // Complete activity
    await progressService.recordActivity(user.id, {
      activityId: 'math-basics',
      score: 80,
      timeSpent: 300
    });
    
    // Check achievement unlocked
    const achievements = await achievementService.getUserAchievements(user.id);
    expect(achievements).toContainEqual(
      expect.objectContaining({
        id: 'first-steps',
        name: 'First Steps',
        unlockedAt: expect.any(Date)
      })
    );
  });

  it('tracks progress across multiple activities', async () => {
    const user = await userService.createUser({
      name: 'Test User',
      email: 'test@example.com'
    });
    
    // Complete multiple activities
    const activities = ['math-basics', 'math-advanced', 'science-intro'];
    
    for (const activityId of activities) {
      await progressService.recordActivity(user.id, {
        activityId,
        score: 90,
        timeSpent: 600
      });
    }
    
    // Get overall progress
    const summary = await progressService.getUserSummary(user.id);
    
    expect(summary).toMatchObject({
      totalActivities: 3,
      averageScore: 90,
      totalTimeSpent: 1800,
      subjectProgress: {
        math: { completed: 2, total: 10 },
        science: { completed: 1, total: 8 }
      }
    });
  });
});
```

---

## End-to-End Testing

### Playwright Configuration

```javascript
// playwright.config.js
export default {
  testDir: './e2e',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 12'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI
  }
};
```

### E2E Test Examples

```javascript
// e2e/userJourney.spec.js
import { test, expect } from '@playwright/test';

test.describe('User Journey', () => {
  test('new user completes onboarding and first activity', async ({ page }) => {
    // Navigate to app
    await page.goto('/');
    
    // Check welcome screen
    await expect(page.locator('h1')).toContainText('Welcome to Learnimals');
    
    // Start onboarding
    await page.click('button:has-text("Get Started")');
    
    // Fill user info
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="age"]', '10');
    await page.click('button:has-text("Next")');
    
    // Select interests
    await page.click('label:has-text("Math")');
    await page.click('label:has-text("Science")');
    await page.click('button:has-text("Continue")');
    
    // Complete onboarding
    await expect(page.locator('.welcome-message')).toContainText('Welcome, Test User!');
    await page.click('button:has-text("Start Learning")');
    
    // Navigate to activities
    await expect(page).toHaveURL('/dashboard');
    await page.click('a:has-text("Activities")');
    
    // Start math activity
    await page.click('.activity-card:has-text("Math Basics")');
    await page.click('button:has-text("Start Activity")');
    
    // Complete activity
    await expect(page.locator('.question')).toBeVisible();
    
    // Answer 5 questions
    for (let i = 0; i < 5; i++) {
      // Wait for question to load
      await page.waitForSelector('.answer-option');
      
      // Select correct answer (marked with data attribute in test mode)
      await page.click('[data-correct="true"]');
      
      // Wait for next question or completion
      if (i < 4) {
        await page.waitForSelector(`.question:has-text("Question ${i + 2}")`);
      }
    }
    
    // Check completion screen
    await expect(page.locator('.completion-message')).toContainText('Great job!');
    await expect(page.locator('.score')).toContainText('100%');
    
    // Verify progress saved
    await page.click('a:has-text("Progress")');
    await expect(page.locator('.progress-item:has-text("Math Basics")')).toContainText('Completed');
  });

  test('handles offline mode', async ({ page, context }) => {
    // Load app online
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Go offline
    await context.setOffline(true);
    
    // Navigate should still work
    await page.click('a:has-text("Activities")');
    await expect(page.locator('h1')).toContainText('Activities');
    
    // Offline indicator should show
    await expect(page.locator('.offline-indicator')).toBeVisible();
    
    // Cached content should be available
    await expect(page.locator('.activity-card')).toHaveCount.greaterThan(0);
    
    // Go back online
    await context.setOffline(false);
    
    // Offline indicator should hide
    await expect(page.locator('.offline-indicator')).not.toBeVisible();
  });
});
```

---

## Testing Patterns

### Test Data Builders

```javascript
// src/test/builders/userBuilder.js
export class UserBuilder {
  constructor() {
    this.user = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Test User',
      email: 'test@example.com',
      age: 10,
      role: 'student',
      createdAt: new Date()
    };
  }

  withName(name) {
    this.user.name = name;
    return this;
  }

  withAge(age) {
    this.user.age = age;
    return this;
  }

  withRole(role) {
    this.user.role = role;
    return this;
  }

  asTeacher() {
    this.user.role = 'teacher';
    this.user.age = 30;
    return this;
  }

  asParent() {
    this.user.role = 'parent';
    this.user.age = 35;
    return this;
  }

  build() {
    return { ...this.user };
  }
}

// Usage
const student = new UserBuilder().withAge(8).build();
const teacher = new UserBuilder().asTeacher().withName('Ms. Smith').build();
```

### Mock Factories

```javascript
// src/test/mocks/factories.js
export class MockFactory {
  static createActivity(overrides = {}) {
    return {
      id: 'activity-' + Date.now(),
      title: 'Test Activity',
      subject: 'math',
      difficulty: 'medium',
      questions: [],
      ...overrides
    };
  }

  static createProgress(userId, activityId, overrides = {}) {
    return {
      id: `${userId}-${activityId}`,
      userId,
      activityId,
      completed: false,
      score: 0,
      attempts: 0,
      timeSpent: 0,
      lastAttempt: new Date(),
      ...overrides
    };
  }

  static createApiResponse(data, overrides = {}) {
    return {
      status: 200,
      ok: true,
      data,
      ...overrides
    };
  }

  static createError(message = 'Test error', code = 'TEST_ERROR') {
    const error = new Error(message);
    error.code = code;
    return error;
  }
}
```

### Custom Matchers

```javascript
// src/test/matchers/customMatchers.js
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false
      };
    }
  },

  toHaveBeenCalledWithMatch(received, expected) {
    const calls = received.mock.calls;
    const pass = calls.some(call => 
      call.some(arg => 
        Object.keys(expected).every(key => arg[key] === expected[key])
      )
    );

    return {
      pass,
      message: () => pass
        ? `expected function not to have been called with matching ${JSON.stringify(expected)}`
        : `expected function to have been called with matching ${JSON.stringify(expected)}`
    };
  }
});

// Usage
expect(score).toBeWithinRange(0, 100);
expect(mockFn).toHaveBeenCalledWithMatch({ type: 'click', target: 'button' });
```

---

## Performance Testing

### Component Performance Tests

```javascript
// src/components/__tests__/LargeList.performance.test.js
import { describe, it, expect } from 'vitest';
import { measureRender } from '@test/utils/performance';
import { LargeList } from '../LargeList';

describe('LargeList Performance', () => {
  it('renders 1000 items in under 100ms', async () => {
    const items = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      value: Math.random()
    }));

    const { duration, result } = await measureRender(() => {
      const list = new LargeList({ items });
      return list.render();
    });

    expect(duration).toBeLessThan(100);
    expect(result.querySelectorAll('.list-item')).toHaveLength(1000);
  });

  it('handles rapid updates efficiently', async () => {
    const list = new LargeList({ items: [] });
    const container = document.createElement('div');
    container.appendChild(list.render());

    const measurements = [];
    
    // Measure 10 rapid updates
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      
      list.updateItems(
        Array.from({ length: 100 }, (_, j) => ({
          id: i * 100 + j,
          name: `Item ${i * 100 + j}`
        }))
      );
      
      const duration = performance.now() - start;
      measurements.push(duration);
    }

    // Average update time should be under 20ms
    const avgDuration = measurements.reduce((a, b) => a + b) / measurements.length;
    expect(avgDuration).toBeLessThan(20);
    
    // No update should take over 50ms
    expect(Math.max(...measurements)).toBeLessThan(50);
  });
});
```

---

## Debugging Tests

### Test Utilities

```javascript
// src/test/utils/debug.js
export const debug = {
  // Log DOM state
  logDOM(element = document.body) {
    console.log(prettyDOM(element));
  },

  // Log all event listeners
  logListeners(element) {
    const listeners = getEventListeners(element);
    console.log('Event Listeners:', listeners);
  },

  // Take screenshot during test (Playwright)
  async screenshot(page, name) {
    if (process.env.DEBUG) {
      await page.screenshot({ 
        path: `test-screenshots/${name}.png`,
        fullPage: true 
      });
    }
  },

  // Pause test execution
  async pause(ms = 1000) {
    if (process.env.DEBUG) {
      await new Promise(resolve => setTimeout(resolve, ms));
    }
  },

  // Interactive debugging
  async debug() {
    if (process.env.DEBUG) {
      // eslint-disable-next-line no-debugger
      debugger;
    }
  }
};

// Usage in tests
import { debug } from '@test/utils/debug';

test('complex interaction', async () => {
  // ... setup
  
  debug.logDOM();
  await debug.pause(2000); // Pause to inspect
  
  // ... assertions
});
```

---

## Continuous Integration

### GitHub Actions Test Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unit
        name: unit-tests-${{ matrix.node-version }}

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 20
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        CI: true

  e2e-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 20
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright
      run: npx playwright install --with-deps
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
```

---

## Testing Best Practices

### Do's
- ✅ Write tests that are independent and can run in any order
- ✅ Use descriptive test names that explain what is being tested
- ✅ Follow the AAA pattern: Arrange, Act, Assert
- ✅ Test behavior, not implementation details
- ✅ Use test data builders for complex objects
- ✅ Mock external dependencies
- ✅ Keep tests focused and test one thing at a time
- ✅ Use `beforeEach` for common setup
- ✅ Clean up after tests (event listeners, timers, DOM)

### Don'ts
- ❌ Don't test framework/library code
- ❌ Don't use random data without seeding
- ❌ Don't share state between tests
- ❌ Don't test private methods directly
- ❌ Don't use hard-coded wait times
- ❌ Don't ignore flaky tests
- ❌ Don't write tests after finding bugs (write them first)
- ❌ Don't skip tests without explanation

---

## Testing Resources

### Tools
- **Vitest**: Modern test runner
- **Testing Library**: DOM testing utilities
- **Playwright**: E2E testing
- **MSW**: API mocking
- **Faker.js**: Test data generation

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Docs](https://playwright.dev/)
- [Jest Matchers](https://jestjs.io/docs/expect)

### Books & Articles
- "Test-Driven Development" by Kent Beck
- "Growing Object-Oriented Software" by Freeman & Pryce
- [Testing Best Practices](https://testingjavascript.com/)

---

*Remember: Tests are not just about catching bugs, they're about designing better software and providing documentation for how your code should work.*