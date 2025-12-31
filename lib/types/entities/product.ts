/**
 * Product Entity Types
 * Type definitions for products, variants, and related entities
 */

import { ID, Timestamp, ImageUrl } from '../common';

export type DiscountType = 'PERCENTAGE' | 'FIXED';

export type InventoryStatus = 'AVAILABLE' | 'OUT_OF_STOCK' | 'DISCONTINUED';

export interface ProductVariant {
  id: ID;
  sku: string;
  basePrice: number;
  finalPrice: number;
  discount: number;
  discountType: DiscountType;
  attributes: Record<string, string>;
  variantImages: ImageUrl[];
  stock: number;
  status?: InventoryStatus;
  productId: ID;
  created_at: Timestamp;
  updated_at: Timestamp;
  version: number;
}

export interface Product {
  id: ID;
  name: string;
  miniDescription?: string;
  longDescription?: string;
  basePrice?: number;
  finalPrice?: number;
  discount: number;
  discountType: DiscountType;
  status?: InventoryStatus;
  stock?: number;
  productImages?: ImageUrl[];
  hasVariants: boolean;
  variants?: ProductVariant[];
  subcategoryId?: ID;
  subcategory?: {
    id: ID;
    name: string;
  };
  vendorId: ID;
  vendor?: {
    id: ID;
    name: string;
    storeName?: string;
  };
  brandId?: ID;
  brand?: {
    id: ID;
    name: string;
  };
  dealId?: ID;
  deal?: {
    id: ID;
    name: string;
  };
  bannerId?: ID;
  reviews?: ProductReview[];
  averageRating?: number;
  reviewCount?: number;
  created_at: Timestamp;
  updated_at: Timestamp;
  version: number;
}

export interface ProductReview {
  id: ID;
  rating: number;
  comment?: string;
  userId: ID;
  userName?: string;
  productId: ID;
  created_at: Timestamp;
}

export interface ProductFilters {
  search?: string;
  categoryId?: ID;
  subcategoryId?: ID;
  vendorId?: ID;
  brandId?: ID;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  hasDiscount?: boolean;
  sortBy?: 'price' | 'name' | 'created_at' | 'rating';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProductCreateInput {
  name: string;
  miniDescription?: string;
  longDescription?: string;
  basePrice?: number;
  discount?: number;
  discountType?: DiscountType;
  stock?: number;
  productImages?: string[];
  hasVariants: boolean;
  subcategoryId?: ID;
  brandId?: ID;
  dealId?: ID;
  bannerId?: ID;
}

export interface ProductUpdateInput extends Partial<ProductCreateInput> {
  id: ID;
}
