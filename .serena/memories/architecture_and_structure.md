# Architecture and Code Structure

## Modern Component-Based System

- **Reusable Components**: Located in `src/components/` organized by type (ui/, layout/, forms/)
- **Feature-Based Organization**: Subject-specific code grouped in `src/features/subjects/`
- **Template System**: Subject pages use a shared template (`src/templates/subject.html`) with dynamic content loading
- **Theme Management**: Centralized theming system with light/dark mode support

## Directory Structure

```
├── src/                     # All source code
│   ├── components/          # Reusable UI components by type
│   │   ├── ui/              # Basic elements (Card, Modal, etc.)
│   │   ├── layout/          # Layout components (navbar, navigation)
│   │   └── forms/           # Form components
│   ├── features/            # Feature-based organization
│   │   ├── subjects/        # Subject-specific functionality
│   │   ├── games/           # Game features (bubble-pop, word-scramble)
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

## Key Systems

- **Subject Template System**: Uses `SubjectTemplateLoader` for consistency
- **Theme System**: `themeRegistry.js`, `themeManager.js`, `themeSwitcher.js`
- **Component Library**: Card, Modal, Form components with BaseComponent pattern
- **PWA Features**: Service worker, manifest, offline capabilities
