import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type {
  Wishlist,
  WishlistItem,
  AddToWishlistRequest,
  RemoveFromWishlistRequest,
  MoveToCartRequest,
} from '@/lib/types';

/**
 * Wishlist Service
 * Handles all wishlist-related API operations
 */
export class WishlistService {
  /**
   * Get all wishlist items for the current user
   * @returns Promise with wishlist items
   */
  static async getItems(): Promise<WishlistItem[]> {
    const response = await apiClient.get<{ data: { items: WishlistItem[] } }>(
      ENDPOINTS.WISHLIST.BASE
    );
    return response.data.data.items;
  }

  /**
   * Add a product to the wishlist
   * @param productId - Product ID to add
   * @param variantId - Optional variant ID
   * @returns Promise with the added wishlist item
   */
  static async add(
    productId: number,
    variantId?: number
  ): Promise<WishlistItem> {
    const payload: AddToWishlistRequest = variantId
      ? { productId, variantId }
      : { productId };

    const response = await apiClient.post<{ data: { items: WishlistItem[] } }>(
      ENDPOINTS.WISHLIST.BASE,
      payload
    );

    // Find and return the newly added item
    const items = response.data.data.items;
    const addedItem = items.find(
      (item) =>
        item.productId === productId &&
        (variantId ? item.variantId === variantId : !item.variantId)
    );

    if (!addedItem) {
      throw new Error('Failed to add item to wishlist');
    }

    return addedItem;
  }

  /**
   * Remove an item from the wishlist
   * @param wishlistItemId - Wishlist item ID to remove
   * @returns Promise with updated wishlist items
   */
  static async remove(wishlistItemId: number): Promise<WishlistItem[]> {
    const payload: RemoveFromWishlistRequest = { wishlistItemId };

    const response = await apiClient.delete<{ data: { items: WishlistItem[] } }>(
      ENDPOINTS.WISHLIST.BASE,
      { data: payload }
    );

    return response.data.data.items;
  }

  /**
   * Move a wishlist item to cart
   * @param wishlistItemId - Wishlist item ID to move
   * @param quantity - Quantity to add to cart
   * @returns Promise with updated data
   */
  static async moveToCart(
    wishlistItemId: number,
    quantity: number
  ): Promise<{ wishlist: WishlistItem[]; cart: any }> {
    const payload: MoveToCartRequest = { wishlistItemId, quantity };

    const response = await apiClient.post<{ data: any }>(
      ENDPOINTS.WISHLIST.MOVE_TO_CART,
      payload
    );

    return response.data.data;
  }

  /**
   * Clear all items from the wishlist
   * @returns Promise with empty array
   */
  static async clear(): Promise<void> {
    await apiClient.delete(ENDPOINTS.WISHLIST.BASE);
  }
}
