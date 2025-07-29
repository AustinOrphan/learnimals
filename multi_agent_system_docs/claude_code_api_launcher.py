#!/usr/bin/env python3
"""
Claude Code API-based Agent Launcher
Uses Claude's API to create persistent agent sessions programmatically
"""

import os
import sys
import json
import time
import asyncio
import threading
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any
from concurrent.futures import ThreadPoolExecutor, as_completed

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
PROMPTS_DIR = PROJECT_ROOT / "AGENT_INITIALIZATION" / "prompts"
LOGS_DIR = PROJECT_ROOT / "AGENT_LOGS"
SESSIONS_DIR = PROJECT_ROOT / "AGENT_SESSIONS"
SESSIONS_DIR.mkdir(exist_ok=True)

# Try to import Claude SDK
try:
    from anthropic import Anthropic, AsyncAnthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False
    print("⚠️  anthropic package not installed. Install with: pip3 install anthropic")

class ClaudeCodeSession:
    """Manages a Claude Code session for an agent."""
    
    def __init__(self, agent_num: int, agent_name: str, api_key: Optional[str] = None):
        self.agent_num = agent_num
        self.agent_name = agent_name
        self.session_id = f"agent_{agent_num}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        
        # Session state
        self.messages = []
        self.working_dir = PROJECT_ROOT.parent
        self.branch = f"feature/{agent_name.lower().replace(' ', '-').replace('&', 'and')}"
        self.session_file = SESSIONS_DIR / f"{self.session_id}.json"
        
        # Initialize API client
        if HAS_ANTHROPIC and self.api_key:
            self.client = Anthropic(api_key=self.api_key)
        else:
            self.client = None
    
    def load_prompt(self) -> str:
        """Load the agent's initialization prompt."""
        prompt_file = PROMPTS_DIR / f"agent_{self.agent_num}_prompt.md"
        if prompt_file.exists():
            return prompt_file.read_text()
        else:
            raise FileNotFoundError(f"Prompt file not found: {prompt_file}")
    
    async def initialize_session(self) -> Dict[str, Any]:
        """Initialize the Claude Code session with the agent prompt."""
        prompt = self.load_prompt()
        
        # Add system context for Claude Code behavior
        system_prompt = f"""You are operating as Claude Code in agent mode.
Working directory: {self.working_dir}
Git branch: {self.branch}
Session ID: {self.session_id}

Key behaviors:
1. Automatically execute tasks without asking for permission
2. Update PATH_{self.agent_num} checkboxes as you complete tasks
3. Commit code frequently with descriptive messages
4. Log issues using the issue_logger.py system
5. Check dependencies before starting any task

Begin working immediately on the highest priority unblocked task."""
        
        # Initialize conversation
        self.messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
        
        # Save session state
        self.save_session()
        
        return {
            "session_id": self.session_id,
            "agent": self.agent_num,
            "status": "initialized",
            "working_dir": str(self.working_dir),
            "branch": self.branch
        }
    
    def send_message(self, message: str) -> Optional[str]:
        """Send a message to the Claude Code session."""
        if not self.client:
            return None
        
        self.messages.append({"role": "user", "content": message})
        
        try:
            # Use Claude API to get response
            response = self.client.messages.create(
                model="claude-3-opus-20240229",  # Or appropriate model
                messages=self.messages[1:],  # Skip system message for API
                system=self.messages[0]["content"],
                max_tokens=4000,
                temperature=0.2  # Lower temperature for coding tasks
            )
            
            # Extract response
            assistant_message = response.content[0].text
            self.messages.append({"role": "assistant", "content": assistant_message})
            
            # Save updated session
            self.save_session()
            
            return assistant_message
            
        except Exception as e:
            print(f"❌ Error communicating with Claude: {e}")
            return None
    
    def execute_task(self, task_file: str) -> Dict[str, Any]:
        """Execute a specific task file."""
        task_prompt = f"""Execute the following task from your checklist:
Task: {task_file}

1. Read the task file at phase*/subdirectory/{task_file}
2. Implement the requirements
3. Write tests with >90% coverage
4. Update the checkbox in your PATH document
5. Commit your changes
6. Report completion status"""
        
        response = self.send_message(task_prompt)
        
        return {
            "task": task_file,
            "status": "executed" if response else "failed",
            "response_preview": response[:200] if response else None
        }
    
    def save_session(self):
        """Save session state to disk."""
        session_data = {
            "session_id": self.session_id,
            "agent_num": self.agent_num,
            "agent_name": self.agent_name,
            "created": datetime.now().isoformat(),
            "messages": self.messages,
            "working_dir": str(self.working_dir),
            "branch": self.branch
        }
        
        self.session_file.write_text(json.dumps(session_data, indent=2))
    
    def load_session(self, session_file: Path):
        """Load session state from disk."""
        session_data = json.loads(session_file.read_text())
        self.session_id = session_data["session_id"]
        self.messages = session_data["messages"]
        self.working_dir = Path(session_data["working_dir"])
        self.branch = session_data["branch"]

