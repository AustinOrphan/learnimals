// Test the core game mechanics
import * as moleculeData from './src/features/games/molecule-builder/moleculeData.js';

console.log('🧪 Testing Molecule Builder Game Mechanics\n');

// Test 1: Data integrity
console.log('1. Testing data integrity...');
console.log(`   Atoms: ${Object.keys(moleculeData.ATOMS).length}`);
console.log(`   Molecules: ${Object.keys(moleculeData.MOLECULES).length}`);
console.log(`   Challenges: ${Object.keys(moleculeData.CHALLENGES).length}`);

// Test 2: Atom retrieval
console.log('\n2. Testing atom retrieval...');
const hydrogen = moleculeData.getAtomBySymbol('H');
if (hydrogen) {
  console.log(`   ✓ Hydrogen: ${hydrogen.name} (${hydrogen.symbol})`);
} else {
  console.log('   ✗ Failed to get hydrogen atom');
}

// Test 3: Molecule retrieval
console.log('\n3. Testing molecule retrieval...');
const water = moleculeData.getMoleculeById('H2O');
if (water) {
  console.log(`   ✓ Water: ${water.name} (${water.formula})`);
  console.log(`   Atoms in water: ${water.atoms.length}`);
} else {
  console.log('   ✗ Failed to get water molecule');
}

// Test 4: Challenge retrieval
console.log('\n4. Testing challenge retrieval...');
const beginnerChallenges = moleculeData.getChallengesForDifficulty('beginner');
if (beginnerChallenges && beginnerChallenges.length > 0) {
  console.log(`   ✓ Beginner challenges: ${beginnerChallenges.length}`);
  console.log(`   First challenge: ${beginnerChallenges[0].title}`);
} else {
  console.log('   ✗ No beginner challenges found');
}

// Test 5: Validation function (create mock atoms)
console.log('\n5. Testing molecule validation...');
try {
  // Create mock atoms for water (H2O)
  const mockAtoms = [
    { type: 'O' },
    { type: 'H' },
    { type: 'H' }
  ];
  
  const mockBonds = [
    { from: 0, to: 1 },
    { from: 0, to: 2 }
  ];
  
  const isValid = moleculeData.validateMoleculeStructure(mockAtoms, mockBonds, 'H2O');
  console.log(`   Water validation: ${isValid ? '✓ PASS' : '✗ FAIL'}`);
  
} catch (error) {
  console.log(`   ✗ Validation error: ${error.message}`);
}

// Test 6: Score calculation
console.log('\n6. Testing score calculation...');
const score = moleculeData.calculateMoleculeScore('H2O', 25000, 1);
console.log(`   Water score (25s, 1 hint): ${score} points`);

// Test 7: Random facts
console.log('\n7. Testing random facts...');
const fact = moleculeData.getRandomChemistryFact();
console.log(`   Random fact: ${fact}`);

console.log('\n✓ Mechanics testing complete!');