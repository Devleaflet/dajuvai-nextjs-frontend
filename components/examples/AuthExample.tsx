/**
 * Example component showing how to use AuthService
 * Demonstrates login, register, and authentication flows
 * 
 * NOTE: This is an example component for demonstration purposes.
 * In production, use the AuthContext from @/lib/context/AuthContext
 * for proper state management and consistency across the app.
 */

'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AuthService } from '@/lib/services/auth.service';
import { handleApiError } from '@/lib/utils/errorHandler';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export function AuthExample() {
  const router = useRouter();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      AuthService.login(email, password),

    onSuccess: (data) => {
      // Store token
      localStorage.setItem('token', data.token);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      toast.success('Login successful!');

      // Redirect based on role
      if (data.user.role === 'ADMIN') {
        router.push('/admin/dashboard');
        // } 
        // else if (data.user.role === 'VENDOR') {
        //   router.push('/vendor/dashboard');
      } else {
        router.push('/');
      }
    },

    onError: (error) => {
      const appError = handleApiError(error);

      // Handle specific error codes
      if (appError.statusCode === 401) {
        toast.error('Invalid email or password');
      } else if (appError.statusCode === 403) {
        toast.error('Account not verified. Please check your email.');
      } else {
        toast.error(appError.message);
      }
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: {
      email: string;
      password: string;
      name: string;
      phone?: string;
    }) => AuthService.register(data),

    onSuccess: (data) => {
      // Store token
      localStorage.setItem('token', data.token);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      toast.success('Registration successful!');
      router.push('/');
    },

    onError: (error) => {
      const appError = handleApiError(error);

      // Handle specific error codes
      if (appError.statusCode === 409) {
        toast.error('Email already exists');
      } else if (appError.statusCode === 400) {
        toast.error('Invalid registration data');
      } else {
        toast.error(appError.message);
      }
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => AuthService.logout(),

    onSuccess: () => {
      // Clear tokens
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');

      toast.success('Logged out successfully');
      router.push('/');
    },

    onError: (error) => {
      const appError = handleApiError(error);
      toast.error(appError.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.email || !formData.password) {
      toast.error('Email and password are required');
      return;
    }

    if (!isLoginMode && !formData.name) {
      toast.error('Name is required for registration');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (isLoginMode) {
      loginMutation.mutate({
        email: formData.email,
        password: formData.password,
      });
    } else {
      registerMutation.mutate({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
      });
    }
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isLoginMode ? 'Login' : 'Register'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && (
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-orange-500"
                required={!isLoginMode}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          {!isLoginMode && (
            <div>
              <label className="block text-sm font-medium mb-2">Phone (Optional)</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-400"
          >
            {isLoading ? 'Loading...' : isLoginMode ? 'Login' : 'Register'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLoginMode(!isLoginMode)}
            className="text-orange-500 hover:text-orange-600"
          >
            {isLoginMode
              ? "Don't have an account? Register"
              : 'Already have an account? Login'}
          </button>
        </div>

        <div className="mt-4">
          <button
            onClick={() => logoutMutation.mutate()}
            className="w-full py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Example of using AuthService directly
 */
export async function authOperationsExample() {
  try {
    // Login
    const loginResponse = await AuthService.login('user@example.com', 'password123');
    console.log('Login response:', loginResponse);
    localStorage.setItem('token', loginResponse.token);

    // Register
    const registerResponse = await AuthService.register({
      email: 'newuser@example.com',
      password: 'password123',
      name: 'John Doe',
      phone: '9841234567',
    });
    console.log('Register response:', registerResponse);

    // Get current user
    const user = await AuthService.getMe();
    console.log('Current user:', user);

    // Refresh token
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      const refreshResponse = await AuthService.refreshToken(refreshToken);
      console.log('New token:', refreshResponse.token);
      localStorage.setItem('token', refreshResponse.token);
    }

    // Logout
    await AuthService.logout();
    console.log('Logged out');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  } catch (error) {
    const appError = handleApiError(error);
    console.error('Auth operation failed:', appError.message);

    // Handle specific errors
    if (appError.statusCode === 401) {
      console.log('Unauthorized - redirecting to login');
      window.location.href = '/login';
    }
  }
}

/**
 * Example of checking authentication status
 */
export async function checkAuthStatus() {
  const token = localStorage.getItem('token');

  if (!token) {
    console.log('Not authenticated');
    return false;
  }

  try {
    const user = await AuthService.getMe();
    console.log('Authenticated as:', user.email);
    return true;
  } catch (error) {
    const appError = handleApiError(error);

    if (appError.statusCode === 401) {
      // Token expired, try to refresh
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const refreshResponse = await AuthService.refreshToken(refreshToken);
          localStorage.setItem('token', refreshResponse.token);
          console.log('Token refreshed successfully');
          return true;
        } catch {
          console.log('Token refresh failed');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          return false;
        }
      }
    }

    return false;
  }
}

export default AuthExample;