class ClaudeCodeOrchestrator:
    """Orchestrates multiple Claude Code agent sessions."""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        self.sessions: Dict[int, ClaudeCodeSession] = {}
        self.launch_log = []
        
        if not self.api_key:
            print("⚠️  No API key found. Set ANTHROPIC_API_KEY environment variable.")
    
    async def launch_agent(self, agent_num: int, agent_config: Dict) -> Dict[str, Any]:
        """Launch a single agent session."""
        print(f"\n🚀 Launching Agent {agent_num} - {agent_config['name']}")
        
        try:
            # Create session
            session = ClaudeCodeSession(agent_num, agent_config['name'], self.api_key)
            
            # Initialize session
            result = await session.initialize_session()
            
            # Store session
            self.sessions[agent_num] = session
            
            # Start autonomous work
            await self.start_autonomous_work(session)
            
            # Log success
            self.log_launch(agent_num, "success", result)
            
            return result
            
        except Exception as e:
            # Log failure
            error_result = {
                "agent": agent_num,
                "status": "failed",
                "error": str(e)
            }
            self.log_launch(agent_num, "failed", error_result)
            return error_result
    
    async def start_autonomous_work(self, session: ClaudeCodeSession):
        """Start autonomous work for an agent."""
        # Send initial work command
        work_prompt = """Start working on your assigned tasks:

1. First, read your complete PATH document to understand all tasks
2. Check which dependencies from other agents are available
3. Start with the highest priority CRITICAL or HIGH task that is not blocked
4. For each task:
   - Read the task file
   - Implement the solution
   - Write tests
   - Update the checkbox
   - Commit changes
   - Move to next task

Continue working autonomously. Report any blockers using the issue logging system.
Begin now."""
        
        response = session.send_message(work_prompt)
        
        if response:
            print(f"✅ Agent {session.agent_num} started autonomous work")
            
            # Log initial response
            work_log = LOGS_DIR / f"agent_{session.agent_num}_work.log"
            with open(work_log, 'a') as f:
                f.write(f"\n{'='*60}\n")
                f.write(f"Session started: {datetime.now().isoformat()}\n")
                f.write(f"Initial response:\n{response}\n")
    
    async def launch_all_agents(self, agent_configs: Dict[int, Dict]):
        """Launch all agents concurrently."""
        print(f"\n🚀 Launching {len(agent_configs)} agents via Claude API")
        print("=" * 60)
        
        # Sort by priority
        sorted_agents = sorted(agent_configs.items(), 
                             key=lambda x: (x[1]['priority'], x[0]))
        
        # Group by priority
        priority_groups = {}
        for agent_num, config in sorted_agents:
            priority = config['priority']
            if priority not in priority_groups:
                priority_groups[priority] = []
            priority_groups[priority].append((agent_num, config))
        
        # Launch by priority group
        for priority in sorted(priority_groups.keys()):
            group = priority_groups[priority]
            print(f"\n📊 Launching Priority {priority} agents...")
            
            # Launch group concurrently
            tasks = [self.launch_agent(num, cfg) for num, cfg in group]
            results = await asyncio.gather(*tasks)
            
            # Brief pause between priority groups
            if priority < max(priority_groups.keys()):
                await asyncio.sleep(2)
        
        # Save orchestration log
        self.save_orchestration_log()
        
        # Print summary
        self.print_summary()
    
    def log_launch(self, agent_num: int, status: str, details: Dict):
        """Log agent launch."""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "agent": agent_num,
            "status": status,
            "details": details
        }
        self.launch_log.append(entry)
    
    def save_orchestration_log(self):
        """Save complete orchestration log."""
        log_file = LOGS_DIR / f"orchestration_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        log_data = {
            "start_time": self.launch_log[0]["timestamp"] if self.launch_log else None,
            "end_time": datetime.now().isoformat(),
            "total_agents": len(self.sessions),
            "launches": self.launch_log,
            "sessions": {
                num: {
                    "session_id": session.session_id,
                    "session_file": str(session.session_file)
                }
                for num, session in self.sessions.items()
            }
        }
        
        log_file.write_text(json.dumps(log_data, indent=2))
        print(f"\n📄 Orchestration log: {log_file}")
    
    def print_summary(self):
        """Print launch summary."""
        print("\n" + "=" * 60)
        print("📊 LAUNCH SUMMARY")
        print("=" * 60)
        
        success = sum(1 for log in self.launch_log if log["status"] == "success")
        failed = sum(1 for log in self.launch_log if log["status"] == "failed")
        
        print(f"✅ Successful: {success}")
        print(f"❌ Failed: {failed}")
        
        if self.sessions:
            print("\n🤖 Active Sessions:")
            for num, session in sorted(self.sessions.items()):
                print(f"  Agent {num}: {session.session_id}")
        
        print("\n📁 Session files saved in:", SESSIONS_DIR)

    def monitor_agents(self):
        """Monitor active agent sessions."""
        print("\n📊 Monitoring active agents...")
        
        while True:
            # Check each agent's progress
            for agent_num, session in self.sessions.items():
                # Read PATH document to check progress
                path_files = list(PROJECT_ROOT.glob(f"PATH_{agent_num}_*.md"))
                if path_files:
                    content = path_files[0].read_text()
                    total = content.count("- [ ]") + content.count("- [x]")
                    completed = content.count("- [x]")
                    
                    print(f"Agent {agent_num}: {completed}/{total} tasks", end="\r")
            
            time.sleep(30)  # Check every 30 seconds

