# Multi-Agent System Quick Start

## 🚀 One-Command Setup

Run the interactive setup wizard to get your multi-agent development system configured in minutes:

```bash
python setup_interactive.py
```

This will guide you through:
- ✅ System prerequisites checking
- 🏗️ Project configuration
- 🤖 Agent setup and specializations
- 📊 Monitoring and compliance settings
- 📁 Complete directory structure creation
- ⚙️ Git repository initialization
- 📋 Documentation generation

## What You Get

### 🎯 Complete Multi-Agent Infrastructure
- **Agent Workspaces**: Dedicated spaces for each specialized agent
- **Progress Tracking**: PATH documents for compliance monitoring
- **Task Coordination**: Built-in task assignment and management
- **Real-time Monitoring**: Live dashboard for progress tracking
- **Git Integration**: Advanced worktree management for parallel development

### 🛡️ Automated Compliance
- **Pre-commit Hooks**: Automatic documentation enforcement
- **Progress Validation**: Real-time compliance checking
- **Documentation Scoring**: Automated progress calculation
- **Risk Assessment**: Early warning for non-compliant agents

### 📊 Professional Monitoring
- **Live Dashboard**: Real-time agent status and progress
- **Metrics Collection**: Prometheus integration for analytics
- **Alert System**: Notifications for compliance issues
- **Reporting**: Automated weekly compliance reports

## Prerequisites

The setup wizard will check these automatically:

- **Python 3.8+** - Core runtime environment
- **Git** - Version control and worktree management
- **Write Permissions** - Directory creation and file operations

Required packages will be installed automatically:
```
click>=8.0.0          # CLI framework
rich>=10.0.0          # Beautiful terminal UI
pydantic>=1.8.0       # Data validation
gitpython>=3.1.0      # Git integration
prometheus_client>=0.11.0  # Metrics collection
psutil>=5.8.0         # System monitoring
pyyaml>=5.4.0         # Configuration management
```

## Interactive Setup Process

### 1. Prerequisites Check
```
🔍 Checking prerequisites...
✅ Python 3.8+
✅ Git installation  
✅ Required packages
✅ Directory permissions
```

### 2. Project Configuration
```bash
📋 Project Configuration
═══════════════════════════════════════
Project name: my-awesome-project
Project description: Multi-agent development project
Initialize Git repository? [Y/n]: Y
Main branch name [main]: main

🛡️ Compliance Settings
Require documentation for all commits? [Y/n]: Y
Documentation completion threshold (%) [80]: 80
Install pre-commit hooks for enforcement? [Y/n]: Y

📊 Monitoring Settings  
Enable real-time monitoring dashboard? [Y/n]: Y
Dashboard port [8080]: 8080
Enable Prometheus metrics collection? [Y/n]: Y
Prometheus metrics port [9090]: 9090
```

### 3. Agent Configuration
```bash
🤖 Agent Configuration
═══════════════════════════════════════
Available agent templates:
  1. Core Developer - Core infrastructure and architecture
  2. Frontend Developer - User interface and experience  
  3. Backend Developer - Server-side logic and databases
  4. Data Engineer - Data processing and analytics
  5. QA Engineer - Testing and quality assurance
  6. DevOps Engineer - Deployment and infrastructure
  7. Security Specialist - Security and compliance
  8. Performance Engineer - Performance optimization
  custom. Create custom agent

Select agent template [1]: 1
Customize this agent? [y/N]: N
Weekly capacity (hours) [40]: 40
✅ Added agent: Core Developer

Choose action [add/remove/done]: done
```

### 4. Configuration Summary
```bash
📋 Configuration Summary
═══════════════════════════════════════
Project: my-awesome-project
Description: Multi-agent development project
Git: Enabled (main branch: main)
Documentation: Required (80% threshold)
Pre-commit hooks: Enabled
Dashboard: http://localhost:8080
Metrics: http://localhost:9090

Agents (3):
  • Core Developer (Core infrastructure and architecture)
  • QA Engineer (Testing and quality assurance)  
  • DevOps Engineer (Deployment and infrastructure)

Proceed with this configuration? [Y/n]: Y
```

