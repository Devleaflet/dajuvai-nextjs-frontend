/**
 * Central Type Exports
 * Single entry point for all type definitions
 */

// API Types
export * from './api.types';

// Common Types
export * from './common';

// Entity Types (New centralized types)
export * from './entities/product';
export * from './entities/cart';
export * from './entities/user';
export * from './entities/order';
export * from './entities/wishlist';

// Legacy types (for backward compatibility - to be migrated)
// Note: Product and ProductVariant are exported from entities/product
// Exporting other types from legacy product file
export type {
  ListProduct,
  ProductFormData,
  NewProductFormData,
  ApiProduct,
  Image,
  Attribute
} from './product';
export * from './vendor';
export * from './review';
