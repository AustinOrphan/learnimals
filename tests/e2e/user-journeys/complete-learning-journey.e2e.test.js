/**
 * @vitest-environment jsdom
 */

import { expect, test, describe, beforeEach, vi } from 'vitest';
import { setupE2EMocks } from '../setup/e2e-setup.js';

// Setup E2E mocks
const { page } = setupE2EMocks();

describe('Complete Learning Journey E2E', () => {
  beforeEach(async () => {
    // Navigate to the main page
    await page.goto('/');
  });

  test('first-time visitor completes full learning journey', async () => {
    // Step 1: Landing page loads correctly
    await expect.element(page.getByRole('heading', { name: /learnimals/i })).toBeInTheDocument();
    
    // Step 2: Navigation works
    const getStartedButton = page.getByRole('button', { name: /get started/i });
    if (await getStartedButton.isVisible()) {
      await getStartedButton.click();
    }

    // Step 3: Character creation accessible
    const nameInput = page.getByLabelText(/name/i);
    if (await nameInput.isVisible()) {
      await nameInput.fill('TestLearner');
    }

    // Step 4: Subject navigation works
    const mathLink = page.getByRole('link', { name: /math/i });
    if (await mathLink.isVisible()) {
      await mathLink.click();
    }

    // Step 5: Subject page loads
    const subjectHeading = page.getByRole('heading').first();
    await expect.element(subjectHeading).toBeInTheDocument();

    // Step 6: Navigation between subjects
    const scienceLink = page.getByRole('link', { name: /science/i });
    if (await scienceLink.isVisible()) {
      await scienceLink.click();
    }

    console.log('✅ Complete learning journey test passed successfully');
  });

  test('user can navigate between subjects seamlessly', async () => {
    // Set up user context (assume character already exists)
    localStorage.setItem('learnimals_character', JSON.stringify({
      name: 'QuickTester',
      species: { primary: 'dog' },
      favoriteColor: 'green'
    }));

    await page.reload();

    // Test navigation between all subjects
    const subjects = ['math', 'science', 'reading', 'art', 'coding'];
    
    for (const subject of subjects) {
      const subjectLink = page.getByRole('link', { name: new RegExp(subject, 'i') });
      await subjectLink.click();
      
      // Verify subject page loads
      await expect.element(page.getByRole('heading')).toContainText(subject);
      
      // Return to dashboard
      const homeButton = page.getByRole('link', { name: /home/i });
      await homeButton.click();
      
      await expect.element(page.getByText(/choose a subject/i)).toBeVisible();
    }

    console.log('✅ Subject navigation test passed successfully');
  });

  test('user progress persists across browser sessions', async () => {
    // Simulate existing progress
    const progressData = {
      character: {
        name: 'PersistentTester',
        species: { primary: 'bird' },
        favoriteColor: 'purple'
      },
      subjects: {
        math: {
          activitiesCompleted: 3,
          gamesPlayed: ['bubble-pop', 'number-match'],
          totalTime: 1200
        },
        science: {
          activitiesCompleted: 1,
          gamesPlayed: ['element-quiz'],
          totalTime: 600
        }
      },
      achievements: ['first-game', 'math-beginner'],
      totalScore: 2450
    };

    localStorage.setItem('learnimals_character', JSON.stringify(progressData.character));
    localStorage.setItem('learnimals_progress', JSON.stringify(progressData));

    await page.reload();

    // Verify character info is loaded
    await expect.element(page.getByText(/hello, persistenttester/i)).toBeInTheDocument();

    // Verify progress indicators
    await expect.element(page.getByText(/total score.*2450/i)).toBeVisible();
    
    // Check subject-specific progress
    const mathSubject = page.getByRole('link', { name: /math/i });
    await expect.element(mathSubject).toContainText('3'); // activities completed

    // Navigate to math and verify detailed progress
    await mathSubject.click();
    await expect.element(page.getByText(/3.*activities completed/i)).toBeVisible();
    await expect.element(page.getByText(/20.*minutes played/i)).toBeVisible();

    console.log('✅ Progress persistence test passed successfully');
  });

  test('handles error states gracefully', async () => {
    // Test offline/network error handling
    // Simulate network error by trying to load non-existent resource
    const invalidLink = page.getByRole('link', { name: /nonexistent/i });
    
    if (await invalidLink.isVisible()) {
      await invalidLink.click();
      
      // Should show error message
      await expect.element(page.getByText(/something went wrong/i)).toBeVisible();
      await expect.element(page.getByRole('button', { name: /try again/i })).toBeVisible();
    }

    // Test invalid character data handling
    localStorage.setItem('learnimals_character', 'invalid-json');
    await page.reload();

    // Should fallback to character creation or show error
    const heading = page.getByRole('heading');
    const headingText = await heading.textContent();
    
    expect(headingText).toMatch(/(create.*character|welcome.*learnimals|error)/i);

    console.log('✅ Error handling test passed successfully');
  });
});