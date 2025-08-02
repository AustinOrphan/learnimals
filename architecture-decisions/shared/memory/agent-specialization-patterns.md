# Agent Specialization Patterns

## Overview
Patterns for creating specialized agents with deep domain expertise while maintaining system coordination.

## Specialization Strategy

### Domain-Subdomain Structure
Each agent follows this pattern:
```
Agent Name
├── Primary Domain (broad area of expertise)
├── Subdomains (6+ specific areas)
│   ├── Primary Subdomain (marked as specialty)
│   ├── Secondary Subdomains (supporting areas)
│   └── Cross-cutting Concerns
└── Authority Levels (4-dimensional ranking)
```

### Example: Performance Optimizer (A05)
```
Domain: Performance, Bundle Analysis, Core Web Vitals, Optimization
Subdomains:
├── Bundle Size Analysis & Optimization (Primary)
├── Core Web Vitals Monitoring
├── JavaScript Performance Profiling
├── Image & Asset Optimization
├── Lazy Loading & Code Splitting
└── Performance Budget Management

Authority:
├── Importance: 9/10 (Critical - user experience & SEO impact)
├── Domain Authority: 9/10 (Performance optimization expert)
├── Subdomain Authority: 10/10 (Bundle optimization leader)
└── Interdomain Authority: 7/10 (Performance impacts UX and development)
```

## Critical Agent Patterns

### Crisis Resolution Agents
Agents with 10/10 importance that can block system progress:

**File System Manager (A02)**
- **Crisis**: 100-150+ duplicate files blocking development
- **Authority**: Can freeze all development until resolved
- **Pattern**: Emergency response with system-wide impact
- **Success Criteria**: Zero duplicate files, all imports resolved

**Security Guardian (A03)**
- **Crisis**: COPPA compliance dispute (missing vs exceptional)
- **Authority**: Can block launch for legal compliance
- **Pattern**: Legal/regulatory compliance enforcement
- **Success Criteria**: Verified COPPA compliance with legal sign-off

### Quality Gate Agents
Agents that control quality standards across the system:

**Test Infrastructure Engineer (A04)**
- **Gate**: 28% test failure rate blocking quality assurance
- **Authority**: Can reject all PRs until tests pass
- **Pattern**: Quality enforcement through automated gates
- **Success Criteria**: 100% test pass rate, stable CI/CD

**QA Reviewer (A18)**
- **Gate**: Validates all agent outputs for accuracy
- **Authority**: Can reject any agent's work
- **Pattern**: Meta-quality control over other agents
- **Success Criteria**: Zero contradictory outputs between agents

## Coordination Agent Patterns

### Integration Coordinator (A17)
```
Role: Supreme system coordinator
Authority: 10/10 interdomain (highest in system)
Responsibilities:
├── Resolve conflicts between any agents
├── Orchestrate multi-agent initiatives
├── Prevent system deadlock
├── Ensure coherent decision-making
└── Report to governance council

Communication Patterns:
├── Receives status from ALL agents
├── Issues directives to resolve conflicts
├── Escalates to governance council when needed
└── Maintains system-wide visibility
```

### Domain Leadership Patterns

**Technical Leadership Cluster**
- **Leader**: System Architect (A01) - 9/10 interdomain authority
- **Members**: File System Manager, Test Engineer, Performance Optimizer, Code Quality Enforcer, Frontend Lead, Build Engineer, Technical Debt Analyst
- **Pattern**: Technical decisions flow through architecture authority

**User Experience Leadership Cluster**
- **Leader**: Educational UX Designer (A08) - 7/10 interdomain authority
- **Members**: Accessibility Champion, Mobile Specialist
- **Pattern**: UX decisions coordinate across user-facing domains

**Compliance Leadership Cluster**
- **Leader**: Legal Compliance Officer (A13) - 8/10 interdomain authority
- **Members**: Security Guardian (for COPPA)
- **Pattern**: Legal/regulatory decisions have cross-system impact

## Expertise Depth Patterns

### 10/10 Subdomain Authority (Ultimate Specialists)
These agents are the final authority in their primary subdomain:
- A01: Component Architecture
- A02: File Duplication Cleanup
- A03: COPPA Compliance
- A04: Test Infrastructure
- A05: Bundle Optimization
- A06: ESLint & TypeScript
- A07: WCAG 2.1 AA
- A08: Character-driven Learning
- A10: Component Library
- A13: COPPA Law
- A14: Curriculum Alignment
- A16: Debt Assessment
- A17: Agent Coordination

### Multi-Domain Expertise Pattern
Some agents have high authority across multiple related domains:

**Accessibility Champion (A07)**
- Primary: WCAG 2.1 AA compliance (10/10)
- Secondary: Screen reader optimization (9/10)
- Secondary: Keyboard navigation (9/10)
- Cross-cutting: All UI components must meet standards

**Security Guardian (A03)**
- Primary: COPPA compliance (10/10)
- Secondary: Web security (9/10)
- Secondary: Data privacy (9/10)
- Cross-cutting: Security affects all data handling

## Anti-Patterns to Avoid

### Overlapping Authority
❌ **Problem**: Multiple agents claiming authority over same subdomain
❌ **Example**: Both Security Guardian and Legal Officer claiming COPPA authority
✅ **Solution**: Clear primary/secondary authority designation

### Authority Without Expertise
❌ **Problem**: High authority without corresponding domain knowledge
❌ **Example**: Integration Coordinator overriding technical decisions
✅ **Solution**: Authority hierarchy respects domain expertise

### Expertise Without Authority
❌ **Problem**: Deep expertise but no decision-making power
❌ **Example**: Performance expert unable to enforce performance budgets
✅ **Solution**: Subdomain authority matches expertise level

### Communication Silos
❌ **Problem**: Agents working in isolation without coordination
❌ **Example**: Bundle size discrepancy (380KB vs 2.8MB)
✅ **Solution**: Structured communication protocols and QA review

## Implementation Guidelines

### Agent Charter Template
```markdown
# Agent [ID]: [Name]

## Authority Profile
- Importance: X/10 (justification)
- Domain Authority: X/10 (justification)
- Subdomain Authority: X/10 (justification)
- Interdomain Authority: X/10 (justification)

## Domain & Subdomains
- Primary Domain: [broad area]
- Subdomains:
  - [Primary Subdomain] (Primary)
  - [Secondary Subdomains]

## Success Criteria
- [Measurable outcomes]
- [Quality standards]
- [Performance targets]

## Communication Protocols
- Reports to: [higher authority]
- Coordinates with: [peer agents]
- Commands: [subordinate agents]
```

### Validation Checklist
- [ ] No overlapping primary subdomains
- [ ] Authority levels match expertise
- [ ] Clear escalation paths defined
- [ ] Success criteria measurable
- [ ] Communication protocols specified
- [ ] All critical domains covered
- [ ] No single points of failure

This specialization pattern ensures deep expertise while maintaining system coherence and preventing conflicts.