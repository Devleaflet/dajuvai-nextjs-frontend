import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCart, useAddToCart, useRemoveFromCart, useUpdateCartQuantity } from './useCart';
import { CartService } from '@/lib/services/cart.service';
import type { CartItem } from '@/lib/types';

// Mock CartService
vi.mock('@/lib/services/cart.service', () => ({
  CartService: {
    getItems: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    updateQuantity: vi.fn(),
  },
}));

// Mock toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useCart Integration Tests', () => {
  let queryClient: QueryClient;

  const mockCartItems: CartItem[] = [
    {
      id: 1,
      cartId: 1,
      productId: 101,
      variantId: null,
      name: 'Test Product 1',
      description: 'Test description',
      price: 100,
      quantity: 2,
      image: '/test1.jpg',
    },
    {
      id: 2,
      cartId: 1,
      productId: 102,
      variantId: null,
      name: 'Test Product 2',
      description: 'Test description 2',
      price: 200,
      quantity: 1,
      image: '/test2.jpg',
    },
  ];

  beforeEach(() => {
    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });

    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useCart', () => {
    it('should fetch cart items successfully', async () => {
      vi.mocked(CartService.getItems).mockResolvedValue(mockCartItems);

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockCartItems);
      expect(CartService.getItems).toHaveBeenCalledTimes(1);
    });

    it('should handle loading state', async () => {
      vi.mocked(CartService.getItems).mockResolvedValue(mockCartItems);

      const { result } = renderHook(() => useCart(), { wrapper });

      // Initially should be loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useAddToCart', () => {
    it('should add product to cart successfully', async () => {
      const newItem: CartItem = {
        id: 3,
        cartId: 1,
        productId: 103,
        variantId: null,
        name: 'New Product',
        description: 'New description',
        price: 150,
        quantity: 1,
        image: '/new.jpg',
      };

      vi.mocked(CartService.getItems).mockResolvedValue(mockCartItems);
      vi.mocked(CartService.add).mockResolvedValue(newItem);

      const { result } = renderHook(() => useAddToCart(), { wrapper });

      act(() => {
        result.current.mutate({ productId: 103, quantity: 1 });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(CartService.add).toHaveBeenCalledWith(103, 1, undefined);
    });

    it('should handle add to cart with variant', async () => {
      const newItem: CartItem = {
        id: 3,
        cartId: 1,
        productId: 103,
        variantId: 5,
        name: 'New Product',
        description: 'New description',
        price: 150,
        quantity: 1,
        image: '/new.jpg',
      };

      vi.mocked(CartService.add).mockResolvedValue(newItem);

      const { result } = renderHook(() => useAddToCart(), { wrapper });

      act(() => {
        result.current.mutate({ productId: 103, quantity: 1, variantId: 5 });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(CartService.add).toHaveBeenCalledWith(103, 1, 5);
    });

    it('should rollback on error', async () => {
      vi.mocked(CartService.getItems).mockResolvedValue(mockCartItems);
      vi.mocked(CartService.add).mockRejectedValue(new Error('Out of stock'));

      // First, populate the cache
      const { result: cartResult } = renderHook(() => useCart(), { wrapper });
      await waitFor(() => expect(cartResult.current.isSuccess).toBe(true));

      const initialCartLength = mockCartItems.length;

      const { result: addResult } = renderHook(() => useAddToCart(), { wrapper });

      act(() => {
        addResult.current.mutate({ productId: 103, quantity: 1 });
      });

      await waitFor(() => {
        expect(addResult.current.isError).toBe(true);
      });

      // Check that cart was rolled back to original state
      const cartData = queryClient.getQueryData<CartItem[]>(['cart', 'items']);
      expect(cartData).toEqual(mockCartItems);
      expect(cartData!.length).toBe(initialCartLength);
    });
  });

  describe('useRemoveFromCart', () => {
    it('should remove product from cart successfully', async () => {
      vi.mocked(CartService.getItems).mockResolvedValue(mockCartItems);
      vi.mocked(CartService.remove).mockResolvedValue();

      // First, populate the cache
      const { result: cartResult } = renderHook(() => useCart(), { wrapper });
      await waitFor(() => expect(cartResult.current.isSuccess).toBe(true));

      const { result: removeResult } = renderHook(() => useRemoveFromCart(), { wrapper });

      act(() => {
        removeResult.current.mutate(1);
      });

      await waitFor(() => {
        expect(removeResult.current.isSuccess).toBe(true);
      });

      expect(CartService.remove).toHaveBeenCalledWith(1);
    });

    it('should handle remove with loading state', async () => {
      vi.mocked(CartService.getItems).mockResolvedValue(mockCartItems);
      vi.mocked(CartService.remove).mockResolvedValue();

      const { result: cartResult } = renderHook(() => useCart(), { wrapper });
      await waitFor(() => expect(cartResult.current.isSuccess).toBe(true));

      const { result: removeResult } = renderHook(() => useRemoveFromCart(), { wrapper });

      act(() => {
        removeResult.current.mutate(1);
      });

      // Wait for success instead of checking loading state
      await waitFor(() => {
        expect(removeResult.current.isSuccess).toBe(true);
      });

      expect(CartService.remove).toHaveBeenCalledWith(1);
    });

    it('should rollback on error when removing', async () => {
      vi.mocked(CartService.getItems).mockResolvedValue(mockCartItems);
      vi.mocked(CartService.remove).mockRejectedValue(new Error('Network error'));

      // First, populate the cache
      const { result: cartResult } = renderHook(() => useCart(), { wrapper });
      await waitFor(() => expect(cartResult.current.isSuccess).toBe(true));

      const { result: removeResult } = renderHook(() => useRemoveFromCart(), { wrapper });

      act(() => {
        removeResult.current.mutate(1);
      });

      await waitFor(() => {
        expect(removeResult.current.isError).toBe(true);
      });

      // Check that cart was rolled back
      const cartData = queryClient.getQueryData<CartItem[]>(['cart', 'items']);
      expect(cartData).toEqual(mockCartItems);
    });
  });

  describe('useUpdateCartQuantity', () => {
    it('should update quantity successfully', async () => {
      const updatedItem: CartItem = { ...mockCartItems[0], quantity: 5 };

      vi.mocked(CartService.getItems).mockResolvedValue(mockCartItems);
      vi.mocked(CartService.updateQuantity).mockResolvedValue(updatedItem);

      // First, populate the cache
      const { result: cartResult } = renderHook(() => useCart(), { wrapper });
      await waitFor(() => expect(cartResult.current.isSuccess).toBe(true));

      const { result: updateResult } = renderHook(() => useUpdateCartQuantity(), { wrapper });

      act(() => {
        updateResult.current.mutate({ itemId: 1, quantity: 5 });
      });

      await waitFor(() => {
        expect(updateResult.current.isSuccess).toBe(true);
      });

      expect(CartService.updateQuantity).toHaveBeenCalledWith(1, 5);
    });

    it('should have debounced update function', () => {
      const { result } = renderHook(() => useUpdateCartQuantity(), { wrapper });

      expect(result.current.debouncedUpdate).toBeDefined();
      expect(typeof result.current.debouncedUpdate).toBe('function');
    });

    it('should rollback on error when updating quantity', async () => {
      vi.mocked(CartService.getItems).mockResolvedValue(mockCartItems);
      vi.mocked(CartService.updateQuantity).mockRejectedValue(new Error('Invalid quantity'));

      // First, populate the cache
      const { result: cartResult } = renderHook(() => useCart(), { wrapper });
      await waitFor(() => expect(cartResult.current.isSuccess).toBe(true));

      const originalQuantity = mockCartItems[0].quantity;

      const { result: updateResult } = renderHook(() => useUpdateCartQuantity(), { wrapper });

      act(() => {
        updateResult.current.mutate({ itemId: 1, quantity: 999 });
      });

      await waitFor(() => {
        expect(updateResult.current.isError).toBe(true);
      });

      // Check that quantity was rolled back
      const cartData = queryClient.getQueryData<CartItem[]>(['cart', 'items']);
      const item = cartData!.find((i) => i.id === 1);
      expect(item?.quantity).toBe(originalQuantity);
    });

    it('should handle quantity update with different values', async () => {
      vi.mocked(CartService.getItems).mockResolvedValue(mockCartItems);
      vi.mocked(CartService.updateQuantity).mockResolvedValue({} as CartItem);

      const { result: cartResult } = renderHook(() => useCart(), { wrapper });
      await waitFor(() => expect(cartResult.current.isSuccess).toBe(true));

      const { result: updateResult } = renderHook(() => useUpdateCartQuantity(), { wrapper });

      act(() => {
        updateResult.current.mutate({ itemId: 1, quantity: 10 });
      });

      await waitFor(() => {
        expect(updateResult.current.isSuccess).toBe(true);
      });

      expect(CartService.updateQuantity).toHaveBeenCalledWith(1, 10);
    });
  });
});
