import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WishlistService } from '@/lib/services/wishlist.service';
import { queryKeys } from '@/lib/api/queryKeys';
import type { WishlistItem } from '@/lib/types';
import logger from '@/lib/utils/logger';

/**
 * Custom hook for fetching wishlist items
 * @returns React Query result with wishlist items
 */
export function useWishlist() {
  return useQuery({
    queryKey: queryKeys.wishlist.items(),
    queryFn: () => WishlistService.getItems(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Custom hook for adding items to wishlist
 * @returns Mutation hook for adding to wishlist
 */
export function useAddToWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      variantId,
    }: {
      productId: number;
      variantId?: number;
    }) => WishlistService.add(productId, variantId),

    // Optimistic update
    onMutate: async ({ productId, variantId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.wishlist.items() });

      // Snapshot previous value
      const previousWishlist = queryClient.getQueryData<WishlistItem[]>(
        queryKeys.wishlist.items()
      );

      // Optimistically update to the new value
      if (previousWishlist) {
        const optimisticItem: WishlistItem = {
          id: Date.now(), // Temporary ID
          productId,
          ...(variantId !== undefined && { variantId }),
          product: {} as any, // Will be filled by server response
          variant: variantId ? ({} as any) : undefined,
          createdAt: new Date().toISOString(),
        };

        queryClient.setQueryData<WishlistItem[]>(
          queryKeys.wishlist.items(),
          [...previousWishlist, optimisticItem]
        );
      }

      return { previousWishlist };
    },

    // On error, rollback
    onError: (error, variables, context) => {
      logger.error('Failed to add to wishlist', error);
      if (context?.previousWishlist) {
        queryClient.setQueryData(
          queryKeys.wishlist.items(),
          context.previousWishlist
        );
      }
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.items() });
    },
  });
}

/**
 * Custom hook for removing items from wishlist
 * @returns Mutation hook for removing from wishlist
 */
export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (wishlistItemId: number) =>
      WishlistService.remove(wishlistItemId),

    // Optimistic update
    onMutate: async (wishlistItemId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.wishlist.items() });

      // Snapshot previous value
      const previousWishlist = queryClient.getQueryData<WishlistItem[]>(
        queryKeys.wishlist.items()
      );

      // Optimistically remove the item
      if (previousWishlist) {
        queryClient.setQueryData<WishlistItem[]>(
          queryKeys.wishlist.items(),
          previousWishlist.filter((item) => item.id !== wishlistItemId)
        );
      }

      return { previousWishlist };
    },

    // On error, rollback
    onError: (error, variables, context) => {
      logger.error('Failed to remove from wishlist', error);
      if (context?.previousWishlist) {
        queryClient.setQueryData(
          queryKeys.wishlist.items(),
          context.previousWishlist
        );
      }
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.items() });
    },
  });
}

/**
 * Custom hook for moving wishlist item to cart
 * @returns Mutation hook for moving to cart
 */
export function useMoveToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      wishlistItemId,
      quantity,
    }: {
      wishlistItemId: number;
      quantity: number;
    }) => WishlistService.moveToCart(wishlistItemId, quantity),

    // On success, invalidate both wishlist and cart
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.items() });
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.items() });
    },

    onError: (error) => {
      logger.error('Failed to move to cart', error);
    },
  });
}

/**
 * Custom hook for clearing the entire wishlist
 * @returns Mutation hook for clearing wishlist
 */
export function useClearWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => WishlistService.clear(),

    // Optimistic update
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.wishlist.items() });

      const previousWishlist = queryClient.getQueryData<WishlistItem[]>(
        queryKeys.wishlist.items()
      );

      // Optimistically clear the wishlist
      queryClient.setQueryData<WishlistItem[]>(queryKeys.wishlist.items(), []);

      return { previousWishlist };
    },

    // On error, rollback
    onError: (error, variables, context) => {
      logger.error('Failed to clear wishlist', error);
      if (context?.previousWishlist) {
        queryClient.setQueryData(
          queryKeys.wishlist.items(),
          context.previousWishlist
        );
      }
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.items() });
    },
  });
}
