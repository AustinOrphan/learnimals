#!/usr/bin/env python3
"""
Set up git branches and worktrees for all agents
Run this before manually launching Claude Code instances
"""

import subprocess
import sys
from pathlib import Path

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
WORKTREES_DIR = PROJECT_ROOT.parent / "agent_worktrees"

# Agent configurations
AGENTS = {
    1: {"name": "Core Data Infrastructure", "branch": "feature/core-data-infrastructure"},
    2: {"name": "API Integration", "branch": "feature/api-integration"},
    3: {"name": "Data Processing", "branch": "feature/data-processing"},
    4: {"name": "Robustness & Reliability", "branch": "feature/robustness-and-reliability"},
    5: {"name": "Performance", "branch": "feature/performance"},
    6: {"name": "Operations & Monitoring", "branch": "feature/operations-and-monitoring"},
    7: {"name": "DevOps", "branch": "feature/devops"},
    8: {"name": "QA", "branch": "feature/qa"},
    9: {"name": "Maintenance", "branch": "feature/maintenance"}
}

def setup_branches_and_worktrees():
    """Create branches and worktrees for all agents."""
    print("🚀 Setting up Git branches and worktrees for all agents")
    print("=" * 60)
    
    # Ensure we're in the right directory
    git_dir = PROJECT_ROOT.parent
    print(f"📁 Working in: {git_dir}")
    
    # Create worktrees directory
    WORKTREES_DIR.mkdir(exist_ok=True)
    print(f"📁 Worktrees directory: {WORKTREES_DIR}\n")
    
    # Get current branch
    try:
        current = subprocess.run(
            ["git", "branch", "--show-current"],
            cwd=git_dir,
            capture_output=True,
            text=True,
            check=True
        ).stdout.strip()
        print(f"📌 Current branch: {current}\n")
    except:
        print("⚠️  Could not determine current branch\n")
    
    # Process each agent
    for agent_num, config in AGENTS.items():
        print(f"🤖 Agent {agent_num}: {config['name']}")
        branch_name = config['branch']
        worktree_path = WORKTREES_DIR / f"agent_{agent_num}_{branch_name.replace('/', '_')}"
        
        try:
            # Check if branch exists
            result = subprocess.run(
                ["git", "rev-parse", "--verify", branch_name],
                cwd=git_dir,
                capture_output=True,
                text=True
            )
            
            branch_exists = result.returncode == 0
            
            # Check if worktree exists
            worktree_list = subprocess.run(
                ["git", "worktree", "list", "--porcelain"],
                cwd=git_dir,
                capture_output=True,
                text=True,
                check=True
            ).stdout
            
            worktree_exists = str(worktree_path) in worktree_list
            
            if worktree_exists:
                print(f"  ✅ Worktree already exists: {worktree_path}")
            else:
                if branch_exists:
                    # Add worktree for existing branch
                    subprocess.run(
                        ["git", "worktree", "add", str(worktree_path), branch_name],
                        cwd=git_dir,
                        check=True
                    )
                    print(f"  ✅ Created worktree for existing branch: {worktree_path}")
                else:
                    # Create new branch with worktree
                    subprocess.run(
                        ["git", "worktree", "add", "-b", branch_name, str(worktree_path)],
                        cwd=git_dir,
                        check=True
                    )
                    print(f"  ✅ Created new branch and worktree: {worktree_path}")
            
            print(f"  📍 Branch: {branch_name}")
            print(f"  📂 Worktree: {worktree_path}")
            print()
            
        except subprocess.CalledProcessError as e:
            print(f"  ❌ Error: {e}")
            print(f"  ⚠️  You may need to set up Agent {agent_num} manually")
            print()
    
    # Print summary
    print("=" * 60)
    print("📊 SETUP COMPLETE!")
    print("=" * 60)
    print("\n📝 Next steps for manual launching:")
    print("\n1. Generate prompts if not already done:")
    print("   python3 initialize_agent.py --all")
    print("\n2. For each agent, open Claude Code and:")
    print("   a) Paste the prompt from prompts/agent_X_prompt.md")
    print("   b) Tell the agent their worktree path:")
    print(f"      'Your worktree is at: {WORKTREES_DIR}/agent_X_...'")
    print("   c) The agent should cd to their worktree before starting work")
    print("\n3. Agents will work in isolated worktrees without conflicts!")
    
    # Show all worktrees
    print("\n📍 All worktrees:")
    try:
        result = subprocess.run(
            ["git", "worktree", "list"],
            cwd=git_dir,
            capture_output=True,
            text=True,
            check=True
        )
        print(result.stdout)
    except:
        print("Could not list worktrees")

def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Set up git branches and worktrees for agents")
    parser.add_argument("--clean", action="store_true", help="Remove all agent worktrees first")
    
    args = parser.parse_args()
    
    if args.clean:
        print("🧹 Cleaning up existing worktrees...")
        for agent_num in AGENTS:
            branch_name = AGENTS[agent_num]['branch']
            worktree_path = WORKTREES_DIR / f"agent_{agent_num}_{branch_name.replace('/', '_')}"
            if worktree_path.exists():
                try:
                    subprocess.run(
                        ["git", "worktree", "remove", str(worktree_path)],
                        cwd=PROJECT_ROOT.parent,
                        check=True
                    )
                    print(f"  ✅ Removed: {worktree_path}")
                except:
                    print(f"  ⚠️  Could not remove: {worktree_path}")
        print()
    
    setup_branches_and_worktrees()

if __name__ == "__main__":
    main()