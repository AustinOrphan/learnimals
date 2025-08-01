#!/usr/bin/env node

/**
 * Test Sharding Script
 * Splits tests into balanced shards for parallel execution
 */

import { globSync } from 'glob';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Configuration for test sharding
const SHARD_CONFIG = {
  // Test categories with estimated relative execution times
  categories: {
    unit: { weight: 1, pattern: 'tests/unit/**/*.test.js' },
    components: { weight: 2, pattern: 'tests/components/**/*.test.js' },
    integration: { weight: 3, pattern: 'tests/integration/**/*.test.js' },
    navigation: { weight: 2, pattern: 'tests/navigation/**/*.test.js' },
    security: { weight: 2, pattern: 'tests/security/**/*.test.js' },
    performance: { weight: 4, pattern: 'tests/performance/**/*.test.js' },
    e2e: { weight: 5, pattern: 'tests/e2e/**/*.test.js' }
  },
  
  // Number of shards (can be overridden by environment variable)
  shardCount: parseInt(process.env.SHARD_COUNT || '4', 10),
  
  // Current shard index (0-based, from environment variable)
  shardIndex: parseInt(process.env.SHARD_INDEX || '0', 10)
};

/**
 * Get all test files with their categories and weights
 */
function getTestFiles() {
  const testFiles = [];
  
  for (const [category, config] of Object.entries(SHARD_CONFIG.categories)) {
    const files = globSync(config.pattern, { cwd: projectRoot });
    
    files.forEach(file => {
      testFiles.push({
        path: file,
        category,
        weight: config.weight,
        size: getFileSize(path.join(projectRoot, file))
      });
    });
  }
  
  return testFiles;
}

/**
 * Get file size for better balancing
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 1000; // Default size if file can't be read
  }
}

/**
 * Calculate total weight for a shard
 */
function calculateShardWeight(shard) {
  return shard.reduce((total, file) => {
    // Weight based on category and file size
    const sizeWeight = file.size / 10000; // Normalize file size
    return total + file.weight + sizeWeight;
  }, 0);
}

/**
 * Distribute test files across shards using balanced approach
 */
function distributeTests(testFiles, shardCount) {
  // Sort files by weight (heaviest first)
  const sortedFiles = testFiles.sort((a, b) => {
    const weightA = a.weight + (a.size / 10000);
    const weightB = b.weight + (b.size / 10000);
    return weightB - weightA;
  });
  
  // Initialize shards
  const shards = Array(shardCount).fill(null).map(() => []);
  
  // Distribute files using greedy algorithm
  sortedFiles.forEach(file => {
    // Find shard with minimum weight
    let minWeight = Infinity;
    let targetShard = 0;
    
    for (let i = 0; i < shardCount; i++) {
      const weight = calculateShardWeight(shards[i]);
      if (weight < minWeight) {
        minWeight = weight;
        targetShard = i;
      }
    }
    
    shards[targetShard].push(file);
  });
  
  return shards;
}

/**
 * Get test files for current shard
 */
function getShardTests() {
  const testFiles = getTestFiles();
  const shards = distributeTests(testFiles, SHARD_CONFIG.shardCount);
  
  if (SHARD_CONFIG.shardIndex >= shards.length) {
    console.error(`Invalid shard index ${SHARD_CONFIG.shardIndex} for ${shards.length} shards`);
    process.exit(1);
  }
  
  return shards[SHARD_CONFIG.shardIndex];
}

/**
 * Generate shard report
 */
function generateShardReport(shards) {
  console.log('Test Sharding Report');
  console.log('===================\n');
  
  shards.forEach((shard, index) => {
    const weight = calculateShardWeight(shard);
    const fileCount = shard.length;
    
    console.log(`Shard ${index + 1}:`);
    console.log(`  Files: ${fileCount}`);
    console.log(`  Weight: ${weight.toFixed(2)}`);
    console.log('  Categories:');
    
    // Group by category
    const categories = {};
    shard.forEach(file => {
      if (!categories[file.category]) {
        categories[file.category] = 0;
      }
      categories[file.category]++;
    });
    
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`    - ${category}: ${count} files`);
    });
    
    console.log('');
  });
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--report')) {
    // Generate sharding report
    const testFiles = getTestFiles();
    const shards = distributeTests(testFiles, SHARD_CONFIG.shardCount);
    generateShardReport(shards);
    
    // Show total stats
    const totalFiles = testFiles.length;
    const totalWeight = testFiles.reduce((sum, file) => sum + file.weight + (file.size / 10000), 0);
    
    console.log('Total Statistics:');
    console.log(`  Total files: ${totalFiles}`);
    console.log(`  Total weight: ${totalWeight.toFixed(2)}`);
    console.log(`  Average per shard: ${(totalWeight / SHARD_CONFIG.shardCount).toFixed(2)}`);
    
  } else if (args.includes('--list')) {
    // List files for current shard
    const shardTests = getShardTests();
    
    if (args.includes('--json')) {
      // Output as JSON for CI consumption
      console.log(JSON.stringify({
        shardIndex: SHARD_CONFIG.shardIndex,
        shardCount: SHARD_CONFIG.shardCount,
        files: shardTests.map(f => f.path)
      }, null, 2));
    } else {
      // Human-readable output
      console.log(`Shard ${SHARD_CONFIG.shardIndex + 1} of ${SHARD_CONFIG.shardCount}:`);
      console.log(`Files: ${shardTests.length}`);
      console.log('Test files:');
      shardTests.forEach(file => {
        console.log(`  - ${file.path} (${file.category})`);
      });
    }
    
  } else if (args.includes('--pattern')) {
    // Output as glob pattern for vitest
    const shardTests = getShardTests();
    const patterns = shardTests.map(f => f.path).join(',');
    console.log(patterns);
    
  } else {
    // Default: output file paths for current shard
    const shardTests = getShardTests();
    shardTests.forEach(file => console.log(file.path));
  }
}

// Run if called directly
if (process.argv[1] === __filename) {
  main();
}

export { getTestFiles, distributeTests, getShardTests };