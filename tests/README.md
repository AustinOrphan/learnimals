# Learnimals Testing Framework

This directory contains the comprehensive test suite for the Learnimals educational web application. The testing framework is built with **Vitest** and provides unit, component, and integration testing capabilities.

## Test Structure

```
tests/
├── components/         # Component-specific tests
│   ├── Modal.test.js          # Modal component tests
│   └── BaseGame.test.js       # Base game functionality tests
├── unit/              # Unit tests for utilities
│   └── logger.test.js         # Logger utility tests
├── integration/       # Integration tests
│   └── gameFlow.test.js       # Game workflow integration tests
├── utils/             # Test utilities and helpers
│   └── testHelpers.js         # Common test utilities
├── fixtures/          # Test data and fixtures
├── mocks/             # Mock implementations
├── coverage/          # Code coverage reports
└── results/           # Test result outputs
```

## Available Test Commands

### Basic Commands
```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with UI interface
npm run test:ui

# Run tests once (CI mode)
npm run test:run
```

### Specific Test Types
```bash
# Run only unit tests
npm run test:unit

# Run only component tests
npm run test:components

# Run only integration tests
npm run test:integration
```

### Coverage Reports
```bash
# Generate code coverage report
npm run test:coverage
```

## Test Categories

### Unit Tests
Located in `tests/unit/`, these test individual functions and utilities in isolation:
- **Logger tests**: Verify logging functionality, levels, and environment handling
- **Utility functions**: Test helper functions and utility modules
- **Configuration tests**: Validate configuration loading and parsing

### Component Tests
Located in `tests/components/`, these test individual UI components:
- **Modal Component**: Test modal creation, interaction, and lifecycle
- **BaseGame Component**: Test game state management, lifecycle, and performance
- **Form Components**: Test form validation and submission
- **Theme Components**: Test theme switching and persistence

### Integration Tests
Located in `tests/integration/`, these test complete workflows:
- **Game Flow**: Test complete game sessions from start to finish
- **Subject Navigation**: Test navigation between subject pages
- **Theme Integration**: Test theme changes across components
- **Error Handling**: Test error propagation and recovery

## Test Utilities

### Test Helpers (`tests/utils/testHelpers.js`)
Common utilities available in all tests:

```javascript
import { 
  createMockDOM,
  createMockComponent,
  createMockGameState,
  createMockCanvas,
  mockBrowserEnvironment,
  waitForDOM,
  triggerEvent
} from '../utils/testHelpers.js';
```

### Mock Implementations
- **Mock Canvas**: For testing canvas-based games
- **Mock DOM**: Simulated browser environment
- **Mock Theme Manager**: For testing theme functionality
- **Mock Logger**: For testing logging without console output

## Writing Tests

### Basic Test Structure
```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockDOM } from '../utils/testHelpers.js';

describe('Component Name', () => {
  let component;
  
  beforeEach(() => {
    createMockDOM();
    component = new Component();
  });
  
  it('should do something specific', () => {
    // Arrange
    const input = 'test input';
    
    // Act
    const result = component.method(input);
    
    // Assert
    expect(result).toBe('expected output');
  });
});
```

### Testing Components with DOM
```javascript
import { createMockDOM, triggerEvent } from '../utils/testHelpers.js';

describe('Interactive Component', () => {
  beforeEach(() => {
    createMockDOM();
  });
  
  it('should handle user interactions', () => {
    const button = document.createElement('button');
    const clickHandler = vi.fn();
    
    button.addEventListener('click', clickHandler);
    document.body.appendChild(button);
    
    triggerEvent(button, 'click');
    
    expect(clickHandler).toHaveBeenCalled();
  });
});
```

### Testing Games
```javascript
import { createMockCanvas, createMockGameState } from '../utils/testHelpers.js';

describe('Game Component', () => {
  let game;
  let mockCanvas;
  
  beforeEach(() => {
    mockCanvas = createMockCanvas();
    game = new Game({
      canvas: mockCanvas.canvas,
      gameId: 'test-game'
    });
  });
  
  it('should manage game state correctly', () => {
    expect(game.start()).toBe(true);
    expect(game.state.isRunning).toBe(true);
    
    expect(game.pause()).toBe(true);
    expect(game.state.isPaused).toBe(true);
  });
});
```

## Test Configuration

### Vitest Configuration
The project uses multiple Vitest configuration files:
- `vitest.config.js`: Main configuration
- `vitest.config.unit.js`: Unit test specific settings
- `vitest.config.components.js`: Component test settings
- `vitest.config.integration.js`: Integration test settings

### Environment Setup
- **happy-dom**: Simulated browser environment for component tests
- **node**: Node.js environment for unit tests
- **Global setup**: `tests/setup.js` provides global mocks and utilities

## Coverage Requirements

The project maintains high code coverage standards:
- **Branches**: 80% minimum
- **Functions**: 80% minimum
- **Lines**: 80% minimum
- **Statements**: 80% minimum

### Coverage Reports
Coverage reports are generated in multiple formats:
- **Text**: Console output during test runs
- **HTML**: Detailed interactive reports in `tests/coverage/`
- **JSON**: Machine-readable reports for CI/CD

## Best Practices

### 1. Test Naming
- Use descriptive test names that explain the expected behavior
- Follow the pattern: "should [expected behavior] when [condition]"

### 2. Test Organization
- Group related tests using `describe` blocks
- Use `beforeEach` for common setup
- Keep tests independent and isolated

### 3. Mocking
- Mock external dependencies to isolate units under test
- Use `vi.fn()` for function mocks
- Restore mocks after each test to prevent interference

### 4. Assertions
- Use specific assertions (`toBe`, `toEqual`, `toContain`)
- Test both positive and negative cases
- Verify side effects and state changes

### 5. Async Testing
- Use `async/await` for asynchronous operations
- Use `waitForDOM()` for DOM updates
- Test error conditions in async code

## Continuous Integration

Tests are designed to run in CI environments:
- All tests must pass before merging
- Coverage thresholds must be maintained
- Performance regression tests included

## Debugging Tests

### Running Single Tests
```bash
# Run a specific test file
npx vitest run tests/components/Modal.test.js

# Run tests matching a pattern
npx vitest run --grep "Modal Component"
```

### Debug Mode
```bash
# Run tests in debug mode
npx vitest --inspect-brk

# Use the UI for interactive debugging
npm run test:ui
```

### Common Issues
1. **Mock not working**: Ensure mocks are set up before importing modules
2. **DOM not available**: Use `createMockDOM()` in component tests
3. **Async timing**: Use `waitForDOM()` for DOM updates
4. **State leakage**: Ensure proper cleanup in `beforeEach`/`afterEach`

## Contributing

When adding new features:
1. Write tests before implementing features (TDD)
2. Ensure all existing tests pass
3. Add appropriate test coverage for new code
4. Update this README if adding new test patterns

For questions about testing, refer to the [Vitest documentation](https://vitest.dev/) or consult the team's testing guidelines.