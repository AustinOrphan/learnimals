# Linting and Code Quality Guide

This document outlines the comprehensive linting and code quality setup for the Learnimals project.

## Overview

The project uses **ESLint** with multiple plugins for comprehensive code quality enforcement, plus **Prettier** for consistent code formatting.

## Tools and Plugins

### Core Tools
- **ESLint**: Primary linting engine
- **Prettier**: Code formatting
- **Husky**: Git hooks (future enhancement)

### ESLint Plugins
- **eslint-plugin-import**: Import/export validation
- **eslint-plugin-jsdoc**: Documentation standards
- **eslint-plugin-security**: Security vulnerability detection
- **eslint-plugin-unicorn**: Modern JavaScript practices
- **eslint-plugin-sonarjs**: Bug detection and code smell identification
- **eslint-plugin-promise**: Promise best practices
- **eslint-plugin-n**: Node.js specific rules

## Available Commands

### Linting Commands
```bash
# Lint all JavaScript files
npm run lint

# Fix auto-fixable linting issues
npm run lint:fix

# Strict linting with zero warnings allowed (CI mode)
npm run lint:check
```

### Formatting Commands
```bash
# Format all supported files
npm run format

# Check if files are properly formatted
npm run format:check
```

## Rule Categories

### 1. Error Prevention Rules
These rules prevent common JavaScript errors and bugs:

- **no-undef**: Prevent undefined variable usage
- **no-unused-vars**: Catch unused variables (with underscore exceptions)
- **no-unreachable**: Detect unreachable code
- **no-shadow**: Prevent variable shadowing
- **no-redeclare**: Prevent variable redeclaration

### 2. Code Quality Rules
These rules enforce good coding practices:

- **complexity**: Limit cyclomatic complexity (max 10, games allow 15)
- **max-depth**: Limit nesting depth (max 4)
- **max-lines**: Limit file length (max 300 lines)
- **max-lines-per-function**: Limit function length (max 50, games allow 75)
- **max-params**: Limit function parameters (max 4)

### 3. Modern JavaScript Rules
These rules encourage modern ES6+ practices:

- **prefer-const**: Use const for variables that don't change
- **no-var**: Prohibit var, use let/const instead
- **arrow-body-style**: Prefer concise arrow functions
- **template-literals**: Prefer template literals over string concatenation
- **object-shorthand**: Use ES6 object method shorthand

### 4. Import/Export Rules
These rules manage module imports:

- **import/order**: Enforce consistent import order
- **import/extensions**: Require file extensions for imports
- **no-duplicate-imports**: Prevent duplicate imports

### 5. Security Rules
These rules catch potential security vulnerabilities:

- **security/detect-unsafe-regex**: Detect ReDoS vulnerabilities
- **security/detect-eval-with-expression**: Prevent eval usage
- **security/detect-object-injection**: Warn about potential object injection
- **security/detect-non-literal-regexp**: Warn about dynamic regex

### 6. Documentation Rules (JSDoc)
These rules enforce good documentation:

- **jsdoc/require-description**: Require descriptions for functions/classes
- **jsdoc/require-param-description**: Require parameter descriptions
- **jsdoc/check-alignment**: Ensure proper JSDoc formatting

## File-Specific Overrides

### Test Files (`*.test.js`, `tests/**/*.js`)
Relaxed rules for test files:
- Magic numbers allowed (test data often contains specific values)
- Longer functions allowed (setup/teardown can be complex)
- Duplicate strings allowed (test descriptions often repeat)
- JSDoc not required

### Configuration Files (`*.config.js`, `.eslintrc.js`)
Node.js environment with relaxed rules:
- Console usage allowed
- JSDoc not required
- CommonJS modules allowed

### Component Files (`src/components/**/*.js`)
Stricter documentation requirements:
- JSDoc required for all public functions, methods, and classes
- Promotes better API documentation

### Game Files (`src/features/games/**/*.js`)
Relaxed complexity rules for games:
- Higher complexity allowed (games have complex logic)
- Longer functions allowed (game loops can be substantial)
- Magic numbers allowed (coordinates, speeds, etc.)

## Global Variables

The configuration includes comprehensive browser and testing globals:

### Browser APIs
- DOM manipulation: `document`, `window`, `Element`, etc.
- Canvas/Graphics: `HTMLCanvasElement`, `CanvasRenderingContext2D`, etc.
- Animation: `requestAnimationFrame`, `performance`, etc.
- Web APIs: `fetch`, `localStorage`, `WebSocket`, etc.

### Testing Globals (Vitest)
- Test functions: `describe`, `it`, `expect`, etc.
- Vitest utilities: `vi`, `beforeEach`, `afterEach`, etc.

