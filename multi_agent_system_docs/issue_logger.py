#!/usr/bin/env python3
"""
Issue Logging System for GitHub PR Dump Fix Agents
Provides structured logging and issue tracking across all development paths
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Literal
from enum import Enum

class Severity(str, Enum):
    CRITICAL = "CRITICAL"  # Blocks all progress
    HIGH = "HIGH"          # Blocks current path
    MEDIUM = "MEDIUM"      # Workaround available
    LOW = "LOW"            # Minor issue

class IssueLogger:
    """Centralized issue logging for all agents."""
    
    def __init__(self, agent_path: int, agent_name: str):
        self.agent_path = agent_path
        self.agent_name = agent_name
        self.log_dir = Path(__file__).parent.parent / "AGENT_LOGS"
        self.log_dir.mkdir(exist_ok=True)
        
        # Agent-specific log
        self.agent_log = self.log_dir / f"agent_{agent_path}_issues.jsonl"
        
        # Central issue log
        self.central_log = self.log_dir / "all_issues.jsonl"
        
        # Blocker tracking
        self.blocker_log = self.log_dir / "blockers.jsonl"
    
    def log_issue(
        self,
        task: str,
        issue: str,
        severity: Severity,
        blocked_by: Optional[List[str]] = None,
        attempted_resolution: Optional[str] = None,
        needs_escalation: bool = False,
        error_trace: Optional[str] = None
    ) -> Dict:
        """Log an issue with full context."""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "agent_path": self.agent_path,
            "agent_name": self.agent_name,
            "severity": severity.value,
            "task": task,
            "issue": issue,
            "blocked_by": blocked_by or [],
            "attempted_resolution": attempted_resolution,
            "needs_escalation": needs_escalation,
            "error_trace": error_trace,
            "status": "OPEN"
        }
        
        # Write to agent-specific log
        self._append_to_log(self.agent_log, entry)
        
        # Write to central log
        self._append_to_log(self.central_log, entry)
        
        # If it's a blocker, add to blocker log
        if needs_escalation or severity in [Severity.CRITICAL, Severity.HIGH]:
            self._append_to_log(self.blocker_log, entry)
        
        return entry
    
    def log_resolution(self, issue_timestamp: str, resolution: str):
        """Log resolution of an issue."""
        resolution_entry = {
            "timestamp": datetime.now().isoformat(),
            "type": "RESOLUTION",
            "original_issue": issue_timestamp,
            "resolution": resolution,
            "agent_path": self.agent_path,
            "agent_name": self.agent_name
        }
        
        self._append_to_log(self.agent_log, resolution_entry)
        self._append_to_log(self.central_log, resolution_entry)
    
    def log_progress(self, task: str, status: str, notes: Optional[str] = None):
        """Log progress on a task."""
        progress_entry = {
            "timestamp": datetime.now().isoformat(),
            "type": "PROGRESS",
            "agent_path": self.agent_path,
            "agent_name": self.agent_name,
            "task": task,
            "status": status,
            "notes": notes
        }
        
        self._append_to_log(self.agent_log, progress_entry)
    
    def get_blockers(self) -> List[Dict]:
        """Get all current blockers for this agent."""
        blockers = []
        if self.blocker_log.exists():
            with open(self.blocker_log) as f:
                for line in f:
                    entry = json.loads(line)
                    if (entry.get("agent_path") == self.agent_path and 
                        entry.get("status") == "OPEN"):
                        blockers.append(entry)
        return blockers
    
    def get_dependencies_status(self, required_tasks: List[str]) -> Dict[str, bool]:
        """Check if required dependency tasks are completed."""
        status = {}
        
        # Check all PATH documents for completion
        project_root = Path(__file__).parent.parent
        for task in required_tasks:
            # Extract path number from task ID (e.g., "1.2.3" -> 1)
            path_num = int(task.split('.')[0]) if '.' in task else 0
            
            if path_num > 0:
                path_files = list(project_root.glob(f"PATH_{path_num}_*.md"))
                if path_files:
                    content = path_files[0].read_text()
                    # Look for the specific task as completed
                    task_pattern = f"- [x] **{task}_"
                    status[task] = task_pattern in content
                else:
                    status[task] = False
            else:
                status[task] = False
        
        return status
    
    def _append_to_log(self, log_file: Path, entry: Dict):
        """Append entry to a log file."""
        with open(log_file, 'a') as f:
            f.write(json.dumps(entry) + '\n')

# Convenience function for agents
def create_logger(agent_path: int, agent_name: str) -> IssueLogger:
    """Create a logger instance for an agent."""
    return IssueLogger(agent_path, agent_name)

# Example usage function for agents
def log_issue_example():
    """Example of how agents should use the logger."""
    # Initialize logger for Path 1 agent
    logger = create_logger(1, "Core Data Infrastructure")
    
    # Log a critical issue
    logger.log_issue(
        task="CRITICAL_1.0.0_create_database_schema.md",
        issue="SQLite version conflict: requires 3.35.0+, found 3.32.0",
        severity=Severity.CRITICAL,
        blocked_by=[],
        attempted_resolution="Tried updating SQLite via brew, but system version takes precedence",
        needs_escalation=True,
        error_trace="sqlite3.OperationalError: near 'RETURNING': syntax error"
    )
    
    # Log progress
    logger.log_progress(
        task="HIGH_1.0.1_create_helper_methods.md",
        status="COMPLETED",
        notes="All helper methods implemented with 95% test coverage"
    )
    
    # Check dependencies
    deps = logger.get_dependencies_status([
        "0.7",  # Pydantic models
        "0.13"  # Exception hierarchy
    ])
    print(f"Dependencies ready: {deps}")
    
    # Check blockers
    blockers = logger.get_blockers()
    if blockers:
        print(f"Current blockers: {len(blockers)}")

if __name__ == "__main__":
    # Run example
    log_issue_example()