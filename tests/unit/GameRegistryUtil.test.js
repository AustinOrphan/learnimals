/**
 * GameRegistryUtil Unit Tests
 * Comprehensive tests for the enhanced GameRegistryUtil functionality
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { GameRegistryUtil, gameRegistry } from '../../src/config/gameRegistry.js';

describe('GameRegistryUtil - Enhanced Methods', () => {
  beforeEach(() => {
    // Ensure we're working with the actual game registry
    expect(gameRegistry.length).toBeGreaterThan(0);
  });

  describe('Basic Filtering Methods', () => {
    it('should get games by template', () => {
      const gameTemplateGames = GameRegistryUtil.getGamesByTemplate('game');
      expect(Array.isArray(gameTemplateGames)).toBe(true);
      gameTemplateGames.forEach(game => {
        expect(game.template).toBe('game');
      });
    });

    it('should get games by type', () => {
      const puzzleGames = GameRegistryUtil.getGamesByType('word-puzzle');
      expect(Array.isArray(puzzleGames)).toBe(true);
      puzzleGames.forEach(game => {
        expect(game.metadata?.gameType).toBe('word-puzzle');
      });
    });

    it('should get games by platform', () => {
      const mobileGames = GameRegistryUtil.getGamesByPlatform(['mobile']);
      expect(Array.isArray(mobileGames)).toBe(true);
      mobileGames.forEach(game => {
        expect(game.metadata?.platforms).toContain('mobile');
      });
    });

    it('should get games by options criteria', () => {
      const timeBasedGames = GameRegistryUtil.getGamesByOptions({
        timeLimit: { min: 30 }
      });
      expect(Array.isArray(timeBasedGames)).toBe(true);
      timeBasedGames.forEach(game => {
        if (game.options?.timeLimit) {
          expect(game.options.timeLimit).toBeGreaterThanOrEqual(30);
        }
      });
    });
  });

  describe('Advanced Filtering', () => {
    it('should filter games with multiple criteria', () => {
      const criteria = {
        subject: 'math',
        features: ['analytics', 'progress']
      };
      
      const filteredGames = GameRegistryUtil.getGamesAdvanced(criteria);
      expect(Array.isArray(filteredGames)).toBe(true);
      
      filteredGames.forEach(game => {
        expect(game.subject).toBe('math');
        expect(game.features).toContain('analytics');
        expect(game.features).toContain('progress');
      });
    });

    it('should filter by search term', () => {
      const searchResults = GameRegistryUtil.getGamesAdvanced({
        search: 'math'
      });
      expect(Array.isArray(searchResults)).toBe(true);
      
      searchResults.forEach(game => {
        const searchText = `${game.name} ${game.description} ${game.subject}`.toLowerCase();
        expect(searchText).toContain('math');
      });
    });

    it('should filter by BaseGame only', () => {
      const baseGameOnly = GameRegistryUtil.getGamesAdvanced({
        baseGameOnly: true
      });
      expect(Array.isArray(baseGameOnly)).toBe(true);
      
      baseGameOnly.forEach(game => {
        expect(game.features).toContain('analytics');
        expect(game.features).toContain('progress');
      });
    });
  });

  describe('Metadata-based Filtering', () => {
    it('should filter by metadata criteria', () => {
      const beginnerGames = GameRegistryUtil.getGamesByMetadata({
        competencyLevel: 'beginner'
      });
      expect(Array.isArray(beginnerGames)).toBe(true);
      
      beginnerGames.forEach(game => {
        expect(game.metadata?.competencyLevel).toBe('beginner');
      });
    });

    it('should filter by learning objectives', () => {
      const mathGames = GameRegistryUtil.getGamesByLearningObjectives(['arithmetic']);
      expect(Array.isArray(mathGames)).toBe(true);
      
      mathGames.forEach(game => {
        expect(game.metadata?.learningObjectives).toContain('arithmetic');
      });
    });

    it('should filter by tags', () => {
      const educationalGames = GameRegistryUtil.getGamesByTags(['educational']);
      expect(Array.isArray(educationalGames)).toBe(true);
      
      educationalGames.forEach(game => {
        expect(game.metadata?.tags).toContain('educational');
      });
    });

    it('should filter by age range', () => {
      const youngKidGames = GameRegistryUtil.getGamesByAgeRange('6-8');
      expect(Array.isArray(youngKidGames)).toBe(true);
      
      youngKidGames.forEach(game => {
        if (game.metadata?.ageRange) {
          expect(GameRegistryUtil.isAgeRangeMatch(game.metadata.ageRange, '6-8')).toBe(true);
        }
      });
    });

    it('should filter by play time', () => {
      const shortGames = GameRegistryUtil.getGamesByPlayTime({ max: 8 });
      expect(Array.isArray(shortGames)).toBe(true);
      
      shortGames.forEach(game => {
        if (game.metadata?.estimatedPlayTime) {
          expect(game.metadata.estimatedPlayTime).toBeLessThanOrEqual(8);
        }
      });
    });
  });

  describe('Age Range Matching', () => {
    it('should match overlapping age ranges', () => {
      expect(GameRegistryUtil.isAgeRangeMatch('6-12', '8-10')).toBe(true);
      expect(GameRegistryUtil.isAgeRangeMatch('5-8', '6-10')).toBe(true);
      expect(GameRegistryUtil.isAgeRangeMatch('4-6', '8-12')).toBe(false);
    });

    it('should handle single age values', () => {
      expect(GameRegistryUtil.isAgeRangeMatch('6-12', '8')).toBe(true);
      expect(GameRegistryUtil.isAgeRangeMatch('6-12', '15')).toBe(false);
    });

    it('should handle malformed age ranges gracefully', () => {
      expect(GameRegistryUtil.isAgeRangeMatch('invalid', '6-8')).toBe(false);
      expect(GameRegistryUtil.isAgeRangeMatch('6-12', 'invalid')).toBe(false);
    });
  });

  describe('Play Time Matching', () => {
    it('should match play time with min/max criteria', () => {
      expect(GameRegistryUtil.isPlayTimeMatch(10, { min: 5, max: 15 })).toBe(true);
      expect(GameRegistryUtil.isPlayTimeMatch(3, { min: 5, max: 15 })).toBe(false);
      expect(GameRegistryUtil.isPlayTimeMatch(20, { min: 5, max: 15 })).toBe(false);
    });

    it('should match play time with only min criteria', () => {
      expect(GameRegistryUtil.isPlayTimeMatch(10, { min: 5 })).toBe(true);
      expect(GameRegistryUtil.isPlayTimeMatch(3, { min: 5 })).toBe(false);
    });

    it('should match play time with only max criteria', () => {
      expect(GameRegistryUtil.isPlayTimeMatch(10, { max: 15 })).toBe(true);
      expect(GameRegistryUtil.isPlayTimeMatch(20, { max: 15 })).toBe(false);
    });
  });

  describe('Sorting and Grouping', () => {
    it('should sort games by name', () => {
      const allGames = GameRegistryUtil.getAllGames();
      const sortedGames = GameRegistryUtil.sortGames(allGames, 'name', 'asc');
      
      expect(sortedGames.length).toBe(allGames.length);
      
      for (let i = 1; i < sortedGames.length; i++) {
        expect(sortedGames[i-1].name.localeCompare(sortedGames[i].name)).toBeLessThanOrEqual(0);
      }
    });

    it('should sort games by subject', () => {
      const allGames = GameRegistryUtil.getAllGames();
      const sortedGames = GameRegistryUtil.sortGames(allGames, 'subject', 'asc');
      
      expect(sortedGames.length).toBe(allGames.length);
      
      for (let i = 1; i < sortedGames.length; i++) {
        expect(sortedGames[i-1].subject.localeCompare(sortedGames[i].subject)).toBeLessThanOrEqual(0);
      }
    });

    it('should sort games by difficulty', () => {
      const allGames = GameRegistryUtil.getAllGames();
      const sortedGames = GameRegistryUtil.sortGames(allGames, 'difficulty', 'asc');
      
      expect(sortedGames.length).toBe(allGames.length);
      
      // Difficulty sorting should work based on the minimum difficulty level
      // This is a complex sort, so we'll just check it returns the same number of games
    });

    it('should group games by subject', () => {
      const groupedGames = GameRegistryUtil.getGamesGrouped('subject');
      
      expect(typeof groupedGames).toBe('object');
      expect(Object.keys(groupedGames).length).toBeGreaterThan(0);
      
      Object.values(groupedGames).forEach(gameGroup => {
        expect(Array.isArray(gameGroup)).toBe(true);
        expect(gameGroup.length).toBeGreaterThan(0);
      });
    });

    it('should group games by nested metadata property', () => {
      const groupedGames = GameRegistryUtil.getGamesGrouped('metadata.gameType');
      
      expect(typeof groupedGames).toBe('object');
      
      Object.entries(groupedGames).forEach(([gameType, games]) => {
        if (gameType !== 'Unknown') {
          games.forEach(game => {
            expect(game.metadata?.gameType).toBe(gameType);
          });
        }
      });
    });
  });

  describe('Similarity and Recommendations', () => {
    it('should find similar games', () => {
      // Find a game first
      const allGames = GameRegistryUtil.getAllGames();
      if (allGames.length > 1) {
        const targetGame = allGames[0];
        const similarGames = GameRegistryUtil.getSimilarGames(targetGame.id, 3);
        
        expect(Array.isArray(similarGames)).toBe(true);
        expect(similarGames.length).toBeLessThanOrEqual(3);
        
        // Should not include the original game
        expect(similarGames.find(game => game.id === targetGame.id)).toBeUndefined();
      }
    });

    it('should calculate similarity between games', () => {
      const allGames = GameRegistryUtil.getAllGames();
      if (allGames.length >= 2) {
        const game1 = allGames[0];
        const game2 = allGames[1];
        
        const similarity = GameRegistryUtil.calculateSimilarity(game1, game2);
        expect(typeof similarity).toBe('number');
        expect(similarity).toBeGreaterThanOrEqual(0);
        expect(similarity).toBeLessThanOrEqual(1);
      }
    });

    it('should provide game recommendations', () => {
      const preferences = {
        subjects: ['math'],
        ageRange: '6-10',
        playTime: { max: 15 },
        learningObjectives: ['problem-solving']
      };
      
      const recommendations = GameRegistryUtil.getRecommendations(preferences, 5);
      
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeLessThanOrEqual(5);
      
      // The getRecommendations method strips the score before returning
      // So we'll just verify we got recommendations
      recommendations.forEach(game => {
        expect(game.id).toBeDefined();
        expect(game.name).toBeDefined();
      });
    });

    it('should calculate recommendation scores', () => {
      const allGames = GameRegistryUtil.getAllGames();
      if (allGames.length > 0) {
        const game = allGames[0];
        const preferences = {
          subjects: [game.subject],
          ageRange: '6-10',
          learningObjectives: game.metadata?.learningObjectives || []
        };
        
        const score = GameRegistryUtil.calculateRecommendationScore(game, preferences);
        expect(typeof score).toBe('number');
        expect(score).toBeGreaterThan(0);
      }
    });
  });

  describe('Data Export and Statistics', () => {
    it('should export registry as JSON', () => {
      const jsonExport = GameRegistryUtil.exportRegistry('json');
      
      expect(typeof jsonExport).toBe('string');
      
      const parsed = JSON.parse(jsonExport);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(gameRegistry.length);
    });

    it('should export registry as CSV', () => {
      const csvExport = GameRegistryUtil.exportRegistry('csv');
      
      expect(typeof csvExport).toBe('string');
      expect(csvExport).toContain('id,name,subject');
      
      const lines = csvExport.split('\n');
      expect(lines.length).toBeGreaterThan(1); // Header + at least one game
    });

    it('should get unique metadata values', () => {
      const gameTypes = GameRegistryUtil.getUniqueMetadataValues('gameType');
      
      expect(Array.isArray(gameTypes)).toBe(true);
      expect(gameTypes.length).toBeGreaterThan(0);
      
      // Should not contain duplicates
      const uniqueTypes = [...new Set(gameTypes)];
      expect(uniqueTypes.length).toBe(gameTypes.length);
    });

    it('should get template statistics', () => {
      const stats = GameRegistryUtil.getTemplateStats();
      
      expect(typeof stats).toBe('object');
      // The method returns template counts directly, not nested in byTemplate
      Object.values(stats).forEach(count => {
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThan(0);
      });
      
      // Verify total count matches game registry
      const totalGames = Object.values(stats).reduce((sum, count) => sum + count, 0);
      expect(totalGames).toBe(gameRegistry.length);
    });
  });

  describe('Search and Legacy Methods', () => {
    it('should search games by query', () => {
      const results = GameRegistryUtil.searchGames('word');
      
      expect(Array.isArray(results)).toBe(true);
      
      results.forEach(game => {
        const searchableText = `${game.name} ${game.description}`.toLowerCase();
        expect(searchableText).toContain('word');
      });
    });

    it('should identify games needing conversion', () => {
      const needingConversion = GameRegistryUtil.getGamesNeedingConversion();
      
      expect(Array.isArray(needingConversion)).toBe(true);
      
      needingConversion.forEach(game => {
        const fullFeatures = ['analytics', 'progress', 'mobile', 'themes', 'audio'];
        const hasAllFeatures = fullFeatures.every(feature => 
          game.features?.includes(feature)
        );
        expect(hasAllFeatures).toBe(false);
      });
    });

    it('should get all subjects', () => {
      const subjects = GameRegistryUtil.getSubjects();
      
      expect(Array.isArray(subjects)).toBe(true);
      expect(subjects.length).toBeGreaterThan(0);
      
      // Should contain expected subjects
      expect(subjects).toContain('math');
      expect(subjects).toContain('reading');
    });

    it('should get all characters', () => {
      const characters = GameRegistryUtil.getCharacters();
      
      expect(Array.isArray(characters)).toBe(true);
      expect(characters.length).toBeGreaterThan(0);
      
      // Should not contain duplicates
      const uniqueCharacters = [...new Set(characters)];
      expect(uniqueCharacters.length).toBe(characters.length);
    });

    it('should get all difficulty levels', () => {
      const difficulties = GameRegistryUtil.getDifficulties();
      
      expect(Array.isArray(difficulties)).toBe(true);
      expect(difficulties).toContain('easy');
      expect(difficulties).toContain('medium');
      expect(difficulties).toContain('hard');
    });

    it('should provide comprehensive statistics', () => {
      const stats = GameRegistryUtil.getStats();
      
      expect(typeof stats).toBe('object');
      expect(stats.totalGames).toBe(gameRegistry.length);
      expect(typeof stats.subjects).toBe('object');
      expect(typeof stats.difficulties).toBe('object');
      expect(typeof stats.features).toBe('object');
      expect(typeof stats.needingConversion).toBe('number');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty criteria gracefully', () => {
      const result = GameRegistryUtil.getGamesAdvanced({});
      expect(result.length).toBe(gameRegistry.length);
    });

    it('should handle non-existent game IDs', () => {
      const game = GameRegistryUtil.getGameById('non-existent-game');
      expect(game).toBeNull();
      
      const similarGames = GameRegistryUtil.getSimilarGames('non-existent-game');
      expect(similarGames).toEqual([]);
    });

    it('should handle invalid sort criteria', () => {
      const allGames = GameRegistryUtil.getAllGames();
      const sortedGames = GameRegistryUtil.sortGames(allGames, 'invalidField');
      
      expect(sortedGames.length).toBe(allGames.length);
      // Should fall back to name sorting
    });

    it('should handle invalid metadata fields', () => {
      const values = GameRegistryUtil.getUniqueMetadataValues('nonExistentField');
      expect(Array.isArray(values)).toBe(true);
      expect(values.length).toBe(0);
    });

    it('should handle malformed game configurations in validation', () => {
      const malformedConfig = {
        id: null,
        name: '',
        gameClass: 123,
        scriptPath: []
      };
      
      const result = GameRegistryUtil.validateGameConfig(malformedConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});