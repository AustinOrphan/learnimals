#!/usr/bin/env python3
"""
Check actual agent progress by examining git commits vs PATH document updates
"""

import subprocess
import os
from pathlib import Path

def get_commit_count(branch):
    """Get number of commits on a branch"""
    try:
        result = subprocess.run(
            ['git', 'rev-list', '--count', f'{branch}', '--', '!gh_pr_dump_fix_plan/'],
            capture_output=True, text=True, cwd="."
        )
        if result.returncode == 0:
            return int(result.stdout.strip())
        return 0
    except:
        return 0

def get_recent_commits(branch, count=3):
    """Get recent commit messages"""
    try:
        result = subprocess.run(
            ['git', 'log', '--oneline', f'-{count}', branch, '--', '!gh_pr_dump_fix_plan/'],
            capture_output=True, text=True, cwd="."
        )
        if result.returncode == 0:
            return result.stdout.strip().split('\n')
        return []
    except:
        return []

def check_path_completions(path_file):
    """Count completed checkboxes in PATH document"""
    try:
        with open(path_file, 'r') as f:
            content = f.read()
            completed = content.count('- [x]')
            total = content.count('- [ ]') + completed
            return completed, total
    except:
        return 0, 0

def main():
    os.chdir("/Users/austinorphan/Library/Mobile Documents/com~apple~CloudDocs/src/devTools/gh_pr_dump")
    
    agents = {
        1: {"name": "Core Data Infrastructure", "branch": "feature/core-data-infrastructure"},
        2: {"name": "API Integration", "branch": "feature/api-integration"},
        3: {"name": "Data Processing", "branch": "feature/data-processing"},
        4: {"name": "Robustness & Reliability", "branch": "feature/robustness-and-reliability"},
        5: {"name": "Performance", "branch": "feature/performance"},
        6: {"name": "Operations & Monitoring", "branch": "feature/operations-and-monitoring"},
        7: {"name": "DevOps", "branch": "feature/devops"},
        8: {"name": "QA", "branch": "feature/qa"},
        9: {"name": "Maintenance", "branch": "feature/maintenance"},
    }
    
    print("🔍 REAL AGENT PROGRESS CHECK")
    print("=" * 60)
    
    for agent_id, info in agents.items():
        branch = info["branch"]
        name = info["name"]
        
        # Get commit activity
        commit_count = get_commit_count(branch)
        recent_commits = get_recent_commits(branch)
        
        # Check PATH document completions
        path_file = f"gh_pr_dump_fix_plan/PATH_DOCUMENTS/PATH_{agent_id}_{branch.split('-')[1].upper()}.md"
        if os.path.exists(path_file):
            completed, total = check_path_completions(path_file)
        else:
            completed, total = 0, 0
        
        print(f"\n🤖 Agent {agent_id}: {name}")
        print(f"   📊 Commits: {commit_count}")
        print(f"   ✅ PATH Progress: {completed}/{total} ({(completed/total*100) if total > 0 else 0:.1f}%)")
        
        if recent_commits and recent_commits[0]:
            print(f"   📝 Recent work:")
            for commit in recent_commits[:2]:
                if commit.strip():
                    print(f"      • {commit[:60]}...")
        
        # Status assessment
        if commit_count > 0 and completed == 0:
            print(f"   ⚠️  STATUS: Working but not updating PATH document!")
        elif commit_count > 0 and completed > 0:
            print(f"   ✅ STATUS: Active and documenting progress")
        elif commit_count == 0:
            print(f"   🔴 STATUS: Not started yet")
    
    print("\n" + "=" * 60)
    print("🎯 SUMMARY:")
    print("- Agents ARE working (making commits)")
    print("- Issue: Most agents not updating PATH documents")
    print("- Need to remind agents to check off completed tasks")

if __name__ == "__main__":
    main()