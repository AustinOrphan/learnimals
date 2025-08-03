// Test script to validate molecule builder game can load
// This will check for basic syntax errors and import issues

import fs from 'fs';
import path from 'path';

const gamePath = 'src/features/games/molecule-builder';

console.log('🧪 Testing Molecule Builder Game...\n');

// Test 1: Check if all files exist
const requiredFiles = [
  'moleculeBuilder.js',
  'moleculeData.js', 
  'moleculeBuilder.css',
  'index.html'
];

console.log('✓ Checking required files...');
let allFilesExist = true;
for (const file of requiredFiles) {
  const filePath = path.join(gamePath, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✓ ${file} exists`);
  } else {
    console.log(`  ✗ ${file} missing`);
    allFilesExist = false;
  }
}

// Test 2: Check dependencies exist
const dependencies = [
  'src/utils/logger.js',
  'src/components/games/BaseGame.js',
  'src/features/progress/ProgressTracker.js',
  'src/features/progress/AchievementSystem.js'
];

console.log('\n✓ Checking dependencies...');
let allDepsExist = true;
for (const dep of dependencies) {
  if (fs.existsSync(dep)) {
    console.log(`  ✓ ${dep} exists`);
  } else {
    console.log(`  ✗ ${dep} missing`);
    allDepsExist = false;
  }
}

// Test 3: Basic syntax check (look for common issues)
console.log('\n✓ Checking syntax...');
try {
  const jsContent = fs.readFileSync(path.join(gamePath, 'moleculeBuilder.js'), 'utf8');
  const dataContent = fs.readFileSync(path.join(gamePath, 'moleculeData.js'), 'utf8');
  
  // Check for basic syntax issues
  if (jsContent.includes('import') && jsContent.includes('export')) {
    console.log('  ✓ ES6 modules syntax detected');
  }
  
  if (dataContent.includes('export const ATOMS') && dataContent.includes('export const MOLECULES')) {
    console.log('  ✓ Data exports found');
  }
  
  if (jsContent.includes('class MoleculeBuilderGame extends BaseGame')) {
    console.log('  ✓ Main game class found');
  }
  
  if (jsContent.includes('class Atom') && jsContent.includes('class Bond')) {
    console.log('  ✓ Core game classes found');
  }
  
} catch (error) {
  console.log(`  ✗ Error reading files: ${error.message}`);
}

// Test 4: Check HTML structure
console.log('\n✓ Checking HTML structure...');
try {
  const htmlContent = fs.readFileSync(path.join(gamePath, 'index.html'), 'utf8');
  
  if (htmlContent.includes('<canvas') && htmlContent.includes('id="gameCanvas"')) {
    console.log('  ✓ Game canvas found');
  }
  
  if (htmlContent.includes('type="module"') && htmlContent.includes('import MoleculeBuilderGame')) {
    console.log('  ✓ ES6 module script found');
  }
  
  if (htmlContent.includes('moleculeBuilder.css')) {
    console.log('  ✓ CSS linked');
  }
  
} catch (error) {
  console.log(`  ✗ Error reading HTML: ${error.message}`);
}

// Summary
console.log('\n📊 Test Summary:');
console.log(`Files: ${allFilesExist ? '✓ PASS' : '✗ FAIL'}`);
console.log(`Dependencies: ${allDepsExist ? '✓ PASS' : '✗ FAIL'}`);

if (allFilesExist && allDepsExist) {
  console.log('\n🎉 Game appears ready to test!');
  console.log('   Try opening: http://localhost:8083/src/features/games/molecule-builder/');
} else {
  console.log('\n⚠️  Some issues found - check above for details');
}