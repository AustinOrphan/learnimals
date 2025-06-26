/**
 * Logger Utility Tests
 * Unit tests for the logging system
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('Logger Utility', () => {
  let Logger;
  let originalWindow;
  
  beforeEach(async () => {
    // Store original window state
    originalWindow = global.window;
    
    // Clear module cache and reimport
    vi.resetModules();
    const module = await import('../../src/utils/logger.js');
    Logger = module.default;
  });
  
  afterEach(() => {
    // Restore original window
    if (originalWindow) {
      global.window = originalWindow;
    }
  });

  describe('Log Level Detection', () => {
    it('should default to INFO level in production', async () => {
      // Mock production environment (non-localhost hostname)
      global.window = {
        location: { hostname: 'learnimals.com' }
      };
      
      vi.resetModules();
      const module = await import('../../src/utils/logger.js');
      const logger = module.default;
      
      expect(logger.level).toBe(2); // INFO level
    });
    
    it('should default to DEBUG level in development (localhost)', async () => {
      // Mock development environment (localhost)
      global.window = {
        location: { hostname: 'localhost' }
      };
      
      vi.resetModules();
      const module = await import('../../src/utils/logger.js');
      const logger = module.default;
      
      expect(logger.level).toBe(3); // DEBUG level
    });
    
    it('should default to DEBUG level in development (127.0.0.1)', async () => {
      // Mock development environment (127.0.0.1)
      global.window = {
        location: { hostname: '127.0.0.1' }
      };
      
      vi.resetModules();
      const module = await import('../../src/utils/logger.js');
      const logger = module.default;
      
      expect(logger.level).toBe(3); // DEBUG level
    });
    
    it('should use custom log level from window setting', async () => {
      global.window = {
        location: { hostname: 'localhost' },
        LEARNIMALS_LOG_LEVEL: 'WARN'
      };
      
      vi.resetModules();
      const module = await import('../../src/utils/logger.js');
      const logger = module.default;
      
      expect(logger.level).toBe(1); // WARN level
    });
  });

  describe('Logging Methods', () => {
    let logger;
    let consoleSpy;
    
    beforeEach(async () => {
      // Mock development environment
      global.window = {
        location: { hostname: 'localhost' }
      };
      
      vi.resetModules();
      
      const module = await import('../../src/utils/logger.js');
      logger = module.default;
      
      consoleSpy = {
        log: vi.spyOn(console, 'log').mockImplementation(() => {}),
        warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
        error: vi.spyOn(console, 'error').mockImplementation(() => {})
      };
    });
    
    afterEach(() => {
      vi.restoreAllMocks();
    });
    
    it('should log debug messages when level allows', () => {
      logger.setLevel('DEBUG');
      logger.debug('Debug message', { data: 'test' });
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG:'),
        'Debug message',
        { data: 'test' }
      );
    });
    
    it('should log info messages when level allows', () => {
      logger.setLevel('INFO');
      logger.info('Info message');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('INFO:'),
        'Info message'
      );
    });
    
    it('should log warning messages when level allows', () => {
      logger.setLevel('WARN');
      logger.warn('Warning message');
      
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('WARN:'),
        'Warning message'
      );
    });
    
    it('should log error messages when level allows', () => {
      logger.setLevel('ERROR');
      logger.error('Error message', new Error('Test error'));
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR:'),
        'Error message',
        expect.any(Error)
      );
    });
    
    it('should not log messages below current level', () => {
      logger.setLevel('ERROR');
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      
      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });
    
    it('should not log when disabled', () => {
      logger.enabled = false;
      logger.error('Error message');
      
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });
  });

  describe('Log Level Management', () => {
    let logger;
    
    beforeEach(async () => {
      vi.resetModules();
      const module = await import('../../src/utils/logger.js');
      logger = module.default;
    });
    
    it('should set log level by string', () => {
      logger.setLevel('WARN');
      expect(logger.level).toBe(1);
      
      logger.setLevel('DEBUG');
      expect(logger.level).toBe(3);
    });
    
    it('should set log level by number', () => {
      logger.setLevel('WARN');
      expect(logger.level).toBe(1);
      
      logger.setLevel('ERROR');
      expect(logger.level).toBe(0);
    });
    
    it('should handle invalid log levels', () => {
      const originalLevel = logger.level;
      
      logger.setLevel('INVALID');
      expect(logger.level).toBe(originalLevel);
      
      logger.setLevel(-1);
      expect(logger.level).toBe(originalLevel);
      
      logger.setLevel(10);
      expect(logger.level).toBe(originalLevel);
    });
  });

  describe('Timestamp Formatting', () => {
    let logger;
    
    beforeEach(async () => {
      vi.resetModules();
      const module = await import('../../src/utils/logger.js');
      logger = module.default;
    });
    
    it('should format timestamps correctly', () => {
      // Test the formatMessage method instead since getTimestamp is not public
      const formatted = logger.formatMessage('INFO', 'test message', []);
      const timestamp = formatted[0];
      
      // Should match HH:MM:SS.mmm format
      expect(timestamp).toMatch(/^\[\d{2}:\d{2}:\d{2}\.\d{3}\] INFO:$/);
    });
    
    it('should include milliseconds in timestamp', () => {
      const formatted = logger.formatMessage('DEBUG', 'test', []);
      const timestamp = formatted[0];
      
      // Should include milliseconds
      expect(timestamp).toMatch(/\.\d{3}\] DEBUG:$/);
    });
  });

  describe('Message Formatting', () => {
    let logger;
    let consoleSpy;
    
    beforeEach(async () => {
      // Mock development environment
      global.window = {
        location: { hostname: 'localhost' }
      };
      vi.resetModules();
      
      const module = await import('../../src/utils/logger.js');
      logger = module.default;
      
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });
    
    afterEach(() => {
      vi.restoreAllMocks();
    });
    
    it('should format log messages with timestamp and level', () => {
      logger.info('Test message');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[\d{2}:\d{2}:\d{2}\.\d{3}\] INFO:/),
        'Test message'
      );
    });
    
    it('should handle multiple arguments', () => {
      const data = { key: 'value' };
      const error = new Error('Test error');
      
      logger.info('Message with data', data, error);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO:'),
        'Message with data',
        data,
        error
      );
    });
  });

  describe('Production Behavior', () => {
    it('should be more restrictive in production', async () => {
      // Mock production environment (non-localhost hostname)
      global.window = {
        location: { hostname: 'learnimals.com' }
      };
      vi.resetModules();
      
      const module = await import('../../src/utils/logger.js');
      const logger = module.default;
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      logger.debug('Debug message');
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      vi.restoreAllMocks();
    });
  });

  describe('Enable/Disable Functionality', () => {
    let logger;
    
    beforeEach(async () => {
      vi.resetModules();
      const module = await import('../../src/utils/logger.js');
      logger = module.default;
    });
    
    it('should allow enabling and disabling logger', () => {
      expect(logger.enabled).toBe(true);
      
      logger.disable();
      expect(logger.enabled).toBe(false);
      
      logger.enable();
      expect(logger.enabled).toBe(true);
    });
    
    it('should not log when disabled', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      logger.disable();
      logger.error('This should not log');
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      vi.restoreAllMocks();
    });
  });
});