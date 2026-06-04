'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '@/lib/api/axiosInstance';
import { VendorAuthService } from '@/lib/services/vendorAuthService';
import logger from '@/lib/utils/logger';

interface Vendor {
  id: number;
  businessName: string;
  email: string;
  businessAddress?: string;
  phoneNumber: string;
  isVerified: boolean;
  district?: string;
  profilePicture?: string;
}

interface AuthState {
  token: string | null;
  vendor: Vendor | null;
  isAuthenticated: boolean;
}

interface AuthContextType {
  authState: AuthState;
  login: (token: string, vendor: Vendor) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to decode JWT token and get expiration time
const getTokenExpiration = (token: string): number | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[1]) {
      return null;
    }
    const payload = JSON.parse(atob(parts[1]));
    return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
  } catch (error) {
    return null;
  }
};

export const VendorAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    vendor: null,
    isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state - only runs on client side
    const initializeAuth = async () => {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      const savedToken = localStorage.getItem('vendorToken');
      const savedVendor = localStorage.getItem('vendorData');

      if (savedToken && savedVendor) {
        try {
          const vendor = JSON.parse(savedVendor);
          document.cookie = `vendorToken=${savedToken}; path=/; max-age=604800; SameSite=Lax`;
          setAuthState({
            token: savedToken,
            vendor,
            isAuthenticated: true
          });
        } catch (error) {
          console.error('Error parsing vendor data:', error);
          // Clear invalid data
          localStorage.removeItem('vendorToken');
          localStorage.removeItem('vendorData');
          setAuthState({
            token: null,
            vendor: null,
            isAuthenticated: false
          });
        }
      } else {
        setAuthState({
          token: null,
          vendor: null,
          isAuthenticated: false
        });
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (token: string, vendor: Vendor) => {
    setAuthState({ token, vendor, isAuthenticated: true });
    if (typeof window !== 'undefined') {
      localStorage.setItem('vendorToken', token);
      localStorage.setItem('vendorData', JSON.stringify(vendor));
      document.cookie = `vendorToken=${token}; path=/; max-age=604800; SameSite=Lax`;
    }
  };

  const logout = () => {
    setAuthState({ token: null, vendor: null, isAuthenticated: false });
    if (typeof window !== 'undefined') {
      document.cookie = 'vendorToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    }
    VendorAuthService.comprehensiveLogout();
  };

  useEffect(() => {
    if (!authState.token || !authState.isAuthenticated) return;

    const checkTokenExpiration = () => {
      const expiration = getTokenExpiration(authState.token as string);
      if (!expiration) return;

      const now = Date.now();
      const timeUntilExpiry = expiration - now;

      // If expired, log out immediately since there's no refresh endpoint for vendors
      if (timeUntilExpiry <= 0) {
        logger.warn("Vendor token expired, logging out");
        logout();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkTokenExpiration();
    };

    const handleUserInteraction = () => {
      checkTokenExpiration();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('click', handleUserInteraction, { once: true, capture: true });
    window.addEventListener('focus', handleUserInteraction, { once: true });

    checkTokenExpiration();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('focus', handleUserInteraction);
    };
  }, [authState.token, authState.isAuthenticated]);

  return (
    <AuthContext.Provider value={{ authState, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useVendorAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useVendorAuth must be used within a VendorAuthProvider');
  }
  return context;
};

export default AuthContext;