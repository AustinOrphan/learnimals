# Maintenance Guide: Preventing File Duplication

This guide provides best practices and procedures to prevent file duplication issues, particularly those caused by iCloud sync conflicts.

## Understanding the Problem

iCloud (and other cloud sync services) can create duplicate files when:

- Multiple devices edit the same file simultaneously
- Network issues occur during syncing
- Merge conflicts can't be automatically resolved

These duplicates appear with suffixes like:

- `filename 2.js`
- `component 3.html`
- `styles 4.css`

## Prevention Strategies

### 1. Development Workflow

#### Single Device Development

- **Preferred**: Work on one device at a time
- **Wait for sync**: Allow iCloud to fully sync before switching devices
- **Check sync status**: Ensure iCloud icon shows checkmark before switching

#### Multi-Device Workflow

If you must work across devices:

1. **Commit frequently**: Push changes to git before switching
2. **Pull before starting**: Always pull latest changes
3. **Use branches**: Create device-specific branches if needed
4. **Sync breaks**: Take 5-minute breaks between device switches

### 2. Git Best Practices

#### Commit Hygiene

```bash
# Before switching devices or ending work session
git add .
git commit -m "WIP: Descriptive message"
git push

# When starting work on different device
git pull --rebase
```

#### Branch Strategy

```bash
# Create device-specific branches if needed
git checkout -b feature/component-macbook
git checkout -b feature/component-ipad

# Merge when ready
git checkout main
git merge feature/component-macbook
```

### 3. File Organization

#### Naming Conventions

- **Avoid spaces** in critical filenames: Use hyphens or underscores
- **Lowercase preferred**: Reduces case-sensitivity issues
- **Descriptive names**: Makes duplicates easier to identify

#### Directory Structure

- **Flat is better**: Deeply nested structures increase conflict chances
- **Logical grouping**: Keep related files together
- **Single source of truth**: Avoid similar files in different locations

## Detection and Resolution

### 1. Regular Audits

Run these checks weekly or before major commits:

```bash
# Find potential duplicates (files with numbers)
find . -name "* [0-9].*" -type f | grep -v node_modules

# Find files with common duplicate patterns
find . -regex ".*[ ]\([0-9]\|copy\|conflict\)\..*" | grep -v node_modules

# Check for similar filenames
find . -name "*.js" -o -name "*.html" -o -name "*.css" | \
  sed 's/[0-9]*\.[^.]*$//' | sort | uniq -d
```

### 2. Automated Detection

Add to your npm scripts in `package.json`:

```json
{
  "scripts": {
    "check:duplicates": "find . -name '* [0-9].*' -type f | grep -E '\\.(js|html|css|md)$' | grep -v node_modules || echo 'No duplicates found'",
    "audit:files": "node scripts/auditDuplicates.js"
  }
}
```

### 3. Resolution Process

When duplicates are found:

1. **Stop and assess**:

   ```bash
   # List all duplicates
   find . -name "* [0-9].*" -type f
   ```

2. **Compare files**:

   ```bash
   # Use diff to compare
   diff "component.js" "component 2.js"

   # Or use VS Code
   code --diff "component.js" "component 2.js"
   ```

3. **Merge if needed**:
   - Review both versions
   - Merge unique changes
   - Keep the original filename
   - Delete the duplicate

4. **Update imports**:

   ```bash
   # Find files importing the duplicate
   grep -r "component 2" --include="*.js" --include="*.html"
   ```

## Automation Tools

### Pre-commit Hooks

Our project uses Husky to run checks before commits:

```javascript
// .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Check for duplicate files
duplicates=$(find ./src -name "* [0-9].*" -type f | grep -E '\.(js|html|css)$')
if [ ! -z "$duplicates" ]; then
  echo "⚠️  Warning: Duplicate files detected:"
  echo "$duplicates"
  echo "Please resolve before committing."
  exit 1
fi

# Run standard pre-commit checks
npm run pre-commit
```

### VS Code Settings

Add to `.vscode/settings.json`:

```json
{
  "files.exclude": {
    "**/* [0-9].*": true,
    "**/*copy.*": true,
    "**/*conflict*": true
  },
  "files.watcherExclude": {
    "**/* [0-9].*": true
  },
  "search.exclude": {
    "**/* [0-9].*": true
  }
}
```

**Note**: This hides duplicates in VS Code. Use with caution during cleanup.

## CI/CD Integration

### GitHub Actions Check

Add to `.github/workflows/ci.yml`:

```yaml
- name: Check for duplicate files
  run: |
    duplicates=$(find . -name "* [0-9].*" -type f | grep -E '\.(js|html|css|md)$' | grep -v node_modules || true)
    if [ ! -z "$duplicates" ]; then
      echo "::error::Duplicate files detected:"
      echo "$duplicates"
      exit 1
    fi
```

## Quick Reference

### Daily Checklist

- [ ] Pull latest changes before starting work
- [ ] Check for duplicates: `npm run check:duplicates`
- [ ] Commit and push before switching devices
- [ ] Wait for iCloud sync to complete

### Weekly Maintenance

- [ ] Run full duplicate audit
- [ ] Check for similar filenames
- [ ] Review and update `.gitignore` patterns
- [ ] Verify automation tools are working

### When Issues Occur

1. **Stop work immediately**
2. **Run duplicate check**
3. **Compare and merge files**
4. **Update all imports**
5. **Test thoroughly**
6. **Commit with clear message**

## Emergency Recovery

If massive duplication occurs:

1. **Create backup branch**:

   ```bash
   git checkout -b backup/before-cleanup
   git add .
   git commit -m "Backup before duplicate cleanup"
   ```

2. **Use cleanup script**:

   ```bash
   # Dry run first
   node scripts/cleanupDuplicates.js --dry-run

   # Then execute
   node scripts/cleanupDuplicates.js
   ```

3. **Verify application**:
   - Run all tests
   - Check all pages load
   - Verify no broken imports

4. **Document what happened**:
   - Create incident report
   - Update this guide if needed
   - Share learnings with team

## Resources

- [iCloud Drive Sync Issues](https://support.apple.com/guide/mac-help/if-icloud-drive-doesnt-sync-mchle58f75d6/mac)
- [Git Best Practices](https://www.atlassian.com/git/tutorials/comparing-workflows)
- Project-specific scripts in `/scripts/maintenance/`

---

_Last updated: [Current Date]_  
_Maintainer: Development Team_
