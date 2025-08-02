#!/usr/bin/env python3
"""
Agent Initialization Script for GitHub PR Dump Fix Project
Initializes Claude Code agents with their specific development path and context
"""

import os
import sys
import json
import argparse
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
LOGS_DIR = PROJECT_ROOT / "AGENT_LOGS"
PROMPTS_DIR = PROJECT_ROOT / "AGENT_INITIALIZATION" / "prompts"
CLAUDE_MD_PATH = PROJECT_ROOT.parent / "CLAUDE.md"

# Ensure logs directory exists
LOGS_DIR.mkdir(exist_ok=True)

# Agent paths mapping
AGENT_PATHS = {
    1: "Core Data Infrastructure",
    2: "API Integration", 
    3: "Data Processing",
    4: "Robustness & Reliability",
    5: "Performance",
    6: "Operations & Monitoring",
    7: "DevOps",
    8: "QA",
    9: "Maintenance"
}

def get_agent_context(path_number: int) -> Dict[str, str]:
    """Get the context files for a specific agent path."""
    context = {
        "path_doc": PROJECT_ROOT / f"PATH_{path_number}_{AGENT_PATHS[path_number].upper().replace(' ', '_').replace('&', '')}.md",
        "master_plan": PROJECT_ROOT / "DEVELOPMENT_WORKFLOW_MASTER.md",
        "enhanced_plan": PROJECT_ROOT / "ENHANCED_MASTER_PLAN.md",
        "claude_md": CLAUDE_MD_PATH,
        "prompt_file": PROMPTS_DIR / f"agent_{path_number}_prompt.md",
        "log_file": LOGS_DIR / f"agent_{path_number}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
    }
    return context

def create_agent_prompt(path_number: int) -> str:
    """Generate the initialization prompt for an agent."""
    context = get_agent_context(path_number)
    agent_name = AGENT_PATHS[path_number]
    
    # Read context files
    path_doc_content = context["path_doc"].read_text() if context["path_doc"].exists() else "PATH DOCUMENT NOT FOUND"
    master_plan_content = context["master_plan"].read_text() if context["master_plan"].exists() else "MASTER PLAN NOT FOUND"
    
    prompt = f"""You are the {agent_name} Agent for the GitHub PR Dump Fix project.

## Your Development Path
{path_doc_content}

## Overall Project Context
{master_plan_content[:2000]}... [See DEVELOPMENT_WORKFLOW_MASTER.md for full context]

## Your Responsibilities
1. Complete all tasks in your PATH_{path_number} checklist
2. Publish interfaces according to the timeline
3. Coordinate with other agents on dependencies
4. Log all issues to {context['log_file']}
5. Update task checkboxes as you complete them

## Working Directory
Your base directory: {PROJECT_ROOT.parent}
Your branch: feature/{agent_name.lower().replace(' ', '-').replace('&', 'and')}

## Critical Instructions
1. Start with tasks marked as CRITICAL or BLOCKING
2. Check dependencies before starting any task
3. Test all code with >90% coverage
4. Document all public interfaces
5. Use structured logging for all operations

## Issue Logging
When you encounter issues, log them using this format:
```json
{{
  "timestamp": "ISO-8601",
  "severity": "CRITICAL|HIGH|MEDIUM|LOW",
  "task": "task_filename",
  "issue": "description",
  "blocked_by": ["dependency_list"],
  "attempted_resolution": "what you tried",
  "needs_escalation": true/false
}}
```

## Daily Sync Requirements
- Check for interface updates from dependencies
- Update your progress in PATH_{path_number} document
- Log any blockers or issues
- Coordinate on integration branch for testing

Begin by:
1. Reading your complete PATH_{path_number} document
2. Identifying all CRITICAL and HIGH priority tasks
3. Checking which dependencies are already available
4. Starting with the first unblocked task

What would you like to work on first?"""
    
    return prompt

def log_agent_session(path_number: int, action: str, details: Dict):
    """Log agent session information."""
    context = get_agent_context(path_number)
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "agent": AGENT_PATHS[path_number],
        "path_number": path_number,
        "action": action,
        "details": details
    }
    
    with open(context["log_file"], 'a') as f:
        f.write(json.dumps(log_entry) + '\n')