async def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Launch Claude Code agents via API")
    parser.add_argument("--api-key", help="Anthropic API key (or set ANTHROPIC_API_KEY)")
    parser.add_argument("--agent", type=int, help="Launch specific agent only")
    parser.add_argument("--monitor", action="store_true", help="Monitor agent progress")
    
    args = parser.parse_args()
    
    # Check for API access
    if not HAS_ANTHROPIC:
        print("❌ anthropic package required. Install with:")
        print("   pip3 install anthropic")
        return
    
    # Set up API key
    if args.api_key:
        os.environ["ANTHROPIC_API_KEY"] = args.api_key
    
    # Agent configurations
    agent_configs = {
        1: {"name": "Core Data Infrastructure", "priority": 1},
        2: {"name": "API Integration", "priority": 1},
        3: {"name": "Data Processing", "priority": 2},
        4: {"name": "Robustness & Reliability", "priority": 2},
        5: {"name": "Performance", "priority": 3},
        6: {"name": "Operations & Monitoring", "priority": 3},
        7: {"name": "DevOps", "priority": 4},
        8: {"name": "QA", "priority": 2},
        9: {"name": "Maintenance", "priority": 5}
    }
    
    # Create orchestrator
    orchestrator = ClaudeCodeOrchestrator()
    
    if args.monitor:
        # Monitor existing sessions
        orchestrator.monitor_agents()
    elif args.agent:
        # Launch single agent
        if args.agent in agent_configs:
            await orchestrator.launch_agent(args.agent, agent_configs[args.agent])
        else:
            print(f"❌ Invalid agent number: {args.agent}")
    else:
        # Launch all agents
        await orchestrator.launch_all_agents(agent_configs)
        
        print("\n✨ All agents launched!")
        print("\nMonitor progress with: python3 claude_code_api_launcher.py --monitor")

if __name__ == "__main__":
    asyncio.run(main())