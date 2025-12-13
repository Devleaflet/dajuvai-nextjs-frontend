'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { setupAxiosInterceptors } from '@/lib/api/axiosInstance';
import axiosInstance from '@/lib/api/axiosInstance';
import { VendorAuthService } from '@/lib/services/vendorAuthService';

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
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  // Setup axios interceptors
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Always get the latest token from localStorage for every request
    setupAxiosInterceptors(() => localStorage.getItem('vendorToken'));
  }, [authState.token]);

  const refreshToken = async () => {
    try {
      if (!authState.token) return;

      const response = await axiosInstance.post('/api/auth/refresh', {}, {
        headers: { Authorization: `Bearer ${authState.token}` }
      });

      if (response.data.success && response.data.token) {
        const newToken = response.data.token;
        setAuthState(prev => ({ ...prev, token: newToken }));
        if (typeof window !== 'undefined') {
          localStorage.setItem('vendorToken', newToken);
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
    }
  };

  const login = (token: string, vendor: Vendor) => {
    setAuthState({ token, vendor, isAuthenticated: true });
    if (typeof window !== 'undefined') {
      localStorage.setItem('vendorToken', token);
      localStorage.setItem('vendorData', JSON.stringify(vendor));
    }
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    //("VendorAuthContext logout - using comprehensive logout");
    setAuthState({ token: null, vendor: null, isAuthenticated: false });
    VendorAuthService.comprehensiveLogout();
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout, isLoading, refreshToken }}>
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