def initialize_agent(path_number: int, test_mode: bool = False):
    """Initialize a specific agent with its context and prompt."""
    if path_number not in AGENT_PATHS:
        print(f"Error: Invalid path number {path_number}. Choose from 1-9.")
        return
    
    agent_name = AGENT_PATHS[path_number]
    context = get_agent_context(path_number)
    
    print(f"\n🚀 Initializing {agent_name} Agent (Path {path_number})")
    print(f"📁 Working directory: {PROJECT_ROOT.parent}")
    print(f"📋 Task document: {context['path_doc'].name}")
    print(f"📝 Log file: {context['log_file'].name}")
    
    # Generate and save prompt
    prompt = create_agent_prompt(path_number)
    context["prompt_file"].parent.mkdir(exist_ok=True)
    context["prompt_file"].write_text(prompt)
    print(f"✅ Prompt saved to: {context['prompt_file']}")
    
    # Log initialization
    log_agent_session(path_number, "initialized", {
        "test_mode": test_mode,
        "context_files": [str(p) for p in context.values() if isinstance(p, Path)]
    })
    
    if not test_mode:
        # Copy prompt to clipboard (macOS)
        try:
            subprocess.run(['pbcopy'], input=prompt.encode(), check=True)
            print("\n✅ Initialization prompt copied to clipboard!")
            print("📋 Paste this into Claude Code to start the agent")
        except:
            print("\n📋 Initialization prompt:")
            print("-" * 80)
            print(prompt)
            print("-" * 80)
    
    return prompt

def create_coordination_script():
    """Create a script for coordinating between agents."""
    coord_script = PROJECT_ROOT / "AGENT_INITIALIZATION" / "coordinate_agents.py"
    
    content = '''#!/usr/bin/env python3
"""Agent Coordination Script - Manages dependencies and integration between agents"""

import json
from datetime import datetime
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
INTEGRATION_LOG = PROJECT_ROOT / "AGENT_LOGS" / "integration.log"

def check_dependencies():
    """Check which dependencies are completed across all agents."""
    completed = {}
    
    # Parse each PATH document for completed tasks
    for i in range(1, 10):
        path_file = PROJECT_ROOT / f"PATH_{i}_*.md"
        path_files = list(PROJECT_ROOT.glob(f"PATH_{i}_*.md"))
        if path_files:
            content = path_files[0].read_text()
            # Count completed checkboxes
            completed[i] = content.count("[x]")
    
    return completed

def log_integration_issue(issue):
    """Log integration issues for resolution."""
    entry = {
        "timestamp": datetime.now().isoformat(),
        "type": "integration_issue",
        **issue
    }
    
    with open(INTEGRATION_LOG, 'a') as f:
        f.write(json.dumps(entry) + '\\n')

def generate_daily_status():
    """Generate daily status report for all agents."""
    status = {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "completed_tasks": check_dependencies(),
        "blockers": [],
        "integration_ready": []
    }
    
    # Check for blockers in logs
    for log_file in (PROJECT_ROOT / "AGENT_LOGS").glob("agent_*.log"):
        with open(log_file) as f:
            for line in f:
                entry = json.loads(line)
                if entry.get("details", {}).get("needs_escalation"):
                    status["blockers"].append(entry)
    
    return status

if __name__ == "__main__":
    status = generate_daily_status()
    print(json.dumps(status, indent=2))
'''
    
    coord_script.write_text(content)
    coord_script.chmod(0o755)
    print(f"✅ Created coordination script: {coord_script}")

def main():
    """Main entry point for agent initialization."""
    parser = argparse.ArgumentParser(description="Initialize Claude Code agents for GitHub PR Dump Fix")
    parser.add_argument("path", type=int, nargs='?', help="Agent path number (1-9)")
    parser.add_argument("--all", action="store_true", help="Generate prompts for all agents")
    parser.add_argument("--test", action="store_true", help="Test mode - don't copy to clipboard")
    parser.add_argument("--status", action="store_true", help="Show status of all agents")
    
    args = parser.parse_args()
    
    if args.status:
        # Show status of all agents
        print("\n📊 Agent Status Overview")
        print("=" * 60)
        for i in range(1, 10):
            context = get_agent_context(i)
            if context["path_doc"].exists():
                content = context["path_doc"].read_text()
                total = content.count("- [ ]") + content.count("- [x]")
                completed = content.count("- [x]")
                print(f"Path {i} - {AGENT_PATHS[i]}: {completed}/{total} tasks completed")
        return
    
    if args.all:
        # Initialize all agents
        PROMPTS_DIR.mkdir(exist_ok=True)
        for i in range(1, 10):
            initialize_agent(i, test_mode=True)
        create_coordination_script()
        print("\n✅ All agent prompts generated!")
        print(f"📁 Find them in: {PROMPTS_DIR}")
    elif args.path:
        # Initialize specific agent
        initialize_agent(args.path, test_mode=args.test)
    else:
        # Interactive mode
        print("\n🤖 GitHub PR Dump Fix - Agent Initialization")
        print("=" * 50)
        for i, name in AGENT_PATHS.items():
            print(f"{i}. {name} Agent")
        print("\nSelect agent to initialize (1-9) or 'all': ", end='')
        
        choice = input().strip().lower()
        if choice == 'all':
            args.all = True
            main()
        else:
            try:
                path_num = int(choice)
                initialize_agent(path_num)
            except ValueError:
                print("❌ Invalid choice. Please run again.")

if __name__ == "__main__":
    main()