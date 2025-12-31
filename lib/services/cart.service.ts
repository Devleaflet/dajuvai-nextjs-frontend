/**
 * Cart service for managing cart-related API calls
 * 
 * @example
 * ```typescript
 * import { CartService } from '@/lib/services/cart.service';
 * 
 * // Get cart items
 * const items = await CartService.getItems();
 * 
 * // Add item to cart
 * const newItem = await CartService.add(123, 2);
 * 
 * // Update quantity
 * await CartService.updateQuantity(456, 5);
 * ```
 */

import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type { Cart, CartItem, AddToCartInput } from '@/lib/types';

/**
 * Cart service class
 */
export class CartService {
  /**
   * Get all cart items
   * 
   * @returns Promise resolving to array of cart items
   */
  static async getItems(): Promise<CartItem[]> {
    const response = await apiClient.get<CartItem[]>(ENDPOINTS.CART.ITEMS);
    return response.data;
  }

  /**
   * Get full cart with totals
   * 
   * @returns Promise resolving to cart
   */
  static async getCart(): Promise<Cart> {
    const response = await apiClient.get<Cart>(ENDPOINTS.CART.BASE);
    return response.data;
  }

  /**
   * Add item to cart
   * 
   * @param productId - Product ID
   * @param quantity - Quantity to add
   * @param variantId - Optional variant ID
   * @returns Promise resolving to added cart item
   */
  static async add(
    productId: number,
    quantity: number,
    variantId?: number
  ): Promise<CartItem> {
    const response = await apiClient.post<CartItem>(ENDPOINTS.CART.ADD, {
      productId,
      quantity,
      variantId,
    });
    return response.data;
  }

  /**
   * Update cart item quantity
   * 
   * @param itemId - Cart item ID
   * @param quantity - New quantity
   * @returns Promise resolving to updated cart item
   */
  static async updateQuantity(
    itemId: number,
    quantity: number
  ): Promise<CartItem> {
    const response = await apiClient.put<CartItem>(
      ENDPOINTS.CART.UPDATE(itemId),
      { quantity }
    );
    return response.data;
  }

  /**
   * Remove item from cart
   * 
   * @param itemId - Cart item ID
   * @returns Promise resolving when removal is complete
   */
  static async remove(itemId: number): Promise<void> {
    await apiClient.delete(ENDPOINTS.CART.REMOVE(itemId));
  }

  /**
   * Clear all items from cart
   * 
   * @returns Promise resolving when cart is cleared
   */
  static async clear(): Promise<void> {
    await apiClient.delete(ENDPOINTS.CART.CLEAR);
  }
}