### 5. Automated Setup
```bash
🏗️ Creating directories...
✅ Created: agents
✅ Created: config
✅ Created: scripts/core
✅ Created: monitoring

⚙️ Creating core framework...
✅ Core framework created

📋 Creating configuration files...
✅ Configuration files created

🤖 Creating agent workspaces...
✅ Created workspace for Core Developer
✅ Created workspace for QA Engineer
✅ Created workspace for DevOps Engineer

🔧 Setting up Git repository...
✅ Git repository initialized
✅ Pre-commit hooks installed
✅ Initial commit created

📝 Creating management scripts...
✅ Management scripts created

📚 Creating documentation...
✅ Documentation created
```

## Post-Setup Actions

After setup completes, you'll have a fully configured multi-agent system:

### 1. Verify Installation
```bash
python status.py
```

### 2. Install Dependencies  
```bash
pip install -r requirements.txt
```

### 3. Explore Agent Workspaces
```bash
ls agents/
cat agents/core_developer/PATH.md
```

### 4. Start Development
Each agent should:
- Work in their dedicated `agents/{name}/` workspace
- Regularly update their `PATH.md` progress document
- Follow the compliance requirements
- Coordinate through the task management system

## Generated Project Structure

```
my-awesome-project/
├── agents/                    # Agent workspaces
│   ├── core_developer/
│   │   ├── PATH.md           # Progress tracking (CRITICAL)
│   │   ├── README.md         # Agent-specific guide
│   │   ├── docs/             # Agent documentation
│   │   └── tests/            # Agent tests
│   ├── qa_engineer/
│   └── devops_engineer/
├── config/                    # Configuration files
│   ├── project.yaml          # Project settings
│   ├── agents.yaml           # Agent definitions
│   └── monitoring.yaml       # Monitoring config
├── scripts/                   # Utility scripts
│   └── core/                 # Core framework
├── docs/                     # Project documentation
├── monitoring/               # Monitoring data
├── logs/                     # Log files
├── .github/workflows/        # CI/CD pipelines
├── README.md                 # Project overview
├── requirements.txt          # Python dependencies
├── status.py                 # Quick status check
├── manage.py                 # Management commands
└── .gitignore               # Git ignore rules
```

## Key Features Created

### 🤖 Agent Workspaces
Each agent gets:
- Dedicated workspace directory
- `PATH.md` progress tracking document (mandatory)
- Agent-specific README and documentation
- Individual test directories
- Customized configuration

### 🛡️ Compliance System
- **Pre-commit hooks** prevent commits without documentation updates
- **Progress scoring** automatically calculated from PATH documents
- **Compliance thresholds** configurable per project
- **Real-time monitoring** of all agent progress

### 📊 Monitoring Infrastructure
- **Status dashboard** at http://localhost:8080
- **Metrics collection** via Prometheus
- **Alert system** for compliance violations
- **Progress visualization** with rich terminal UI

### ⚙️ Management Tools
- `status.py` - Quick system status overview
- `manage.py` - Administrative commands
- Configuration files for all settings
- Comprehensive documentation

## Next Steps

1. **Review the generated README.md** for project-specific instructions
2. **Check agent workspaces** and PATH documents
3. **Install dependencies** with `pip install -r requirements.txt`
4. **Start development** with proper documentation practices
5. **Monitor progress** using the built-in tools

## Full System Implementation

This quick setup creates the foundation. For the complete multi-agent system with advanced features, implement the full utility script suite from `COMPREHENSIVE_UTILITY_SCRIPTS.md`:

- Advanced Git worktree management
- Sophisticated task assignment algorithms  
- Real-time compliance dashboards
- Automated merge strategy optimization
- Performance monitoring and analytics
- Advanced CI/CD pipeline integration

## Support

- Check `status.py` for system health
- Review configuration files in `config/`
- Examine agent PATH documents for progress
- See `docs/SETUP.md` for detailed setup information

The interactive setup provides everything needed to start with professional multi-agent development practices immediately!