# Test Coverage Reporting

This document describes the test coverage reporting system for the Learnimals project.

## Overview

Test coverage helps us understand what parts of our code are tested and identify areas that need more test coverage. We use Vitest with the V8 coverage provider to generate coverage reports.

## Coverage Thresholds

Our project enforces the following minimum coverage thresholds:

- **Lines**: 80%
- **Statements**: 80%
- **Functions**: 80%
- **Branches**: 80%

These thresholds are configured in `vitest.config.js` and enforced in the CI pipeline.

## Running Coverage Locally

### Quick Coverage Report

```bash
# Run unit tests with coverage and open report in browser
npm run coverage:report
```

This command will:
1. Run unit tests with coverage enabled
2. Generate coverage reports in multiple formats
3. Display a coverage summary in the terminal
4. Open the HTML coverage report in your browser

### Manual Coverage Commands

```bash
# Run all tests with coverage
npm run test:coverage

# Run only unit tests with coverage
npm run test:coverage:unit

# Run only integration tests with coverage
npm run test:coverage:integration

# Generate all coverage formats
npm run test:coverage:all

# Open existing coverage report
npm run coverage:open
```

## Coverage Reports

Coverage reports are generated in multiple formats:

### 1. Terminal Output
Shows a summary table with coverage percentages for each file.

### 2. HTML Report
Located at `coverage/index.html`. Provides an interactive interface to:
- View coverage by file
- See line-by-line coverage
- Identify uncovered code blocks

### 3. LCOV Report
Located at `coverage/lcov.info`. Used by:
- CI/CD pipeline
- Code coverage services (Codecov)
- IDE extensions

### 4. JSON Report
Located at `coverage/coverage-summary.json`. Machine-readable format used by:
- CI quality gates
- Badge generation
- Automated reporting

## CI/CD Integration

### GitHub Actions

Coverage is automatically generated and reported in our CI pipeline:

1. **Unit Test Job**: Runs tests with coverage enabled
2. **Coverage Report**: Processes and displays coverage metrics
3. **Quality Gates**: Enforces minimum coverage thresholds
4. **PR Comments**: Posts coverage summary on pull requests
5. **Artifacts**: Uploads coverage reports for download

### Coverage Badge

The coverage badge is automatically updated on successful builds to the main branch.

### GitHub Pages

HTML coverage reports are automatically deployed to GitHub Pages for easy viewing:
- URL: `https://[username].github.io/learnimals/coverage/`

## Viewing Coverage in Pull Requests

Each pull request automatically receives:

1. **Coverage Comment**: A table showing coverage metrics
2. **File Details**: Expandable section with file-level coverage
3. **Status Checks**: Pass/fail based on coverage thresholds
4. **Artifacts**: Downloadable coverage reports

## Improving Coverage

### Identifying Gaps

1. Run coverage locally: `npm run coverage:report`
2. Open the HTML report
3. Look for files with low coverage (shown in red)
4. Click on files to see uncovered lines

### Writing Tests for Coverage

Focus on:
- **Uncovered Functions**: Add tests for untested functions
- **Uncovered Branches**: Test all conditional paths
- **Error Handling**: Test error cases and edge conditions
- **Integration Points**: Test component interactions

### Coverage Best Practices

1. **Quality over Quantity**: Don't write tests just for coverage
2. **Test Behavior**: Focus on testing functionality, not implementation
3. **Edge Cases**: Test boundary conditions and error scenarios
4. **Refactor**: Sometimes low coverage indicates complex code that needs refactoring

## Troubleshooting

### Coverage Not Generated

```bash
# Check if coverage folder exists
ls -la coverage/

# Run with verbose output
npx vitest run --coverage --reporter=verbose

# Check vitest config
cat vitest.config.js
```

### Coverage Below Threshold

1. Check the coverage report to identify gaps
2. Write tests for uncovered code
3. Run coverage again to verify improvement

### CI Coverage Failures

1. Check the GitHub Actions logs
2. Download coverage artifacts from the failed run
3. Compare with local coverage results

## Configuration

### Vitest Configuration

Coverage settings in `vitest.config.js`:

```javascript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  exclude: [
    'node_modules/',
    'tests/',
    '**/*.config.js',
    // ... other exclusions
  ],
  thresholds: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  }
}
```

### Excluding Files

Add files to the `exclude` array in `vitest.config.js` to exclude them from coverage:
- Test files
- Configuration files
- Generated code
- Third-party libraries

## Resources

- [Vitest Coverage Documentation](https://vitest.dev/guide/coverage.html)
- [V8 Coverage Provider](https://vitest.dev/guide/coverage.html#coverage-providers)
- [Istanbul Coverage Reports](https://istanbul.js.org/)