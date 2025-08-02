/**
 * Regression Tests for Character Generation
 * Tests to prevent previously fixed bugs from reoccurring
 */

import {
  CharacterGenerationAPI,
  CharacterFactory,
  CharacterUtils,
  SubjectTemplates,
} from './index.js';

/**
 * Run all regression tests
 * @returns {Object} Test results
 */
export async function runRegressionTests() {
  console.log('\n🔧 Running Character Generation Regression Tests...\n');

  const results = {
    tests: 0,
    passed: 0,
    failed: 0,
    errors: [],
  };

  // Test 1: Timestamp Uniqueness (Bug #1: Static Date)
  await testTimestampUniqueness(results);

  // Test 2: All Subjects Have Templates (Bug #2)
  await testAllSubjectTemplates(results);

  // Test 3: Name Generation for All Subjects (Bug #3)
  await testNameGenerationCompleteness(results);

  // Test 4: Education Specialties for All Subjects (Bug #4)
  await testEducationSpecialties(results);

  // Test 5: Color Palettes for All Subjects (Bug #5)
  await testColorPalettes(results);

  // Test 6: Rapid Generation Stress Test
  await testRapidGeneration(results);

  // Test 7: Subject-Specific Validation
  await testSubjectValidation(results);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Regression Test Results');
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

  return results;
}

/**
 * Test 1: Verify timestamps are unique for each character
 */
async function testTimestampUniqueness(results) {
  console.log('Test 1: Timestamp Uniqueness');
  results.tests++;

  try {
    const timestamps = new Set();
    const characters = [];

    // Generate 10 characters rapidly
    for (let i = 0; i < 10; i++) {
      const result = await CharacterGenerationAPI.createCharacter({
        name: `Timestamp Test ${i}`,
        subject: 'math',
        autoSave: false,
      });

      if (result.success) {
        characters.push(result.character);
        timestamps.add(result.character.metadata.created);
        timestamps.add(result.character.metadata.modified);
      }
    }

    // Check if all timestamps are unique
    const expectedTimestamps = characters.length * 2; // created + modified for each
    if (timestamps.size === expectedTimestamps) {
      console.log('✅ All timestamps are unique');
      results.passed++;
    } else {
      console.log(
        `❌ Timestamp collision detected: ${timestamps.size}/${expectedTimestamps} unique`
      );
      results.failed++;
      results.errors.push('Timestamp uniqueness test failed - static date bug may have returned');
    }

    // Additional check: timestamps should be recent
    const now = Date.now();
    const allRecent = characters.every(char => {
      const created = new Date(char.metadata.created).getTime();
      return now - created < 60000; // Within last minute
    });

    if (!allRecent) {
      console.log('❌ Some timestamps are not recent');
      results.errors.push('Timestamps are not being generated dynamically');
    }
  } catch (error) {
    console.log('❌ Timestamp uniqueness test error:', error.message);
    results.failed++;
    results.errors.push(`Timestamp test error: ${error.message}`);
  }
}

/**
 * Test 2: Verify all subjects have complete templates
 */
async function testAllSubjectTemplates(results) {
  console.log('\nTest 2: All Subjects Have Templates');
  results.tests++;

  try {
    const allSubjects = CharacterUtils.getAvailableSubjects();
    const missingTemplates = [];

    allSubjects.forEach(subject => {
      if (!SubjectTemplates[subject]) {
        missingTemplates.push(subject);
      } else {
        // Verify template has required fields
        const template = SubjectTemplates[subject];
        if (!template.personality || !template.appearance || !template.education) {
          missingTemplates.push(`${subject} (incomplete)`);
        }
      }
    });

    if (missingTemplates.length === 0) {
      console.log(`✅ All ${allSubjects.length} subjects have complete templates`);
      results.passed++;
    } else {
      console.log(`❌ Missing templates for: ${missingTemplates.join(', ')}`);
      results.failed++;
      results.errors.push(`Missing subject templates: ${missingTemplates.join(', ')}`);
    }
  } catch (error) {
    console.log('❌ Subject template test error:', error.message);
    results.failed++;
    results.errors.push(`Subject template test error: ${error.message}`);
  }
}

/**
 * Test 3: Verify name generation works for all subjects
 */
