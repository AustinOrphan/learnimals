/**
 * Migration System Unit Tests
 * Unit tests for the mixed pattern migration system including detection and conversion
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock file system operations
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    access: vi.fn()
  }
}));

describe('Migration System', () => {
  let MixedPatternDetector;
  let MixedPatternMigrator;
  
  beforeEach(async () => {
    // Clear module cache and reimport
    vi.resetModules();
    vi.clearAllMocks();
    
    // Import the modules to test
    const detectorModule = await import('../../scripts/detectMixedPatterns.js');
    const migratorModule = await import('../../scripts/migrateMixedPatterns.js');
    
    MixedPatternDetector = detectorModule.default;
    MixedPatternMigrator = migratorModule.default;
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('MixedPatternDetector', () => {
    describe('Pattern Detection', () => {
      it('should detect CommonJS typeof module pattern', async () => {
        const testCode = `
          class TestComponent {
            constructor() {}
          }
          
          // Export for module usage
          if (typeof module !== 'undefined' && module.exports) {
            module.exports = TestComponent;
          } else {
            window.TestComponent = TestComponent;
          }
          
          export default TestComponent;
        `;
        
        const detector = new MixedPatternDetector({ verbose: false });
        const patterns = detector.detectPatternsInCode(testCode, 'test.js');
        
        expect(patterns.hasMixedPatterns).toBe(true);
        expect(patterns.patterns.some(p => p.type === 'typeofModule')).toBe(true);
      });
      
      it('should detect global window assignments', async () => {
        const testCode = `
          class TestComponent {}
          window.TestComponent = TestComponent;
        `;
        
        const detector = new MixedPatternDetector({ verbose: false });
        const patterns = detector.detectPatternsInCode(testCode, 'test.js');
        
        expect(patterns.hasMixedPatterns).toBe(true);
        expect(patterns.patterns.some(p => p.type === 'globalAssignment')).toBe(true);
      });
      
      it('should detect module.exports assignments', async () => {
        const testCode = `
          const component = { name: 'test' };
          module.exports = component;
        `;
        
        const detector = new MixedPatternDetector({ verbose: false });
        const patterns = detector.detectPatternsInCode(testCode, 'test.js');
        
        expect(patterns.hasMixedPatterns).toBe(true);
        expect(patterns.patterns.some(p => p.type === 'moduleExports')).toBe(true);
      });
      
      it('should not detect patterns in clean ES6 modules', () => {
        const testCode = `
          class TestComponent {
            constructor() {}
          }
          
          export default TestComponent;
        `;
        
        const detector = new MixedPatternDetector({ verbose: false });
        const patterns = detector.detectPatternsInCode(testCode, 'test.js');
        
        expect(patterns.hasMixedPatterns).toBe(false);
        expect(patterns.patterns.length).toBe(0);
      });
      
      it('should calculate severity scores correctly', () => {
        const testCode = `
          class TestComponent {}
          
          if (typeof module !== 'undefined') {
            module.exports = TestComponent;
          }
          window.TestComponent = TestComponent;
        `;
        
        const detector = new MixedPatternDetector({ verbose: false });
        const patterns = detector.detectPatternsInCode(testCode, 'test.js');
        
        expect(patterns.severityScore).toBeGreaterThan(0);
        expect(patterns.severityScore).toBeGreaterThan(patterns.patterns.length);
      });
    });
    
    describe('File Scanning', () => {
      beforeEach(() => {
        // Mock file system operations
        fs.readdir = vi.fn();
        fs.stat = vi.fn();
        fs.readFile = vi.fn();
      });
      
      it('should scan directory structure recursively', async () => {
        const mockFiles = [
          { name: 'component1.js', isFile: () => true, isDirectory: () => false },
          { name: 'component2.js', isFile: () => true, isDirectory: () => false },
          { name: 'subdir', isFile: () => false, isDirectory: () => true }
        ];
        
        fs.readdir
          .mockResolvedValueOnce(mockFiles)
          .mockResolvedValueOnce([{ name: 'component3.js', isFile: () => true, isDirectory: () => false }]);
        
        fs.stat
          .mockResolvedValue({ isFile: () => true, isDirectory: () => false });
        
        fs.readFile
          .mockResolvedValue('export default class {}');
        
        const detector = new MixedPatternDetector({ 
          verbose: false,
          rootPath: '/test/path'
        });
        
        const files = await detector.scanDirectory('/test/path');
        
        expect(fs.readdir).toHaveBeenCalled();
        expect(files.length).toBeGreaterThan(0);
      });
      
      it('should filter JavaScript files only', async () => {
        const detector = new MixedPatternDetector({ verbose: false });
        
        expect(detector.isJavaScriptFile('test.js')).toBe(true);
        expect(detector.isJavaScriptFile('test.mjs')).toBe(true);
        expect(detector.isJavaScriptFile('test.ts')).toBe(false);
        expect(detector.isJavaScriptFile('test.css')).toBe(false);
        expect(detector.isJavaScriptFile('test.html')).toBe(false);
      });
      
      it('should generate comprehensive scan report', async () => {
        const detector = new MixedPatternDetector({ verbose: false });
        
        // Mock scan results
        detector.results = {
          scannedFiles: 10,
          mixedPatternFiles: [
            {
              path: 'component1.js',
              hasMixedPatterns: true,
              patterns: [{ type: 'typeofModule', severity: 'high' }],
              severityScore: 10
            }
          ],
          cleanFiles: 9,
          totalPatterns: 1,
          scanTime: 100
        };
        
        const report = detector.generateReport();
        
        expect(report).toContain('Mixed Pattern Detection Report');
        expect(report).toContain('Files scanned: 10');
        expect(report).toContain('Files with mixed patterns: 1');
        expect(report).toContain('Clean ES6 files: 9');
      });
    });
  });

  describe('MixedPatternMigrator', () => {
    describe('Migration Rules', () => {
      it('should remove CommonJS export patterns', () => {
        const testCode = `
          class TestComponent {}
          
          // Export for module usage
          if (typeof module !== 'undefined' && module.exports) {
            module.exports = TestComponent;
          } else {
            window.TestComponent = TestComponent;
          }
          
          export default TestComponent;
        `;
        
        const migrator = new MixedPatternMigrator({ dryRun: true });
        const result = migrator.applyMigrationRules(testCode, { path: 'test.js' });
        
        expect(result.hasChanges).toBe(true);
        expect(result.migratedContent).not.toContain('typeof module');
        expect(result.migratedContent).toContain('export default TestComponent');
      });
      
      it('should remove standalone global assignments', () => {
        const testCode = `
          class TestComponent {}
          window.TestComponent = TestComponent;
          export default TestComponent;
        `;
        
        const migrator = new MixedPatternMigrator({ dryRun: true });
        const result = migrator.applyMigrationRules(testCode, { path: 'test.js' });
        
        expect(result.hasChanges).toBe(true);
        expect(result.migratedContent).not.toContain('window.TestComponent');
        expect(result.migratedContent).toContain('export default TestComponent');
      });
      
      it('should remove standalone module.exports assignments', () => {
        const testCode = `
          class TestComponent {}
          module.exports = TestComponent;
          export default TestComponent;
        `;
        
        const migrator = new MixedPatternMigrator({ dryRun: true });
        const result = migrator.applyMigrationRules(testCode, { path: 'test.js' });
        
        expect(result.hasChanges).toBe(true);
        expect(result.migratedContent).not.toContain('module.exports');
        expect(result.migratedContent).toContain('export default TestComponent');
      });
      
      it('should add ES6 export if missing after cleanup', () => {
        const testCode = `
          class TestComponent {}
          
          if (typeof module !== 'undefined') {
            module.exports = TestComponent;
          }
        `;
        
        const migrator = new MixedPatternMigrator({ dryRun: true });
        const result = migrator.applyMigrationRules(testCode, { path: 'test.js' });
        
        expect(result.hasChanges).toBe(true);
        expect(result.migratedContent).toContain('export default TestComponent');
      });
      
      it('should not modify clean ES6 modules', () => {
        const testCode = `
          class TestComponent {
            constructor() {}
          }
          
          export default TestComponent;
        `;
        
        const migrator = new MixedPatternMigrator({ dryRun: true });
        const result = migrator.applyMigrationRules(testCode, { path: 'test.js' });
        
        expect(result.hasChanges).toBe(false);
        expect(result.migratedContent).toBe(testCode);
      });
    });
    
    describe('Backup System', () => {
      beforeEach(() => {
        fs.mkdir.mockResolvedValue();
        fs.writeFile.mockResolvedValue();
      });
      
      it('should create backup before migration', async () => {
        const migrator = new MixedPatternMigrator({ 
          dryRun: false,
          backupDir: '/test/backups'
        });
        
        const fileInfo = {
          path: 'components/ui/Card.js',
          fullPath: '/src/components/ui/Card.js'
        };
        
        const originalContent = 'class Card {}';
        
        const backupPath = await migrator.createBackup(fileInfo, originalContent);
        
        expect(fs.mkdir).toHaveBeenCalledWith(
          expect.stringContaining('components/ui'),
          { recursive: true }
        );
        expect(fs.writeFile).toHaveBeenCalledWith(
          expect.stringContaining('Card.js.backup-'),
          originalContent,
          'utf8'
        );
        expect(backupPath).toContain('Card.js.backup-');
      });
      
      it('should organize backups by directory structure', async () => {
        const migrator = new MixedPatternMigrator({ 
          dryRun: false,
          backupDir: '/test/backups'
        });
        
        const fileInfo = {
          path: 'components/ui/forms/FormComponent.js',
          fullPath: '/src/components/ui/forms/FormComponent.js'
        };
        
        await migrator.createBackup(fileInfo, 'test content');
        
        expect(fs.mkdir).toHaveBeenCalledWith(
          expect.stringContaining('components/ui/forms'),
          { recursive: true }
        );
      });
    });
    
    describe('Migration Validation', () => {
      it('should validate successful migration', async () => {
        const migrator = new MixedPatternMigrator({ validateAfter: true });
        
        const fileInfo = {
          path: 'components/ui/Card.js',
          fullPath: '/src/components/ui/Card.js'
        };
        
        const migrationResult = {
          migratedContent: `
            class Card {}
            export default Card;
          `
        };
        
        // Should not throw
        await migrator.validateMigration(fileInfo, migrationResult);
      });
      
      it('should detect remaining problematic patterns', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        const migrator = new MixedPatternMigrator({ validateAfter: true });
        
        const fileInfo = {
          path: 'components/ui/Card.js',
          fullPath: '/src/components/ui/Card.js'
        };
        
        const migrationResult = {
          migratedContent: `
            class Card {}
            if (typeof module !== 'undefined') {
              module.exports = Card;
            }
          `
        };
        
        await migrator.validateMigration(fileInfo, migrationResult);
        
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Validation warning'),
          expect.stringContaining('CommonJS module check still present')
        );
        
        consoleSpy.mockRestore();
      });
      
      it('should require ES6 exports in component files', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        const migrator = new MixedPatternMigrator({ validateAfter: true });
        
        const fileInfo = {
          path: 'components/ui/Card.js',
          fullPath: '/src/components/ui/Card.js'
        };
        
        const migrationResult = {
          migratedContent: `
            class Card {}
            // No export statement
          `
        };
        
        await migrator.validateMigration(fileInfo, migrationResult);
        
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Validation warning'),
          expect.stringContaining('No ES6 export found')
        );
        
        consoleSpy.mockRestore();
      });
    });
    
    describe('Rollback System', () => {
      beforeEach(() => {
        fs.access.mockResolvedValue();
        fs.readFile.mockResolvedValue('original content');
        fs.writeFile.mockResolvedValue();
      });
      
      it('should rollback migrations using backups', async () => {
        const migrator = new MixedPatternMigrator();
        
        migrator.results.migrations = [
          {
            filePath: 'components/ui/Card.js',
            fullPath: '/src/components/ui/Card.js',
            backupPath: '/backups/components/ui/Card.js.backup-123'
          }
        ];
        
        await migrator.rollback();
        
        expect(fs.readFile).toHaveBeenCalledWith(
          '/backups/components/ui/Card.js.backup-123',
          'utf8'
        );
        expect(fs.writeFile).toHaveBeenCalledWith(
          '/src/components/ui/Card.js',
          'original content',
          'utf8'
        );
      });
      
      it('should handle selective rollback', async () => {
        const migrator = new MixedPatternMigrator();
        
        migrator.results.migrations = [
          {
            filePath: 'components/ui/Card.js',
            fullPath: '/src/components/ui/Card.js',
            backupPath: '/backups/Card.js.backup-123'
          },
          {
            filePath: 'components/forms/FormComponent.js',
            fullPath: '/src/components/forms/FormComponent.js',
            backupPath: '/backups/FormComponent.js.backup-123'
          }
        ];
        
        await migrator.rollback(['components/ui/Card.js']);
        
        expect(fs.readFile).toHaveBeenCalledTimes(1);
        expect(fs.writeFile).toHaveBeenCalledTimes(1);
      });
      
      it('should handle missing backup files gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        fs.access.mockRejectedValue(new Error('File not found'));
        
        const migrator = new MixedPatternMigrator();
        migrator.results.migrations = [
          {
            filePath: 'components/ui/Card.js',
            fullPath: '/src/components/ui/Card.js',
            backupPath: '/nonexistent/backup.js'
          }
        ];
        
        await migrator.rollback();
        
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Backup not found')
        );
        
        consoleSpy.mockRestore();
      });
    });
    
    describe('Migration Reporting', () => {
      it('should generate comprehensive migration summary', async () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        
        const migrator = new MixedPatternMigrator();
        migrator.results = {
          processed: 5,
          migrated: 3,
          skipped: 2,
          errors: [],
          migrations: [
            {
              filePath: 'components/ui/Card.js',
              appliedRules: [
                { name: 'removeCommonJSExport', description: 'Remove CommonJS patterns' }
              ]
            }
          ],
          backups: ['/backup1.js', '/backup2.js']
        };
        
        await migrator.generateMigrationSummary();
        
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Migration Summary')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Files processed: 5')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Files migrated: 3')
        );
        
        consoleSpy.mockRestore();
      });
      
      it('should provide next steps guidance', async () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        
        const migrator = new MixedPatternMigrator({ dryRun: false });
        migrator.results = {
          processed: 3,
          migrated: 2,
          skipped: 1,
          errors: [],
          migrations: [{ filePath: 'test.js' }],
          backups: []
        };
        
        await migrator.generateMigrationSummary();
        
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Next steps:')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Run tests to verify functionality')
        );
        
        consoleSpy.mockRestore();
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete migration workflow', async () => {
      // Mock complete file system for end-to-end test
      const testContent = `
        class TestComponent {
          constructor() {}
        }
        
        if (typeof module !== 'undefined') {
          module.exports = TestComponent;
        } else {
          window.TestComponent = TestComponent;
        }
      `;
      
      fs.readFile.mockResolvedValue(testContent);
      fs.writeFile.mockResolvedValue();
      fs.mkdir.mockResolvedValue();
      fs.access.mockResolvedValue();
      
      const migrator = new MixedPatternMigrator({ 
        dryRun: false,
        targetFile: '/test/TestComponent.js'
      });
      
      const results = await migrator.migrate();
      
      expect(results.processed).toBe(1);
      expect(results.migrated).toBe(1);
      expect(results.errors).toEqual([]);
    });
    
    it('should handle migration errors gracefully', async () => {
      fs.readFile.mockRejectedValue(new Error('File not found'));
      
      const migrator = new MixedPatternMigrator({ 
        targetFile: '/nonexistent/file.js'
      });
      
      const results = await migrator.migrate();
      
      expect(results.errors.length).toBeGreaterThan(0);
      expect(results.migrated).toBe(0);
    });
  });
});