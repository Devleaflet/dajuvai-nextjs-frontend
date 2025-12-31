/**
 * Example component demonstrating the new React Query cart hooks
 * 
 * This shows how to use:
 * - useCart for fetching cart items
 * - useAddToCart for adding items with optimistic updates
 * - useRemoveFromCart for removing items with optimistic updates
 * - useIncreaseCartQuantity for debounced quantity increases
 * - useDecreaseCartQuantity for debounced quantity decreases
 */

'use client';

import React from 'react';
import {
  useCart,
  useAddToCart,
  useRemoveFromCart,
  useIncreaseCartQuantity,
  useDecreaseCartQuantity,
} from '@/lib/hooks/useCart';

export default function CartHooksExample() {
  // Fetch cart items with React Query
  const { data: cartItems, isLoading, error } = useCart();

  // Mutation hooks
  const addToCart = useAddToCart();
  const removeFromCart = useRemoveFromCart();
  const increaseQuantity = useIncreaseCartQuantity();
  const decreaseQuantity = useDecreaseCartQuantity();

  // Example: Add a product to cart
  const handleAddProduct = () => {
    addToCart.mutate({
      productId: 123,
      quantity: 1,
      // variantId: 456, // Optional
    });
  };

  // Example: Remove item from cart
  const handleRemoveItem = (itemId: number) => {
    removeFromCart.mutate(itemId);
  };

  // Example: Increase quantity (debounced)
  const handleIncrease = (itemId: number) => {
    increaseQuantity(itemId, 1);
  };

  // Example: Decrease quantity (debounced)
  const handleDecrease = (itemId: number) => {
    decreaseQuantity(itemId, 1);
  };

  if (isLoading) {
    return <div>Loading cart...</div>;
  }

  if (error) {
    return <div>Error loading cart: {error.message}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Cart Items</h2>

      <button
        onClick={handleAddProduct}
        disabled={addToCart.isPending}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {addToCart.isPending ? 'Adding...' : 'Add Sample Product'}
      </button>

      {cartItems && cartItems.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <div className="space-y-4">
          {cartItems?.map((item) => (
            <div
              key={item.id}
              className="border p-4 rounded-lg flex items-center justify-between"
            >
              <div>
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-gray-600">Rs {item.price}</p>
                <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDecrease(Number(item.id))}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                  -
                </button>

                <span className="px-4">{item.quantity}</span>

                <button
                  onClick={() => handleIncrease(Number(item.id))}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                  +
                </button>

                <button
                  onClick={() => handleRemoveItem(Number(item.id))}
                  disabled={removeFromCart.isPending}
                  className="ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                >
                  {removeFromCart.isPending ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Features Demonstrated:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>✅ Optimistic updates - UI updates immediately</li>
          <li>✅ Debounced quantity changes - API calls delayed by 500ms</li>
          <li>✅ Error handling with rollback - Failed updates revert UI</li>
          <li>✅ Loading states - Buttons show pending state</li>
          <li>✅ Toast notifications - Success/error messages</li>
          <li>✅ React Query caching - 30 second stale time</li>
        </ul>
      </div>
    </div>
  );
}
