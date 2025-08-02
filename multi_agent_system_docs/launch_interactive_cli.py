#!/usr/bin/env python3
"""
Interactive Claude CLI Agent Launcher
Launches agents in screen/tmux sessions for interactive monitoring
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
PROMPTS_DIR = PROJECT_ROOT / "AGENT_INITIALIZATION" / "prompts"
LOGS_DIR = PROJECT_ROOT / "AGENT_LOGS"
SESSIONS_DIR = PROJECT_ROOT / "AGENT_SESSIONS"

# Claude CLI path
CLAUDE_CLI = os.path.expanduser("~/.claude/local/claude")

class InteractiveCLILauncher:
    """Launches Claude CLI agents in interactive sessions."""
    
    def __init__(self, session_manager: str = "auto"):
        self.session_manager = session_manager
        self.agents = {
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
        
        # Detect available session manager
        if session_manager == "auto":
            self.session_manager = self.detect_session_manager()
        
        LOGS_DIR.mkdir(exist_ok=True)
        SESSIONS_DIR.mkdir(exist_ok=True)
    
    def detect_session_manager(self) -> str:
        """Detect available session manager (tmux, screen, or terminal)."""
        try:
            subprocess.run(["tmux", "-V"], capture_output=True, check=True)
            return "tmux"
        except:
            pass
        
        try:
            subprocess.run(["screen", "-v"], capture_output=True, check=True)
            return "screen"
        except:
            pass
        
        return "terminal"
    
    def create_launch_script(self, agent_num: int) -> Path:
        """Create a launch script for an agent."""
        agent_config = self.agents[agent_num]
        script_path = SESSIONS_DIR / f"launch_agent_{agent_num}.sh"
        
        # Read prompt
        prompt_file = PROMPTS_DIR / f"agent_{agent_num}_prompt.md"
        if not prompt_file.exists():
            raise FileNotFoundError(f"Prompt file not found: {prompt_file}")
        
        # Create session ID
        session_id = f"agent-{agent_num}-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        # Create the launch script
        script_content = f'''#!/bin/bash
# Launch script for Agent {agent_num} - {agent_config['name']}

set -e

echo "🚀 Starting Agent {agent_num} - {agent_config['name']}"
echo "📁 Working directory: {PROJECT_ROOT.parent}"
echo "🆔 Session ID: {session_id}"
echo "📄 Prompt file: {prompt_file}"
echo ""

cd "{PROJECT_ROOT.parent}"

# Set up git branch
BRANCH="feature/{agent_config['name'].lower().replace(' ', '-').replace('&', 'and')}"
echo "🌿 Setting up branch: $BRANCH"

if ! git rev-parse --verify "$BRANCH" >/dev/null 2>&1; then
    git checkout -b "$BRANCH"
    echo "✅ Created new branch: $BRANCH"
else
    git checkout "$BRANCH"
    echo "✅ Switched to existing branch: $BRANCH"
fi

echo ""
echo "🤖 Launching Claude CLI..."
echo "📝 Logs will be saved to: {LOGS_DIR}/agent_{agent_num}_session.log"
echo ""

# Launch Claude CLI with the prompt
exec "{CLAUDE_CLI}" \\
    --session-id "{session_id}" \\
    --add-dir "{PROJECT_ROOT.parent}" \\
    --permission-mode acceptEdits \\
    --allowedTools "Bash,Edit,Write,Read,Glob,Grep,LS,MultiEdit,TodoWrite" \\
    --model opus \\
    "$(cat "{prompt_file}")" \\
    2>&1 | tee "{LOGS_DIR}/agent_{agent_num}_session.log"
'''
        
        script_path.write_text(script_content)
        script_path.chmod(0o755)
        
        return script_path
    
    def launch_agent_tmux(self, agent_num: int) -> bool:
        """Launch agent in tmux session."""
        try:
            script_path = self.create_launch_script(agent_num)
            session_name = f"claude-agent-{agent_num}"
            agent_name = self.agents[agent_num]['name']
            
            # Create tmux session
            cmd = [
                "tmux", "new-session", "-d",
                "-s", session_name,
                "-n", f"Agent-{agent_num}",
                str(script_path)
            ]
            
            subprocess.run(cmd, check=True)
            print(f"✅ Agent {agent_num} launched in tmux session: {session_name}")
            print(f"   Attach with: tmux attach -t {session_name}")
            
            return True
            
        except Exception as e:
            print(f"❌ Failed to launch Agent {agent_num} in tmux: {e}")
            return False
    
    def launch_agent_screen(self, agent_num: int) -> bool:
        """Launch agent in screen session."""
        try:
            script_path = self.create_launch_script(agent_num)
            session_name = f"claude-agent-{agent_num}"
            
            # Create screen session
            cmd = [
                "screen", "-dmS", session_name,
                "bash", str(script_path)
            ]
            
            subprocess.run(cmd, check=True)
            print(f"✅ Agent {agent_num} launched in screen session: {session_name}")
            print(f"   Attach with: screen -r {session_name}")
            
            return True
            
        except Exception as e:
            print(f"❌ Failed to launch Agent {agent_num} in screen: {e}")
            return False
    
    def launch_agent_terminal(self, agent_num: int) -> bool:
        """Launch agent in new terminal window."""
        try:
            script_path = self.create_launch_script(agent_num)
            agent_name = self.agents[agent_num]['name']
            
            # macOS Terminal
            if sys.platform == "darwin":
                cmd = [
                    "osascript", "-e",
                    f'''tell application "Terminal"
                        do script "{script_path}"
                        set name of front window to "Agent {agent_num} - {agent_name}"
                    end tell'''
                ]
            # Linux with gnome-terminal
            elif subprocess.run(["which", "gnome-terminal"], capture_output=True).returncode == 0:
                cmd = [
                    "gnome-terminal", "--title", f"Agent {agent_num} - {agent_name}",
                    "--", "bash", str(script_path)
                ]
            # Fallback to xterm
            else:
                cmd = [
                    "xterm", "-title", f"Agent {agent_num} - {agent_name}",
                    "-e", "bash", str(script_path)
                ]
            
            subprocess.Popen(cmd)
            print(f"✅ Agent {agent_num} launched in new terminal window")
            
            return True
            
        except Exception as e:
            print(f"❌ Failed to launch Agent {agent_num} in terminal: {e}")
            return False
    
    def launch_agent(self, agent_num: int) -> bool:
        """Launch agent using the configured session manager."""
        print(f"\n🚀 Launching Agent {agent_num} - {self.agents[agent_num]['name']} via {self.session_manager}")
        
        if self.session_manager == "tmux":
            return self.launch_agent_tmux(agent_num)
        elif self.session_manager == "screen":
            return self.launch_agent_screen(agent_num)
        else:
            return self.launch_agent_terminal(agent_num)
    
    def launch_all_agents(self, delay: int = 3):
        """Launch all agents with staggered timing."""
        print(f"\n🚀 Launching all agents via {self.session_manager}")
        print("=" * 60)
        
        # Sort by priority
        sorted_agents = sorted(
            self.agents.items(),
            key=lambda x: (x[1]['priority'], x[0])
        )
        
        successful = 0
        failed = 0
        
        for agent_num, config in sorted_agents:
            if self.launch_agent(agent_num):
                successful += 1
            else:
                failed += 1
            
            # Delay between launches
            if agent_num != sorted_agents[-1][0]:  # Not the last agent
                import time
                print(f"⏳ Waiting {delay} seconds before next launch...")
                time.sleep(delay)
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 INTERACTIVE LAUNCH SUMMARY")
        print("=" * 60)
        print(f"✅ Successful: {successful}")
        print(f"❌ Failed: {failed}")
        print(f"🖥️  Session manager: {self.session_manager}")
        
        # Show connection instructions
        self.show_connection_instructions()
    
    def show_connection_instructions(self):
        """Show how to connect to the launched sessions."""
        print("\n📱 How to monitor your agents:")
        print("=" * 40)
        
        if self.session_manager == "tmux":
            print("🔍 List all sessions:")
            print("   tmux list-sessions")
            print("\n🔗 Connect to specific agent:")
            for agent_num in self.agents:
                print(f"   tmux attach -t claude-agent-{agent_num}  # Agent {agent_num}")
            print("\n⌨️  Tmux shortcuts:")
            print("   Ctrl+B, D     - Detach from session")
            print("   Ctrl+B, C     - Create new window")
            print("   Ctrl+B, N     - Next window")
        
        elif self.session_manager == "screen":
            print("🔍 List all sessions:")
            print("   screen -ls")
            print("\n🔗 Connect to specific agent:")
            for agent_num in self.agents:
                print(f"   screen -r claude-agent-{agent_num}  # Agent {agent_num}")
            print("\n⌨️  Screen shortcuts:")
            print("   Ctrl+A, D     - Detach from session")
            print("   Ctrl+A, C     - Create new window")
            print("   Ctrl+A, N     - Next window")
        
        else:
            print("🖥️  Agents launched in separate terminal windows")
            print("   Check your terminal application for the new windows")
        
        print(f"\n📁 Session scripts saved in: {SESSIONS_DIR}")
        print(f"📝 Logs available in: {LOGS_DIR}")
    
    def list_active_sessions(self):
        """List currently active agent sessions."""
        print("\n📋 Active Agent Sessions:")
        print("=" * 40)
        
        if self.session_manager == "tmux":
            try:
                result = subprocess.run(["tmux", "list-sessions"], 
                                      capture_output=True, text=True)
                if result.returncode == 0:
                    for line in result.stdout.strip().split('\n'):
                        if 'claude-agent-' in line:
                            print(f"  {line}")
                else:
                    print("  No tmux sessions found")
            except:
                print("  Cannot list tmux sessions")
        
        elif self.session_manager == "screen":
            try:
                result = subprocess.run(["screen", "-ls"], 
                                      capture_output=True, text=True)
                if result.returncode == 0:
                    for line in result.stdout.strip().split('\n'):
                        if 'claude-agent-' in line:
                            print(f"  {line}")
                else:
                    print("  No screen sessions found")
            except:
                print("  Cannot list screen sessions")
        
        else:
            print("  Terminal sessions - check your terminal windows")

def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Launch Claude CLI agents interactively")
    parser.add_argument("--session-manager", 
                       choices=["tmux", "screen", "terminal", "auto"],
                       default="auto",
                       help="Session manager to use")
    parser.add_argument("--agent", type=int, 
                       help="Launch specific agent only (1-9)")
    parser.add_argument("--delay", type=int, default=3,
                       help="Delay between agent launches (seconds)")
    parser.add_argument("--list", action="store_true",
                       help="List active agent sessions")
    
    args = parser.parse_args()
    
    launcher = InteractiveCLILauncher(session_manager=args.session_manager)
    
    if args.list:
        launcher.list_active_sessions()
        return
    
    # Check for existing prompts
    if not PROMPTS_DIR.exists() or not list(PROMPTS_DIR.glob("agent_*.md")):
        print("❌ No agent prompts found!")
        print("Run first: python3 initialize_agent.py --all")
        return
    
    print(f"🎛️  Using session manager: {launcher.session_manager}")
    
    if args.agent:
        # Launch single agent
        if args.agent in launcher.agents:
            launcher.launch_agent(args.agent)
        else:
            print(f"❌ Invalid agent number: {args.agent}")
    else:
        # Launch all agents
        launcher.launch_all_agents(delay=args.delay)
    
    print("\n✨ Launch complete!")

if __name__ == "__main__":
    main()