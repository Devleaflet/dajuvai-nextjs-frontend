'use client';

import React from 'react';

/**
 * Provider composition utility
 * Combines multiple providers into a single component to reduce nesting
 */

type Provider = React.ComponentType<{ children: React.ReactNode }>;

/**
 * Combines multiple providers into a single component
 * 
 * @param providers - Array of provider components
 * @returns Combined provider component
 * 
 * @example
 * ```tsx
 * const AppProviders = combineProviders([
 *   AuthProvider,
 *   CartProvider,
 *   WishlistProvider,
 * ]);
 * 
 * <AppProviders>
 *   <App />
 * </AppProviders>
 * ```
 */
export function combineProviders(providers: Provider[]): React.FC<{ children: React.ReactNode }> {
  return ({ children }) => {
    return providers.reduceRight((acc, Provider) => {
      return <Provider>{acc}</Provider>;
    }, children);
  };
}

/**
 * Pre-composed AppProviders component
 * Import and use this in your app layout
 */
import { AuthProvider } from '@/lib/context/AuthContext';
import CartContextProvider from '@/lib/context/CartContext';
import { WishlistProvider } from '@/lib/context/WishlistContext';
import { VendorAuthProvider } from '@/lib/context/VendorAuthContext';

export const AppProviders = combineProviders([
  AuthProvider,
  VendorAuthProvider,
  CartContextProvider,
  WishlistProvider,
]);
