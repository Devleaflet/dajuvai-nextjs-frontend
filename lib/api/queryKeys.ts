/**
 * Query key factory for React Query
 * 
 * Provides consistent, type-safe cache keys for React Query
 * 
 * @example
 * ```typescript
 * import { queryKeys } from '@/lib/api/queryKeys';
 * 
 * // In a hook
 * const { data } = useQuery({
 *   queryKey: queryKeys.products.list({ category: 'electronics' }),
 *   queryFn: () => ProductService.getAll({ category: 'electronics' }),
 * });
 * 
 * // Invalidate specific query
 * queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(123) });
 * 
 * // Invalidate all product queries
 * queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
 * ```
 */

/**
 * Query key factory organized by resource
 * Each resource has:
 * - all: Base key for all queries of that resource
 * - list: Key for list queries with optional filters
 * - detail: Key for single item queries
 */
export const queryKeys = {
  /**
   * Product query keys
   */
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: number | string) =>
      [...queryKeys.products.details(), id] as const,
    byCategory: (categoryId: number | string) =>
      [...queryKeys.products.all, 'category', categoryId] as const,
    bySubcategory: (subcategoryId: number | string) =>
      [...queryKeys.products.all, 'subcategory', subcategoryId] as const,
    byVendor: (vendorId: number | string) =>
      [...queryKeys.products.all, 'vendor', vendorId] as const,
    search: (query: string) =>
      [...queryKeys.products.all, 'search', query] as const,
    featured: () => [...queryKeys.products.all, 'featured'] as const,
  },

  /**
   * Category query keys
   */
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.categories.lists(), filters] as const,
    details: () => [...queryKeys.categories.all, 'detail'] as const,
    detail: (id: number | string) =>
      [...queryKeys.categories.details(), id] as const,
    withProducts: () =>
      [...queryKeys.categories.all, 'with-products'] as const,
  },

  /**
   * Subcategory query keys
   */
  subcategories: {
    all: ['subcategories'] as const,
    lists: () => [...queryKeys.subcategories.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.subcategories.lists(), filters] as const,
    details: () => [...queryKeys.subcategories.all, 'detail'] as const,
    detail: (id: number | string) =>
      [...queryKeys.subcategories.details(), id] as const,
    byCategory: (categoryId: number | string) =>
      [...queryKeys.subcategories.all, 'category', categoryId] as const,
  },

  /**
   * Cart query keys
   */
  cart: {
    all: ['cart'] as const,
    items: () => [...queryKeys.cart.all, 'items'] as const,
  },

  /**
   * Wishlist query keys
   */
  wishlist: {
    all: ['wishlist'] as const,
    items: () => [...queryKeys.wishlist.all, 'items'] as const,
    check: (productId: number | string) =>
      [...queryKeys.wishlist.all, 'check', productId] as const,
  },

  /**
   * Order query keys
   */
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.orders.lists(), filters] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: number | string) =>
      [...queryKeys.orders.details(), id] as const,
    tracking: (id: number | string) =>
      [...queryKeys.orders.all, 'tracking', id] as const,
    userOrders: () => [...queryKeys.orders.all, 'user'] as const,
  },

  /**
   * Vendor query keys
   */
  vendors: {
    all: ['vendors'] as const,
    lists: () => [...queryKeys.vendors.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.vendors.lists(), filters] as const,
    details: () => [...queryKeys.vendors.all, 'detail'] as const,
    detail: (id: number | string) =>
      [...queryKeys.vendors.details(), id] as const,
    products: (vendorId: number | string) =>
      [...queryKeys.vendors.all, vendorId, 'products'] as const,
    dashboard: () => [...queryKeys.vendors.all, 'dashboard'] as const,
    orders: () => [...queryKeys.vendors.all, 'orders'] as const,
  },

  /**
   * Review query keys
   */
  reviews: {
    all: ['reviews'] as const,
    lists: () => [...queryKeys.reviews.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.reviews.lists(), filters] as const,
    byProduct: (productId: number | string) =>
      [...queryKeys.reviews.all, 'product', productId] as const,
  },

  /**
   * User query keys
   */
  users: {
    all: ['users'] as const,
    profile: () => [...queryKeys.users.all, 'profile'] as const,
    addresses: () => [...queryKeys.users.all, 'addresses'] as const,
  },

  /**
   * Admin query keys
   */
  admin: {
    all: ['admin'] as const,
    dashboard: {
      stats: () => [...queryKeys.admin.all, 'dashboard', 'stats'] as const,
      recentOrders: () =>
        [...queryKeys.admin.all, 'dashboard', 'recent-orders'] as const,
      topProducts: () =>
        [...queryKeys.admin.all, 'dashboard', 'top-products'] as const,
    },
    users: {
      all: () => [...queryKeys.admin.all, 'users'] as const,
      list: (filters?: Record<string, any>) =>
        [...queryKeys.admin.users.all(), 'list', filters] as const,
      detail: (id: number | string) =>
        [...queryKeys.admin.users.all(), 'detail', id] as const,
    },
    vendors: {
      all: () => [...queryKeys.admin.all, 'vendors'] as const,
      list: (filters?: Record<string, any>) =>
        [...queryKeys.admin.vendors.all(), 'list', filters] as const,
      detail: (id: number | string) =>
        [...queryKeys.admin.vendors.all(), 'detail', id] as const,
      pending: () =>
        [...queryKeys.admin.vendors.all(), 'pending'] as const,
    },
    orders: {
      all: () => [...queryKeys.admin.all, 'orders'] as const,
      list: (filters?: Record<string, any>) =>
        [...queryKeys.admin.orders.all(), 'list', filters] as const,
      detail: (id: number | string) =>
        [...queryKeys.admin.orders.all(), 'detail', id] as const,
    },
    products: {
      all: () => [...queryKeys.admin.all, 'products'] as const,
      list: (filters?: Record<string, any>) =>
        [...queryKeys.admin.products.all(), 'list', filters] as const,
      detail: (id: number | string) =>
        [...queryKeys.admin.products.all(), 'detail', id] as const,
    },
  },

  /**
   * Homepage query keys
   */
  homepage: {
    all: ['homepage'] as const,
    sections: () => [...queryKeys.homepage.all, 'sections'] as const,
    banners: () => [...queryKeys.homepage.all, 'banners'] as const,
    deals: () => [...queryKeys.homepage.all, 'deals'] as const,
  },

  /**
   * District query keys
   */
  districts: {
    all: ['districts'] as const,
    lists: () => [...queryKeys.districts.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.districts.lists(), filters] as const,
    details: () => [...queryKeys.districts.all, 'detail'] as const,
    detail: (id: number | string) =>
      [...queryKeys.districts.details(), id] as const,
  },

  /**
   * Notification query keys
   */
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.notifications.lists(), filters] as const,
    unread: () => [...queryKeys.notifications.all, 'unread'] as const,
  },
} as const;

/**
 * Type for query keys
 */
export type QueryKey = readonly unknown[];
