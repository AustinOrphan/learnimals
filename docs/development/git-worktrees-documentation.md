# Git Worktrees Documentation

## Overview
This document contains proposed documentation for Git worktrees, including recommendations for where to place this information in existing documentation files.

## Recommended Placement

### Primary Location: CODE_STANDARDS.md
Add this content to `/Users/austinorphan/Library/Mobile Documents/com~apple~CloudDocs/src/dotfiles/CODE_STANDARDS.md` after line 341, expanding the existing "Git Workflow" section.

### Optional Cross-References

1. **In global CLAUDE.md** (under "Misc" section):
   ```markdown
   - For multi-branch development, see Git Worktrees in CODE_STANDARDS.md
   ```

2. **In project-specific CLAUDE.md files** (when applicable):
   ```markdown
   ### Development with Worktrees
   This project uses git worktrees for parallel development. See CODE_STANDARDS.md for setup.
   ```

---

## Proposed Documentation Content

### Git Worktrees

#### What Are Worktrees?
Git worktrees allow you to have multiple branches checked out simultaneously in separate directories. Each worktree has its own working copy while sharing the same repository data.

#### When to Use Worktrees
- **Parallel feature development**: Work on multiple features without stashing/switching
- **Quick hotfixes**: Fix production issues while preserving feature work
- **Code reviews**: Review PRs without disrupting current work
- **Testing branches**: Compare implementations side-by-side
- **Long-running builds**: Keep working while another branch compiles/tests

#### Basic Commands
```bash
# Add a new worktree
git worktree add ../project-feature-x feature/x

# Add worktree for new branch
git worktree add -b feature/new-thing ../project-new-thing

# List all worktrees
git worktree list

# Remove a worktree
git worktree remove ../project-feature-x

# Clean up stale worktrees
git worktree prune
```

#### Recommended Workflow
1. **Directory structure**:
   ```
   ~/projects/
   ├── myproject/          # Main worktree (usually main/master)
   ├── myproject-feature/  # Feature branch worktree
   ├── myproject-hotfix/   # Hotfix worktree
   └── myproject-review/   # PR review worktree
   ```

2. **Naming convention**: Use `projectname-purpose` for worktree directories

3. **Setup script** (add to project):
   ```bash
   #!/bin/bash
   # scripts/setup-worktrees.sh
   git worktree add ../$(basename $PWD)-feature feature/current
   git worktree add ../$(basename $PWD)-hotfix main
   ```

#### Best Practices
- **Don't commit in the wrong worktree**: Each worktree tracks its own branch
- **Keep worktrees focused**: One worktree per major task
- **Clean up regularly**: Remove worktrees when branches are merged
- **Use absolute paths in scripts**: Worktrees have different `$PWD`
- **Share node_modules carefully**: Consider separate installs or symlinks
- **Update git hooks**: Ensure hooks work across all worktrees

#### IDE/Editor Configuration
- **VS Code**: Open each worktree as a separate window
- **Multiple terminals**: Dedicate terminals to specific worktrees
- **Environment variables**: Set `WORKTREE_TYPE` to identify context

#### Common Issues & Solutions
- **"branch already checked out"**: Can't checkout same branch in multiple worktrees
- **Stale worktrees**: Run `git worktree prune` after deleting directories
- **Submodule confusion**: Each worktree needs `git submodule update`
- **Node modules**: Either symlink from main or maintain separate installations

---

## Implementation Notes

- The setup script (`setup-worktrees.sh`) should be placed in individual project `scripts/` directories
- Consider adding worktree status to shell prompt for clarity
- Document project-specific worktree conventions in project README files