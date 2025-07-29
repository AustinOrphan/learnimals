#!/usr/bin/env python3
"""
Update all agent prompts to include worktree instructions
"""

from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
PROMPTS_DIR = PROJECT_ROOT / "AGENT_INITIALIZATION" / "prompts"
WORKTREES_DIR = PROJECT_ROOT.parent / "agent_worktrees"

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

def update_prompts():
    """Add worktree instructions to all prompts."""
    print("📝 Updating agent prompts with worktree instructions")
    print("=" * 60)
    
    for agent_num, config in AGENTS.items():
        prompt_file = PROMPTS_DIR / f"agent_{agent_num}_prompt.md"
        
        if not prompt_file.exists():
            print(f"⚠️  Agent {agent_num}: Prompt file not found")
            continue
            
        # Read current prompt
        content = prompt_file.read_text()
        
        # Check if already has worktree instructions
        if "WORKTREE INSTRUCTIONS" in content:
            print(f"✅ Agent {agent_num}: Already has worktree instructions")
            continue
        
        # Create worktree instructions
        branch_name = config['branch']
        worktree_path = WORKTREES_DIR / f"agent_{agent_num}_{branch_name.replace('/', '_')}"
        
        worktree_instructions = f"""

## WORKTREE INSTRUCTIONS

**IMPORTANT**: You have a dedicated git worktree to avoid conflicts with other agents.

**Your worktree path**: `{worktree_path}`

**First actions after initialization:**
1. Change to your worktree directory:
   ```bash
   cd {worktree_path}
   ```

2. Verify you're in the correct worktree and branch:
   ```bash
   pwd  # Should show: {worktree_path}
   git branch --show-current  # Should show: {branch_name}
   ```

3. Your worktree is an isolated copy of the repository where you can:
   - Make changes without affecting other agents
   - Commit and push to your feature branch
   - Work independently of the main repository

**Remember**: 
- ALWAYS work in your worktree directory
- NEVER cd back to the main repository at {PROJECT_ROOT.parent}
- All your file edits should be within {worktree_path}

After verifying your worktree, proceed with your assigned tasks.
"""
        
        # Add to prompt
        updated_content = content + worktree_instructions
        prompt_file.write_text(updated_content)
        
        print(f"✅ Agent {agent_num}: Updated with worktree instructions")
        print(f"   Worktree: {worktree_path}")
    
    print("\n✅ All prompts updated!")

if __name__ == "__main__":
    update_prompts()