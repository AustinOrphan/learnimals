# Detailed Git Rebase Strategy for Character Generation Infrastructure

## Current Branch Status

- **Current Branch**: `feature/phase-d-character-generator`
- **Target Branch**: `main`
- **Major Changes**: Infrastructure updates, character generation system, testing framework, security fixes

## Pre-Rebase Validation Steps

### 1. Assess Current State

```bash
# Check current branch and status
git status
git log --oneline -10

# Verify main branch is up to date
git fetch origin
git checkout main
git pull origin main

# Return to feature branch
git checkout feature/phase-d-character-generator
```

### 2. Run Full Test Suite

```bash
# Run linting to identify issues
npm run lint

# Run all tests to ensure current functionality works
npm test

# Test key components manually
# - Open character-generator-demo.html
# - Test CustomizationStudio opens correctly
# - Verify template creation works
# - Test random character generation
```

### 3. Create Safety Backup

```bash
# Create backup branch
git checkout -b backup/feature-phase-d-character-generator-$(date +%Y%m%d)
git checkout feature/phase-d-character-generator
```

## Three-Phase Rebase Strategy

### Phase 1: Infrastructure Foundation

**Goal**: Establish core infrastructure that other changes depend on

#### Files to Rebase First

1. `tests/setup.js` - Test environment foundation
2. `src/components/BaseComponent.js` - Core component updates
3. `src/components/ui/Modal.js` - XSS security fixes
4. `src/features/character-generation/schemas/CharacterSchema.js` - Core schema updates

#### Commands

```bash
# Interactive rebase to reorganize commits
git rebase -i main

# In the interactive editor, reorganize commits:
# 1. Move infrastructure commits to the top
# 2. Squash related infrastructure commits together
# 3. Keep security fixes as separate commits for audit trail
```

#### Validation After Phase 1

```bash
# Verify basic infrastructure works
npm run lint
npm test -- tests/setup.js
node -e "console.log('BaseComponent check:', typeof window !== 'undefined' ? 'browser' : 'node')"
```

### Phase 2: Character Generation System

**Goal**: Integrate the complete character generation feature

#### Files to Rebase

1. `src/features/character-generation/` (entire directory)
2. Character generation demo pages
3. CSS files for character components
4. Integration points with existing gallery

#### Commands

```bash
# Continue rebase for feature commits
# Group commits by logical functionality:
# - Character factory and validation
# - UI components (CustomizationStudio, etc.)
# - Demo pages and integration
# - Bug fixes for reliability issues

# Squash commits within each logical group
# Keep separate commits for each major component
```

#### Validation After Phase 2

```bash
# Test character generation system
npm test -- tests/debug-character.test.js
node -e "
  import('./src/features/character-generation/index.js')
    .then(system => console.log('System loaded:', Object.keys(system)))
    .catch(err => console.error('Load failed:', err))
"

# Manual testing
# - Open character demo pages
# - Test character creation
# - Verify CustomizationStudio functionality
```

### Phase 3: Testing Infrastructure

**Goal**: Integrate comprehensive test suite

#### Files to Rebase

1. `tests/unit/characterGeneration.test.js`
2. `tests/unit/characterGenerationRegression.test.js`
3. `docs/character-generation-bugs.md`
4. Any test configuration updates

#### Commands

```bash
# Final rebase phase for testing
# Group test-related commits:
# - Unit tests
# - Regression tests
# - Documentation
# - Test fixes and improvements
```

#### Validation After Phase 3

```bash
# Run complete test suite
npm test
npm run lint

# Verify all regression tests pass
npm test -- tests/unit/characterGenerationRegression.test.js

# Check test coverage and reliability
npm test -- --reporter=verbose
```

## Conflict Resolution Strategy

### Expected Conflicts

1. **BaseComponent.js**: ES6 vs script tag loading
2. **Modal.js**: XSS prevention changes
3. **Package.json**: Test script additions
4. **Index files**: New feature exports

### Resolution Approach

```bash
# For each conflict:
git status  # Identify conflicted files
git diff --name-only --diff-filter=U  # List unmerged files

# Resolve conflicts manually, prioritizing:
# 1. Security fixes (keep all XSS prevention)
# 2. Infrastructure improvements (keep test setup enhancements)
# 3. Feature additions (merge new character generation code)

# After resolving each file:
git add <resolved-file>

# Continue rebase:
git rebase --continue
```

## Post-Rebase Validation Checklist

### 1. Code Quality

```bash
# Linting should pass completely
npm run lint

# Fix any remaining linting issues
npm run lint:fix
```

### 2. Test Suite

```bash
# All tests should pass
npm test

# Specific test categories
npm test -- tests/unit/
npm test -- tests/debug-character.test.js
```

### 3. Manual Functionality Testing

- [ ] Character generator demo opens
- [ ] CustomizationStudio launches successfully
- [ ] Template creation works
- [ ] Random character generation reliable
- [ ] All 12 subjects have complete data
- [ ] XSS prevention active in Modal

### 4. Integration Testing

```bash
# Test in browser environment
# Open multiple demo pages
# Verify no console errors
# Test cross-component functionality
```

## Emergency Rollback Plan

If rebase encounters major issues:

```bash
# Abort current rebase
git rebase --abort

# Switch to backup branch
git checkout backup/feature-phase-d-character-generator-$(date +%Y%m%d)

# Alternative: Reset to pre-rebase state
git reflog  # Find pre-rebase commit
git reset --hard <pre-rebase-commit-hash>
```

## Final Integration Steps

After successful rebase:

```bash
# Final validation
npm run lint
npm test

# Push rebased branch
git push origin feature/phase-d-character-generator --force-with-lease

# Create pull request with detailed description of changes
gh pr create --title "feat: Character Generation System with Infrastructure Updates" \
  --body "Complete character generation system with testing infrastructure and security fixes"
```

## Success Criteria

Rebase is successful when:

- [ ] All commits are cleanly organized by logical phases
- [ ] No linting errors remain
- [ ] Complete test suite passes (>95% success rate)
- [ ] Manual testing confirms all features work
- [ ] Security fixes are preserved
- [ ] Infrastructure improvements are intact
- [ ] Character generation system is fully functional
