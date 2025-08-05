# Documentation Reorganization Plan

## Phase 1: Audit and Cleanup (Immediate Priority)
1. **Identify authoritative versions** of each duplicated document by comparing modification dates and content
2. **Archive obsolete versions** to a temporary `/docs/archive/` directory for safety
3. **Remove temporary analysis files** from root (multiAgentAnalysis*, PR_ANALYSIS_*, etc.) to `/docs/working/` or delete if no longer needed
4. **Consolidate overlapping content** (multiple roadmaps, architecture docs, etc.)

## Phase 2: Restructure Documentation Hierarchy
Create a clean, logical structure:

```
/
├── README.md (project overview, quick start)
├── CONTRIBUTING.md (contribution guidelines)
├── CHANGELOG.md (version history)
├── CLAUDE.md (AI assistant instructions)
└── docs/
    ├── user/
    │   ├── quick-start.md
    │   ├── features.md
    │   └── troubleshooting.md
    ├── development/
    │   ├── setup.md
    │   ├── adding-subjects.md
    │   ├── component-guide.md
    │   └── patterns/
    ├── architecture/
    │   ├── overview.md
    │   ├── decisions.md
    │   └── technical-design.md
    ├── testing/
    │   ├── strategy.md
    │   ├── coverage.md
    │   └── ci-cd.md
    ├── deployment/
    │   ├── setup.md
    │   ├── environments.md
    │   └── monitoring.md
    ├── strategy/
    │   ├── roadmap.md
    │   ├── mvp.md
    │   └── business-requirements.md
    └── archive/ (for historical versions)
```

## Phase 3: Content Consolidation and Standards
1. **Merge duplicate content** intelligently, keeping the best parts of each version
2. **Establish documentation standards** (naming conventions, templates, review process)
3. **Create a documentation index** in `/docs/README.md`
4. **Update all cross-references** to use the new structure
5. **Add `.gitignore` patterns** to prevent future duplication

## Expected Outcomes
- Reduce documentation files from ~150+ to ~30-40 well-organized files
- Eliminate confusion about which version is current
- Improve discoverability and maintenance
- Create a sustainable documentation structure for future growth

This plan prioritizes cleanup and organization without creating new documentation unnecessarily, following the project's preference for editing existing files over creating new ones.