# CSS Build Integration

This document describes the CSS build integration system implemented for the modularization01 specification (task 10.3).

## Overview

The CSS build integration provides a comprehensive CLI tool (`scripts/build-css.js`) that leverages the CSSBundler system to:

- Bundle and optimize CSS files for production
- Support development and production build modes  
- Provide watch mode for development workflows
- Generate bundle analysis and performance reports
- Integrate seamlessly with npm build scripts

## Requirements Fulfilled

- **FR-3.1**: Implement CSS bundling for production builds ✅
- **FR-3.2**: Add CSS minification and compression ✅  
- **TC-2**: Build integration and CLI tooling ✅

## Available Scripts

### Production Build
```bash
npm run build:css          # Full production build with optimization
npm run build:css:prod     # Explicit production build
npm run build             # Runs production CSS build
```

### Development Build
```bash
npm run build:css:dev      # Development build (no minification)
npm run build:css:watch    # Watch mode for development
```

### Maintenance
```bash
npm run build:css:clean    # Clean build artifacts
npm run build:css:analyze  # Generate bundle analysis report
```

## CLI Usage

The build script can be used directly with various options:

```bash
# Basic usage
node scripts/build-css.js [options]

# Options
--mode <dev|prod>     # Build mode (default: prod)
--watch, -w           # Enable watch mode
--output, -o <dir>    # Output directory (default: dist/css)
--config, -c <file>   # Configuration file
--verbose, -v         # Verbose logging
--clean               # Clean output directory first
--analyze             # Generate bundle analysis report
--source-maps         # Generate source maps
--help, -h            # Show help
```

## Configuration

The build system can be configured via `css-build.config.json`:

```json
{
  "inputPatterns": [
    "src/styles/**/*.css",
    "src/components/**/*.css",
    "src/features/**/*.css"
  ],
  "entryPoints": [
    "src/styles/base/styles.css",
    "src/styles/themes/theme-registry.css"
  ],
  "outputDir": "dist/css",
  "modes": {
    "development": {
      "minification": false,
      "compression": false,
      "sourceMaps": true
    },
    "production": {
      "minification": true,
      "compression": true,
      "criticalCSS": true
    }
  }
}
```

## Features

### Development Mode
- Fast builds without minification
- Source maps for debugging
- Watch mode for automatic rebuilds
- Verbose logging for development insights

### Production Mode
- CSS minification and compression
- Dead code elimination
- Bundle optimization
- Critical CSS extraction
- Content hashing for cache busting
- Bundle manifest generation

### Bundle Analysis
- Dependency analysis with circular dependency detection
- Bundle size optimization recommendations
- Performance metrics and compression ratios
- Critical path identification
- Shared dependency analysis

## Build Output

### Directory Structure
```
dist/css/
├── main.[contenthash].css      # Main application bundle
├── critical.css                # Above-the-fold critical CSS
├── non-critical.css            # Lazy-loaded CSS
├── shared-0.[contenthash].css  # Shared dependencies
└── manifest.json               # Bundle metadata
```

### Manifest File
The build generates a `manifest.json` with:
- Bundle metadata and file mappings
- Loading order optimization
- Performance metrics
- Critical bundle identification
- Preload hints for optimization

## Integration with Existing Workflow

The CSS build system integrates with existing project patterns:

- **CSSBundler**: Leverages the advanced bundling engine from task 10.2
- **logger**: Uses project logging standards
- **Performance monitoring**: Built-in performance tracking
- **npm scripts**: Follows established script naming conventions
- **Git hooks**: Compatible with existing pre-commit workflows

## Development Workflow

### Typical Development Flow
1. Start development server: `npm run serve`
2. Start CSS watch mode: `npm run build:css:watch`
3. Make CSS changes - builds automatically
4. Test changes in browser

### Production Deployment
1. Run production build: `npm run build:css`
2. Deploy `dist/css/` contents to CDN/static hosting
3. Update HTML to reference bundled files from manifest

## Performance Features

### Bundle Optimization
- **Dependency analysis**: Identifies optimal bundle splitting
- **Code splitting**: Separates shared dependencies
- **Critical CSS**: Extracts above-the-fold styles
- **Compression**: Achieves target 20%+ size reduction

### Loading Optimization
- **Preload hints**: Critical resources prioritized
- **Lazy loading**: Non-critical CSS loaded asynchronously
- **Content hashing**: Optimal browser caching
- **Bundle manifest**: Runtime bundle loading coordination

## Troubleshooting

### Common Issues
1. **"No CSS files found"**: Check input patterns in config
2. **Build fails**: Run with `--verbose` for detailed logging
3. **Circular dependencies**: Use `--analyze` to identify cycles
4. **Large bundles**: Check bundle analysis recommendations

### Debug Mode
```bash
npm run build:css:dev -- --verbose
```

### Clean Build
```bash
npm run build:css:clean && npm run build:css
```

## Future Enhancements

Potential improvements for future iterations:
- PostCSS integration for advanced transformations
- CSS-in-JS support for component libraries
- Advanced tree shaking for unused styles
- Runtime bundle loading with service workers
- Integration with CSS custom property optimization

## Related Documentation

- [CSSBundler Implementation](../src/utils/CSSBundler.js) - Core bundling engine
- [Modularization Plan](MODULARIZATION_PLAN.md) - Overall project architecture
- [Performance Guidelines](PERFORMANCE_OPTIMIZATION.md) - Optimization strategies