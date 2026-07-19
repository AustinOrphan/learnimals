/**
 * Mixed Pattern Migration Script for Learnimals
 *
 * This script automatically converts files with mixed module patterns to clean ES6 modules.
 * It removes CommonJS/global patterns, creates backups, and validates the conversion.
 *
 * Usage:
 *   node scripts/migrateMixedPatterns.js
 *   node scripts/migrateMixedPatterns.js --dry-run
 *   node scripts/migrateMixedPatterns.js --file=src/components/ui/Card.js
 *   node scripts/migrateMixedPatterns.js --backup-dir=backups
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import MixedPatternDetector from './detectMixedPatterns.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Migration patterns and their replacements
const MIGRATION_RULES = [
  {
    name: 'removeCommonJSExport',
    description: 'Remove CommonJS module.exports and global assignments',
    pattern:
      /\/\/\s*Export for module usage[\s\S]*?if\s*\(\s*typeof\s+module\s*!==?\s*['"]undefined['"]\s*(?:&&\s*module\.exports)?\s*\)\s*\{[\s\S]*?\}\s*(?:else\s*\{[\s\S]*?\}\s*)?/gi,
    replacement: '',
    priority: 1,
  },
  {
    name: 'removeStandaloneGlobalAssignment',
    description: 'Remove standalone global window assignments',
    pattern: /window\.\w+\s*=\s*\w+\s*;?\s*$/gm,
    replacement: '',
    priority: 2,
  },
  {
    name: 'removeStandaloneModuleExports',
    description: 'Remove standalone module.exports assignments',
    pattern: /module\.exports\s*=\s*\w+\s*;?\s*$/gm,
    replacement: '',
    priority: 3,
  },
  {
    name: 'cleanupEmptyLines',
    description: 'Clean up multiple consecutive empty lines',
    pattern: /\n\s*\n\s*\n/g,
    replacement: '\n\n',
    priority: 10,
    cosmetic: true,
  },
  {
    name: 'trimTrailingWhitespace',
    description: 'Remove trailing whitespace',
    pattern: /[ \t]+$/gm,
    replacement: '',
    priority: 11,
    cosmetic: true,
  },
];

class MixedPatternMigrator {
  constructor(options = {}) {
    this.options = {
      dryRun: options.dryRun || false,
      backupDir: options.backupDir || path.join(rootDir, 'migration-backups'),
      targetFile: options.targetFile || null,
      verbose: options.verbose || false,
      validateAfter: options.validateAfter !== false,
      ...options,
    };

    this.results = {
      processed: 0,
      migrated: 0,
      skipped: 0,
      errors: [],
      migrations: [],
      backups: [],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Run the migration process
   */
  async migrate() {
    console.log('🔧 Starting mixed pattern migration...');

    if (this.options.dryRun) {
      console.log('🟡 DRY RUN MODE - No files will be modified');
    }

    try {
      // Ensure backup directory exists
      await this.ensureBackupDirectory();

      // Get files to migrate
      const filesToMigrate = await this.getFilesToMigrate();

      if (filesToMigrate.length === 0) {
        console.log('✅ No files need migration');
        return this.results;
      }

      console.log(`📝 Found ${filesToMigrate.length} files to migrate`);

      // Process each file
      for (const fileInfo of filesToMigrate) {
        await this.migrateFile(fileInfo);
      }

      // Generate summary
      await this.generateMigrationSummary();
    } catch (error) {
      console.error('❌ Migration failed:', error);
      this.results.errors.push(error.message);
    }

    return this.results;
  }

  /**
   * Ensure backup directory exists
   */
  async ensureBackupDirectory() {
    if (!this.options.dryRun) {
      try {
        await fs.mkdir(this.options.backupDir, { recursive: true });
        console.log(`📁 Backup directory: ${this.options.backupDir}`);
      } catch (error) {
        throw new Error(`Failed to create backup directory: ${error.message}`);
      }
    }
  }

  /**
   * Get list of files that need migration
   * @returns {Array} - Array of file information objects
   */
  async getFilesToMigrate() {
    if (this.options.targetFile) {
      // Migrate specific file
      const filePath = path.resolve(this.options.targetFile);
      return [
        {
          path: path.relative(path.join(rootDir, 'src'), filePath),
          fullPath: filePath,
          hasMixedPatterns: true, // Assume true for targeted files
        },
      ];
    } else {
      // Use detector to find files needing migration
      const detector = new MixedPatternDetector({
        verbose: false,
        rootPath: path.join(rootDir, 'src'),
      });

      await detector.scan();

      return detector.results.mixedPatternFiles.map(file => ({
        path: file.path,
        fullPath: file.fullPath,
        hasMixedPatterns: file.hasMixedPatterns,
        patterns: file.patterns,
        severityScore: file.severityScore,
      }));
    }
  }

  /**
   * Migrate a single file
   * @param {Object} fileInfo - File information object
   */
  async migrateFile(fileInfo) {
    console.log(`🔄 Processing: ${fileInfo.path}`);
    this.results.processed++;

    try {
      // Read original file content
      const originalContent = await fs.readFile(fileInfo.fullPath, 'utf8');

      // Apply migration rules
      const migrationResult = this.applyMigrationRules(originalContent, fileInfo);

      if (!migrationResult.hasChanges) {
        console.log(`⏭️  No changes needed: ${fileInfo.path}`);
        this.results.skipped++;
        return;
      }

      // Create backup if not dry run
      let backupPath = null;
      if (!this.options.dryRun) {
        backupPath = await this.createBackup(fileInfo, originalContent);
      }

      // Write migrated content if not dry run
      if (!this.options.dryRun) {
        await fs.writeFile(fileInfo.fullPath, migrationResult.migratedContent, 'utf8');
      }

      // Validate migration if requested
      if (this.options.validateAfter && !this.options.dryRun) {
        await this.validateMigration(fileInfo, migrationResult);
      }

      // Record successful migration
      const migrationRecord = {
        filePath: fileInfo.path,
        fullPath: fileInfo.fullPath,
        backupPath,
        appliedRules: migrationResult.appliedRules,
        changesSummary: migrationResult.changesSummary,
        originalSize: originalContent.length,
        migratedSize: migrationResult.migratedContent.length,
        timestamp: new Date().toISOString(),
      };

      this.results.migrations.push(migrationRecord);
      this.results.migrated++;

      if (this.options.verbose) {
        console.log(`✅ Migrated: ${fileInfo.path}`);
        migrationResult.appliedRules.forEach(rule => {
          console.log(`   - ${rule.description}: ${rule.changes} change(s)`);
        });
      } else {
        console.log(
          `✅ Migrated: ${fileInfo.path} (${migrationResult.appliedRules.length} rules applied)`
        );
      }
    } catch (error) {
      console.error(`❌ Error migrating ${fileInfo.path}:`, error.message);
      this.results.errors.push(`Migration error for ${fileInfo.path}: ${error.message}`);
    }
  }

  /**
   * Apply migration rules to file content
   * @param {string} content - Original file content
   * @param {Object} fileInfo - File information
   * @returns {Object} - Migration result
   */
  applyMigrationRules(content, _fileInfo) {
    let migratedContent = content;
    const appliedRules = [];
    let structuralChanges = 0;
    let totalChanges = 0;

    // Sort rules by priority
    const sortedRules = [...MIGRATION_RULES].sort((a, b) => a.priority - b.priority);

    const applyRule = rule => {
      const beforeLength = migratedContent.length;
      const beforeMatches = migratedContent.match(rule.pattern);
      const matchCount = beforeMatches ? beforeMatches.length : 0;

      if (matchCount > 0) {
        migratedContent = migratedContent.replace(rule.pattern, rule.replacement);
        appliedRules.push({
          name: rule.name,
          description: rule.description,
          changes: matchCount,
          sizeDelta: migratedContent.length - beforeLength,
        });
        totalChanges += matchCount;
      }

      return matchCount;
    };

    // Apply structural rules first; cosmetic cleanup only runs when a real
    // migration happened so clean files are never rewritten.
    for (const rule of sortedRules.filter(rule => !rule.cosmetic)) {
      structuralChanges += applyRule(rule);
    }

    if (structuralChanges > 0) {
      for (const rule of sortedRules.filter(rule => rule.cosmetic)) {
        applyRule(rule);
      }
    }

    // Additional validation: ensure ES6 export exists
    if (structuralChanges > 0 && !migratedContent.includes('export default')) {
      // Try to determine the component/class name for export
      const classMatch = migratedContent.match(/class\s+(\w+)/);
      const functionMatch = migratedContent.match(/function\s+(\w+)/);
      const constMatch = migratedContent.match(/const\s+(\w+)\s*=/);

      const exportName = classMatch?.[1] || functionMatch?.[1] || constMatch?.[1];

      if (exportName) {
        migratedContent += `\nexport default ${exportName};\n`;
        appliedRules.push({
          name: 'addES6Export',
          description: 'Add missing ES6 export default',
          changes: 1,
          sizeDelta: exportName.length + 25,
        });
        totalChanges++;
      }
    }

    return {
      migratedContent,
      hasChanges: totalChanges > 0,
      appliedRules,
      changesSummary: {
        totalRules: appliedRules.length,
        totalChanges,
        sizeDelta: migratedContent.length - content.length,
      },
    };
  }

  /**
   * Create backup of original file
   * @param {Object} fileInfo - File information
   * @param {string} content - File content
   * @returns {string} - Backup file path
   */
  async createBackup(fileInfo, content) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = path.basename(fileInfo.path);
    const relativePath = path.dirname(fileInfo.path);

    // Create backup directory structure
    const backupSubDir = path.join(this.options.backupDir, relativePath);
    await fs.mkdir(backupSubDir, { recursive: true });

    // Create backup file with timestamp
    const backupFileName = `${fileName}.backup-${timestamp}`;
    const backupPath = path.join(backupSubDir, backupFileName);

    await fs.writeFile(backupPath, content, 'utf8');
    this.results.backups.push(backupPath);

    return backupPath;
  }

  /**
   * Validate migrated file
   * @param {Object} fileInfo - File information
   * @param {Object} migrationResult - Migration result
   */
  async validateMigration(fileInfo, migrationResult) {
    try {
      // Basic syntax validation by trying to parse as JavaScript
      // Note: This is a simple check, more sophisticated validation could be added

      const migratedContent = migrationResult.migratedContent;

      // Check for remaining problematic patterns
      const problemPatterns = [
        { pattern: /if\s*\(\s*typeof\s+module/, issue: 'CommonJS module check still present' },
        { pattern: /module\.exports\s*=/, issue: 'module.exports still present' },
        { pattern: /window\.\w+\s*=/, issue: 'Global assignment still present' },
      ];

      for (const check of problemPatterns) {
        if (check.pattern.test(migratedContent)) {
          throw new Error(`Validation failed: ${check.issue}`);
        }
      }

      // Ensure ES6 export exists if this was a component file.
      // Paths from the detector are relative (e.g. "components/ui/Card.js"), so
      // match "components/" at the start or after any separator, and require a
      // real export statement rather than the word "export" in a comment.
      const isComponentFile = /(^|\/)components\//.test(fileInfo.path);
      const hasES6Export =
        /export\s+(default\s|const\s|class\s|function\s|let\s|var\s|async\s|\{)/.test(
          migratedContent
        );
      if (isComponentFile && !hasES6Export) {
        throw new Error('Validation failed: No ES6 export found in component file');
      }

      if (this.options.verbose) {
        console.log(`✅ Validation passed: ${fileInfo.path}`);
      }
    } catch (error) {
      console.error(`⚠️  Validation warning for ${fileInfo.path}: ${error.message}`);
      // Don't fail the migration, just warn
    }
  }

  /**
   * Generate migration summary
   */
  async generateMigrationSummary() {
    console.log('\n📊 Migration Summary:');
    console.log(`   Files processed: ${this.results.processed}`);
    console.log(`   Files migrated: ${this.results.migrated}`);
    console.log(`   Files skipped: ${this.results.skipped}`);
    console.log(`   Errors: ${this.results.errors.length}`);
    console.log(`   Backups created: ${this.results.backups.length}`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.results.errors.forEach(error => console.log(`   - ${error}`));
    }

    if (this.results.migrated > 0) {
      console.log('\n✅ Successfully migrated files:');
      this.results.migrations.forEach(migration => {
        console.log(`   - ${migration.filePath} (${migration.appliedRules.length} rules)`);
      });
    }

    if (!this.options.dryRun && this.results.migrated > 0) {
      console.log('\n🔍 Next steps:');
      console.log('   1. Run tests to verify functionality is preserved');
      console.log('   2. Run ESLint to check for any remaining issues');
      console.log('   3. Test affected pages/components manually');
      console.log('   4. Commit changes if everything works correctly');
      console.log(`   5. Backup files are available in: ${this.options.backupDir}`);
    }
  }

  /**
   * Rollback migration using backups
   * @param {string[]} filePaths - Specific files to rollback (optional)
   */
  async rollback(filePaths = null) {
    console.log('🔄 Rolling back migration...');

    const migrationsToRollback = filePaths
      ? this.results.migrations.filter(m => filePaths.includes(m.filePath))
      : this.results.migrations;

    for (const migration of migrationsToRollback) {
      try {
        if (migration.backupPath && (await this.fileExists(migration.backupPath))) {
          const backupContent = await fs.readFile(migration.backupPath, 'utf8');
          await fs.writeFile(migration.fullPath, backupContent, 'utf8');
          console.log(`✅ Rolled back: ${migration.filePath}`);
        } else {
          console.error(`❌ Backup not found for: ${migration.filePath}`);
        }
      } catch (error) {
        console.error(`❌ Rollback failed for ${migration.filePath}: ${error.message}`);
      }
    }
  }

  /**
   * Check if file exists
   * @param {string} filePath - File path to check
   * @returns {boolean} - True if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (const arg of args) {
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg.startsWith('--file=')) {
      options.targetFile = arg.split('=')[1];
    } else if (arg.startsWith('--backup-dir=')) {
      options.backupDir = arg.split('=')[1];
    } else if (arg === '--no-validate') {
      options.validateAfter = false;
    }
  }

  const migrator = new MixedPatternMigrator(options);
  await migrator.migrate();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export default MixedPatternMigrator;
