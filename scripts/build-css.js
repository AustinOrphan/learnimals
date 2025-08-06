#!/usr/bin/env node

/**
 * CSS Build Integration Script
 * 
 * A CLI tool for CSS bundling and optimization using the CSSBundler system.
 * Supports development and production builds with configurable options.
 * 
 * Requirements: FR-3.1, FR-3.2, TC-2
 * - FR-3.1: Implement CSS bundling for production builds
 * - FR-3.2: Add CSS minification and compression
 * - TC-2: Build integration and CLI tooling
 * 
 * Usage:
 *   npm run build:css              # Production build
 *   npm run build:css:dev          # Development build
 *   npm run build:css:watch        # Watch mode for development
 *   npm run build:css:clean        # Clean build artifacts
 *   npm run build:css:analyze      # Analyze bundle performance
 * 
 * Command line options:
 *   --mode <dev|prod>              # Build mode (default: prod)
 *   --watch                        # Enable watch mode
 *   --output <dir>                 # Output directory (default: dist/css)
 *   --config <file>                # Configuration file
 *   --verbose                      # Verbose logging
 *   --clean                        # Clean output directory first
 *   --analyze                      # Generate bundle analysis
 *   --source-maps                  # Generate source maps
 *   --help                         # Show help
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { CSSBundler } from '../src/utils/CSSBundler.js';
import logger from '../src/utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// CLI Configuration
const CLI_CONFIG = {
  name: 'build-css',
  version: '1.0.0',
  description: 'CSS bundling and optimization CLI tool',
};

// Default build configuration
const DEFAULT_CONFIG = {
  // Input configuration
  inputPatterns: [
    'src/styles/**/*.css',
    'src/components/**/*.css',
    'src/features/**/*.css',
  ],
  entryPoints: [
    'src/styles/base/styles.css',
    'src/styles/themes/theme-registry.css',
  ],
  
  // Output configuration
  outputDir: 'dist/css',
  outputFormat: {
    dev: '[name].css',
    prod: '[name].[contenthash].css',
  },
  
  // Build modes
  modes: {
    development: {
      minification: false,
      compression: false,
      sourceMaps: true,
      optimization: false,
      bundling: true,
    },
    production: {
      minification: true,
      compression: true,
      sourceMaps: false,
      optimization: true,
      bundling: true,
      criticalCSS: true,
    },
  },
  
  // Performance thresholds
  performance: {
    maxBundleSize: 100 * 1024, // 100KB
    maxCriticalSize: 14 * 1024, // 14KB inline critical CSS
    compressionTarget: 20, // 20% size reduction minimum
  },
  
  // Watch configuration
  watch: {
    patterns: [
      'src/**/*.css',
      '!dist/**',
      '!node_modules/**',
    ],
    debounceMs: 500,
  },
};

