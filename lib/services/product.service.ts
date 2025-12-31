/**
 * Product service for managing product-related API calls
 * 
 * @example
 * ```typescript
 * import { ProductService } from '@/lib/services/product.service';
 * 
 * // Get all products
 * const products = await ProductService.getAll();
 * 
 * // Get products with filters
 * const filtered = await ProductService.getAll({ category: 'electronics', minPrice: 1000 });
 * 
 * // Get single product
 * const product = await ProductService.getById(123);
 * ```
 */

import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type { Product, ProductFilters } from '@/lib/types';

/**
 * Product service class
 */
export class ProductService {
  /**
   * Get all products with optional filters
   * 
   * @param filters - Optional filters for products
   * @returns Promise resolving to array of products
   */
  static async getAll(filters?: ProductFilters): Promise<Product[]> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString
      ? `${ENDPOINTS.PRODUCTS.BASE}?${queryString}`
      : ENDPOINTS.PRODUCTS.BASE;

    const response = await apiClient.get<Product[]>(url);
    return response.data;
  }

  /**
   * Get a single product by ID
   * 
   * @param id - Product ID
   * @returns Promise resolving to product
   */
  static async getById(id: number | string): Promise<Product> {
    const response = await apiClient.get<Product>(
      ENDPOINTS.PRODUCTS.BY_ID(id)
    );
    return response.data;
  }

  /**
   * Get products by category
   * 
   * @param categoryId - Category ID
   * @returns Promise resolving to array of products
   */
  static async getByCategory(categoryId: number | string): Promise<Product[]> {
    const response = await apiClient.get<Product[]>(
      ENDPOINTS.PRODUCTS.BY_CATEGORY(categoryId)
    );
    return response.data;
  }

  /**
   * Get products by subcategory
   * 
   * @param subcategoryId - Subcategory ID
   * @returns Promise resolving to array of products
   */
  static async getBySubcategory(
    subcategoryId: number | string
  ): Promise<Product[]> {
    const response = await apiClient.get<Product[]>(
      ENDPOINTS.PRODUCTS.BY_SUBCATEGORY(subcategoryId)
    );
    return response.data;
  }

  /**
   * Get products by vendor
   * 
   * @param vendorId - Vendor ID
   * @returns Promise resolving to array of products
   */
  static async getByVendor(vendorId: number | string): Promise<Product[]> {
    const response = await apiClient.get<Product[]>(
      ENDPOINTS.PRODUCTS.BY_VENDOR(vendorId)
    );
    return response.data;
  }

  /**
   * Search products
   * 
   * @param query - Search query
   * @returns Promise resolving to array of products
   */
  static async search(query: string): Promise<Product[]> {
    const response = await apiClient.get<Product[]>(
      `${ENDPOINTS.PRODUCTS.SEARCH}?q=${encodeURIComponent(query)}`
    );
    return response.data;
  }

  /**
   * Get featured products
   * 
   * @returns Promise resolving to array of featured products
   */
  static async getFeatured(): Promise<Product[]> {
    const response = await apiClient.get<Product[]>(
      ENDPOINTS.PRODUCTS.FEATURED
    );
    return response.data;
  }

  /**
   * Create a new product (admin/vendor only)
   * 
   * @param product - Product data
   * @returns Promise resolving to created product
   */
  static async create(product: Partial<Product>): Promise<Product> {
    const response = await apiClient.post<Product>(
      ENDPOINTS.PRODUCTS.BASE,
      product
    );
    return response.data;
  }

  /**
   * Update a product (admin/vendor only)
   * 
   * @param id - Product ID
   * @param product - Updated product data
   * @returns Promise resolving to updated product
   */
  static async update(
    id: number | string,
    product: Partial<Product>
  ): Promise<Product> {
    const response = await apiClient.put<Product>(
      ENDPOINTS.PRODUCTS.BY_ID(id),
      product
    );
    return response.data;
  }

  /**
   * Delete a product (admin/vendor only)
   * 
   * @param id - Product ID
   * @returns Promise resolving when deletion is complete
   */
  static async delete(id: number | string): Promise<void> {
    await apiClient.delete(ENDPOINTS.PRODUCTS.BY_ID(id));
  }
}
