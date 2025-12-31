/**
 * Enhanced API client with interceptors for authentication, error handling, and retry logic
 * 
 * @example
 * ```typescript
 * import { apiClient } from '@/lib/api/client';
 * 
 * const response = await apiClient.get('/products');
 * const product = await apiClient.post('/products', productData);
 * ```
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/lib/config';
import logger from '@/lib/utils/logger';
import { handleApiError } from '@/lib/utils/errorHandler';
import { secureStorage } from '@/lib/utils/secureStorage';

/**
 * Create axios instance with base configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 30000, // 30 seconds
  withCredentials: true, // Send cookies for cross-origin requests
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Track retry attempts for requests
 */
const retryAttempts = new Map<string, number>();

/**
 * Get unique key for request (for retry tracking)
 */
function getRequestKey(config: InternalAxiosRequestConfig): string {
  return `${config.method}:${config.url}`;
}

/**
 * Get CSRF token from meta tag or cookie
 */
function getCsrfToken(): string | null {
  if (typeof window === 'undefined') return null;

  // Try to get from meta tag first
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (metaTag) {
    return metaTag.getAttribute('content');
  }

  // Try to get from cookie
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN' || name === 'csrf-token') {
      return value ? decodeURIComponent(value) : null;
    }
  }

  return null;
}

/**
 * Request interceptor to attach authorization token and CSRF token
 */
apiClient.interceptors.request.use(
  (config) => {
    // Get token from secureStorage (or wherever it's stored)
    const token = typeof window !== 'undefined' 
      ? secureStorage.getItem('authToken') 
      : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      logger.debug('API request with auth token', {
        url: config.url,
        method: config.method,
      });
    } else {
      logger.debug('API request without auth token', {
        url: config.url,
        method: config.method,
      });
    }

    // Add CSRF token for state-changing requests
    const method = config.method?.toLowerCase();
    if (method && ['post', 'put', 'patch', 'delete'].includes(method)) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
        logger.debug('Added CSRF token to request', {
          url: config.url,
          method: config.method,
        });
      }
    }

    return config;
  },
  (error) => {
    logger.error('Request interceptor error', error);
    return Promise.reject(handleApiError(error));
  }
);

/**
 * Response interceptor for error handling and token refresh
 */
apiClient.interceptors.response.use(
  (response) => {
    // Clear retry attempts on successful response
    const requestKey = getRequestKey(response.config);
    retryAttempts.delete(requestKey);

    logger.debug('API response success', {
      url: response.config.url,
      status: response.status,
    });

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(handleApiError(error));
    }

    const requestKey = getRequestKey(originalRequest);
    const attempts = retryAttempts.get(requestKey) || 0;

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && attempts === 0) {
      logger.warn('Received 401 response, attempting token refresh', {
        url: originalRequest.url,
      });

      try {
        // Attempt to refresh token
        const refreshToken = typeof window !== 'undefined'
          ? secureStorage.getItem('refreshToken')
          : null;

        if (refreshToken) {
          const response = await axios.post(
            `${env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`,
            { refreshToken }
          );

          const newToken = response.data.token;

          // Store new token
          if (typeof window !== 'undefined') {
            secureStorage.setItem('authToken', newToken);
          }

          // Update authorization header
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          // Mark as retried
          retryAttempts.set(requestKey, 1);

          // Retry original request
          logger.info('Token refreshed, retrying original request');
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        logger.error('Token refresh failed', refreshError);

        // Clear tokens and redirect to login
        if (typeof window !== 'undefined') {
          secureStorage.removeItem('authToken');
          secureStorage.removeItem('refreshToken');
          window.location.href = '/auth/login';
        }

        return Promise.reject(handleApiError(refreshError));
      }
    }

    // Handle network errors - retry once
    if (
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.message === 'Network Error'
    ) {
      if (attempts === 0) {
        logger.warn('Network error, retrying request', {
          url: originalRequest.url,
          error: error.message,
        });

        retryAttempts.set(requestKey, 1);

        // Wait 1 second before retry
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return apiClient(originalRequest);
      } else {
        logger.error('Network error after retry', {
          url: originalRequest.url,
        });
      }
    }

    // Clear retry attempts
    retryAttempts.delete(requestKey);

    // Log error details
    logger.error('API response error', {
      url: originalRequest.url,
      method: originalRequest.method,
      status: error.response?.status,
      message: error.message,
    });

    // Transform error to AppError
    return Promise.reject(handleApiError(error));
  }
);

/**
 * Setup function to configure token getter (for compatibility with existing code)
 */
export function setupApiClient(getTokenFn: () => string | null): void {
  apiClient.interceptors.request.use((config) => {
    const token = getTokenFn();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}

export { apiClient };
export default apiClient;
