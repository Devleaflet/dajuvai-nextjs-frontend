/**
 * React Query hooks for cart operations
 * 
 * Provides optimistic updates, debouncing, and cache management for cart
 * 
 * @example
 * ```typescript
 * import { useCart, useAddToCart, useRemoveFromCart, useUpdateCartQuantity } from '@/lib/hooks/useCart';
 * 
 * function CartComponent() {
 *   const { data: cartItems, isLoading } = useCart();
 *   const addToCart = useAddToCart();
 *   const removeFromCart = useRemoveFromCart();
 *   const updateQuantity = useUpdateCartQuantity();
 * 
 *   const handleAdd = () => {
 *     addToCart.mutate({ productId: 123, quantity: 1 });
 *   };
 * }
 * ```
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDebouncedCallback } from 'use-debounce';
import { CartService } from '@/lib/services/cart.service';
import { queryKeys } from '@/lib/api/queryKeys';
import type { CartItem } from '@/lib/types';
import { toast } from 'react-hot-toast';
import logger from '@/lib/utils/logger';

/**
 * Hook to fetch cart items with React Query
 * 
 * @returns Query result with cart items
 */
export function useCart() {
  return useQuery({
    queryKey: queryKeys.cart.items(),
    queryFn: () => CartService.getItems(),
    staleTime: 30000, // 30 seconds
    retry: 1,
  });
}

/**
 * Hook to add item to cart with optimistic updates
 * 
 * @returns Mutation object for adding to cart
 */
export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      quantity,
      variantId,
    }: {
      productId: number;
      quantity: number;
      variantId?: number;
    }) => CartService.add(productId, quantity, variantId),

    // Optimistic update: immediately update UI before server confirms
    onMutate: async ({ productId, quantity, variantId }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.items() });

      // Snapshot the previous value
      const previousCart = queryClient.getQueryData<CartItem[]>(
        queryKeys.cart.items()
      );

      // Optimistically update to the new value
      queryClient.setQueryData<CartItem[]>(
        queryKeys.cart.items(),
        (old = []) => {
          // Check if item already exists
          const existingItemIndex = old.findIndex(
            (item) =>
              (item.productId === productId || item.product?.id === productId) &&
              (variantId ? item.variantId === variantId : !item.variantId)
          );

          if (existingItemIndex !== -1) {
            // Update existing item quantity
            const newCart = [...old];
            const existingItem = newCart[existingItemIndex];
            if (existingItem) {
              newCart[existingItemIndex] = {
                ...existingItem,
                quantity: existingItem.quantity + quantity,
              };
            }
            return newCart;
          }

          // Add new temporary item
          const tempItem: CartItem = {
            id: Date.now(), // Temporary ID
            cartId: 0, // Temporary cart ID
            productId,
            variantId: variantId ?? null,
            name: 'Loading...',
            description: '',
            price: 0,
            quantity,
            image: '',
          };

          return [tempItem, ...old];
        }
      );

      // Return context with previous value for rollback
      return { previousCart };
    },

    // On error, rollback to previous state
    onError: (error: any, variables, context) => {
      logger.error('Failed to add item to cart', error);

      // Rollback to previous state
      if (context?.previousCart) {
        queryClient.setQueryData(queryKeys.cart.items(), context.previousCart);
      }

      // Show error message
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message ||
        'Failed to add item to cart';

      if (message.includes('stock')) {
        toast.error('Cannot add more than available stock.');
      } else if (message.includes('customer')) {
        toast.error(
          'Only customer accounts can perform this action. If you are an admin or vendor, please create a customer account first.'
        );
      } else {
        toast.error(message);
      }
    },

    // On success, replace temp data with real data from server
    onSuccess: (data) => {
      logger.debug('Item added to cart successfully', data);
      toast.success('Item added to cart successfully!');
    },

    // Always refetch after error or success to sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.items() });
    },
  });
}

/**
 * Hook to remove item from cart with optimistic updates
 * 
 * @returns Mutation object for removing from cart
 */
