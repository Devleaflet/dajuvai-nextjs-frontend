export interface Order {
    id: number;
    orderId: string;
    orderedBy: string;
    product: string;
    createdAt: string;
    price: number;
    paymentStatus: string;
    status: string; // e.g., "Delivered", "Pending", "Canceled"
  }

export interface OrderDetail {
  id: number;
  orderedBy: { id: number; username?: string; name?: string; email?: string };
  shippingAddress: { province: string; district: string; city: string; localAddress?: string; streetAddress?: string };
  orderItems: Array<{
    id: number;
    productId: number;
    quantity: number;
    price: string | number;
    product: { name: string };
    vendor: { id: number; businessName?: string; name?: string };
  }>;
  totalPrice?: string | number;
  shippingFee?: string | number;
  paymentMethod?: string;
  status?: string;
  createdAt?: string;
}