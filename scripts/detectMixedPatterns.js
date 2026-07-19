/**
 * Mixed Pattern Detection Script for Learnimals
 *
 * This script scans the codebase for files using mixed module patterns that need migration.
 * It identifies files with typeof module checks, global assignments, and CommonJS exports
 * alongside ES6 modules, providing detailed reports for migration planning.
 *
 * Usage:
 *   node scripts/detectMixedPatterns.js
 *   node scripts/detectMixedPatterns.js --output=report.json
 *   node scripts/detectMixedPatterns.js --verbose
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Patterns to detect mixed module usage
const MIXED_PATTERNS = {
  typeofModule: {
    regex:
      /if\s*\(\s*typeof\s+module\s*!==?\s*['"]undefined['"]\s*(?:&&\s*module\.exports)?\s*\)/gi,
    description: 'CommonJS module type check',
    severity: 'high',
  },
  moduleExports: {
    regex: /module\.exports\s*=|exports\.\w+\s*=/gi,
    description: 'CommonJS exports',
    severity: 'high',
  },
  globalAssignment: {
    regex: /window\.\w+\s*=/gi,
    description: 'Global namespace assignment',
    severity: 'high',
  },
  es6Export: {
    regex: /export\s+(default|{[^}]*}|\w+)/gi,
    description: 'ES6 exports',
    severity: 'info',
  },
  es6Import: {
    regex: /import\s+(?:\w+|\{[^}]*\}|[*]\s+as\s+\w+)\s+from\s+['"][^'"]+['"];?/gi,
    description: 'ES6 imports',
    severity: 'info',
  },
};

// File extensions to scan (JavaScript modules only)
const SCAN_EXTENSIONS = ['.js', '.mjs'];

// Pattern names that indicate CommonJS/global usage needing migration
const PROBLEMATIC_PATTERNS = ['typeofModule', 'moduleExports', 'globalAssignment'];

// Directories to ignore
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', 'coverage'];

class MixedPatternDetector {
  constructor(options = {}) {
    this.options = {
      verbose: options.verbose || false,
      outputFile: options.outputFile || null,
      rootPath: options.rootPath || path.join(rootDir, 'src'),
      ...options,
    };

    this.results = {
      scannedFiles: 0,
      mixedPatternFiles: [],
      cleanFiles: [],
      errors: [],
      summary: {},
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Scan all JavaScript files for mixed patterns
   */
  async scan() {
    console.log('🔍 Scanning for mixed module patterns...');
    console.log(`📁 Root path: ${this.options.rootPath}`);

    try {
      await this.scanDirectory(this.options.rootPath);
      await this.generateSummary();
      await this.outputResults();
    } catch (error) {
      console.error('❌ Error during scan:', error);
      this.results.errors.push(error.message);
    }
  }

  /**
   * Recursively scan directory for JavaScript files
   * @param {string} dirPath - Directory path to scan
   */
  async scanDirectory(dirPath) {
    const scannedFiles = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // Skip ignored directories
          if (IGNORE_DIRS.includes(entry.name)) {
            continue;
          }
          const nestedFiles = await this.scanDirectory(fullPath);
          scannedFiles.push(...nestedFiles);
        } else if (entry.isFile()) {
          // Check if file should be scanned
          if (this.isJavaScriptFile(entry.name)) {
            await this.scanFile(fullPath);
            scannedFiles.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error scanning directory ${dirPath}:`, error.message);
      this.results.errors.push(`Directory scan error: ${dirPath} - ${error.message}`);
    }

    return scannedFiles;
  }

  /**
   * Check whether a file is a JavaScript module that should be scanned
   * @param {string} fileName - File name or path
   * @returns {boolean} - True for JavaScript files (.js, .mjs)
   */
  isJavaScriptFile(fileName) {
    return SCAN_EXTENSIONS.includes(path.extname(fileName).toLowerCase());
  }

  /**
   * Detect problematic module patterns in a code string
   * @param {string} content - Source code to analyze
   * @param {string} [filePath] - Optional file path for reporting
   * @returns {Object} - Analysis with problematic patterns, mixed flag, and severity score
   */
  detectPatternsInCode(content, filePath = '') {
    const analysis = {
      path: filePath,
      patterns: [],
      hasMixedPatterns: false,
      hasES6: false,
      severityScore: 0,
    };

    for (const [patternName, pattern] of Object.entries(MIXED_PATTERNS)) {
      const matches = [...content.matchAll(pattern.regex)];
      if (matches.length === 0) {
        continue;
      }

      if (PROBLEMATIC_PATTERNS.includes(patternName)) {
        analysis.patterns.push({
          type: patternName,
          name: patternName,
          description: pattern.description,
          severity: pattern.severity,
          count: matches.length,
          locations: matches.map(match => ({
            match: match[0],
            index: match.index,
            line: this.getLineNumber(content, match.index),
          })),
        });
      } else {
        analysis.hasES6 = true;
      }
    }

    analysis.hasMixedPatterns = analysis.patterns.length > 0;
    analysis.severityScore = this.calculateSeverityScore(analysis.patterns);

    return analysis;
  }

  /**
   * Scan individual file for mixed patterns
   * @param {string} filePath - File path to scan
   */
  async scanFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const relativePath = path.relative(this.options.rootPath, filePath);

      this.results.scannedFiles++;

      const fileAnalysis = {
        path: relativePath,
        fullPath: filePath,
        patterns: [],
        hasMixedPatterns: false,
        lineCount: content.split('\n').length,
        size: content.length,
      };

      // Check for each pattern
      for (const [patternName, pattern] of Object.entries(MIXED_PATTERNS)) {
        const matches = [...content.matchAll(pattern.regex)];

        if (matches.length > 0) {
          const patternResult = {
            name: patternName,
            description: pattern.description,
            severity: pattern.severity,
            count: matches.length,
            locations: matches.map(match => ({
              match: match[0],
              index: match.index,
              line: this.getLineNumber(content, match.index),
            })),
          };

          fileAnalysis.patterns.push(patternResult);
        }
      }

      // Determine if file has mixed patterns
      const hasCommonJS = fileAnalysis.patterns.some(p =>
        ['typeofModule', 'moduleExports', 'globalAssignment'].includes(p.name)
      );
      const hasES6 = fileAnalysis.patterns.some(p => ['es6Export', 'es6Import'].includes(p.name));

      fileAnalysis.hasMixedPatterns = hasCommonJS && hasES6;
      fileAnalysis.hasGlobalPatterns = fileAnalysis.patterns.some(
        p => p.name === 'globalAssignment'
      );
      fileAnalysis.hasCommonJSOnly = hasCommonJS && !hasES6;
      fileAnalysis.hasES6Only = hasES6 && !hasCommonJS;

      // Calculate severity score
      fileAnalysis.severityScore = this.calculateSeverityScore(fileAnalysis.patterns);

      // Categorize file
      if (fileAnalysis.hasMixedPatterns || fileAnalysis.hasGlobalPatterns) {
        this.results.mixedPatternFiles.push(fileAnalysis);

        if (this.options.verbose) {
          console.log(`🔴 Mixed patterns found: ${relativePath}`);
          fileAnalysis.patterns.forEach(p => {
            console.log(`  - ${p.description}: ${p.count} occurrence(s)`);
          });
        }
      } else {
        this.results.cleanFiles.push({
          path: relativePath,
          hasES6Only: fileAnalysis.hasES6Only,
          hasCommonJSOnly: fileAnalysis.hasCommonJSOnly,
          lineCount: fileAnalysis.lineCount,
        });

        if (this.options.verbose && fileAnalysis.hasCommonJSOnly) {
          console.log(`🟡 CommonJS only: ${relativePath}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error scanning file ${filePath}:`, error.message);
      this.results.errors.push(`File scan error: ${filePath} - ${error.message}`);
    }
  }

  /**
   * Get line number for a character index
   * @param {string} content - File content
   * @param {number} index - Character index
   * @returns {number} - Line number (1-based)
   */
  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * Calculate severity score for file based on patterns
   * @param {Array} patterns - Array of detected patterns
   * @returns {number} - Severity score (0-100)
   */
  calculateSeverityScore(patterns) {
    const weights = {
      high: 30,
      medium: 15,
      low: 5,
      info: 1,
    };

    return patterns.reduce((score, pattern) => {
      return score + (weights[pattern.severity] || 0) * pattern.count;
    }, 0);
  }

  /**
   * Generate summary statistics
   */
  async generateSummary() {
    const summary = {
      totalFiles: this.results.scannedFiles,
      mixedPatternFiles: this.results.mixedPatternFiles.length,
      cleanFiles: this.results.cleanFiles.length,
      errorCount: this.results.errors.length,
      migrationPriority: [],
    };

    // Sort mixed pattern files by severity score for migration priority
    const sortedFiles = [...this.results.mixedPatternFiles].sort(
      (a, b) => b.severityScore - a.severityScore
    );

    summary.migrationPriority = sortedFiles.slice(0, 10).map(file => ({
      path: file.path,
      severityScore: file.severityScore,
      patternTypes: file.patterns.map(p => p.name),
      estimatedEffort: this.estimateMigrationEffort(file),
    }));

    // Pattern statistics
    summary.patternStats = {};
    for (const patternName of Object.keys(MIXED_PATTERNS)) {
      summary.patternStats[patternName] = {
        files: this.results.mixedPatternFiles.filter(f =>
          f.patterns.some(p => p.name === patternName)
        ).length,
        totalOccurrences: this.results.mixedPatternFiles.reduce((total, f) => {
          const pattern = f.patterns.find(p => p.name === patternName);
          return total + (pattern ? pattern.count : 0);
        }, 0),
      };
    }

    this.results.summary = summary;
  }

  /**
   * Estimate migration effort for a file
   * @param {Object} fileAnalysis - File analysis result
   * @returns {string} - Effort estimate
   */
  estimateMigrationEffort(fileAnalysis) {
    const score = fileAnalysis.severityScore;
    const lineCount = fileAnalysis.lineCount;

    if (score > 100 || lineCount > 500) return 'high';
    if (score > 50 || lineCount > 200) return 'medium';
    return 'low';
  }

  /**
   * Generate a human-readable scan report
   * Accepts results where mixedPatternFiles/cleanFiles are arrays or counts.
   * @returns {string} - Formatted report text
   */
  generateReport() {
    const results = this.results;
    const mixedPatternCount = Array.isArray(results.mixedPatternFiles)
      ? results.mixedPatternFiles.length
      : results.mixedPatternFiles || 0;
    const cleanFileCount = Array.isArray(results.cleanFiles)
      ? results.cleanFiles.length
      : results.cleanFiles || 0;

    const lines = [
      'Mixed Pattern Detection Report',
      '==============================',
      `Files scanned: ${results.scannedFiles}`,
      `Files with mixed patterns: ${mixedPatternCount}`,
      `Clean ES6 files: ${cleanFileCount}`,
    ];

    if (Array.isArray(results.mixedPatternFiles) && results.mixedPatternFiles.length > 0) {
      lines.push('', 'Files needing migration:');
      results.mixedPatternFiles.forEach(file => {
        const patternTypes = (file.patterns || []).map(p => p.type || p.name).join(', ');
        lines.push(`  - ${file.path} (severity: ${file.severityScore}, patterns: ${patternTypes})`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Output results to console and optionally to file
   */
  async outputResults() {
    console.log('\n📊 Scan Results Summary:');
    console.log(`   Total files scanned: ${this.results.summary.totalFiles}`);
    console.log(`   Files with mixed patterns: ${this.results.summary.mixedPatternFiles}`);
    console.log(`   Clean files: ${this.results.summary.cleanFiles}`);
    console.log(`   Errors: ${this.results.summary.errorCount}`);

    if (this.results.summary.mixedPatternFiles > 0) {
      console.log('\n🔴 Priority Migration Files:');
      this.results.summary.migrationPriority.forEach((file, index) => {
        console.log(
          `   ${index + 1}. ${file.path} (score: ${file.severityScore}, effort: ${file.estimatedEffort})`
        );
      });

      console.log('\n📈 Pattern Statistics:');
      for (const [pattern, stats] of Object.entries(this.results.summary.patternStats)) {
        if (stats.files > 0) {
          console.log(`   ${pattern}: ${stats.files} files, ${stats.totalOccurrences} occurrences`);
        }
      }
    }

    // Output to file if requested
    if (this.options.outputFile) {
      try {
        await fs.writeFile(this.options.outputFile, JSON.stringify(this.results, null, 2), 'utf8');
        console.log(`\n💾 Detailed results saved to: ${this.options.outputFile}`);
      } catch (error) {
        console.error(`❌ Error saving results: ${error.message}`);
      }
    }
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (const arg of args) {
    if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg.startsWith('--output=')) {
      options.outputFile = arg.split('=')[1];
    } else if (arg.startsWith('--root=')) {
      options.rootPath = arg.split('=')[1];
    }
  }

  const detector = new MixedPatternDetector(options);
  await detector.scan();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export default MixedPatternDetector;