class CSSBuildCLI {
  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.bundler = null;
    this.watchMode = false;
    this.buildMode = 'production';
    this.verbose = false;
    this.outputDir = DEFAULT_CONFIG.outputDir;
    this.buildStats = {
      startTime: 0,
      endTime: 0,
      duration: 0,
      files: [],
      bundles: new Map(),
      errors: [],
      warnings: [],
    };
  }

  /**
   * Parse command line arguments and initialize CLI
   */
  async parseArgs() {
    const args = process.argv.slice(2);
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--mode':
          this.buildMode = args[++i] || 'production';
          break;
        case '--watch':
        case '-w':
          this.watchMode = true;
          break;
        case '--output':
        case '-o':
          this.outputDir = args[++i] || DEFAULT_CONFIG.outputDir;
          break;
        case '--config':
        case '-c':
          await this.loadConfigFile(args[++i]);
          break;
        case '--verbose':
        case '-v':
          this.verbose = true;
          break;
        case '--clean':
          await this.cleanOutputDirectory();
          break;
        case '--analyze':
          await this.runBundleAnalysis();
          return;
        case '--source-maps':
          this.config.modes[this.buildMode].sourceMaps = true;
          break;
        case '--help':
        case '-h':
          this.showHelp();
          return;
        default:
          if (arg.startsWith('-')) {
            console.error(`Unknown option: ${arg}`);
            process.exit(1);
          }
          break;
      }
    }

    // Validate build mode
    if (!['development', 'production', 'dev', 'prod'].includes(this.buildMode)) {
      console.error(`Invalid build mode: ${this.buildMode}`);
      process.exit(1);
    }

    // Normalize build mode
    if (this.buildMode === 'dev') this.buildMode = 'development';
    if (this.buildMode === 'prod') this.buildMode = 'production';
  }

  /**
   * Load configuration from file
   */
  async loadConfigFile(configPath) {
    try {
      const fullPath = path.resolve(projectRoot, configPath);
      const configContent = await fs.readFile(fullPath, 'utf-8');
      const customConfig = JSON.parse(configContent);
      
      // Deep merge with default config
      this.config = this.mergeConfig(this.config, customConfig);
      
      if (this.verbose) {
        console.log(`Loaded configuration from: ${fullPath}`);
      }
    } catch (error) {
      console.error(`Failed to load config file: ${configPath}`, error.message);
      process.exit(1);
    }
  }

  /**
   * Deep merge configuration objects
   */
  mergeConfig(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.mergeConfig(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Initialize the CSS bundler with build-specific options
   */
  initializeBundler() {
    const modeConfig = this.config.modes[this.buildMode];
    const isProduction = this.buildMode === 'production';
    
    const bundlerOptions = {
      // Core settings
      enableBundling: modeConfig.bundling,
      enableMinification: modeConfig.minification,
      enableCompression: modeConfig.compression,
      enableOptimization: modeConfig.optimization,
      enableSourceMaps: modeConfig.sourceMaps,
      isProduction,
      
      // Output configuration
      outputDir: this.outputDir,
      bundleNaming: this.config.outputFormat[this.buildMode === 'production' ? 'prod' : 'dev'],
      
      // Performance configuration
      maxBundleSize: this.config.performance.maxBundleSize,
      criticalCSSThreshold: this.config.performance.maxCriticalSize,
      
      // Development optimizations
      enableCodeSplitting: isProduction,
      enableDeadCodeElimination: isProduction,
      enableDuplicateRemoval: isProduction,
      enableCSSCustomPropertyOptimization: isProduction,
    };

    this.bundler = new CSSBundler(bundlerOptions);
    
    if (this.verbose) {
      console.log('CSS Bundler initialized with options:', {
        mode: this.buildMode,
        minification: bundlerOptions.enableMinification,
        compression: bundlerOptions.enableCompression,
        sourceMaps: bundlerOptions.enableSourceMaps,
        outputDir: this.outputDir,
      });
    }
  }

  /**
   * Discover CSS files based on input patterns
   */
  async discoverCSSFiles() {
    const cssFiles = [];
    
    try {
      // Process entry points
      for (const entryPoint of this.config.entryPoints) {
        const fullPath = path.resolve(projectRoot, entryPoint);
        try {
          await fs.access(fullPath);
          cssFiles.push(fullPath);
        } catch {
          if (this.verbose) {
            console.warn(`Entry point not found: ${entryPoint}`);
          }
        }
      }
      
      // Process input patterns using basic glob matching
      for (const pattern of this.config.inputPatterns) {
        const files = await this.globFiles(pattern);
        cssFiles.push(...files);
      }
      
      // Remove duplicates and sort
      const uniqueFiles = [...new Set(cssFiles)].sort();
      
      if (this.verbose) {
        console.log(`Discovered ${uniqueFiles.length} CSS files:`, uniqueFiles.slice(0, 5), 
                   uniqueFiles.length > 5 ? '...' : '');
      }
      
      return uniqueFiles;
    } catch (error) {
      console.error('Failed to discover CSS files:', error.message);
      throw error;
    }
  }

  /**
   * Basic glob file matching implementation
   */
  async globFiles(pattern) {
    const files = [];
    const basePath = pattern.includes('**') ? 
      path.resolve(projectRoot, pattern.split('**')[0]) : 
      path.resolve(projectRoot, path.dirname(pattern));
    
    const extension = pattern.endsWith('.css') ? '.css' : null;
    
    try {
      const entries = await this.walkDirectory(basePath, extension);
      files.push(...entries);
    } catch (error) {
      if (this.verbose) {
        console.warn(`Pattern matching failed for: ${pattern}`, error.message);
      }
    }
    
    return files;
  }

  /**
   * Recursively walk directory to find files
   */
  async walkDirectory(dir, extension = null) {
    const files = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip node_modules and dist directories
          if (!['node_modules', 'dist', '.git'].includes(entry.name)) {
            files.push(...await this.walkDirectory(fullPath, extension));
          }
        } else if (entry.isFile()) {
          if (!extension || fullPath.endsWith(extension)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist or no permissions
    }
    
    return files;
  }

  /**
   * Execute the CSS build process
   */
  async runBuild() {
    this.buildStats.startTime = Date.now();
    
    try {
      console.log(`\n🎨 Starting CSS build (${this.buildMode} mode)...`);
      
      // Initialize bundler
      this.initializeBundler();
      
      // Discover CSS files
      const cssFiles = await this.discoverCSSFiles();
      this.buildStats.files = cssFiles;
      
      if (cssFiles.length === 0) {
        console.warn('⚠️  No CSS files found to bundle');
        return;
      }
      
      // Ensure output directory exists
      await this.ensureOutputDirectory();
      
      // Convert file paths to URLs for bundler
      const cssUrls = cssFiles.map(file => {
        // Convert file path to relative URL for bundler
        const relativePath = path.relative(projectRoot, file);
        return relativePath.replace(/\\/g, '/'); // Normalize path separators
      });
      
      // Create optimized bundles
      console.log(`📦 Bundling ${cssFiles.length} CSS files...`);
      const bundleResult = await this.bundler.createOptimizedBundles(cssUrls, {
        name: 'main',
        outputPath: this.outputDir,
      });
      
      // Write bundle files
      await this.writeBundleFiles(bundleResult);
      
      // Generate critical CSS if enabled
      if (this.config.modes[this.buildMode].criticalCSS) {
        await this.generateCriticalCSS(bundleResult);
      }
      
      // Generate bundle manifest
      await this.generateBundleManifest(bundleResult);
      
      // Calculate build statistics
      this.calculateBuildStats(bundleResult);
      
      // Display build results
      this.displayBuildResults();
      
      console.log('✅ CSS build completed successfully!\n');
      
    } catch (error) {
      this.buildStats.errors.push(error.message);
      console.error('❌ CSS build failed:', error.message);
      
      if (this.verbose) {
        console.error('Stack trace:', error.stack);
      }
      
      throw error;
    } finally {
      this.buildStats.endTime = Date.now();
      this.buildStats.duration = this.buildStats.endTime - this.buildStats.startTime;
    }
  }

  /**
   * Ensure output directory exists
   */
  async ensureOutputDirectory() {
    const outputPath = path.resolve(projectRoot, this.outputDir);
    
    try {
      await fs.mkdir(outputPath, { recursive: true });
      if (this.verbose) {
        console.log(`Created output directory: ${outputPath}`);
      }
    } catch (error) {
      console.error(`Failed to create output directory: ${outputPath}`, error.message);
      throw error;
    }
  }

  /**
   * Write bundle files to disk
   */
  async writeBundleFiles(bundleResult) {
    const outputPath = path.resolve(projectRoot, this.outputDir);
    
    for (const [bundleName, bundle] of bundleResult.bundles) {
      const filename = this.generateBundleFilename(bundleName, bundle);
      const filePath = path.join(outputPath, filename);
      
      try {
        await fs.writeFile(filePath, bundle.content, 'utf-8');
        
        this.buildStats.bundles.set(bundleName, {
          filename,
          path: filePath,
          size: bundle.bundledSize,
          originalSize: bundle.originalSize,
          compression: ((bundle.originalSize - bundle.bundledSize) / bundle.originalSize * 100).toFixed(1),
        });
        
        if (this.verbose) {
          console.log(`Bundle written: ${filename} (${this.formatBytes(bundle.bundledSize)})`);
        }
      } catch (error) {
        console.error(`Failed to write bundle: ${filename}`, error.message);
        this.buildStats.errors.push(`Bundle write failed: ${bundleName}`);
      }
    }
  }

  /**
   * Generate filename for bundle based on naming pattern
   */
  generateBundleFilename(bundleName, bundle) {
    const pattern = this.config.outputFormat[this.buildMode === 'production' ? 'prod' : 'dev'];
    const hash = this.buildMode === 'production' ? this.generateContentHash(bundle.content) : '';
    
    return pattern
      .replace('[name]', bundleName)
      .replace('[contenthash]', hash);
  }

  /**
   * Generate content hash for cache busting
   */
  generateContentHash(content) {
    // Simple hash implementation for cache busting
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 8);
  }

  /**
   * Generate critical CSS bundle
   */
  async generateCriticalCSS(bundleResult) {
    try {
      console.log('🔥 Generating critical CSS...');
      
      // Define critical selectors for above-the-fold content
      const criticalSelectors = [
        'body', 'html', '.container', '.header', '.navigation',
        '.hero', '.main-content', '.sidebar', '.footer',
        'h1', 'h2', 'p', 'a', 'button', '.btn',
        '.visible', '.show', '.active', '.critical',
      ];
      
      const criticalResult = await this.bundler.createCriticalCSSBundle(criticalSelectors);
      
      // Write critical CSS file
      const criticalPath = path.join(path.resolve(projectRoot, this.outputDir), 'critical.css');
      await fs.writeFile(criticalPath, criticalResult.criticalCSS, 'utf-8');
      
      // Write non-critical CSS file
      const nonCriticalPath = path.join(path.resolve(projectRoot, this.outputDir), 'non-critical.css');
      await fs.writeFile(nonCriticalPath, criticalResult.nonCriticalCSS, 'utf-8');
      
      if (this.verbose) {
        console.log(`Critical CSS: ${this.formatBytes(criticalResult.criticalSize)}`);
        console.log(`Non-critical CSS: ${this.formatBytes(criticalResult.nonCriticalSize)}`);
      }
      
    } catch (error) {
      console.warn('Critical CSS generation failed:', error.message);
      this.buildStats.warnings.push('Critical CSS generation failed');
    }
  }

  /**
   * Generate bundle manifest file
   */
  async generateBundleManifest(bundleResult) {
    try {
      const manifest = {
        version: CLI_CONFIG.version,
        buildTime: new Date().toISOString(),
        buildMode: this.buildMode,
        bundles: {},
        loadingOrder: bundleResult.manifest.loadingOrder,
        criticalBundles: bundleResult.manifest.criticalBundles,
        preloadHints: bundleResult.manifest.preloadHints,
        performance: {
          totalBundles: bundleResult.bundles.size,
          totalSize: Array.from(bundleResult.bundles.values()).reduce((sum, bundle) => sum + bundle.bundledSize, 0),
          compressionRatio: this.calculateOverallCompression(bundleResult.bundles),
        },
      };
      
      // Add bundle metadata
      for (const [bundleName] of bundleResult.bundles) {
        const bundleStats = this.buildStats.bundles.get(bundleName);
        if (bundleStats) {
          manifest.bundles[bundleName] = {
            filename: bundleStats.filename,
            size: bundleStats.size,
            compression: bundleStats.compression,
          };
        }
      }
      
      const manifestPath = path.join(path.resolve(projectRoot, this.outputDir), 'manifest.json');
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
      
      if (this.verbose) {
        console.log('Bundle manifest generated: manifest.json');
      }
      
    } catch (error) {
      console.warn('Manifest generation failed:', error.message);
      this.buildStats.warnings.push('Manifest generation failed');
    }
  }

  /**
   * Calculate overall compression ratio
   */
  calculateOverallCompression(bundles) {
    let originalSize = 0;
    let compressedSize = 0;
    
    for (const bundle of bundles.values()) {
      originalSize += bundle.originalSize || 0;
      compressedSize += bundle.bundledSize || 0;
    }
    
    if (originalSize === 0) return 0;
    return ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
  }

  /**
   * Calculate comprehensive build statistics
   */
  calculateBuildStats(bundleResult) {
    // Add dependency analysis stats
    const depAnalysis = bundleResult.dependencyAnalysis;
    this.buildStats.dependencyAnalysis = {
      totalFiles: this.buildStats.files.length,
      totalDependencies: depAnalysis.totalDependencies,
      circularDependencies: depAnalysis.circularDependencies.length,
      sharedDependencies: depAnalysis.sharedDependencies.size,
      orphanedFiles: depAnalysis.orphanedFiles.length,
      bundleGroups: bundleResult.bundles.size,
    };
    
    // Calculate performance metrics
    const totalOriginalSize = Array.from(bundleResult.bundles.values()).reduce((sum, bundle) => sum + (bundle.originalSize || 0), 0);
    const totalBundledSize = Array.from(bundleResult.bundles.values()).reduce((sum, bundle) => sum + bundle.bundledSize, 0);
    
    this.buildStats.performance = {
      originalSize: totalOriginalSize,
      bundledSize: totalBundledSize,
      compressionRatio: totalOriginalSize > 0 ? ((totalOriginalSize - totalBundledSize) / totalOriginalSize * 100).toFixed(1) : '0',
      bundleCount: bundleResult.bundles.size,
      avgBundleSize: bundleResult.bundles.size > 0 ? Math.round(totalBundledSize / bundleResult.bundles.size) : 0,
    };
  }

  /**
   * Display comprehensive build results
   */
  displayBuildResults() {
    console.log('\n📊 Build Summary:');
    console.log('================');
    console.log(`Build Mode: ${this.buildMode}`);
    console.log(`Duration: ${this.buildStats.duration}ms`);
    console.log(`Files Processed: ${this.buildStats.files.length}`);
    console.log(`Bundles Created: ${this.buildStats.bundles.size}`);
    
    if (this.buildStats.performance) {
      console.log(`Original Size: ${this.formatBytes(this.buildStats.performance.originalSize)}`);
      console.log(`Bundled Size: ${this.formatBytes(this.buildStats.performance.bundledSize)}`);
      console.log(`Compression: ${this.buildStats.performance.compressionRatio}%`);
      console.log(`Average Bundle Size: ${this.formatBytes(this.buildStats.performance.avgBundleSize)}`);
    }
    
    if (this.buildStats.dependencyAnalysis) {
      console.log('\n🔍 Dependency Analysis:');
      console.log(`Total Dependencies: ${this.buildStats.dependencyAnalysis.totalDependencies}`);
      console.log(`Shared Dependencies: ${this.buildStats.dependencyAnalysis.sharedDependencies}`);
      console.log(`Bundle Groups: ${this.buildStats.dependencyAnalysis.bundleGroups}`);
      
      if (this.buildStats.dependencyAnalysis.circularDependencies > 0) {
        console.log(`⚠️  Circular Dependencies: ${this.buildStats.dependencyAnalysis.circularDependencies}`);
      }
      
      if (this.buildStats.dependencyAnalysis.orphanedFiles > 0) {
        console.log(`⚠️  Orphaned Files: ${this.buildStats.dependencyAnalysis.orphanedFiles}`);
      }
    }
    
    if (this.buildStats.bundles.size > 0) {
      console.log('\n📦 Bundle Details:');
      for (const [bundleName, bundle] of this.buildStats.bundles) {
        console.log(`  ${bundle.filename}: ${this.formatBytes(bundle.size)} (${bundle.compression}% compressed)`);
      }
    }
    
    if (this.buildStats.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.buildStats.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    if (this.buildStats.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.buildStats.errors.forEach(error => console.log(`  - ${error}`));
    }
  }

  /**
   * Clean output directory
   */
  async cleanOutputDirectory() {
    const outputPath = path.resolve(projectRoot, this.outputDir);
    
    try {
      await fs.rm(outputPath, { recursive: true, force: true });
      await fs.mkdir(outputPath, { recursive: true });
      console.log(`🧹 Cleaned output directory: ${outputPath}`);
    } catch (error) {
      console.error(`Failed to clean output directory: ${outputPath}`, error.message);
    }
  }

  /**
   * Run bundle analysis and generate reports
   */
  async runBundleAnalysis() {
    console.log('🔍 Running CSS bundle analysis...\n');
    
    try {
      // Initialize bundler for analysis
      this.initializeBundler();
      
      // Discover CSS files
      const cssFiles = await this.discoverCSSFiles();
      
      if (cssFiles.length === 0) {
        console.warn('No CSS files found for analysis');
        return;
      }
      
      // Convert to URLs and run analysis
      const cssUrls = cssFiles.map(file => {
        const relativePath = path.relative(projectRoot, file);
        return relativePath.replace(/\\/g, '/');
      });
      
      const bundleResult = await this.bundler.createOptimizedBundles(cssUrls);
      const depAnalysis = this.bundler.getDependencyAnalysis();
      const bundleStats = this.bundler.getBundleStats();
      
      // Display analysis results
      this.displayAnalysisResults(depAnalysis, bundleStats, bundleResult);
      
    } catch (error) {
      console.error('Bundle analysis failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Display detailed analysis results
   */
  displayAnalysisResults(depAnalysis, bundleStats, bundleResult) {
    console.log('📊 CSS Bundle Analysis Report');
    console.log('============================\n');
    
    // Dependency Analysis
    if (depAnalysis) {
      console.log('🔗 Dependency Analysis:');
      console.log(`  Total Files: ${depAnalysis.totalDependencies}`);
      console.log(`  Circular Dependencies: ${depAnalysis.circularDependencies.length}`);
      console.log(`  Shared Dependencies: ${depAnalysis.sharedDependencies.size}`);
      console.log(`  Orphaned Files: ${depAnalysis.orphanedFiles.length}`);
      console.log(`  Bundle Groups: ${Object.keys(depAnalysis.bundleGroups).length}`);
      
      // Show recommendations
      if (depAnalysis.recommendations && depAnalysis.recommendations.length > 0) {
        console.log('\n💡 Optimization Recommendations:');
        depAnalysis.recommendations.forEach(rec => {
          const icon = rec.type === 'error' ? '❌' : rec.type === 'warning' ? '⚠️' : 'ℹ️';
          console.log(`  ${icon} ${rec.category.toUpperCase()}: ${rec.message}`);
          console.log(`     Action: ${rec.action}`);
          console.log(`     Impact: ${rec.impact}\n`);
        });
      }
    }
    
    // Bundle Statistics
    if (bundleStats) {
      console.log('📦 Bundle Statistics:');
      console.log(`  Total Bundles: ${bundleStats.bundles.total}`);
      console.log(`  Cached Bundles: ${bundleStats.bundles.cached}`);
      console.log(`  Critical Bundles: ${bundleStats.bundles.critical}`);
      console.log(`  Lazy Load Bundles: ${bundleStats.bundles.lazyLoad}`);
      
      if (bundleStats.performance) {
        console.log(`  Average Bundle Time: ${bundleStats.performance.averageBundleTime.toFixed(2)}ms`);
        console.log(`  Compression Ratio: ${bundleStats.performance.compressionRatio.toFixed(1)}%`);
      }
    }
    
    // Bundle Details
    if (bundleResult && bundleResult.bundles.size > 0) {
      console.log('\n📁 Bundle Breakdown:');
      let totalSize = 0;
      let totalOriginal = 0;
      
      for (const [bundleName, bundle] of bundleResult.bundles) {
        totalSize += bundle.bundledSize;
        totalOriginal += bundle.originalSize || 0;
        const compression = bundle.originalSize ? ((bundle.originalSize - bundle.bundledSize) / bundle.originalSize * 100).toFixed(1) : '0';
        
        console.log(`  ${bundleName}:`);
        console.log(`    Size: ${this.formatBytes(bundle.bundledSize)}`);
        console.log(`    Original: ${this.formatBytes(bundle.originalSize || 0)}`);
        console.log(`    Compression: ${compression}%`);
        console.log(`    Files: ${bundle.files ? bundle.files.length : 0}\n`);
      }
      
      console.log(`Total Bundle Size: ${this.formatBytes(totalSize)}`);
      console.log(`Total Original Size: ${this.formatBytes(totalOriginal)}`);
      console.log(`Overall Compression: ${totalOriginal > 0 ? ((totalOriginal - totalSize) / totalOriginal * 100).toFixed(1) : '0'}%`);
    }
  }

  /**
   * Enable watch mode for development
   */
  async enableWatchMode() {
    if (!this.watchMode) return;
    
    console.log('👀 Watch mode enabled - watching for CSS changes...\n');
    
    // This is a simplified watch implementation
    // In a real implementation, you would use fs.watch or a library like chokidar
    const watchInterval = setInterval(async () => {
      try {
        // Check for file changes and rebuild if necessary
        await this.runBuild();
      } catch (error) {
        console.error('Watch build failed:', error.message);
      }
    }, this.config.watch.debounceMs);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n👋 Stopping watch mode...');
      clearInterval(watchInterval);
      process.exit(0);
    });
  }

  /**
   * Format bytes into human-readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Show CLI help information
   */
  showHelp() {
    console.log(`
${CLI_CONFIG.name} v${CLI_CONFIG.version}
${CLI_CONFIG.description}

Usage:
  npm run build:css [options]

Options:
  --mode <dev|prod>     Build mode (default: prod)
  --watch, -w           Enable watch mode
  --output, -o <dir>    Output directory (default: dist/css)
  --config, -c <file>   Configuration file
  --verbose, -v         Verbose logging
  --clean               Clean output directory first
  --analyze             Generate bundle analysis report
  --source-maps         Generate source maps
  --help, -h            Show this help

Examples:
  npm run build:css                    # Production build
  npm run build:css -- --mode dev     # Development build
  npm run build:css -- --watch        # Watch mode
  npm run build:css -- --analyze      # Bundle analysis
  npm run build:css -- --clean        # Clean and build

For more information, see: https://github.com/your-org/learnimals
`);
  }
}

/**
 * Main CLI execution function
 */
async function main() {
  const cli = new CSSBuildCLI();
  
  try {
    // Parse command line arguments
    await cli.parseArgs();
    
    // Run the build process
    if (!cli.watchMode) {
      await cli.runBuild();
    } else {
      await cli.runBuild();
      await cli.enableWatchMode();
    }
    
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    
    if (cli.verbose) {
      console.error('\nStack trace:', error.stack);
    }
    
    process.exit(1);
  }
}

// Execute CLI if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

export { CSSBuildCLI, main };