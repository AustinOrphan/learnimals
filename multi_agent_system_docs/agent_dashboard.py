#!/usr/bin/env python3
"""
Real-time Agent Monitoring Dashboard
Tracks agent progress, commits, and PATH document updates
"""

import subprocess
import os
import re
import json
from datetime import datetime, timedelta
from pathlib import Path
import time

class AgentMonitor:
    def __init__(self, base_path):
        self.base_path = Path(base_path)
        self.agents = {
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
        os.chdir(self.base_path)

    def get_commit_count(self, branch):
        """Get total number of commits on a branch"""
        try:
            result = subprocess.run(
                ['git', 'rev-list', '--count', branch],
                capture_output=True, text=True, cwd="."
            )
            return int(result.stdout.strip()) if result.returncode == 0 else 0
        except:
            return 0

    def get_recent_commits(self, branch, minutes=30):
        """Get commits from last N minutes"""
        try:
            since = f"{minutes} minutes ago"
            result = subprocess.run(
                ['git', 'log', '--oneline', f'--since={since}', branch],
                capture_output=True, text=True, cwd="."
            )
            if result.returncode == 0 and result.stdout.strip():
                return result.stdout.strip().split('\n')
            return []
        except:
            return []

    def get_path_progress(self, agent_num):
        """Get PATH document completion status"""
        path_file = self.base_path / f"gh_pr_dump_fix_plan/PATH_{agent_num}_*.md"
        path_files = list(self.base_path.glob(f"gh_pr_dump_fix_plan/PATH_{agent_num}_*.md"))
        
        if not path_files:
            return 0, 0, 0
        
        try:
            with open(path_files[0], 'r') as f:
                content = f.read()
                completed = content.count('- [x]')
                pending = content.count('- [ ]')
                total = completed + pending
                return completed, total, (completed / total * 100) if total > 0 else 0
        except:
            return 0, 0, 0

    def get_agent_status(self, agent_num):
        """Get comprehensive status for an agent"""
        info = self.agents[agent_num]
        branch = info["branch"]
        
        # Git activity
        total_commits = self.get_commit_count(branch)
        recent_commits = self.get_recent_commits(branch, 30)
        
        # PATH progress
        completed, total, percent = self.get_path_progress(agent_num)
        
        # Status determination
        if total_commits == 0:
            status = "🔴 NOT_STARTED"
        elif completed == 0:
            status = "⚠️ WORKING_NO_DOCS"
        elif len(recent_commits) > 0:
            status = "🟢 ACTIVE"
        else:
            status = "🟡 DOCUMENTING"
        
        return {
            "agent_num": agent_num,
            "name": info["name"],
            "branch": branch,
            "total_commits": total_commits,
            "recent_commits": len(recent_commits),
            "recent_commit_details": recent_commits[:3],
            "path_completed": completed,
            "path_total": total,
            "path_percent": percent,
            "status": status,
            "last_updated": datetime.now().isoformat()
        }

    def generate_dashboard(self):
        """Generate comprehensive dashboard"""
        print("🤖 AGENT MONITORING DASHBOARD")
        print("=" * 80)
        print(f"📅 Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # Header
        print(f"{'Agent':<5} {'Name':<25} {'Commits':<8} {'PATH %':<8} {'Status':<20} {'Recent Activity'}")
        print("-" * 80)
        
        total_commits = 0
        total_path_tasks = 0
        total_completed_tasks = 0
        active_agents = 0
        
        for agent_num in sorted(self.agents.keys()):
            status = self.get_agent_status(agent_num)
            
            # Update totals
            total_commits += status["total_commits"]
            total_path_tasks += status["path_total"]
            total_completed_tasks += status["path_completed"]
            if status["recent_commits"] > 0:
                active_agents += 1
            
            # Format status line
            name_short = status["name"][:23] + ".." if len(status["name"]) > 25 else status["name"]
            commits_str = f"{status['total_commits']}"
            path_str = f"{status['path_percent']:.1f}%"
            recent_str = f"{status['recent_commits']} in 30m"
            
            print(f"{agent_num:<5} {name_short:<25} {commits_str:<8} {path_str:<8} {status['status']:<20} {recent_str}")
            
            # Show recent commit details if any
            if status["recent_commit_details"]:
                for commit in status["recent_commit_details"]:
                    if commit.strip():
                        commit_short = commit[:70] + "..." if len(commit) > 70 else commit
                        print(f"      └─ {commit_short}")
        
        print("-" * 80)
        
        # Summary statistics
        overall_progress = (total_completed_tasks / total_path_tasks * 100) if total_path_tasks > 0 else 0
        print(f"📊 SUMMARY:")
        print(f"   Total Commits: {total_commits}")
        print(f"   Overall Progress: {total_completed_tasks}/{total_path_tasks} ({overall_progress:.1f}%)")
        print(f"   Active Agents (30m): {active_agents}/9")
        print(f"   Agents Documenting: {sum(1 for i in range(1,10) if self.get_path_progress(i)[0] > 0)}/9")
        
        return {
            "timestamp": datetime.now().isoformat(),
            "total_commits": total_commits,
            "overall_progress": overall_progress,
            "active_agents": active_agents,
            "agents": [self.get_agent_status(i) for i in range(1, 10)]
        }

    def continuous_monitor(self, refresh_seconds=60):
        """Run continuous monitoring with refresh"""
        try:
            while True:
                os.system('clear' if os.name == 'posix' else 'cls')
                dashboard_data = self.generate_dashboard()
                
                print(f"\n🔄 Next refresh in {refresh_seconds} seconds... (Ctrl+C to exit)")
                time.sleep(refresh_seconds)
        except KeyboardInterrupt:
            print("\n\n👋 Dashboard monitoring stopped.")

    def save_snapshot(self, filename=None):
        """Save current status to JSON file"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"agent_snapshot_{timestamp}.json"
        
        data = self.generate_dashboard()
        
        snapshot_path = self.base_path / "gh_pr_dump_fix_plan/AGENT_SNAPSHOTS"
        snapshot_path.mkdir(exist_ok=True)
        
        with open(snapshot_path / filename, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"\n💾 Snapshot saved: {snapshot_path / filename}")


def main():
    base_path = "/Users/austinorphan/Library/Mobile Documents/com~apple~CloudDocs/src/devTools/gh_pr_dump"
    monitor = AgentMonitor(base_path)
    
    if len(os.sys.argv) > 1:
        if os.sys.argv[1] == "--continuous":
            refresh = int(os.sys.argv[2]) if len(os.sys.argv) > 2 else 60
            monitor.continuous_monitor(refresh)
        elif os.sys.argv[1] == "--snapshot":
            monitor.save_snapshot()
        elif os.sys.argv[1] == "--json":
            data = monitor.generate_dashboard()
            print(json.dumps(data, indent=2))
    else:
        # Single dashboard display
        monitor.generate_dashboard()


if __name__ == "__main__":
    main()