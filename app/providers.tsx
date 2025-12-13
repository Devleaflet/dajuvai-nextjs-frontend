'use client';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import { AuthProvider } from '@/lib/context/AuthContext';
import { VendorAuthProvider } from '@/lib/context/VendorAuthContext';
import CartContextProvider from '@/lib/context/CartContext';
import CategoryContextProvider from '@/lib/context/Category';
import { UIProvider } from '@/lib/context/UIContext';
import { WishlistProvider } from '@/lib/context/WishlistContext';

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
      <AuthProvider>
        <VendorAuthProvider>
          <UIProvider>
            <CategoryContextProvider>
              <CartContextProvider>
                <WishlistProvider>
                  <Toaster />
                  {children}
                  <ReactQueryDevtools initialIsOpen={false} />
                </WishlistProvider>
              </CartContextProvider>
            </CategoryContextProvider>
          </UIProvider>
        </VendorAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
