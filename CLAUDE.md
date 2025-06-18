# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Learnimals is a static educational web application featuring interactive games and activities for children. Each subject area (Math, Science, Reading, Art, Coding) is represented by an animal character and follows a consistent template-based architecture.

## Development Commands

This is a static HTML/CSS/JavaScript website that requires no build process. To develop:

1. **Start local development server**: Use any local web server (Python's `python -m http.server`, Node's `npx serve`, VS Code Live Server, etc.)
2. **Open browser**: Navigate to `/src/pages/index.html` 
3. **No build/compilation required**: Files can be edited directly and refreshed in browser

## Architecture

### Modern Component-Based System
- **Reusable Components**: Located in `src/components/` organized by type (ui/, layout/, forms/)
- **Feature-Based Organization**: Subject-specific code grouped in `src/features/subjects/`
- **Template System**: Subject pages use a shared template (`src/templates/subject.html`) with dynamic content loading
- **Theme Management**: Centralized theming system with light/dark mode support and multiple color themes

### File Structure
```
├── src/                     # All source code
│   ├── components/          # Reusable UI components by type
│   │   ├── ui/              # Basic elements (Card, Modal, etc.)
│   │   ├── layout/          # Layout components (navbar, navigation)
│   │   └── forms/           # Form components
│   ├── features/            # Feature-based organization
│   │   ├── subjects/        # Subject-specific functionality
│   │   │   ├── math/        # Math-specific files
│   │   │   ├── science/     # Science-specific files
│   │   │   └── shared/      # Shared subject pages/examples
│   │   ├── games/           # Game features
│   │   │   ├── bubble-pop/  # Bubble Pop game
│   │   │   └── word-scramble/ # Word Scramble game
│   │   └── user/            # User-related functionality
│   ├── styles/              # Modern CSS organization
│   │   ├── base/            # Foundation styles
│   │   ├── components/      # Component-specific styles
│   │   └── themes/          # Theme-related styles
│   ├── utils/               # Utility functions
│   ├── templates/           # HTML templates
│   └── pages/               # Main application pages
├── public/                  # Static assets served directly
│   ├── images/              # Images and icons
│   ├── manifest.json        # PWA manifest
│   └── serviceWorker.js     # Service worker
└── docs/                    # Documentation
```

### Key Systems

#### Subject Template System
- Uses `SubjectTemplateLoader` to maintain consistency across subject pages
- Template placeholders: `{{subjectName}}`, `{{characterName}}`, `{{heroSubtitle}}`, etc.
- Supports both static HTML fallback and dynamic Card.js component rendering

#### Theme System
- **themeRegistry.js**: Central theme definitions and color sets
- **themeManager.js**: Core theme switching logic
- **themeSwitcher.js**: UI component for theme selection
- **Semantic CSS variables**: Use `--text-primary`, `--bg-card`, `--accent-primary` instead of direct colors

#### Component Library
- **Card Component**: Creates consistent card layouts with support for linked and static cards
- **Modal Component**: Standardized dialog boxes with customizable content
- **Form Component**: Validated forms with local storage integration
- **UI Utilities**: Common patterns like toast notifications and tab interfaces

## Development Guidelines

### Adding New Subject Pages
1. Use the template system via `SubjectTemplateLoader.renderTemplate()`
2. Define subject-specific options (character, colors, features)
3. Provide both `featureCards` (HTML fallback) and `featureCardsData` (Card.js array)
4. Create corresponding CSS file in `src/features/subjects/[subject]/[subject].css`
5. Place subject JavaScript in `src/features/subjects/[subject]/[subject].js`

### Working with Components
- Import components from appropriate `src/components/` subdirectories
- Use semantic CSS variables for theming
- Follow the component documentation in `docs/components.md`
- Test components in both light and dark modes

### Styling Guidelines
- Use semantic CSS variables: `--text-primary`, `--bg-card`, `--accent-primary`, etc.
- Subject-specific styles go in `src/features/subjects/[subject]/[subject].css`
- Component styles go in `src/styles/components/`
- Follow BEM naming convention for CSS classes

### Configuration
- Global app settings in `src/config.js`
- Game configurations (speed, dimensions, timeouts) centralized in config
- Theme settings and API endpoint definitions included

## PWA Features
- Service worker enabled for offline functionality (`serviceWorker.js`)
- Manifest file for app-like behavior (`manifest.json`)
- Caching strategy for static assets

## Games Architecture
- Self-contained game modules in `js/games/`
- Canvas-based rendering for performance (Bubble Pop game)
- Touch and mouse input support
- Score tracking and progress saving

## Testing
No automated testing framework is currently configured. Test manually by:
1. Loading pages in different browsers
2. Testing responsive design on mobile devices
3. Verifying theme switching functionality
4. Testing offline capabilities (PWA features)