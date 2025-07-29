# Vite Configuration Guide

This document explains the Vite setup for the Learnimals project and how to use it alongside the existing static HTML/CSS/JavaScript structure.

## Overview

The `vite.config.js` file has been configured to:
- Maintain compatibility with the existing static file structure
- Provide modern development features (HMR, fast builds, etc.)
- Support the established aliases and path resolution
- Enable multi-page application support
- Work seamlessly with the existing Vitest configuration

## Key Features

### 1. Path Aliases
The following aliases are configured for both Vite and Vitest:

```javascript
'@': './src'                    // Root source directory
'@components': './src/components'   // UI components
'@utils': './src/utils'        // Utility functions
'@services': './src/services'  // Service layer
'@features': './src/features'  // Feature-specific code
'@styles': './src/styles'      // Stylesheets
'@pages': './src/pages'        // Page templates
'@templates': './src/templates' // HTML templates
'@config': './src/config.js'   // Configuration file
'@public': './public'          // Static assets
```

### 2. Multi-Page Application Support
Vite is configured to handle all the existing HTML pages:

- Main pages (`index.html`, `about.html`, `contact.html`, etc.)
- Subject pages (`math.html`, `science.html`, `reading.html`, etc.)
- Game pages (`bubble-pop`, `place-value`, etc.)
- Profile and progress pages

### 3. Development Server Configuration
- **Port**: 8080 (matching existing setup)
- **HMR**: Enabled with overlay for errors
- **CORS**: Enabled for cross-origin requests
- **Proxy**: Configured for future API endpoints

### 4. Build Optimization
- **Output directory**: `dist/` (relative to project root)
- **Asset organization**: Separate directories for images, styles, and JS
- **Code splitting**: Enabled for better performance
- **Minification**: Using esbuild for fast builds
- **Source maps**: Generated for debugging

## Usage

### Development Commands

```bash
# Start Vite development server (recommended)
npm run dev

# Alternative: Start Vite on specific port
npm run dev-server

# Legacy: Python server (for compatibility)
make dev-server
```

### Build Commands

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Using Make
make build      # Build with Vite
make preview    # Preview build
```

### Testing

The Vitest configuration has been updated to work with the same aliases:

```bash
# Run tests (uses Vitest with Vite config compatibility)
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Migration Strategy

### Phase 1: Dual Setup (Current)
- Both static serving and Vite work simultaneously
- Existing Python server still available via `make dev-server`
- All existing file paths and imports continue to work
- Vite aliases provide modern development experience

### Phase 2: Gradual Enhancement (Future)
- Convert individual components to use Vite aliases
- Example migration:
```javascript
// Before
import Card from '../components/ui/Card.js';

// After
import Card from '@components/ui/Card.js';
```

### Phase 3: Full Integration (Future)
- All imports use aliases
- Build process fully managed by Vite
- Static serving deprecated

## File Structure Compatibility

The Vite configuration preserves the existing structure:

```
src/
├── pages/           # Entry points for Vite
├── components/      # Accessible via @components
├── utils/           # Accessible via @utils
├── services/        # Accessible via @services
├── features/        # Accessible via @features
│   ├── subjects/    # Subject-specific code
│   └── games/       # Game implementations
├── styles/          # Accessible via @styles
└── templates/       # Accessible via @templates

public/              # Static assets, accessible via @public
dist/                # Build output (auto-generated)
```

## Benefits

### For Development
- **Hot Module Replacement (HMR)**: Instant updates without page refresh
- **Fast builds**: esbuild-powered bundling
- **Path aliases**: Clean, maintainable imports
- **Error overlay**: Clear error messages in development

### For Production
- **Code splitting**: Optimized loading performance
- **Asset optimization**: Automatic minification and compression
- **Modern JS**: ES2020 target with backwards compatibility
- **Source maps**: Better debugging in production

### For Testing
- **Unified configuration**: Same aliases work in tests
- **Fast test runs**: Vite's fast bundling improves test speed
- **Mock support**: Enhanced mocking capabilities

## Existing Features Preserved

### Static File Serving
- All existing HTML files continue to work
- CSS and JavaScript files load as before
- Image and asset paths remain unchanged
- PWA functionality (service worker, manifest) preserved

### Template System
- SubjectTemplateLoader continues to work
- HTML templates in `src/templates/` accessible
- Dynamic content loading unchanged

### Theme System
- Theme switching functionality preserved
- CSS custom properties work as before
- Dark/light mode switching intact

## Configuration Files

### `vite.config.js`
Main Vite configuration with:
- Multi-page setup
- Alias definitions
- Build optimizations
- Development server settings

### `vitest.config.js`
Updated to maintain compatibility with Vite aliases and provide consistent path resolution across development and testing.

### `postcss.config.js`
Minimal PostCSS setup for future CSS preprocessing needs.

## Troubleshooting

### Common Issues

1. **Path resolution errors**
   - Ensure you're using the correct aliases
   - Check that files exist at the specified paths

2. **Build failures**
   - Clear `dist/` directory: `make clean`
   - Reinstall dependencies: `npm ci`

3. **HMR not working**
   - Check browser console for connection errors
   - Verify port 8080 is available

### Legacy Compatibility

If you need to fall back to the static setup:
```bash
# Use Python server instead of Vite
make dev-server

# Or directly
python3 -m http.server 8080
```

## Future Enhancements

The Vite configuration is designed to support future improvements:

- **TypeScript**: Easy to add with Vite's built-in support
- **CSS preprocessing**: Sass, Less, or Stylus can be added
- **Framework integration**: React, Vue, or other frameworks
- **Advanced optimizations**: Bundle analysis, code splitting strategies
- **PWA enhancements**: Advanced service worker features

## Getting Started

1. **Install Vite** (if not already installed):
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open browser**: Navigate to `http://localhost:8080`

4. **Make changes**: Edit files and see them update instantly

5. **Build for production**:
   ```bash
   npm run build
   ```

The setup maintains full backward compatibility while providing modern development tools and optimizations.