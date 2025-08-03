#!/usr/bin/env python3
"""
Automatic Agent Status Checker and Prompt Updater
Checks agent status and generates prompt update recommendations
"""

import subprocess
import os
import json
from datetime import datetime
from pathlib import Path
import re

class AgentStatusChecker:
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
                capture_output=True, text=True
            )
            return int(result.stdout.strip()) if result.returncode == 0 else 0
        except:
            return 0

    def get_recent_commits(self, branch, minutes=30):
        """Get commits from last N minutes with details"""
        try:
            since = f"{minutes} minutes ago"
            result = subprocess.run(
                ['git', 'log', '--pretty=format:%h %s', f'--since={since}', branch, '-5'],
                capture_output=True, text=True
            )
            if result.returncode == 0 and result.stdout.strip():
                return result.stdout.strip().split('\n')
            return []
        except:
            return []

    def get_path_progress(self, agent_num):
        """Get PATH document completion status"""
        path_files = list(self.base_path.glob(f"gh_pr_dump_fix_plan/PATH_{agent_num}_*.md"))
        
        if not path_files:
            return 0, 0, 0
        
        try:
            with open(path_files[0], 'r') as f:
                content = f.read()
                completed = content.count('- [x]')
                pending = content.count('- [ ]')
                total = completed + pending
                percent = (completed / total * 100) if total > 0 else 0
                return completed, total, percent
        except:
            return 0, 0, 0

    def analyze_agent_status(self, agent_num):
        """Comprehensive status analysis for an agent"""
        info = self.agents[agent_num]
        branch = info["branch"]
        
        # Git metrics
        total_commits = self.get_commit_count(branch)
        recent_commits = self.get_recent_commits(branch, 30)
        
        # PATH metrics
        completed, total_tasks, percent = self.get_path_progress(agent_num)
        
        # Calculate documentation gap
        expected_percent = min(100, (total_commits * 10))  # Rough estimate: 10% per commit
        documentation_gap = expected_percent - percent
        
        # Status determination
        if total_commits == 0:
            status = "NOT_STARTED"
            urgency = "LOW"
        elif percent == 100:
            status = "COMPLETE"
            urgency = "NONE"
        elif percent > 0 and documentation_gap < 20:
            status = "GOOD_PROGRESS"
            urgency = "LOW"
        elif percent > 0:
            status = "DOCUMENTING_SLOW"
            urgency = "MEDIUM"
        else:
            status = "WORKING_NO_DOCS"
            urgency = "CRITICAL"
        
        return {
            "agent_num": agent_num,
            "name": info["name"],
            "branch": branch,
            "total_commits": total_commits,
            "recent_commits": recent_commits,
            "path_completed": completed,
            "path_total": total_tasks,
            "path_percent": percent,
            "expected_percent": expected_percent,
            "documentation_gap": documentation_gap,
            "status": status,
            "urgency": urgency
        }

    def generate_prompt_updates(self):
        """Generate recommended prompt updates based on status"""
        updates = []
        
        # Collect all agent statuses
        all_statuses = []
        for agent_num in range(1, 10):
            status = self.analyze_agent_status(agent_num)
            all_statuses.append(status)
        
        # Calculate project metrics
        total_commits = sum(s["total_commits"] for s in all_statuses)
        overall_tasks = sum(s["path_total"] for s in all_statuses)
        overall_completed = sum(s["path_completed"] for s in all_statuses)
        overall_percent = (overall_completed / overall_tasks * 100) if overall_tasks > 0 else 0
        
        # Sort by urgency and documentation gap
        critical_agents = [s for s in all_statuses if s["urgency"] == "CRITICAL"]
        critical_agents.sort(key=lambda x: (-x["total_commits"], x["path_percent"]))
        
        for status in critical_agents:
            update = self.create_prompt_update(status, all_statuses, overall_percent)
            updates.append(update)
        
        return {
            "timestamp": datetime.now().isoformat(),
            "project_metrics": {
                "total_commits": total_commits,
                "overall_percent": overall_percent,
                "documenting_agents": sum(1 for s in all_statuses if s["path_percent"] > 0),
                "critical_agents": len(critical_agents)
            },
            "prompt_updates": updates,
            "all_statuses": all_statuses
        }

    def create_prompt_update(self, agent_status, all_statuses, overall_percent):
        """Create specific prompt update for an agent"""
        agent_num = agent_status["agent_num"]
        
        # Find success examples
        success_examples = [s for s in all_statuses if s["path_percent"] >= 90]
        success_examples.sort(key=lambda x: -x["path_percent"])
        
        # Build update message
        if agent_status["documentation_gap"] > 50:
            severity = "FINAL_WARNING"
            message = f"You have {agent_status['total_commits']} commits but still show 0% documentation!"
        elif agent_status["documentation_gap"] > 30:
            severity = "CRITICAL"
            message = f"Major documentation gap: {agent_status['total_commits']} commits, only {agent_status['path_percent']:.1f}% documented!"
        else:
            severity = "URGENT"
            message = f"Documentation falling behind: Expected {agent_status['expected_percent']:.0f}%, actual {agent_status['path_percent']:.1f}%"
        
        # Build commit list to document
        commits_to_document = []
        if agent_status["recent_commits"]:
            commits_to_document = agent_status["recent_commits"][:5]
        
        return {
            "agent_num": agent_num,
            "agent_name": agent_status["name"],
            "severity": severity,
            "message": message,
            "commits_to_document": commits_to_document,
            "current_progress": f"{agent_status['path_completed']}/{agent_status['path_total']} ({agent_status['path_percent']:.1f}%)",
            "expected_progress": f"{agent_status['expected_percent']:.0f}%",
            "success_examples": [
                f"Agent {s['agent_num']}: {s['path_percent']:.1f}% documented"
                for s in success_examples[:3]
            ],
            "prompt_file": f"agent_{agent_num}_prompt.md"
        }

    def generate_report(self):
        """Generate comprehensive status report with recommendations"""
        data = self.generate_prompt_updates()
        
        print("🤖 AUTOMATIC STATUS CHECK AND PROMPT UPDATE RECOMMENDATIONS")
        print("=" * 80)
        print(f"📅 Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # Project summary
        metrics = data["project_metrics"]
        print(f"📊 PROJECT STATUS:")
        print(f"   Total Commits: {metrics['total_commits']}")
        print(f"   Overall Progress: {metrics['overall_percent']:.1f}%")
        print(f"   Documenting Agents: {metrics['documenting_agents']}/9")
        print(f"   Critical Agents: {metrics['critical_agents']}")
        print()
        
        # Agent status summary
        print("📈 AGENT STATUS SUMMARY:")
        print(f"{'Agent':<6} {'Name':<25} {'Commits':<8} {'PATH':<12} {'Status':<20}")
        print("-" * 80)
        
        for status in data["all_statuses"]:
            progress = f"{status['path_percent']:.1f}%"
            print(f"{status['agent_num']:<6} {status['name'][:24]:<25} {status['total_commits']:<8} {progress:<12} {status['status']:<20}")
        
        print()
        
        # Prompt update recommendations
        if data["prompt_updates"]:
            print("🚨 PROMPT UPDATE RECOMMENDATIONS:")
            print("-" * 80)
            
            for update in data["prompt_updates"]:
                print(f"\n📝 Agent {update['agent_num']} - {update['agent_name']}")
                print(f"   Severity: {update['severity']}")
                print(f"   Current: {update['current_progress']}")
                print(f"   Expected: {update['expected_progress']}")
                print(f"   Message: {update['message']}")
                
                if update["commits_to_document"]:
                    print(f"   Recent commits to document:")
                    for commit in update["commits_to_document"][:3]:
                        print(f"     - {commit}")
                
                if update["success_examples"]:
                    print(f"   Success examples:")
                    for example in update["success_examples"]:
                        print(f"     - {example}")
        else:
            print("✅ No critical prompt updates needed - all agents documenting properly!")
        
        return data

    def save_recommendations(self, filename=None):
        """Save recommendations to JSON file"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"prompt_recommendations_{timestamp}.json"
        
        data = self.generate_prompt_updates()
        
        output_dir = self.base_path / "gh_pr_dump_fix_plan/AGENT_STATUS_REPORTS"
        output_dir.mkdir(exist_ok=True)
        
        with open(output_dir / filename, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"\n💾 Recommendations saved: {output_dir / filename}")
        return data


def main():
    base_path = "/Users/austinorphan/Library/Mobile Documents/com~apple~CloudDocs/src/devTools/gh_pr_dump"
    checker = AgentStatusChecker(base_path)
    
    # Run the check and generate report
    checker.generate_report()
    
    # Optionally save recommendations
    if len(os.sys.argv) > 1 and os.sys.argv[1] == "--save":
        checker.save_recommendations()


if __name__ == "__main__":
    main()