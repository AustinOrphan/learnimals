/**
 * Test file for Character Generation System
 * This file tests the core functionality of the character generation system
 *
 * Part of Phase D: Character Generator Core
 */

import { CharacterGenerationAPI, CharacterUtils } from './index.js';
import { runRegressionTests } from './test-regression.js';

/**
 * Test the character generation system
 */
async function testCharacterSystem() {
  console.log('🧪 Testing Character Generation System...\n');

  const results = {
    tests: 0,
    passed: 0,
    failed: 0,
    errors: [],
  };

  // Test 1: Basic character creation
  console.log('Test 1: Basic character creation');
  try {
    results.tests++;
    const character = await CharacterGenerationAPI.createCharacter({
      name: 'Test Character',
      subject: 'math',
      autoSave: false,
    });

    if (character.success && character.character.name === 'Test Character') {
      console.log('✅ Basic character creation passed');
      results.passed++;
    } else {
      console.log('❌ Basic character creation failed:', character.error);
      results.failed++;
      results.errors.push('Basic character creation failed');
    }
  } catch (error) {
    console.log('❌ Basic character creation error:', error.message);
    results.failed++;
    results.errors.push(`Basic character creation error: ${error.message}`);
  }

  // Test 2: Random character generation
  console.log('\nTest 2: Random character generation');
  try {
    results.tests++;
    const randomCharacter = await CharacterGenerationAPI.generateRandomCharacter('science', {
      autoSave: false,
    });

    if (randomCharacter.success && randomCharacter.character.subject === 'science') {
      console.log('✅ Random character generation passed');
      results.passed++;
    } else {
      console.log('❌ Random character generation failed:', randomCharacter.error);
      results.failed++;
      results.errors.push('Random character generation failed');
    }
  } catch (error) {
    console.log('❌ Random character generation error:', error.message);
    results.failed++;
    results.errors.push(`Random character generation error: ${error.message}`);
  }

  // Test 3: Character validation
  console.log('\nTest 3: Character validation');
  try {
    results.tests++;
    const validCharacter = {
      id: 'test-character-123',
      name: 'Valid Character',
      subject: 'reading',
      appearance: {
        baseShape: 'circle',
        size: 'medium',
        primaryColor: '#4A90E2',
        secondaryColor: '#FFFFFF',
        accentColor: '#FFD700',
      },
      personality: {
        traits: ['friendly', 'patient'],
        primaryTrait: 'friendly',
        voiceType: 'child',
      },
      education: {
        specialties: ['Stories', 'Vocabulary'],
        difficultyLevel: 'beginner',
        ageRange: { min: 4, max: 8 },
        teachingStyle: 'visual',
      },
    };

    const validation = CharacterGenerationAPI.validateCharacter(validCharacter);

    if (validation.isValid) {
      console.log('✅ Character validation passed');
      results.passed++;
    } else {
      console.log('❌ Character validation failed:', validation.errors);
      results.failed++;
      results.errors.push('Character validation failed');
    }
  } catch (error) {
    console.log('❌ Character validation error:', error.message);
    results.failed++;
    results.errors.push(`Character validation error: ${error.message}`);
  }

  // Test 4: Invalid character validation
  console.log('\nTest 4: Invalid character validation');
  try {
    results.tests++;
    const invalidCharacter = {
      name: '', // Invalid: empty name
      subject: 'invalid-subject', // Invalid: not in enum
      appearance: {
        primaryColor: 'not-a-color', // Invalid: wrong format
      },
      personality: {
        traits: [], // Invalid: empty array
        primaryTrait: 'nonexistent-trait',
      },
    };

    const validation = CharacterGenerationAPI.validateCharacter(invalidCharacter);

    if (!validation.isValid && validation.errors.length > 0) {
      console.log('✅ Invalid character validation passed (correctly detected errors)');
      results.passed++;
    } else {
      console.log('❌ Invalid character validation failed (should have detected errors)');
      results.failed++;
      results.errors.push('Invalid character validation failed');
    }
  } catch (error) {
    console.log('❌ Invalid character validation error:', error.message);
    results.failed++;
    results.errors.push(`Invalid character validation error: ${error.message}`);
  }

  // Test 5: Template creation
  console.log('\nTest 5: Template creation');
  try {
    results.tests++;
    const templateCharacter = await CharacterGenerationAPI.createFromTemplate('art', {
      name: 'Template Character',
      autoSave: false,
    });

    if (templateCharacter.success && templateCharacter.character.subject === 'art') {
      console.log('✅ Template creation passed');
      results.passed++;
    } else {
      console.log('❌ Template creation failed:', templateCharacter.error);
      results.failed++;
      results.errors.push('Template creation failed');
    }
  } catch (error) {
    console.log('❌ Template creation error:', error.message);
    results.failed++;
    results.errors.push(`Template creation error: ${error.message}`);
  }

  // Test 6: Preview generation
  console.log('\nTest 6: Preview generation');
  try {
    results.tests++;
    const preview = CharacterGenerationAPI.generatePreview({
      name: 'Preview Character',
      subject: 'coding',
    });

    if (preview.character && preview.character.name === 'Preview Character') {
      console.log('✅ Preview generation passed');
      results.passed++;
    } else {
      console.log('❌ Preview generation failed');
      results.failed++;
      results.errors.push('Preview generation failed');
    }
  } catch (error) {
    console.log('❌ Preview generation error:', error.message);
    results.failed++;
    results.errors.push(`Preview generation error: ${error.message}`);
  }

  // Test 7: Character utilities
  console.log('\nTest 7: Character utilities');
  try {
    results.tests++;
    const subjects = CharacterUtils.getAvailableSubjects();
    const colorPalettes = CharacterUtils.getColorPalettes('math');
    const namesSuggestions = CharacterUtils.getNameSuggestions('science', 3);

    if (subjects.length > 0 && colorPalettes.length > 0 && namesSuggestions.length === 3) {
      console.log('✅ Character utilities passed');
      results.passed++;
    } else {
      console.log('❌ Character utilities failed');
      results.failed++;
      results.errors.push('Character utilities failed');
    }
  } catch (error) {
    console.log('❌ Character utilities error:', error.message);
    results.failed++;
    results.errors.push(`Character utilities error: ${error.message}`);
  }

  // Test 8: Storage operations (without persistence)
  console.log('\nTest 8: Storage operations');
  try {
    results.tests++;

    // Create a character and try to save/load
    const character = await CharacterGenerationAPI.createCharacter({
      name: 'Storage Test Character',
      subject: 'math',
      autoSave: true, // This should save to storage
    });

    if (character.success && character.characterId) {
      const loadedCharacter = CharacterGenerationAPI.loadCharacter(character.characterId);

      if (loadedCharacter && loadedCharacter.name === 'Storage Test Character') {
        console.log('✅ Storage operations passed');
        results.passed++;

        // Clean up
        CharacterGenerationAPI.deleteCharacter(character.characterId);
      } else {
        console.log('❌ Storage operations failed (character not loaded correctly)');
        results.failed++;
        results.errors.push('Storage operations failed - character not loaded');
      }
    } else {
      console.log('❌ Storage operations failed (character not saved):', character.error);
      results.failed++;
      results.errors.push('Storage operations failed - character not saved');
    }
  } catch (error) {
    console.log('❌ Storage operations error:', error.message);
    results.failed++;
    results.errors.push(`Storage operations error: ${error.message}`);
  }

  // Run regression tests
  console.log('\n' + '='.repeat(50));
  console.log('Running Regression Tests...');
  console.log('='.repeat(50));

  const regressionResults = await runRegressionTests();

  // Merge regression results with main results
  results.tests += regressionResults.tests;
  results.passed += regressionResults.passed;
  results.failed += regressionResults.failed;
  results.errors = results.errors.concat(regressionResults.errors);

  // Test Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Complete Test Results Summary');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${results.tests}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Success Rate: ${((results.passed / results.tests) * 100).toFixed(1)}%`);

  if (results.errors.length > 0) {
    console.log('\n🚨 Errors:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Character generation system is working correctly.');
  } else {
    console.log(`\n⚠️  ${results.failed} test(s) failed. Please review the errors above.`);
  }

  return results;
}

