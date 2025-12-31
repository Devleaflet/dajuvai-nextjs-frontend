/**
 * Error handling utilities for structured error management
 * 
 * @example
 * ```typescript
 * import { AppError, handleApiError } from '@/lib/utils/errorHandler';
 * 
 * // Create a custom error
 * throw new AppError('Product not found', 'PRODUCT_NOT_FOUND', 404);
 * 
 * // Transform API errors
 * try {
 *   await apiClient.get('/products');
 * } catch (error) {
 *   const appError = handleApiError(error);
 *   console.error(appError.message);
 * }
 * ```
 */

import axios from 'axios';

/**
 * Custom error class for application-specific errors
 * Extends the native Error class with additional properties for better error handling
 */
export class AppError extends Error {
  /**
   * Error code for programmatic error identification
   */
  code?: string | undefined;

  /**
   * HTTP status code associated with the error
   */
  statusCode?: number | undefined;

  /**
   * Additional error details or context
   */
  details?: any;

  /**
   * Creates a new AppError instance
   * 
   * @param message - Human-readable error message
   * @param code - Optional error code for programmatic identification
   * @param statusCode - Optional HTTP status code
   * @param details - Optional additional error details
   * 
   * @example
   * ```typescript
   * const error = new AppError(
   *   'Failed to process payment',
   *   'PAYMENT_FAILED',
   *   402,
   *   { transactionId: '12345' }
   * );
   * ```
   */
  constructor(
    message: string,
    code?: string,
    statusCode?: number,
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Transforms unknown errors into structured AppError objects
 * Handles Axios errors, native Error objects, and unknown error types
 * 
 * @param error - The error to transform (type unknown for safety)
 * @returns AppError instance with extracted information
 * 
 * @example
 * ```typescript
 * try {
 *   await apiClient.post('/orders', orderData);
 * } catch (error) {
 *   const appError = handleApiError(error);
 *   
 *   if (appError.statusCode === 401) {
 *     // Handle authentication error
 *   } else if (appError.statusCode === 400) {
 *     // Handle validation error
 *   }
 * }
 * ```
 */
export function handleApiError(error: unknown): AppError {
  // Handle Axios errors
  if (axios.isAxiosError(error)) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';

    const statusCode = error.response?.status;
    const code = error.code || error.response?.data?.code;
    const details = error.response?.data;

    return new AppError(message, code, statusCode, details);
  }

  // Handle native Error objects
  if (error instanceof Error) {
    return new AppError(
      error.message || 'An unexpected error occurred',
      'UNKNOWN_ERROR',
      500,
      { originalError: error.name }
    );
  }

  // Handle unknown error types
  return new AppError(
    'An unexpected error occurred',
    'UNKNOWN_ERROR',
    500,
    { originalError: error }
  );
}
