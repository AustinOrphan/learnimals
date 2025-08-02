#!/bin/bash

# Git Worktree Setup Script for Learnimals
# This script sets up the recommended worktree structure for parallel development

set -e  # Exit on any error

PROJECT_ROOT=$(git rev-parse --show-toplevel)
WORKTREE_BASE="${PROJECT_ROOT}/../learnimals-worktrees"

echo "🌳 Setting up Git Worktrees for Learnimals"
echo "Project root: $PROJECT_ROOT"
echo "Worktree base: $WORKTREE_BASE"

# Ensure we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository. Please run this from within the learnimals project."
    exit 1
fi

# Create worktree base directory
mkdir -p "$WORKTREE_BASE"

# Function to create a worktree
create_worktree() {
    local name="$1"
    local branch="$2"
    local description="$3"
    local path="${WORKTREE_BASE}/${name}"
    
    echo "📁 Creating worktree: $name"
    echo "   Branch: $branch"
    echo "   Path: $path"
    echo "   Purpose: $description"
    
    if [ -d "$path" ]; then
        echo "   ⚠️  Worktree already exists, skipping..."
        return
    fi
    
    # Create branch if it doesn't exist
    if ! git show-ref --verify --quiet refs/heads/$branch; then
        echo "   🌿 Creating branch: $branch"
        git branch "$branch"
    fi
    
    # Create worktree
    git worktree add "$path" "$branch"
    
    # Copy essential files to new worktree
    cp "$PROJECT_ROOT/.nvmrc" "$path/" 2>/dev/null || true
    cp "$PROJECT_ROOT/.gitignore" "$path/" 2>/dev/null || true
    
    echo "   ✅ Worktree created successfully"
    echo
}

# Create recommended worktrees
echo "Creating recommended worktrees..."
echo

# Skip main worktree if main branch is already checked out in original repo
if [ "$(git branch --show-current)" = "main" ]; then
    echo "📁 Skipping main worktree (already checked out in original repository)"
    echo "   Use original repository for main branch work"
    echo
else
    create_worktree "main" "main" "Main development and testing"
fi
create_worktree "stabilization" "fix/infrastructure-stabilization" "Technical stabilization work"
create_worktree "feature-development" "develop" "Feature development branch"
create_worktree "hotfix" "hotfix/emergency-fixes" "Emergency bug fixes"
create_worktree "experimental" "experimental/new-features" "Experimental features and prototypes"

# List all worktrees
echo "📋 Current worktrees:"
git worktree list

echo
echo "🎉 Worktree setup complete!"
echo
echo "📖 Usage examples:"
echo "   cd $WORKTREE_BASE/stabilization    # Work on infrastructure fixes"
echo "   cd $WORKTREE_BASE/feature-development # Develop new features"
echo "   cd $WORKTREE_BASE/experimental    # Try experimental ideas"
echo
echo "💡 Each worktree has its own node_modules and can run independently"
echo "💡 Use 'git worktree list' to see all worktrees"
echo "💡 Use 'git worktree remove <name>' to clean up unused worktrees"
echo
echo "⚠️  Remember to run 'npm install' in each worktree before development"
echo "⚠️  See CLAUDE.md for detailed worktree usage guidelines"