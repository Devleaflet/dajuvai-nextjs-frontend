/**
 * Authentication service for managing auth-related API calls
 * 
 * @example
 * ```typescript
 * import { AuthService } from '@/lib/services/auth.service';
 * 
 * // Login
 * const { token, user } = await AuthService.login('email@example.com', 'password');
 * 
 * // Register
 * const { token, user } = await AuthService.register({
 *   email: 'email@example.com',
 *   password: 'password',
 *   name: 'John Doe',
 * });
 * 
 * // Get current user
 * const user = await AuthService.getMe();
 * ```
 */

import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type { User, Address } from '@/lib/types';

/**
 * Login response interface
 */
export interface LoginResponse {
  token: string;
  refreshToken?: string | undefined;
  user: User;
}

/**
 * Register request interface
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string | undefined;
}

/**
 * Authentication service class
 */
export class AuthService {
  /**
   * Login with email and password
   * 
   * @param email - User email
   * @param password - User password
   * @returns Promise resolving to login response with token and user
   */
  static async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      ENDPOINTS.AUTH.LOGIN,
      { email, password }
    );
    return response.data;
  }

  /**
   * Register a new user
   * 
   * @param data - Registration data
   * @returns Promise resolving to login response with token and user
   */
  static async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      ENDPOINTS.AUTH.REGISTER,
      data
    );
    return response.data;
  }

  /**
   * Logout current user
   * 
   * @returns Promise resolving when logout is complete
   */
  static async logout(): Promise<void> {
    await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
  }

  /**
   * Refresh authentication token
   * 
   * @param refreshToken - Refresh token
   * @returns Promise resolving to new token
   */
  static async refreshToken(refreshToken: string): Promise<{ token: string }> {
    const response = await apiClient.post<{ token: string }>(
      ENDPOINTS.AUTH.REFRESH,
      { refreshToken }
    );
    return response.data;
  }

  /**
   * Get current authenticated user
   * 
   * @returns Promise resolving to current user
   */
  static async getMe(): Promise<User> {
    const response = await apiClient.get<User>(ENDPOINTS.AUTH.ME);
    return response.data;
  }

  /**
   * Initiate Google OAuth login
   * 
   * @returns Promise resolving to OAuth URL
   */
  static async googleLogin(): Promise<{ url: string }> {
    const response = await apiClient.get<{ url: string }>(
      ENDPOINTS.AUTH.GOOGLE
    );
    return response.data;
  }

  /**
   * Initiate Facebook OAuth login
   * 
   * @returns Promise resolving to OAuth URL
   */
  static async facebookLogin(): Promise<{ url: string }> {
    const response = await apiClient.get<{ url: string }>(
      ENDPOINTS.AUTH.FACEBOOK
    );
    return response.data;
  }
}
