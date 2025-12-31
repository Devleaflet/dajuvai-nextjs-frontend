/**
 * Example component showing how to use CartService
 * Demonstrates optimistic updates and error handling
 */

'use client';

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CartService } from '@/lib/services/cart.service';
import { queryKeys } from '@/lib/api/queryKeys';
import { handleApiError } from '@/lib/utils/errorHandler';
import { toast } from 'react-hot-toast';

export function CartExample() {
  const queryClient = useQueryClient();

  // Fetch cart items
  const { data: cartItems, isLoading } = useQuery({
    queryKey: queryKeys.cart.items(),
    queryFn: () => CartService.getItems(),
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  // Add to cart mutation with optimistic update
  const addToCartMutation = useMutation({
    mutationFn: ({ productId, quantity, variantId }: {
      productId: number;
      quantity: number;
      variantId?: number;
    }) => CartService.add(productId, quantity, variantId),

    // Optimistic update
    onMutate: async (newItem) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.items() });

      // Snapshot previous value
      const previousCart = queryClient.getQueryData(queryKeys.cart.items());

      // Optimistically update cart
      queryClient.setQueryData(queryKeys.cart.items(), (old: any) => {
        return [...(old || []), { ...newItem, id: Date.now() }];
      });

      return { previousCart };
    },

    // On error, rollback
    onError: (error, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(queryKeys.cart.items(), context.previousCart);
      }
      const appError = handleApiError(error);
      toast.error(appError.message);
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.items() });
    },

    onSuccess: () => {
      toast.success('Added to cart!');
    },
  });

  // Update quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      CartService.updateQuantity(itemId, quantity),

    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.items() });
      const previousCart = queryClient.getQueryData(queryKeys.cart.items());

      queryClient.setQueryData(queryKeys.cart.items(), (old: any) => {
        return old?.map((item: any) =>
          item.id === itemId ? { ...item, quantity } : item
        );
      });

      return { previousCart };
    },

    onError: (error, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(queryKeys.cart.items(), context.previousCart);
      }
      const appError = handleApiError(error);
      toast.error(appError.message);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.items() });
    },
  });

  // Remove from cart mutation
  const removeFromCartMutation = useMutation({
    mutationFn: (itemId: number) => CartService.remove(itemId),

    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.items() });
      const previousCart = queryClient.getQueryData(queryKeys.cart.items());

      queryClient.setQueryData(queryKeys.cart.items(), (old: any) => {
        return old?.filter((item: any) => item.id !== itemId);
      });

      return { previousCart };
    },

    onError: (error, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(queryKeys.cart.items(), context.previousCart);
      }
      const appError = handleApiError(error);
      toast.error(appError.message);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.items() });
    },

    onSuccess: () => {
      toast.success('Removed from cart');
    },
  });

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: () => CartService.clear(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.items() });
      toast.success('Cart cleared');
    },
    onError: (error) => {
      const appError = handleApiError(error);
      toast.error(appError.message);
    },
  });

  if (isLoading) {
    return <div>Loading cart...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Shopping Cart</h2>
        {cartItems && cartItems.length > 0 && (
          <button
            onClick={() => clearCartMutation.mutate()}
            className="text-red-600 hover:text-red-700"
          >
            Clear Cart
          </button>
        )}
      </div>

      {!cartItems || cartItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Your cart is empty</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* {cartItems.map((item) => (
            <div key={item.id} className="flex items-center gap-4 border p-4 rounded">
              <img
                src={item.product.image}
                alt={item.product.name}
                className="w-20 h-20 object-cover rounded"
              />
              <div className="flex-1">
                <h3 className="font-semibold">{item.product.name}</h3>
                <p className="text-gray-600">Rs {item.price.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updateQuantityMutation.mutate({
                      itemId: item.id,
                      quantity: Math.max(1, item.quantity - 1),
                    })
                  }
                  className="px-2 py-1 border rounded"
                >
                  -
                </button>
                <span className="px-4">{item.quantity}</span>
                <button
                  onClick={() =>
                    updateQuantityMutation.mutate({
                      itemId: item.id,
                      quantity: item.quantity + 1,
                    })
                  }
                  className="px-2 py-1 border rounded"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => removeFromCartMutation.mutate(item.id)}
                className="text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))} */}
        </div>
      )}

      {/* Example: Add to cart button */}
      <button
        onClick={() =>
          addToCartMutation.mutate({
            productId: 123,
            quantity: 1,
          })
        }
        className="mt-6 px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
      >
        Add Example Product
      </button>
    </div>
  );
}

/**
 * Example of using CartService directly
 */
export async function cartOperationsExample() {
  try {
    // Get cart items
    const items = await CartService.getItems();
    console.log('Cart items:', items);

    // Add to cart
    const newItem = await CartService.add(123, 2);
    console.log('Added item:', newItem);

    // Update quantity
    // const updatedItem = await CartService.updateQuantity(newItem.id, 3);
    // console.log('Updated item:', updatedItem);

    // Remove from cart
    // await CartService.remove(newItem.id);
    console.log('Item removed');

    // Clear cart
    await CartService.clear();
    console.log('Cart cleared');
  } catch (error) {
    const appError = handleApiError(error);
    console.error('Cart operation failed:', appError.message);
  }
}

export default CartExample;
