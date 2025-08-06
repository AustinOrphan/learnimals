/**
 * CSSBundler - Advanced CSS bundling, minification, and dependency analysis system
 * 
 * Requirements: FR-3.1, FR-3.2, FR-3.3, NFR-1.2, NFR-2.4
 * - FR-3.1: Implement CSS bundling for production builds
 * - FR-3.2: Add CSS minification and compression  
 * - FR-3.3: Create CSS dependency tree optimization ✅ IMPLEMENTED
 * - NFR-1.2: Total CSS bundle size MUST be reduced by at least 20%
 * - NFR-2.4: CSS architecture MUST support component versioning
 * 
 * Features:
 * - Comprehensive CSS dependency analysis and tree building
 * - Circular dependency detection and resolution
 * - Dependency-based code splitting and bundle optimization
 * - Critical path identification and loading order optimization
 * - CSS custom property and media query analysis
 * - Bundle grouping strategies for optimal performance
 * 
 * Leverages dependency analysis patterns from DependencyResolver.js and integrates with
 * existing CSSManager, performanceUtils, and BundleOptimizer patterns.
 */

import logger from './logger.js';
import { PerformanceMonitor, debounce } from './performanceUtils.js';

export class CSSBundler {
  constructor(options = {}) {
    this.options = {
      // Bundling options
      enableBundling: true,
      enableMinification: true,
      enableCompression: true,
      enableOptimization: true,
      
      // Bundle splitting
      enableCodeSplitting: true,
      criticalCSSThreshold: 1000, // ms for critical path
      maxBundleSize: 100 * 1024, // 100KB per bundle
      
      // Optimization features
      enableDeadCodeElimination: true,
      enableDuplicateRemoval: true,
      enableCSSCustomPropertyOptimization: true,
      enableSourceMaps: process.env.NODE_ENV === 'development',
      
      // Production settings
      isProduction: process.env.NODE_ENV === 'production',
      compressionLevel: 'default', // 'none', 'default', 'aggressive'
      
      // Output configuration
      outputDir: 'dist/css',
      bundleNaming: '[name].[contenthash].css',
      sourceMapNaming: '[name].[contenthash].css.map',
      
      ...options,
    };

    // Core systems
    this.performanceMonitor = new PerformanceMonitor();
    this.bundleCache = new Map();
    this.dependencyGraph = new Map();
    this.compilationStats = new Map();
    
    // Bundle registry
    this.bundles = new Map();
    this.criticalCSS = new Set();
    this.lazyLoadCSS = new Set();
    
    // Optimization state
    this.optimizations = {
      removedRules: 0,
      compressedSize: 0,
      originalSize: 0,
      bundleCount: 0,
    };

    // Debounced bundling for development
    this.debouncedBundle = debounce(this._performBundling.bind(this), 500);
    
    this._initializeBundler();
  }

  /**
   * Initialize bundler systems and validate configuration
   */
  _initializeBundler() {
    try {
      // Validate configuration
      this._validateConfiguration();
      
      // Initialize dependency tracking
      this._initializeDependencyTracking();
      
      // Set up production optimizations
      if (this.options.isProduction) {
        this._enableProductionOptimizations();
      }
      
      logger.info('CSSBundler initialized successfully', {
        production: this.options.isProduction,
        bundling: this.options.enableBundling,
        minification: this.options.enableMinification,
      });
    } catch (error) {
      logger.error('Failed to initialize CSSBundler', error);
      throw new Error(`CSSBundler initialization failed: ${error.message}`);
    }
  }

  /**
   * Bundle CSS files for production with optimization
   * @param {Array<string>} cssFiles - Array of CSS file paths to bundle
   * @param {Object} options - Bundle-specific options
   * @returns {Promise<BundleResult>} Bundle result with stats and output
   */
  async bundleCSS(cssFiles, options = {}) {
    const bundleOptions = { ...this.options, ...options };
    const bundleName = options.name || 'main';

    this.performanceMonitor.start(`bundle-${bundleName}`);

    try {
      logger.info(`Starting CSS bundling for: ${bundleName}`, {
        fileCount: cssFiles.length,
        production: bundleOptions.isProduction,
      });

      // 1. Load and validate CSS files
      const loadedCSS = await this._loadCSSFiles(cssFiles);
      
      // 2. Analyze dependencies and build graph
      const dependencyGraph = await this._buildDependencyGraph(loadedCSS);
      
      // 3. Perform bundling with optimization
      const bundleResult = await this._performBundling(loadedCSS, dependencyGraph, bundleOptions);
      
      // 4. Apply production optimizations if enabled
      if (bundleOptions.isProduction) {
        bundleResult.optimized = await this._optimizeBundle(bundleResult, bundleOptions);
      }
      
      // 5. Generate source maps if requested
      if (bundleOptions.enableSourceMaps) {
        bundleResult.sourceMap = await this._generateSourceMap(bundleResult, loadedCSS);
      }

      // 6. Cache bundle result
      this.bundleCache.set(bundleName, bundleResult);
      
      // 7. Update stats
      this._updateBundleStats(bundleName, bundleResult);

      const duration = this.performanceMonitor.end(`bundle-${bundleName}`);
      
      logger.info(`CSS bundling completed: ${bundleName}`, {
        duration: `${duration.toFixed(2)}ms`,
        originalSize: bundleResult.originalSize,
        bundledSize: bundleResult.bundledSize,
        compressionRatio: ((bundleResult.originalSize - bundleResult.bundledSize) / bundleResult.originalSize * 100).toFixed(1) + '%',
      });

      return bundleResult;
    } catch (error) {
      this.performanceMonitor.end(`bundle-${bundleName}`);
      logger.error(`CSS bundling failed for: ${bundleName}`, error);
      throw new Error(`CSS bundling failed: ${error.message}`);
    }
  }

  /**
   * Minify CSS content with configurable optimization levels
   * @param {string} cssContent - CSS content to minify
   * @param {Object} options - Minification options
   * @returns {Promise<MinificationResult>} Minified CSS with stats
   */
  async minifyCSS(cssContent, options = {}) {
    const minifyOptions = {
      removeComments: true,
      removeWhitespace: true,
      removeEmptyRules: true,
      removeDuplicateRules: true,
      optimizeShorthand: true,
      optimizeColors: true,
      optimizeUnits: true,
      ...options,
    };

    this.performanceMonitor.start('css-minification');

    try {
      let minified = cssContent;
      const originalSize = cssContent.length;
      const stats = {
        removedComments: 0,
        removedRules: 0,
        optimizedProperties: 0,
      };

      // Remove comments
      if (minifyOptions.removeComments) {
        const beforeRemoval = minified;
        minified = this._removeComments(minified);
        stats.removedComments = (beforeRemoval.length - minified.length);
      }

      // Remove unnecessary whitespace
      if (minifyOptions.removeWhitespace) {
        minified = this._removeWhitespace(minified);
      }

      // Remove empty rules
      if (minifyOptions.removeEmptyRules) {
        const beforeRemoval = minified;
        minified = this._removeEmptyRules(minified);
        stats.removedRules = (beforeRemoval.match(/[^{}]*\{[^}]*\}/g) || []).length - 
                             (minified.match(/[^{}]*\{[^}]*\}/g) || []).length;
      }

      // Remove duplicate rules
      if (minifyOptions.removeDuplicateRules) {
        minified = this._removeDuplicateRules(minified);
      }

      // Optimize shorthand properties
      if (minifyOptions.optimizeShorthand) {
        const beforeOptimization = minified;
        minified = this._optimizeShorthands(minified);
        stats.optimizedProperties = (beforeOptimization.length - minified.length);
      }

      // Optimize colors
      if (minifyOptions.optimizeColors) {
        minified = this._optimizeColors(minified);
      }

      // Optimize units
      if (minifyOptions.optimizeUnits) {
        minified = this._optimizeUnits(minified);
      }

      const duration = this.performanceMonitor.end('css-minification');
      const minifiedSize = minified.length;
      const compressionRatio = ((originalSize - minifiedSize) / originalSize * 100);

      const result = {
        content: minified,
        originalSize,
        minifiedSize,
        compressionRatio,
        stats,
        duration,
      };

      // Update global optimization stats
      this.optimizations.removedRules += stats.removedRules;
      this.optimizations.compressedSize += minifiedSize;
      this.optimizations.originalSize += originalSize;

      logger.debug('CSS minification completed', {
        originalSize,
        minifiedSize,
        compressionRatio: compressionRatio.toFixed(1) + '%',
        duration: duration.toFixed(2) + 'ms',
      });