async function testNameGenerationCompleteness(results) {
  console.log('\nTest 3: Name Generation for All Subjects');
  results.tests++;

  try {
    const factory = new CharacterFactory();
    const allSubjects = CharacterUtils.getAvailableSubjects();
    const failedSubjects = [];

    for (const subject of allSubjects) {
      const name = factory.generateRandomName(subject);
      if (!name || name === '' || name === 'Unknown') {
        failedSubjects.push(subject);
      }
    }

    // Also test that names are different
    const names = new Set();
    for (let i = 0; i < 20; i++) {
      const subject = allSubjects[i % allSubjects.length];
      names.add(factory.generateRandomName(subject));
    }

    if (failedSubjects.length === 0 && names.size > 10) {
      console.log(`✅ Name generation works for all ${allSubjects.length} subjects`);
      console.log(`   Generated ${names.size} unique names in test`);
      results.passed++;
    } else {
      if (failedSubjects.length > 0) {
        console.log(`❌ Name generation failed for: ${failedSubjects.join(', ')}`);
        results.errors.push(`Name generation failed for subjects: ${failedSubjects.join(', ')}`);
      }
      if (names.size <= 10) {
        console.log(`❌ Low name diversity: only ${names.size} unique names`);
        results.errors.push('Name generation lacks diversity');
      }
      results.failed++;
    }
  } catch (error) {
    console.log('❌ Name generation test error:', error.message);
    results.failed++;
    results.errors.push(`Name generation test error: ${error.message}`);
  }
}

/**
 * Test 4: Verify education specialties exist for all subjects
 */
async function testEducationSpecialties(results) {
  console.log('\nTest 4: Education Specialties for All Subjects');
  results.tests++;

  try {
    const factory = new CharacterFactory();
    const allSubjects = CharacterUtils.getAvailableSubjects();
    const missingSpecialties = [];

    for (const subject of allSubjects) {
      const specialties = factory.generationRules.educationSpecialties[subject];
      if (!specialties || specialties.length === 0) {
        missingSpecialties.push(subject);
      }
    }

    // Test that specialties are appropriate
    const testCharacter = await CharacterGenerationAPI.generateRandomCharacter('music', {
      autoSave: false,
    });

    const musicSpecialtiesValid =
      testCharacter.success &&
      testCharacter.character.education.specialties.length > 0 &&
      !testCharacter.character.education.specialties.includes('General Learning');

    if (missingSpecialties.length === 0 && musicSpecialtiesValid) {
      console.log(`✅ All ${allSubjects.length} subjects have education specialties`);
      results.passed++;
    } else {
      if (missingSpecialties.length > 0) {
        console.log(`❌ Missing specialties for: ${missingSpecialties.join(', ')}`);
        results.errors.push(`Missing education specialties: ${missingSpecialties.join(', ')}`);
      }
      if (!musicSpecialtiesValid) {
        console.log('❌ Subject-specific specialties not being applied');
        results.errors.push('Education specialties not properly subject-specific');
      }
      results.failed++;
    }
  } catch (error) {
    console.log('❌ Education specialties test error:', error.message);
    results.failed++;
    results.errors.push(`Education specialties test error: ${error.message}`);
  }
}

/**
 * Test 5: Verify color palettes work for all subjects
 */
async function testColorPalettes(results) {
  console.log('\nTest 5: Color Palettes for All Subjects');
  results.tests++;

  try {
    const allSubjects = CharacterUtils.getAvailableSubjects();
    const failedSubjects = [];

    for (const subject of allSubjects) {
      const palettes = CharacterUtils.getColorPalettes(subject);
      if (!palettes || palettes.length === 0) {
        failedSubjects.push(subject);
      }
    }

    // Test that different subjects get different colors
    const colorSets = new Map();
    for (const subject of allSubjects) {
      const result = await CharacterGenerationAPI.generateRandomCharacter(subject, {
        autoSave: false,
      });
      if (result.success) {
        const colors = `${result.character.appearance.primaryColor}-${result.character.appearance.secondaryColor}`;
        if (!colorSets.has(colors)) {
          colorSets.set(colors, []);
        }
        colorSets.get(colors).push(subject);
      }
    }

    // Check for color diversity
    const hasGoodDiversity = colorSets.size >= allSubjects.length * 0.7; // At least 70% unique

    if (failedSubjects.length === 0 && hasGoodDiversity) {
      console.log(`✅ All ${allSubjects.length} subjects have color palettes`);
      console.log(`   ${colorSets.size} unique color combinations found`);
      results.passed++;
    } else {
      if (failedSubjects.length > 0) {
        console.log(`❌ Missing color palettes for: ${failedSubjects.join(', ')}`);
        results.errors.push(`Missing color palettes: ${failedSubjects.join(', ')}`);
      }
      if (!hasGoodDiversity) {
        console.log(`❌ Poor color diversity: only ${colorSets.size} unique combinations`);
        results.errors.push('Insufficient color palette diversity');
      }
      results.failed++;
    }
  } catch (error) {
    console.log('❌ Color palette test error:', error.message);
    results.failed++;
    results.errors.push(`Color palette test error: ${error.message}`);
  }
}

