# Infrastructure Baseline

This baseline provides the minimal configuration infrastructure needed by development PRs while complementing the comprehensive production infrastructure in PR #283.

## Purpose

This minimal baseline resolves common configuration conflicts that affect multiple PRs without duplicating the production infrastructure provided by PR #283.

## What This Baseline Provides

### Core Development Configuration
- **ESLint Configuration** (`.eslintrc.cjs`)
  - Consistent code style across all PRs
  - Educational web app specific rules
  - Vitest environment support

- **Package Configuration** (`package.json`)
  - Essential development dependencies
  - Core scripts for development workflow
  - Testing framework setup

- **Testing Configuration** (`vitest.config.js`)
  - JSDOM environment for DOM testing
  - Code coverage reporting
  - Test file organization

### Relationship to PR #283

**This baseline (PR #284)** handles:
- Basic linting and code quality
- Testing framework configuration  
- Core development dependencies
- Essential npm scripts

**PR #283** handles:
- Production Docker infrastructure
- Kubernetes deployment configuration
- CI/CD pipelines and workflows
- Monitoring and security infrastructure
- Production build optimization

## Merge Strategy

1. **Merge this baseline first** to resolve configuration conflicts
2. **Merge PR #283** for production infrastructure
3. **Other PRs can then rebase** onto the combined baseline

## Files Included

```
.eslintrc.cjs              # ESLint configuration
package.json               # Core dependencies and scripts  
vitest.config.js          # Testing framework setup
tests/setup.js            # Test environment setup
BASELINE_README.md        # This documentation
```

## Benefits

- ✅ Resolves ESLint configuration conflicts across 9 PRs
- ✅ Provides consistent testing environment
- ✅ Enables development workflow scripts
- ✅ Complements (doesn't duplicate) PR #283 infrastructure
- ✅ Minimal footprint - only essential configuration

## For Developers

After this baseline is merged:
1. Rebase your PR onto the new main branch
2. Your PR will inherit consistent linting and testing
3. No need to duplicate configuration in your PR
4. Focus on your feature implementation

---

*This baseline works in partnership with PR #283 to provide complete development and production infrastructure for the Learnimals project.*