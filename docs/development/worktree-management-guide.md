# Git Worktree Management Guide for Learnimals

## Overview

This guide provides detailed instructions for managing git worktrees in the Learnimals project. The worktree system enables parallel development across multiple branches while maintaining isolation and preventing conflicts.

## Worktree Architecture

### Directory Structure
```
learnimals/                        # Original repository (main branch)
├── scripts/setup-worktrees.sh     # Worktree setup automation
├── CLAUDE.md                      # Updated with worktree requirements
└── docs/                          # Documentation and strategy

learnimals-worktrees/              # Worktree directory (created by script)
├── main/                          # Main development and testing
├── stabilization/                 # Infrastructure fixes (CRITICAL)
├── feature-development/           # New feature development
├── hotfix/                        # Emergency bug fixes
└── experimental/                  # Prototypes and experimentation
```

### Branch Strategy
- **main**: Primary integration branch
- **fix/infrastructure-stabilization**: Critical infrastructure fixes
- **develop**: Feature development branch
- **hotfix/emergency-fixes**: Emergency production fixes
- **experimental/new-features**: Experimental work and prototypes

## Setup and Installation

### Initial Setup
1. Navigate to the project root directory
2. Run the setup script:
   ```bash
   chmod +x scripts/setup-worktrees.sh
   ./scripts/setup-worktrees.sh
   ```
3. Verify worktree creation:
   ```bash
   git worktree list
   ```

### Post-Setup Configuration
Each worktree requires individual dependency installation:
```bash
# Install dependencies in each worktree
cd ../learnimals-worktrees/stabilization && npm install
cd ../learnimals-worktrees/feature-development && npm install
cd ../learnimals-worktrees/main && npm install
cd ../learnimals-worktrees/hotfix && npm install
cd ../learnimals-worktrees/experimental && npm install
```

## Development Workflows

### 1. Infrastructure Stabilization (CRITICAL PRIORITY)
**Purpose**: Fix blocking issues preventing MVP development
**Timeline**: 5 days maximum
**Branch**: `fix/infrastructure-stabilization`

```bash
cd ../learnimals-worktrees/stabilization
npm install

# Daily priorities (in order):
# Day 1: Fix testing framework (es-errors dependency)
# Day 2: Resolve ESLint errors (200+ issues)
# Day 3: Repair CI/CD pipeline
# Day 4: Update documentation and validation
# Day 5: Integration testing and handoff
```

**Exit Criteria**:
- [ ] All tests pass without dependency errors
- [ ] ESLint shows zero errors (warnings acceptable)
- [ ] CI/CD pipeline runs successfully
- [ ] All critical infrastructure blockers resolved

### 2. Feature Development
**Purpose**: Implement MVP features and core functionality
**Branch**: `develop`

```bash
cd ../learnimals-worktrees/feature-development
npm install

# Feature development workflow:
git checkout -b feature/subject-games
# Implement feature
git add . && git commit -m "feat: add math shark games"
git push origin feature/subject-games
```

**Feature Categories**:
- Subject-specific games (Math, Science, Reading, Art)
- Character system and progression
- User interface components
- Progress tracking and analytics

### 3. Emergency Hotfixes
**Purpose**: Critical production issues requiring immediate fixes
**Branch**: `hotfix/emergency-fixes`

```bash
cd ../learnimals-worktrees/hotfix
npm install

# Hotfix workflow:
git checkout -b hotfix/critical-bug-fix
# Fix the issue
git add . && git commit -m "hotfix: resolve critical issue"
git push origin hotfix/critical-bug-fix
```

**Hotfix Criteria**:
- Security vulnerabilities
- Critical functionality broken
- Data loss prevention
- Performance issues affecting user experience

### 4. Experimental Development
**Purpose**: Research, prototypes, and experimental features
**Branch**: `experimental/new-features`

```bash
cd ../learnimals-worktrees/experimental
npm install

# Experimental workflow:
git checkout -b experiment/ai-adaptive-learning
# Prototype new ideas
git add . && git commit -m "experiment: AI-powered learning adaptation"
```

**Experimental Work Types**:
- New technology evaluation
- Advanced feature prototypes
- Performance optimization experiments
- Alternative implementation approaches

## Integration and Merge Strategy

### Development Integration Process
```bash
# 1. Complete feature development
cd ../learnimals-worktrees/feature-development
git add . && git commit -m "feat: complete feature implementation"
git push origin develop

# 2. Switch to main for integration
cd ../learnimals-worktrees/main
git pull origin main
git merge develop

# 3. Run integration tests
npm test
npm run lint

# 4. Push integration if successful
git push origin main
```

### Stabilization to Main Integration
```bash
# 1. Complete stabilization work
cd ../learnimals-worktrees/stabilization
git add . && git commit -m "fix: resolve infrastructure issues"
git push origin fix/infrastructure-stabilization

# 2. Switch to main for integration
cd ../learnimals-worktrees/main
git pull origin main
git merge fix/infrastructure-stabilization

# 3. Comprehensive testing
npm install
npm test
npm run lint
npm run test:coverage

# 4. Push if all tests pass
git push origin main
```

