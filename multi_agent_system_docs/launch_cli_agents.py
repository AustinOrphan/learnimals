#!/usr/bin/env python3
"""
Claude CLI Agent Launcher
Launches Claude Code CLI instances with dedicated sessions for each agent
"""

import os
import sys
import json
import time
import signal
import subprocess
import threading
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
import uuid

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
PROMPTS_DIR = PROJECT_ROOT / "AGENT_INITIALIZATION" / "prompts"
LOGS_DIR = PROJECT_ROOT / "AGENT_LOGS"
SESSIONS_DIR = PROJECT_ROOT / "AGENT_SESSIONS"
SESSIONS_DIR.mkdir(exist_ok=True)

# Claude CLI path
CLAUDE_CLI = os.path.expanduser("~/.claude/local/claude")

class CLIAgentLauncher:
    """Manages Claude CLI agent sessions."""
    
    def __init__(self):
        self.processes: Dict[int, subprocess.Popen] = {}
        self.session_ids: Dict[int, str] = {}
        self.launch_log = []
        
        # Agent configurations with priorities
        self.agents = {
            1: {"name": "Core Data Infrastructure", "priority": 1, "critical": True},
            2: {"name": "API Integration", "priority": 1, "critical": True},
            3: {"name": "Data Processing", "priority": 2, "critical": False},
            4: {"name": "Robustness & Reliability", "priority": 2, "critical": False},
            5: {"name": "Performance", "priority": 3, "critical": False},
            6: {"name": "Operations & Monitoring", "priority": 3, "critical": False},
            7: {"name": "DevOps", "priority": 4, "critical": False},
            8: {"name": "QA", "priority": 2, "critical": False},
            9: {"name": "Maintenance", "priority": 5, "critical": False}
        }
        
        # Create log directory
        LOGS_DIR.mkdir(exist_ok=True)
        
        # Set up signal handling for graceful shutdown
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
    
    def check_claude_cli(self) -> bool:
        """Check if Claude CLI is available and working."""
        try:
            result = subprocess.run([CLAUDE_CLI, "--version"], 
                                  capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                print(f"✅ Claude CLI found: {result.stdout.strip()}")
                return True
            else:
                print(f"❌ Claude CLI error: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ Claude CLI not found or not working: {e}")
            print(f"Expected path: {CLAUDE_CLI}")
            return False
    
    def create_session_id(self, agent_num: int) -> str:
        """Create a unique session ID for an agent."""
        session_id = str(uuid.uuid4())
        self.session_ids[agent_num] = session_id
        return session_id
    
    def prepare_agent_prompt(self, agent_num: int) -> str:
        """Load and prepare the agent prompt."""
        prompt_file = PROMPTS_DIR / f"agent_{agent_num}_prompt.md"
        if not prompt_file.exists():
            raise FileNotFoundError(f"Prompt file not found: {prompt_file}")
        
        base_prompt = prompt_file.read_text()
        
        # Add CLI-specific instructions
        branch_name = f"feature/{self.agents[agent_num]['name'].lower().replace(' ', '-').replace('&', 'and')}"
        cli_instructions = f"""
## CLI Mode Instructions

You are running as Claude CLI instance for Agent {agent_num}.

Session ID: {self.session_ids.get(agent_num, 'unknown')}
Working Directory: {PROJECT_ROOT.parent}
Branch: {branch_name}

**IMPORTANT - First Actions:**
1. Switch to your feature branch:
   ```bash
   git checkout {branch_name}
   ```
2. Verify you're on the correct branch:
   ```bash
   git branch --show-current
   ```

Additional CLI behaviors:
1. ALWAYS work on your feature branch, never on main
2. Use --print mode for status updates when helpful
3. Session will persist - your work continues across interactions
4. Commit your changes frequently with descriptive messages
5. Update your PATH_{agent_num}*.md file checkboxes as you complete tasks
6. Log issues using the issue_logger.py system

After switching to your branch, start working immediately on your first unblocked task.
"""
        
        return base_prompt + cli_instructions
    
    def setup_git_branch(self, agent_num: int) -> str:
        """Set up git branch for the agent (creates branch but stays on main)."""
        agent_config = self.agents[agent_num]
        branch_name = f"feature/{agent_config['name'].lower().replace(' ', '-').replace('&', 'and')}"
        
        try:
            # Check if branch exists
            result = subprocess.run(
                ["git", "rev-parse", "--verify", branch_name],
                cwd=PROJECT_ROOT.parent,
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                # Create new branch without switching to it
                subprocess.run(
                    ["git", "branch", branch_name],
                    cwd=PROJECT_ROOT.parent,
                    check=True
                )
                print(f"✅ Created branch: {branch_name} (agent will switch to it)")
            else:
                print(f"✅ Branch already exists: {branch_name}")
                
            return branch_name
            
        except subprocess.CalledProcessError as e:
            print(f"⚠️  Warning: Could not set up git branch: {e}")
            return branch_name

    def launch_agent_cli(self, agent_num: int) -> Tuple[bool, Dict]:
        """Launch a single agent via Claude CLI."""
        agent_config = self.agents[agent_num]
        print(f"\n🚀 Launching Agent {agent_num} - {agent_config['name']}")
        
        try:
            # Set up git branch
            branch_name = self.setup_git_branch(agent_num)
            
            # Create session ID
            session_id = self.create_session_id(agent_num)
            
            # Prepare prompt
            prompt = self.prepare_agent_prompt(agent_num)
            
            # Save prompt to temp file
            prompt_file = SESSIONS_DIR / f"agent_{agent_num}_prompt.txt"
            prompt_file.write_text(prompt)
            
            # Create log files
            stdout_log = LOGS_DIR / f"agent_{agent_num}_stdout.log"
            stderr_log = LOGS_DIR / f"agent_{agent_num}_stderr.log"
            
            # Build Claude CLI command
            cmd = [
                CLAUDE_CLI,
                "--session-id", session_id,
                "--add-dir", str(PROJECT_ROOT.parent),
                "--permission-mode", "acceptEdits",
                "--allowedTools", "Bash,Edit,Write,Read,Glob,Grep,LS,MultiEdit,TodoWrite",
                "--model", "opus",  # Use Opus for complex development tasks
                prompt
            ]
            
            print(f"📋 Command: {' '.join(cmd[:5])}... [truncated]")
            print(f"📁 Working in: {PROJECT_ROOT.parent}")
            print(f"🆔 Session ID: {session_id}")
            
            # Launch process
            with open(stdout_log, 'w') as stdout_f, open(stderr_log, 'w') as stderr_f:
                process = subprocess.Popen(
                    cmd,
                    cwd=PROJECT_ROOT.parent,
                    stdout=stdout_f,
                    stderr=stderr_f,
                    stdin=subprocess.PIPE,
                    text=True
                )
            
            # Store process reference
            self.processes[agent_num] = process
            
            # Save session info
            session_info = {
                "agent_num": agent_num,
                "agent_name": agent_config['name'],
                "session_id": session_id,
                "process_id": process.pid,
                "start_time": datetime.now().isoformat(),
                "working_dir": str(PROJECT_ROOT.parent),
                "branch": branch_name,
                "command": cmd,
                "stdout_log": str(stdout_log),
                "stderr_log": str(stderr_log)
            }
            
            session_file = SESSIONS_DIR / f"agent_{agent_num}_session.json"
            session_file.write_text(json.dumps(session_info, indent=2))
            
            # Log successful launch
            self.log_launch(agent_num, "success", {
                "session_id": session_id,
                "pid": process.pid,
                "cmd_preview": " ".join(cmd[:5])
            })
            
            print(f"✅ Agent {agent_num} launched successfully (PID: {process.pid})")
            print(f"📄 Session info: {session_file}")
            print(f"📝 Logs: {stdout_log}")
            
            return True, session_info
            
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Failed to launch agent {agent_num}: {error_msg}")
            
            self.log_launch(agent_num, "failed", {"error": error_msg})
            
            return False, {"error": error_msg}
    
    def launch_all_agents(self, parallel: bool = True, max_workers: int = 3):
        """Launch all agents with proper dependency ordering."""
        print(f"\n🚀 Launching all agents via Claude CLI")
        print("=" * 60)
        
        if not self.check_claude_cli():
            print("❌ Cannot proceed without working Claude CLI")
            return
        
        # Sort agents by priority (critical first, then by priority level)
        sorted_agents = sorted(
            self.agents.items(),
            key=lambda x: (0 if x[1]['critical'] else 1, x[1]['priority'], x[0])
        )
        
        successful_launches = []
        failed_launches = []
        
        if parallel:
            # Launch critical agents first, then others in parallel
            critical_agents = [(num, cfg) for num, cfg in sorted_agents if cfg['critical']]
            other_agents = [(num, cfg) for num, cfg in sorted_agents if not cfg['critical']]
            
            # Launch critical agents sequentially
            print("\n🔥 Launching critical agents first...")
            for agent_num, config in critical_agents:
                success, info = self.launch_agent_cli(agent_num)
                if success:
                    successful_launches.append((agent_num, info))
                else:
                    failed_launches.append((agent_num, info))
                time.sleep(2)  # Brief delay between critical agents
            
            # Launch other agents in parallel
            if other_agents:
                print(f"\n⚡ Launching {len(other_agents)} other agents in parallel...")
                with ThreadPoolExecutor(max_workers=max_workers) as executor:
                    future_to_agent = {
                        executor.submit(self.launch_agent_cli, agent_num): agent_num
                        for agent_num, config in other_agents
                    }
                    
                    for future in as_completed(future_to_agent):
                        agent_num = future_to_agent[future]
                        try:
                            success, info = future.result()
                            if success:
                                successful_launches.append((agent_num, info))
                            else:
                                failed_launches.append((agent_num, info))
                        except Exception as e:
                            failed_launches.append((agent_num, {"error": str(e)}))
        else:
            # Sequential launch
            for agent_num, config in sorted_agents:
                success, info = self.launch_agent_cli(agent_num)
                if success:
                    successful_launches.append((agent_num, info))
                else:
                    failed_launches.append((agent_num, info))
                time.sleep(2)
        
        # Save master session log
        self.save_master_session_log(successful_launches, failed_launches)
        
        # Print summary
        self.print_launch_summary(successful_launches, failed_launches)
        
        # Monitor agents if any launched successfully
        if successful_launches and len(self.processes) > 0:
            self.monitor_agents()
    
    def save_master_session_log(self, successful: List, failed: List):
        """Save master session information."""
        master_log = {
            "launch_time": datetime.now().isoformat(),
            "method": "claude-cli",
            "total_agents": len(self.agents),
            "successful": len(successful),
            "failed": len(failed),
            "successful_agents": [
                {"agent": num, "session_id": info.get("session_id"), "pid": info.get("process_id")}
                for num, info in successful
            ],
            "failed_agents": [
                {"agent": num, "error": info.get("error")}
                for num, info in failed
            ],
            "session_ids": self.session_ids
        }
        
        master_file = SESSIONS_DIR / f"master_session_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        master_file.write_text(json.dumps(master_log, indent=2))
        print(f"\n📄 Master session log: {master_file}")
    
    def print_launch_summary(self, successful: List, failed: List):
        """Print launch summary."""
        print("\n" + "=" * 60)
        print("📊 CLAUDE CLI LAUNCH SUMMARY")
        print("=" * 60)
        
        print(f"✅ Successful launches: {len(successful)}")
        print(f"❌ Failed launches: {len(failed)}")
        print(f"🔄 Active processes: {len(self.processes)}")
        
        if successful:
            print("\n✅ Successfully launched:")
            for agent_num, info in successful:
                print(f"  Agent {agent_num} - PID {info.get('process_id')} - Session {info.get('session_id', 'unknown')[:8]}...")
        
        if failed:
            print("\n❌ Failed to launch:")
            for agent_num, info in failed:
                print(f"  Agent {agent_num}: {info.get('error', 'Unknown error')}")
        
        if self.processes:
            print(f"\n📁 Session files: {SESSIONS_DIR}")
            print(f"📝 Logs directory: {LOGS_DIR}")
    
    def monitor_agents(self):
        """Monitor running agents."""
        print(f"\n👀 Monitoring {len(self.processes)} active agents...")
        print("Press Ctrl+C to stop monitoring and terminate all agents")
        
        try:
            while self.processes:
                # Check process status
                active_processes = {}
                for agent_num, process in list(self.processes.items()):
                    if process.poll() is None:  # Process still running
                        active_processes[agent_num] = process
                    else:
                        print(f"\n⚠️  Agent {agent_num} process ended (exit code: {process.returncode})")
                        self.log_launch(agent_num, "ended", {"exit_code": process.returncode})
                
                self.processes = active_processes
                
                if not self.processes:
                    print("\n✅ All agents have completed")
                    break
                
                # Status update
                print(f"\r🔄 Active agents: {len(self.processes)} - {list(self.processes.keys())}", end="")
                time.sleep(10)  # Check every 10 seconds
                
        except KeyboardInterrupt:
            print(f"\n\n🛑 Monitoring interrupted - terminating all agents...")
            self.terminate_all_agents()
    
    def terminate_all_agents(self):
        """Terminate all running agent processes."""
        for agent_num, process in list(self.processes.items()):
            try:
                print(f"🛑 Terminating Agent {agent_num} (PID: {process.pid})")
                process.terminate()
                
                # Wait for graceful termination
                try:
                    process.wait(timeout=5)
                    print(f"✅ Agent {agent_num} terminated gracefully")
                except subprocess.TimeoutExpired:
                    print(f"⚡ Force killing Agent {agent_num}")
                    process.kill()
                    process.wait()
                
                self.log_launch(agent_num, "terminated", {"reason": "user_request"})
                
            except Exception as e:
                print(f"❌ Error terminating Agent {agent_num}: {e}")
        
        self.processes.clear()
        print("✅ All agents terminated")
    
    def signal_handler(self, signum, frame):
        """Handle system signals gracefully."""
        print(f"\n\n🛑 Received signal {signum} - shutting down...")
        self.terminate_all_agents()
        sys.exit(0)
    
    def log_launch(self, agent_num: int, status: str, details: Dict):
        """Log launch events."""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "agent": agent_num,
            "name": self.agents[agent_num]['name'],
            "status": status,
            "details": details
        }
        self.launch_log.append(entry)
        
        # Also write to file immediately
        log_file = LOGS_DIR / f"cli_launcher_{datetime.now().strftime('%Y%m%d')}.jsonl"
        with open(log_file, 'a') as f:
            f.write(json.dumps(entry) + '\n')

def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Launch Claude CLI agents")
    parser.add_argument("--agent", type=int, help="Launch specific agent only (1-9)")
    parser.add_argument("--sequential", action="store_true", 
                       help="Launch agents sequentially instead of parallel")
    parser.add_argument("--max-workers", type=int, default=3,
                       help="Max parallel processes for non-critical agents")
    parser.add_argument("--check-cli", action="store_true",
                       help="Check Claude CLI installation and exit")
    parser.add_argument("--list-sessions", action="store_true",
                       help="List existing agent sessions")
    parser.add_argument("--terminate-all", action="store_true",
                       help="Terminate all running agents")
    
    args = parser.parse_args()
    
    launcher = CLIAgentLauncher()
    
    if args.check_cli:
        if launcher.check_claude_cli():
            print("✅ Claude CLI is ready for agent launch")
        else:
            print("❌ Claude CLI needs to be set up")
        return
    
    if args.list_sessions:
        print("\n📋 Existing agent sessions:")
        for session_file in SESSIONS_DIR.glob("agent_*_session.json"):
            try:
                session_data = json.loads(session_file.read_text())
                print(f"  Agent {session_data['agent_num']}: {session_data['session_id'][:8]}... (PID: {session_data.get('process_id', 'unknown')})")
            except:
                print(f"  {session_file.name}: (corrupted)")
        return
    
    if args.terminate_all:
        # Find and terminate existing processes
        print("🛑 Terminating all agents...")
        launcher.terminate_all_agents()
        return
    
    # Check for existing prompts
    if not PROMPTS_DIR.exists() or not list(PROMPTS_DIR.glob("agent_*.md")):
        print("❌ No agent prompts found!")
        print("Run first: python3 initialize_agent.py --all")
        return
    
    if args.agent:
        # Launch single agent
        if args.agent in launcher.agents:
            success, info = launcher.launch_agent_cli(args.agent)
            if success:
                print(f"\n✅ Agent {args.agent} launched. Monitoring...")
                try:
                    launcher.processes[args.agent].wait()
                    print(f"✅ Agent {args.agent} completed")
                except KeyboardInterrupt:
                    launcher.terminate_all_agents()
        else:
            print(f"❌ Invalid agent number: {args.agent}")
    else:
        # Launch all agents
        launcher.launch_all_agents(
            parallel=not args.sequential,
            max_workers=args.max_workers
        )

if __name__ == "__main__":
    main()