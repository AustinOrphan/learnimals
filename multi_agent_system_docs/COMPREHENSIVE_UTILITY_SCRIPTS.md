# Comprehensive Utility Scripts for Multi-Agent Systems

## Table of Contents
1. [Introduction and Architecture](#introduction-and-architecture)
2. [Core Framework](#core-framework)
3. [System Setup Scripts](#system-setup-scripts)
4. [Git Management Scripts](#git-management-scripts)
5. [Agent Coordination Scripts](#agent-coordination-scripts)
6. [Monitoring and Compliance Scripts](#monitoring-and-compliance-scripts)
7. [Maintenance Scripts](#maintenance-scripts)
8. [Configuration System](#configuration-system)
9. [Usage Examples](#usage-examples)
10. [Best Practices](#best-practices)

## Introduction and Architecture

This collection provides production-ready utility scripts for managing multi-agent development systems. Based on learnings from a 9-agent software development project, these scripts emphasize **technical enforcement over voluntary compliance** and **integrated workflows over separate processes**.

### Key Design Principles

1. **Technical Enforcement First**: Automated compliance checking with pre-commit hooks
2. **Batch Operations**: High-performance batch processing for all operations
3. **Real-time Monitoring**: Live dashboards and progress tracking
4. **Error Recovery**: Comprehensive retry logic and graceful degradation
5. **Cross-platform**: Works on Windows, macOS, and Linux
6. **Modular**: Use individual components or the complete system

### Dependencies

```bash
pip install click rich pydantic gitpython prometheus_client psutil
```

## Core Framework

### Base Script Infrastructure

```python
#!/usr/bin/env python3
"""
core/base.py - Base classes for all utility scripts
"""

import logging
import sys
import time
from pathlib import Path
from typing import Dict, Any, Optional, List
from abc import ABC, abstractmethod

import click
from rich.console import Console
from rich.logging import RichHandler
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn
from pydantic import BaseModel, Field

console = Console()

class ScriptConfig(BaseModel):
    """Base configuration for all scripts"""
    project_root: Path = Field(default_factory=lambda: Path.cwd())
    log_level: str = "INFO"
    batch_size: int = 100
    retry_attempts: int = 3
    retry_delay: float = 1.0
    dry_run: bool = False
    verbose: bool = False
    
class BaseScript(ABC):
    """Base class for all utility scripts"""
    
    def __init__(self, config: ScriptConfig):
        self.config = config
        self.console = Console()
        self.setup_logging()
        
    def setup_logging(self):
        """Configure rich logging"""
        logging.basicConfig(
            level=getattr(logging, self.config.log_level),
            format="%(message)s",
            datefmt="[%X]",
            handlers=[RichHandler(console=self.console, rich_tracebacks=True)]
        )
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def with_progress(self, description: str):
        """Context manager for progress tracking"""
        return Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            console=self.console
        )
    
    def retry_operation(self, operation, *args, **kwargs):
        """Retry operation with exponential backoff"""
        for attempt in range(self.config.retry_attempts):
            try:
                return operation(*args, **kwargs)
            except Exception as e:
                if attempt == self.config.retry_attempts - 1:
                    raise
                delay = self.config.retry_delay * (2 ** attempt)
                self.logger.warning(f"Attempt {attempt + 1} failed: {e}. Retrying in {delay}s...")
                time.sleep(delay)
    
    @abstractmethod
    def run(self) -> int:
        """Main script execution - return exit code"""
        pass

class BatchProcessor:
    """High-performance batch processing utility"""
    
    def __init__(self, batch_size: int = 100):
        self.batch_size = batch_size
        self.pending_operations = []
        
    def add_operation(self, operation, *args, **kwargs):
        """Add operation to batch queue"""
        self.pending_operations.append((operation, args, kwargs))
        
        if len(self.pending_operations) >= self.batch_size:
            self.flush_batch()
    
    def flush_batch(self):
        """Execute all pending operations"""
        if not self.pending_operations:
            return
            
        for operation, args, kwargs in self.pending_operations:
            operation(*args, **kwargs)
        
        self.pending_operations.clear()
    
    def __enter__(self):
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.flush_batch()

def common_options(f):
    """Common CLI options decorator"""
    f = click.option('--verbose', '-v', is_flag=True, help='Enable verbose output')(f)
    f = click.option('--dry-run', is_flag=True, help='Show what would be done without executing')(f)
    f = click.option('--config', type=click.Path(exists=True), help='Configuration file path')(f)
    f = click.option('--log-level', default='INFO', type=click.Choice(['DEBUG', 'INFO', 'WARNING', 'ERROR']))(f)
    return f
```

## System Setup Scripts

### Project Initialization Script

```python
#!/usr/bin/env python3
"""
setup/init_project.py - Initialize multi-agent project structure
"""

import os
import json
from pathlib import Path
from typing import Dict, List

import click
from core.base import BaseScript, ScriptConfig, common_options

class ProjectInitializer(BaseScript):
    """Initialize multi-agent project structure"""
    
    def __init__(self, config: ScriptConfig, project_name: str, agents: List[str]):
        super().__init__(config)
        self.project_name = project_name
        self.agents = agents
        
    def run(self) -> int:
        """Initialize project structure"""
        try:
            self.create_directory_structure()
            self.create_configuration_files()
            self.setup_git_repository()
            self.create_agent_workspaces()
            self.setup_monitoring()
            
            self.console.print(f"✅ Project '{self.project_name}' initialized successfully!", style="green")
            return 0
            
        except Exception as e:
            self.logger.error(f"Project initialization failed: {e}")
            return 1
    
    def create_directory_structure(self):
        """Create standard project directory structure"""
        directories = [
            f"{self.project_name}",
            f"{self.project_name}/agents",
            f"{self.project_name}/config",
            f"{self.project_name}/docs",
            f"{self.project_name}/scripts",
            f"{self.project_name}/tests",
            f"{self.project_name}/monitoring",
            f"{self.project_name}/logs",
            f"{self.project_name}/.github/workflows",
        ]
        
        for directory in directories:
            path = Path(directory)
            if not self.config.dry_run:
                path.mkdir(parents=True, exist_ok=True)
            self.logger.info(f"Created directory: {path}")
    
    def create_configuration_files(self):
        """Create initial configuration files"""
        configs = {
            f"{self.project_name}/config/project.yaml": self.get_project_config(),
            f"{self.project_name}/config/agents.yaml": self.get_agent_config(),
            f"{self.project_name}/config/monitoring.yaml": self.get_monitoring_config(),
            f"{self.project_name}/.gitignore": self.get_gitignore_content(),
            f"{self.project_name}/requirements.txt": self.get_requirements_content(),
        }
        
        for file_path, content in configs.items():
            if not self.config.dry_run:
                Path(file_path).write_text(content)
            self.logger.info(f"Created config file: {file_path}")
    
    def setup_git_repository(self):
        """Initialize git repository with pre-commit hooks"""
        if not self.config.dry_run:
            os.chdir(self.project_name)
            os.system("git init")
            os.system("git add .")
            os.system("git commit -m 'Initial project structure'")
            
            # Setup pre-commit hooks
            self.create_pre_commit_hooks()
        
        self.logger.info("Git repository initialized with pre-commit hooks")
    
    def create_agent_workspaces(self):
        """Create individual agent workspaces"""
        for agent in self.agents:
            agent_dir = Path(f"agents/{agent}")
            if not self.config.dry_run:
                agent_dir.mkdir(parents=True, exist_ok=True)
                
                # Create agent-specific files
                (agent_dir / "PATH.md").write_text(self.get_path_template(agent))
                (agent_dir / "config.yaml").write_text(self.get_agent_specific_config(agent))
                (agent_dir / "README.md").write_text(f"# Agent {agent}\n\nAgent workspace and documentation.")
            
            self.logger.info(f"Created workspace for agent: {agent}")
    
    def get_project_config(self) -> str:
        """Generate project configuration YAML"""
        return f"""
project:
  name: "{self.project_name}"
  version: "1.0.0"
  description: "Multi-agent development project"
  
agents:
  count: {len(self.agents)}
  names: {self.agents}
  
git:
  main_branch: "main"
  worktree_prefix: "agent_"
  
compliance:
  documentation_required: true
  pre_commit_hooks: true
  path_document_format: "markdown"
  
monitoring:
  dashboard_enabled: true
  metrics_collection: true
  real_time_updates: true
"""

    def get_agent_config(self) -> str:
        """Generate agent configuration YAML"""
        agent_configs = []
        for i, agent in enumerate(self.agents, 1):
            agent_configs.append(f"""
  - name: "{agent}"
    id: "agent_{i}"
    specialization: "Define agent specialization here"
    workspace: "agents/{agent}"
    branch: "agent_{i}_{agent.lower().replace(' ', '_')}"
    compliance_required: true
""")
        
        return f"agents:{(''.join(agent_configs))}"

    def get_monitoring_config(self) -> str:
        """Generate monitoring configuration YAML"""
        return """
monitoring:
  dashboard:
    port: 8080
    refresh_interval: 5
    
  metrics:
    prometheus_port: 9090
    collection_interval: 10
    
  compliance:
    check_interval: 30
    documentation_threshold: 90
    
  alerts:
    enabled: true
    email_notifications: false
    slack_webhook: ""
"""

    def get_gitignore_content(self) -> str:
        """Generate .gitignore content"""
        return """
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
.venv/
pip-log.txt
pip-delete-this-directory.txt
.mypy_cache/

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
logs/
*.log

# OS
.DS_Store
Thumbs.db

# Project specific
data/
.env
*.sqlite
monitoring/prometheus_data/
"""

    def get_requirements_content(self) -> str:
        """Generate requirements.txt content"""
        return """
click>=8.0.0
rich>=10.0.0
pydantic>=1.8.0
gitpython>=3.1.0
prometheus_client>=0.11.0
psutil>=5.8.0
pyyaml>=5.4.0
requests>=2.25.0
aiohttp>=3.7.0
"""

    def get_path_template(self, agent: str) -> str:
        """Generate PATH document template"""
        return f"""# Agent {agent} - Progress and Task Tracking

## Agent Information
- **Name**: {agent}
- **Specialization**: [Define agent's area of expertise]
- **Workspace**: agents/{agent}
- **Start Date**: [Current date]

## Task Checklist

### Setup Tasks
- [ ] Review agent configuration
- [ ] Set up development environment
- [ ] Understand project requirements
- [ ] Review interface specifications

### Implementation Tasks
- [ ] [Define specific implementation tasks]
- [ ] [Add more tasks as needed]

### Documentation Tasks
- [ ] Document implemented features
- [ ] Update API documentation
- [ ] Create usage examples
- [ ] Update this PATH document

### Testing Tasks
- [ ] Write unit tests
- [ ] Integration testing
- [ ] Performance testing
- [ ] Documentation review

## Progress Tracking

### Completed Work
[Document completed tasks and achievements]

### Current Focus
[Describe current work in progress]

### Blockers and Issues
[List any blockers or issues encountered]

### Next Steps
[Outline planned next steps]

## Documentation Compliance
**Last Updated**: [Date]
**Completion Status**: 0%
**Documentation Score**: 0/10
"""

    def get_agent_specific_config(self, agent: str) -> str:
        """Generate agent-specific configuration"""
        return f"""
agent:
  name: "{agent}"
  workspace: "agents/{agent}"
  
tasks:
  batch_size: 50
  retry_attempts: 3
  
compliance:
  documentation_required: true
  path_update_frequency: "daily"
  
tools:
  enabled: ["git", "docs", "testing"]
  custom_tools: []
"""

    def create_pre_commit_hooks(self):
        """Create pre-commit hooks for compliance enforcement"""
        hook_script = """#!/bin/bash
# Pre-commit hook for documentation compliance

echo "Checking documentation compliance..."

# Check if PATH documents are updated
python scripts/check_compliance.py --pre-commit

if [ $? -ne 0 ]; then
    echo "❌ Pre-commit check failed. Please update your PATH document before committing."
    exit 1
fi

echo "✅ Pre-commit checks passed."
exit 0
"""
        
        if not self.config.dry_run:
            hook_path = Path(".git/hooks/pre-commit")
            hook_path.write_text(hook_script)
            hook_path.chmod(0o755)


@click.command()
@click.argument('project_name')
@click.option('--agents', multiple=True, required=True, help='Agent names')
@common_options
def init_project(project_name, agents, **kwargs):
    """Initialize multi-agent project structure"""
    config = ScriptConfig(**{k: v for k, v in kwargs.items() if v is not None})
    
    initializer = ProjectInitializer(config, project_name, list(agents))
    exit_code = initializer.run()
    sys.exit(exit_code)

if __name__ == '__main__':
    init_project()
```

### Environment Validation Script

```python
#!/usr/bin/env python3
"""
setup/validate_environment.py - Validate development environment
"""

import subprocess
import sys
from pathlib import Path
from typing import List, Tuple, Dict

import click
from rich.table import Table
from core.base import BaseScript, ScriptConfig, common_options

class EnvironmentValidator(BaseScript):
    """Validate development environment for multi-agent systems"""
    
    def __init__(self, config: ScriptConfig):
        super().__init__(config)
        self.validation_results = []
        
    def run(self) -> int:
        """Run environment validation checks"""
        try:
            self.check_python_version()
            self.check_git_installation()
            self.check_required_packages()
            self.check_system_resources()
            self.check_git_configuration()
            self.check_project_structure()
            
            self.display_results()
            
            failed_checks = [r for r in self.validation_results if not r['passed']]
            if failed_checks:
                self.console.print(f"❌ {len(failed_checks)} validation checks failed", style="red")
                return 1
            else:
                self.console.print("✅ All validation checks passed!", style="green")
                return 0
                
        except Exception as e:
            self.logger.error(f"Environment validation failed: {e}")
            return 1
    
    def check_python_version(self):
        """Check Python version compatibility"""
        min_version = (3, 8)
        current_version = sys.version_info[:2]
        
        passed = current_version >= min_version
        self.validation_results.append({
            'check': 'Python Version',
            'required': f"{min_version[0]}.{min_version[1]}+",
            'current': f"{current_version[0]}.{current_version[1]}",
            'passed': passed,
            'message': "OK" if passed else f"Python {min_version[0]}.{min_version[1]}+ required"
        })
    
    def check_git_installation(self):
        """Check Git installation and version"""
        try:
            result = subprocess.run(['git', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                version = result.stdout.strip().split()[-1]
                passed = True
                message = "OK"
            else:
                version = "Not installed"
                passed = False
                message = "Git not found"
        except FileNotFoundError:
            version = "Not installed"
            passed = False
            message = "Git not found"
        
        self.validation_results.append({
            'check': 'Git Installation',
            'required': '2.0+',
            'current': version,
            'passed': passed,
            'message': message
        })
    
    def check_required_packages(self):
        """Check required Python packages"""
        required_packages = [
            'click', 'rich', 'pydantic', 'gitpython', 
            'prometheus_client', 'psutil', 'pyyaml'
        ]
        
        for package in required_packages:
            try:
                __import__(package)
                passed = True
                message = "Installed"
            except ImportError:
                passed = False
                message = "Not installed"
            
            self.validation_results.append({
                'check': f'Package: {package}',
                'required': 'Installed',
                'current': message,
                'passed': passed,
                'message': f"pip install {package}" if not passed else "OK"
            })
    
    def check_system_resources(self):
        """Check system resource availability"""
        import psutil
        
        # Memory check (minimum 4GB)
        memory_gb = psutil.virtual_memory().total / (1024**3)
        memory_passed = memory_gb >= 4
        
        self.validation_results.append({
            'check': 'System Memory',
            'required': '4GB+',
            'current': f"{memory_gb:.1f}GB",
            'passed': memory_passed,
            'message': "OK" if memory_passed else "Low memory"
        })
        
        # Disk space check (minimum 10GB)
        disk_gb = psutil.disk_usage('.').free / (1024**3)
        disk_passed = disk_gb >= 10
        
        self.validation_results.append({
            'check': 'Disk Space',
            'required': '10GB+',
            'current': f"{disk_gb:.1f}GB free",
            'passed': disk_passed,
            'message': "OK" if disk_passed else "Low disk space"
        })
    
    def check_git_configuration(self):
        """Check Git configuration"""
        try:
            name_result = subprocess.run(['git', 'config', 'user.name'], 
                                       capture_output=True, text=True)
            email_result = subprocess.run(['git', 'config', 'user.email'], 
                                        capture_output=True, text=True)
            
            name_configured = name_result.returncode == 0 and name_result.stdout.strip()
            email_configured = email_result.returncode == 0 and email_result.stdout.strip()
            
            self.validation_results.append({
                'check': 'Git User Name',
                'required': 'Configured',
                'current': name_result.stdout.strip() if name_configured else "Not set",
                'passed': name_configured,
                'message': "git config --global user.name 'Your Name'" if not name_configured else "OK"
            })
            
            self.validation_results.append({
                'check': 'Git User Email',
                'required': 'Configured',
                'current': email_result.stdout.strip() if email_configured else "Not set",
                'passed': email_configured,
                'message': "git config --global user.email 'your@email.com'" if not email_configured else "OK"
            })
            
        except Exception as e:
            self.validation_results.append({
                'check': 'Git Configuration',
                'required': 'Configured',
                'current': 'Error',
                'passed': False,
                'message': f"Error checking git config: {e}"
            })
    
    def check_project_structure(self):
        """Check if we're in a valid project structure"""
        required_dirs = ['agents', 'config', 'scripts']
        config_files = ['config/project.yaml', 'config/agents.yaml']
        
        for directory in required_dirs:
            exists = Path(directory).exists()
            self.validation_results.append({
                'check': f'Directory: {directory}',
                'required': 'Exists',
                'current': 'Exists' if exists else 'Missing',
                'passed': exists,
                'message': f"mkdir {directory}" if not exists else "OK"
            })
        
        for config_file in config_files:
            exists = Path(config_file).exists()
            self.validation_results.append({
                'check': f'Config: {config_file}',
                'required': 'Exists',
                'current': 'Exists' if exists else 'Missing',
                'passed': exists,
                'message': f"Run init_project.py to create" if not exists else "OK"
            })
    
    def display_results(self):
        """Display validation results in a table"""
        table = Table(title="Environment Validation Results")
        
        table.add_column("Check", style="cyan")
        table.add_column("Required", style="magenta")
        table.add_column("Current", style="yellow")
        table.add_column("Status", style="green")
        table.add_column("Action", style="blue")
        
        for result in self.validation_results:
            status = "✅ PASS" if result['passed'] else "❌ FAIL"
            status_style = "green" if result['passed'] else "red"
            
            table.add_row(
                result['check'],
                result['required'],
                result['current'],
                status,
                result['message']
            )
        
        self.console.print(table)


@click.command()
@common_options
def validate_environment(**kwargs):
    """Validate development environment for multi-agent systems"""
    config = ScriptConfig(**{k: v for k, v in kwargs.items() if v is not None})
    
    validator = EnvironmentValidator(config)
    exit_code = validator.run()
    sys.exit(exit_code)

if __name__ == '__main__':
    validate_environment()
```

## Git Management Scripts

### Worktree Management Script

```python
#!/usr/bin/env python3
"""
git/manage_worktrees.py - Advanced Git worktree management for multi-agent development
"""

import subprocess
import json
from pathlib import Path
from typing import List, Dict, Optional

import click
from git import Repo, GitCommandError
from rich.table import Table
from core.base import BaseScript, ScriptConfig, common_options, BatchProcessor

class WorktreeManager(BaseScript):
    """Manage Git worktrees for multi-agent development"""
    
    def __init__(self, config: ScriptConfig):
        super().__init__(config)
        try:
            self.repo = Repo('.')
        except Exception as e:
            self.logger.error(f"Not in a git repository: {e}")
            raise
    
    def list_worktrees(self) -> List[Dict]:
        """List all worktrees with status information"""
        try:
            result = subprocess.run(['git', 'worktree', 'list', '--porcelain'], 
                                  capture_output=True, text=True, check=True)
            
            worktrees = []
            current_worktree = {}
            
            for line in result.stdout.strip().split('\n'):
                if line.startswith('worktree '):
                    if current_worktree:
                        worktrees.append(current_worktree)
                    current_worktree = {'path': line.split(' ', 1)[1]}
                elif line.startswith('HEAD '):
                    current_worktree['commit'] = line.split(' ', 1)[1]
                elif line.startswith('branch '):
                    current_worktree['branch'] = line.split(' ', 1)[1].replace('refs/heads/', '')
                elif line == 'bare':
                    current_worktree['bare'] = True
                elif line == 'detached':
                    current_worktree['detached'] = True
            
            if current_worktree:
                worktrees.append(current_worktree)
            
            # Add status information
            for worktree in worktrees:
                worktree.update(self.get_worktree_status(worktree['path']))
            
            return worktrees
            
        except subprocess.CalledProcessError as e:
            self.logger.error(f"Failed to list worktrees: {e}")
            return []
    
    def get_worktree_status(self, path: str) -> Dict:
        """Get detailed status for a worktree"""
        try:
            worktree_repo = Repo(path)
            
            # Count commits ahead/behind
            ahead = behind = 0
            if not worktree_repo.head.is_detached:
                try:
                    tracking_branch = worktree_repo.active_branch.tracking_branch()
                    if tracking_branch:
                        ahead, behind = worktree_repo.iter_commits(
                            f'{tracking_branch}..HEAD'
                        ), worktree_repo.iter_commits(
                            f'HEAD..{tracking_branch}'
                        )
                        ahead = len(list(ahead))
                        behind = len(list(behind))
                except Exception:
                    pass
            
            # Check working directory status
            is_dirty = worktree_repo.is_dirty()
            untracked_files = len(worktree_repo.untracked_files)
            
            return {
                'ahead': ahead,
                'behind': behind,
                'dirty': is_dirty,
                'untracked': untracked_files,
                'last_commit': worktree_repo.head.commit.hexsha[:8],
                'last_commit_date': worktree_repo.head.commit.committed_datetime.isoformat()
            }
            
        except Exception as e:
            self.logger.warning(f"Could not get status for {path}: {e}")
            return {'ahead': 0, 'behind': 0, 'dirty': False, 'untracked': 0}
    
    def create_agent_worktree(self, agent_name: str, base_branch: str = 'main') -> bool:
        """Create a new worktree for an agent"""
        branch_name = f"agent_{agent_name.lower().replace(' ', '_')}"
        worktree_path = f"../agent_{agent_name.lower().replace(' ', '_')}"
        
        try:
            if self.config.dry_run:
                self.logger.info(f"Would create worktree: {worktree_path} on branch {branch_name}")
                return True
            
            # Create new branch from base
            self.repo.create_head(branch_name, base_branch)
            
            # Create worktree
            subprocess.run(['git', 'worktree', 'add', worktree_path, branch_name], 
                         check=True)
            
            # Initialize agent workspace
            self.initialize_agent_workspace(worktree_path, agent_name)
            
            self.logger.info(f"✅ Created worktree for agent {agent_name}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to create worktree for {agent_name}: {e}")
            return False
    
    def initialize_agent_workspace(self, worktree_path: str, agent_name: str):
        """Initialize agent-specific workspace files"""
        workspace_path = Path(worktree_path)
        
        # Create agent directory structure
        (workspace_path / 'docs').mkdir(exist_ok=True)
        (workspace_path / 'tests').mkdir(exist_ok=True)
        
        # Create PATH document
        path_content = f"""# Agent {agent_name} - Progress and Task Tracking

## Agent Information
- **Name**: {agent_name}
- **Branch**: agent_{agent_name.lower().replace(' ', '_')}
- **Workspace**: {worktree_path}
- **Created**: {Path().cwd()}

## Task Checklist
- [ ] Set up development environment
- [ ] Review project requirements
- [ ] Begin implementation work
- [ ] Document progress regularly

## Progress Summary
Work started on {Path().cwd()}
"""
        
        (workspace_path / 'PATH.md').write_text(path_content)
        
        # Create agent README
        readme_content = f"""# Agent {agent_name} Workspace

This is the dedicated workspace for Agent {agent_name}.

## Getting Started
1. Review the PATH.md document for task tracking
2. Check the project requirements
3. Begin implementation work
4. Update documentation regularly

## Important Files
- `PATH.md` - Progress and task tracking (MUST be updated)
- `docs/` - Agent-specific documentation
- `tests/` - Agent-specific tests
"""
        
        (workspace_path / 'README.md').write_text(readme_content)
    
    def cleanup_worktree(self, worktree_path: str) -> bool:
        """Safely remove a worktree"""
        try:
            if self.config.dry_run:
                self.logger.info(f"Would remove worktree: {worktree_path}")
                return True
            
            # Check if worktree has uncommitted changes
            worktree_repo = Repo(worktree_path)
            if worktree_repo.is_dirty() or worktree_repo.untracked_files:
                if not click.confirm(f"Worktree {worktree_path} has uncommitted changes. Continue?"):
                    return False
            
            # Remove worktree
            subprocess.run(['git', 'worktree', 'remove', worktree_path], check=True)
            
            self.logger.info(f"✅ Removed worktree: {worktree_path}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to remove worktree {worktree_path}: {e}")
            return False
    
    def sync_worktree(self, worktree_path: str) -> bool:
        """Sync worktree with remote"""
        try:
            if self.config.dry_run:
                self.logger.info(f"Would sync worktree: {worktree_path}")
                return True
            
            worktree_repo = Repo(worktree_path)
            
            # Fetch latest changes
            worktree_repo.remotes.origin.fetch()
            
            # Pull if on tracking branch
            if not worktree_repo.head.is_detached:
                tracking_branch = worktree_repo.active_branch.tracking_branch()
                if tracking_branch:
                    worktree_repo.remotes.origin.pull()
            
            self.logger.info(f"✅ Synced worktree: {worktree_path}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to sync worktree {worktree_path}: {e}")
            return False
    
    def display_worktrees(self, worktrees: List[Dict]):
        """Display worktrees in a formatted table"""
        table = Table(title="Git Worktrees Status")
        
        table.add_column("Path", style="cyan")
        table.add_column("Branch", style="magenta")
        table.add_column("Commit", style="yellow")
        table.add_column("Status", style="green")
        table.add_column("Changes", style="blue")
        
        for worktree in worktrees:
            # Format status
            status_parts = []
            if worktree.get('ahead', 0) > 0:
                status_parts.append(f"↑{worktree['ahead']}")
            if worktree.get('behind', 0) > 0:
                status_parts.append(f"↓{worktree['behind']}")
            if worktree.get('dirty', False):
                status_parts.append("M")
            if worktree.get('untracked', 0) > 0:
                status_parts.append(f"?{worktree['untracked']}")
            
            status = " ".join(status_parts) if status_parts else "✓"
            
            # Format changes
            changes = []
            if worktree.get('dirty', False):
                changes.append("Modified")
            if worktree.get('untracked', 0) > 0:
                changes.append(f"{worktree['untracked']} untracked")
            
            changes_str = ", ".join(changes) if changes else "Clean"
            
            table.add_row(
                worktree['path'],
                worktree.get('branch', 'detached'),
                worktree.get('last_commit', worktree.get('commit', ''))[:8],
                status,
                changes_str
            )
        
        self.console.print(table)


@click.group()
def worktree():
    """Git worktree management commands"""
    pass

@worktree.command()
@common_options
def list_cmd(**kwargs):
    """List all worktrees with status"""
    config = ScriptConfig(**{k: v for k, v in kwargs.items() if v is not None})
    manager = WorktreeManager(config)
    
    worktrees = manager.list_worktrees()
    manager.display_worktrees(worktrees)

@worktree.command()
@click.argument('agent_name')
@click.option('--base-branch', default='main', help='Base branch for new worktree')
@common_options
def create(agent_name, base_branch, **kwargs):
    """Create worktree for an agent"""
    config = ScriptConfig(**{k: v for k, v in kwargs.items() if v is not None})
    manager = WorktreeManager(config)
    
    success = manager.create_agent_worktree(agent_name, base_branch)
    sys.exit(0 if success else 1)

@worktree.command()
@click.argument('worktree_path')
@common_options
def remove(worktree_path, **kwargs):
    """Remove a worktree"""
    config = ScriptConfig(**{k: v for k, v in kwargs.items() if v is not None})
    manager = WorktreeManager(config)
    
    success = manager.cleanup_worktree(worktree_path)
    sys.exit(0 if success else 1)

@worktree.command()
@click.argument('worktree_path', required=False)
@common_options
def sync(worktree_path, **kwargs):
    """Sync worktree(s) with remote"""
    config = ScriptConfig(**{k: v for k, v in kwargs.items() if v is not None})
    manager = WorktreeManager(config)
    
    if worktree_path:
        success = manager.sync_worktree(worktree_path)
        sys.exit(0 if success else 1)
    else:
        # Sync all worktrees
        worktrees = manager.list_worktrees()
        all_success = True
        
        with manager.with_progress("Syncing worktrees") as progress:
            task = progress.add_task("Syncing...", total=len(worktrees))
            
            for worktree in worktrees:
                if not manager.sync_worktree(worktree['path']):
                    all_success = False
                progress.update(task, advance=1)
        
        sys.exit(0 if all_success else 1)

if __name__ == '__main__':
    worktree()
```

### Merge Strategy Script

```python
#!/usr/bin/env python3
"""
git/merge_strategy.py - Advanced merge strategy for multi-agent branches
"""

import subprocess
import json
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass

import click
from git import Repo, GitCommandError
from rich.table import Table
from rich.panel import Panel
from core.base import BaseScript, ScriptConfig, common_options

@dataclass
class AgentBranch:
    name: str
    branch: str
    commits: int
    documentation_score: float
    last_commit: str
    conflicts_with: List[str]
    dependencies: List[str]

class MergeStrategyManager(BaseScript):
    """Advanced merge strategy for multi-agent development"""
    
    def __init__(self, config: ScriptConfig):
        super().__init__(config)
        self.repo = Repo('.')
        self.agent_branches = []
        
    def analyze_branches(self) -> List[AgentBranch]:
        """Analyze all agent branches for merge strategy"""
        branches = [b for b in self.repo.branches if b.name.startswith('agent_')]
        agent_branches = []
        
        for branch in branches:
            agent_branch = self.analyze_single_branch(branch)
            if agent_branch:
                agent_branches.append(agent_branch)
        
        # Analyze inter-branch conflicts
        self.analyze_conflicts(agent_branches)
        
        return agent_branches
    
    def analyze_single_branch(self, branch) -> Optional[AgentBranch]:
        """Analyze a single agent branch"""
        try:
            # Count commits
            commits = len(list(self.repo.iter_commits(f'main..{branch.name}')))
            
            # Get documentation score
            doc_score = self.calculate_documentation_score(branch.name)
            
            # Get last commit
            last_commit = branch.commit.hexsha[:8]
            
            return AgentBranch(
                name=branch.name.replace('agent_', '').replace('_', ' ').title(),
                branch=branch.name,
                commits=commits,
                documentation_score=doc_score,
                last_commit=last_commit,
                conflicts_with=[],
                dependencies=[]
            )
            
        except Exception as e:
            self.logger.warning(f"Could not analyze branch {branch.name}: {e}")
            return None
    
    def calculate_documentation_score(self, branch_name: str) -> float:
        """Calculate documentation score for a branch"""
        try:
            # Switch to branch temporarily to check PATH document
            current_branch = self.repo.active_branch.name
            self.repo.git.checkout(branch_name)
            
            path_file = Path('PATH.md')
            if not path_file.exists():
                score = 0.0
            else:
                content = path_file.read_text()
                # Simple scoring based on checked boxes
                total_boxes = content.count('- [ ]') + content.count('- [x]')
                checked_boxes = content.count('- [x]')
                
                if total_boxes == 0:
                    score = 0.0
                else:
                    score = (checked_boxes / total_boxes) * 100
            
            # Switch back to original branch
            self.repo.git.checkout(current_branch)
            return score
            
        except Exception as e:
            self.logger.warning(f"Could not calculate doc score for {branch_name}: {e}")
            return 0.0
    
    def analyze_conflicts(self, agent_branches: List[AgentBranch]):
        """Analyze potential merge conflicts between branches"""
        for i, branch1 in enumerate(agent_branches):
            for branch2 in agent_branches[i+1:]:
                conflicts = self.check_branch_conflicts(branch1.branch, branch2.branch)
                if conflicts:
                    branch1.conflicts_with.append(branch2.name)
                    branch2.conflicts_with.append(branch1.name)
    
    def check_branch_conflicts(self, branch1: str, branch2: str) -> List[str]:
        """Check for file conflicts between two branches"""
        try:
            # Get modified files in each branch
            files1 = set(self.get_modified_files(branch1))
            files2 = set(self.get_modified_files(branch2))
            
            # Find overlapping files
            conflicts = list(files1.intersection(files2))
            return conflicts
            
        except Exception as e:
            self.logger.warning(f"Could not check conflicts between {branch1} and {branch2}: {e}")
            return []
    
    def get_modified_files(self, branch: str) -> List[str]:
        """Get list of files modified in a branch"""
        try:
            result = subprocess.run(
                ['git', 'diff', '--name-only', f'main..{branch}'],
                capture_output=True, text=True, check=True
            )
            return result.stdout.strip().split('\n') if result.stdout.strip() else []
        except Exception:
            return []
    
    def generate_merge_plan(self, agent_branches: List[AgentBranch]) -> Dict:
        """Generate optimal merge plan"""
        # Sort branches by documentation score and conflicts
        def branch_priority(branch: AgentBranch) -> Tuple[float, int, int]:
            return (
                -branch.documentation_score,  # Higher doc score = higher priority
                len(branch.conflicts_with),   # Fewer conflicts = higher priority
                -branch.commits               # More commits = higher priority
            )
        
        sorted_branches = sorted(agent_branches, key=branch_priority)
        
        merge_plan = {
            'strategy': 'sequential_with_validation',
            'phases': [],
            'total_branches': len(sorted_branches),
            'estimated_conflicts': sum(len(b.conflicts_with) for b in sorted_branches) // 2
        }
        
        # Phase 1: Well-documented branches
        well_documented = [b for b in sorted_branches if b.documentation_score >= 80]
        if well_documented:
            merge_plan['phases'].append({
                'phase': 1,
                'name': 'Well-Documented Branches',
                'branches': [b.branch for b in well_documented],
                'risk': 'low',
                'description': 'Merge branches with good documentation first'
            })
        
        # Phase 2: Partially documented branches
        partial_docs = [b for b in sorted_branches if 20 <= b.documentation_score < 80]
        if partial_docs:
            merge_plan['phases'].append({
                'phase': 2,
                'name': 'Partially Documented Branches',
                'branches': [b.branch for b in partial_docs],
                'risk': 'medium',
                'description': 'Review and complete documentation before merge'
            })
        
        # Phase 3: Undocumented branches
        undocumented = [b for b in sorted_branches if b.documentation_score < 20]
        if undocumented:
            merge_plan['phases'].append({
                'phase': 3,
                'name': 'Undocumented Branches',
                'branches': [b.branch for b in undocumented],
                'risk': 'high',
                'description': 'Require full documentation before merge'
            })
        
        return merge_plan
    
    def execute_merge_plan(self, merge_plan: Dict, auto_resolve: bool = False) -> bool:
        """Execute the merge plan"""
        if self.config.dry_run:
            self.display_merge_plan(merge_plan)
            return True
        
        try:
            # Create integration branch
            integration_branch = 'integration/multi-agent-merge'
            
            if integration_branch in [b.name for b in self.repo.branches]:
                if not click.confirm(f"Integration branch {integration_branch} exists. Continue?"):
                    return False
                self.repo.delete_head(integration_branch, force=True)
            
            self.repo.create_head(integration_branch, 'main')
            self.repo.heads[integration_branch].checkout()
            
            # Execute each phase
            for phase in merge_plan['phases']:
                self.console.print(f"\n🔄 Starting Phase {phase['phase']}: {phase['name']}")
                
                if not self.execute_phase(phase, auto_resolve):
                    self.console.print(f"❌ Phase {phase['phase']} failed", style="red")
                    return False
                
                self.console.print(f"✅ Phase {phase['phase']} completed", style="green")
            
            self.console.print(f"\n✅ All phases completed successfully!", style="green")
            self.console.print(f"Integration branch: {integration_branch}")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Merge execution failed: {e}")
            return False
    
    def execute_phase(self, phase: Dict, auto_resolve: bool) -> bool:
        """Execute a single merge phase"""
        for branch in phase['branches']:
            self.console.print(f"  Merging {branch}...")
            
            try:
                # Attempt merge
                self.repo.git.merge(branch, '--no-ff', '-m', f'Merge {branch}')
                self.console.print(f"    ✅ {branch} merged successfully")
                
            except GitCommandError as e:
                if 'conflict' in str(e).lower():
                    self.console.print(f"    ⚠️  Conflicts detected in {branch}")
                    
                    if auto_resolve:
                        if not self.auto_resolve_conflicts():
                            self.console.print(f"    ❌ Could not auto-resolve conflicts")
                            return False
                    else:
                        self.console.print(f"    Please resolve conflicts manually and continue")
                        if not click.confirm("Continue after resolving conflicts?"):
                            return False
                else:
                    self.logger.error(f"Merge failed for {branch}: {e}")
                    return False
        
        return True
    
    def auto_resolve_conflicts(self) -> bool:
        """Attempt to automatically resolve merge conflicts"""
        try:
            # Get conflicted files
            status = self.repo.git.status('--porcelain').split('\n')
            conflicted = [line[3:] for line in status if line.startswith('UU ')]
            
            for file_path in conflicted:
                if file_path.endswith('.md') or file_path.endswith('.txt'):
                    # Simple resolution for documentation files
                    self.resolve_doc_conflict(file_path)
                else:
                    # For code files, prefer 'ours' strategy
                    self.repo.git.checkout('--ours', file_path)
                
                self.repo.git.add(file_path)
            
            # Commit the resolution
            self.repo.git.commit('-m', 'Auto-resolve merge conflicts')
            return True
            
        except Exception as e:
            self.logger.error(f"Auto-resolution failed: {e}")
            return False
    
    def resolve_doc_conflict(self, file_path: str):
        """Resolve conflicts in documentation files"""
        # For documentation, combine both sides
        try:
            with open(file_path, 'r') as f:
                content = f.read()
            
            # Remove conflict markers and combine content
            lines = content.split('\n')
            resolved_lines = []
            in_conflict = False
            
            for line in lines:
                if line.startswith('<<<<<<<'):
                    in_conflict = True
                    resolved_lines.append('# Merged content from multiple agents:')
                elif line.startswith('======='):
                    resolved_lines.append('\n# Additional content:')
                elif line.startswith('>>>>>>>'):
                    in_conflict = False
                elif not in_conflict:
                    resolved_lines.append(line)
                else:
                    resolved_lines.append(line)
            
            with open(file_path, 'w') as f:
                f.write('\n'.join(resolved_lines))
                
        except Exception as e:
            self.logger.warning(f"Could not resolve doc conflict in {file_path}: {e}")
    
    def display_merge_plan(self, merge_plan: Dict):
        """Display the merge plan in a formatted way"""
        self.console.print(Panel.fit(
            f"[bold]Merge Strategy: {merge_plan['strategy']}[/bold]\n"
            f"Total Branches: {merge_plan['total_branches']}\n"
            f"Estimated Conflicts: {merge_plan['estimated_conflicts']}",
            title="Merge Plan Overview"
        ))
        
        for phase in merge_plan['phases']:
            risk_color = {'low': 'green', 'medium': 'yellow', 'high': 'red'}.get(phase['risk'], 'white')
            
            self.console.print(f"\n[bold]Phase {phase['phase']}: {phase['name']}[/bold]")
            self.console.print(f"Risk: [{risk_color}]{phase['risk'].upper()}[/{risk_color}]")
            self.console.print(f"Description: {phase['description']}")
            self.console.print("Branches:")
            
            for branch in phase['branches']:
                self.console.print(f"  • {branch}")
    
    def display_branch_analysis(self, agent_branches: List[AgentBranch]):
        """Display branch analysis in a table"""
        table = Table(title="Agent Branch Analysis")
        
        table.add_column("Agent", style="cyan")
        table.add_column("Branch", style="magenta")
        table.add_column("Commits", style="yellow")
        table.add_column("Doc Score", style="green")
        table.add_column("Conflicts", style="red")
        table.add_column("Last Commit", style="blue")
        
        for branch in agent_branches:
            doc_color = "green" if branch.documentation_score >= 80 else "yellow" if branch.documentation_score >= 20 else "red"
            conflicts = ", ".join(branch.conflicts_with[:3]) + ("..." if len(branch.conflicts_with) > 3 else "")
            
            table.add_row(
                branch.name,
                branch.branch,
                str(branch.commits),
                f"[{doc_color}]{branch.documentation_score:.1f}%[/{doc_color}]",
                conflicts or "None",
                branch.last_commit
            )
        
        self.console.print(table)


@click.group()
def merge():
    """Advanced merge strategy commands"""
    pass

@merge.command()
@common_options
def analyze(**kwargs):
    """Analyze branches for merge strategy"""
    config = ScriptConfig(**{k: v for k, v in kwargs.items() if v is not None})
    manager = MergeStrategyManager(config)
    
    agent_branches = manager.analyze_branches()
    manager.display_branch_analysis(agent_branches)
    
    merge_plan = manager.generate_merge_plan(agent_branches)
    manager.display_merge_plan(merge_plan)

@merge.command()
@click.option('--auto-resolve', is_flag=True, help='Automatically resolve simple conflicts')
@common_options
def execute(auto_resolve, **kwargs):
    """Execute merge plan"""
    config = ScriptConfig(**{k: v for k, v in kwargs.items() if v is not None})
    manager = MergeStrategyManager(config)
    
    agent_branches = manager.analyze_branches()
    merge_plan = manager.generate_merge_plan(agent_branches)
    
    if not config.dry_run:
        if not click.confirm("Execute merge plan?"):
            return
    
    success = manager.execute_merge_plan(merge_plan, auto_resolve)
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    merge()
```

## Agent Coordination Scripts

### Task Assignment and Coordination Script

```python
#!/usr/bin/env python3
"""
coordination/task_manager.py - Advanced task assignment and coordination for multi-agent systems
"""

import yaml
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum

import click
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress
from core.base import BaseScript, ScriptConfig, common_options

class TaskStatus(Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    COMPLETED = "completed"
    FAILED = "failed"

class TaskPriority(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

@dataclass
class Task:
    id: str
    title: str
    description: str
    status: TaskStatus
    priority: TaskPriority
    assigned_agent: Optional[str]
    dependencies: List[str]
    estimated_hours: float
    created_at: datetime
    updated_at: datetime
    due_date: Optional[datetime]
    tags: List[str]
    
    def to_dict(self) -> Dict:
        data = asdict(self)
        data['status'] = self.status.value
        data['priority'] = self.priority.value
        data['created_at'] = self.created_at.isoformat()
        data['updated_at'] = self.updated_at.isoformat()
        if self.due_date:
            data['due_date'] = self.due_date.isoformat()
        return data
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'Task':
        data['status'] = TaskStatus(data['status'])
        data['priority'] = TaskPriority(data['priority'])
        data['created_at'] = datetime.fromisoformat(data['created_at'])
        data['updated_at'] = datetime.fromisoformat(data['updated_at'])
        if data.get('due_date'):
            data['due_date'] = datetime.fromisoformat(data['due_date'])
        return cls(**data)

@dataclass
class Agent:
    name: str
    specialization: str
    current_workload: float
    max_capacity: float
    skills: List[str]
    availability: bool
    workspace_path: str
    
class TaskManager(BaseScript):
    """Advanced task management and coordination system"""
    
    def __init__(self, config: ScriptConfig):
        super().__init__(config)
        self.tasks_file = Path('coordination/tasks.json')
        self.agents_file = Path('config/agents.yaml')
        self.tasks: Dict[str, Task] = {}
        self.agents: Dict[str, Agent] = {}
        
        self.load_data()
    
    def load_data(self):
        """Load tasks and agents from files"""
        # Load tasks
        if self.tasks_file.exists():
            with open(self.tasks_file) as f:
                tasks_data = json.load(f)
                self.tasks = {
                    task_id: Task.from_dict(task_data)
                    for task_id, task_data in tasks_data.items()
                }
        
        # Load agents
        if self.agents_file.exists():
            with open(self.agents_file) as f:
                agents_data = yaml.safe_load(f)
                self.agents = {
                    agent_data['name']: Agent(**agent_data)
                    for agent_data in agents_data.get('agents', [])
                }
    
    def save_data(self):
        """Save tasks to file"""
        if not self.config.dry_run:
            self.tasks_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.tasks_file, 'w') as f:
                tasks_data = {
                    task_id: task.to_dict()
                    for task_id, task in self.tasks.items()
                }
                json.dump(tasks_data, f, indent=2)
    
    def create_task(self, title: str, description: str, priority: TaskPriority,
                   dependencies: List[str] = None, estimated_hours: float = 1.0,
                   due_date: Optional[datetime] = None, tags: List[str] = None) -> str:
        """Create a new task"""
        task_id = f"task_{len(self.tasks) + 1:04d}"
        
        task = Task(
            id=task_id,
            title=title,
            description=description,
            status=TaskStatus.PENDING,
            priority=priority,
            assigned_agent=None,
            dependencies=dependencies or [],
            estimated_hours=estimated_hours,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            due_date=due_date,
            tags=tags or []
        )
        
        self.tasks[task_id] = task
        self.save_data()
        
        self.logger.info(f"Created task {task_id}: {title}")
        return task_id
    
    def assign_task(self, task_id: str, agent_name: str) -> bool:
        """Assign task to an agent"""
        if task_id not in self.tasks:
            self.logger.error(f"Task {task_id} not found")
            return False
        
        if agent_name not in self.agents:
            self.logger.error(f"Agent {agent_name} not found")
            return False
        
        task = self.tasks[task_id]
        agent = self.agents[agent_name]
        
        # Check if agent has capacity
        if agent.current_workload + task.estimated_hours > agent.max_capacity:
            self.logger.warning(f"Agent {agent_name} would exceed capacity")
            if not click.confirm("Assign anyway?"):
                return False
        
        # Check dependencies
        if not self.check_dependencies(task):
            self.logger.error(f"Task dependencies not met for {task_id}")
            return False
        
        task.assigned_agent = agent_name
        task.status = TaskStatus.ASSIGNED
        task.updated_at = datetime.now()
        
        agent.current_workload += task.estimated_hours
        
        self.save_data()
        self.logger.info(f"Assigned task {task_id} to {agent_name}")
        
        # Update agent's PATH document
        self.update_agent_path(agent_name, task)
        
        return True
    
    def auto_assign_tasks(self) -> Dict[str, List[str]]:
        """Automatically assign pending tasks to best-fit agents"""
        assignments = {}
        pending_tasks = [t for t in self.tasks.values() if t.status == TaskStatus.PENDING]
        
        # Sort tasks by priority and dependencies
        sorted_tasks = sorted(pending_tasks, key=lambda t: (
            -t.priority.value,  # Higher priority first
            len(t.dependencies),  # Fewer dependencies first
            t.created_at  # Older tasks first
        ))
        
        for task in sorted_tasks:
            if not self.check_dependencies(task):
                continue
            
            best_agent = self.find_best_agent(task)
            if best_agent:
                if self.assign_task(task.id, best_agent.name):
                    if best_agent.name not in assignments:
                        assignments[best_agent.name] = []
                    assignments[best_agent.name].append(task.id)
        
        return assignments
    
    def find_best_agent(self, task: Task) -> Optional[Agent]:
        """Find the best agent for a task"""
        available_agents = [a for a in self.agents.values() if a.availability]
        
        if not available_agents:
            return None
        
        # Score agents based on multiple factors
        scored_agents = []
        
        for agent in available_agents:
            score = self.calculate_agent_score(agent, task)
            if score > 0:  # Only consider agents with positive scores
                scored_agents.append((score, agent))
        
        if not scored_agents:
            return None
        
        # Return agent with highest score
        return max(scored_agents, key=lambda x: x[0])[1]
    
    def calculate_agent_score(self, agent: Agent, task: Task) -> float:
        """Calculate how well an agent matches a task"""
        score = 0.0
        
        # Capacity factor (prefer agents with more available capacity)
        available_capacity = agent.max_capacity - agent.current_workload
        if available_capacity < task.estimated_hours:
            return 0.0  # Cannot take this task
        
        capacity_score = available_capacity / agent.max_capacity
        score += capacity_score * 0.3
        
        # Skill matching (prefer agents with relevant skills)
        skill_matches = len(set(agent.skills) & set(task.tags))
        if agent.skills:
            skill_score = skill_matches / len(agent.skills)
            score += skill_score * 0.4
        
        # Specialization matching
        if task.tags and agent.specialization.lower() in [tag.lower() for tag in task.tags]:
            score += 0.3
        
        return score
    
    def check_dependencies(self, task: Task) -> bool:
        """Check if task dependencies are completed"""
        for dep_id in task.dependencies:
            if dep_id not in self.tasks:
                return False
            if self.tasks[dep_id].status != TaskStatus.COMPLETED:
                return False
        return True
    
    def update_task_status(self, task_id: str, status: TaskStatus) -> bool:
        """Update task status"""
        if task_id not in self.tasks:
            self.logger.error(f"Task {task_id} not found")
            return False
        
        task = self.tasks[task_id]
        old_status = task.status
        task.status = status
        task.updated_at = datetime.now()
        
        # If task is completed, reduce agent workload
        if status == TaskStatus.COMPLETED and task.assigned_agent:
            agent = self.agents[task.assigned_agent]
            agent.current_workload = max(0, agent.current_workload - task.estimated_hours)
        
        self.save_data()
        self.logger.info(f"Task {task_id} status: {old_status.value} → {status.value}")
        
        return True
    
    def update_agent_path(self, agent_name: str, task: Task):
        """Update agent's PATH document with new task"""
        agent = self.agents[agent_name]
        path_file = Path(agent.workspace_path) / 'PATH.md'
        
        if not path_file.exists():
            return
        
        try:
            content = path_file.read_text()
            
            # Add task to the task list
            task_line = f"- [ ] {task.title} (ID: {task.id})"
            
            # Find the implementation tasks section
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if 'implementation tasks' in line.lower():
                    # Insert task after this section
                    lines.insert(i + 1, task_line)
                    break
            else:
                # Add to end if section not found
                lines.append(f"\n## New Task\n{task_line}")
            
            if not self.config.dry_run:
                path_file.write_text('\n'.join(lines))
            
            self.logger.info(f"Updated PATH document for {agent_name}")
            
        except Exception as e:
            self.logger.warning(f"Could not update PATH document: {e}")
    
    def get_agent_workload(self, agent_name: str) -> Dict[str, Any]:
        """Get detailed workload information for an agent"""
        if agent_name not in self.agents:
            return {}
        
        agent = self.agents[agent_name]
        agent_tasks = [t for t in self.tasks.values() if t.assigned_agent == agent_name]
        
        return {
            'agent': agent_name,
            'current_workload': agent.current_workload,
            'max_capacity': agent.max_capacity,
            'utilization': (agent.current_workload / agent.max_capacity) * 100,
            'task_count': len(agent_tasks),
            'tasks_by_status': {
                status.value: len([t for t in agent_tasks if t.status == status])
                for status in TaskStatus
            }
        }
    
    def generate_status_report(self) -> Dict[str, Any]:
        """Generate comprehensive status report"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'total_tasks': len(self.tasks),
            'tasks_by_status': {
                status.value: len([t for t in self.tasks.values() if t.status == status])
                for status in TaskStatus
            },
            'agents': {
                name: self.get_agent_workload(name)
                for name in self.agents.keys()
            },
            'overdue_tasks': [
                t.id for t in self.tasks.values()
                if t.due_date and t.due_date < datetime.now() and t.status != TaskStatus.COMPLETED
            ],
            'blocked_tasks': [
                t.id for t in self.tasks.values() if t.status == TaskStatus.BLOCKED
            ]
        }
        
        return report
    
    def display_status_report(self, report: Dict[str, Any]):
        """Display status report in formatted tables"""
        # Task summary
        task_table = Table(title="Task Summary")
        task_table.add_column("Status", style="cyan")
        task_table.add_column("Count", style="magenta")
        task_table.add_column("Percentage", style="yellow")
        
        total_tasks = report['total_tasks']
        for status, count in report['tasks_by_status'].items():
            percentage = (count / total_tasks * 100) if total_tasks > 0 else 0
            task_table.add_row(status.title(), str(count), f"{percentage:.1f}%")
        
        self.console.print(task_table)
        
        # Agent workload
        agent_table = Table(title="Agent Workload")
        agent_table.add_column("Agent", style="cyan")
        agent_table.add_column("Utilization", style="magenta")
        agent_table.add_column("Tasks", style="yellow")
        agent_table.add_column("Status", style="green")
        
        for agent_name, agent_data in report['agents'].items():
            utilization = agent_data['utilization']
            util_color = "red" if utilization > 90 else "yellow" if utilization > 70 else "green"
            
            status = "Overloaded" if utilization > 100 else "Busy" if utilization > 80 else "Available"
            
            agent_table.add_row(
                agent_name,
                f"[{util_color}]{utilization:.1f}%[/{util_color}]",
                str(agent_data['task_count']),
                status
            )
        
        self.console.print(agent_table)
        
        # Alerts
        if report['overdue_tasks'] or report['blocked_tasks']:
            alerts = []
            if report['overdue_tasks']:
                alerts.append(f"⚠️  {len(report['overdue_tasks'])} overdue tasks")
            if report['blocked_tasks']:
                alerts.append(f"🚫 {len(report['blocked_tasks'])} blocked tasks")
            
            self.console.print(Panel.fit(
                "\n".join(alerts),
                title="⚠️  Alerts",
                border_style="red"
            ))


@click.group()
def tasks():
    """Task management commands"""
    pass

@tasks.command()
@click.argument('title')
@click.argument('description')
@click.option('--priority', type=click.Choice(['low', 'medium', 'high', 'critical']), default='medium')
@click.option('--dependencies', multiple=True, help='Task dependencies')
@click.option('--hours', type=float, default=1.0, help='Estimated hours')
@click.option('--due', type=click.DateTime(), help='Due date')
@click.option('--tags', multiple=True, help='Task tags')
@common_options
def create(title, description, priority, dependencies, hours, due, tags, **kwargs):
    """Create a new task"""
    config = ScriptConfig(**{k: v for k, v in kwargs.items() if v is not None})
    manager = TaskManager(config)
    
    priority_enum = TaskPriority[priority.upper()]
    task_id = manager.create_task(
        title=title,
        description=description,
        priority=priority_enum,
        dependencies=list(dependencies),
        estimated_hours=hours,
        due_date=due,
        tags=list(tags)
    )
    
    click.echo(f"Created task: {task_id}")

@tasks.command()
@click.argument('task_id')
@click.argument('agent_name')
@common_options
def assign(task_id, agent_name, **kwargs):
    """Assign task to agent"""
    config = ScriptConfig(**{k: v for k, v in kwargs.items() if v is not None})
    manager = TaskManager(config)
    
    success = manager.assign_task(task_id, agent_name)
    sys.exit(0 if success else 1)

@tasks.command()
@common_options
def auto_assign(**kwargs):
    """Automatically assign pending tasks"""
    config = ScriptConfig(**{k: v for k, v in kwargs.items() if v is not None})
    manager = TaskManager(config)
    
    assignments = manager.auto_assign_tasks()
    
    if assignments:
        click.echo("Task assignments:")
        for agent, task_ids in assignments.items():
            click.echo(f"  {agent}: {', '.join(task_ids)}")
    else:
        click.echo("No tasks assigned")

@tasks.command()
@common_options
def status(**kwargs):
    """Show task status report"""
    config = ScriptConfig(**{k: v for k, v in kwargs.items() if v is not None})
    manager = TaskManager(config)
    
    report = manager.generate_status_report()
    manager.display_status_report(report)

@tasks.command()
@click.argument('task_id')
@click.argument('status', type=click.Choice([s.value for s in TaskStatus]))
@common_options
def update(task_id, status, **kwargs):
    """Update task status"""
    config = ScriptConfig(**{k: v for k, v in kwargs.items() if v is not None})
    manager = TaskManager(config)
    
    status_enum = TaskStatus(status)
    success = manager.update_task_status(task_id, status_enum)
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    tasks()
```

## Monitoring and Compliance Scripts

### Documentation Compliance Monitor

```python
#!/usr/bin/env python3
"""
monitoring/compliance_monitor.py - Advanced compliance monitoring with real-time dashboard
"""

import json
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

import click
from rich.live import Live
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, BarColumn, TextColumn
from rich.layout import Layout
from git import Repo
from core.base import BaseScript, ScriptConfig, common_options

@dataclass
class ComplianceScore:
    agent: str
    documentation_percent: float
    last_update: datetime
    total_tasks: int
    completed_tasks: int
    commits_since_update: int
    compliance_trend: str  # "improving", "stable", "declining"

class ComplianceMonitor(BaseScript):
    """Advanced compliance monitoring system"""
    
    def __init__(self, config: ScriptConfig):
        super().__init__(config)
        self.repo = Repo('.')
        self.compliance_data = {}
        self.history_file = Path('monitoring/compliance_history.json')
        self.load_history()
    
    def load_history(self):
        """Load compliance history"""
        if self.history_file.exists():
            with open(self.history_file) as f:
                self.compliance_data = json.load(f)
    
    def save_history(self):
        """Save compliance history"""
        if not self.config.dry_run:
            self.history_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.history_file, 'w') as f:
                json.dump(self.compliance_data, f, indent=2, default=str)
    
    def get_agent_branches(self) -> List[str]:
        """Get list of agent branches"""
        return [b.name for b in self.repo.branches if b.name.startswith('agent_')]
    
    def calculate_compliance_score(self, branch_name: str) -> ComplianceScore:
        """Calculate comprehensive compliance score for an agent"""
        current_branch = self.repo.active_branch.name
        
        try:
            # Switch to agent branch
            self.repo.git.checkout(branch_name)
            
            # Analyze PATH document
            path_file = Path('PATH.md')
            doc_score = 0.0
            total_tasks = 0
            completed_tasks = 0
            last_update = datetime.min
            
            if path_file.exists():
                content = path_file.read_text()
                total_boxes = content.count('- [ ]') + content.count('- [x]')
                checked_boxes = content.count('- [x]')
                
                if total_boxes > 0:
                    doc_score = (checked_boxes / total_boxes) * 100
                
                total_tasks = total_boxes
                completed_tasks = checked_boxes
                
                # Get last modification time
                try:
                    last_update = datetime.fromtimestamp(path_file.stat().st_mtime)
                except Exception:
                    pass
            
            # Count commits since last PATH update
            commits_since_update = 0
            if last_update > datetime.min:
                try:
                    commits = list(self.repo.iter_commits(
                        branch_name, 
                        since=last_update.isoformat()
                    ))
                    commits_since_update = len(commits)
                except Exception:
                    pass
            
            # Calculate trend
            trend = self.calculate_trend(branch_name, doc_score)
            
            agent_name = branch_name.replace('agent_', '').replace('_', ' ').title()
            
            return ComplianceScore(
                agent=agent_name,
                documentation_percent=doc_score,
                last_update=last_update,
                total_tasks=total_tasks,
                completed_tasks=completed_tasks,
                commits_since_update=commits_since_update,
                compliance_trend=trend
            )
            
        except Exception as e:
            self.logger.warning(f"Could not analyze branch {branch_name}: {e}")
            return ComplianceScore(
                agent=branch_name,
                documentation_percent=0.0,
                last_update=datetime.min,
                total_tasks=0,
                completed_tasks=0,
                commits_since_update=0,
                compliance_trend="unknown"
            )
        
        finally:
            # Switch back to original branch
            try:
                self.repo.git.checkout(current_branch)
            except Exception:
                pass
    
    def calculate_trend(self, branch_name: str, current_score: float) -> str:
        """Calculate compliance trend"""
        if branch_name not in self.compliance_data:
            return "new"
        
        history = self.compliance_data[branch_name]
        if len(history) < 2:
            return "stable"
        
        recent_scores = [entry['score'] for entry in history[-3:]]
        
        if current_score > recent_scores[-1] + 5:
            return "improving"
        elif current_score < recent_scores[-1] - 5:
            return "declining"
        else:
            return "stable"
    
    def update_compliance_history(self, score: ComplianceScore):
        """Update compliance history"""
        branch_name = f"agent_{score.agent.lower().replace(' ', '_')}"
        
        if branch_name not in self.compliance_data:
            self.compliance_data[branch_name] = []
        
        entry = {
            'timestamp': datetime.now().isoformat(),
            'score': score.documentation_percent,
            'total_tasks': score.total_tasks,
            'completed_tasks': score.completed_tasks,
            'commits_since_update': score.commits_since_update
        }
        
        self.compliance_data[branch_name].append(entry)
        
        # Keep only last 100 entries
        if len(self.compliance_data[branch_name]) > 100:
            self.compliance_data[branch_name] = self.compliance_data[branch_name][-100:]
        
        self.save_history()
    
    def generate_compliance_report(self) -> Dict[str, Any]:
        """Generate comprehensive compliance report"""
        branches = self.get_agent_branches()
        scores = []
        
        for branch in branches:
            score = self.calculate_compliance_score(branch)
            scores.append(score)
            self.update_compliance_history(score)
        
        # Calculate overall metrics
        total_agents = len(scores)
        compliant_agents = len([s for s in scores if s.documentation_percent >= 80])
        at_risk_agents = len([s for s in scores if s.commits_since_update > 5 and s.documentation_percent < 50])
        
        avg_compliance = sum(s.documentation_percent for s in scores) / total_agents if total_agents > 0 else 0
        
        return {
            'timestamp': datetime.now(),
            'scores': scores,
            'metrics': {
                'total_agents': total_agents,
                'compliant_agents': compliant_agents,
                'compliance_rate': (compliant_agents / total_agents * 100) if total_agents > 0 else 0,
                'average_compliance': avg_compliance,
                'at_risk_agents': at_risk_agents
            }
        }
    
    def create_dashboard_layout(self, report: Dict[str, Any]) -> Layout:
        """Create real-time dashboard layout"""
        layout = Layout()
        
        layout.split_column(
            Layout(name="header", size=3),
            Layout(name="main"),
            Layout(name="footer", size=3)
        )
        
        layout["main"].split_row(
            Layout(name="scores"),
            Layout(name="metrics")
        )
        
        # Header
        layout["header"].update(
            Panel(
                f"[bold cyan]Multi-Agent Compliance Dashboard[/bold cyan]\n"
                f"Last Update: {report['timestamp'].strftime('%Y-%m-%d %H:%M:%S')}\n"
                f"Monitoring {report['metrics']['total_agents']} agents",
                style="blue"
            )
        )
        
        # Compliance scores table
        scores_table = Table(title="Agent Compliance Scores")
        scores_table.add_column("Agent", style="cyan")
        scores_table.add_column("Compliance", style="magenta")
        scores_table.add_column("Tasks", style="yellow")
        scores_table.add_column("Trend", style="green")
        scores_table.add_column("Risk", style="red")
        
        for score in report['scores']:
            # Color coding for compliance
            comp_color = "green" if score.documentation_percent >= 80 else \
                        "yellow" if score.documentation_percent >= 50 else "red"
            
            # Trend indicators
            trend_indicator = {"improving": "📈", "stable": "➡️", "declining": "📉", "new": "🆕", "unknown": "❓"}
            
            # Risk assessment
            risk = "🔴 HIGH" if score.commits_since_update > 5 and score.documentation_percent < 50 else \
                   "🟡 MEDIUM" if score.commits_since_update > 3 else "🟢 LOW"
            
            scores_table.add_row(
                score.agent,
                f"[{comp_color}]{score.documentation_percent:.1f}%[/{comp_color}]",
                f"{score.completed_tasks}/{score.total_tasks}",
                f"{trend_indicator.get(score.compliance_trend, '❓')} {score.compliance_trend}",
                risk
            )
        
        layout["scores"].update(scores_table)
        
        # Metrics panel
        metrics = report['metrics']
        metrics_content = f"""
[bold]Overall Metrics[/bold]

📊 Compliance Rate: [green]{metrics['compliance_rate']:.1f}%[/green]
📈 Average Score: [cyan]{metrics['average_compliance']:.1f}%[/cyan]
✅ Compliant Agents: [green]{metrics['compliant_agents']}/{metrics['total_agents']}[/green]
⚠️  At-Risk Agents: [red]{metrics['at_risk_agents']}[/red]

[bold]Status Distribution[/bold]
"""
        
        # Add progress bars for status distribution
        compliant_pct = (metrics['compliant_agents'] / metrics['total_agents'] * 100) if metrics['total_agents'] > 0 else 0
        risk_pct = (metrics['at_risk_agents'] / metrics['total_agents'] * 100) if metrics['total_agents'] > 0 else 0
        
        metrics_content += f"\nCompliant: {compliant_pct:.0f}%\nAt Risk: {risk_pct:.0f}%"
        
        layout["metrics"].update(Panel(metrics_content, title="System Metrics"))
        
        # Footer with alerts
        alerts = []
        if metrics['at_risk_agents'] > 0:
            alerts.append(f"⚠️ {metrics['at_risk_agents']} agents at risk of non-compliance")
        if metrics['compliance_rate'] < 70:
            alerts.append("🚨 Overall compliance rate below 70%")
        
        footer_text = " | ".join(alerts) if alerts else "✅ All systems nominal"
        layout["footer"].update(Panel(footer_text, style="yellow" if alerts else "green"))
        
        return layout
    
    def run_dashboard(self, refresh_interval: int = 30):
        """Run real-time compliance dashboard"""
        try:
            with Live(self.create_dashboard_layout(self.generate_compliance_report()), 
                     refresh_per_second=1, screen=True) as live:
                
                while True:
                    time.sleep(refresh_interval)
                    report = self.generate_compliance_report()
                    live.update(self.create_dashboard_layout(report))
                    
        except KeyboardInterrupt:
            self.console.print("\n👋 Dashboard stopped")
    
    def check_pre_commit(self) -> bool:
        """Pre-commit compliance check"""
        # Get current branch
        current_branch = self.repo.active_branch.name
        
        if not current_branch.startswith('agent_'):
            # Not an agent branch, allow commit
            return True
        
        score = self.calculate_compliance_score(current_branch)
        
        # Check if PATH document exists and is updated
        path_file = Path('PATH.md')
        if not path_file.exists():
            self.console.print("❌ PATH.md document missing", style="red")
            return False
        
        # Check if PATH was updated recently relative to commits
        if score.commits_since_update > 3:
            self.console.print(
                f"❌ PATH document outdated: {score.commits_since_update} commits since last update",
                style="red"
            )
            return False
        
        # Check minimum compliance threshold
        if score.documentation_percent < 30:
            self.console.print(
                f"❌ Documentation compliance too low: {score.documentation_percent:.1f}%",
                style="red"
            )
            return False
        
        self.console.print(f"✅ Compliance check passed: {score.documentation_percent:.1f}%", style="green")
        return True
    
    def generate_weekly_report(self) -> str:
        """Generate weekly compliance report"""
        report = self.generate_compliance_report()
        
        report_content = f"""# Weekly Compliance Report
Generated: {report['timestamp'].strftime('%Y-%m-%d %H:%M:%S')}

## Summary
- **Total Agents**: {report['metrics']['total_agents']}
- **Compliance Rate**: {report['metrics']['compliance_rate']:.1f}%
- **Average Score**: {report['metrics']['average_compliance']:.1f}%
- **At-Risk Agents**: {report['metrics']['at_risk_agents']}

## Agent Details
"""
        
        for score in sorted(report['scores'], key=lambda x: x.documentation_percent, reverse=True):
            status = "✅ COMPLIANT" if score.documentation_percent >= 80 else \
                    "⚠️ NEEDS ATTENTION" if score.documentation_percent >= 50 else \
                    "❌ NON-COMPLIANT"
            
            report_content += f"""
### {score.agent}
- **Status**: {status}
- **Compliance**: {score.documentation_percent:.1f}%
- **Tasks**: {score.completed_tasks}/{score.total_tasks}
- **Trend**: {score.compliance_trend}
- **Commits Since Update**: {score.commits_since_update}
"""
        
        return report_content


@click.group()
def compliance():
    """Compliance monitoring commands"""
    pass

@compliance.command()
@click.option('--refresh', default=30, help='Refresh interval in seconds')
@common_options
def dashboard(refresh, **kwargs):
    """Run real-time compliance dashboard"""
    config = ScriptConfig(**{k: v for k, v in kwargs.items() if v is not None})
    monitor = ComplianceMonitor(config)
    
    monitor.run_dashboard(refresh)

@compliance.command()
@common_options
def check(**kwargs):
    """Check current compliance status"""
    config = ScriptConfig(**{k: v for k, v in kwargs.items() if v is not None})
    monitor = ComplianceMonitor(config)
    
    report = monitor.generate_compliance_report()
    
    # Display report table
    table = Table(title="Compliance Status")
    table.add_column("Agent", style="cyan")
    table.add_column("Compliance", style="magenta")
    table.add_column("Status", style="green")
    table.add_column("Risk", style="red")
    
    for score in report['scores']:
        comp_color = "green" if score.documentation_percent >= 80 else \
                    "yellow" if score.documentation_percent >= 50 else "red"
        
        status = "Compliant" if score.documentation_percent >= 80 else \
                "Needs Work" if score.documentation_percent >= 50 else "Non-Compliant"
        
        risk = "High" if score.commits_since_update > 5 and score.documentation_percent < 50 else \
               "Medium" if score.commits_since_update > 3 else "Low"
        
        table.add_row(
            score.agent,
            f"[{comp_color}]{score.documentation_percent:.1f}%[/{comp_color}]",
            status,
            risk
        )
    
    monitor.console.print(table)

@compliance.command('pre-commit')
@common_options
def pre_commit_check(**kwargs):
    """Pre-commit compliance check"""
    config = ScriptConfig(**{k: v for k, v in kwargs.items() if v is not None})
    monitor = ComplianceMonitor(config)
    
    success = monitor.check_pre_commit()
    sys.exit(0 if success else 1)

@compliance.command()
@click.option('--output', type=click.Path(), help='Output file path')
@common_options
def report(output, **kwargs):
    """Generate compliance report"""
    config = ScriptConfig(**{k: v for k, v in kwargs.items() if v is not None})
    monitor = ComplianceMonitor(config)
    
    report_content = monitor.generate_weekly_report()
    
    if output:
        Path(output).write_text(report_content)
        click.echo(f"Report saved to {output}")
    else:
        click.echo(report_content)

if __name__ == '__main__':
    compliance()
```

## Configuration System

### Centralized Configuration Management

```python
#!/usr/bin/env python3
"""
config/config_manager.py - Centralized configuration management system
"""

import yaml
import json
from pathlib import Path
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
import os

import click
from pydantic import BaseModel, Field, validator
from core.base import BaseScript, ScriptConfig, common_options

class ProjectConfig(BaseModel):
    """Main project configuration"""
    name: str
    version: str = "1.0.0"
    description: str = ""
    
    # Git settings
    main_branch: str = "main"
    worktree_prefix: str = "agent_"
    
    # Compliance settings
    documentation_required: bool = True
    documentation_threshold: float = 80.0
    pre_commit_hooks: bool = True
    
    # Monitoring settings
    dashboard_enabled: bool = True
    metrics_collection: bool = True
    real_time_updates: bool = True
    refresh_interval: int = 30

class AgentConfig(BaseModel):
    """Individual agent configuration"""
    name: str
    id: str
    specialization: str
    workspace: str
    branch: str
    max_capacity: float = 40.0  # hours per week
    skills: List[str] = Field(default_factory=list)
    availability: bool = True
    compliance_required: bool = True

class MonitoringConfig(BaseModel):
    """Monitoring system configuration"""
    dashboard_port: int = 8080
    prometheus_port: int = 9090
    collection_interval: int = 10
    check_interval: int = 30
    
    # Alert settings
    alerts_enabled: bool = True
    email_notifications: bool = False
    slack_webhook: Optional[str] = None
    
    # Thresholds
    compliance_threshold: float = 80.0
    risk_threshold: int = 5  # commits without doc update

class ConfigManager(BaseScript):
    """Centralized configuration management"""
    
    def __init__(self, config: ScriptConfig):
        super().__init__(config)
        self.config_dir = Path('config')
        self.config_dir.mkdir(exist_ok=True)
        
        self.project_config_file = self.config_dir / 'project.yaml'
        self.agents_config_file = self.config_dir / 'agents.yaml'
        self.monitoring_config_file = self.config_dir / 'monitoring.yaml'
        
        self._project_config = None
        self._agents_config = None
        self._monitoring_config = None
    
    @property
    def project_config(self) -> ProjectConfig:
        """Get project configuration"""
        if self._project_config is None:
            self._project_config = self.load_project_config()
        return self._project_config
    
    @property
    def agents_config(self) -> List[AgentConfig]:
        """Get agents configuration"""
        if self._agents_config is None:
            self._agents_config = self.load_agents_config()
        return self._agents_config
    
    @property
    def monitoring_config(self) -> MonitoringConfig:
        """Get monitoring configuration"""
        if self._monitoring_config is None:
            self._monitoring_config = self.load_monitoring_config()
        return self._monitoring_config
    
    def load_project_config(self) -> ProjectConfig:
        """Load project configuration"""
        if self.project_config_file.exists():
            with open(self.project_config_file) as f:
                data = yaml.safe_load(f)
                return ProjectConfig(**data.get('project', {}))
        else:
            # Return default config
            return ProjectConfig(name="multi-agent-project")
    
    def load_agents_config(self) -> List[AgentConfig]:
        """Load agents configuration"""
        if self.agents_config_file.exists():
            with open(self.agents_config_file) as f:
                data = yaml.safe_load(f)
                return [AgentConfig(**agent) for agent in data.get('agents', [])]
        else:
            return []
    
    def load_monitoring_config(self) -> MonitoringConfig:
        """Load monitoring configuration"""
        if self.monitoring_config_file.exists():
            with open(self.monitoring_config_file) as f:
                data = yaml.safe_load(f)
                return MonitoringConfig(**data.get('monitoring', {}))
        else:
            return MonitoringConfig()
    
    def save_project_config(self, config: ProjectConfig):
        """Save project configuration"""
        if not self.config.dry_run:
            data = {'project': config.dict()}
            with open(self.project_config_file, 'w') as f:
                yaml.dump(data, f, default_flow_style=False)
        self._project_config = config
        self.logger.info("Project configuration saved")
    
    def save_agents_config(self, configs: List[AgentConfig]):
        """Save agents configuration"""
        if not self.config.dry_run:
            data = {'agents': [config.dict() for config in configs]}
            with open(self.agents_config_file, 'w') as f:
                yaml.dump(data, f, default_flow_style=False)
        self._agents_config = configs
        self.logger.info("Agents configuration saved")
    
    def save_monitoring_config(self, config: MonitoringConfig):
        """Save monitoring configuration"""
        if not self.config.dry_run:
            data = {'monitoring': config.dict()}
            with open(self.monitoring_config_file, 'w') as f:
                yaml.dump(data, f, default_flow_style=False)
        self._monitoring_config = config
        self.logger.info("Monitoring configuration saved")
    
    def add_agent(self, name: str, specialization: str, skills: List[str] = None) -> AgentConfig:
        """Add new agent configuration"""
        agent_id = f"agent_{len(self.agents_config) + 1}"
        workspace = f"agents/{name.lower().replace(' ', '_')}"
        branch = f"agent_{name.lower().replace(' ', '_')}"
        
        agent_config = AgentConfig(
            name=name,
            id=agent_id,
            specialization=specialization,
            workspace=workspace,
            branch=branch,
            skills=skills or []
        )
        
        current_agents = self.agents_config
        current_agents.append(agent_config)
        self.save_agents_config(current_agents)
        
        return agent_config
    
    def remove_agent(self, agent_name: str) -> bool:
        """Remove agent configuration"""
        current_agents = self.agents_config
        updated_agents = [a for a in current_agents if a.name != agent_name]
        
        if len(updated_agents) < len(current_agents):
            self.save_agents_config(updated_agents)
            self.logger.info(f"Removed agent: {agent_name}")
            return True
        else:
            self.logger.warning(f"Agent not found: {agent_name}")
            return False
    
    def update_agent_capacity(self, agent_name: str, capacity: float) -> bool:
        """Update agent capacity"""
        current_agents = self.agents_config
        
        for agent in current_agents:
            if agent.name == agent_name:
                agent.max_capacity = capacity
                self.save_agents_config(current_agents)
                self.logger.info(f"Updated capacity for {agent_name}: {capacity}")
                return True
        
        self.logger.warning(f"Agent not found: {agent_name}")
        return False
    
    def get_agent_by_name(self, name: str) -> Optional[AgentConfig]:
        """Get agent configuration by name"""
        for agent in self.agents_config:
            if agent.name == name:
                return agent
        return None
    
    def get_agent_by_branch(self, branch: str) -> Optional[AgentConfig]:
        """Get agent configuration by branch name"""
        for agent in self.agents_config:
            if agent.branch == branch:
                return agent
        return None
    
    def validate_configuration(self) -> Dict[str, List[str]]:
        """Validate all configurations"""
        errors = {
            'project': [],
            'agents': [],
            'monitoring': []
        }
        
        # Validate project config
        try:
            project = self.project_config
            if not project.name:
                errors['project'].append("Project name is required")
        except Exception as e:
            errors['project'].append(f"Invalid project config: {e}")
        
        # Validate agents config
        try:
            agents = self.agents_config
            agent_names = [a.name for a in agents]
            if len(agent_names) != len(set(agent_names)):
                errors['agents'].append("Duplicate agent names found")
            
            for agent in agents:
                if not agent.workspace:
                    errors['agents'].append(f"Agent {agent.name} missing workspace")
                if not agent.branch:
                    errors['agents'].append(f"Agent {agent.name} missing branch")
        except Exception as e:
            errors['agents'].append(f"Invalid agents config: {e}")
        
        # Validate monitoring config
        try:
            monitoring = self.monitoring_config
            if monitoring.dashboard_port == monitoring.prometheus_port:
                errors['monitoring'].append("Dashboard and Prometheus ports must be different")
        except Exception as e:
            errors['monitoring'].append(f"Invalid monitoring config: {e}")
        
        return errors
    
    def export_configuration(self, output_path: Path):
        """Export all configuration to a single file"""
        export_data = {
            'project': self.project_config.dict(),
            'agents': [agent.dict() for agent in self.agents_config],
            'monitoring': self.monitoring_config.dict(),
            'export_timestamp': datetime.now().isoformat()
        }
        
        if not self.config.dry_run:
            with open(output_path, 'w') as f:
                json.dump(export_data, f, indent=2)
        
        self.logger.info(f"Configuration exported to {output_path}")
    
    def import_configuration(self, import_path: Path):
        """Import configuration from exported file"""
        with open(import_path) as f:
            data = json.load(f)
        
        # Import project config
        if 'project' in data:
            project_config = ProjectConfig(**data['project'])
            self.save_project_config(project_config)
        
        # Import agents config
        if 'agents' in data:
            agents_config = [AgentConfig(**agent) for agent in data['agents']]
            self.save_agents_config(agents_config)
        
        # Import monitoring config
        if 'monitoring' in data:
            monitoring_config = MonitoringConfig(**data['monitoring'])
            self.save_monitoring_config(monitoring_config)
        
        self.logger.info(f"Configuration imported from {import_path}")


@click.group()
def config():
    """Configuration management commands"""
    pass

@config.command()
@common_options
def show(**kwargs):
    """Show current configuration"""
    config = ScriptConfig(**{k: v for k, v in kwargs.items() if v is not None})
    manager = ConfigManager(config)
    
    # Display project config
    project = manager.project_config
    click.echo("Project Configuration:")
    click.echo(f"  Name: {project.name}")
    click.echo(f"  Version: {project.version}")
    click.echo(f"  Main Branch: {project.main_branch}")
    click.echo(f"  Documentation Required: {project.documentation_required}")
    
    # Display agents
    agents = manager.agents_config
    click.echo(f"\nAgents ({len(agents)}):")
    for agent in agents:
        click.echo(f"  {agent.name} ({agent.specialization})")
        click.echo(f"    Branch: {agent.branch}")
        click.echo(f"    Capacity: {agent.max_capacity}h/week")
    
    # Display monitoring config
    monitoring = manager.monitoring_config
    click.echo(f"\nMonitoring Configuration:")
    click.echo(f"  Dashboard Port: {monitoring.dashboard_port}")
    click.echo(f"  Prometheus Port: {monitoring.prometheus_port}")
    click.echo(f"  Alerts Enabled: {monitoring.alerts_enabled}")

@config.command()
@common_options
def validate(**kwargs):
    """Validate configuration"""
    config = ScriptConfig(**{k: v for k, v in kwargs.items() if v is not None})
    manager = ConfigManager(config)
    
    errors = manager.validate_configuration()
    
    has_errors = any(errors.values())
    
    if has_errors:
        click.echo("❌ Configuration validation failed:")
        for section, section_errors in errors.items():
            if section_errors:
                click.echo(f"\n{section.title()} errors:")
                for error in section_errors:
                    click.echo(f"  • {error}")
    else:
        click.echo("✅ Configuration validation passed")
    
    sys.exit(1 if has_errors else 0)

@config.command()
@click.argument('name')
@click.argument('specialization')
@click.option('--skills', multiple=True, help='Agent skills')
@common_options
def add_agent(name, specialization, skills, **kwargs):
    """Add new agent configuration"""
    config = ScriptConfig(**{k: v for k, v in kwargs.items() if v is not None})
    manager = ConfigManager(config)
    
    agent = manager.add_agent(name, specialization, list(skills))
    click.echo(f"Added agent: {agent.name}")

@config.command()
@click.argument('name')
@common_options
def remove_agent(name, **kwargs):
    """Remove agent configuration"""
    config = ScriptConfig(**{k: v for k, v in kwargs.items() if v is not None})
    manager = ConfigManager(config)
    
    success = manager.remove_agent(name)
    sys.exit(0 if success else 1)

@config.command()
@click.argument('output_path', type=click.Path())
@common_options
def export(output_path, **kwargs):
    """Export configuration"""
    config = ScriptConfig(**{k: v for k, v in kwargs.items() if v is not None})
    manager = ConfigManager(config)
    
    manager.export_configuration(Path(output_path))

@config.command()
@click.argument('import_path', type=click.Path(exists=True))
@common_options
def import_config(import_path, **kwargs):
    """Import configuration"""
    config = ScriptConfig(**{k: v for k, v in kwargs.items() if v is not None})
    manager = ConfigManager(config)
    
    manager.import_configuration(Path(import_path))

if __name__ == '__main__':
    config()
```

## Usage Examples

### End-to-End Workflow Example

```bash
#!/bin/bash
# examples/complete_workflow.sh - Complete multi-agent workflow example

echo "🚀 Multi-Agent System Setup and Execution Example"

# 1. Environment validation
echo "1️⃣ Validating environment..."
python setup/validate_environment.py
if [ $? -ne 0 ]; then
    echo "❌ Environment validation failed"
    exit 1
fi

# 2. Project initialization
echo "2️⃣ Initializing project..."
python setup/init_project.py my_project \
    --agents "Core Developer" "Data Specialist" "QA Engineer" "DevOps Engineer"

cd my_project

# 3. Create agent worktrees
echo "3️⃣ Creating agent worktrees..."
python ../git/manage_worktrees.py create "Core Developer"
python ../git/manage_worktrees.py create "Data Specialist"
python ../git/manage_worktrees.py create "QA Engineer"
python ../git/manage_worktrees.py create "DevOps Engineer"

# 4. Create and assign initial tasks
echo "4️⃣ Creating and assigning tasks..."
python ../coordination/task_manager.py tasks create \
    "Set up core infrastructure" \
    "Implement basic project structure and configuration" \
    --priority high --hours 8 --tags infrastructure setup

python ../coordination/task_manager.py tasks create \
    "Implement data processing pipeline" \
    "Create data ingestion and processing modules" \
    --priority high --hours 12 --tags data processing

python ../coordination/task_manager.py tasks create \
    "Set up testing framework" \
    "Implement unit and integration testing infrastructure" \
    --priority medium --hours 6 --tags testing qa

python ../coordination/task_manager.py tasks create \
    "Configure CI/CD pipeline" \
    "Set up deployment and continuous integration" \
    --priority medium --hours 10 --tags devops deployment

# Auto-assign tasks
python ../coordination/task_manager.py tasks auto-assign

# 5. Start monitoring dashboard (in background)
echo "5️⃣ Starting monitoring dashboard..."
python ../monitoring/compliance_monitor.py dashboard --refresh 10 &
DASHBOARD_PID=$!

# 6. Monitor agent progress
echo "6️⃣ Monitoring system active. Check compliance status:"
python ../monitoring/compliance_monitor.py check

# 7. Simulate some development work and check progress
echo "7️⃣ Development work simulation..."
sleep 30

# Check worktree status
python ../git/manage_worktrees.py list-cmd

# Check task status
python ../coordination/task_manager.py tasks status

# 8. When ready, analyze branches for merge
echo "8️⃣ Analyzing branches for merge strategy..."
python ../git/merge_strategy.py analyze

# 9. Execute merge plan (with confirmation)
echo "9️⃣ Executing merge plan..."
python ../git/merge_strategy.py execute --auto-resolve

# 10. Generate final compliance report
echo "🔟 Generating final report..."
python ../monitoring/compliance_monitor.py report --output final_compliance_report.md

# Cleanup
kill $DASHBOARD_PID 2>/dev/null

echo "✅ Multi-agent workflow completed successfully!"
echo "📊 Check final_compliance_report.md for detailed results"
```

### Quick Start Script

```python
#!/usr/bin/env python3
"""
examples/quick_start.py - Quick start script for new projects
"""

import click
import subprocess
import sys
from pathlib import Path

@click.command()
@click.argument('project_name')
@click.option('--agents', multiple=True, required=True, help='Agent names')
@click.option('--git-init', is_flag=True, help='Initialize git repository')
@click.option('--start-monitoring', is_flag=True, help='Start monitoring dashboard')
def quick_start(project_name, agents, git_init, start_monitoring):
    """Quick start setup for multi-agent project"""
    
    scripts_dir = Path(__file__).parent.parent
    
    try:
        # 1. Validate environment
        click.echo("🔍 Validating environment...")
        result = subprocess.run([
            sys.executable, scripts_dir / 'setup' / 'validate_environment.py'
        ], check=True)
        
        # 2. Initialize project
        click.echo(f"🏗️ Initializing project '{project_name}'...")
        cmd = [sys.executable, scripts_dir / 'setup' / 'init_project.py', project_name]
        for agent in agents:
            cmd.extend(['--agents', agent])
        
        subprocess.run(cmd, check=True)
        
        # Change to project directory
        project_path = Path(project_name)
        if not project_path.exists():
            click.echo(f"❌ Project directory {project_name} not created")
            sys.exit(1)
        
        # 3. Create worktrees
        click.echo("🌿 Creating agent worktrees...")
        for agent in agents:
            subprocess.run([
                sys.executable, scripts_dir / 'git' / 'manage_worktrees.py',
                'create', agent
            ], cwd=project_path, check=True)
        
        # 4. Set up initial configuration
        click.echo("⚙️ Configuring agents...")
        for agent in agents:
            subprocess.run([
                sys.executable, scripts_dir / 'config' / 'config_manager.py',
                'add-agent', agent, f'{agent} specialist'
            ], cwd=project_path)
        
        # 5. Start monitoring if requested
        if start_monitoring:
            click.echo("📊 Starting monitoring dashboard...")
            click.echo("Dashboard will be available at http://localhost:8080")
            subprocess.Popen([
                sys.executable, scripts_dir / 'monitoring' / 'compliance_monitor.py',
                'dashboard'
            ], cwd=project_path)
        
        # 6. Display next steps
        click.echo("\n✅ Project setup complete!")
        click.echo(f"\nNext steps:")
        click.echo(f"1. cd {project_name}")
        click.echo(f"2. Create and assign tasks:")
        click.echo(f"   python ../coordination/task_manager.py tasks create 'Task Title' 'Description'")
        click.echo(f"3. Monitor compliance:")
        click.echo(f"   python ../monitoring/compliance_monitor.py check")
        click.echo(f"4. Check worktree status:")
        click.echo(f"   python ../git/manage_worktrees.py list-cmd")
        
        if start_monitoring:
            click.echo(f"5. View dashboard at http://localhost:8080")
        
    except subprocess.CalledProcessError as e:
        click.echo(f"❌ Setup failed: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        click.echo("\n⏹️ Setup interrupted")
        sys.exit(1)

if __name__ == '__main__':
    quick_start()
```

## Best Practices

### Implementation Guidelines

1. **Technical Enforcement First**
   - Always implement pre-commit hooks for compliance
   - Use automated checks rather than manual processes
   - Make compliance easier than non-compliance

2. **Performance Optimization**
   - Use batch operations for all git and database operations
   - Implement connection pooling for database operations
   - Cache frequently accessed data

3. **Error Handling**
   - Implement comprehensive retry logic with exponential backoff
   - Provide graceful degradation for non-critical failures
   - Log all errors with appropriate context

4. **User Experience**
   - Provide clear, actionable error messages
   - Use progress bars for long-running operations
   - Offer dry-run modes for destructive operations

5. **Extensibility**
   - Design scripts as modular components
   - Use plugin architecture where appropriate
   - Provide clear extension points

### Security Considerations

1. **Input Validation**
   - Validate all user inputs
   - Sanitize file paths and git references
   - Use parameterized queries for database operations

2. **Authentication**
   - Support multiple authentication methods
   - Never log or store credentials
   - Use secure credential storage mechanisms

3. **File Operations**
   - Validate file permissions before operations
   - Use secure temporary file handling
   - Implement proper cleanup procedures

### Testing and Quality Assurance

1. **Unit Testing**
   - Test all core functionality
   - Mock external dependencies
   - Use property-based testing where appropriate

2. **Integration Testing**
   - Test cross-script interactions
   - Validate configuration management
   - Test error scenarios

3. **Performance Testing**
   - Benchmark batch operations
   - Test with realistic data volumes
   - Monitor resource usage

## Conclusion

This comprehensive utility scripts collection provides a production-ready foundation for multi-agent development systems. The scripts emphasize:

- **Technical enforcement** over voluntary compliance
- **Automated processes** over manual coordination  
- **Real-time monitoring** over periodic checks
- **Batch operations** for optimal performance
- **Comprehensive error handling** for reliability

Each script is designed to be both standalone and part of the larger system, allowing teams to adopt individual components or implement the complete multi-agent coordination platform.

The key insight from the original 9-agent project - that 44% of agents completely failed to document despite technical competence - is addressed through technical enforcement mechanisms rather than management pressure. This approach has proven more effective in ensuring project success while maintaining high technical standards.