export function useRemoveFromCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: number | string) => CartService.remove(Number(itemId)),

    // Optimistic update: immediately remove item from UI
    onMutate: async (itemId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.items() });

      // Snapshot the previous value
      const previousCart = queryClient.getQueryData<CartItem[]>(
        queryKeys.cart.items()
      );

      // Optimistically remove the item
      queryClient.setQueryData<CartItem[]>(
        queryKeys.cart.items(),
        (old = []) => old.filter((item) => item.id !== itemId)
      );

      // Return context for rollback
      return { previousCart };
    },

    // On error, rollback to previous state
    onError: (error: any, itemId, context) => {
      logger.error('Failed to remove item from cart', error);

      // Rollback to previous state
      if (context?.previousCart) {
        queryClient.setQueryData(queryKeys.cart.items(), context.previousCart);
      }

      // Show error message
      toast.error('Failed to remove item from cart. Please try again.');
    },

    // On success, show confirmation
    onSuccess: () => {
      logger.debug('Item removed from cart successfully');
      toast.success('Item removed from cart successfully!');
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.items() });
    },
  });
}

/**
 * Hook to update cart item quantity with debouncing and optimistic updates
 * 
 * @returns Object with debounced update function and mutation state
 */
export function useUpdateCartQuantity() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      itemId,
      quantity,
    }: {
      itemId: number | string;
      quantity: number;
    }) => CartService.updateQuantity(Number(itemId), quantity),

    // Optimistic update: immediately update quantity in UI
    onMutate: async ({ itemId, quantity }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.items() });

      // Snapshot the previous value
      const previousCart = queryClient.getQueryData<CartItem[]>(
        queryKeys.cart.items()
      );

      // Optimistically update the quantity
      queryClient.setQueryData<CartItem[]>(
        queryKeys.cart.items(),
        (old = []) =>
          old
            .map((item) =>
              item.id === itemId ? { ...item, quantity } : item
            )
            .filter((item) => item.quantity > 0) // Remove items with 0 quantity
      );

      // Return context for rollback
      return { previousCart };
    },

    // On error, rollback to previous state
    onError: (error: any, variables, context) => {
      logger.error('Failed to update cart quantity', error);

      // Rollback to previous state
      if (context?.previousCart) {
        queryClient.setQueryData(queryKeys.cart.items(), context.previousCart);
      }

      // Show error message
      toast.error('Failed to update quantity. Please try again.');
    },

    // On success, log it
    onSuccess: (data, variables) => {
      logger.debug('Cart quantity updated successfully', {
        itemId: variables.itemId,
        quantity: variables.quantity,
      });
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.items() });
    },
  });

  // Debounced version of the mutation with 500ms delay
  const debouncedUpdate = useDebouncedCallback(
    (itemId: number | string, quantity: number) => {
      mutation.mutate({ itemId, quantity });
    },
    500 // 500ms delay
  );

  return {
    ...mutation,
    debouncedUpdate,
  };
}

/**
 * Hook to increase cart item quantity
 * Uses debounced updates to prevent API spam
 * 
 * @returns Function to increase quantity
 */
export function useIncreaseCartQuantity() {
  const { debouncedUpdate } = useUpdateCartQuantity();
  const queryClient = useQueryClient();

  return (itemId: number | string, amount: number = 1) => {
    // Immediately update local state
    queryClient.setQueryData<CartItem[]>(
      queryKeys.cart.items(),
      (old = []) =>
        old.map((item) =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + amount }
            : item
        )
    );

    // Get the new quantity
    const cart = queryClient.getQueryData<CartItem[]>(queryKeys.cart.items());
    const item = cart?.find((i) => i.id === itemId);

    if (item) {
      // Debounced API call with new total quantity
      debouncedUpdate(itemId, item.quantity);
    }
  };
}

/**
 * Hook to decrease cart item quantity
 * Uses debounced updates to prevent API spam
 * 
 * @returns Function to decrease quantity
 */
export function useDecreaseCartQuantity() {
  const { debouncedUpdate } = useUpdateCartQuantity();
  const queryClient = useQueryClient();

  return (itemId: number | string, amount: number = 1) => {
    // Immediately update local state
    queryClient.setQueryData<CartItem[]>(
      queryKeys.cart.items(),
      (old = []) =>
        old
          .map((item) =>
            item.id === itemId
              ? { ...item, quantity: Math.max(0, item.quantity - amount) }
              : item
          )
          .filter((item) => item.quantity > 0) // Remove items with 0 quantity
    );

    // Get the new quantity
    const cart = queryClient.getQueryData<CartItem[]>(queryKeys.cart.items());
    const item = cart?.find((i) => i.id === itemId);

    if (item) {
      // Debounced API call with new total quantity
      debouncedUpdate(itemId, item.quantity);
    }
  };
}
