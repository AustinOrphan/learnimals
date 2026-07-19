# Keyboard Navigation Tests

This directory contains comprehensive keyboard navigation tests for the Learnimals educational
application. These tests ensure complete keyboard accessibility compliance with WCAG 2.1 Level AA
guidelines.

## Test Files Overview

### 1. `comprehensive-keyboard-navigation.test.js`

**Primary test suite covering fundamental keyboard navigation patterns:**

- Tab order and focus management across complex layouts
- Skip links for efficient page navigation
- Keyboard shortcuts and hotkeys (F6 landmark navigation, Ctrl+Home/End, Alt+1-6 for headings)
- Focus indicators and visual feedback
- Roving tabindex implementation for component groups
- Touch and mobile keyboard support
- Performance testing with large numbers of focusable elements
- Automated accessibility audits

### 2. `modal-keyboard-navigation.test.js`

**Comprehensive modal dialog keyboard accessibility:**

- Focus trapping within modal boundaries
- Focus restoration when modals close
- Escape key functionality for closing modals
- Initial focus management when modals open
- Modal stacking scenarios with proper focus handling
- Complex modal content navigation (forms, tabs, grids)
- Error handling for edge cases (removed triggers, rapid operations)
- ARIA compliance and screen reader support

### 3. `game-keyboard-navigation.test.js`

**Educational game keyboard controls:**

- WASD and arrow key controls for character movement
- Space bar for primary game actions and interactions
- Number keys (1-9) for educational game selections
- Game state controls (Pause with Escape/P, Resume with R, New Game with N, Quit with Q)
- Multi-key combinations for advanced game controls (Ctrl+H, Shift+Space)
- Contextual controls that change based on game state
- Game instruction announcements for screen readers
- Performance testing for rapid key presses

### 4. `navigation-keyboard-navigation.test.js`

**Website navigation system keyboard accessibility:**

- Primary navigation structure with proper tab order
- Mobile menu keyboard navigation (Enter/Space to toggle, Escape to close)
- Dropdown/submenu navigation with arrow keys and Escape
- Breadcrumb navigation patterns
- Navigation state announcements for screen readers
- Focus management during navigation changes
- Responsive navigation patterns for different screen sizes
- ARIA labeling for navigation landmarks

### 5. `form-keyboard-navigation.test.js`

**Form control keyboard accessibility:**

- Tab and Shift+Tab navigation through form fields
- Radio button groups with roving tabindex and arrow key navigation
- Checkbox individual tab navigation
- Select dropdown navigation with arrow keys, Home/End, and letter keys
- Form validation error handling with focus management
- Complex form widgets (date pickers, time pickers)
- Label associations and help text integration
- Screen reader announcements for form states

### 6. `keyboard-navigation-test-suite.test.js`

**Master integration test suite:**

- Complete keyboard-only user journeys through the application
- Multi-modal interaction testing (sidebar, toolbar, tabs, content)
- Performance testing under heavy keyboard interaction
- Cross-browser keyboard compatibility
- Virtual keyboard considerations for mobile devices
- Comprehensive reporting and WCAG compliance validation

## WCAG 2.1 Guidelines Covered

These tests validate compliance with the following WCAG success criteria:

### Level A

- **2.1.1 Keyboard**: All functionality available from keyboard
- **2.1.2 No Keyboard Trap**: Users not trapped in any part of content
- **2.4.1 Bypass Blocks**: Skip links to bypass repeated content
- **2.4.3 Focus Order**: Logical and intuitive focus order
- **3.2.1 On Focus**: No unexpected context changes on focus
- **3.2.2 On Input**: No unexpected context changes on input

### Level AA

- **2.4.7 Focus Visible**: Visible focus indicators for all interactive elements

### Level AAA (Additional Coverage)

- **2.1.3 Keyboard (No Exception)**: All functionality available via keyboard without exceptions

## Running the Tests

### Individual Test Suites

```bash
# Run all keyboard navigation tests
npm test tests/accessibility/

# Run specific test suite
npm test tests/accessibility/comprehensive-keyboard-navigation.test.js
npm test tests/accessibility/modal-keyboard-navigation.test.js
npm test tests/accessibility/game-keyboard-navigation.test.js
npm test tests/accessibility/navigation-keyboard-navigation.test.js
npm test tests/accessibility/form-keyboard-navigation.test.js

# Run integration suite
npm test tests/accessibility/keyboard-navigation-test-suite.test.js
```