## Integration with Prettier

ESLint and Prettier work together seamlessly:
- ESLint handles code quality and logic rules
- Prettier handles formatting and style
- The `prettier/prettier` rule ensures ESLint reports Prettier violations
- `eslint-config-prettier` disables conflicting ESLint formatting rules

## Continuous Integration

### Pre-commit Hooks (Future)
```bash
# Will be added with Husky
npm run lint:check && npm run format:check
```

### CI Pipeline Integration
```bash
# Add to CI pipeline
npm run lint:check
npm run format:check
npm run test
```

## IDE Integration

### VS Code
Recommended extensions:
- **ESLint** (Microsoft)
- **Prettier** (Prettier)
- **Error Lens** (usernamehw)

### VS Code Settings
Add to `.vscode/settings.json`:
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript"]
}
```

## Customization

### Adding New Rules
1. Install the plugin: `npm install --save-dev eslint-plugin-example`
2. Add to `.eslintrc.js` plugins array
3. Add rules to the rules section
4. Test with `npm run lint`

### File-Specific Overrides
Add new override blocks in `.eslintrc.js`:
```javascript
{
  files: ['src/specific-folder/**/*.js'],
  rules: {
    'rule-name': 'off'
  }
}
```

### Environment-Specific Rules
Use different configs for different environments:
```javascript
// In package.json
"lint:prod": "eslint src/ --env production",
"lint:dev": "eslint src/ --env development"
```

## Common Issues and Solutions

### 1. Import Resolution Errors
**Problem**: ESLint can't resolve imports
**Solution**: Imports work in browser; `import/no-unresolved` is disabled

### 2. Prettier Conflicts
**Problem**: ESLint and Prettier disagree on formatting
**Solution**: Run `npm run format` then `npm run lint:fix`

### 3. Too Many Warnings
**Problem**: Existing code has many linting issues
**Solution**: Use `npm run lint:fix` to auto-fix, then address remaining issues

### 4. JSDoc Requirements
**Problem**: Component files require JSDoc comments
**Solution**: Add proper JSDoc comments or adjust rules for specific files

### 5. Magic Numbers
**Problem**: Games and tests use many literal numbers
**Solution**: Numbers are allowed in game files; use constants for other files

## Performance Considerations

### Large Codebases
- Use `.eslintignore` to exclude unnecessary files
- Consider using `--cache` flag for faster subsequent runs
- Run linting in parallel during CI

### Memory Usage
- The current configuration uses multiple plugins
- Monitor memory usage with large files
- Consider disabling heavy rules if performance is critical

## Maintenance

### Regular Updates
- Update ESLint and plugins monthly
- Review new rules in plugin releases
- Test configuration changes thoroughly

### Rule Review
- Quarterly review of rule effectiveness
- Collect team feedback on rule strictness
- Adjust rules based on project evolution

## Best Practices

### 1. Fix Issues Early
- Run linting before commits
- Address warnings promptly
- Don't disable rules without good reason

### 2. Document Rule Changes
- Comment rule modifications in `.eslintrc.js`
- Document team decisions about rule exceptions
- Keep this guide updated

### 3. Team Consistency
- Ensure all team members use same ESLint version
- Share IDE configurations
- Regular team discussions about code quality

### 4. Gradual Adoption
- Start with error-level rules only
- Gradually increase warning rules to errors
- Allow time for team adjustment

## Troubleshooting

### Debug ESLint Configuration
```bash
# Check which config files are being used
npx eslint --print-config src/components/Modal.js

# Test specific rules
npx eslint --rule 'no-console: error' src/file.js

# Check what files are being linted
npx eslint --debug src/
```

### Common Error Messages

**"Parsing error: Unexpected token"**
- Check parser configuration in `.eslintrc.js`
- Ensure file is valid JavaScript

**"Definition for rule 'rule-name' was not found"**
- Plugin not installed or not added to plugins array

**"Environment key 'env-name' is unknown"**
- Check environment configuration

## Future Enhancements

### Planned Additions
1. **Husky Integration**: Pre-commit hooks
2. **Lint-staged**: Only lint changed files
3. **Custom Rules**: Project-specific rules
4. **Performance Monitoring**: Track linting performance
5. **Automated Fixes**: More sophisticated auto-fixing

### Potential Plugins
- **eslint-plugin-react**: If React is added
- **eslint-plugin-jest**: If Jest is used alongside Vitest
- **eslint-plugin-accessibility**: For a11y rules
- **eslint-plugin-performance**: Performance-focused rules

This comprehensive linting setup ensures code quality, consistency, and security across the Learnimals project while being flexible enough to accommodate different file types and use cases.