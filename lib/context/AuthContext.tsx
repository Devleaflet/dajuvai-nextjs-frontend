'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/config";
import { setupAxiosInterceptors } from "@/lib/api/axiosInstance";
import logger from "@/lib/utils/logger";
import { secureStorage } from "@/lib/utils/secureStorage";

// Define types for user data
interface UserData {
  id: number;
  username: string;
  email: string;
  role: string;
  isVerified: boolean;
  provider?: string;
  products?: unknown[];
  profilePicture?: string;
}

// Define the shape of the context
interface AuthContextType {
  user: UserData | null;
  token: string | null;
  login: (token: string | null, user: UserData) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  fetchUserData: (userId: number) => Promise<UserData | null>;
  getUserStatus: () => string;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => { },
  logout: () => { },
  isAuthenticated: false,
  isLoading: false,
  fetchUserData: async () => null,
  getUserStatus: () => "Not logged in",
});

// Helper to decode JWT token and get expiration time
const getTokenExpiration = (token: string): number | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[1]) {
      logger.error("Invalid token format");
      return null;
    }
    const payload = JSON.parse(atob(parts[1]));
    return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
  } catch (error) {
    logger.error("Error decoding token", error);
    return null;
  }
};

// Helper to check if token is still valid (not expired)
const isTokenValid = (token: string): boolean => {
  const expiration = getTokenExpiration(token);
  return expiration ? expiration > Date.now() : false;
};

