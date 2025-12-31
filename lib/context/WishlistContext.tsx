'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { getWishlist } from '@/lib/api/wishlist';
import { useAuth } from '@/lib/context/AuthContext';

interface WishlistContextType {
    wishlist: any[];
    wishlistMap: Map<number, any>;
    loading: boolean;
    refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, token } = useAuth();
    const [wishlist, setWishlist] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const refreshWishlist = useCallback(async () => {
        if (!isAuthenticated || !token) {
            setWishlist([]);
            return;
        }
        setLoading(true);
        try {
            const items = await getWishlist(token);
            setWishlist(items);
        } catch (err) {
            console.warn('Failed to load wishlist', err);
            setWishlist([]);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, token]);

    useEffect(() => {
        refreshWishlist();
    }, [refreshWishlist]);

    // auto-refresh every 30s or on focus
    useEffect(() => {
        if (!isAuthenticated) return;
        const interval = setInterval(refreshWishlist, 30_000);
        return () => clearInterval(interval);
    }, [isAuthenticated, refreshWishlist]);

    const wishlistMap = useMemo(() => {
        const map = new Map();
        wishlist.forEach(item => {
            const key = item.variantId ? `${item.productId}_${item.variantId}` : item.productId;
            map.set(key, item);
        });
        return map;
    }, [wishlist]);

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(
        () => ({
            wishlist,
            wishlistMap,
            loading,
            refreshWishlist,
        }),
        [wishlist, wishlistMap, loading, refreshWishlist]
    );

    return (
        <WishlistContext.Provider value={contextValue}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) throw new Error('useWishlist must be used within WishlistProvider');
    return context;
};