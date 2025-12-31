import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import logger from './logger';

describe('logger', () => {
  // Store original console methods
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  // Store original NODE_ENV
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Mock console methods
    console.log = vi.fn();
    console.info = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;

    // Restore NODE_ENV
    process.env.NODE_ENV = originalEnv;

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('debug', () => {
    it('should log debug messages in development environment', () => {
      process.env.NODE_ENV = 'development';

      logger.debug('Debug message');

      expect(console.log).toHaveBeenCalled();
      const logCall = (console.log as any).mock.calls[0][0];
      expect(logCall).toContain('[DEBUG]');
      expect(logCall).toContain('Debug message');
    });

    it('should log debug messages with data in development', () => {
      process.env.NODE_ENV = 'development';

      logger.debug('Debug with data', { userId: 123 });

      expect(console.log).toHaveBeenCalledTimes(2);
      const firstCall = (console.log as any).mock.calls[0][0];
      expect(firstCall).toContain('[DEBUG]');
      expect(firstCall).toContain('Debug with data');

      const secondCall = (console.log as any).mock.calls[1];
      expect(secondCall[0]).toBe('  Data:');
      expect(secondCall[1]).toEqual({ userId: 123 });
    });

    it('should NOT log debug messages in production environment', () => {
      process.env.NODE_ENV = 'production';

      logger.debug('Debug message');

      expect(console.log).not.toHaveBeenCalled();
    });

    it('should NOT log debug messages in test environment', () => {
      process.env.NODE_ENV = 'test';

      logger.debug('Debug message');

      expect(console.log).not.toHaveBeenCalled();
    });

    it('should include timestamp in debug messages', () => {
      process.env.NODE_ENV = 'development';

      logger.debug('Test message');

      const logCall = (console.log as any).mock.calls[0][0];
      // Check for ISO timestamp format (YYYY-MM-DDTHH:mm:ss)
      expect(logCall).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('info', () => {
    it('should log info messages in all environments', () => {
      process.env.NODE_ENV = 'production';

      logger.info('Info message');

      expect(console.info).toHaveBeenCalled();
      const logCall = (console.info as any).mock.calls[0][0];
      expect(logCall).toContain('[INFO]');
      expect(logCall).toContain('Info message');
    });

    it('should log info messages with data', () => {
      logger.info('Info with data', { status: 'success' });

      expect(console.info).toHaveBeenCalledTimes(2);
      const firstCall = (console.info as any).mock.calls[0][0];
      expect(firstCall).toContain('[INFO]');
      expect(firstCall).toContain('Info with data');

      const secondCall = (console.info as any).mock.calls[1];
      expect(secondCall[0]).toBe('  Data:');
      expect(secondCall[1]).toEqual({ status: 'success' });
    });

    it('should log info messages in development', () => {
      process.env.NODE_ENV = 'development';

      logger.info('Info in dev');

      expect(console.info).toHaveBeenCalled();
    });

    it('should include timestamp in info messages', () => {
      logger.info('Test message');

      const logCall = (console.info as any).mock.calls[0][0];
      expect(logCall).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('warn', () => {
    it('should log warning messages in all environments', () => {
      process.env.NODE_ENV = 'production';

      logger.warn('Warning message');

      expect(console.warn).toHaveBeenCalled();
      const logCall = (console.warn as any).mock.calls[0][0];
      expect(logCall).toContain('[WARN]');
      expect(logCall).toContain('Warning message');
    });

    it('should log warning messages with data', () => {
      logger.warn('Warning with data', { threshold: 90 });

      expect(console.warn).toHaveBeenCalledTimes(2);
      const firstCall = (console.warn as any).mock.calls[0][0];
      expect(firstCall).toContain('[WARN]');
      expect(firstCall).toContain('Warning with data');

      const secondCall = (console.warn as any).mock.calls[1];
      expect(secondCall[0]).toBe('  Data:');
      expect(secondCall[1]).toEqual({ threshold: 90 });
    });

    it('should include timestamp in warning messages', () => {
      logger.warn('Test message');

      const logCall = (console.warn as any).mock.calls[0][0];
      expect(logCall).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('error', () => {
    it('should log error messages in all environments', () => {
      process.env.NODE_ENV = 'production';

      logger.error('Error message');

      expect(console.error).toHaveBeenCalled();
      const logCall = (console.error as any).mock.calls[0][0];
      expect(logCall).toContain('[ERROR]');
      expect(logCall).toContain('Error message');
    });

    it('should log error messages with Error object', () => {
      const error = new Error('Test error');

      logger.error('Error occurred', error);

      expect(console.error).toHaveBeenCalledTimes(3);
      
      const firstCall = (console.error as any).mock.calls[0][0];
      expect(firstCall).toContain('[ERROR]');
      expect(firstCall).toContain('Error occurred');

      const secondCall = (console.error as any).mock.calls[1];
      expect(secondCall[0]).toBe('  Error:');
      expect(secondCall[1]).toBe('Test error');

      const thirdCall = (console.error as any).mock.calls[2];
      expect(thirdCall[0]).toBe('  Stack:');
      expect(thirdCall[1]).toBeDefined();
    });

    it('should log error messages with non-Error data', () => {
      logger.error('Error with details', { code: 500, message: 'Server error' });

      expect(console.error).toHaveBeenCalledTimes(2);
      
      const firstCall = (console.error as any).mock.calls[0][0];
      expect(firstCall).toContain('[ERROR]');
      expect(firstCall).toContain('Error with details');

      const secondCall = (console.error as any).mock.calls[1];
      expect(secondCall[0]).toBe('  Details:');
      expect(secondCall[1]).toEqual({ code: 500, message: 'Server error' });
    });

    it('should include timestamp in error messages', () => {
      logger.error('Test message');

      const logCall = (console.error as any).mock.calls[0][0];
      expect(logCall).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should handle TypeError', () => {
      const error = new TypeError('Type error');

      logger.error('Type error occurred', error);

      expect(console.error).toHaveBeenCalled();
      const secondCall = (console.error as any).mock.calls[1];
      expect(secondCall[1]).toBe('Type error');
    });

    it('should handle ReferenceError', () => {
      const error = new ReferenceError('Reference error');

      logger.error('Reference error occurred', error);

      expect(console.error).toHaveBeenCalled();
      const secondCall = (console.error as any).mock.calls[1];
      expect(secondCall[1]).toBe('Reference error');
    });
  });

  describe('Message formatting', () => {
    it('should format messages with timestamp and level', () => {
      logger.info('Test message');

      const logCall = (console.info as any).mock.calls[0][0];
      
      // Should match format: [YYYY-MM-DDTHH:mm:ss.sssZ] [LEVEL] message
      expect(logCall).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\] Test message/);
    });

    it('should handle empty messages', () => {
      logger.info('');

      expect(console.info).toHaveBeenCalled();
      const logCall = (console.info as any).mock.calls[0][0];
      expect(logCall).toContain('[INFO]');
    });

    it('should handle messages with special characters', () => {
      logger.info('Message with "quotes" and \'apostrophes\'');

      expect(console.info).toHaveBeenCalled();
      const logCall = (console.info as any).mock.calls[0][0];
      expect(logCall).toContain('Message with "quotes" and \'apostrophes\'');
    });

    it('should handle messages with newlines', () => {
      logger.info('Line 1\nLine 2');

      expect(console.info).toHaveBeenCalled();
      const logCall = (console.info as any).mock.calls[0][0];
      expect(logCall).toContain('Line 1\nLine 2');
    });
  });

  describe('Data handling', () => {
    it('should handle undefined data', () => {
      logger.info('Message', undefined);

      // Should only log the message, not the data
      expect(console.info).toHaveBeenCalledTimes(1);
    });

    it('should handle null data', () => {
      logger.info('Message', null);

      expect(console.info).toHaveBeenCalledTimes(2);
      const secondCall = (console.info as any).mock.calls[1];
      expect(secondCall[1]).toBeNull();
    });

    it('should handle array data', () => {
      logger.info('Message', [1, 2, 3]);

      expect(console.info).toHaveBeenCalledTimes(2);
      const secondCall = (console.info as any).mock.calls[1];
      expect(secondCall[1]).toEqual([1, 2, 3]);
    });

    it('should handle nested object data', () => {
      const data = {
        user: {
          id: 1,
          name: 'Test',
          meta: { role: 'admin' }
        }
      };

      logger.info('Message', data);

      expect(console.info).toHaveBeenCalledTimes(2);
      const secondCall = (console.info as any).mock.calls[1];
      expect(secondCall[1]).toEqual(data);
    });

    it('should handle boolean data', () => {
      logger.info('Message', true);

      expect(console.info).toHaveBeenCalledTimes(2);
      const secondCall = (console.info as any).mock.calls[1];
      expect(secondCall[1]).toBe(true);
    });

    it('should handle number data', () => {
      logger.info('Message', 42);

      expect(console.info).toHaveBeenCalledTimes(2);
      const secondCall = (console.info as any).mock.calls[1];
      expect(secondCall[1]).toBe(42);
    });

    it('should handle string data', () => {
      logger.info('Message', 'additional info');

      expect(console.info).toHaveBeenCalledTimes(2);
      const secondCall = (console.info as any).mock.calls[1];
      expect(secondCall[1]).toBe('additional info');
    });
  });
});
