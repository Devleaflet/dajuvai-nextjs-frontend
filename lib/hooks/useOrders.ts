import { useQuery } from '@tanstack/react-query';
import { OrderService } from '@/lib/services/order.service';
import { queryKeys } from '@/lib/api/queryKeys';
import type { Order } from '@/lib/types';

/**
 * Custom hook for fetching all orders for the current user
 * @returns React Query result with orders data
 */
export function useOrders() {
  return useQuery({
    queryKey: queryKeys.orders.all,
    queryFn: () => OrderService.getAll(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Custom hook for fetching a single order by ID
 * @param id - Order ID
 * @returns React Query result with order data
 */
export function useOrder(id: number | string | undefined) {
  return useQuery({
    queryKey: queryKeys.orders.detail(Number(id)),
    queryFn: () => OrderService.getById(Number(id)),
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: !!id, // Only fetch when id is provided
  });
}
