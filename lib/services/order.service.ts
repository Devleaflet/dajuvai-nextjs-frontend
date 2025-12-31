/**
 * Order service for managing order-related API calls
 * 
 * @example
 * ```typescript
 * import { OrderService } from '@/lib/services/order.service';
 * 
 * // Get all orders
 * const orders = await OrderService.getAll();
 * 
 * // Get single order
 * const order = await OrderService.getById(123);
 * 
 * // Create order
 * const newOrder = await OrderService.create(orderData);
 * 
 * // Track order
 * const status = await OrderService.track(123);
 * ```
 */

import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type {
  Order,
  OrderStatus,
  OrderTrackingInfo,
  CreateOrderInput,
} from '@/lib/types';

/**
 * Order service class
 */
export class OrderService {
  /**
   * Get all orders for current user
   * 
   * @returns Promise resolving to array of orders
   */
  static async getAll(): Promise<Order[]> {
    const response = await apiClient.get<Order[]>(ENDPOINTS.ORDERS.USER_ORDERS);
    return response.data;
  }

  /**
   * Get a single order by ID
   * 
   * @param id - Order ID
   * @returns Promise resolving to order
   */
  static async getById(id: number | string): Promise<Order> {
    const response = await apiClient.get<Order>(ENDPOINTS.ORDERS.BY_ID(id));
    return response.data;
  }

  /**
   * Create a new order
   * 
   * @param orderData - Order creation data
   * @returns Promise resolving to created order
   */
  static async create(orderData: CreateOrderInput): Promise<Order> {
    const response = await apiClient.post<Order>(
      ENDPOINTS.ORDERS.CREATE,
      orderData
    );
    return response.data;
  }

  /**
   * Track an order
   * 
   * @param id - Order ID
   * @returns Promise resolving to order tracking information
   */
  static async track(id: number | string): Promise<OrderTrackingInfo> {
    const response = await apiClient.get<OrderTrackingInfo>(
      ENDPOINTS.ORDERS.TRACK(id)
    );
    return response.data;
  }

  /**
   * Cancel an order
   * 
   * @param id - Order ID
   * @returns Promise resolving when cancellation is complete
   */
  static async cancel(id: number | string): Promise<void> {
    await apiClient.post(ENDPOINTS.ORDERS.CANCEL(id));
  }
}
