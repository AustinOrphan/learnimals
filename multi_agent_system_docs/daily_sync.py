#!/usr/bin/env python3
"""
Daily Sync Script for Agent Coordination
Generates status reports and identifies integration opportunities
"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Tuple
import re

PROJECT_ROOT = Path(__file__).parent.parent
LOGS_DIR = PROJECT_ROOT / "AGENT_LOGS"
REPORTS_DIR = PROJECT_ROOT / "DAILY_REPORTS"
REPORTS_DIR.mkdir(exist_ok=True)

class DailySync:
    """Manages daily synchronization between agents."""
    
    def __init__(self):
        self.agent_paths = {
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
        
        self.today = datetime.now().strftime("%Y-%m-%d")
        self.report_file = REPORTS_DIR / f"daily_sync_{self.today}.md"
    
    def analyze_progress(self) -> Dict[int, Dict]:
        """Analyze progress for each agent path."""
        progress = {}
        
        for path_num, agent_name in self.agent_paths.items():
            path_files = list(PROJECT_ROOT.glob(f"PATH_{path_num}_*.md"))
            if path_files:
                content = path_files[0].read_text()
                
                # Count tasks
                total_tasks = content.count("- [ ]") + content.count("- [x]")
                completed_tasks = content.count("- [x]")
                
                # Extract current tasks (look for checked items followed by unchecked)
                in_progress = self._find_in_progress_tasks(content)
                
                # Find blocking dependencies
                blocked = self._find_blocked_tasks(path_num)
                
                progress[path_num] = {
                    "agent": agent_name,
                    "total_tasks": total_tasks,
                    "completed": completed_tasks,
                    "percentage": round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1),
                    "in_progress": in_progress,
                    "blocked": blocked
                }
        
        return progress
    
    def identify_integration_ready(self) -> List[Dict]:
        """Identify interfaces ready for integration testing."""
        integration_ready = []
        
        # Check each agent's published interfaces
        for path_num in range(1, 10):
            # Look for completed interface tasks
            path_files = list(PROJECT_ROOT.glob(f"PATH_{path_num}_*.md"))
            if path_files:
                content = path_files[0].read_text()
                
                # Find completed interface publications
                interface_pattern = r"- \[x\] \*\*([^*]+interface[^*]+)\*\*"
                interfaces = re.findall(interface_pattern, content, re.IGNORECASE)
                
                for interface in interfaces:
                    integration_ready.append({
                        "path": path_num,
                        "agent": self.agent_paths[path_num],
                        "interface": interface
                    })
        
        return integration_ready
    
    def check_critical_path(self) -> List[Dict]:
        """Check status of critical path dependencies."""
        critical_tasks = [
            {"path": 1, "task": "CRITICAL_1.0.0_create_database_schema", "blocks": "ALL database operations"},
            {"path": 1, "task": "CRITICAL_0.13_create_exception_hierarchy", "blocks": "ALL error handling"},
            {"path": 1, "task": "CRITICAL_0.7_implement_pydantic_models", "blocks": "ALL data processing"},
            {"path": 2, "task": "CRITICAL_0.4_create_mock_github_api", "blocks": "ALL testing"}
        ]
        
        critical_status = []
        
        for critical in critical_tasks:
            path_files = list(PROJECT_ROOT.glob(f"PATH_{critical['path']}_*.md"))
            if path_files:
                content = path_files[0].read_text()
                pattern = f"- \[({'x' if critical['task'] in content and '- [x]' in content else ' '})\] \*\*{critical['task']}"
                completed = f"- [x] **{critical['task']}" in content
                
                critical_status.append({
                    **critical,
                    "completed": completed,
                    "status": "✅ COMPLETE" if completed else "⚠️ PENDING"
                })
        
        return critical_status
    
    def _find_in_progress_tasks(self, content: str) -> List[str]:
        """Find tasks that are likely in progress."""
        # Simple heuristic: unchecked tasks after checked tasks in same section
        lines = content.split('\n')
        in_progress = []
        
        for i, line in enumerate(lines):
            if "- [ ]" in line and i > 0:
                # Check if previous task in same section is completed
                for j in range(i-1, max(0, i-10), -1):
                    if "- [x]" in lines[j]:
                        # Extract task name
                        match = re.search(r"\*\*([^*]+)\*\*", line)
                        if match:
                            in_progress.append(match.group(1))
                        break
                    elif "- [ ]" in lines[j]:
                        break
        
        return in_progress[:3]  # Return top 3
    
    def _find_blocked_tasks(self, path_num: int) -> List[Dict]:
        """Find blocked tasks from issue logs."""
        blocked = []
        blocker_log = LOGS_DIR / "blockers.jsonl"
        
        if blocker_log.exists():
            with open(blocker_log) as f:
                for line in f:
                    entry = json.loads(line)
                    if entry.get("agent_path") == path_num and entry.get("status") == "OPEN":
                        blocked.append({
                            "task": entry.get("task", "Unknown"),
                            "reason": entry.get("issue", "Unknown"),
                            "severity": entry.get("severity", "UNKNOWN")
                        })
        
        return blocked
    
    def generate_report(self):
        """Generate the daily sync report."""
        progress = self.analyze_progress()
        integration_ready = self.identify_integration_ready()
        critical_path = self.check_critical_path()
        
        report = f"""# Daily Sync Report - {self.today}

