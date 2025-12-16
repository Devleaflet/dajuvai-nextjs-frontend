/**
 * Centralized logging utility with environment-based log levels
 * 
 * @example
 * ```typescript
 * import logger from '@/lib/utils/logger';
 * 
 * logger.debug('User data loaded', { userId: 123 });
 * logger.info('Payment processed successfully');
 * logger.warn('API rate limit approaching');
 * logger.error('Failed to fetch products', error);
 * ```
 */

interface Logger {
  /**
   * Debug-level logging - only outputs in development environment
   * @param message - The log message
   * @param data - Optional structured data to log
   */
  debug(message: string, data?: any): void;

  /**
   * Info-level logging - outputs in all environments
   * @param message - The log message
   * @param data - Optional structured data to log
   */
  info(message: string, data?: any): void;

  /**
   * Warning-level logging - outputs in all environments
   * @param message - The log message
   * @param data - Optional structured data to log
   */
  warn(message: string, data?: any): void;

  /**
   * Error-level logging - outputs in all environments
   * @param message - The log message
   * @param error - Optional error object or additional data
   */
  error(message: string, error?: any): void;
}

/**
 * Formats a timestamp for log messages
 * @returns ISO timestamp string
 */
const getTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Formats a log message with timestamp
 * @param level - Log level (DEBUG, INFO, WARN, ERROR)
 * @param message - The log message
 * @returns Formatted log message
 */
const formatMessage = (level: string, message: string): string => {
  return `[${getTimestamp()}] [${level}] ${message}`;
};

/**
 * Determines if we're in development environment
 * @returns true if NODE_ENV is 'development'
 */
const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Logger implementation with environment-based filtering
 */
const logger: Logger = {
  debug(message: string, data?: any): void {
    if (isDevelopment()) {
      console.log(formatMessage('DEBUG', message));
      if (data !== undefined) {
        console.log('  Data:', data);
      }
    }
  },

  info(message: string, data?: any): void {
    console.info(formatMessage('INFO', message));
    if (data !== undefined) {
      console.info('  Data:', data);
    }
  },

  warn(message: string, data?: any): void {
    console.warn(formatMessage('WARN', message));
    if (data !== undefined) {
      console.warn('  Data:', data);
    }
  },

  error(message: string, error?: any): void {
    console.error(formatMessage('ERROR', message));
    if (error !== undefined) {
      if (error instanceof Error) {
        console.error('  Error:', error.message);
        console.error('  Stack:', error.stack);
      } else {
        console.error('  Details:', error);
      }
    }
  },
};

export default logger;
