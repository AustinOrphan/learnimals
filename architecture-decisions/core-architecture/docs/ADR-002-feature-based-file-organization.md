# ADR-002: Feature-Based File Organization

## Status
Accepted

## Context
The Learnimals platform consists of multiple educational subjects (Math, Science, Reading, Art, Coding) and various games/activities. The codebase needs an organizational structure that:

- Scales with new subjects and features
- Maintains clear boundaries between features
- Supports code reuse and sharing
- Makes navigation intuitive for developers
- Enables future modularization or extraction

Traditional organization by file type (all controllers together, all views together) was creating coupling between unrelated features and making it difficult to understand feature boundaries.

## Decision
We will organize code using a feature-based directory structure:

```
src/
├── components/          # Shared, reusable components
│   ├── ui/             # Basic UI elements
│   ├── layout/         # Layout components
│   └── forms/          # Form components
├── features/           # Feature-specific code
│   ├── subjects/       # Subject-specific functionality
│   │   ├── math/       # Math subject files
│   │   ├── science/    # Science subject files
│   │   └── shared/     # Shared subject utilities
│   ├── games/          # Game-specific code
│   │   ├── bubble-pop/ # Bubble Pop game
│   │   └── word-scramble/ # Word Scramble game
│   └── user/           # User-related features
├── utils/              # Shared utilities
├── styles/             # Global styles organized by purpose
│   ├── base/           # Foundation styles
│   ├── components/     # Component-specific styles
│   └── themes/         # Theme definitions
└── templates/          # HTML templates
```

Each feature directory contains all related files:
- JavaScript modules
- CSS styles
- Templates (if applicable)
- Tests
- Documentation

## Consequences

### Positive
- **Feature Isolation**: Easy to understand what files belong to each feature
- **Scalability**: New features simply add new directories
- **Deletability**: Removing a feature means deleting its directory
- **Team Collaboration**: Different teams can work on different features
- **Code Ownership**: Clear boundaries for code ownership
- **Refactoring**: Easier to refactor or extract features

### Negative
- **Import Path Length**: Deeper nesting means longer import paths
- **Shared Code Identification**: Might duplicate code before recognizing sharing opportunity
- **Initial Setup**: More directories to create for new features

### Neutral
- **Navigation**: Developers need to understand feature boundaries
- **Build Configuration**: Build tools need to handle the nested structure

## Alternatives Considered

1. **Type-Based Organization**
   ```
   src/
   ├── controllers/
   ├── models/
   ├── views/
   └── styles/
   ```
   - Pros: Simple, traditional, familiar
   - Cons: Features scattered across directories, hard to understand boundaries
   - Reason for rejection: Doesn't scale well, creates unnecessary coupling

2. **Domain-Driven Design (Full DDD)**
   - Pros: Clear bounded contexts, sophisticated architecture
   - Cons: Overly complex for current needs, steep learning curve
   - Reason for rejection: Overkill for educational platform at current scale

3. **Monolithic Structure**
   - Pros: Simple for small projects
   - Cons: Becomes unmaintainable as project grows
   - Reason for rejection: Already experiencing scale issues

## Related Decisions
- ADR-001: Component-Based Architecture with BaseComponent Pattern
- ADR-005: File Duplication Crisis Resolution
- ADR-010: Component Library Extraction (Future)

## References
- [Project Structure Documentation](../../../docs/project-structure.md)
- [Feature Module Guidelines](../../../docs/feature-modules.md)
- [Multi-Agent Analysis - Architecture Domain](../../../multiAgentAnalysisCompilation.json)

## Notes
This organization has already proven beneficial with clear separation between subjects and games. The structure supports our future plans for component library extraction and potential subject-specific packaging.

The file duplication crisis (100-150+ duplicate files) reinforces the need for this clear organization to prevent future duplication.

---
*Decision made by: Architecture Team*  
*Date: 2025-01-20*