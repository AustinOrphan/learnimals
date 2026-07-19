# Test Artifacts Guide

This document explains the test artifact system for the Learnimals project, including how artifacts are generated, stored, and accessed.

## Overview

Test artifacts are files generated during test execution that provide detailed information about test results, coverage, logs, and screenshots. These artifacts are crucial for debugging test failures and tracking test quality over time.

## Types of Test Artifacts

### 1. Test Results

- **JUnit XML Reports**: Machine-readable test results for each test suite
- **JSON Reports**: Detailed test execution data
- **Summary Reports**: Human-readable markdown summaries

### 2. Coverage Reports

- **HTML Coverage**: Interactive coverage browser
- **LCOV Data**: Line coverage information
- **Coverage Summary**: JSON file with coverage percentages

### 3. Logs and Debug Info

- **Test Logs**: Console output from test execution
- **Error Logs**: Detailed error messages and stack traces
- **Debug Screenshots**: For E2E test failures

### 4. Combined Reports

- **All Test Results**: Aggregated results from all test suites
- **Test Dashboard**: HTML index for easy navigation

## CI/CD Artifact Generation

### GitHub Actions Workflow

Artifacts are automatically generated during CI runs:

1. **Individual Test Suites**: Each test suite generates its own artifacts
   - Naming: `test-results-{suite}-node{version}`
   - Contents: Reports, logs, suite-specific data

2. **Coverage Artifacts**: Generated for unit tests only
   - Naming: `coverage-report`
   - Contents: HTML report, LCOV data, summary JSON

3. **Combined Artifacts**: Aggregated after all tests complete
   - Naming: `all-test-results-combined`
   - Contents: All test results, unified reports, index page

### Artifact Structure

```
test-artifacts/
├── unit/
│   ├── reports/
│   │   ├── junit.xml
│   │   └── test-results.json
│   ├── coverage/
│   │   ├── index.html
│   │   ├── lcov.info
│   │   └── coverage-summary.json
│   └── summary.json
├── integration/
│   ├── reports/
│   └── logs/
├── e2e/
│   ├── reports/
│   ├── screenshots/
│   └── videos/
└── README.md
```

## Accessing Test Artifacts

### 1. GitHub Actions UI

1. Navigate to the Actions tab in GitHub
2. Click on a workflow run
3. Scroll to "Artifacts" section
4. Download individual artifacts or all as ZIP

### 2. GitHub CLI

Use the provided script to download artifacts:

```bash
# Download artifacts from the latest run
./scripts/download-test-artifacts.sh

# Download artifacts from a specific run
./scripts/download-test-artifacts.sh 1234567890
```

### 3. GitHub Pages

Test results are automatically published to GitHub Pages:

- URL: `https://[username].github.io/learnimals/test-results/`
- Updated on every main branch build
- Includes coverage reports and test dashboard

### 4. Pull Request Comments

- Automated comments on PRs with test summaries
- Direct links to detailed reports
- Coverage metrics and thresholds

## Local Development

### Generating Artifacts Locally

```bash
# Run tests with artifact generation
npm test -- --reporter=junit --outputFile=test-results.xml

# Generate coverage artifacts
npm run test:coverage

# View coverage report
npm run coverage:open
```

### Viewing Local Artifacts

After running tests locally:

```bash
# Coverage report
open coverage/index.html

# Test results (if using reporter)
cat test-results.xml
```

## Artifact Retention

- **Default Retention**: 30 days
- **Coverage Reports**: Kept for successful main branch builds
- **Failed Test Artifacts**: Priority retention for debugging

## Best Practices

### 1. Screenshots for E2E Tests

Always capture screenshots on failure:

```javascript
afterEach(async function () {
  if (this.currentTest.state === 'failed') {
    await page.screenshot({
      path: `screenshots/${this.currentTest.title}.png`,
    });
  }
});
```

### 2. Meaningful Test Names

Use descriptive test names for better artifact organization:

```javascript
describe('User Authentication', () => {
  it('should successfully login with valid credentials', () => {
    // Test that generates clear artifacts
  });
});
```

### 3. Log Important Information

Add console logs for debugging:

```javascript
console.log('Test context:', {
  user: testUser.id,
  timestamp: Date.now(),
});
```

## Troubleshooting

### Artifacts Not Generated

1. Check workflow logs for errors
2. Ensure `always()` condition on upload steps
3. Verify artifact paths are correct

### Large Artifact Sizes

1. Use compression (level 9 in upload-artifact)
2. Exclude unnecessary files (node_modules, etc.)
3. Limit screenshot/video capture to failures only

### Can't Access Artifacts

1. Check GitHub permissions
2. Ensure workflow completed (even if failed)
3. Verify retention period hasn't expired

## Advanced Features

### Custom Artifact Reports

Create custom HTML reports:

```javascript
const report = {
  summary: testResults,
  timestamp: new Date(),
  environment: process.env,
};

fs.writeFileSync('custom-report.html', generateHTMLReport(report));
```

### Artifact Comparison

Compare test results between runs:

```bash
# Download artifacts from two runs
./scripts/download-test-artifacts.sh 12345
./scripts/download-test-artifacts.sh 67890

# Compare coverage
diff test-artifacts-12345/coverage/coverage-summary.json \
     test-artifacts-67890/coverage/coverage-summary.json
```

### Integration with External Services

Artifacts can be sent to external services:

- **Test Management Tools**: Upload JUnit XML
- **Coverage Services**: Send LCOV data to Codecov
- **Monitoring**: Push metrics to dashboards

## Security Considerations

- Never include sensitive data in artifacts
- Artifacts are public in public repositories
- Use artifact encryption for sensitive projects
- Regularly clean up old artifacts

## Resources

- [GitHub Actions Artifacts Documentation](https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts)
- [JUnit XML Format](https://junit.org/junit5/docs/current/user-guide/#xml-output)
- [LCOV Coverage Format](https://github.com/linux-test-project/lcov)
