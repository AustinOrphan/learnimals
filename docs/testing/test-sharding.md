# Test Sharding Guide

This document explains the test sharding system implemented for the Learnimals project to improve CI/CD performance through parallel test execution.

## Overview

Test sharding splits the test suite into multiple balanced groups (shards) that can run in parallel, significantly reducing the total test execution time. The system uses a weight-based algorithm to ensure even distribution of test execution time across shards.

## How It Works

### 1. Test Categorization

Tests are categorized by type with relative execution weights:

- **Unit tests** (weight: 1) - Fast, isolated tests
- **Component tests** (weight: 2) - Moderate speed, DOM testing
- **Integration tests** (weight: 3) - Slower, multiple components
- **Navigation tests** (weight: 2) - DOM and routing
- **Security tests** (weight: 2) - Security checks
- **Performance tests** (weight: 4) - Performance measurements
- **E2E tests** (weight: 5) - Full browser tests

### 2. Shard Distribution Algorithm

The sharding script uses a greedy algorithm to distribute tests:

1. Sort all test files by their weighted cost (category weight + file size)
2. Assign each test file to the shard with the lowest current total weight
3. This ensures balanced execution time across all shards

### 3. CI/CD Integration

The GitHub Actions workflow runs tests in parallel:

```yaml
strategy:
  matrix:
    node-version: [20, 22, 23]
    shard: [0, 1, 2, 3] # 4 shards
```

This creates 12 parallel jobs (3 Node versions × 4 shards).

## Usage

### Local Development

#### Run tests for a specific shard

```bash
# Run shard 0 (of 4 total shards)
SHARD_COUNT=4 SHARD_INDEX=0 npm run test:shard

# Run shard 1
SHARD_COUNT=4 SHARD_INDEX=1 npm run test:shard
```

#### View sharding report

```bash
npm run test:shard:report
```

This shows how tests are distributed across shards:

```
Test Sharding Report
===================

Shard 1:
  Files: 206
  Weight: 324.50
  Categories:
    - unit: 150 files
    - components: 30 files
    - integration: 26 files

Shard 2:
  Files: 205
  Weight: 323.75
  Categories:
    - unit: 148 files
    - components: 32 files
    - navigation: 25 files
...
```

#### List files for a specific shard

```bash
# Human-readable list
SHARD_INDEX=0 node scripts/test-sharding.js --list

# JSON format for tooling
SHARD_INDEX=0 node scripts/test-sharding.js --list --json

# As glob pattern for vitest
SHARD_INDEX=0 node scripts/test-sharding.js --pattern
```

### CI/CD Pipeline

In GitHub Actions, sharding is automatic:

1. Each job is assigned a shard index (0-3)
2. The test sharding script determines which tests to run
3. Tests execute with appropriate reporters
4. Coverage is collected only from shard 0 on Node 20

### Configuration

#### Environment Variables

- `SHARD_COUNT`: Total number of shards (default: 4)
- `SHARD_INDEX`: Current shard index, 0-based (default: 0)

#### Vitest Configuration

The `vitest.config.js` includes parallel execution settings:

```javascript
pool: process.env.CI ? 'forks' : 'threads',
poolOptions: {
  threads: {
    maxThreads: process.env.CI ? 2 : 4
  },
  forks: {
    maxForks: process.env.CI ? 2 : 4
  }
}
```

## Performance Benefits

### Before Sharding

- Sequential execution of all test suites
- Total time: ~20-30 minutes per Node version
- 3 Node versions = ~60-90 minutes total

### After Sharding

- Parallel execution across 4 shards
- Total time: ~5-8 minutes per Node version
- All Node versions run in parallel
- **Total CI time: ~5-8 minutes** (10-15x improvement)

## Adding New Tests

When adding new test files:

1. Place them in the appropriate directory (unit, integration, etc.)
2. The sharding algorithm automatically includes them
3. Run `npm run test:shard:report` to verify distribution
4. If imbalance occurs, adjust category weights in `test-sharding.js`

## Troubleshooting

### Uneven Shard Distribution

If shards have significantly different execution times:

1. Check the sharding report for file distribution
2. Adjust category weights in `SHARD_CONFIG.categories`
3. Consider splitting large test files
4. Move slow tests to a higher-weight category

### Tests Not Running

If tests are missing from shards:

1. Verify glob patterns in `SHARD_CONFIG.categories`
2. Check that test files match naming convention (`*.test.js`)
3. Run sharding script with `--list` to see file assignment

### CI Pipeline Issues

Common CI problems and solutions:

1. **Shard fails with "No test files"**: Normal if shard has no assigned tests
2. **Coverage missing**: Only collected from shard 0, Node 20
3. **Artifacts incomplete**: Check each shard's artifact upload

## Best Practices

1. **Keep test files focused**: Smaller files distribute better
2. **Use consistent naming**: Follow `*.test.js` pattern
3. **Monitor execution time**: Run sharding report regularly
4. **Adjust weights as needed**: Based on actual execution times
5. **Leverage parallelism**: Write independent tests that can run in any order

## Advanced Configuration

### Custom Shard Count

To use a different number of shards:

1. Update CI workflow matrix: `shard: [0, 1, 2, 3, 4, 5]`
2. Set `SHARD_COUNT=6` in environment
3. Adjust thread/fork limits if needed

### Category Weights

Modify weights based on your test characteristics:

```javascript
categories: {
  unit: { weight: 1, pattern: 'tests/unit/**/*.test.js' },
  integration: { weight: 5, pattern: 'tests/integration/**/*.test.js' },
  // Add custom categories
  slowTests: { weight: 10, pattern: 'tests/slow/**/*.test.js' }
}
```

### Debugging

Enable detailed logging:

```bash
# See which files go to which shard
DEBUG=sharding node scripts/test-sharding.js --report

# Track execution in CI
- name: Debug sharding
  run: |
    echo "Shard $SHARD_INDEX of $SHARD_COUNT"
    node scripts/test-sharding.js --list
```

## Resources

- [Vitest Parallel Execution](https://vitest.dev/guide/improving-performance.html#sharding)
- [GitHub Actions Matrix Strategy](https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs)
- [Test Sharding Best Practices](https://martinfowler.com/articles/practical-test-pyramid.html)
