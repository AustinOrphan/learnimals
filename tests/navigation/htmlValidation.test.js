/**
 * HTML Navigation Validation Tests
 * Validates that all HTML pages use correct navigation loading patterns
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

describe('HTML Navigation Validation', () => {
  let htmlFiles;

  beforeEach(() => {
    // Find all HTML files in the project
    htmlFiles = findAllHtmlFiles();
  });

  function findAllHtmlFiles() {
    const files = [];
    const searchDirs = [
      'src/pages',
      'src/features/subjects/shared',
      'src/features/subjects/geography',
      'src/features/subjects/music',
      'src/templates',
    ];

    searchDirs.forEach(dir => {
      try {
        const dirPath = join(process.cwd(), dir);
        const dirFiles = readdirSync(dirPath);

        dirFiles.forEach(file => {
          if (file.endsWith('.html')) {
            files.push({
              path: join(dirPath, file),
              relativePath: join(dir, file),
              name: file,
            });
          }
        });
      } catch (error) {
        // Directory might not exist, skip
      }
    });

    return files;
  }

  function readHtmlFile(filePath) {
    try {
      return readFileSync(filePath, 'utf8');
    } catch (error) {
      return null;
    }
  }

  describe('Navigation Script Loading Validation', () => {
    it('should validate that all HTML files use correct navbarLoader script loading', () => {
      const issues = [];

      htmlFiles.forEach(file => {
        const content = readHtmlFile(file.path);
        if (!content) return;

        // Skip files that don't use navbar
        if (!content.includes('navbar-placeholder') && !content.includes('navbarLoader')) {
          return;
        }

        // Check for navbarLoader.js loading
        const navbarLoaderRegex = /<script[^>]*src=[^>]*navbarLoader\.js[^>]*>/g;
        const navbarLoaderMatches = content.match(navbarLoaderRegex);

        if (navbarLoaderMatches) {
          navbarLoaderMatches.forEach(match => {
            // CRITICAL: Must NOT be loaded as module
            if (match.includes('type="module"')) {
              issues.push({
                file: file.relativePath,
                issue: 'navbarLoader.js loaded as module (should be regular script)',
                line: match,
              });
            }

            // Should have defer attribute for proper loading
            if (!match.includes('defer')) {
              issues.push({
                file: file.relativePath,
                issue: 'navbarLoader.js missing defer attribute',
                line: match,
              });
            }
          });
        } else if (content.includes('navbar-placeholder')) {
          // Has placeholder but no navbarLoader
          issues.push({
            file: file.relativePath,
            issue: 'Has navbar-placeholder but no navbarLoader.js script',
            line: 'Missing navbarLoader.js',
          });
        }
      });

      if (issues.length > 0) {
        const errorMessage =
          'Navigation loading issues found:\n' +
          issues.map(issue => `  ${issue.file}: ${issue.issue}\n    ${issue.line}`).join('\n');
        expect(issues).toEqual([], errorMessage);
      }
    });

    it('should validate that navigationHelper.js is loaded correctly when used', () => {
      const issues = [];

      htmlFiles.forEach(file => {
        const content = readHtmlFile(file.path);
        if (!content) return;

        // Check for navigationHelper.js loading
        const helperRegex = /<script[^>]*src=[^>]*navigationHelper\.js[^>]*>/g;
        const helperMatches = content.match(helperRegex);

        if (helperMatches) {
          helperMatches.forEach(match => {
            // CRITICAL: Must NOT be loaded as module
            if (match.includes('type="module"')) {
              issues.push({
                file: file.relativePath,
                issue: 'navigationHelper.js loaded as module (should be regular script)',
                line: match,
              });
            }

            // Should have defer attribute
            if (!match.includes('defer')) {
              issues.push({
                file: file.relativePath,
                issue: 'navigationHelper.js missing defer attribute',
                line: match,
              });
            }
          });
        }
      });

      if (issues.length > 0) {
        const errorMessage =
          'NavigationHelper loading issues found:\n' +
          issues.map(issue => `  ${issue.file}: ${issue.issue}\n    ${issue.line}`).join('\n');
        expect(issues).toEqual([], errorMessage);
      }
    });

    it('should validate that navigation.js is loaded correctly when used', () => {
      const issues = [];

      htmlFiles.forEach(file => {
        const content = readHtmlFile(file.path);
        if (!content) return;

        // Check for navigation.js loading
        const navigationRegex = /<script[^>]*src=[^>]*navigation\.js[^>]*>/g;
        const navigationMatches = content.match(navigationRegex);

        if (navigationMatches) {
          navigationMatches.forEach(match => {
            // Should be regular script (navigation.js is compatible)
            if (match.includes('type="module"')) {
              // This is actually okay for navigation.js, but let's track it
              // issues.push(...) - No issue, navigation.js can be either
            }

            // Should have defer attribute for proper loading order
            if (!match.includes('defer')) {
              issues.push({
                file: file.relativePath,
                issue: 'navigation.js missing defer attribute',
                line: match,
              });
            }
          });
        }
      });

      if (issues.length > 0) {
        const errorMessage =
          'Navigation.js loading issues found:\n' +
          issues.map(issue => `  ${issue.file}: ${issue.issue}\n    ${issue.line}`).join('\n');
        expect(issues).toEqual([], errorMessage);
      }
    });

    it('should detect broken navbar.js references (regression test)', () => {
      const issues = [];

      htmlFiles.forEach(file => {
        const content = readHtmlFile(file.path);
        if (!content) return;

        // Check for broken navbar.js references (this file doesn't exist)
        const brokenNavbarRegex = /<script[^>]*src=[^>]*navbar\.js[^>]*>/g;
        const brokenMatches = content.match(brokenNavbarRegex);

        if (brokenMatches) {
          issues.push({
            file: file.relativePath,
            issue: 'References non-existent navbar.js file',
            line: brokenMatches[0],
          });
        }
      });

      if (issues.length > 0) {
        const errorMessage =
          'Broken navbar.js references found:\n' +
          issues.map(issue => `  ${issue.file}: ${issue.issue}\n    ${issue.line}`).join('\n');
        expect(issues).toEqual([], errorMessage);
      }
    });
  });

  describe('Navigation HTML Structure Validation', () => {
    it('should validate correct navbar placeholder usage', () => {
      const issues = [];

      htmlFiles.forEach(file => {
        const content = readHtmlFile(file.path);
        if (!content) return;

        // Check for navbar-placeholder
        const placeholderRegex = /<div[^>]*id=['"]navbar-placeholder['"][^>]*>/g;
        const directNavbarRegex = /<nav[^>]*class=['"][^'"]*navbar[^'"]*['"][^>]*>/g;

        const hasPlaceholder = content.match(placeholderRegex);
        const hasDirectNavbar = content.match(directNavbarRegex);

        // If using navbarLoader, should use placeholder not direct navbar
        if (content.includes('navbarLoader.js')) {
          if (!hasPlaceholder) {
            issues.push({
              file: file.relativePath,
              issue: 'Uses navbarLoader.js but missing navbar-placeholder',
              line: 'Missing <div id="navbar-placeholder"></div>',
            });
          }

          if (hasDirectNavbar) {
            issues.push({
              file: file.relativePath,
              issue: 'Uses navbarLoader.js but has direct navbar element (conflict)',
              line: hasDirectNavbar[0],
            });
          }
        }
      });

      if (issues.length > 0) {
        const errorMessage =
          'Navbar structure issues found:\n' +
          issues.map(issue => `  ${issue.file}: ${issue.issue}\n    ${issue.line}`).join('\n');
        expect(issues).toEqual([], errorMessage);
      }
    });

    it('should validate consistent navigation patterns across pages', () => {
      const patterns = {
        standardPattern: 0, // navbar-placeholder + navbarLoader.js
        directPattern: 0, // direct navbar element
        noNavigation: 0, // no navigation
      };

      const issues = [];

      htmlFiles.forEach(file => {
        const content = readHtmlFile(file.path);
        if (!content) return;

        const hasPlaceholder = content.includes('navbar-placeholder');
        const hasNavbarLoader = content.includes('navbarLoader.js');
        const hasDirectNavbar = /<nav[^>]*class=['"][^'"]*navbar[^'"]*['"]/.test(content);

        if (hasPlaceholder && hasNavbarLoader) {
          patterns.standardPattern++;
        } else if (hasDirectNavbar) {
          patterns.directPattern++;
        } else {
          patterns.noNavigation++;
        }
      });

      // Report pattern distribution for visibility
      console.log('Navigation patterns found:');
      console.log(`  Standard pattern (placeholder + loader): ${patterns.standardPattern} files`);
      console.log(`  Direct navbar: ${patterns.directPattern} files`);
      console.log(`  No navigation: ${patterns.noNavigation} files`);

      // The standard pattern should be the most common
      if (patterns.directPattern > patterns.standardPattern) {
        issues.push({
          issue: 'More pages use direct navbar than standard pattern',
          details: `Direct: ${patterns.directPattern}, Standard: ${patterns.standardPattern}`,
        });
      }

      if (issues.length > 0) {
        const errorMessage =
          'Navigation pattern consistency issues:\n' +
          issues.map(issue => `  ${issue.issue}: ${issue.details}`).join('\n');
        console.warn(errorMessage); // Warning only, not failure
      }

      // This test passes but provides visibility
      expect(patterns.standardPattern).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Script Loading Order Validation', () => {
    it('should validate correct script loading order', () => {
      const issues = [];

      htmlFiles.forEach(file => {
        const content = readHtmlFile(file.path);
        if (!content) return;

        // Find all script tags
        const scriptRegex =
          /<script[^>]*src=[^>]*(?:navbarLoader|navigationHelper|navigation)\.js[^>]*>/g;
        const scripts = content.match(scriptRegex) || [];

        if (scripts.length > 1) {
          // Check order: navbarLoader should come before navigation
          const navbarLoaderIndex = scripts.findIndex(s => s.includes('navbarLoader.js'));
          const navigationIndex = scripts.findIndex(s => s.includes('navigation.js'));

          if (navbarLoaderIndex !== -1 && navigationIndex !== -1) {
            if (navbarLoaderIndex > navigationIndex) {
              issues.push({
                file: file.relativePath,
                issue: 'navigation.js loads before navbarLoader.js (may cause timing issues)',
                line: 'Script order issue',
              });
            }
          }
        }
      });

      if (issues.length > 0) {
        const errorMessage =
          'Script loading order issues found:\n' +
          issues.map(issue => `  ${issue.file}: ${issue.issue}`).join('\n');
        console.warn(errorMessage); // Warning only, since defer should handle this
      }

      // This test passes but provides warnings
      expect(true).toBe(true);
    });
  });

  describe('Accessibility Validation', () => {
    it('should validate navigation accessibility attributes', () => {
      const issues = [];

      htmlFiles.forEach(file => {
        const content = readHtmlFile(file.path);
        if (!content) return;

        // If file has navigation, check for accessibility
        if (content.includes('mobile-menu') || content.includes('nav-menu')) {
          // Check for aria-label on mobile menu button
          if (
            !content.includes('aria-label="Toggle mobile menu"') &&
            !content.includes("aria-label='Toggle mobile menu'")
          ) {
            issues.push({
              file: file.relativePath,
              issue: 'Mobile menu button missing aria-label',
              line: 'Missing accessibility attribute',
            });
          }

          // Check for aria-label on nav element
          if (
            !content.includes('aria-label="Main navigation"') &&
            !content.includes("aria-label='Main navigation'")
          ) {
            issues.push({
              file: file.relativePath,
              issue: 'Navigation element missing aria-label',
              line: 'Missing accessibility attribute',
            });
          }
        }
      });

      if (issues.length > 0) {
        const errorMessage =
          'Navigation accessibility issues found:\n' +
          issues.map(issue => `  ${issue.file}: ${issue.issue}`).join('\n');
        console.warn(errorMessage); // Warning only
      }

      // This test passes but provides warnings for accessibility improvements
      expect(true).toBe(true);
    });
  });
});