// Additional utility function to test individual components
export async function testComponentIntegration() {
  console.log('\n🔧 Testing Component Integration...\n');

  // Test CharacterWizard integration (if available)
  if (typeof window !== 'undefined' && window.CharacterWizard) {
    console.log('Testing CharacterWizard integration...');
    try {
      const wizard = new window.CharacterWizard({
        onComplete: result => console.log('Wizard completed:', result),
        onCancel: () => console.log('Wizard cancelled'),
        onPreviewUpdate: character => console.log('Preview updated:', character.name),
      });

      console.log('✅ CharacterWizard instantiation passed');

      // Test wizard methods
      wizard.reset();
      console.log('✅ CharacterWizard reset passed');

      return true;
    } catch (error) {
      console.log('❌ CharacterWizard integration error:', error.message);
      return false;
    }
  } else {
    console.log('ℹ️  CharacterWizard not available in current environment');
    return true;
  }
}

// Performance testing
export async function testPerformance() {
  console.log('\n⚡ Testing Performance...\n');

  const results = {
    characterCreation: 0,
    validation: 0,
    bulkOperations: 0,
  };

  // Test character creation performance
  console.log('Testing character creation performance...');
  const startTime = performance.now();

  for (let i = 0; i < 10; i++) {
    await CharacterGenerationAPI.createCharacter({
      name: `Performance Test ${i}`,
      subject: 'math',
      autoSave: false,
    });
  }

  results.characterCreation = performance.now() - startTime;
  console.log(`✅ Created 10 characters in ${results.characterCreation.toFixed(2)}ms`);

  // Test validation performance
  console.log('Testing validation performance...');
  const validationStart = performance.now();

  const testCharacter = {
    id: 'perf-test',
    name: 'Performance Test Character',
    subject: 'science',
    appearance: {
      baseShape: 'circle',
      size: 'medium',
      primaryColor: '#4A90E2',
      secondaryColor: '#FFFFFF',
      accentColor: '#FFD700',
    },
    personality: { traits: ['friendly'], primaryTrait: 'friendly', voiceType: 'child' },
    education: {
      specialties: ['Testing'],
      difficultyLevel: 'beginner',
      ageRange: { min: 4, max: 12 },
      teachingStyle: 'mixed',
    },
  };

  for (let i = 0; i < 100; i++) {
    CharacterGenerationAPI.validateCharacter(testCharacter);
  }

  results.validation = performance.now() - validationStart;
  console.log(`✅ Validated character 100 times in ${results.validation.toFixed(2)}ms`);

  return results;
}

// Export the main test function
export default testCharacterSystem;

// Auto-run tests if this file is executed directly
if (typeof window !== 'undefined' && window.location) {
  // Running in browser
  console.log(
    'Character Generation System Test Suite loaded. Run testCharacterSystem() to begin testing.'
  );
} else if (typeof module !== 'undefined' && require.main === module) {
  // Running in Node.js
  testCharacterSystem().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}
