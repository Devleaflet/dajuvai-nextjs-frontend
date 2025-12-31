import { useQuery } from '@tanstack/react-query';
import { ProductService } from '@/lib/services/product.service';
import { queryKeys } from '@/lib/api/queryKeys';
import type { Product, ProductFilters } from '@/lib/types';

/**
 * Custom hook for fetching multiple products with optional filters
 * @param filters - Optional filters for product search
 * @returns React Query result with products data
 */
export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: () => ProductService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Custom hook for fetching a single product by ID
 * @param id - Product ID
 * @returns React Query result with product data
 */
export function useProduct(id: number | string | undefined) {
  return useQuery({
    queryKey: queryKeys.products.detail(Number(id)),
    queryFn: () => ProductService.getById(Number(id)),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!id, // Only fetch when id is provided
  });
}
