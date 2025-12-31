/**
 * Centralized API endpoint constants
 * 
 * Provides type-safe endpoint construction and prevents invalid URLs
 * 
 * @example
 * ```typescript
 * import { ENDPOINTS } from '@/lib/api/endpoints';
 * 
 * // Static endpoints
 * const response = await apiClient.get(ENDPOINTS.AUTH.LOGIN);
 * 
 * // Dynamic endpoints
 * const product = await apiClient.get(ENDPOINTS.PRODUCTS.BY_ID(123));
 * const vendorProducts = await apiClient.get(ENDPOINTS.VENDORS.PRODUCTS(456));
 * ```
 */

/**
 * API endpoint constants organized by resource
 */
export const ENDPOINTS = {
  /**
   * Authentication endpoints
   */
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    REGISTER: '/auth/register',
    GOOGLE: '/auth/google',
    FACEBOOK: '/auth/facebook',
  },

  /**
   * Product endpoints
   */
  PRODUCTS: {
    BASE: '/products',
    BY_ID: (id: number | string) => `/products/${id}` as const,
    SEARCH: '/products/search',
    FEATURED: '/products/featured',
    BY_CATEGORY: (categoryId: number | string) => `/products/category/${categoryId}` as const,
    BY_SUBCATEGORY: (subcategoryId: number | string) => `/products/subcategory/${subcategoryId}` as const,
    BY_VENDOR: (vendorId: number | string) => `/products/vendor/${vendorId}` as const,
  },

  /**
   * Cart endpoints
   */
  CART: {
    BASE: '/cart',
    ITEMS: '/cart/items',
    ITEM: (itemId: number | string) => `/cart/items/${itemId}` as const,
    ADD: '/cart/add',
    UPDATE: (itemId: number | string) => `/cart/items/${itemId}` as const,
    REMOVE: (itemId: number | string) => `/cart/items/${itemId}` as const,
    CLEAR: '/cart/clear',
  },

  /**
   * Wishlist endpoints
   */
  WISHLIST: {
    BASE: '/wishlist',
    ITEMS: '/wishlist/items',
    ADD: '/wishlist/add',
    REMOVE: (itemId: number | string) => `/wishlist/items/${itemId}` as const,
    CHECK: (productId: number | string) => `/wishlist/check/${productId}` as const,
    MOVE_TO_CART: '/wishlist/move-to-cart',
  },

  /**
   * Order endpoints
   */
  ORDERS: {
    BASE: '/orders',
    BY_ID: (id: number | string) => `/orders/${id}` as const,
    CREATE: '/orders/create',
    TRACK: (id: number | string) => `/orders/${id}/track` as const,
    CANCEL: (id: number | string) => `/orders/${id}/cancel` as const,
    USER_ORDERS: '/orders/user',
  },

  /**
   * Category endpoints
   */
  CATEGORIES: {
    BASE: '/categories',
    BY_ID: (id: number | string) => `/categories/${id}` as const,
    WITH_PRODUCTS: '/categories/with-products',
  },

  /**
   * Subcategory endpoints
   */
  SUBCATEGORIES: {
    BASE: '/subcategories',
    BY_ID: (id: number | string) => `/subcategories/${id}` as const,
    BY_CATEGORY: (categoryId: number | string) => `/subcategories/category/${categoryId}` as const,
  },

  /**
   * Vendor endpoints
   */
  VENDORS: {
    BASE: '/vendors',
    BY_ID: (id: number | string) => `/vendors/${id}` as const,
    PRODUCTS: (vendorId: number | string) => `/vendors/${vendorId}/products` as const,
    REGISTER: '/vendors/register',
    LOGIN: '/vendors/login',
    PROFILE: '/vendors/profile',
    DASHBOARD: '/vendors/dashboard',
    ORDERS: '/vendors/orders',
  },

  /**
   * Review endpoints
   */
  REVIEWS: {
    BASE: '/reviews',
    BY_PRODUCT: (productId: number | string) => `/reviews/product/${productId}` as const,
    CREATE: '/reviews',
    UPDATE: (id: number | string) => `/reviews/${id}` as const,
    DELETE: (id: number | string) => `/reviews/${id}` as const,
  },

  /**
   * User endpoints
   */
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
    UPDATE: '/users/profile',
    ADDRESSES: '/users/addresses',
    ADD_ADDRESS: '/users/addresses',
    UPDATE_ADDRESS: (id: number | string) => `/users/addresses/${id}` as const,
    DELETE_ADDRESS: (id: number | string) => `/users/addresses/${id}` as const,
  },

  /**
   * Admin endpoints
   */
  ADMIN: {
    DASHBOARD: {
      STATS: '/admin/dashboard/stats',
      RECENT_ORDERS: '/admin/dashboard/recent-orders',
      TOP_PRODUCTS: '/admin/dashboard/top-products',
    },
    USERS: {
      BASE: '/admin/users',
      BY_ID: (id: number | string) => `/admin/users/${id}` as const,
      BAN: (id: number | string) => `/admin/users/${id}/ban` as const,
      UNBAN: (id: number | string) => `/admin/users/${id}/unban` as const,
    },
    VENDORS: {
      BASE: '/admin/vendors',
      BY_ID: (id: number | string) => `/admin/vendors/${id}` as const,
      APPROVE: (id: number | string) => `/admin/vendors/${id}/approve` as const,
      REJECT: (id: number | string) => `/admin/vendors/${id}/reject` as const,
      PENDING: '/admin/vendors/pending',
    },
    ORDERS: {
      BASE: '/admin/orders',
      BY_ID: (id: number | string) => `/admin/orders/${id}` as const,
      UPDATE_STATUS: (id: number | string) => `/admin/orders/${id}/status` as const,
    },
    PRODUCTS: {
      BASE: '/admin/products',
      BY_ID: (id: number | string) => `/admin/products/${id}` as const,
      APPROVE: (id: number | string) => `/admin/products/${id}/approve` as const,
      REJECT: (id: number | string) => `/admin/products/${id}/reject` as const,
    },
    CATEGORIES: {
      BASE: '/admin/categories',
      BY_ID: (id: number | string) => `/admin/categories/${id}` as const,
      CREATE: '/admin/categories',
      UPDATE: (id: number | string) => `/admin/categories/${id}` as const,
      DELETE: (id: number | string) => `/admin/categories/${id}` as const,
    },
    BANNERS: {
      BASE: '/admin/banners',
      BY_ID: (id: number | string) => `/admin/banners/${id}` as const,
      CREATE: '/admin/banners',
      UPDATE: (id: number | string) => `/admin/banners/${id}` as const,
      DELETE: (id: number | string) => `/admin/banners/${id}` as const,
    },
    DEALS: {
      BASE: '/admin/deals',
      BY_ID: (id: number | string) => `/admin/deals/${id}` as const,
      CREATE: '/admin/deals',
      UPDATE: (id: number | string) => `/admin/deals/${id}` as const,
      DELETE: (id: number | string) => `/admin/deals/${id}` as const,
    },
    PROMOS: {
      BASE: '/admin/promos',
      BY_ID: (id: number | string) => `/admin/promos/${id}` as const,
      CREATE: '/admin/promos',
      UPDATE: (id: number | string) => `/admin/promos/${id}` as const,
      DELETE: (id: number | string) => `/admin/promos/${id}` as const,
    },
  },

  /**
   * Payment endpoints
   */
  PAYMENT: {
    ESEWA: {
      INITIATE: '/payment/esewa/initiate',
      VERIFY: '/payment/esewa/verify',
    },
    KHALTI: {
      INITIATE: '/payment/khalti/initiate',
      VERIFY: '/payment/khalti/verify',
    },
  },

  /**
   * Homepage endpoints
   */
  HOMEPAGE: {
    SECTIONS: '/homepage/sections',
    BANNERS: '/homepage/banners',
    DEALS: '/homepage/deals',
  },

  /**
   * District/Location endpoints
   */
  DISTRICTS: {
    BASE: '/districts',
    BY_ID: (id: number | string) => `/districts/${id}` as const,
  },

  /**
   * Contact endpoints
   */
  CONTACT: {
    SUBMIT: '/contact/submit',
  },

  /**
   * Notification endpoints
   */
  NOTIFICATIONS: {
    BASE: '/notifications',
    UNREAD: '/notifications/unread',
    MARK_READ: (id: number | string) => `/notifications/${id}/read` as const,
    MARK_ALL_READ: '/notifications/mark-all-read',
  },
} as const;

/**
 * Type for all endpoint paths
 */
export type EndpointPath = string;

/**
 * Helper function to build query string from params
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, String(v)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}
