import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Root directory for the project
  root: 'src/pages',
  
  // Base public path
  base: './',
  
  // Entry points for multi-page app
  build: {
    // Output directory relative to project root
    outDir: '../../dist',
    
    // Clear output directory before build
    emptyOutDir: true,
    
    // Multi-page app configuration
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/pages/index.html'),
        about: resolve(__dirname, 'src/pages/about.html'),
        contact: resolve(__dirname, 'src/pages/contact.html'),
        profile: resolve(__dirname, 'src/pages/profile.html'),
        'profile-enhanced': resolve(__dirname, 'src/pages/profile-enhanced.html'),
        'character-customization': resolve(__dirname, 'src/pages/character-customization.html'),
        'progress-dashboard': resolve(__dirname, 'src/pages/progress-dashboard.html'),
        'pizza-maker': resolve(__dirname, 'src/pages/pizza-maker.html'),
        'pizza-party': resolve(__dirname, 'src/pages/pizza-party.html'),
        offline: resolve(__dirname, 'src/pages/offline.html'),
        'theme-test': resolve(__dirname, 'src/pages/theme-test.html'),
        // Subject pages
        'math': resolve(__dirname, 'src/features/subjects/shared/math.html'),
        'science': resolve(__dirname, 'src/features/subjects/shared/science.html'),
        'reading': resolve(__dirname, 'src/features/subjects/shared/reading.html'),
        'art': resolve(__dirname, 'src/features/subjects/shared/art.html'),
        'coding': resolve(__dirname, 'src/features/subjects/shared/coding.html'),
        'geography': resolve(__dirname, 'src/features/subjects/shared/geography.html'),
        'music': resolve(__dirname, 'src/features/subjects/shared/music.html'),
        // Game pages
        'bubble-pop': resolve(__dirname, 'src/features/subjects/shared/bubblepop.html'),
        'place-value': resolve(__dirname, 'src/features/subjects/shared/place-value.html'),
        'color-palette': resolve(__dirname, 'src/features/games/color-palette/index.html'),
        'element-match': resolve(__dirname, 'src/features/games/element-match/index.html'),
        'number-line-jump': resolve(__dirname, 'src/features/games/number-line-jump/index.html'),
        'sentence-builder': resolve(__dirname, 'src/features/games/sentence-builder/index.html')
      },
      output: {
        // Organize output by type
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const extType = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/css/i.test(extType)) {
            return `assets/styles/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },
    
    // Build optimizations
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: true,
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Asset handling
    assetsDir: 'assets',
    
    // Enable experimental features for better tree shaking
    rollupOptions: {
      ...this.build?.rollupOptions,
      treeshake: {
        moduleSideEffects: false
      }
    }
  },
  
  // Development server configuration
  server: {
    port: 8080,
    host: true,
    open: '/index.html',
    cors: true,
    
    // Proxy configuration for potential future API endpoints
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    },
    
    // HMR configuration
    hmr: {
      overlay: true
    },
    
    // File watching configuration
    watch: {
      // Watch specific directories
      include: [
        'src/**',
        'public/**'
      ],
      // Ignore certain file patterns
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.git/**'
      ]
    }
  },
  
  // Preview server configuration (for production builds)
  preview: {
    port: 4173,
    host: true,
    open: true
  },
  
  // Path resolution and aliases
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@services': resolve(__dirname, 'src/services'),
      '@features': resolve(__dirname, 'src/features'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@templates': resolve(__dirname, 'src/templates'),
      '@config': resolve(__dirname, 'src/config.js'),
      '@public': resolve(__dirname, 'public')
    },
    
    // File extensions to resolve
    extensions: ['.js', '.mjs', '.jsx', '.ts', '.tsx', '.json', '.css', '.html']
  },
  
  // Public directory
  publicDir: resolve(__dirname, 'public'),
  
  // Asset processing
  assetsInclude: [
    '**/*.png',
    '**/*.jpg',
    '**/*.jpeg',
    '**/*.gif',
    '**/*.svg',
    '**/*.ico',
    '**/*.webp',
    '**/*.avif'
  ],
  
  // CSS configuration
  css: {
    // CSS preprocessing options
    preprocessorOptions: {
      // Future CSS preprocessing can be added here
    },
    
    // CSS modules configuration
    modules: {
      // Enable CSS modules for .module.css files
      localsConvention: 'camelCase'
    },
    
    // PostCSS configuration can be added via postcss.config.js
    postcss: './postcss.config.js'
  },
  
  // Optimize dependencies
  optimizeDeps: {
    // Include dependencies that need to be pre-bundled
    include: [
      // Add any dependencies that need pre-bundling
    ],
    
    // Exclude dependencies from pre-bundling
    exclude: [
      // Keep empty for now, add if needed
    ],
    
    // Force re-optimization
    force: false
  },
  
  // Worker configuration
  worker: {
    format: 'es'
  },
  
  // Plugin configuration
  plugins: [
    // Custom plugin to handle the static nature of the current setup
    {
      name: 'learnimals-static-compat',
      configureServer(server) {
        // Handle routing for static files
        server.middlewares.use('/src', (req, res, next) => {
          // Allow access to src files for development
          next();
        });
        
        // Handle subject page routing
        server.middlewares.use('/subjects', (req, res, next) => {
          // Redirect subject routes to appropriate pages
          const subjectName = req.url.split('/')[1];
          if (subjectName) {
            req.url = `/src/features/subjects/shared/${subjectName}.html`;
          }
          next();
        });
      }
    }
  ],
  
  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __PROD__: JSON.stringify(process.env.NODE_ENV === 'production')
  },
  
  // ESBuild configuration
  esbuild: {
    // Keep console logs in development
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    
    // Target modern browsers
    target: 'es2020',
    
    // JSX configuration if needed in the future
    jsxFactory: 'h',
    jsxFragment: 'Fragment'
  },
  
  // Experimental features
  experimental: {
    // Enable experimental rendering optimizations
    renderBuiltUrl(filename, { hostType, type }) {
      if (type === 'asset') {
        return `./${filename}`;
      }
      return filename;
    }
  }
});