// AuthProvider component to wrap the app
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Determine if user is authenticated
  const isAuthenticated = !!user;

  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    const storedToken = secureStorage.getItem("authToken");
    const storedUser = secureStorage.getItem("authUser");
    //("[Auth Debug] initializeAuth called");
    //("[Auth Debug] secureStorage.authToken:", storedToken);
    //("[Auth Debug] secureStorage.authUser:", storedUser);

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        //("[Auth Debug] Parsed user from secureStorage:", parsedUser);
        if (storedToken && isTokenValid(storedToken)) {
          setToken(storedToken);
          setUser(parsedUser);
          setIsLoading(false);
          return; // Skip /api/auth/me verification for token-based users
        }
        // If no valid token, try cookie-based verification
        setUser(parsedUser);
        // Verify with backend that the user is still authenticated (cookie/cookie-based auth)
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
            },
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              // Update user data with latest from server
              const updatedUser = {
                id: data.data.userId,
                email: data.data.email,
                role: data.data.role,
                username: data.data.email.split('@')[0],
                isVerified: true,
              };
              setUser(updatedUser);
              secureStorage.setItem("authUser", JSON.stringify(updatedUser));
              //("[Auth Debug] User verified with backend:", updatedUser);
            } else {
              //("[Auth Debug] Backend verification failed, clearing auth");
              logout();
            }
          } else {
            //("[Auth Debug] Backend verification failed (HTTP error), clearing auth");
            logout();
          }
        } catch (verifyError) {
          logger.error("Error verifying with backend", verifyError);
          // Don't logout on network errors, keep the user logged in
          logger.debug("Network error during verification, keeping user logged in");
        }
      } catch (error) {
        logger.error("Error initializing auth (JSON parse)", error);
        logout();
      }
    } else {
      //("[Auth Debug] No authUser in localStorage after refresh.");
    }
    setIsLoading(false);
  }, []);

  // Run initialization on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Sync auth state across tabs
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "authToken" || e.key === "authUser") {
        if (!e.newValue) {
          // Token or user removed in another tab
          setToken(null);
          setUser(null);
        } else if (e.key === "authToken" && e.newValue !== token) {
          // Token updated in another tab
          initializeAuth();
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [token, initializeAuth]);

  // Logout function - defined early to avoid TDZ issues
  const logout = useCallback(() => {
    //("AuthContext logout - user only (full cleanse)");
    setToken(null);
    setUser(null);

    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      // Attempt to clear all cookies (best effort, not HttpOnly)
      document.cookie.split(';').forEach((c) => {
        document.cookie = c
          .replace(/^ +/, '')
          .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
      });
      // Call logout API (non-blocking)
      axios
        .post(`${API_BASE_URL}/api/auth/logout`, {}, {
          withCredentials: true,
          timeout: 5000
        })
        .catch((err) => logger.error("Logout API error (non-critical)", err));
      // Reload the page to ensure all state is reset
      window.location.href = '/';
    }
  }, []);

  // Save token and user to secure storage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (token) {
      secureStorage.setItem("authToken", token);
    } else {
      secureStorage.removeItem("authToken");
    }
    if (user) {
      secureStorage.setItem("authUser", JSON.stringify(user));
    } else {
      secureStorage.removeItem("authUser");
    }
  }, [token, user]);

  // Token refresh logic - Optimized approach with visibility and interaction checks
  useEffect(() => {
    if (!token || !isAuthenticated) return;

    const refreshToken = async () => {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
            timeout: 10000, // 10 second timeout
          }
        );
        if (response.data.success && response.data.data.token) {
          setToken(response.data.data.token);
          logger.debug("Token refreshed successfully");
        } else {
          throw new Error("Failed to refresh token");
        }
      } catch (error) {
        logger.error("Token refresh error", error);
        // Only logout if it's a clear auth error
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          logout();
        }
      }
    };

    const checkTokenExpiration = () => {
      const expiration = getTokenExpiration(token);
      if (!expiration) {
        logger.warn("No expiration found in token");
        return;
      }
      const now = Date.now();
      const timeUntilExpiry = expiration - now;

      // Refresh threshold - only refresh 30 minutes before expiry
      const refreshThreshold = 30 * 60 * 1000; // 30 minutes

      if (timeUntilExpiry < refreshThreshold && timeUntilExpiry > 0) {
        logger.debug(`Token expires in ${Math.round(timeUntilExpiry / 60000)} minutes, refreshing...`);
        refreshToken();
      }
    };

    // Check token on page visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkTokenExpiration();
      }
    };

    // Check token on user interaction (click or focus)
    const handleUserInteraction = () => {
      checkTokenExpiration();
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('click', handleUserInteraction, { once: true, capture: true });
    window.addEventListener('focus', handleUserInteraction, { once: true });

    // Check immediately on token change
    checkTokenExpiration();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('focus', handleUserInteraction);
    };
  }, [token, isAuthenticated, logout]);

  // Login function
  const login = (newToken: string | null, newUser: UserData) => {
    // Accept login if either a token or a user is provided (for cookie-based auth)
    if (!newToken && !newUser) {
      logger.error("No token or user provided to login function");
      return;
    }
    if (newToken) {
      setToken(newToken);
      if (typeof window !== 'undefined') {
        secureStorage.setItem("authToken", newToken);
      }
    }
    setUser(newUser);
    if (typeof window !== 'undefined') {
      secureStorage.setItem("authUser", JSON.stringify(newUser));
    }
  };

  // Fetch user data by ID
  const fetchUserData = async (userId: number): Promise<UserData | null> => {
    const currentToken = token || (typeof window !== 'undefined' ? secureStorage.getItem("authToken") : null);
    logger.debug("fetchUserData called", { userId });
    logger.debug("Using token", { hasToken: !!currentToken });
    if (!currentToken) {
      logger.error("No token available for fetching user data");
      return null;
    }

    try {
      setIsLoading(true);
      const response = await axios.get<{ success: boolean; data: UserData }>(
        `${API_BASE_URL}/api/auth/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
            Accept: "application/json",
          },
          timeout: 10000,
        }
      );
      logger.debug("fetchUserData response", { success: response.data.success });
      if (response.data.success) {
        const userData = response.data.data;
        setUser(userData);
        return userData;
      } else {
        logger.error("Failed to fetch user data", response.data);
        return null;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error("Error fetching user data", { message: error.response?.data?.message || error.message });
        if (error.response?.status === 401) {
          logout();
        }
      } else {
        logger.error("Unexpected error fetching user data", error);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Get user status
  const getUserStatus = (): string => {
    if (isLoading) return "Loading...";
    if (!isAuthenticated || !user) return "Not logged in";
    return `Logged in as ${user.username || user.email || "User"}`;
  };

  // Setup axios interceptors
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setupAxiosInterceptors(() => token || secureStorage.getItem("authToken"));
  }, [token]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      user,
      token,
      login,
      logout,
      isAuthenticated,
      isLoading,
      fetchUserData,
      getUserStatus,
    }),
    [user, token, login, logout, isAuthenticated, isLoading, fetchUserData, getUserStatus]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};