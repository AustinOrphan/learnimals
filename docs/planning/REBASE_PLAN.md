# Character Generation System Rebase Plan

## Current Situation
- **Branch**: `feature/phase-d-character-generator`
- **Target**: `main` (at commit 76e2906)
- **Status**: 55+ new files + 6 modified files need rebasing

## Pre-Rebase Validation

### 1. Current State Assessment
```bash
# Verify we're on the right branch
git branch --show-current
# Should show: feature/phase-d-character-generator

# Check modified files that need staging
git status --porcelain
```

### 2. Test Current Functionality
```bash
# Run linting (expect some issues - they'll be fixed during rebase)
npm run lint 2>&1 | tee lint-pre-rebase.log

# Test core character generation
npm test -- tests/debug-character.test.js
npm test -- tests/unit/characterGeneration.test.js

# Manual test: Open character-generator-demo.html in browser
# Verify: CustomizationStudio opens, character creation works
```

### 3. Create Safety Backup
```bash
# Create timestamped backup branch
git add . && git stash push -m "Pre-rebase stash"
git checkout -b backup/feature-phase-d-$(date +%Y%m%d-%H%M)
git checkout feature/phase-d-character-generator
git stash pop
```

## Rebase Execution Plan

### Phase 1: Stage All Changes
```bash
# Add all new files and modifications
git add .

# Create a comprehensive commit for everything
git commit -m "feat: Complete character generation system with infrastructure

- Character generation core system (CharacterFactory, validation, schemas)
- CustomizationStudio with drag-and-drop interface  
- Character gallery and preview components
- Comprehensive test suite (unit + regression tests)
- Demo pages and integration examples
- Bug fixes for reliability and security (XSS prevention)
- Enhanced BaseComponent for module compatibility
- Complete subject templates for all 12 subjects

Includes infrastructure improvements:
- Enhanced test setup with proper mocking
- Modal XSS security fixes
- Character schema updates with dynamic timestamps
- Documentation and regression test coverage"
```

### Phase 2: Interactive Rebase for Organization
```bash
# Start interactive rebase from main
git rebase -i main

# In the editor, organize commits:
# 1. Keep infrastructure/security commits at top
# 2. Group character generation features
# 3. Keep test commits together
# 4. Maintain logical order for reviewability
```

### Phase 3: Conflict Resolution Strategy

**Expected Conflicts:**
1. **BaseComponent.js**: Module export vs script tag compatibility
2. **Modal.js**: XSS prevention changes
3. **tests/setup.js**: Enhanced test mocking

**Resolution Approach:**
- Keep all security improvements (XSS prevention)
- Preserve module compatibility enhancements
- Maintain test infrastructure improvements
- Resolve in favor of new character generation features

### Phase 4: Post-Rebase Validation
```bash
# Verify clean rebase
git status
git log --oneline -10

# Run full test suite
npm run lint
npm test

# Test specific functionality
npm test -- tests/unit/characterGeneration.test.js
npm test -- tests/unit/characterGenerationRegression.test.js

# Manual testing checklist:
# - Character generator demo opens
# - CustomizationStudio launches
# - Template creation works  
# - Random character generation reliable
# - No console errors in browser
```

## Commit Organization Strategy

After rebase, commits should be organized as:

1. **Infrastructure Foundation**
   - Enhanced test setup and mocking
   - BaseComponent module compatibility fixes
   - Modal XSS security improvements

2. **Character Generation Core**
   - Character schemas and validation system
   - CharacterFactory with bug fixes
   - Subject templates for all 12 subjects

3. **UI Components**
   - CustomizationStudio implementation
   - Character gallery and preview components
   - Demo pages and integration

4. **Testing Infrastructure**
   - Comprehensive unit test suite
   - Regression tests for bug prevention
   - Documentation and validation tools

## Success Criteria

Rebase is successful when:
- [ ] All commits are cleanly applied to main
- [ ] No merge conflicts remain unresolved
- [ ] `npm run lint` passes completely
- [ ] `npm test` shows >95% success rate
- [ ] Manual testing confirms all features work
- [ ] Character generation system is fully functional
- [ ] CustomizationStudio opens and operates correctly
- [ ] All 12 subjects have complete templates and data

## Emergency Rollback

If major issues occur:
```bash
# Abort rebase
git rebase --abort

# Switch to backup branch
git checkout backup/feature-phase-d-$(date +%Y%m%d-%H%M)

# Or reset to pre-rebase state via reflog
git reflog | head -20
git reset --hard <pre-rebase-commit>
```

## Next Steps After Successful Rebase

1. Final validation testing
2. Fix any remaining linting issues
3. Push rebased branch with `--force-with-lease`
4. Create detailed PR with infrastructure changes documented
5. Continue with M2.1: Progress Tracking System