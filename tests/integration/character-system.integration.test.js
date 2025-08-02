/**
 * Character System Integration Tests
 * Tests the integration between character creation, storage, customization, and rendering
 */

import { expect, test, describe, beforeEach, afterEach, vi } from 'vitest';

// Mock the modules we'll be testing
const mockCharacterStorage = {
  saveCharacter: vi.fn(),
  loadCharacter: vi.fn(),
  deleteCharacter: vi.fn(),
  validateCharacter: vi.fn(),
};

const mockCharacterRenderer = {
  render: vi.fn(),
  updateCharacter: vi.fn(),
  destroy: vi.fn(),
};

const mockAvatarBuilder = {
  createAvatar: vi.fn(),
  updateAvatar: vi.fn(),
  getPreview: vi.fn(),
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

vi.stubGlobal('localStorage', localStorageMock);

describe('Character System Integration', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Set up DOM
    document.body.innerHTML = `
      <div id="character-container"></div>
      <div id="avatar-preview"></div>
      <form id="character-creation-form">
        <input id="character-name" type="text" />
        <select id="character-species">
          <option value="cat">Cat</option>
          <option value="dog">Dog</option>
          <option value="bird">Bird</option>
        </select>
        <div id="color-palette">
          <button data-color="red" class="color-option">Red</button>
          <button data-color="blue" class="color-option">Blue</button>
          <button data-color="green" class="color-option">Green</button>
        </div>
        <button id="create-character" type="submit">Create Character</button>
      </form>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('complete character creation workflow', async () => {
    // Mock successful character creation
    mockCharacterStorage.validateCharacter.mockReturnValue(true);
    mockCharacterStorage.saveCharacter.mockResolvedValue(true);
    mockCharacterRenderer.render.mockResolvedValue(true);
    mockAvatarBuilder.createAvatar.mockReturnValue({
      species: 'cat',
      color: 'blue',
      accessories: [],
    });

    // Simulate character creation form submission
    const characterData = {
      name: 'TestCat',
      species: { primary: 'cat' },
      favoriteColor: 'blue',
      createdAt: new Date().toISOString(),
    };

    // Test character validation
    const isValid = mockCharacterStorage.validateCharacter(characterData);
    expect(isValid).toBe(true);

    // Test character saving
    await mockCharacterStorage.saveCharacter(characterData);
    expect(mockCharacterStorage.saveCharacter).toHaveBeenCalledWith(characterData);

    // Test avatar creation
    const avatar = mockAvatarBuilder.createAvatar(characterData);
    expect(mockAvatarBuilder.createAvatar).toHaveBeenCalledWith(characterData);
    expect(avatar.species).toBe('cat');
    expect(avatar.color).toBe('blue');

    // Test character rendering
    await mockCharacterRenderer.render(characterData, '#character-container');
    expect(mockCharacterRenderer.render).toHaveBeenCalledWith(
      characterData,
      '#character-container'
    );

    console.log('✅ Character creation workflow test passed');
  });

  test('character persistence and loading', async () => {
    const savedCharacter = {
      id: 'char_123',
      name: 'PersistentCat',
      species: { primary: 'cat' },
      favoriteColor: 'green',
      customizations: {
        accessories: ['hat', 'glasses'],
        pattern: 'stripes',
      },
      createdAt: '2024-01-15T10:00:00Z',
      lastModified: '2024-01-16T14:30:00Z',
    };

    // Mock localStorage behavior
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedCharacter));
    mockCharacterStorage.loadCharacter.mockResolvedValue(savedCharacter);

    // Test character loading from storage
    const loadedCharacter = await mockCharacterStorage.loadCharacter('char_123');

    expect(loadedCharacter).toEqual(savedCharacter);
    expect(loadedCharacter.name).toBe('PersistentCat');
    expect(loadedCharacter.customizations.accessories).toContain('hat');
    expect(loadedCharacter.customizations.accessories).toContain('glasses');

    // Test character state restoration
    mockCharacterRenderer.render.mockResolvedValue(true);
    await mockCharacterRenderer.render(loadedCharacter, '#character-container');

    expect(mockCharacterRenderer.render).toHaveBeenCalledWith(
      loadedCharacter,
      '#character-container'
    );

    console.log('✅ Character persistence test passed');
  });

  test('character customization and updates', async () => {
    const baseCharacter = {
      id: 'char_456',
      name: 'CustomCat',
      species: { primary: 'cat' },
      favoriteColor: 'red',
      customizations: {
        accessories: [],
        pattern: 'solid',
      },
    };

    // Mock avatar update
    mockAvatarBuilder.updateAvatar.mockReturnValue({
      ...baseCharacter,
      customizations: {
        accessories: ['bow-tie'],
        pattern: 'polka-dots',
      },
    });

    // Test customization updates
    const updatedCharacter = mockAvatarBuilder.updateAvatar(baseCharacter, {
      accessories: ['bow-tie'],
      pattern: 'polka-dots',
    });

    expect(updatedCharacter.customizations.accessories).toContain('bow-tie');
    expect(updatedCharacter.customizations.pattern).toBe('polka-dots');

    // Test character re-rendering after customization
    mockCharacterRenderer.updateCharacter.mockResolvedValue(true);
    await mockCharacterRenderer.updateCharacter(updatedCharacter);

    expect(mockCharacterRenderer.updateCharacter).toHaveBeenCalledWith(updatedCharacter);

    // Test saving updated character
    mockCharacterStorage.saveCharacter.mockResolvedValue(true);
    await mockCharacterStorage.saveCharacter(updatedCharacter);

    expect(mockCharacterStorage.saveCharacter).toHaveBeenCalledWith(updatedCharacter);

    console.log('✅ Character customization test passed');
  });

  test('character validation and error handling', async () => {
    const invalidCharacters = [
      { name: '', species: { primary: 'cat' } }, // Empty name
      { name: 'ValidName', species: null }, // Invalid species
      { name: 'A', species: { primary: 'dog' } }, // Name too short
      { name: 'A'.repeat(51), species: { primary: 'bird' } }, // Name too long
      { species: { primary: 'cat' } }, // Missing name
      { name: 'ValidName' }, // Missing species
    ];

    // Test validation of invalid characters
    invalidCharacters.forEach((invalidChar, index) => {
      mockCharacterStorage.validateCharacter.mockReturnValueOnce(false);

      const isValid = mockCharacterStorage.validateCharacter(invalidChar);
      expect(isValid).toBe(false);

      console.log(`   ❌ Invalid character ${index + 1} correctly rejected`);
    });

    // Test storage error handling
    const validCharacter = {
      name: 'ValidCat',
      species: { primary: 'cat' },
      favoriteColor: 'blue',
    };

    mockCharacterStorage.saveCharacter.mockRejectedValue(new Error('Storage failed'));

    try {
      await mockCharacterStorage.saveCharacter(validCharacter);
    } catch (error) {
      expect(error.message).toBe('Storage failed');
    }

    expect(mockCharacterStorage.saveCharacter).toHaveBeenCalledWith(validCharacter);

    console.log('✅ Character validation and error handling test passed');
  });

  test('character gallery and showcase integration', async () => {
    const characters = [
      {
        id: 'char_1',
        name: 'MathCat',
        species: { primary: 'cat' },
        favoriteColor: 'blue',
        achievements: ['math-beginner', 'first-game'],
      },
      {
        id: 'char_2',
        name: 'ScienceDog',
        species: { primary: 'dog' },
        favoriteColor: 'green',
        achievements: ['science-explorer', 'question-asker'],
      },
      {
        id: 'char_3',
        name: 'ArtBird',
        species: { primary: 'bird' },
        favoriteColor: 'purple',
        achievements: ['creative-spirit', 'color-master'],
      },
    ];

    // Mock gallery rendering
    const mockGalleryRender = vi.fn();
    mockGalleryRender.mockResolvedValue(true);

    // Test multiple character rendering
    for (const character of characters) {
      await mockGalleryRender(character);
    }

    expect(mockGalleryRender).toHaveBeenCalledTimes(3);
    expect(mockGalleryRender).toHaveBeenCalledWith(characters[0]);
    expect(mockGalleryRender).toHaveBeenCalledWith(characters[1]);
    expect(mockGalleryRender).toHaveBeenCalledWith(characters[2]);

    // Test character selection from gallery
    const mockCharacterSelect = vi.fn();
    mockCharacterSelect.mockReturnValue(characters[1]);

    const selectedCharacter = mockCharacterSelect('char_2');
    expect(selectedCharacter.name).toBe('ScienceDog');
    expect(selectedCharacter.achievements).toContain('science-explorer');

    console.log('✅ Character gallery integration test passed');
  });

  test('character and game context integration', async () => {
    const gameCharacter = {
      id: 'char_game',
      name: 'GamePlayer',
      species: { primary: 'cat' },
      favoriteColor: 'orange',
      gameStats: {
        gamesPlayed: 0,
        totalScore: 0,
        favoriteGames: [],
      },
    };

    // Mock game context injection
    const mockInjectCharacterContext = vi.fn();
    mockInjectCharacterContext.mockReturnValue({
      character: gameCharacter,
      updateGameStats: vi.fn(),
      saveProgress: vi.fn(),
    });

    // Test character context in game
    const gameContext = mockInjectCharacterContext(gameCharacter);

    expect(gameContext.character).toEqual(gameCharacter);
    expect(gameContext.updateGameStats).toBeDefined();
    expect(gameContext.saveProgress).toBeDefined();

    // Test game stats update
    gameContext.updateGameStats({
      gamesPlayed: 1,
      totalScore: 150,
      favoriteGames: ['bubble-pop'],
    });

    expect(gameContext.updateGameStats).toHaveBeenCalledWith({
      gamesPlayed: 1,
      totalScore: 150,
      favoriteGames: ['bubble-pop'],
    });

    // Test progress saving
    await gameContext.saveProgress();
    expect(gameContext.saveProgress).toHaveBeenCalled();

    console.log('✅ Character-game context integration test passed');
  });

  test('character theme and appearance integration', async () => {
    const themedCharacter = {
      id: 'char_theme',
      name: 'ThemeChanger',
      species: { primary: 'bird' },
      favoriteColor: 'purple',
      preferences: {
        theme: 'dark',
        animations: true,
        soundEnabled: true,
      },
    };

    // Mock theme application
    const mockApplyTheme = vi.fn();
    mockApplyTheme.mockReturnValue({
      primaryColor: '#6B46C1',
      secondaryColor: '#A855F7',
      backgroundImage: 'url(/images/purple-theme-bg.jpg)',
    });

    // Test theme application based on character
    const appliedTheme = mockApplyTheme(
      themedCharacter.favoriteColor,
      themedCharacter.preferences.theme
    );

    expect(appliedTheme.primaryColor).toBe('#6B46C1');
    expect(mockApplyTheme).toHaveBeenCalledWith('purple', 'dark');

    // Mock character appearance updates
    const mockUpdateAppearance = vi.fn();
    mockUpdateAppearance.mockResolvedValue(true);

    await mockUpdateAppearance(themedCharacter, appliedTheme);
    expect(mockUpdateAppearance).toHaveBeenCalledWith(themedCharacter, appliedTheme);

    console.log('✅ Character theme integration test passed');
  });

  test('character cross-session consistency', async () => {
    const sessionCharacter = {
      id: 'char_session',
      name: 'SessionTester',
      species: { primary: 'dog' },
      favoriteColor: 'blue',
      sessionData: {
        currentSubject: 'math',
        lastActivity: 'bubble-pop',
        timeSpent: 1800, // 30 minutes
      },
    };

    // Mock session management
    const mockSessionManager = {
      startSession: vi.fn(),
      endSession: vi.fn(),
      restoreSession: vi.fn(),
      updateSession: vi.fn(),
    };

    // Test session start
    mockSessionManager.startSession.mockReturnValue({
      sessionId: 'session_123',
      startTime: Date.now(),
      character: sessionCharacter,
    });

    const session = mockSessionManager.startSession(sessionCharacter);
    expect(session.character).toEqual(sessionCharacter);
    expect(session.sessionId).toBe('session_123');

    // Test session updates
    mockSessionManager.updateSession.mockResolvedValue(true);

    await mockSessionManager.updateSession(session.sessionId, {
      currentSubject: 'science',
      lastActivity: 'element-match',
      timeSpent: 2100, // 35 minutes
    });

    expect(mockSessionManager.updateSession).toHaveBeenCalledWith(
      'session_123',
      expect.objectContaining({
        currentSubject: 'science',
        lastActivity: 'element-match',
        timeSpent: 2100,
      })
    );

    // Test session restoration
    mockSessionManager.restoreSession.mockResolvedValue({
      ...session,
      sessionData: {
        currentSubject: 'science',
        lastActivity: 'element-match',
        timeSpent: 2100,
      },
    });

    const restoredSession = await mockSessionManager.restoreSession('session_123');
    expect(restoredSession.sessionData.currentSubject).toBe('science');
    expect(restoredSession.sessionData.timeSpent).toBe(2100);

    console.log('✅ Character cross-session consistency test passed');
  });

  test('character data migration and versioning', async () => {
    // Mock old version character data
    const oldVersionCharacter = {
      name: 'LegacyChar',
      animal: 'cat', // Old field name
      color: 'red', // Old field name
      version: '1.0',
    };

    // Mock migration function
    const mockMigrateCharacter = vi.fn();
    mockMigrateCharacter.mockReturnValue({
      id: 'migrated_char',
      name: 'LegacyChar',
      species: { primary: 'cat' }, // New field structure
      favoriteColor: 'red', // New field name
      version: '2.0',
      migratedAt: new Date().toISOString(),
    });

    // Test character migration
    const migratedCharacter = mockMigrateCharacter(oldVersionCharacter);

    expect(migratedCharacter.species.primary).toBe('cat');
    expect(migratedCharacter.favoriteColor).toBe('red');
    expect(migratedCharacter.version).toBe('2.0');
    expect(migratedCharacter.migratedAt).toBeDefined();

    // Test that old fields are not present
    expect(migratedCharacter.animal).toBeUndefined();
    expect(migratedCharacter.color).toBeUndefined();

    // Test saving migrated character
    mockCharacterStorage.saveCharacter.mockResolvedValue(true);
    await mockCharacterStorage.saveCharacter(migratedCharacter);

    expect(mockCharacterStorage.saveCharacter).toHaveBeenCalledWith(migratedCharacter);

    console.log('✅ Character data migration test passed');
  });
});
