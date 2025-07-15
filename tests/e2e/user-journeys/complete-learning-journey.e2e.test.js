/**
 * @vitest-environment jsdom
 */

import { expect, test, describe, beforeEach } from 'vitest';
import { page } from '@vitest/browser/context';

describe('Complete Learning Journey E2E', () => {
  beforeEach(async () => {
    // Navigate to the main page
    await page.goto('/');
  });

  test('first-time visitor completes full learning journey', async () => {
    // Step 1: Landing page loads correctly
    await expect.element(page.getByRole('heading', { name: /learnimals/i })).toBeInTheDocument();
    await expect.element(page.getByText(/educational games and activities/i)).toBeInTheDocument();

    // Step 2: Navigation to character creation
    const getStartedButton = page.getByRole('button', { name: /get started/i });
    await expect.element(getStartedButton).toBeVisible();
    await getStartedButton.click();

    // Step 3: Character creation process
    await expect.element(page.getByRole('heading', { name: /create your character/i })).toBeInTheDocument();
    
    // Select character name
    const nameInput = page.getByLabelText(/character name/i);
    await nameInput.fill('TestLearner');
    
    // Select character species
    const speciesSelect = page.getByLabelText(/choose species/i);
    await speciesSelect.selectOptions('cat');
    
    // Select favorite color
    const colorButton = page.getByRole('button', { name: /blue/i });
    await colorButton.click();
    
    // Complete character creation
    const createButton = page.getByRole('button', { name: /create character/i });
    await createButton.click();

    // Step 4: Dashboard/subject selection loads
    await expect.element(page.getByText(/hello, testlearner/i)).toBeInTheDocument();
    await expect.element(page.getByText(/choose a subject to explore/i)).toBeInTheDocument();

    // Verify all subjects are available
    await expect.element(page.getByRole('link', { name: /math/i })).toBeVisible();
    await expect.element(page.getByRole('link', { name: /science/i })).toBeVisible();
    await expect.element(page.getByRole('link', { name: /reading/i })).toBeVisible();
    await expect.element(page.getByRole('link', { name: /art/i })).toBeVisible();
    await expect.element(page.getByRole('link', { name: /coding/i })).toBeVisible();

    // Step 5: Navigate to Math subject
    const mathLink = page.getByRole('link', { name: /math/i });
    await mathLink.click();

    // Step 6: Math subject page loads with activities
    await expect.element(page.getByRole('heading', { name: /math with max/i })).toBeInTheDocument();
    await expect.element(page.getByText(/learn math with your feline friend/i)).toBeInTheDocument();
    
    // Verify feature cards are present
    await expect.element(page.getByText(/basic arithmetic/i)).toBeVisible();
    await expect.element(page.getByText(/geometry fun/i)).toBeVisible();
    await expect.element(page.getByText(/number patterns/i)).toBeVisible();

    // Step 7: Start a game
    const bubblePopGame = page.getByRole('link', { name: /bubble pop game/i });
    await expect.element(bubblePopGame).toBeVisible();
    await bubblePopGame.click();

    // Step 8: Game loads and can be played
    await expect.element(page.getByRole('heading', { name: /bubble pop/i })).toBeInTheDocument();
    
    // Wait for game canvas to load
    const gameCanvas = page.getByRole('img', { name: /game canvas/i });
    await expect.element(gameCanvas).toBeInTheDocument();
    
    // Verify game controls
    await expect.element(page.getByRole('button', { name: /start game/i })).toBeVisible();
    await expect.element(page.getByText(/score: 0/i)).toBeVisible();

    // Start the game
    const startButton = page.getByRole('button', { name: /start game/i });
    await startButton.click();

    // Verify game is running
    await expect.element(page.getByText(/time left/i)).toBeVisible();

    // Simulate some game interaction (clicking on game area)
    await gameCanvas.click();
    
    // Wait for score update
    await page.waitForTimeout(1000);

    // Step 9: Complete game and verify progress tracking
    // Let game timer run out or click pause
    const pauseButton = page.getByRole('button', { name: /pause/i });
    if (await pauseButton.isVisible()) {
      await pauseButton.click();
    }

    // Verify game over state and progress
    await expect.element(page.getByText(/game over/i)).toBeVisible();
    await expect.element(page.getByText(/final score/i)).toBeVisible();

    // Step 10: Return to dashboard and verify progress is saved
    const backButton = page.getByRole('button', { name: /back to math/i });
    await backButton.click();

    // Verify progress indicator
    await expect.element(page.getByText(/progress/i)).toBeVisible();
    await expect.element(page.getByText(/1.*activity completed/i)).toBeVisible();

    // Step 11: Navigate back to main dashboard
    const homeButton = page.getByRole('link', { name: /home/i });
    await homeButton.click();

    // Step 12: Verify overall progress tracking
    await expect.element(page.getByText(/recent activity/i)).toBeVisible();
    await expect.element(page.getByText(/math.*bubble pop/i)).toBeVisible();

    // Step 13: Try another subject to verify cross-subject progress
    const scienceLink = page.getByRole('link', { name: /science/i });
    await scienceLink.click();

    await expect.element(page.getByRole('heading', { name: /science with bella/i })).toBeInTheDocument();
    
    // Verify character context is maintained
    await expect.element(page.getByText(/testlearner/i)).toBeVisible();

    // Step 14: Verify settings and profile access
    const profileButton = page.getByRole('button', { name: /profile/i });
    await profileButton.click();

    await expect.element(page.getByText(/character: testlearner/i)).toBeVisible();
    await expect.element(page.getByText(/species: cat/i)).toBeVisible();
    await expect.element(page.getByText(/total progress/i)).toBeVisible();

    console.log('✅ Complete learning journey test passed successfully');
  }, { timeout: 30000 });

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