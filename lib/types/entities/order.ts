/**
 * Order Entity Types
 * Type definitions for orders, order items, and order management
 */

import { ID, Timestamp } from '../common';
import { Product, ProductVariant } from './product';
import { Address, User } from './user';

export type OrderStatus =
  | 'CONFIRMED'
  | 'PENDING'
  | 'DELAYED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export type OrderItemStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED';

export type PaymentStatus = 'PAID' | 'UNPAID';

export type PaymentMethod =
  | 'ONLINE_PAYMENT'
  | 'CASH_ON_DELIVERY'
  | 'KHALTI'
  | 'ESEWA'
  | 'NPX';

export interface OrderItem {
  id: ID;
  productId: ID;
  product?: Product;
  variantId?: ID;
  variant?: ProductVariant;
  quantity: number;
  price: number;
  orderId: ID;
  vendorId: ID;
  vendor?: {
    id: ID;
    name: string;
  };
  status?: OrderItemStatus;
  createdAt: Timestamp;
}

export interface Order {
  id: ID;
  orderedById: ID;
  orderedBy?: User;
  totalPrice: number;
  shippingFee: number;
  serviceCharge: number;
  isBuyNow?: boolean;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  shippingAddress?: Address;
  appliedPromoCode?: string;
  phoneNumber?: string;
  instrumentName?: string;
  mTransactionId?: string;
  orderItems: OrderItem[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface OrderSummary {
  id: ID;
  totalPrice: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  itemCount: number;
  createdAt: Timestamp;
}

export interface CreateOrderInput {
  items: Array<{
    productId: ID;
    variantId?: ID;
    quantity: number;
    price: number;
  }>;
  shippingAddressId?: ID;
  paymentMethod: PaymentMethod;
  appliedPromoCode?: string;
  phoneNumber?: string;
  isBuyNow?: boolean;
}

export interface UpdateOrderStatusInput {
  orderId: ID;
  status: OrderStatus;
}

export interface OrderFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface OrderTrackingInfo {
  orderId: ID;
  status: OrderStatus;
  statusHistory: Array<{
    status: OrderStatus;
    timestamp: Timestamp;
    note?: string;
  }>;
  estimatedDelivery?: Timestamp;
  trackingNumber?: string;
}