/**
 * Test 6: Rapid generation stress test
 */
async function testRapidGeneration(results) {
  console.log('\nTest 6: Rapid Generation Stress Test');
  results.tests++;

  try {
    const startTime = Date.now();
    const successCount = { total: 0, passed: 0 };
    const errors = new Map();

    // Generate 50 characters rapidly
    const allSubjects = CharacterUtils.getAvailableSubjects();
    const promises = [];
    for (let i = 0; i < 50; i++) {
      const subject = allSubjects[i % allSubjects.length];
      promises.push(
        CharacterGenerationAPI.generateRandomCharacter(subject, {
          autoSave: false,
        })
          .then(result => {
            successCount.total++;
            if (result.success) {
              successCount.passed++;
            } else {
              const error = result.error || 'Unknown error';
              errors.set(error, (errors.get(error) || 0) + 1);
            }
          })
          .catch(error => {
            successCount.total++;
            const errorMsg = error.message || 'Exception thrown';
            errors.set(errorMsg, (errors.get(errorMsg) || 0) + 1);
          })
      );
    }

    await Promise.all(promises);
    const duration = Date.now() - startTime;
    const successRate = ((successCount.passed / successCount.total) * 100).toFixed(1);

    console.log(`   Generated ${successCount.total} characters in ${duration}ms`);
    console.log(`   Success rate: ${successRate}%`);

    if (successRate >= 95) {
      console.log('✅ Rapid generation stress test passed');
      results.passed++;
    } else {
      console.log(`❌ Rapid generation reliability issues: ${successRate}% success rate`);
      console.log('   Error breakdown:');
      errors.forEach((count, error) => {
        console.log(`   - ${error}: ${count} times`);
      });
      results.failed++;
      results.errors.push(`Rapid generation only ${successRate}% reliable`);
    }
  } catch (error) {
    console.log('❌ Rapid generation test error:', error.message);
    results.failed++;
    results.errors.push(`Rapid generation test error: ${error.message}`);
  }
}

/**
 * Test 7: Subject-specific validation
 */
async function testSubjectValidation(results) {
  console.log('\nTest 7: Subject-Specific Validation');
  results.tests++;

  try {
    const allSubjects = CharacterUtils.getAvailableSubjects();
    const validationFailures = [];

    for (const subject of allSubjects) {
      const result = await CharacterGenerationAPI.createFromTemplate(subject, {
        name: `${subject} Test Character`,
        autoSave: false,
      });

      if (!result.success) {
        validationFailures.push({
          subject,
          error: result.error,
          details: result.details,
        });
      } else {
        // Verify subject was set correctly
        if (result.character.subject !== subject) {
          validationFailures.push({
            subject,
            error: `Subject mismatch: expected ${subject}, got ${result.character.subject}`,
          });
        }
      }
    }

    if (validationFailures.length === 0) {
      console.log(`✅ All ${allSubjects.length} subject templates pass validation`);
      results.passed++;
    } else {
      console.log(`❌ Validation failures for ${validationFailures.length} subjects:`);
      validationFailures.forEach(failure => {
        console.log(`   - ${failure.subject}: ${failure.error}`);
        if (failure.details) {
          console.log(`     Details: ${JSON.stringify(failure.details)}`);
        }
      });
      results.failed++;
      results.errors.push(
        `Subject validation failures: ${validationFailures.map(f => f.subject).join(', ')}`
      );
    }
  } catch (error) {
    console.log('❌ Subject validation test error:', error.message);
    results.failed++;
    results.errors.push(`Subject validation test error: ${error.message}`);
  }
}

// Export individual test functions for targeted testing
export {
  testTimestampUniqueness,
  testAllSubjectTemplates,
  testNameGenerationCompleteness,
  testEducationSpecialties,
  testColorPalettes,
  testRapidGeneration,
  testSubjectValidation,
};
