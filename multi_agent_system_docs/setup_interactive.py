#!/usr/bin/env python3
"""
setup_interactive.py - Interactive setup wizard for multi-agent systems

This script provides a guided, interactive setup experience for implementing
the comprehensive utility scripts system on any codebase.
"""

import os
import sys
import subprocess
import json
import yaml
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime

import click
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt, Confirm, IntPrompt
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn
from rich.table import Table
from rich.text import Text
from rich.rule import Rule

console = Console()

class InteractiveSetup:
    """Interactive setup wizard for multi-agent systems"""
    
    def __init__(self):
        self.console = console
        self.project_config = {}
        self.agents = []
        self.setup_dir = Path.cwd()
        self.scripts_created = []
        self.errors = []
        
    def welcome(self):
        """Display welcome message and overview"""
        self.console.print(Panel.fit(
            "[bold cyan]Multi-Agent Development System Setup[/bold cyan]\n\n"
            "This interactive wizard will help you set up a complete multi-agent\n"
            "development system with automated compliance, monitoring, and coordination.\n\n"
            "[bold]What this setup includes:[/bold]\n"
            "• Project structure and configuration\n"
            "• Git worktree management\n"
            "• Agent coordination system\n"
            "• Real-time compliance monitoring\n"
            "• Automated documentation enforcement\n"
            "• Task management and assignment\n"
            "• CI/CD pipeline integration",
            title="🚀 Welcome",
            border_style="cyan"
        ))
    
    def check_prerequisites(self) -> bool:
        """Check system prerequisites"""
        self.console.print("\n[bold]Checking prerequisites...[/bold]")
        
        checks = [
            ("Python 3.8+", self.check_python_version),
            ("Git installation", self.check_git),
            ("Required packages", self.check_packages),
            ("Directory permissions", self.check_permissions),
        ]
        
        all_passed = True
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=self.console
        ) as progress:
            
            for check_name, check_func in checks:
                task = progress.add_task(f"Checking {check_name}...", total=None)
                passed, message = check_func()
                
                if passed:
                    progress.update(task, description=f"✅ {check_name}")
                else:
                    progress.update(task, description=f"❌ {check_name}")
                    self.console.print(f"   [red]{message}[/red]")
                    all_passed = False
        
        if not all_passed:
            self.console.print("\n[red]❌ Prerequisites check failed. Please fix the issues above and try again.[/red]")
            return False
        
        self.console.print("\n[green]✅ All prerequisites met![/green]")
        return True
    
    def check_python_version(self) -> tuple[bool, str]:
        """Check Python version"""
        version = sys.version_info
        if version >= (3, 8):
            return True, f"Python {version.major}.{version.minor}.{version.micro}"
        return False, f"Python {version.major}.{version.minor} found, but 3.8+ required"
    
    def check_git(self) -> tuple[bool, str]:
        """Check Git installation"""
        try:
            result = subprocess.run(['git', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                return True, result.stdout.strip()
            return False, "Git command failed"
        except FileNotFoundError:
            return False, "Git not found in PATH"
    
    def check_packages(self) -> tuple[bool, str]:
        """Check required Python packages"""
        required = ['click', 'rich', 'pydantic', 'gitpython', 'psutil', 'pyyaml']
        missing = []
        
        for package in required:
            try:
                __import__(package)
            except ImportError:
                missing.append(package)
        
        if missing:
            return False, f"Missing packages: {', '.join(missing)}. Run: pip install {' '.join(missing)}"
        return True, "All required packages installed"
    
    def check_permissions(self) -> tuple[bool, str]:
        """Check directory write permissions"""
        try:
            test_file = Path('.test_permissions')
            test_file.write_text('test')
            test_file.unlink()
            return True, "Write permissions OK"
        except Exception as e:
            return False, f"No write permission: {e}"
    
    def gather_project_info(self):
        """Gather project information from user"""
        self.console.print("\n" + "="*60)
        self.console.print("[bold cyan]📋 Project Configuration[/bold cyan]")
        self.console.print("="*60)
        
        # Project name
        default_name = Path.cwd().name
        project_name = Prompt.ask(
            "Project name",
            default=default_name,
            show_default=True
        )
        
        # Project description
        description = Prompt.ask(
            "Project description",
            default="Multi-agent development project"
        )
        
        # Git configuration
        use_git = Confirm.ask("Initialize/use Git repository?", default=True)
        main_branch = "main"
        if use_git:
            main_branch = Prompt.ask("Main branch name", default="main")
        
        # Compliance settings
        self.console.print(f"\n[bold]🛡️  Compliance Settings[/bold]")
        
        doc_required = Confirm.ask("Require documentation for all commits?", default=True)
        doc_threshold = 80.0
        if doc_required:
            doc_threshold = IntPrompt.ask(
                "Documentation completion threshold (%)",
                default=80,
                show_default=True
            )
        
        pre_commit_hooks = Confirm.ask("Install pre-commit hooks for enforcement?", default=True)
        
        # Monitoring settings
        self.console.print(f"\n[bold]📊 Monitoring Settings[/bold]")
        
        enable_dashboard = Confirm.ask("Enable real-time monitoring dashboard?", default=True)
        dashboard_port = 8080
        if enable_dashboard:
            dashboard_port = IntPrompt.ask("Dashboard port", default=8080)
        
        enable_metrics = Confirm.ask("Enable Prometheus metrics collection?", default=True)
        metrics_port = 9090
        if enable_metrics:
            metrics_port = IntPrompt.ask("Prometheus metrics port", default=9090)
        
        self.project_config = {
            'name': project_name,
            'description': description,
            'use_git': use_git,
            'main_branch': main_branch,
            'documentation_required': doc_required,
            'documentation_threshold': doc_threshold,
            'pre_commit_hooks': pre_commit_hooks,
            'enable_dashboard': enable_dashboard,
            'dashboard_port': dashboard_port,
            'enable_metrics': enable_metrics,
            'metrics_port': metrics_port
        }
    
    def configure_agents(self):
        """Configure agents interactively"""
        self.console.print("\n" + "="*60)
        self.console.print("[bold cyan]🤖 Agent Configuration[/bold cyan]")
        self.console.print("="*60)
        
        self.console.print(
            "Configure the agents that will work on this project.\n"
            "Each agent represents a specialized developer or role.\n"
        )
        
        # Predefined agent templates
        templates = {
            "1": {"name": "Core Developer", "specialization": "Core infrastructure and architecture", "skills": ["python", "architecture", "apis"]},
            "2": {"name": "Frontend Developer", "specialization": "User interface and experience", "skills": ["javascript", "react", "css", "ui-ux"]},
            "3": {"name": "Backend Developer", "specialization": "Server-side logic and databases", "skills": ["python", "databases", "apis", "microservices"]},
            "4": {"name": "Data Engineer", "specialization": "Data processing and analytics", "skills": ["python", "sql", "etl", "data-analysis"]},
            "5": {"name": "QA Engineer", "specialization": "Testing and quality assurance", "skills": ["testing", "automation", "quality-assurance"]},
            "6": {"name": "DevOps Engineer", "specialization": "Deployment and infrastructure", "skills": ["docker", "kubernetes", "ci-cd", "monitoring"]},
            "7": {"name": "Security Specialist", "specialization": "Security and compliance", "skills": ["security", "compliance", "penetration-testing"]},
            "8": {"name": "Performance Engineer", "specialization": "Performance optimization", "skills": ["performance", "profiling", "optimization"]},
            "custom": {"name": "", "specialization": "", "skills": []}
        }
        
        self.console.print("[bold]Available agent templates:[/bold]")
        for key, template in templates.items():
            if key != "custom":
                self.console.print(f"  {key}. {template['name']} - {template['specialization']}")
        self.console.print("  custom. Create custom agent")
        
        while True:
            self.console.print(f"\n[dim]Current agents: {len(self.agents)}[/dim]")
            
            if self.agents:
                table = Table(show_header=True, header_style="bold magenta")
                table.add_column("Name", style="cyan")
                table.add_column("Specialization", style="yellow")
                table.add_column("Skills", style="green")
                
                for agent in self.agents:
                    table.add_row(
                        agent['name'],
                        agent['specialization'],
                        ", ".join(agent['skills'][:3]) + ("..." if len(agent['skills']) > 3 else "")
                    )
                
                self.console.print(table)
            
            action = Prompt.ask(
                "\nChoose action",
                choices=["add", "remove", "done"],
                default="add" if not self.agents else "done"
            )
            
            if action == "add":
                choice = Prompt.ask(
                    "Select agent template",
                    choices=list(templates.keys()),
                    default="1"
                )
                
                if choice == "custom":
                    name = Prompt.ask("Agent name")
                    specialization = Prompt.ask("Specialization")
                    skills_str = Prompt.ask("Skills (comma-separated)", default="")
                    skills = [s.strip() for s in skills_str.split(",") if s.strip()]
                else:
                    template = templates[choice]
                    name = template['name']
                    specialization = template['specialization']
                    skills = template['skills']
                    
                    # Allow customization
                    if Confirm.ask("Customize this agent?", default=False):
                        name = Prompt.ask("Agent name", default=name)
                        specialization = Prompt.ask("Specialization", default=specialization)
                        skills_str = Prompt.ask("Skills (comma-separated)", default=", ".join(skills))
                        skills = [s.strip() for s in skills_str.split(",") if s.strip()]
                
                # Capacity configuration
                capacity = IntPrompt.ask("Weekly capacity (hours)", default=40)
                
                agent = {
                    'name': name,
                    'specialization': specialization,
                    'skills': skills,
                    'capacity': capacity
                }
                
                self.agents.append(agent)
                self.console.print(f"[green]✅ Added agent: {name}[/green]")
            
            elif action == "remove":
                if not self.agents:
                    self.console.print("[yellow]No agents to remove[/yellow]")
                    continue
                
                names = [agent['name'] for agent in self.agents]
                to_remove = Prompt.ask(
                    "Agent to remove",
                    choices=names
                )
                
                self.agents = [a for a in self.agents if a['name'] != to_remove]
                self.console.print(f"[green]✅ Removed agent: {to_remove}[/green]")
            
            elif action == "done":
                if not self.agents:
                    if not Confirm.ask("No agents configured. Continue anyway?", default=False):
                        continue
                break
    
    def show_configuration_summary(self):
        """Show final configuration summary"""
        self.console.print("\n" + "="*60)
        self.console.print("[bold cyan]📋 Configuration Summary[/bold cyan]")
        self.console.print("="*60)
        
        # Project info
        self.console.print(f"[bold]Project:[/bold] {self.project_config['name']}")
        self.console.print(f"[bold]Description:[/bold] {self.project_config['description']}")
        
        if self.project_config['use_git']:
            self.console.print(f"[bold]Git:[/bold] Enabled (main branch: {self.project_config['main_branch']})")
        
        # Compliance
        if self.project_config['documentation_required']:
            self.console.print(f"[bold]Documentation:[/bold] Required ({self.project_config['documentation_threshold']}% threshold)")
        
        if self.project_config['pre_commit_hooks']:
            self.console.print(f"[bold]Pre-commit hooks:[/bold] Enabled")
        
        # Monitoring
        if self.project_config['enable_dashboard']:
            self.console.print(f"[bold]Dashboard:[/bold] http://localhost:{self.project_config['dashboard_port']}")
        
        if self.project_config['enable_metrics']:
            self.console.print(f"[bold]Metrics:[/bold] http://localhost:{self.project_config['metrics_port']}")
        
        # Agents
        self.console.print(f"\n[bold]Agents ({len(self.agents)}):[/bold]")
        for agent in self.agents:
            self.console.print(f"  • {agent['name']} ({agent['specialization']})")
        
        if not Confirm.ask("\nProceed with this configuration?", default=True):
            return False
        
        return True
    
    def create_directory_structure(self):
        """Create project directory structure"""
        directories = [
            "agents",
            "config", 
            "scripts/setup",
            "scripts/git",
            "scripts/coordination",
            "scripts/monitoring",
            "scripts/maintenance",
            "scripts/core",
            "docs",
            "tests",
            "monitoring",
            "logs",
            ".github/workflows"
        ]
        
        self.console.print("\n[bold]Creating directory structure...[/bold]")
        
        for directory in directories:
            path = Path(directory)
            path.mkdir(parents=True, exist_ok=True)
            self.console.print(f"  Created: {directory}")
    
    def create_core_scripts(self):
        """Create core framework scripts"""
        self.console.print("\n[bold]Creating core framework...[/bold]")
        
        # Core base classes
        base_script = '''#!/usr/bin/env python3
"""
Core framework for multi-agent utility scripts
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

def common_options(f):
    """Common CLI options decorator"""
    f = click.option('--verbose', '-v', is_flag=True, help='Enable verbose output')(f)
    f = click.option('--dry-run', is_flag=True, help='Show what would be done without executing')(f)
    f = click.option('--config', type=click.Path(exists=True), help='Configuration file path')(f)
    f = click.option('--log-level', default='INFO', type=click.Choice(['DEBUG', 'INFO', 'WARNING', 'ERROR']))(f)
    return f
'''
        
        Path('scripts/core/base.py').write_text(base_script)
        Path('scripts/core/__init__.py').write_text('')
        
        self.scripts_created.append('scripts/core/base.py')
        self.console.print("  ✅ Core framework created")
    
    def create_configuration_files(self):
        """Create configuration files"""
        self.console.print("\n[bold]Creating configuration files...[/bold]")
        
        # Project configuration
        project_config = {
            'project': {
                'name': self.project_config['name'],
                'version': '1.0.0',
                'description': self.project_config['description'],
                'main_branch': self.project_config['main_branch'],
                'documentation_required': self.project_config['documentation_required'],
                'documentation_threshold': self.project_config['documentation_threshold'],
                'pre_commit_hooks': self.project_config['pre_commit_hooks']
            }
        }
        
        with open('config/project.yaml', 'w') as f:
            yaml.dump(project_config, f, default_flow_style=False)
        
        # Agents configuration
        agents_config = {
            'agents': [
                {
                    'name': agent['name'],
                    'id': f"agent_{i+1}",
                    'specialization': agent['specialization'],
                    'workspace': f"agents/{agent['name'].lower().replace(' ', '_')}",
                    'branch': f"agent_{agent['name'].lower().replace(' ', '_')}",
                    'max_capacity': agent['capacity'],
                    'skills': agent['skills'],
                    'availability': True,
                    'compliance_required': True
                }
                for i, agent in enumerate(self.agents)
            ]
        }
        
        with open('config/agents.yaml', 'w') as f:
            yaml.dump(agents_config, f, default_flow_style=False)
        
        # Monitoring configuration
        monitoring_config = {
            'monitoring': {
                'dashboard': {
                    'enabled': self.project_config['enable_dashboard'],
                    'port': self.project_config['dashboard_port'],
                    'refresh_interval': 30
                },
                'metrics': {
                    'enabled': self.project_config['enable_metrics'],
                    'prometheus_port': self.project_config['metrics_port'],
                    'collection_interval': 10
                },
                'compliance': {
                    'check_interval': 30,
                    'documentation_threshold': self.project_config['documentation_threshold']
                },
                'alerts': {
                    'enabled': True,
                    'email_notifications': False,
                    'slack_webhook': None
                }
            }
        }
        
        with open('config/monitoring.yaml', 'w') as f:
            yaml.dump(monitoring_config, f, default_flow_style=False)
        
        # Requirements file
        requirements = [
            'click>=8.0.0',
            'rich>=10.0.0', 
            'pydantic>=1.8.0',
            'gitpython>=3.1.0',
            'prometheus_client>=0.11.0',
            'psutil>=5.8.0',
            'pyyaml>=5.4.0',
            'requests>=2.25.0',
            'aiohttp>=3.7.0'
        ]
        
        Path('requirements.txt').write_text('\n'.join(requirements))
        
        # .gitignore
        gitignore_content = '''# Python
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
coordination/tasks.json
'''
        
        Path('.gitignore').write_text(gitignore_content)
        
        self.console.print("  ✅ Configuration files created")
    
    def create_agent_workspaces(self):
        """Create agent workspace directories and files"""
        if not self.agents:
            return
        
        self.console.print("\n[bold]Creating agent workspaces...[/bold]")
        
        for agent in self.agents:
            workspace_name = agent['name'].lower().replace(' ', '_')
            workspace_path = Path(f'agents/{workspace_name}')
            workspace_path.mkdir(parents=True, exist_ok=True)
            
            # Create PATH document
            path_content = f'''# Agent {agent['name']} - Progress and Task Tracking

## Agent Information
- **Name**: {agent['name']}
- **Specialization**: {agent['specialization']}
- **Skills**: {', '.join(agent['skills'])}
- **Weekly Capacity**: {agent['capacity']} hours
- **Workspace**: agents/{workspace_name}
- **Branch**: agent_{workspace_name}
- **Created**: {datetime.now().strftime('%Y-%m-%d')}

## Task Checklist

### Setup Tasks
- [ ] Review agent configuration and project requirements
- [ ] Set up development environment
- [ ] Understand project architecture and interfaces
- [ ] Review coding standards and best practices

### Implementation Tasks
- [ ] [Add specific implementation tasks here]
- [ ] [Update this list as work progresses]

### Documentation Tasks
- [ ] Document implemented features and APIs
- [ ] Update technical documentation
- [ ] Create usage examples and guides
- [ ] Update this PATH document regularly

### Testing Tasks
- [ ] Write unit tests for implemented features
- [ ] Create integration tests
- [ ] Perform manual testing and validation
- [ ] Review test coverage and quality

## Progress Tracking

### Completed Work
[Document major achievements and completed milestones]

### Current Focus  
[Describe current work in progress and priorities]

### Blockers and Issues
[List any blockers, dependencies, or issues encountered]

### Next Steps
[Outline planned next steps and upcoming work]

## Documentation Compliance
**Last Updated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Completion Status**: 0%
**Documentation Score**: 0/10

## Notes and Comments
[Add any additional notes, observations, or comments]
'''
            
            (workspace_path / 'PATH.md').write_text(path_content)
            
            # Create README
            readme_content = f'''# Agent {agent['name']} Workspace

This is the dedicated workspace for **{agent['name']}**, specializing in {agent['specialization'].lower()}.

## Agent Profile
- **Specialization**: {agent['specialization']}
- **Skills**: {', '.join(agent['skills'])}
- **Capacity**: {agent['capacity']} hours/week

## Important Files
- `PATH.md` - Progress and task tracking document (MUST be updated regularly)
- `docs/` - Agent-specific documentation
- `tests/` - Agent-specific tests and validation
- `README.md` - This file

## Getting Started
1. Review the PATH.md document for current tasks and progress
2. Check the project configuration in `config/` directory
3. Set up your development environment
4. Begin work on assigned tasks
5. **Update PATH.md regularly** - this is critical for compliance

## Compliance Requirements
- Documentation completion threshold: {self.project_config['documentation_threshold']}%
- Regular PATH document updates are mandatory
- Pre-commit hooks will enforce documentation requirements

## Resources
- Project documentation: `docs/`
- Configuration files: `config/`
- Other agent workspaces: `agents/`
- Monitoring dashboard: http://localhost:{self.project_config['dashboard_port']}
'''
            
            (workspace_path / 'README.md').write_text(readme_content)
            
            # Create subdirectories
            (workspace_path / 'docs').mkdir(exist_ok=True)
            (workspace_path / 'tests').mkdir(exist_ok=True)
            
            self.console.print(f"  ✅ Created workspace for {agent['name']}")
    
    def setup_git_repository(self):
        """Set up Git repository with pre-commit hooks"""
        if not self.project_config['use_git']:
            return
        
        self.console.print("\n[bold]Setting up Git repository...[/bold]")
        
        try:
            # Initialize repository if needed
            if not Path('.git').exists():
                subprocess.run(['git', 'init'], check=True)
                self.console.print("  ✅ Git repository initialized")
            
            # Set main branch
            subprocess.run(['git', 'branch', '-M', self.project_config['main_branch']], 
                         check=True, capture_output=True)
            
            # Create pre-commit hook if enabled
            if self.project_config['pre_commit_hooks']:
                hook_script = '''#!/bin/bash
# Pre-commit hook for documentation compliance

echo "🔍 Checking documentation compliance..."

# Check if we're on an agent branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ $BRANCH == agent_* ]]; then
    # Check if PATH.md exists and was updated recently
    if [ ! -f "PATH.md" ]; then
        echo "❌ PATH.md document missing. Please create and update your progress document."
        exit 1
    fi
    
    # Check if PATH.md was modified in recent commits
    COMMITS_SINCE_PATH_UPDATE=$(git log --oneline --since="3 days ago" --grep="PATH\\|path\\|documentation\\|docs" | wc -l)
    TOTAL_RECENT_COMMITS=$(git log --oneline --since="3 days ago" | wc -l)
    
    if [ $TOTAL_RECENT_COMMITS -gt 3 ] && [ $COMMITS_SINCE_PATH_UPDATE -eq 0 ]; then
        echo "⚠️  Warning: PATH.md may need updating. You have $TOTAL_RECENT_COMMITS recent commits but no documentation updates."
        echo "Please update your PATH.md document to reflect recent progress."
        
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

echo "✅ Pre-commit checks completed"
exit 0
'''
                
                hook_path = Path('.git/hooks/pre-commit')
                hook_path.parent.mkdir(exist_ok=True)
                hook_path.write_text(hook_script)
                hook_path.chmod(0o755)
                
                self.console.print("  ✅ Pre-commit hooks installed")
            
            # Add initial files
            subprocess.run(['git', 'add', '.'], check=True)
            subprocess.run(['git', 'commit', '-m', 'Initial multi-agent system setup'], 
                         check=True, capture_output=True)
            
            self.console.print("  ✅ Initial commit created")
            
        except subprocess.CalledProcessError as e:
            self.console.print(f"  ⚠️  Git setup warning: {e}")
    
    def create_management_scripts(self):
        """Create essential management scripts"""
        self.console.print("\n[bold]Creating management scripts...[/bold]")
        
        # Quick status script
        status_script = f'''#!/usr/bin/env python3
"""
Quick status check for multi-agent system
"""

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent / 'scripts'))

import yaml
from rich.console import Console
from rich.table import Table

console = Console()

def main():
    console.print("[bold cyan]Multi-Agent System Status[/bold cyan]\\n")
    
    # Load configuration
    try:
        with open('config/agents.yaml') as f:
            agents_config = yaml.safe_load(f)
        
        with open('config/project.yaml') as f:
            project_config = yaml.safe_load(f)
    except Exception as e:
        console.print(f"[red]Error loading configuration: {{e}}[/red]")
        return 1
    
    # Show project info
    project = project_config['project']
    console.print(f"[bold]Project:[/bold] {{project['name']}}")
    console.print(f"[bold]Description:[/bold] {{project['description']}}")
    
    # Show agents
    agents = agents_config.get('agents', [])
    if agents:
        table = Table(title="Configured Agents")
        table.add_column("Name", style="cyan")
        table.add_column("Specialization", style="yellow")
        table.add_column("Workspace", style="green")
        table.add_column("Status", style="magenta")
        
        for agent in agents:
            workspace_path = Path(agent['workspace'])
            path_file = workspace_path / 'PATH.md'
            
            if workspace_path.exists():
                if path_file.exists():
                    status = "✅ Ready"
                else:
                    status = "⚠️  No PATH.md"
            else:
                status = "❌ Missing"
            
            table.add_row(
                agent['name'],
                agent['specialization'],
                agent['workspace'],
                status
            )
        
        console.print(table)
    else:
        console.print("[yellow]No agents configured[/yellow]")
    
    # Show next steps
    console.print("\\n[bold]Next Steps:[/bold]")
    console.print("1. Install dependencies: pip install -r requirements.txt")
    console.print("2. Create agent worktrees (if using Git)")
    console.print("3. Start monitoring dashboard")
    console.print("4. Begin agent work and track progress in PATH.md files")
    
    if project_config['project'].get('enable_dashboard'):
        port = project_config.get('monitoring', {{}}).get('dashboard', {{}}).get('port', 8080)
        console.print(f"\\n[bold]Monitoring Dashboard:[/bold] http://localhost:{{port}}")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
'''
        
        Path('status.py').write_text(status_script)
        Path('status.py').chmod(0o755)
        
        # Management script
        manage_script = '''#!/usr/bin/env python3
"""
Management script for multi-agent system
"""

import click
from pathlib import Path

@click.group()
def cli():
    """Multi-Agent System Management"""
    pass

@cli.command()
def status():
    """Show system status"""
    import subprocess
    subprocess.run([sys.executable, 'status.py'])

@cli.command()
def install():
    """Install dependencies"""
    import subprocess
    subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])

@cli.command()
@click.argument('agent_name')
def create_worktree(agent_name):
    """Create Git worktree for agent"""
    # This would call the git management scripts
    click.echo(f"Creating worktree for {agent_name}")
    click.echo("Note: Full worktree management requires the complete script suite")

if __name__ == '__main__':
    cli()
'''
        
        Path('manage.py').write_text(manage_script)
        Path('manage.py').chmod(0o755)
        
        self.console.print("  ✅ Management scripts created")
    
    def create_documentation(self):
        """Create project documentation"""
        self.console.print("\n[bold]Creating documentation...[/bold]")
        
        # Main README
        readme_content = f'''# {self.project_config['name']}

{self.project_config['description']}

## Multi-Agent Development System

This project uses a sophisticated multi-agent development system with automated compliance monitoring, task coordination, and real-time progress tracking.

## System Overview

- **Agents**: {len(self.agents)} specialized development agents
- **Compliance**: {"Automated documentation enforcement" if self.project_config['documentation_required'] else "Documentation encouraged"}
- **Monitoring**: {"Real-time dashboard available" if self.project_config['enable_dashboard'] else "Basic monitoring"}
- **Git Integration**: {"Advanced worktree management" if self.project_config['use_git'] else "Standard Git workflow"}

## Quick Start

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Check system status**:
   ```bash
   python status.py
   ```

3. **Review agent workspaces**:
   ```bash
   ls agents/
   ```

4. **Start monitoring** (if enabled):
   ```bash
   # Dashboard will be available at http://localhost:{self.project_config.get('dashboard_port', 8080)}
   ```

## Agent Workspaces

Each agent has a dedicated workspace in the `agents/` directory:

'''
        
        for agent in self.agents:
            workspace_name = agent['name'].lower().replace(' ', '_')
            readme_content += f'''
### {agent['name']}
- **Specialization**: {agent['specialization']}
- **Workspace**: `agents/{workspace_name}/`
- **Key File**: `agents/{workspace_name}/PATH.md` (progress tracking)
'''
        
        readme_content += f'''

## Configuration

- **Project Config**: `config/project.yaml`
- **Agent Config**: `config/agents.yaml`
- **Monitoring Config**: `config/monitoring.yaml`

## Documentation Requirements

{"This project enforces documentation compliance:" if self.project_config['documentation_required'] else "Documentation guidelines:"}

- All agents must maintain their `PATH.md` progress documents
- Documentation threshold: {self.project_config['documentation_threshold']}%
- {"Pre-commit hooks enforce compliance" if self.project_config['pre_commit_hooks'] else "Regular documentation updates expected"}

## Monitoring and Metrics

'''
        
        if self.project_config['enable_dashboard']:
            readme_content += f"- **Dashboard**: http://localhost:{self.project_config['dashboard_port']}\n"
        
        if self.project_config['enable_metrics']:
            readme_content += f"- **Metrics**: http://localhost:{self.project_config['metrics_port']}/metrics\n"
        
        readme_content += '''
## Directory Structure

```
├── agents/                 # Agent workspaces
├── config/                 # Configuration files
├── scripts/               # Utility scripts
│   ├── core/             # Core framework
│   ├── setup/            # Setup and initialization
│   ├── git/              # Git management
│   ├── coordination/     # Task coordination
│   ├── monitoring/       # Compliance monitoring
│   └── maintenance/      # Maintenance utilities
├── docs/                  # Project documentation
├── tests/                 # Test files
├── monitoring/            # Monitoring data
└── logs/                  # Log files
```

## Getting Help

- Check `status.py` for system status
- Review agent `PATH.md` files for progress
- Check configuration files in `config/`
- See individual agent workspace README files

## Generated Configuration

This project was set up with the interactive setup wizard on ''' + datetime.now().strftime('%Y-%m-%d at %H:%M:%S') + '''.

To recreate or modify this setup, run the interactive setup wizard again.
'''
        
        Path('README.md').write_text(readme_content)
        
        # Setup guide
        setup_guide = '''# Setup Guide

## Prerequisites

- Python 3.8+
- Git (if using version control)
- Required Python packages (see requirements.txt)

## Installation Steps

1. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Verify installation**:
   ```bash
   python status.py
   ```

3. **Configure agents** (if needed):
   - Edit `config/agents.yaml` to modify agent settings
   - Update agent workspaces in `agents/` directory

4. **Start development**:
   - Each agent should work in their designated workspace
   - Regularly update `PATH.md` progress documents
   - Follow compliance guidelines

## Advanced Setup

For full multi-agent system capabilities, consider implementing the complete utility script suite from the comprehensive documentation.

This includes:
- Advanced Git worktree management
- Real-time compliance monitoring
- Automated task assignment
- Performance optimization tools
- Advanced merge strategies

## Troubleshooting

- **Missing dependencies**: Run `pip install -r requirements.txt`
- **Git issues**: Ensure Git is installed and configured
- **Permission errors**: Check file and directory permissions
- **Configuration errors**: Validate YAML syntax in config files
'''
        
        Path('docs/SETUP.md').write_text(setup_guide)
        
        self.console.print("  ✅ Documentation created")
    
    def run_setup(self) -> bool:
        """Run the complete setup process"""
        try:
            # Welcome and prerequisites
            self.welcome()
            
            if not self.check_prerequisites():
                return False
            
            # Gather configuration
            self.gather_project_info()
            self.configure_agents()
            
            # Show summary and confirm
            if not self.show_configuration_summary():
                self.console.print("\n[yellow]Setup cancelled by user[/yellow]")
                return False
            
            # Create project structure
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                console=self.console
            ) as progress:
                
                tasks = [
                    ("Creating directories", self.create_directory_structure),
                    ("Creating core scripts", self.create_core_scripts),
                    ("Creating configuration", self.create_configuration_files),
                    ("Setting up agent workspaces", self.create_agent_workspaces),
                    ("Setting up Git", self.setup_git_repository),
                    ("Creating management scripts", self.create_management_scripts),
                    ("Creating documentation", self.create_documentation),
                ]
                
                for task_name, task_func in tasks:
                    task = progress.add_task(task_name, total=None)
                    try:
                        task_func()
                        progress.update(task, description=f"✅ {task_name}")
                    except Exception as e:
                        progress.update(task, description=f"❌ {task_name}")
                        self.errors.append(f"{task_name}: {e}")
                        self.console.print(f"[red]Error in {task_name}: {e}[/red]")
            
            return True
            
        except KeyboardInterrupt:
            self.console.print("\n[yellow]Setup interrupted by user[/yellow]")
            return False
        except Exception as e:
            self.console.print(f"\n[red]Setup failed: {e}[/red]")
            return False
    
    def show_completion_summary(self):
        """Show setup completion summary"""
        self.console.print("\n" + "="*60)
        self.console.print("[bold green]🎉 Setup Complete![/bold green]")
        self.console.print("="*60)
        
        if self.errors:
            self.console.print(f"\n[yellow]⚠️  Setup completed with {len(self.errors)} warnings:[/yellow]")
            for error in self.errors:
                self.console.print(f"  • {error}")
        
        self.console.print(f"\n[bold]Project '{self.project_config['name']}' is ready![/bold]")
        
        # Show what was created
        self.console.print(f"\n[bold]What was created:[/bold]")
        self.console.print(f"  • Project structure with {len(self.agents)} agent workspaces")
        self.console.print(f"  • Configuration files in config/")
        self.console.print(f"  • Core framework and base scripts")
        
        if self.project_config['use_git']:
            self.console.print(f"  • Git repository with main branch '{self.project_config['main_branch']}'")
            if self.project_config['pre_commit_hooks']:
                self.console.print(f"  • Pre-commit hooks for compliance enforcement")
        
        # Next steps
        self.console.print(f"\n[bold cyan]Next Steps:[/bold cyan]")
        self.console.print(f"1. Install dependencies:")
        self.console.print(f"   [dim]pip install -r requirements.txt[/dim]")
        
        self.console.print(f"2. Check system status:")
        self.console.print(f"   [dim]python status.py[/dim]")
        
        if self.agents:
            self.console.print(f"3. Review agent workspaces:")
            for agent in self.agents[:3]:  # Show first 3
                workspace = agent['name'].lower().replace(' ', '_')
                self.console.print(f"   [dim]• agents/{workspace}/PATH.md[/dim]")
            if len(self.agents) > 3:
                self.console.print(f"   [dim]• ... and {len(self.agents) - 3} more[/dim]")
        
        if self.project_config.get('enable_dashboard'):
            self.console.print(f"4. Start monitoring dashboard:")
            self.console.print(f"   [dim]# Will be available at http://localhost:{self.project_config['dashboard_port']}[/dim]")
        
        self.console.print(f"\n[bold]Important Files:[/bold]")
        self.console.print(f"  • README.md - Project overview and instructions")
        self.console.print(f"  • config/ - All configuration files")
        self.console.print(f"  • agents/ - Agent workspaces and PATH documents")
        self.console.print(f"  • status.py - Quick system status check")
        
        self.console.print(f"\n[bold green]Happy coding with your multi-agent system! 🚀[/bold green]")


def main():
    """Main entry point"""
    setup = InteractiveSetup()
    
    if setup.run_setup():
        setup.show_completion_summary()
        return 0
    else:
        return 1


if __name__ == '__main__':
    sys.exit(main())