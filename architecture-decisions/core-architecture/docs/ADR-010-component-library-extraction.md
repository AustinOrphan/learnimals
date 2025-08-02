# ADR-010: Component Library Extraction

## Status
Proposed

## Context
Analysis identified 47 reusable components in the Learnimals codebase with potential for extraction into a standalone library. This presents both a technical opportunity and business opportunity:

- **Technical**: Clean separation of concerns, reusability across projects
- **Business**: Potential revenue stream through component library licensing
- **Market**: Educational technology developers need accessible, WCAG-compliant components
- **Differentiation**: Our character-driven, accessibility-first components are unique

Multi-agent consensus (8/9 agents) confirms component library extraction as valuable for business model expansion.

## Decision
We will extract core components into a standalone, monetizable component library:

1. **Library Scope**:
   ```
   @learnimals/edu-components
   ├── Core Components
   │   ├── BaseComponent (foundation)
   │   ├── AccessibleComponent
   │   ├── Card
   │   ├── Modal
   │   ├── Form Components
   │   └── Navigation
   ├── Educational Components
   │   ├── CharacterAvatar
   │   ├── ProgressTracker
   │   ├── QuizComponent
   │   ├── InteractiveLesson
   │   └── GameCanvas
   ├── Accessibility Utilities
   │   ├── FocusManager
   │   ├── ScreenReaderUtils
   │   ├── KeyboardNavigation
   │   └── WCAGValidator
   └── Themes
       ├── Character Themes
       ├── Accessibility Themes
       └── Educational Themes
   ```

2. **Technical Architecture**:
   - Framework agnostic core (vanilla JS)
   - Framework adapters (Vue, React, Angular)
   - TypeScript definitions
   - CSS modules for styling
   - Tree-shakeable exports
   - Zero dependencies goal

3. **Quality Standards**:
   - 100% WCAG 2.1 AA compliance
   - 95%+ test coverage
   - Performance benchmarks
   - Comprehensive documentation
   - Interactive playground
   - Migration guides

4. **Business Model**:
   ```
   Tiers:
   - Open Source: Core components (MIT license)
   - Professional: Educational components ($99/month)
   - Enterprise: Full suite + support ($499/month)
   - White Label: Custom branding ($999/month)
   ```

5. **Distribution Strategy**:
   - NPM registry publication
   - CDN distribution
   - GitHub releases
   - Component marketplace presence
   - Educational partner channels

## Consequences

### Positive
- **Revenue Stream**: New B2B revenue opportunity
- **Market Position**: Establish as edtech component leader
- **Code Quality**: Forces better component design
- **Community**: Build developer ecosystem
- **Brand Building**: Increase Learnimals visibility
- **Maintenance**: Community contributions

### Negative
- **Maintenance Burden**: Supporting external users
- **API Stability**: Breaking changes affect customers
- **Support Costs**: Customer support requirements
- **Competition**: May help competitors
- **Complexity**: Version management across projects

### Neutral
- **Documentation**: Extensive docs required
- **Marketing**: Needs developer marketing strategy
- **Legal**: License management complexity
- **Dependencies**: Must maintain backward compatibility

## Alternatives Considered

1. **Keep Internal Only**
   - Pros: No external obligations, full control
   - Cons: Miss revenue opportunity, no community
   - Reason for rejection: Business opportunity too valuable

2. **Fully Open Source**
   - Pros: Maximum adoption, community goodwill
   - Cons: No direct revenue, support burden
   - Reason for rejection: Need revenue model

3. **Sell One-Time License**
   - Pros: Simpler model, immediate revenue
   - Cons: No recurring revenue, version management
   - Reason for rejection: SaaS model more sustainable

4. **Partner with Existing Library**
   - Pros: Established distribution, less work
   - Cons: Less control, revenue sharing
   - Reason for rejection: Our components are differentiated enough

## Related Decisions
- ADR-001: Component-Based Architecture (defines what to extract)
- ADR-003: Accessibility-First Design (key differentiator)
- ADR-004: Character-Driven Education (unique components)
- ADR-009: Progressive Framework Integration (affects extraction)

## References
- [Component Inventory](../../../docs/component-inventory.md)
- [Market Analysis](../../../business/component-library-market.md)
- [Technical Extraction Plan](../../../docs/extraction-plan.md)

## Notes
This is contingent on:
- File deduplication completion (ADR-005)
- Performance optimization (ADR-007)
- Framework decision (ADR-009)

Business Strategy Analyst (Agent A15) projects:
- Year 1: 50-100 customers at average $200/month = $120K-240K ARR
- Year 2: 200-500 customers = $480K-1.2M ARR
- Year 3: Component marketplace leader in education

Success metrics:
- 50+ paying customers in 6 months
- 90+ NPS score
- <24 hour support response
- 5+ enterprise customers in Year 1

---
*Decision proposed by: Business Team, Frontend Team*  
*Date: 2025-02-15*  
*Business Case Required*