### Hotfix Integration
```bash
# Hotfixes merge directly to main and develop
cd ../learnimals-worktrees/hotfix
git push origin hotfix/emergency-fixes

# Merge to main
cd ../learnimals-worktrees/main
git pull origin main
git merge hotfix/emergency-fixes
git push origin main

# Merge to develop to keep branches in sync
cd ../learnimals-worktrees/feature-development
git pull origin develop
git merge hotfix/emergency-fixes
git push origin develop
```

## Daily Development Practices

### Morning Startup Routine
1. Check worktree status:
   ```bash
   git worktree list
   ```
2. Navigate to appropriate worktree for the day's work
3. Pull latest changes:
   ```bash
   git pull origin <branch-name>
   ```
4. Install any new dependencies:
   ```bash
   npm install
   ```
5. Run tests to ensure clean starting state:
   ```bash
   npm test
   ```

### End of Day Routine
1. Commit current work:
   ```bash
   git add .
   git commit -m "wip: describe current progress"
   ```
2. Push to remote branch:
   ```bash
   git push origin <branch-name>
   ```
3. Document any blockers or next steps
4. Clean up any experimental files

### Code Quality Checks
Run these commands in each worktree before committing:
```bash
# Linting
npm run lint:fix

# Testing
npm test

# Type checking (if applicable)
npm run typecheck

# Coverage check
npm run test:coverage
```

## Worktree Maintenance

### Listing Worktrees
```bash
# View all worktrees and their status
git worktree list

# View with detailed branch information
git worktree list --porcelain
```

### Cleaning Up Worktrees
```bash
# Remove unused worktree
git worktree remove <worktree-name>

# Force remove if there are uncommitted changes
git worktree remove --force <worktree-name>

# Prune deleted worktree references
git worktree prune
```

### Adding New Worktrees
```bash
# Add new worktree for specific purpose
git worktree add ../learnimals-worktrees/performance-optimization performance/optimization

# Add worktree from existing remote branch
git worktree add ../learnimals-worktrees/feature-xyz origin/feature-xyz
```

### Troubleshooting Common Issues

#### Issue: Worktree Won't Start
```bash
# Check git status
cd ../learnimals-worktrees/problematic-worktree
git status

# Resolve any conflicts or issues
git reset --hard HEAD

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Issue: Dependencies Out of Sync
```bash
# Update all worktrees with latest package.json
cd ../learnimals-worktrees/main && npm install
cd ../learnimals-worktrees/stabilization && npm install
cd ../learnimals-worktrees/feature-development && npm install
cd ../learnimals-worktrees/hotfix && npm install
cd ../learnimals-worktrees/experimental && npm install
```

#### Issue: Branch Conflicts
```bash
# Check which branches are checked out
git worktree list

# If multiple worktrees are on same branch, switch one
cd ../learnimals-worktrees/conflicting-worktree
git checkout -b new-branch-name
```

## Best Practices

### Development Efficiency
1. **Use appropriate worktree**: Match worktree to task type
2. **Keep work isolated**: Don't depend on files from other worktrees
3. **Regular commits**: Commit frequently with descriptive messages
4. **Clean separation**: Don't mix feature types in single worktree
5. **Test in context**: Run tests in the worktree where you're developing

### Code Organization
1. **Feature branches**: Create feature branches from develop
2. **Hotfix branches**: Create hotfix branches from main
3. **Experimental branches**: Keep experiments in experimental worktree
4. **Documentation**: Update docs in main or dedicated doc branches

### Communication
1. **Status updates**: Share which worktree you're working in
2. **Merge notifications**: Announce when merging to shared branches
3. **Blocker reporting**: Report issues that affect other worktrees
4. **Integration coordination**: Coordinate major merges with team

## Success Metrics

### Development Velocity
- Parallel development without conflicts
- Faster context switching between tasks
- Reduced merge conflicts and integration issues
- Independent testing and validation

### Code Quality
- Isolated testing environments
- Better separation of concerns
- Reduced cross-contamination of features
- Cleaner git history and branch management

### Team Coordination
- Clear work separation by worktree
- Better understanding of current team focus
- Reduced blocking between developers
- Improved integration and deployment processes

## Emergency Procedures

### Critical System Recovery
If the worktree system becomes corrupted:
1. Navigate to original repository
2. Remove corrupted worktrees:
   ```bash
   rm -rf ../learnimals-worktrees
   git worktree prune
   ```
3. Re-run setup script:
   ```bash
   ./scripts/setup-worktrees.sh
   ```
4. Restore work from remote branches:
   ```bash
   cd ../learnimals-worktrees/stabilization
   git pull origin fix/infrastructure-stabilization
   npm install
   ```

### Data Recovery
If uncommitted work is lost:
1. Check git reflog in affected worktree
2. Look for backup commits or stashes
3. Check if work exists in other worktrees
4. Restore from recent remote pushes

This comprehensive guide ensures that all team members can effectively use the git worktree system to maximize development efficiency while maintaining code quality and project organization.