// Adventure Quest Game Verification Test
console.log('🚀 Starting Adventure Quest Game Verification...');

async function verifyGameSystems() {
  const results = {
    moduleImports: false,
    gameInstantiation: false,
    systemsInitialized: false,
    renderingWorks: false,
    storySystem: false,
    challengeSystem: false,
    discoverySystem: false,
    navigationSystem: false
  };

  try {
    // Test 1: Module Imports
    console.log('1. Testing module imports...');
    const GameModule = await import('./src/features/games/adventure-quest/AdventureQuestGame.js');
    const AdventureQuestGame = GameModule.default;
    
    if (AdventureQuestGame) {
      results.moduleImports = true;
      console.log('✅ Game modules imported successfully');
    }

    // Test 2: Game Instantiation
    console.log('2. Testing game instantiation...');
    
    // Create a test canvas element
    const testCanvas = document.createElement('canvas');
    testCanvas.id = 'test-canvas';
    testCanvas.width = 640;
    testCanvas.height = 360;
    document.body.appendChild(testCanvas);
    
    const game = new AdventureQuestGame('test-canvas');
    
    if (game && game.gameState) {
      results.gameInstantiation = true;
      console.log('✅ Game instance created successfully');
      
      // Test 3: Systems Initialized
      console.log('3. Testing system initialization...');
      if (game.storyProgression && game.challengeManager && 
          game.discoveryTracker && game.islandNavigator) {
        results.systemsInitialized = true;
        console.log('✅ All game systems initialized');
        
        // Test 4: Rendering
        console.log('4. Testing rendering...');
        try {
          game.render();
          results.renderingWorks = true;
          console.log('✅ Game rendering works');
        } catch (renderError) {
          console.log('❌ Rendering failed:', renderError.message);
        }
        
        // Test 5: Story System
        console.log('5. Testing story system...');
        try {
          game.storyProgression.loadStory({ chapter: 'introduction' });
          if (game.storyProgression.currentChapter) {
            results.storySystem = true;
            console.log('✅ Story system functional');
          }
        } catch (storyError) {
          console.log('❌ Story system failed:', storyError.message);
        }
        
        // Test 6: Challenge System  
        console.log('6. Testing challenge system...');
        try {
          game.challengeManager.loadChallenge({ type: 'physics', challenge: 'gravity_basics' });
          if (game.challengeManager.currentChallenge) {
            results.challengeSystem = true;
            console.log('✅ Challenge system functional');
          }
        } catch (challengeError) {
          console.log('❌ Challenge system failed:', challengeError.message);
        }
        
        // Test 7: Discovery System
        console.log('7. Testing discovery system...');
        try {
          const initialCount = game.discoveryTracker.discoveries.length;
          game.discoveryTracker.addDiscovery({
            type: 'test',
            name: 'Test Discovery',
            points: 25
          });
          if (game.discoveryTracker.discoveries.length > initialCount) {
            results.discoverySystem = true;
            console.log('✅ Discovery system functional');
          }
        } catch (discoveryError) {
          console.log('❌ Discovery system failed:', discoveryError.message);
        }
        
        // Test 8: Navigation System
        console.log('8. Testing navigation system...');
        try {
          game.islandNavigator.loadNavigation({});
          results.navigationSystem = true;
          console.log('✅ Navigation system functional');
        } catch (navError) {
          console.log('❌ Navigation system failed:', navError.message);
        }
        
        // Cleanup
        game.destroy();
        document.body.removeChild(testCanvas);
      }
    }
    
  } catch (error) {
    console.log('❌ Critical error during testing:', error.message);
  }
  
  // Report Results
  console.log('\n📊 Test Results Summary:');
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests*100)}%)`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! Game is ready to play!');
    return true;
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.');
    return false;
  }
}

// Run the verification
verifyGameSystems().then(success => {
  if (success) {
    console.log('\n🚀 Adventure Quest game is fully functional and ready for players!');
  } else {
    console.log('\n🔧 Adventure Quest game needs some fixes before it can be played reliably.');
  }
});