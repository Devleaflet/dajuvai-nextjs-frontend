import { describe, it, expect, vi } from 'vitest';
import axios, { AxiosError } from 'axios';
import { AppError, handleApiError } from './errorHandler';

describe('AppError', () => {
  it('should create an AppError instance with all properties', () => {
    const error = new AppError(
      'Test error message',
      'TEST_ERROR',
      400,
      { field: 'email' }
    );

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.name).toBe('AppError');
    expect(error.message).toBe('Test error message');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual({ field: 'email' });
  });

  it('should create an AppError with only message', () => {
    const error = new AppError('Simple error');

    expect(error.message).toBe('Simple error');
    expect(error.name).toBe('AppError');
    expect(error.code).toBeUndefined();
    expect(error.statusCode).toBeUndefined();
    expect(error.details).toBeUndefined();
  });

  it('should create an AppError with message and code', () => {
    const error = new AppError('Error with code', 'ERROR_CODE');

    expect(error.message).toBe('Error with code');
    expect(error.code).toBe('ERROR_CODE');
    expect(error.statusCode).toBeUndefined();
    expect(error.details).toBeUndefined();
  });

  it('should have a stack trace', () => {
    const error = new AppError('Test error');
    expect(error.stack).toBeDefined();
  });
});

describe('handleApiError', () => {
  describe('Axios errors', () => {
    it('should handle AxiosError with response data message', () => {
      const axiosError = {
        isAxiosError: true,
        message: 'Request failed',
        response: {
          status: 404,
          data: {
            message: 'Product not found',
            code: 'PRODUCT_NOT_FOUND',
          },
        },
      } as AxiosError;

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const result = handleApiError(axiosError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Product not found');
      expect(result.statusCode).toBe(404);
      expect(result.code).toBe('PRODUCT_NOT_FOUND');
      expect(result.details).toEqual({
        message: 'Product not found',
        code: 'PRODUCT_NOT_FOUND',
      });
    });

    it('should handle AxiosError with response data error field', () => {
      const axiosError = {
        isAxiosError: true,
        message: 'Request failed',
        response: {
          status: 400,
          data: {
            error: 'Validation failed',
          },
        },
      } as AxiosError;

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const result = handleApiError(axiosError);

      expect(result.message).toBe('Validation failed');
      expect(result.statusCode).toBe(400);
    });

    it('should handle AxiosError without response data', () => {
      const axiosError = {
        isAxiosError: true,
        message: 'Network Error',
        code: 'NETWORK_ERROR',
        response: {
          status: 500,
          data: {},
        },
      } as AxiosError;

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const result = handleApiError(axiosError);

      expect(result.message).toBe('Network Error');
      expect(result.statusCode).toBe(500);
      expect(result.code).toBe('NETWORK_ERROR');
    });

    it('should handle AxiosError without response', () => {
      const axiosError = {
        isAxiosError: true,
        message: 'Connection timeout',
        code: 'ECONNABORTED',
      } as AxiosError;

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const result = handleApiError(axiosError);

      expect(result.message).toBe('Connection timeout');
      expect(result.code).toBe('ECONNABORTED');
      expect(result.statusCode).toBeUndefined();
    });

    it('should handle 401 Unauthorized error', () => {
      const axiosError = {
        isAxiosError: true,
        message: 'Unauthorized',
        response: {
          status: 401,
          data: {
            message: 'Invalid token',
          },
        },
      } as AxiosError;

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const result = handleApiError(axiosError);

      expect(result.message).toBe('Invalid token');
      expect(result.statusCode).toBe(401);
    });

    it('should handle 403 Forbidden error', () => {
      const axiosError = {
        isAxiosError: true,
        message: 'Forbidden',
        response: {
          status: 403,
          data: {
            message: 'Access denied',
          },
        },
      } as AxiosError;

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const result = handleApiError(axiosError);

      expect(result.message).toBe('Access denied');
      expect(result.statusCode).toBe(403);
    });

    it('should handle 500 Internal Server Error', () => {
      const axiosError = {
        isAxiosError: true,
        message: 'Internal Server Error',
        response: {
          status: 500,
          data: {
            message: 'Server error occurred',
          },
        },
      } as AxiosError;

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const result = handleApiError(axiosError);

      expect(result.message).toBe('Server error occurred');
      expect(result.statusCode).toBe(500);
    });
  });

  describe('Native Error objects', () => {
    it('should handle generic Error', () => {
      const error = new Error('Something went wrong');

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(false);

      const result = handleApiError(error);

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Something went wrong');
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.statusCode).toBe(500);
      expect(result.details).toEqual({ originalError: 'Error' });
    });

    it('should handle TypeError', () => {
      const error = new TypeError('Type error occurred');

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(false);

      const result = handleApiError(error);

      expect(result.message).toBe('Type error occurred');
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.statusCode).toBe(500);
      expect(result.details).toEqual({ originalError: 'TypeError' });
    });

    it('should handle ReferenceError', () => {
      const error = new ReferenceError('Variable not defined');

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(false);

      const result = handleApiError(error);

      expect(result.message).toBe('Variable not defined');
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.statusCode).toBe(500);
    });

    it('should handle Error without message', () => {
      const error = new Error();

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(false);

      const result = handleApiError(error);

      expect(result.message).toBe('An unexpected error occurred');
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.statusCode).toBe(500);
    });
  });

  describe('Unknown error types', () => {
    it('should handle string error', () => {
      const error = 'String error message';

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(false);

      const result = handleApiError(error);

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('An unexpected error occurred');
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.statusCode).toBe(500);
      expect(result.details).toEqual({ originalError: 'String error message' });
    });

    it('should handle number error', () => {
      const error = 404;

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(false);

      const result = handleApiError(error);

      expect(result.message).toBe('An unexpected error occurred');
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.statusCode).toBe(500);
      expect(result.details).toEqual({ originalError: 404 });
    });

    it('should handle null error', () => {
      const error = null;

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(false);

      const result = handleApiError(error);

      expect(result.message).toBe('An unexpected error occurred');
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.statusCode).toBe(500);
      expect(result.details).toEqual({ originalError: null });
    });

    it('should handle undefined error', () => {
      const error = undefined;

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(false);

      const result = handleApiError(error);

      expect(result.message).toBe('An unexpected error occurred');
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.statusCode).toBe(500);
    });

    it('should handle object error', () => {
      const error = { custom: 'error', value: 123 };

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(false);

      const result = handleApiError(error);

      expect(result.message).toBe('An unexpected error occurred');
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.statusCode).toBe(500);
      expect(result.details).toEqual({ originalError: { custom: 'error', value: 123 } });
    });
  });

  describe('Status code extraction', () => {
    it('should extract 400 Bad Request status code', () => {
      const axiosError = {
        isAxiosError: true,
        message: 'Bad Request',
        response: {
          status: 400,
          data: { message: 'Invalid input' },
        },
      } as AxiosError;

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const result = handleApiError(axiosError);
      expect(result.statusCode).toBe(400);
    });

    it('should extract 404 Not Found status code', () => {
      const axiosError = {
        isAxiosError: true,
        message: 'Not Found',
        response: {
          status: 404,
          data: { message: 'Resource not found' },
        },
      } as AxiosError;

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const result = handleApiError(axiosError);
      expect(result.statusCode).toBe(404);
    });

    it('should extract 422 Unprocessable Entity status code', () => {
      const axiosError = {
        isAxiosError: true,
        message: 'Unprocessable Entity',
        response: {
          status: 422,
          data: { message: 'Validation error' },
        },
      } as AxiosError;

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const result = handleApiError(axiosError);
      expect(result.statusCode).toBe(422);
    });
  });
});
