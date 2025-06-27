# Development Guidelines

## Adding New Subject Pages
1. Use the template system via `SubjectTemplateLoader.renderTemplate()`
2. Define subject-specific options (character, colors, features)
3. Provide both `featureCards` (HTML fallback) and `featureCardsData` (Card.js array)
4. Create corresponding CSS file in `src/features/subjects/[subject]/[subject].css`
5. Place subject JavaScript in `src/features/subjects/[subject]/[subject].js`

## Working with Components
- Import components from appropriate `src/components/` subdirectories
- Use semantic CSS variables for theming
- Follow the component documentation in `docs/components.md`
- Test components in both light and dark modes

## Template System
- Uses `SubjectTemplateLoader` to maintain consistency across subject pages
- Template placeholders: `{{subjectName}}`, `{{characterName}}`, `{{heroSubtitle}}`, etc.
- Supports both static HTML fallback and dynamic Card.js component rendering

## Theme System
- **themeRegistry.js**: Central theme definitions and color sets
- **themeManager.js**: Core theme switching logic
- **themeSwitcher.js**: UI component for theme selection
- **Semantic CSS variables**: Use `--text-primary`, `--bg-card`, `--accent-primary` instead of direct colors

## Games Architecture
- Self-contained game modules in `src/features/games/`
- Canvas-based rendering for performance (Bubble Pop game)
- Touch and mouse input support
- Score tracking and progress saving

## Configuration
- Global app settings in `src/config.js`
- Game configurations (speed, dimensions, timeouts) centralized in config
- Theme settings and API endpoint definitions included

## Important Principles
- **NEVER create files unless absolutely necessary**
- **ALWAYS prefer editing existing files to creating new ones**
- **NEVER proactively create documentation files**
- **Follow existing patterns and conventions**
- **Test in multiple browsers and screen sizes**