/**
 * Cart Entity Types
 * Type definitions for shopping cart and cart items
 */

import { ID, ImageUrl } from '../common';
import { Product, ProductVariant } from './product';

export interface CartItem {
  id: ID;
  cartId: ID;
  productId: ID;
  product?: Product;
  variantId?: ID | null;
  variant?: ProductVariant;
  quantity: number;
  price: number;
  name: string;
  description: string;
  image?: ImageUrl;
}

export interface Cart {
  id: ID;
  userId: ID;
  items: CartItem[];
  total: number;
  totalItems?: number;
}

export interface AddToCartInput {
  productId: ID;
  variantId?: ID;
  quantity: number;
}

export interface UpdateCartItemInput {
  itemId: ID;
  quantity: number;
}

export interface CartSummary {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
}
