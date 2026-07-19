#!/usr/bin/env node

/**
 * Check for duplicate files that may have been created by iCloud sync conflicts
 *
 * Usage:
 *   node scripts/checkDuplicates.js [--fix]
 *
 * Options:
 *   --fix    Automatically remove duplicates after user confirmation
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

// Patterns that indicate duplicate files
const DUPLICATE_PATTERNS = [
  /\s\d+\.(js|html|css|md)$/, // Files ending with " 2.js", " 3.html", etc.
  /\s\(copy\)\./, // Files with " (copy)" in name
  /\s-\s?conflict/i, // Files with conflict markers
];

// Directories to scan
const SCAN_DIRS = ['src', 'docs', 'tests', 'scripts'];

// Directories to ignore
const IGNORE_DIRS = ['node_modules', '.git', 'coverage', 'dist', 'build'];

/**
 * Calculate file hash for comparison
 */
function getFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
  } catch (error) {
    return null;
  }
}

/**
 * Check if path should be ignored
 */
function shouldIgnore(filePath) {
  return IGNORE_DIRS.some(dir => filePath.includes(`/${dir}/`) || filePath.includes(`\\${dir}\\`));
}

/**
 * Find all duplicate files recursively
 */
function findDuplicates(dir, duplicates = []) {
  if (!fs.existsSync(dir)) return duplicates;

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);

    if (shouldIgnore(fullPath)) continue;

    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      findDuplicates(fullPath, duplicates);
    } else if (stat.isFile()) {
      // Check if filename matches duplicate patterns
      const isDuplicate = DUPLICATE_PATTERNS.some(pattern => pattern.test(item));

      if (isDuplicate) {
        // Try to find the original file
        const originalName = item
          .replace(/\s+\d+(\.[^.]+)$/, '$1')
          .replace(/\s+\(copy\)/, '')
          .replace(/\s+-?\s?conflict.*?\./, '.');

        const originalPath = path.join(dir, originalName);

        duplicates.push({
          duplicate: fullPath,
          original: fs.existsSync(originalPath) ? originalPath : null,
          duplicateHash: getFileHash(fullPath),
          originalHash: fs.existsSync(originalPath) ? getFileHash(originalPath) : null,
        });
      }
    }
  }

  return duplicates;
}

/**
 * Compare two files and return differences
 */
function compareFiles(file1, file2) {
  try {
    const content1 = fs.readFileSync(file1, 'utf8');
    const content2 = fs.readFileSync(file2, 'utf8');

    return content1 === content2 ? 'identical' : 'different';
  } catch (error) {
    return 'error';
  }
}

/**
 * Main function
 */
async function main() {
  console.log(`${colors.blue}🔍 Checking for duplicate files...${colors.reset}\\n`);

  const duplicates = [];

  // Scan each directory
  for (const dir of SCAN_DIRS) {
    findDuplicates(dir, duplicates);
  }

  if (duplicates.length === 0) {
    console.log(`${colors.green}✅ No duplicate files found!${colors.reset}`);
    return;
  }

  // Group duplicates by original file
  const groups = {};
  duplicates.forEach(dup => {
    const key = dup.original || 'no-original';
    if (!groups[key]) groups[key] = [];
    groups[key].push(dup);
  });

  // Display results
  console.log(`${colors.red}❌ Found ${duplicates.length} duplicate file(s):${colors.reset}\\n`);

  Object.entries(groups).forEach(([original, dups]) => {
    if (original === 'no-original') {
      console.log(`${colors.yellow}📁 Duplicates without originals:${colors.reset}`);
      dups.forEach(dup => {
        console.log(`  - ${dup.duplicate}`);
      });
    } else {
      console.log(`${colors.yellow}📁 Original: ${original}${colors.reset}`);
      dups.forEach(dup => {
        const status =
          dup.duplicateHash === dup.originalHash
            ? `${colors.green}(identical)${colors.reset}`
            : `${colors.red}(different content!)${colors.reset}`;
        console.log(`  - ${dup.duplicate} ${status}`);
      });
    }
    console.log();
  });

  // Offer to fix if --fix flag is provided
  if (process.argv.includes('--fix')) {
    console.log(
      `${colors.yellow}⚠️  Fix mode: This will delete duplicate files that are identical to originals.${colors.reset}`
    );
    console.log('Press Ctrl+C to cancel, or any other key to continue...');

    // Wait for user input
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', () => {
      let deleted = 0;

      duplicates.forEach(dup => {
        if (dup.original && dup.duplicateHash === dup.originalHash) {
          try {
            fs.unlinkSync(dup.duplicate);
            console.log(`${colors.green}✅ Deleted: ${dup.duplicate}${colors.reset}`);
            deleted++;
          } catch (error) {
            console.log(`${colors.red}❌ Failed to delete: ${dup.duplicate}${colors.reset}`);
          }
        }
      });

      console.log(`\\n${colors.green}Deleted ${deleted} duplicate file(s).${colors.reset}`);

      if (duplicates.length - deleted > 0) {
        console.log(
          `${colors.yellow}${duplicates.length - deleted} file(s) require manual review (different content).${colors.reset}`
        );
      }

      process.exit(0);
    });
  } else {
    console.log(
      `${colors.blue}Run with --fix flag to automatically remove identical duplicates.${colors.reset}`
    );
    console.log(`${colors.blue}Example: node scripts/checkDuplicates.js --fix${colors.reset}`);

    // Exit with error code if duplicates found
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
});

export { findDuplicates, compareFiles };
