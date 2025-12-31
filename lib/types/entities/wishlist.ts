import type { Product, ProductVariant } from './product';

/**
 * Wishlist item entity
 */
export interface WishlistItem {
  id: number;
  productId: number;
  product: Product;
  variantId?: number;
  variant?: ProductVariant;
  createdAt: string;
}

/**
 * Wishlist entity
 */
export interface Wishlist {
  id: number;
  items: WishlistItem[];
  totalItems: number;
}

/**
 * Add to wishlist request payload
 */
export interface AddToWishlistRequest {
  productId: number;
  variantId?: number;
}

/**
 * Remove from wishlist request payload
 */
export interface RemoveFromWishlistRequest {
  wishlistItemId: number;
}

/**
 * Move to cart request payload
 */
export interface MoveToCartRequest {
  wishlistItemId: number;
  quantity: number;
}
