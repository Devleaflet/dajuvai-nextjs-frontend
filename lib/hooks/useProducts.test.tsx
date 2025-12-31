import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProducts, useProduct } from './useProducts';
import { ProductService } from '@/lib/services/product.service';
import type { Product } from '@/lib/types';

// Mock ProductService
vi.mock('@/lib/services/product.service', () => ({
  ProductService: {
    getAll: vi.fn(),
    getById: vi.fn(),
  },
}));

describe('useProducts Integration Tests', () => {
  let queryClient: QueryClient;

  const mockProducts: Product[] = [
    {
      id: 1,
      name: 'Test Product 1',
      description: 'Description 1',
      price: 100,
      discountedPrice: 90,
      category: 'Electronics',
      images: ['/image1.jpg'],
      stock: 10,
      vendorId: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Test Product 2',
      description: 'Description 2',
      price: 200,
      discountedPrice: 180,
      category: 'Clothing',
      images: ['/image2.jpg'],
      stock: 5,
      vendorId: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useProducts', () => {
    it('should fetch all products successfully', async () => {
      vi.mocked(ProductService.getAll).mockResolvedValue(mockProducts);

      const { result } = renderHook(() => useProducts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockProducts);
      expect(ProductService.getAll).toHaveBeenCalledTimes(1);
    });

    it('should fetch products with category filter', async () => {
      const filteredProducts = [mockProducts[0]];
      vi.mocked(ProductService.getAll).mockResolvedValue(filteredProducts);

      const { result } = renderHook(
        () => useProducts({ category: 'Electronics' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(filteredProducts);
      expect(ProductService.getAll).toHaveBeenCalledWith({ category: 'Electronics' });
    });

    it('should fetch products with price range filter', async () => {
      vi.mocked(ProductService.getAll).mockResolvedValue(mockProducts);

      const { result } = renderHook(
        () => useProducts({ minPrice: 50, maxPrice: 150 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(ProductService.getAll).toHaveBeenCalledWith({ minPrice: 50, maxPrice: 150 });
    });

    it('should fetch products with search query', async () => {
      vi.mocked(ProductService.getAll).mockResolvedValue([mockProducts[0]]);

      const { result } = renderHook(
        () => useProducts({ search: 'Test Product 1' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(ProductService.getAll).toHaveBeenCalledWith({ search: 'Test Product 1' });
    });

    it('should handle fetch error', async () => {
      vi.mocked(ProductService.getAll).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useProducts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should show loading state initially', () => {
      vi.mocked(ProductService.getAll).mockResolvedValue(mockProducts);

      const { result } = renderHook(() => useProducts(), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });

    it('should fetch products with multiple filters', async () => {
      vi.mocked(ProductService.getAll).mockResolvedValue(mockProducts);

      const filters = {
        category: 'Electronics',
        minPrice: 50,
        maxPrice: 200,
        search: 'Test',
      };

      const { result } = renderHook(() => useProducts(filters), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(ProductService.getAll).toHaveBeenCalledWith(filters);
    });
  });

  describe('useProduct', () => {
    it('should fetch single product by ID', async () => {
      const mockProduct = mockProducts[0];
      vi.mocked(ProductService.getById).mockResolvedValue(mockProduct);

      const { result } = renderHook(() => useProduct(1), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockProduct);
      expect(ProductService.getById).toHaveBeenCalledWith(1);
    });

    it('should not fetch when ID is undefined', () => {
      const { result } = renderHook(() => useProduct(undefined), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(ProductService.getById).not.toHaveBeenCalled();
    });

    it('should handle fetch error for single product', async () => {
      vi.mocked(ProductService.getById).mockRejectedValue(new Error('Product not found'));

      const { result } = renderHook(() => useProduct(999), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should fetch product with string ID', async () => {
      const mockProduct = mockProducts[0];
      vi.mocked(ProductService.getById).mockResolvedValue(mockProduct);

      const { result } = renderHook(() => useProduct('1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(ProductService.getById).toHaveBeenCalledWith(1);
    });
  });
});
