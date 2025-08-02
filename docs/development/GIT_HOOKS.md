# Git Hooks Documentation

## Overview

This document describes the custom Git hooks implemented in the Learnimals project to maintain code quality and prevent common issues.

## Pre-commit Hook

Our pre-commit hook runs automatically before each commit and performs several quality checks to ensure code consistency and prevent common issues.

### Checks Performed

#### 1. Duplicate File Detection
- **Purpose**: Prevents committing iCloud sync conflict files
- **Patterns Detected**:
  - Files ending with numbers: `file 2.js`, `file 3.html`
  - Files with copy markers: `file (copy).js`
  - Files with conflict markers: `file-conflict.css`
- **Action**: Blocks commit if duplicates found
- **Resolution**: Use provided instructions to merge and clean duplicates

#### 2. Merge Conflict Detection
- **Purpose**: Prevents committing unresolved merge conflicts
- **Patterns Detected**:
  - Git conflict markers: `<<<<<<<`, `=======`, `>>>>>>>`
- **Action**: Blocks commit if conflict markers found
- **Resolution**: Resolve all conflicts before committing

#### 3. Large File Warning
- **Purpose**: Prevents accidentally committing large files
- **Threshold**: Files larger than 1MB
- **Action**: Warns but doesn't block (press Enter to continue)
- **Resolution**: Consider using Git LFS or excluding the file

#### 4. TODO/FIXME Detection
- **Purpose**: Reminds about unfinished work
- **Patterns Detected**:
  - TODO comments
  - FIXME comments
  - HACK comments
  - XXX comments
- **Action**: Displays warning (non-blocking)
- **Resolution**: Consider resolving before committing

#### 5. Code Quality Checks (lint-staged)
- **JavaScript Files**: ESLint + Vitest related tests
- **HTML/CSS Files**: Prettier formatting
- **Markdown Files**: markdownlint + Prettier
- **Action**: Auto-fixes when possible, blocks if errors remain

### Manual Duplicate Check

Run the duplicate checker manually:

```bash
# Check for duplicates
node scripts/checkDuplicates.js

# Automatically remove identical duplicates
node scripts/checkDuplicates.js --fix
```

### Bypassing Hooks

In rare cases where you need to bypass hooks:

```bash
# Use with caution!
git commit --no-verify -m "Emergency fix"
```

**Note**: Only bypass hooks when absolutely necessary and ensure manual quality checks.

### Customizing Hooks

#### Adding New Checks

Edit `.husky/pre-commit` to add new checks:

```bash
# Example: Check for sensitive data
echo "📋 Checking for sensitive data..."
if grep -r "API_KEY\|SECRET\|PASSWORD" ./src --include="*.js" 2>/dev/null; then
  echo "${RED}❌ Error: Possible sensitive data detected!${NC}"
  exit 1
fi
```

#### Modifying Existing Checks

1. Edit `.husky/pre-commit` for hook logic
2. Update `scripts/checkDuplicates.js` for duplicate detection
3. Modify `.lintstagedrc` in package.json for lint-staged rules

### Troubleshooting

#### Hook Not Running

```bash
# Reinstall Husky
npm run prepare
```

#### Hook Permissions Error

```bash
# Fix permissions
chmod +x .husky/pre-commit
```

#### False Positives

If the hook is blocking valid commits:

1. Review the specific check that's failing
2. Update patterns in the hook if needed
3. Use `--no-verify` as last resort

### Best Practices

1. **Don't Ignore Warnings**: They indicate potential issues
2. **Fix Before Committing**: Resolve issues rather than bypassing
3. **Keep Hooks Fast**: Long-running hooks discourage use
4. **Document Changes**: Update this file when modifying hooks

## Post-commit Hooks

Currently not implemented. Future considerations:

- Automatic issue/PR linking
- Deployment notifications
- Analytics tracking

## Contributing

When adding new hooks:

1. Test thoroughly with various scenarios
2. Ensure cross-platform compatibility (macOS, Linux, Windows with WSL)
3. Keep execution time under 5 seconds
4. Document in this file
5. Announce changes to the team

---

*Last Updated: [Current Date]*
*See also: [MAINTENANCE_GUIDE.md](./MAINTENANCE_GUIDE.md) for general maintenance practices*