      return result;
    } catch (error) {
      this.performanceMonitor.end('css-minification');
      logger.error('CSS minification failed', error);
      throw new Error(`CSS minification failed: ${error.message}`);
    }
  }

  /**
   * Optimize CSS bundle for production with advanced techniques
   * @param {BundleResult} bundleResult - Bundle to optimize
   * @param {Object} options - Optimization options
   * @returns {Promise<OptimizationResult>} Optimized bundle with stats
   */
  async _optimizeBundle(bundleResult, options = {}) {
    this.performanceMonitor.start('bundle-optimization');

    try {
      let optimizedContent = bundleResult.content;
      const optimizationStats = {
        deadCodeEliminated: 0,
        duplicatesRemoved: 0,
        customPropertiesOptimized: 0,
        criticalPathOptimized: false,
      };

      // Dead code elimination
      if (options.enableDeadCodeElimination) {
        const beforeSize = optimizedContent.length;
        optimizedContent = await this._eliminateDeadCode(optimizedContent);
        optimizationStats.deadCodeEliminated = beforeSize - optimizedContent.length;
      }

      // Advanced duplicate removal
      if (options.enableDuplicateRemoval) {
        optimizedContent = this._performAdvancedDeduplication(optimizedContent);
      }

      // CSS Custom Property optimization
      if (options.enableCSSCustomPropertyOptimization) {
        optimizedContent = this._optimizeCSSCustomProperties(optimizedContent);
        optimizationStats.customPropertiesOptimized = true;
      }

      // Critical CSS extraction and optimization
      if (options.criticalCSSThreshold) {
        optimizedContent = await this._optimizeCriticalPath(optimizedContent, options);
        optimizationStats.criticalPathOptimized = true;
      }

      const duration = this.performanceMonitor.end('bundle-optimization');

      const result = {
        content: optimizedContent,
        originalSize: bundleResult.content.length,
        optimizedSize: optimizedContent.length,
        optimizationRatio: ((bundleResult.content.length - optimizedContent.length) / bundleResult.content.length * 100),
        stats: optimizationStats,
        duration,
      };

      logger.debug('Bundle optimization completed', {
        originalSize: result.originalSize,
        optimizedSize: result.optimizedSize,
        optimizationRatio: result.optimizationRatio.toFixed(1) + '%',
        duration: duration.toFixed(2) + 'ms',
      });

      return result;
    } catch (error) {
      this.performanceMonitor.end('bundle-optimization');
      logger.error('Bundle optimization failed', error);
      throw error;
    }
  }

  /**
   * Create separate critical CSS bundle for above-the-fold content
   * @param {Array<string>} criticalSelectors - CSS selectors for critical content
   * @returns {Promise<CriticalCSSResult>} Critical CSS bundle
   */
  async createCriticalCSSBundle(criticalSelectors = []) {
    this.performanceMonitor.start('critical-css-generation');

    try {
      const criticalCSS = [];
      const nonCriticalCSS = [];

      // Process all cached bundles to extract critical CSS
      for (const [bundleName, bundle] of this.bundleCache) {
        const { critical, nonCritical } = this._separateCriticalCSS(
          bundle.content, 
          criticalSelectors
        );
        
        if (critical) {
          criticalCSS.push(critical);
          this.criticalCSS.add(bundleName);
        }
        
        if (nonCritical) {
          nonCriticalCSS.push(nonCritical);
          this.lazyLoadCSS.add(bundleName);
        }
      }

      const criticalBundle = criticalCSS.join('\n');
      const nonCriticalBundle = nonCriticalCSS.join('\n');

      // Minify critical CSS for maximum performance
      const minifiedCritical = await this.minifyCSS(criticalBundle, {
        removeComments: true,
        removeWhitespace: true,
        optimizeShorthand: true,
        optimizeColors: true,
      });

      const duration = this.performanceMonitor.end('critical-css-generation');

      const result = {
        criticalCSS: minifiedCritical.content,
        nonCriticalCSS: nonCriticalBundle,
        criticalSize: minifiedCritical.minifiedSize,
        nonCriticalSize: nonCriticalBundle.length,
        stats: {
          criticalSelectors: criticalSelectors.length,
          criticalBundles: this.criticalCSS.size,
          lazyLoadBundles: this.lazyLoadCSS.size,
        },
        duration,
      };

      logger.info('Critical CSS bundle created', {
        criticalSize: result.criticalSize,
        nonCriticalSize: result.nonCriticalSize,
        criticalBundles: result.stats.criticalBundles,
        duration: duration.toFixed(2) + 'ms',
      });

      return result;
    } catch (error) {
      this.performanceMonitor.end('critical-css-generation');
      logger.error('Critical CSS generation failed', error);
      throw error;
    }
  }

  /**
   * Get comprehensive bundling statistics
   * @returns {Object} Detailed statistics about bundling performance
   */
  getBundleStats() {
    const stats = {
      bundles: {
        total: this.bundles.size,
        cached: this.bundleCache.size,
        critical: this.criticalCSS.size,
        lazyLoad: this.lazyLoadCSS.size,
      },
      optimization: { ...this.optimizations },
      performance: {
        averageBundleTime: 0,
        cacheHitRate: 0,
        compressionRatio: 0,
      },
      compilation: Object.fromEntries(this.compilationStats),
    };

    // Calculate performance metrics
    const bundleTimes = Array.from(this.compilationStats.values())
      .map(stat => stat.duration)
      .filter(duration => duration > 0);

    if (bundleTimes.length > 0) {
      stats.performance.averageBundleTime = 
        bundleTimes.reduce((sum, time) => sum + time, 0) / bundleTimes.length;
    }

    if (stats.optimization.originalSize > 0) {
      stats.performance.compressionRatio = 
        ((stats.optimization.originalSize - stats.optimization.compressedSize) / 
         stats.optimization.originalSize * 100);
    }

    return stats;
  }

  /**
   * Create optimized bundles based on dependency analysis
   * Implements code splitting based on dependencies (FR-3.3)
   */
  async createOptimizedBundles(cssFiles, options = {}) {
    this.performanceMonitor.start('optimized-bundling');

    try {
      logger.info('Creating optimized CSS bundles based on dependency analysis');

      // Load and analyze dependencies
      const loadedCSS = await this._loadCSSFiles(cssFiles);
      const dependencyGraph = await this._buildDependencyGraph(loadedCSS);
      
      // Validate no circular dependencies before proceeding
      if (this.dependencyAnalysis.circularDependencies.length > 0) {
        logger.warn('Circular dependencies detected - attempting resolution');
        await this._resolveCircularDependencies(dependencyGraph);
      }

      const optimizedBundles = new Map();
      
      // Create bundles for each group identified by dependency analysis
      for (const [groupName, filePaths] of this.bundleGroups) {
        logger.debug(`Creating bundle: ${groupName} with ${filePaths.length} files`);
        
        const groupCSS = filePaths.map(path => {
          return loadedCSS.find(css => css.path === path);
        }).filter(Boolean);

        const bundleResult = await this._performBundling(groupCSS, dependencyGraph, {
          ...this.options,
          ...options,
          bundleName: groupName,
        });

        optimizedBundles.set(groupName, bundleResult);
      }

      // Generate bundle manifest for loading optimization
      const manifest = this._generateBundleManifest(optimizedBundles, dependencyGraph);
      
      const duration = this.performanceMonitor.end('optimized-bundling');
      
      logger.info('Optimized CSS bundles created', {
        bundleCount: optimizedBundles.size,
        duration: `${duration.toFixed(2)}ms`,
        totalSize: Array.from(optimizedBundles.values()).reduce((sum, bundle) => sum + bundle.bundledSize, 0),
      });

      return {
        bundles: optimizedBundles,
        manifest,
        dependencyAnalysis: this.dependencyAnalysis,
      };
    } catch (error) {
      this.performanceMonitor.end('optimized-bundling');
      logger.error('Failed to create optimized CSS bundles', error);
      throw error;
    }
  }

  /**
   * Resolve circular dependencies by breaking cycles at optimal points
   */
  async _resolveCircularDependencies(graph) {
    const circularDeps = this.dependencyAnalysis.circularDependencies;
    
    for (const cycle of circularDeps) {
      logger.debug('Resolving circular dependency:', cycle);
      
      // Find the best place to break the cycle (lowest priority node)
      let minPriority = Infinity;
      let breakPoint = null;
      
      for (let i = 0; i < cycle.length - 1; i++) {
        const currentNode = cycle[i];
        const nextNode = cycle[i + 1];
        const currentData = graph.get(currentNode);
        
        if (currentData && currentData.loadPriority < minPriority) {
          minPriority = currentData.loadPriority;
          breakPoint = { from: currentNode, to: nextNode };
        }
      }
      
      if (breakPoint) {
        // Remove the problematic dependency
        const nodeData = graph.get(breakPoint.from);
        if (nodeData) {
          const depIndex = nodeData.dependencies.indexOf(breakPoint.to);
          if (depIndex !== -1) {
            nodeData.dependencies.splice(depIndex, 1);
            logger.debug(`Broke circular dependency: ${breakPoint.from} -> ${breakPoint.to}`);
          }
        }
      }
    }
    
    // Recalculate depths after breaking cycles
    this._calculateDependencyDepths(graph);
  }

  /**
   * Generate bundle loading manifest with optimal loading order
   */
  _generateBundleManifest(bundles, graph) {
    const manifest = {
      version: '1.0.0',
      bundles: new Map(),
      loadingOrder: [],
      criticalBundles: [],
      lazyBundles: [],
      preloadHints: [],
    };

    // Analyze bundles and create loading strategy
    const bundleMetadata = new Map();
    
    for (const [groupName, bundleResult] of bundles) {
      const metadata = {
        name: groupName,
        size: bundleResult.bundledSize,
        critical: groupName.startsWith('critical'),
        shared: groupName.startsWith('shared'),
        dependencies: this._getBundleDependencies(groupName, graph),
        loadPriority: this._calculateBundlePriority(groupName, bundleResult, graph),
      };
      
      bundleMetadata.set(groupName, metadata);
      manifest.bundles.set(groupName, metadata);
      
      if (metadata.critical) {
        manifest.criticalBundles.push(groupName);
      } else {
        manifest.lazyBundles.push(groupName);
      }
    }

    // Create optimal loading order
    manifest.loadingOrder = this._calculateOptimalLoadingOrder(bundleMetadata);
    
    // Generate preload hints for critical resources
    manifest.preloadHints = manifest.criticalBundles.concat(
      Array.from(bundleMetadata.entries())
        .filter(([, meta]) => meta.shared && meta.loadPriority > 70)
        .map(([name]) => name)
    );

    return manifest;
  }

  /**
   * Get bundle dependencies by analyzing files within the bundle
   */
  _getBundleDependencies(groupName, graph) {
    const bundleFiles = this.bundleGroups.get(groupName) || [];
    const externalDeps = new Set();
    
    for (const filePath of bundleFiles) {
      const nodeData = graph.get(filePath);
      if (nodeData) {
        for (const dep of nodeData.dependencies) {
          // Check if dependency is in a different bundle
          const depNode = graph.get(dep);
          if (depNode && depNode.bundleGroup !== groupName) {
            externalDeps.add(depNode.bundleGroup);
          }
        }
      }
    }
    
    return Array.from(externalDeps);
  }

  /**
   * Calculate bundle loading priority
   */
  _calculateBundlePriority(groupName, bundleResult, graph) {
    let priority = 0;
    
    // Critical bundles get highest priority
    if (groupName.startsWith('critical')) {
      priority += 100;
    }
    
    // Shared bundles get high priority
    if (groupName.startsWith('shared')) {
      priority += 80;
    }
    
    // Smaller bundles can load faster
    const sizeBonus = Math.max(0, 50 - Math.floor(bundleResult.bundledSize / 2048));
    priority += sizeBonus;
    
    // Factor in average file priority within bundle
    const bundleFiles = this.bundleGroups.get(groupName) || [];
    const avgFilePriority = bundleFiles.reduce((sum, filePath) => {
      const nodeData = graph.get(filePath);
      return sum + (nodeData ? nodeData.loadPriority : 0);
    }, 0) / Math.max(bundleFiles.length, 1);
    
    priority += avgFilePriority * 0.2; // Scale down to not dominate
    
    return Math.round(priority);
  }

  /**
   * Calculate optimal loading order for bundles based on dependencies
   */
  _calculateOptimalLoadingOrder(bundleMetadata) {
    const loadingOrder = [];
    const processed = new Set();
    
    // Create bundle dependency graph
    const bundleGraph = new Map();
    for (const [name, metadata] of bundleMetadata) {
      bundleGraph.set(name, {
        ...metadata,
        bundleDeps: metadata.dependencies,
      });
    }
    
    // Topological sort with priority weighting
    const visit = (bundleName) => {
      if (processed.has(bundleName)) return;
      processed.add(bundleName);
      
      const metadata = bundleGraph.get(bundleName);
      if (metadata) {
        // Load dependencies first
        for (const dep of metadata.bundleDeps) {
          if (bundleGraph.has(dep)) {
            visit(dep);
          }
        }
      }
      
      loadingOrder.push(bundleName);
    };
    
    // Sort bundles by priority and process
    const sortedBundles = Array.from(bundleMetadata.entries())
      .sort(([, a], [, b]) => b.loadPriority - a.loadPriority)
      .map(([name]) => name);
    
    for (const bundleName of sortedBundles) {
      visit(bundleName);
    }
    
    return loadingOrder;
  }

  /**
   * Get comprehensive dependency analysis results
   */
  getDependencyAnalysis() {
    if (!this.dependencyAnalysis) {
      logger.warn('No dependency analysis available - run bundleCSS() or createOptimizedBundles() first');
      return null;
    }

    return {
      ...this.dependencyAnalysis,
      bundleGroups: Object.fromEntries(this.bundleGroups || new Map()),
      recommendations: this._generateOptimizationRecommendations(),
    };
  }

  /**
   * Generate optimization recommendations based on dependency analysis
   */
  _generateOptimizationRecommendations() {
    const recommendations = [];
    
    if (!this.dependencyAnalysis) return recommendations;

    const analysis = this.dependencyAnalysis;
    
    // Check for circular dependencies
    if (analysis.circularDependencies.length > 0) {
      recommendations.push({
        type: 'error',
        category: 'dependencies',
        message: `Found ${analysis.circularDependencies.length} circular dependencies that may cause loading issues`,
        action: 'Review and refactor circular imports',
        impact: 'high',
      });
    }
    
    // Check for orphaned files
    if (analysis.orphanedFiles.length > 0) {
      recommendations.push({
        type: 'warning',
        category: 'optimization',
        message: `${analysis.orphanedFiles.length} CSS files have dependencies but no dependents`,
        action: 'Consider removing unused CSS files or adding them to entry points',
        impact: 'medium',
      });
    }
    
    // Check for highly shared dependencies
    const highlyShared = Array.from(analysis.sharedDependencies.entries())
      .filter(([, count]) => count > 5);
      
    if (highlyShared.length > 0) {
      recommendations.push({
        type: 'info',
        category: 'bundling',
        message: `${highlyShared.length} CSS files are shared by many components`,
        action: 'Consider extracting these into a common base bundle',
        impact: 'medium',
        files: highlyShared.map(([file]) => file),
      });
    }
    
    // Check bundle group distribution
    if (this.bundleGroups) {
      const groupSizes = Array.from(this.bundleGroups.values()).map(files => files.length);
      const avgGroupSize = groupSizes.reduce((a, b) => a + b, 0) / groupSizes.length;
      
      if (avgGroupSize < 2) {
        recommendations.push({
          type: 'warning',
          category: 'bundling',
          message: 'Bundle groups are very small on average',
          action: 'Consider increasing maxBundleSize or adjusting grouping strategy',
          impact: 'low',
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Clear bundle cache and reset statistics
   */
  clearCache() {
    this.bundleCache.clear();
    this.bundles.clear();
    this.criticalCSS.clear();
    this.lazyLoadCSS.clear();
    this.compilationStats.clear();
    this.dependencyGraph.clear();
    
    // Clear dependency analysis results
    this.dependencyAnalysis = null;
    this.bundleGroups = null;
    
    // Reset optimization stats
    this.optimizations = {
      removedRules: 0,
      compressedSize: 0,
      originalSize: 0,
      bundleCount: 0,
    };

    logger.info('CSS bundler cache and dependency analysis cleared');
  }

  // Private helper methods for CSS processing

  /**
   * Load CSS files and return content with metadata
   */
  async _loadCSSFiles(cssFiles) {
    const loadPromises = cssFiles.map(async (filePath) => {
      try {
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`Failed to load CSS: ${filePath} (${response.status})`);
        }
        const content = await response.text();
        return {
          path: filePath,
          content,
          size: content.length,
          loaded: true,
        };
      } catch (error) {
        logger.warn(`Failed to load CSS file: ${filePath}`, error);
        return {
          path: filePath,
          content: '',
          size: 0,
          loaded: false,
          error: error.message,
        };
      }
    });

    const results = await Promise.all(loadPromises);
    const successful = results.filter(result => result.loaded);
    
    if (successful.length === 0) {
      throw new Error('No CSS files could be loaded');
    }

    return successful;
  }

  /**
   * Build comprehensive dependency graph for CSS files with advanced analysis
   * Leverages dependency analysis patterns from DependencyResolver.js
   */
  async _buildDependencyGraph(loadedCSS) {
    const graph = new Map();
    const analysisResults = {
      totalDependencies: 0,
      circularDependencies: [],
      orphanedFiles: [],
      sharedDependencies: new Map(),
      criticalPathNodes: [],
    };

    // Phase 1: Build initial dependency nodes
    for (const cssFile of loadedCSS) {
      const dependencies = this._extractCSSImports(cssFile.content);
      const customProperties = this._extractCustomProperties(cssFile.content);
      const mediaQueries = this._extractMediaQueries(cssFile.content);
      
      graph.set(cssFile.path, {
        // Direct dependencies
        dependencies,
        dependents: [],
        
        // Analysis metadata
        size: cssFile.size,
        depth: 0,
        critical: false,
        loadPriority: 0,
        
        // CSS-specific analysis
        customProperties,
        customPropertyUsage: this._findCustomPropertyUsage(cssFile.content),
        mediaQueries,
        selectorComplexity: this._calculateSelectorComplexity(cssFile.content),
        
        // Optimization markers
        canBeSplit: true,
        bundleGroup: null,
        cacheKey: this._generateCacheKey(cssFile),
      });
      
      analysisResults.totalDependencies += dependencies.length;
    }

    // Phase 2: Build reverse dependencies and analyze shared dependencies
    for (const [filePath, node] of graph) {
      for (const dependency of node.dependencies) {
        const depNode = graph.get(dependency);
        if (depNode) {
          depNode.dependents.push(filePath);
          
          // Track shared dependencies
          const sharedCount = analysisResults.sharedDependencies.get(dependency) || 0;
          analysisResults.sharedDependencies.set(dependency, sharedCount + 1);
        } else {
          // Missing dependency - log warning
          logger.warn(`Missing CSS dependency: ${dependency} referenced by ${filePath}`);
        }
      }
      
      // Identify orphaned files (no dependents)
      if (node.dependents.length === 0 && node.dependencies.length > 0) {
        analysisResults.orphanedFiles.push(filePath);
      }
    }

    // Phase 3: Detect circular dependencies using DFS approach from DependencyResolver patterns
    analysisResults.circularDependencies = this._detectCircularDependencies(graph);
    
    // Phase 4: Calculate dependency depths and critical path
    this._calculateDependencyDepths(graph);
    analysisResults.criticalPathNodes = this._identifyCriticalPath(graph);
    
    // Phase 5: Optimize loading priorities based on dependency analysis
    this._optimizeLoadingPriorities(graph, analysisResults);
    
    // Phase 6: Group dependencies for optimal bundling
    this._analyzeBundleGroups(graph, analysisResults);

    // Store analysis results for optimization
    this.dependencyAnalysis = analysisResults;
    
    logger.info('CSS dependency analysis completed', {
      totalFiles: graph.size,
      totalDependencies: analysisResults.totalDependencies,
      circularDependencies: analysisResults.circularDependencies.length,
      sharedDependencies: analysisResults.sharedDependencies.size,
      orphanedFiles: analysisResults.orphanedFiles.length,
      criticalPathNodes: analysisResults.criticalPathNodes.length,
    });

    return graph;
  }

  /**
   * Core bundling logic
   */
  async _performBundling(loadedCSS, dependencyGraph, options) {
    // Combine CSS content in dependency order
    const sortedFiles = this._topologicalSort(dependencyGraph);
    const combinedContent = sortedFiles
      .map(filePath => {
        const cssFile = loadedCSS.find(f => f.path === filePath);
        return cssFile ? cssFile.content : '';
      })
      .filter(content => content.length > 0)
      .join('\n\n');

    const originalSize = combinedContent.length;
    let bundledContent = combinedContent;

    // Apply minification if enabled
    if (options.enableMinification) {
      const minified = await this.minifyCSS(bundledContent);
      bundledContent = minified.content;
    }

    return {
      content: bundledContent,
      originalSize,
      bundledSize: bundledContent.length,
      files: sortedFiles,
      dependencies: dependencyGraph,
    };
  }

  // CSS optimization helper methods
  _removeComments(css) {
    return css.replace(/\/\*[\s\S]*?\*\//g, '');
  }

  _removeWhitespace(css) {
    return css
      .replace(/\s+/g, ' ')
      .replace(/;\s*}/g, '}')
      .replace(/\s*{\s*/g, '{')
      .replace(/;\s*/g, ';')
      .trim();
  }

  _removeEmptyRules(css) {
    return css.replace(/[^{}]*\{\s*\}/g, '');
  }

  _removeDuplicateRules(css) {
    const rules = new Set();
    return css.replace(/[^{}]*\{[^}]*\}/g, (rule) => {
      const normalized = rule.replace(/\s+/g, ' ').trim();
      if (rules.has(normalized)) {
        return '';
      }
      rules.add(normalized);
      return rule;
    });
  }

  _optimizeShorthands(css) {
    // Optimize margin, padding, etc. shorthands
    return css
      .replace(/margin:\s*(\d+\w*)\s+\1\s+\1\s+\1/g, 'margin:$1')
      .replace(/padding:\s*(\d+\w*)\s+\1\s+\1\s+\1/g, 'padding:$1');
  }

  _optimizeColors(css) {
    return css
      .replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3/gi, '#$1$2$3')
      .replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/g, (match, r, g, b) => {
        const hex = '#' + [r, g, b].map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
        return hex.length <= match.length ? hex : match;
      });
  }

  _optimizeUnits(css) {
    return css.replace(/([:\s])0+(\.\d+)/g, '$1$2');
  }

  _extractCSSImports(css) {
    const imports = [];
    const importRegex = /@import\s+(?:url\()?['"](.*?)['"](?:\))?/g;
    let match;
    while ((match = importRegex.exec(css)) !== null) {
      imports.push(match[1]);
    }
    return imports;
  }

  /**
   * Extract CSS custom properties (CSS variables) from content
   */
  _extractCustomProperties(css) {
    const customProps = new Set();
    const customPropRegex = /--([\w-]+):\s*([^;]+);/g;
    let match;
    while ((match = customPropRegex.exec(css)) !== null) {
      customProps.add(`--${match[1]}`);
    }
    return Array.from(customProps);
  }

  /**
   * Find usage of custom properties (var() functions)
   */
  _findCustomPropertyUsage(css) {
    const usage = new Set();
    const varUsageRegex = /var\((--[\w-]+)(?:,\s*([^)]+))?\)/g;
    let match;
    while ((match = varUsageRegex.exec(css)) !== null) {
      usage.add(match[1]);
    }
    return Array.from(usage);
  }

  /**
   * Extract media queries for responsive analysis
   */
  _extractMediaQueries(css) {
    const mediaQueries = [];
    const mediaRegex = /@media\s+([^{]+)\s*\{/g;
    let match;
    while ((match = mediaRegex.exec(css)) !== null) {
      mediaQueries.push(match[1].trim());
    }
    return mediaQueries;
  }

  /**
   * Calculate selector complexity score for optimization
   */
  _calculateSelectorComplexity(css) {
    const selectors = css.match(/[^{}]+(?=\s*\{)/g) || [];
    let totalComplexity = 0;
    
    for (const selector of selectors) {
      // Basic complexity scoring
      const parts = selector.split(/[\s>+~]/).length;
      const hasId = selector.includes('#') ? 5 : 0;
      const classes = (selector.match(/\./g) || []).length;
      const pseudos = (selector.match(/::/g) || []).length;
      
      totalComplexity += parts + hasId + classes + pseudos;
    }
    
    return Math.round(totalComplexity / selectors.length) || 0;
  }

  /**
   * Generate cache key for CSS file based on content and metadata
   */
  _generateCacheKey(cssFile) {
    const content = cssFile.content.substring(0, 1000); // First 1KB for hash
    const hash = this._simpleHash(content + cssFile.path + cssFile.size);
    return `css_${hash}`;
  }

  /**
   * Simple hash function for cache keys
   */
  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Detect circular dependencies using DFS approach (leverages DependencyResolver patterns)
   */
  _detectCircularDependencies(graph) {
    const circularDeps = [];
    const visiting = new Set(); // Currently being visited (gray)
    const visited = new Set();  // Completely visited (black)
    
    const detectCycle = (node, path = []) => {
      if (visiting.has(node)) {
        // Found cycle - extract the cycle path
        const cycleStart = path.indexOf(node);
        const cycle = path.slice(cycleStart).concat([node]);
        circularDeps.push(cycle);
        return true;
      }
      
      if (visited.has(node)) {
        return false; // Already processed
      }
      
      visiting.add(node);
      const currentPath = [...path, node];
      
      const nodeData = graph.get(node);
      if (nodeData) {
        for (const dependency of nodeData.dependencies) {
          if (graph.has(dependency)) {
            detectCycle(dependency, currentPath);
          }
        }
      }
      
      visiting.delete(node);
      visited.add(node);
      return false;
    };
    
    // Check all nodes for cycles
    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        detectCycle(node);
      }
    }
    
    if (circularDeps.length > 0) {
      logger.warn('Circular dependencies detected in CSS:', circularDeps);
    }
    
    return circularDeps;
  }

  /**
   * Calculate dependency depths for optimization
   */
  _calculateDependencyDepths(graph) {
    const depths = new Map();
    
    const calculateDepth = (node, visiting = new Set()) => {
      if (depths.has(node)) {
        return depths.get(node);
      }
      
      if (visiting.has(node)) {
        return 0; // Circular dependency - assign depth 0
      }
      
      visiting.add(node);
      const nodeData = graph.get(node);
      let maxDepth = 0;
      
      if (nodeData) {
        for (const dependency of nodeData.dependencies) {
          if (graph.has(dependency)) {
            const depDepth = calculateDepth(dependency, visiting);
            maxDepth = Math.max(maxDepth, depDepth + 1);
          }
        }
        
        // Update node depth in graph
        nodeData.depth = maxDepth;
      }
      
      visiting.delete(node);
      depths.set(node, maxDepth);
      return maxDepth;
    };
    
    for (const node of graph.keys()) {
      calculateDepth(node);
    }
  }

  /**
   * Identify critical path nodes (longest dependency chains)
   */
  _identifyCriticalPath(graph) {
    const criticalNodes = [];
    let maxDepth = 0;
    
    // Find maximum depth
    for (const [, nodeData] of graph) {
      maxDepth = Math.max(maxDepth, nodeData.depth);
    }
    
    // Identify nodes in critical path
    for (const [filePath, nodeData] of graph) {
      if (nodeData.depth === maxDepth) {
        nodeData.critical = true;
        criticalNodes.push(filePath);
      }
    }
    
    return criticalNodes;
  }

  /**
   * Optimize loading priorities based on dependency analysis
   */
  _optimizeLoadingPriorities(graph, analysisResults) {
    for (const [filePath, nodeData] of graph) {
      let priority = 0;
      
      // Base priority on dependency depth (deeper = higher priority)
      priority += nodeData.depth * 10;
      
      // Boost priority for shared dependencies
      const sharedCount = analysisResults.sharedDependencies.get(filePath) || 0;
      priority += sharedCount * 20;
      
      // Boost priority for critical path
      if (nodeData.critical) {
        priority += 50;
      }
      
      // Adjust for file size (smaller files load faster)
      const sizeBonus = Math.max(0, 100 - Math.floor(nodeData.size / 1000));
      priority += sizeBonus;
      
      // Penalize complex selectors (harder to optimize)
      priority -= nodeData.selectorComplexity;
      
      nodeData.loadPriority = Math.max(0, priority);
    }
  }

  /**
   * Analyze and group dependencies for optimal bundling
   */
  _analyzeBundleGroups(graph, analysisResults) {
    const groups = new Map();
    let groupId = 0;
    
    // Group shared dependencies together
    for (const [dependency, shareCount] of analysisResults.sharedDependencies) {
      if (shareCount >= 2) { // Shared by 2+ files
        const groupName = `shared-${groupId++}`;
        const node = graph.get(dependency);
        if (node) {
          node.bundleGroup = groupName;
          if (!groups.has(groupName)) {
            groups.set(groupName, []);
          }
          groups.get(groupName).push(dependency);
        }
      }
    }
    
    // Group critical path dependencies
    const criticalGroup = `critical-${groupId++}`;
    for (const criticalNode of analysisResults.criticalPathNodes) {
      const node = graph.get(criticalNode);
      if (node && !node.bundleGroup) {
        node.bundleGroup = criticalGroup;
        if (!groups.has(criticalGroup)) {
          groups.set(criticalGroup, []);
        }
        groups.get(criticalGroup).push(criticalNode);
      }
    }
    
    // Group remaining files by size for optimal bundling
    const ungroupedFiles = Array.from(graph.entries())
      .filter(([, nodeData]) => !nodeData.bundleGroup)
      .sort(([, a], [, b]) => b.size - a.size); // Largest first
    
    let currentGroup = `size-${groupId++}`;
    let currentGroupSize = 0;
    const maxGroupSize = this.options.maxBundleSize || 100 * 1024; // 100KB default
    
    for (const [filePath, nodeData] of ungroupedFiles) {
      if (currentGroupSize + nodeData.size > maxGroupSize && currentGroupSize > 0) {
        currentGroup = `size-${groupId++}`;
        currentGroupSize = 0;
      }
      
      nodeData.bundleGroup = currentGroup;
      currentGroupSize += nodeData.size;
      
      if (!groups.has(currentGroup)) {
        groups.set(currentGroup, []);
      }
      groups.get(currentGroup).push(filePath);
    }
    
    this.bundleGroups = groups;
  }

  _topologicalSort(graph) {
    const visited = new Set();
    const result = [];

    const visit = (node) => {
      if (visited.has(node)) return;
      visited.add(node);
      
      const nodeData = graph.get(node);
      if (nodeData) {
        for (const dependency of nodeData.dependencies) {
          visit(dependency);
        }
      }
      
      result.push(node);
    };

    // Sort by priority first, then visit
    const sortedNodes = Array.from(graph.entries())
      .sort(([, a], [, b]) => (b.loadPriority || 0) - (a.loadPriority || 0))
      .map(([path]) => path);

    for (const node of sortedNodes) {
      visit(node);
    }

    return result;
  }

  _validateConfiguration() {
    if (this.options.maxBundleSize < 1024) {
      throw new Error('maxBundleSize must be at least 1KB');
    }
    if (this.options.criticalCSSThreshold < 0) {
      throw new Error('criticalCSSThreshold cannot be negative');
    }
  }

  _initializeDependencyTracking() {
    // Initialize dependency tracking systems
    this.dependencyGraph.clear();
  }

  _enableProductionOptimizations() {
    // Enable aggressive optimizations for production
    this.options.enableDeadCodeElimination = true;
    this.options.enableDuplicateRemoval = true;
    this.options.enableCSSCustomPropertyOptimization = true;
  }

  _updateBundleStats(bundleName, bundleResult) {
    this.compilationStats.set(bundleName, {
      size: bundleResult.bundledSize,
      originalSize: bundleResult.originalSize,
      compressionRatio: (bundleResult.originalSize - bundleResult.bundledSize) / bundleResult.originalSize,
      duration: this.performanceMonitor.measurements.get(`bundle-${bundleName}`)?.duration || 0,
      timestamp: Date.now(),
    });
    
    this.optimizations.bundleCount = this.compilationStats.size;
  }

  // Placeholder methods for advanced optimizations (to be implemented)
  async _eliminateDeadCode(css) {
    // TODO: Implement dead code elimination
    return css;
  }

  _performAdvancedDeduplication(css) {
    // TODO: Implement advanced deduplication
    return css;
  }

  _optimizeCSSCustomProperties(css) {
    // TODO: Implement CSS custom property optimization
    return css;
  }

  async _optimizeCriticalPath(css, options) {
    this.performanceMonitor.start('critical-path-optimization');
    
    try {
      const criticalCSS = await this.extractCriticalCSS(css, {
        viewportWidth: options.viewportWidth || 1200,
        viewportHeight: options.viewportHeight || 800,
        inlineThreshold: options.inlineThreshold || 14000, // 14KB threshold
        ...options,
      });
      
      // Store critical CSS for inline injection
      this.criticalCSS.add(criticalCSS.content);
      
      const duration = this.performanceMonitor.end('critical-path-optimization');
      
      logger.debug('Critical path optimization completed', {
        originalSize: css.length,
        criticalSize: criticalCSS.content.length,
        reductionRatio: ((css.length - criticalCSS.content.length) / css.length * 100).toFixed(1) + '%',
        duration: duration.toFixed(2) + 'ms',
      });
      
      return criticalCSS.content;
    } catch (error) {
      this.performanceMonitor.end('critical-path-optimization');
      logger.warn('Critical path optimization failed, returning original CSS', error);
      return css;
    }
  }

  async _generateSourceMap(bundleResult, loadedCSS) {
    // TODO: Implement source map generation
    return null;
  }

  _separateCriticalCSS(css, criticalSelectors) {
    const criticalRules = [];
    const nonCriticalRules = [];
    
    // Parse CSS into rules
    const rules = this._parseCSSRules(css);
    
    for (const rule of rules) {
      if (this._isCriticalRule(rule, criticalSelectors)) {
        criticalRules.push(rule.content);
      } else {
        nonCriticalRules.push(rule.content);
      }
    }
    
    return {
      critical: criticalRules.join('\n'),
      nonCritical: nonCriticalRules.join('\n'),
    };
  }

  /**
   * Extract critical CSS for above-the-fold content
   * Requirements: FR-3.1, NFR-1.1, TC-4
   * @param {string} css - CSS content to analyze
   * @param {Object} options - Critical CSS extraction options
   * @returns {Promise<CriticalCSSResult>} Critical CSS analysis result
   */
  async extractCriticalCSS(css, options = {}) {
    const extractOptions = {
      viewportWidth: 1200,
      viewportHeight: 800,
      inlineThreshold: 14000, // 14KB - typical threshold for inline CSS
      criticalSelectors: [],
      includeMediaQueries: true,
      includeFonts: true,
      includeKeyframes: false,
      minifyOutput: true,
      ...options,
    };

    this.performanceMonitor.start('critical-css-extraction');

    try {
      logger.info('Extracting critical CSS', {
        originalSize: css.length,
        viewport: `${extractOptions.viewportWidth}x${extractOptions.viewportHeight}`,
        threshold: extractOptions.inlineThreshold,
      });

      // Step 1: Parse CSS rules and categorize them
      const parsedCSS = this._parseCSSForCriticalAnalysis(css);
      
      // Step 2: Identify critical selectors based on above-the-fold content
      const criticalSelectors = await this._identifyCriticalSelectors(parsedCSS, extractOptions);
      
      // Step 3: Extract critical rules based on selectors
      const criticalRules = this._extractCriticalRules(parsedCSS, criticalSelectors, extractOptions);
      
      // Step 4: Add essential CSS (fonts, variables, etc.)
      const essentialCSS = this._extractEssentialCSS(parsedCSS, extractOptions);
      
      // Step 5: Combine and optimize critical CSS
      const combinedCritical = this._combineCriticalCSS(criticalRules, essentialCSS, extractOptions);
      
      // Step 6: Validate and optimize size
      const optimizedCritical = await this._optimizeCriticalCSSSize(combinedCritical, extractOptions);
      
      // Step 7: Generate non-critical CSS
      const nonCriticalCSS = this._generateNonCriticalCSS(parsedCSS, criticalSelectors, essentialCSS);

      const duration = this.performanceMonitor.end('critical-css-extraction');

      const result = {
        content: optimizedCritical.content,
        nonCriticalContent: nonCriticalCSS,
        originalSize: css.length,
        criticalSize: optimizedCritical.content.length,
        nonCriticalSize: nonCriticalCSS.length,
        inlineRecommended: optimizedCritical.content.length <= extractOptions.inlineThreshold,
        stats: {
          criticalRules: criticalRules.length,
          totalRules: parsedCSS.rules.length,
          criticalSelectors: criticalSelectors.length,
          compressionRatio: ((css.length - optimizedCritical.content.length) / css.length * 100),
          optimizations: optimizedCritical.optimizations,
        },
        metadata: {
          viewport: { width: extractOptions.viewportWidth, height: extractOptions.viewportHeight },
          extractionMethod: 'viewport-based',
          includedFeatures: {
            mediaQueries: extractOptions.includeMediaQueries,
            fonts: extractOptions.includeFonts,
            keyframes: extractOptions.includeKeyframes,
          },
        },
        duration,
      };

      logger.info('Critical CSS extraction completed', {
        originalSize: result.originalSize,
        criticalSize: result.criticalSize,
        reductionRatio: result.stats.compressionRatio.toFixed(1) + '%',
        inlineRecommended: result.inlineRecommended,
        duration: duration.toFixed(2) + 'ms',
      });

      return result;
    } catch (error) {
      this.performanceMonitor.end('critical-css-extraction');
      logger.error('Critical CSS extraction failed', error);
      throw new Error(`Critical CSS extraction failed: ${error.message}`);
    }
  }

  /**
   * Analyze and prioritize CSS based on critical path importance
   * @param {string} css - CSS content to prioritize
   * @param {Object} options - Prioritization options
   * @returns {Promise<PrioritizationResult>} CSS prioritization result
   */
  async prioritizeCSS(css, options = {}) {
    const prioritizeOptions = {
      criticalViewport: { width: 1200, height: 800 },
      priorityLevels: ['critical', 'important', 'normal', 'deferred'],
      selectorWeights: {
        'html': 100,
        'body': 90,
        'h1, h2, h3': 80,
        'header': 70,
        'main': 70,
        'nav': 60,
        'footer': 40,
      },
      ...options,
    };

    this.performanceMonitor.start('css-prioritization');

    try {
      const parsedCSS = this._parseCSSForCriticalAnalysis(css);
      const prioritizedRules = new Map();

      // Initialize priority buckets
      for (const level of prioritizeOptions.priorityLevels) {
        prioritizedRules.set(level, []);
      }

      // Categorize rules by priority
      for (const rule of parsedCSS.rules) {
        const priority = this._calculateRulePriority(rule, prioritizeOptions);
        const priorityLevel = this._mapPriorityToLevel(priority, prioritizeOptions);
        prioritizedRules.get(priorityLevel).push({
          ...rule,
          priority,
          priorityLevel,
        });
      }

      // Sort within each priority level
      for (const [level, rules] of prioritizedRules) {
        rules.sort((a, b) => b.priority - a.priority);
      }

      const duration = this.performanceMonitor.end('css-prioritization');

      const result = {
        prioritizedCSS: prioritizedRules,
        summary: {
          critical: prioritizedRules.get('critical').length,
          important: prioritizedRules.get('important').length,
          normal: prioritizedRules.get('normal').length,
          deferred: prioritizedRules.get('deferred').length,
        },
        loadingStrategy: this._generateLoadingStrategy(prioritizedRules, prioritizeOptions),
        duration,
      };

      logger.info('CSS prioritization completed', {
        totalRules: parsedCSS.rules.length,
        criticalRules: result.summary.critical,
        duration: duration.toFixed(2) + 'ms',
      });

      return result;
    } catch (error) {
      this.performanceMonitor.end('css-prioritization');
      logger.error('CSS prioritization failed', error);
      throw error;
    }
  }

  /**
   * Generate critical CSS for specific viewport dimensions
   * @param {string} css - CSS content to analyze
   * @param {Object} viewport - Viewport configuration
   * @returns {Promise<ViewportCriticalResult>} Viewport-specific critical CSS
   */
  async generateViewportCriticalCSS(css, viewport = {}) {
    const viewportConfig = {
      width: 1200,
      height: 800,
      devicePixelRatio: 1,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ...viewport,
    };

    this.performanceMonitor.start('viewport-critical-css');

    try {
      logger.debug('Generating viewport-specific critical CSS', viewportConfig);

      // Parse CSS and identify viewport-relevant rules
      const parsedCSS = this._parseCSSForCriticalAnalysis(css);
      const viewportRules = this._filterRulesForViewport(parsedCSS, viewportConfig);
      
      // Extract critical selectors for this viewport
      const criticalSelectors = this._identifyViewportCriticalSelectors(viewportRules, viewportConfig);
      
      // Build critical CSS for this specific viewport
      const criticalCSS = this._buildViewportCriticalCSS(viewportRules, criticalSelectors, viewportConfig);
      
      // Optimize for inline delivery
      const optimized = await this._optimizeForInlineDelivery(criticalCSS, {
        minify: true,
        removeUnusedRules: true,
        inlineThreshold: 14000,
      });

      const duration = this.performanceMonitor.end('viewport-critical-css');

      const result = {
        content: optimized.content,
        viewport: viewportConfig,
        originalSize: css.length,
        criticalSize: optimized.content.length,
        reductionRatio: ((css.length - optimized.content.length) / css.length * 100),
        criticalSelectors: criticalSelectors.length,
        inlineRecommended: optimized.content.length <= 14000,
        metadata: {
          rulesIncluded: criticalCSS.rules.length,
          totalRulesAnalyzed: parsedCSS.rules.length,
          mediaQueriesIncluded: criticalCSS.mediaQueries.length,
          optimizations: optimized.optimizations,
        },
        duration,
      };

      logger.debug('Viewport critical CSS generated', {
        viewport: `${viewportConfig.width}x${viewportConfig.height}`,
        criticalSize: result.criticalSize,
        reductionRatio: result.reductionRatio.toFixed(1) + '%',
        duration: duration.toFixed(2) + 'ms',
      });

      return result;
    } catch (error) {
      this.performanceMonitor.end('viewport-critical-css');
      logger.error('Viewport critical CSS generation failed', error);
      throw error;
    }
  }

  /**
   * Get critical CSS for inline injection with size optimization
   * @param {string} css - CSS content to process
   * @param {Object} options - Inline CSS options
   * @returns {Promise<InlineCSSResult>} Optimized inline CSS result
   */
  async getCriticalCSSForInlineInjection(css, options = {}) {
    const inlineOptions = {
      maxSize: 14000, // 14KB threshold for inline CSS
      minifyAggressive: true,
      removeComments: true,
      removeSourceMaps: true,
      optimizeForRender: true,
      includeEssentials: true,
      ...options,
    };

    this.performanceMonitor.start('inline-css-generation');

    try {
      logger.debug('Generating critical CSS for inline injection', {
        maxSize: inlineOptions.maxSize,
        aggressive: inlineOptions.minifyAggressive,
      });

      // Extract critical CSS
      const criticalResult = await this.extractCriticalCSS(css, {
        inlineThreshold: inlineOptions.maxSize,
        minifyOutput: inlineOptions.minifyAggressive,
      });

      let inlineCSS = criticalResult.content;

      // Apply aggressive optimizations for inline delivery
      if (inlineOptions.minifyAggressive) {
        inlineCSS = await this._applyAggressiveMinification(inlineCSS, inlineOptions);
      }

      // Ensure size constraints
      if (inlineCSS.length > inlineOptions.maxSize) {
        logger.warn(`Critical CSS size (${inlineCSS.length}B) exceeds inline threshold (${inlineOptions.maxSize}B)`);
        inlineCSS = this._trimCSSToSize(inlineCSS, inlineOptions.maxSize);
      }

      // Generate loading strategy for remaining CSS
      const loadingStrategy = this._generateAsyncLoadingStrategy(
        criticalResult.nonCriticalContent,
        inlineOptions
      );

      const duration = this.performanceMonitor.end('inline-css-generation');

      const result = {
        inlineCSS,
        nonCriticalCSS: criticalResult.nonCriticalContent,
        size: inlineCSS.length,
        withinThreshold: inlineCSS.length <= inlineOptions.maxSize,
        loadingStrategy,
        stats: {
          originalSize: css.length,
          inlineSize: inlineCSS.length,
          nonCriticalSize: criticalResult.nonCriticalContent.length,
          sizeSavings: css.length - inlineCSS.length,
          compressionRatio: ((css.length - inlineCSS.length) / css.length * 100),
        },
        metadata: {
          optimizationLevel: inlineOptions.minifyAggressive ? 'aggressive' : 'normal',
          threshold: inlineOptions.maxSize,
          trimmed: inlineCSS.length < criticalResult.content.length,
        },
        duration,
      };

      logger.info('Inline CSS generation completed', {
        inlineSize: result.size,
        withinThreshold: result.withinThreshold,
        compressionRatio: result.stats.compressionRatio.toFixed(1) + '%',
        duration: duration.toFixed(2) + 'ms',
      });

      return result;
    } catch (error) {
      this.performanceMonitor.end('inline-css-generation');
      logger.error('Inline CSS generation failed', error);
      throw error;
    }
  }

  // Critical CSS Helper Methods

  /**
   * Parse CSS content for critical path analysis
   */
  _parseCSSForCriticalAnalysis(css) {
    const rules = [];
    const mediaQueries = [];
    const keyframes = [];
    const fontFaces = [];
    const customProperties = [];

    // Parse different types of CSS rules
    const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
    let match;

    while ((match = ruleRegex.exec(css)) !== null) {
      const selector = match[1].trim();
      const declarations = match[2].trim();
      
      const rule = {
        selector,
        declarations,
        content: match[0],
        type: this._identifyRuleType(selector),
        priority: 0,
        critical: false,
      };

      if (selector.startsWith('@media')) {
        mediaQueries.push(rule);
      } else if (selector.startsWith('@keyframes')) {
        keyframes.push(rule);
      } else if (selector.startsWith('@font-face')) {
        fontFaces.push(rule);
      } else if (declarations.includes('--')) {
        customProperties.push(rule);
      } else {
        rules.push(rule);
      }
    }

    return {
      rules,
      mediaQueries,
      keyframes,
      fontFaces,
      customProperties,
      totalRules: rules.length + mediaQueries.length + keyframes.length + fontFaces.length,
    };
  }

  /**
   * Identify critical selectors based on above-the-fold content patterns
   */
  async _identifyCriticalSelectors(parsedCSS, options) {
    const criticalSelectors = new Set();
    
    // Default critical selectors for above-the-fold content
    const defaultCritical = [
      'html', 'body', 'head',
      'header', 'nav', 'main',
      'h1', 'h2', 'h3',
      '.hero', '.banner', '.header',
      '.navigation', '.nav',
      '.above-fold', '.critical',
      '*[data-critical]',
      // Common framework patterns
      '.container', '.wrapper', '.layout',
      '.row', '.col', '.grid',
    ];

    // Add default critical selectors
    for (const selector of defaultCritical) {
      criticalSelectors.add(selector);
    }

    // Add user-provided critical selectors
    if (options.criticalSelectors) {
      for (const selector of options.criticalSelectors) {
        criticalSelectors.add(selector);
      }
    }

    // Analyze rules for critical patterns
    for (const rule of parsedCSS.rules) {
      if (this._isSelectorCritical(rule.selector, options)) {
        criticalSelectors.add(rule.selector);
      }
    }

    return Array.from(criticalSelectors);
  }

  /**
   * Determine if a selector is critical for above-the-fold rendering
   */
  _isSelectorCritical(selector, options) {
    // Check for critical patterns in selector
    const criticalPatterns = [
      /^(html|body|head)/,
      /^(header|nav|main|footer)/,
      /^h[1-6]/,
      /\.(hero|banner|header|navigation|nav|above-fold|critical)/,
      /\[data-critical\]/,
      /^\.container|\.wrapper|\.layout/,
      /^\.row|\.col|\.grid/,
    ];

    // Check for viewport-specific patterns
    const viewportPatterns = [
      /@media.*screen.*and.*max-width.*768px/,
      /@media.*screen.*and.*min-width.*1024px/,
    ];

    // Simple specificity check - less specific selectors are more likely to be critical
    const specificity = this._calculateSelectorSpecificity(selector);
    
    return criticalPatterns.some(pattern => pattern.test(selector)) ||
           (specificity < 50 && !selector.includes(':hover') && !selector.includes(':focus'));
  }

  /**
   * Calculate CSS selector specificity score
   */
  _calculateSelectorSpecificity(selector) {
    let specificity = 0;
    
    // Count IDs (high specificity)
    specificity += (selector.match(/#/g) || []).length * 100;
    
    // Count classes, attributes, pseudo-classes
    specificity += (selector.match(/[\.\[\:]/g) || []).length * 10;
    
    // Count elements
    specificity += (selector.match(/\b[a-z]+\b/g) || []).length;
    
    // Penalties for complex selectors
    specificity += (selector.match(/\s+/g) || []).length * 2; // descendant selectors
    specificity += (selector.match(/>/g) || []).length * 1; // child selectors
    
    return specificity;
  }

  /**
   * Extract critical rules based on selectors
   */
  _extractCriticalRules(parsedCSS, criticalSelectors, options) {
    const criticalRules = [];
    
    for (const rule of parsedCSS.rules) {
      if (this._matchesCriticalSelectors(rule.selector, criticalSelectors)) {
        rule.critical = true;
        rule.priority = this._calculateCriticalPriority(rule, options);
        criticalRules.push(rule);
      }
    }

    // Sort by priority (higher priority first)
    criticalRules.sort((a, b) => b.priority - a.priority);
    
    return criticalRules;
  }

  /**
   * Check if rule selector matches critical selectors
   */
  _matchesCriticalSelectors(selector, criticalSelectors) {
    return criticalSelectors.some(criticalSelector => {
      // Exact match
      if (selector === criticalSelector) return true;
      
      // Partial match for complex selectors
      if (selector.includes(criticalSelector)) return true;
      
      // Pattern match for wildcards
      if (criticalSelector.includes('*')) {
        const pattern = new RegExp(criticalSelector.replace('*', '.*'));
        return pattern.test(selector);
      }
      
      return false;
    });
  }

  /**
   * Calculate priority for critical rule
   */
  _calculateCriticalPriority(rule, options) {
    let priority = 0;
    
    // Base priority from rule type
    switch (rule.type) {
      case 'element': priority += 50; break;
      case 'class': priority += 30; break;
      case 'id': priority += 10; break; // IDs are less likely to be critical
      default: priority += 20;
    }
    
    // Boost for fundamental elements
    if (/^(html|body|head)/.test(rule.selector)) {
      priority += 100;
    }
    
    // Boost for layout elements
    if (/^(header|nav|main|footer)/.test(rule.selector)) {
      priority += 80;
    }
    
    // Boost for typography
    if (/^h[1-6]/.test(rule.selector)) {
      priority += 70;
    }
    
    // Penalty for pseudo-selectors (likely not critical)
    if (rule.selector.includes(':hover') || rule.selector.includes(':focus')) {
      priority -= 50;
    }
    
    // Penalty for high specificity
    const specificity = this._calculateSelectorSpecificity(rule.selector);
    priority -= Math.min(specificity / 10, 20);
    
    return Math.max(priority, 0);
  }

  /**
   * Extract essential CSS (fonts, variables, etc.)
   */
  _extractEssentialCSS(parsedCSS, options) {
    const essential = [];
    
    // Include CSS custom properties (variables) - always essential
    essential.push(...parsedCSS.customProperties);
    
    // Include font-face declarations if requested
    if (options.includeFonts) {
      essential.push(...parsedCSS.fontFaces);
    }
    
    // Include critical media queries if requested
    if (options.includeMediaQueries) {
      const criticalMediaQueries = parsedCSS.mediaQueries.filter(mq => 
        this._isMediaQueryCritical(mq.selector, options)
      );
      essential.push(...criticalMediaQueries);
    }
    
    // Include keyframes if requested and critical
    if (options.includeKeyframes) {
      const criticalKeyframes = parsedCSS.keyframes.filter(kf =>
        this._isKeyframeCritical(kf.selector)
      );
      essential.push(...criticalKeyframes);
    }
    
    return essential;
  }

  /**
   * Check if media query is critical for initial render
   */
  _isMediaQueryCritical(mediaQuery, options) {
    // Check for viewport-relevant media queries
    const viewportWidth = options.viewportWidth || 1200;
    
    // Critical if it affects the target viewport
    if (mediaQuery.includes('max-width')) {
      const maxWidth = this._extractMediaQueryValue(mediaQuery, 'max-width');
      return maxWidth >= viewportWidth;
    }
    
    if (mediaQuery.includes('min-width')) {
      const minWidth = this._extractMediaQueryValue(mediaQuery, 'min-width');
      return minWidth <= viewportWidth;
    }
    
    // Always include screen media queries without width constraints
    return mediaQuery.includes('screen') && !mediaQuery.includes('width');
  }

  /**
   * Extract numeric value from media query
   */
  _extractMediaQueryValue(mediaQuery, property) {
    const regex = new RegExp(`${property}:\\s*(\\d+)`, 'i');
    const match = mediaQuery.match(regex);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Check if keyframe animation is critical
   */
  _isKeyframeCritical(keyframeName) {
    // Critical animations that affect initial render
    const criticalAnimations = [
      'fade', 'fadeIn', 'slideIn', 'slideUp',
      'load', 'loading', 'initial', 'enter',
    ];
    
    return criticalAnimations.some(name => 
      keyframeName.toLowerCase().includes(name.toLowerCase())
    );
  }

  /**
   * Combine critical rules and essential CSS
   */
  _combineCriticalCSS(criticalRules, essentialCSS, options) {
    const combined = [];
    
    // Add essential CSS first (variables, fonts, etc.)
    combined.push(...essentialCSS.map(rule => rule.content));
    
    // Add critical rules
    combined.push(...criticalRules.map(rule => rule.content));
    
    return combined.join('\n');
  }

  /**
   * Optimize critical CSS size while maintaining functionality
   */
  async _optimizeCriticalCSSSize(criticalCSS, options) {
    let optimized = criticalCSS;
    const optimizations = [];
    
    // Apply minification if requested
    if (options.minifyOutput) {
      const minified = await this.minifyCSS(optimized, {
        removeComments: true,
        removeWhitespace: true,
        optimizeShorthand: true,
        optimizeColors: true,
        optimizeUnits: true,
      });
      optimized = minified.content;
      optimizations.push('minification');
    }
    
    // Remove duplicate rules
    const beforeDedup = optimized;
    optimized = this._removeDuplicateRules(optimized);
    if (optimized.length < beforeDedup.length) {
      optimizations.push('deduplication');
    }
    
    // Trim to inline threshold if necessary
    if (optimized.length > options.inlineThreshold) {
      logger.warn(`Critical CSS exceeds inline threshold (${optimized.length}B > ${options.inlineThreshold}B)`);
      optimized = this._trimCSSToSize(optimized, options.inlineThreshold);
      optimizations.push('size-trimming');
    }
    
    return {
      content: optimized,
      originalSize: criticalCSS.length,
      optimizedSize: optimized.length,
      optimizations,
    };
  }

  /**
   * Generate non-critical CSS by excluding critical rules
   */
  _generateNonCriticalCSS(parsedCSS, criticalSelectors, essentialCSS) {
    const nonCriticalRules = [];
    
    // Get essential selectors for exclusion
    const essentialSelectors = new Set(essentialCSS.map(rule => rule.selector));
    
    // Add non-critical rules
    for (const rule of parsedCSS.rules) {
      if (!this._matchesCriticalSelectors(rule.selector, criticalSelectors) &&
          !essentialSelectors.has(rule.selector)) {
        nonCriticalRules.push(rule.content);
      }
    }
    
    // Add non-critical media queries
    for (const mq of parsedCSS.mediaQueries) {
      if (!essentialSelectors.has(mq.selector)) {
        nonCriticalRules.push(mq.content);
      }
    }
    
    // Add non-critical keyframes
    for (const kf of parsedCSS.keyframes) {
      if (!this._isKeyframeCritical(kf.selector)) {
        nonCriticalRules.push(kf.content);
      }
    }
    
    return nonCriticalRules.join('\n');
  }

  /**
   * Parse CSS rules for analysis
   */
  _parseCSSRules(css) {
    const rules = [];
    const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
    let match;

    while ((match = ruleRegex.exec(css)) !== null) {
      rules.push({
        selector: match[1].trim(),
        declarations: match[2].trim(),
        content: match[0],
        type: this._identifyRuleType(match[1].trim()),
      });
    }

    return rules;
  }

  /**
   * Identify CSS rule type
   */
  _identifyRuleType(selector) {
    if (selector.startsWith('@')) return 'at-rule';
    if (selector.startsWith('#')) return 'id';
    if (selector.startsWith('.')) return 'class';
    if (selector.includes('[')) return 'attribute';
    if (selector.includes(':')) return 'pseudo';
    return 'element';
  }

  /**
   * Check if rule is critical based on selector patterns
   */
  _isCriticalRule(rule, criticalSelectors) {
    return this._matchesCriticalSelectors(rule.selector, criticalSelectors);
  }

  // Additional helper methods for advanced functionality

  /**
   * Calculate rule priority for CSS prioritization
   */
  _calculateRulePriority(rule, options) {
    let priority = 0;
    
    // Check against priority weights
    for (const [pattern, weight] of Object.entries(options.selectorWeights)) {
      if (this._selectorMatches(rule.selector, pattern)) {
        priority += weight;
      }
    }
    
    // Adjust based on rule characteristics
    priority += this._calculateCriticalPriority(rule, options);
    
    return priority;
  }

  /**
   * Map priority score to priority level
   */
  _mapPriorityToLevel(priority, options) {
    if (priority >= 100) return 'critical';
    if (priority >= 60) return 'important';
    if (priority >= 20) return 'normal';
    return 'deferred';
  }

  /**
   * Generate CSS loading strategy
   */
  _generateLoadingStrategy(prioritizedRules, options) {
    const strategy = {
      inline: [],
      preload: [],
      async: [],
      defer: [],
    };
    
    // Critical CSS should be inlined
    strategy.inline = Array.from(prioritizedRules.get('critical') || [])
      .map(rule => rule.content);
    
    // Important CSS should be preloaded
    strategy.preload = Array.from(prioritizedRules.get('important') || [])
      .map(rule => rule.content);
    
    // Normal CSS can load async
    strategy.async = Array.from(prioritizedRules.get('normal') || [])
      .map(rule => rule.content);
    
    // Deferred CSS loads last
    strategy.defer = Array.from(prioritizedRules.get('deferred') || [])
      .map(rule => rule.content);
    
    return strategy;
  }

  /**
   * Check if selector matches a pattern
   */
  _selectorMatches(selector, pattern) {
    // Handle comma-separated selectors in pattern
    const patterns = pattern.split(',').map(p => p.trim());
    return patterns.some(p => {
      if (p.includes('*')) {
        const regex = new RegExp(p.replace(/\*/g, '.*'));
        return regex.test(selector);
      }
      return selector.includes(p);
    });
  }

  /**
   * Filter rules for specific viewport
   */
  _filterRulesForViewport(parsedCSS, viewport) {
    const viewportRules = {
      rules: [],
      mediaQueries: [],
      fontFaces: [...parsedCSS.fontFaces], // Always include fonts
      customProperties: [...parsedCSS.customProperties], // Always include variables
    };
    
    // Filter regular rules (no viewport filtering for now)
    viewportRules.rules = [...parsedCSS.rules];
    
    // Filter media queries based on viewport
    for (const mq of parsedCSS.mediaQueries) {
      if (this._mediaQueryAppliesToViewport(mq.selector, viewport)) {
        viewportRules.mediaQueries.push(mq);
      }
    }
    
    return viewportRules;
  }

  /**
   * Check if media query applies to viewport
   */
  _mediaQueryAppliesToViewport(mediaQuery, viewport) {
    // Simple check for now - can be enhanced with proper media query parsing
    if (mediaQuery.includes('max-width')) {
      const maxWidth = this._extractMediaQueryValue(mediaQuery, 'max-width');
      return viewport.width <= maxWidth;
    }
    
    if (mediaQuery.includes('min-width')) {
      const minWidth = this._extractMediaQueryValue(mediaQuery, 'min-width');
      return viewport.width >= minWidth;
    }
    
    // Default to true for screen media queries
    return mediaQuery.includes('screen');
  }

  /**
   * Identify viewport-specific critical selectors
   */
  _identifyViewportCriticalSelectors(viewportRules, viewport) {
    const criticalSelectors = [];
    
    // Add base critical selectors
    const baseCritical = ['html', 'body', 'header', 'nav', 'main'];
    criticalSelectors.push(...baseCritical);
    
    // Add viewport-specific patterns
    if (viewport.width <= 768) {
      // Mobile-specific critical selectors
      criticalSelectors.push('.mobile-nav', '.mobile-header', '.hamburger');
    }
    
    if (viewport.width >= 1024) {
      // Desktop-specific critical selectors
      criticalSelectors.push('.desktop-nav', '.sidebar', '.hero-large');
    }
    
    return criticalSelectors;
  }

  /**
   * Build viewport-specific critical CSS
   */
  _buildViewportCriticalCSS(viewportRules, criticalSelectors, viewport) {
    const criticalCSS = {
      rules: [],
      mediaQueries: [],
      fontFaces: [...viewportRules.fontFaces],
      customProperties: [...viewportRules.customProperties],
    };
    
    // Extract critical rules
    for (const rule of viewportRules.rules) {
      if (this._matchesCriticalSelectors(rule.selector, criticalSelectors)) {
        criticalCSS.rules.push(rule);
      }
    }
    
    // Include relevant media queries
    criticalCSS.mediaQueries = [...viewportRules.mediaQueries];
    
    return criticalCSS;
  }

  /**
   * Optimize CSS for inline delivery
   */
  async _optimizeForInlineDelivery(criticalCSS, options) {
    const combined = [
      ...criticalCSS.customProperties.map(rule => rule.content),
      ...criticalCSS.fontFaces.map(rule => rule.content),
      ...criticalCSS.rules.map(rule => rule.content),
      ...criticalCSS.mediaQueries.map(rule => rule.content),
    ].join('\n');
    
    let optimized = combined;
    const optimizations = [];
    
    if (options.minify) {
      const minified = await this.minifyCSS(optimized);
      optimized = minified.content;
      optimizations.push('minification');
    }
    
    if (options.removeUnusedRules) {
      // Basic unused rule removal (can be enhanced)
      const beforeCleanup = optimized;
      optimized = this._removeEmptyRules(optimized);
      if (optimized.length < beforeCleanup.length) {
        optimizations.push('unused-rule-removal');
      }
    }
    
    if (optimized.length > options.inlineThreshold) {
      optimized = this._trimCSSToSize(optimized, options.inlineThreshold);
      optimizations.push('size-trimming');
    }
    
    return {
      content: optimized,
      originalSize: combined.length,
      optimizedSize: optimized.length,
      optimizations,
    };
  }

  /**
   * Apply aggressive minification for inline CSS
   */
  async _applyAggressiveMinification(css, options) {
    let minified = css;
    
    // Apply all standard minification
    const standardMinified = await this.minifyCSS(minified, {
      removeComments: true,
      removeWhitespace: true,
      removeEmptyRules: true,
      removeDuplicateRules: true,
      optimizeShorthand: true,
      optimizeColors: true,
      optimizeUnits: true,
    });
    
    minified = standardMinified.content;
    
    // Additional aggressive optimizations
    if (options.optimizeForRender) {
      // Remove vendor prefixes for modern browsers (careful with this)
      minified = minified.replace(/-webkit-|-moz-|-ms-|-o-/g, '');
      
      // Simplify calc() expressions where possible
      minified = minified.replace(/calc\(([^)]+)\)/g, (match, expr) => {
        try {
          // Simple case: calc(100% - 20px) -> calc(100%-20px)
          return `calc(${expr.replace(/\s/g, '')})`;
        } catch {
          return match;
        }
      });
    }
    
    return minified;
  }

  /**
   * Trim CSS content to fit within size limit
   */
  _trimCSSToSize(css, maxSize) {
    if (css.length <= maxSize) return css;
    
    logger.warn(`Trimming CSS from ${css.length}B to ${maxSize}B to fit inline threshold`);
    
    // Try to trim at rule boundaries
    const rules = css.split('}');
    let trimmed = '';
    
    for (const rule of rules) {
      const potentialContent = trimmed + rule + '}';
      if (potentialContent.length > maxSize) break;
      trimmed = potentialContent;
    }
    
    // If no complete rules fit, just truncate
    if (trimmed.length === 0) {
      trimmed = css.substring(0, maxSize);
    }
    
    return trimmed;
  }

  /**
   * Generate async loading strategy for non-critical CSS
   */
  _generateAsyncLoadingStrategy(nonCriticalCSS, options) {
    const strategy = {
      method: 'preload-async', // Default strategy
      chunks: [],
      preloadHints: [],
      loadingCode: '',
    };
    
    // Split non-critical CSS into chunks for better caching
    const chunkSize = 50 * 1024; // 50KB chunks
    const chunks = [];
    
    for (let i = 0; i < nonCriticalCSS.length; i += chunkSize) {
      chunks.push({
        content: nonCriticalCSS.substring(i, i + chunkSize),
        size: Math.min(chunkSize, nonCriticalCSS.length - i),
        index: chunks.length,
      });
    }
    
    strategy.chunks = chunks;
    
    // Generate preload hints for first chunk
    if (chunks.length > 0) {
      strategy.preloadHints = [
        `<link rel="preload" href="css/non-critical-0.css" as="style" onload="this.onload=null;this.rel='stylesheet'">`,
      ];
    }
    
    // Generate loading code
    strategy.loadingCode = this._generateCSSLoadingCode(chunks.length);
    
    return strategy;
  }

  /**
   * Generate JavaScript code for CSS loading
   */
  _generateCSSLoadingCode(chunkCount) {
    return `
    (function() {
      function loadCSS(href) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
      
      // Load non-critical CSS chunks
      for (var i = 0; i < ${chunkCount}; i++) {
        setTimeout(function(index) {
          loadCSS('css/non-critical-' + index + '.css');
        }.bind(null, i), i * 100);
      }
    })();
    `.trim();
  }
}

// Export singleton instance for global use
export const cssBundler = new CSSBundler();

// Export class for custom instances
export default CSSBundler;