### With Coverage

```bash
npm test tests/accessibility/ -- --coverage
```

### Watch Mode for Development

```bash
npm test tests/accessibility/ -- --watch
```

## Test Features

### Keyboard Event Simulation

- **KeyboardEvent creation**: Proper key, keyCode, and which properties
- **Modifier keys**: Ctrl, Alt, Shift, Meta key combinations
- **Event bubbling**: Tests event propagation through DOM
- **preventDefault**: Validates proper event handling
- **Focus simulation**: Tracks focus changes and history

### Performance Monitoring

- **Focus timing**: Measures time to focus elements
- **Key response time**: Tracks keyboard event processing speed
- **Memory usage**: Monitors for memory leaks in keyboard handlers
- **Large dataset handling**: Tests performance with 1000+ focusable elements

### Cross-Browser Compatibility

- **Event property variations**: Handles browser differences in KeyboardEvent
- **Virtual keyboard support**: Tests inputmode attributes for mobile
- **Focus behavior differences**: Accounts for browser-specific focus handling

### Screen Reader Integration

- **ARIA announcements**: Validates aria-live region updates
- **State changes**: Tests aria-expanded, aria-selected announcements
- **Error announcements**: Validates form validation messaging
- **Navigation feedback**: Tests landmark and heading navigation announcements

## Test Data and Fixtures

### Mock Components

- **AccessibleComponent**: Enhanced base component with keyboard navigation
- **Modal**: Dialog component with focus trapping
- **FormComponent**: Form with validation and keyboard handling
- **Navigation**: Menu system with mobile responsive behavior

### Test Utilities

- **Focus tracking**: Records focus history and timing
- **Keyboard simulation**: Helper functions for key combinations
- **Accessibility auditing**: Automated compliance checking
- **Performance monitoring**: Metrics collection during tests

## Expected Outcomes

### All Tests Passing Indicates

✅ **Complete keyboard accessibility** - All interactive elements reachable via keyboard  
✅ **No keyboard traps** - Users can always navigate away from any component  
✅ **Logical focus order** - Tab navigation follows visual and logical flow  
✅ **Visible focus indicators** - Clear visual feedback for current focus  
✅ **Skip link functionality** - Efficient navigation bypassing repeated content  
✅ **Game accessibility** - Educational games fully playable with keyboard  
✅ **Form accessibility** - All form controls properly navigable and labeled  
✅ **Modal accessibility** - Dialogs trap focus and restore properly  
✅ **Navigation accessibility** - Menu systems work with keyboard and screen readers  
✅ **Performance standards** - Keyboard interactions remain responsive under load  
✅ **Cross-browser compatibility** - Consistent behavior across different browsers  
✅ **WCAG 2.1 Level AA compliance** - Meets accessibility standards

### Test Failure Debugging

When tests fail, check:

1. **Focus management**: Are elements receiving focus as expected?
2. **Event handling**: Are keyboard events being prevented/handled correctly?
3. **ARIA attributes**: Are accessibility properties set properly?
4. **Tab order**: Is the focus sequence logical?
5. **Performance**: Are operations completing within time limits?

## Integration with CI/CD

These tests are designed to run in continuous integration environments:

```bash
# CI test command
npm run test:accessibility

# Generate accessibility report
npm run test:accessibility -- --reporter=json > accessibility-report.json
```

The test suite generates comprehensive reports including:

- WCAG compliance status
- Performance metrics
- Coverage statistics
- Detailed failure analysis

## Maintenance Notes

### When Adding New Components

1. **Add keyboard navigation tests** to appropriate test file
2. **Update integration tests** in keyboard-navigation-test-suite.test.js
3. **Verify WCAG compliance** with automated audits
4. **Test cross-browser compatibility**
5. **Document keyboard shortcuts** in component documentation

### Performance Considerations

- Tests include performance benchmarks to prevent regression
- Large dataset tests ensure scalability
- Memory leak detection prevents accumulation issues
- Response time validation maintains user experience standards

This comprehensive test suite ensures that Learnimals provides an excellent keyboard navigation
experience for all users, including those who rely on keyboard-only interaction due to motor
disabilities or assistive technology usage.