## 🎯 Overall Progress

| Path | Agent | Progress | Status |
|------|-------|----------|--------|
"""
        
        for path_num, data in sorted(progress.items()):
            status_emoji = "🟢" if data["percentage"] > 75 else "🟡" if data["percentage"] > 25 else "🔴"
            report += f"| {path_num} | {data['agent']} | {data['completed']}/{data['total_tasks']} ({data['percentage']}%) | {status_emoji} |\n"
        
        report += f"\n## 🚨 Critical Path Status\n\n"
        for critical in critical_path:
            report += f"- {critical['status']} **{critical['task']}** (blocks: {critical['blocks']})\n"
        
        report += f"\n## 🔄 Integration Ready\n\n"
        if integration_ready:
            report += "The following interfaces are ready for integration testing:\n\n"
            for item in integration_ready:
                report += f"- Path {item['path']} ({item['agent']}): {item['interface']}\n"
        else:
            report += "_No new interfaces ready for integration._\n"
        
        report += f"\n## 📊 Detailed Progress by Agent\n\n"
        for path_num, data in sorted(progress.items()):
            report += f"### Path {path_num}: {data['agent']}\n\n"
            report += f"**Progress**: {data['completed']}/{data['total_tasks']} tasks ({data['percentage']}%)\n\n"
            
            if data['in_progress']:
                report += "**In Progress**:\n"
                for task in data['in_progress']:
                    report += f"- {task}\n"
                report += "\n"
            
            if data['blocked']:
                report += "**Blocked**:\n"
                for blocker in data['blocked']:
                    report += f"- {blocker['task']} - {blocker['severity']}: {blocker['reason']}\n"
                report += "\n"
        
        report += self._generate_recommendations(progress, critical_path)
        
        # Save report
        self.report_file.write_text(report)
        print(f"✅ Daily sync report generated: {self.report_file}")
        
        return report
    
    def _generate_recommendations(self, progress: Dict, critical_path: List[Dict]) -> str:
        """Generate recommendations based on current state."""
        recommendations = "\n## 💡 Recommendations\n\n"
        
        # Check for critical path blockers
        critical_incomplete = [c for c in critical_path if not c['completed']]
        if critical_incomplete:
            recommendations += "### ⚠️ Critical Path Actions Required\n\n"
            for critical in critical_incomplete:
                recommendations += f"- **URGENT**: Complete {critical['task']} to unblock {critical['blocks']}\n"
            recommendations += "\n"
        
        # Check for lagging agents
        lagging = [(p, d) for p, d in progress.items() if d['percentage'] < 25]
        if lagging:
            recommendations += "### 🐢 Agents Needing Support\n\n"
            for path, data in lagging:
                recommendations += f"- Path {path} ({data['agent']}) is at {data['percentage']}% - consider additional resources\n"
            recommendations += "\n"
        
        # Check for integration opportunities
        high_progress = [(p, d) for p, d in progress.items() if d['percentage'] > 50]
        if len(high_progress) > 3:
            recommendations += "### 🤝 Integration Opportunities\n\n"
            recommendations += "- Multiple agents have >50% completion - schedule integration testing\n"
            recommendations += "- Consider daily integration builds to catch issues early\n"
        
        return recommendations

def main():
    """Run daily sync analysis."""
    sync = DailySync()
    report = sync.generate_report()
    
    # Also print summary to console
    print("\n" + "="*60)
    print("DAILY SYNC SUMMARY")
    print("="*60)
    
    progress = sync.analyze_progress()
    for path_num, data in sorted(progress.items()):
        print(f"\nPath {path_num} - {data['agent']}:")
        print(f"  Progress: {data['completed']}/{data['total_tasks']} ({data['percentage']}%)")
        if data['blocked']:
            print(f"  ⚠️  Blocked: {len(data['blocked'])} tasks")
    
    print(f"\n📄 Full report: {sync.report_file}")

if __name__ == "__main__":
    main()