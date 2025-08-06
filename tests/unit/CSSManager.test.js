/**
 * CSSManager Unit Tests
 * Tests for CSS loading, caching, and injection functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CSSManager } from '../../src/utils/CSSManager.js';

// Mock fetch for testing
global.fetch = vi.fn();

// Mock performance API
global.performance = {
  now: vi.fn(() => Date.now())
};

describe('CSSManager', () => {
  let cssManager;

  beforeEach(() => {
    cssManager = new CSSManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cssManager.invalidateCache();
  });

  describe('Constructor', () => {
    it('should initialize with empty cache and tracking', () => {
      expect(cssManager.cache.size).toBe(0);
      expect(cssManager.loadingPromises.size).toBe(0);
      expect(cssManager.injectedStylesheets.size).toBe(0);
      expect(cssManager.usageTracker.size).toBe(0);
    });

    it('should initialize performance metrics', () => {
      const stats = cssManager.getCacheStats();
      expect(stats.cacheHits).toBe(0);
      expect(stats.cacheMisses).toBe(0);
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('loadAndCache', () => {
    const mockCSS = '.test { color: red; }';
    const cssPath = '/test/style.css';

    beforeEach(() => {
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockCSS)
      });
    });

    it('should load and cache CSS content', async () => {
      const result = await cssManager.loadAndCache(cssPath);
      
      expect(result).toBe(mockCSS);
      expect(global.fetch).toHaveBeenCalledWith(cssPath);
      expect(cssManager.isLoaded(cssPath)).toBe(true);
    });

    it('should return cached content on subsequent calls', async () => {
      // First load
      await cssManager.loadAndCache(cssPath);
      
      // Second load should use cache
      const result = await cssManager.loadAndCache(cssPath);
      
      expect(result).toBe(mockCSS);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should handle loading errors gracefully', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));
      
      await expect(cssManager.loadAndCache(cssPath)).rejects.toThrow('Network error');
    });

    it('should prevent duplicate loading requests', async () => {
      // Start multiple concurrent loads
      const promises = [
        cssManager.loadAndCache(cssPath),
        cssManager.loadAndCache(cssPath),
        cssManager.loadAndCache(cssPath)
      ];
      
      const results = await Promise.all(promises);
      
      // All should return same content
      results.forEach(result => expect(result).toBe(mockCSS));
      
      // But fetch should only be called once
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should apply scoping when specified', async () => {
      const result = await cssManager.loadAndCache(cssPath, { scope: 'test-scope' });
      
      expect(result).toContain('.test-scope .test');
    });
  });

  describe('isLoaded', () => {
    it('should return false for unloaded CSS', () => {
      expect(cssManager.isLoaded('/nonexistent.css')).toBe(false);
    });

    it('should return true for cached CSS', async () => {
      const cssPath = '/test.css';
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('.test {}')
      });
      
      await cssManager.loadAndCache(cssPath);
      expect(cssManager.isLoaded(cssPath)).toBe(true);
    });
  });

  describe('cache management', () => {
    it('should invalidate specific CSS file from cache', async () => {
      const cssPath = '/test.css';
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('.test {}')
      });
      
      await cssManager.loadAndCache(cssPath);
      expect(cssManager.isLoaded(cssPath)).toBe(true);
      
      cssManager.invalidateCache(cssPath);
      expect(cssManager.isLoaded(cssPath)).toBe(false);
    });

    it('should clear entire cache when no specific file provided', async () => {
      const cssPath1 = '/test1.css';
      const cssPath2 = '/test2.css';
      
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('.test {}')
      });
      
      await cssManager.loadAndCache(cssPath1);
      await cssManager.loadAndCache(cssPath2);
      
      cssManager.invalidateCache();
      
      expect(cssManager.isLoaded(cssPath1)).toBe(false);
      expect(cssManager.isLoaded(cssPath2)).toBe(false);
    });
  });

  describe('performance metrics', () => {
    it('should track cache hits and misses', async () => {
      const cssPath = '/test.css';
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('.test {}')
      });
      
      // First load (miss)
      await cssManager.loadAndCache(cssPath);
      
      // Second load (hit)
      await cssManager.loadAndCache(cssPath);
      
      const stats = cssManager.getCacheStats();
      expect(stats.cacheHits).toBe(1);
      expect(stats.cacheMisses).toBe(1);
      expect(stats.hitRate).toBe(50);
    });

    it('should track usage counts', async () => {
      const cssPath = '/test.css';
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('.test {}')
      });
      
      await cssManager.loadAndCache(cssPath);
      await cssManager.loadAndCache(cssPath);
      await cssManager.loadAndCache(cssPath);
      
      const stats = cssManager.getCacheStats();
      const mostUsed = stats.mostUsedFiles;
      
      expect(mostUsed).toHaveLength(1);
      expect(mostUsed[0].path).toBe(cssPath);
      expect(mostUsed[0].usage).toBe(3);
    });
  });

  describe('cleanup', () => {
    it('should clean up unused CSS from cache', async () => {
      const cssPath1 = '/used.css';
      const cssPath2 = '/unused.css';
      
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('.test {}')
      });
      
      // Load both files
      await cssManager.loadAndCache(cssPath1);
      await cssManager.loadAndCache(cssPath2);
      
      // Use first file multiple times
      await cssManager.loadAndCache(cssPath1);
      await cssManager.loadAndCache(cssPath1);
      
      // Clean up files used less than 2 times
      const cleanedCount = cssManager.cleanupUnusedCSS(2);
      
      expect(cleanedCount).toBe(1);
      expect(cssManager.isLoaded(cssPath1)).toBe(true);
      expect(cssManager.isLoaded(cssPath2)).toBe(false);
    });
  });
});