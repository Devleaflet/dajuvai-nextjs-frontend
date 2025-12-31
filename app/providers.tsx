'use client';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import { combineProviders } from '@/lib/providers';
import { AuthProvider } from '@/lib/context/AuthContext';
import { VendorAuthProvider } from '@/lib/context/VendorAuthContext';
import CartContextProvider from '@/lib/context/CartContext';
import CategoryContextProvider from '@/lib/context/Category';
import { UIProvider } from '@/lib/context/UIContext';
import { WishlistProvider } from '@/lib/context/WishlistContext';

// Combine all context providers using the composition utility
const ContextProviders = combineProviders([
  AuthProvider,
  VendorAuthProvider,
  UIProvider,
  CategoryContextProvider,
  CartContextProvider,
  WishlistProvider,
]);

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: (failureCount: number, error: any) => {
          if (error?.message?.includes('404') || error?.message?.includes('400')) {
            return false;
          }
          return failureCount < 3;
        },
        retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <ContextProviders>
        <Toaster />
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </ContextProviders>
    </QueryClientProvider>
  );
}
