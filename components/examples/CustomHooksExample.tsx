// /**
//  * Comprehensive examples of using custom React hooks
//  *
//  * This file demonstrates how to use all the custom hooks created for
//  * data fetching with React Query. These hooks simplify component logic
//  * and provide consistent caching, error handling, and loading states.
//  *
//  * Custom hooks available:
//  * - useProducts, useProduct - Product data fetching
//  * - useOrders, useOrder - Order data fetching
//  * - useWishlist, useAddToWishlist, useRemoveFromWishlist - Wishlist operations
//  * - useCart, useAddToCart, useRemoveFromCart - Cart operations (from previous tasks)
//  */

// 'use client';

// import React from 'react';
// import { useProducts, useProduct } from '@/lib/hooks/useProducts';
// import { useOrders, useOrder } from '@/lib/hooks/useOrders';
// import {
//   useWishlist,
//   useAddToWishlist,
//   useRemoveFromWishlist,
//   useMoveToCart,
// } from '@/lib/hooks/useWishlist';
// import type { ProductFilters } from '@/lib/types';
// import { toast } from 'react-hot-toast';

// /**
//  * Example 1: Fetching products with filters
//  */
// export function ProductsWithFiltersExample() {
//   const [filters, setFilters] = React.useState<ProductFilters>({
//     category: undefined,
//     minPrice: undefined,
//     maxPrice: undefined,
//     sortBy: 'createdAt',
//     sortOrder: 'desc',
//   });

//   const { data: products, isLoading, error, refetch } = useProducts(filters);

//   const handleFilterChange = (newFilters: Partial<ProductFilters>) => {
//     setFilters((prev) => ({ ...prev, ...newFilters }));
//   };

//   if (isLoading) {
//     return <div>Loading products...</div>;
//   }

//   if (error) {
//     return (
//       <div>
//         <p>Error loading products</p>
//         <button onClick={() => refetch()}>Retry</button>
//       </div>
//     );
//   }

//   return (
//     <div>
//       <div className="filters">
//         <select
//           onChange={(e) =>
//             handleFilterChange({ category: Number(e.target.value) || undefined })
//           }
//         >
//           <option value="">All Categories</option>
//           <option value="1">Electronics</option>
//           <option value="2">Clothing</option>
//         </select>

//         <select
//           onChange={(e) =>
//             handleFilterChange({ sortBy: e.target.value as any })
//           }
//         >
//           <option value="createdAt">Newest</option>
//           <option value="price">Price</option>
//           <option value="name">Name</option>
//         </select>
//       </div>

//       <div className="products-grid">
//         {products?.map((product) => (
//           <div key={product.id} className="product-card">
//             <h3>{product.name}</h3>
//             <p>Rs {product.price}</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// /**
//  * Example 2: Single product detail page
//  */
// export function ProductDetailExample({ productId }: { productId: number }) {
//   const { data: product, isLoading, error } = useProduct(productId);

//   if (isLoading) {
//     return <div>Loading product details...</div>;
//   }

//   if (error || !product) {
//     return <div>Product not found</div>;
//   }

//   return (
//     <div className="product-detail">
//       <h1>{product.name}</h1>
//       <p>{product.description}</p>
//       <div className="price">
//         <span className="current-price">Rs {product.price}</span>
//         {product.discount && (
//           <>
//             <span className="original-price">Rs {product.basePrice}</span>
//             <span className="discount">{product.discount}% OFF</span>
//           </>
//         )}
//       </div>
//       <p>Stock: {product.stock}</p>
//     </div>
//   );
// }

// /**
//  * Example 3: User orders list
//  */
// export function UserOrdersExample() {
//   const { data: orders, isLoading, error } = useOrders();

//   if (isLoading) {
//     return <div>Loading your orders...</div>;
//   }

//   if (error) {
//     return <div>Error loading orders</div>;
//   }

//   if (!orders || orders.length === 0) {
//     return <div>You haven't placed any orders yet</div>;
//   }

//   return (
//     <div className="orders-list">
//       <h2>My Orders</h2>
//       {orders.map((order) => (
//         <div key={order.id} className="order-card">
//           <div className="order-header">
//             <span>Order #{order.orderNumber}</span>
//             <span className={`status status-${order.status.toLowerCase()}`}>
//               {order.status}
//             </span>
//           </div>
//           <div className="order-details">
//             <p>Total: Rs {order.totalAmount}</p>
//             <p>Payment: {order.paymentMethod}</p>
//             <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }

// /**
//  * Example 4: Single order tracking
//  */
// export function OrderTrackingExample({ orderId }: { orderId: number }) {
//   const { data: order, isLoading, error } = useOrder(orderId);

//   if (isLoading) {
//     return <div>Loading order details...</div>;
//   }

//   if (error || !order) {
//     return <div>Order not found</div>;
//   }

//   return (
//     <div className="order-tracking">
//       <h2>Order #{order.orderNumber}</h2>
//       <div className="tracking-status">
//         <div className={`step ${order.status === 'PENDING' ? 'active' : 'completed'}`}>
//           Pending
//         </div>
//         <div className={`step ${order.status === 'CONFIRMED' ? 'active' : order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'DELIVERED' ? 'completed' : ''}`}>
//           Confirmed
//         </div>
//         <div className={`step ${order.status === 'PROCESSING' ? 'active' : order.status === 'SHIPPED' || order.status === 'DELIVERED' ? 'completed' : ''}`}>
//           Processing
//         </div>
//         <div className={`step ${order.status === 'SHIPPED' ? 'active' : order.status === 'DELIVERED' ? 'completed' : ''}`}>
//           Shipped
//         </div>
//         <div className={`step ${order.status === 'DELIVERED' ? 'active' : ''}`}>
//           Delivered
//         </div>
//       </div>
//     </div>
//   );
// }

// /**
//  * Example 5: Wishlist with add/remove functionality
//  */
// export function WishlistExample() {
//   const { data: wishlistItems, isLoading } = useWishlist();
//   const addToWishlist = useAddToWishlist();
//   const removeFromWishlist = useRemoveFromWishlist();
//   const moveToCart = useMoveToCart();

//   const handleAddToWishlist = (productId: number, variantId?: number) => {
//     addToWishlist.mutate(
//       { productId, variantId },
//       {
//         onSuccess: () => {
//           toast.success('Added to wishlist!');
//         },
//         onError: () => {
//           toast.error('Failed to add to wishlist');
//         },
//       }
//     );
//   };

//   const handleRemoveFromWishlist = (itemId: number) => {
//     removeFromWishlist.mutate(itemId, {
//       onSuccess: () => {
//         toast.success('Removed from wishlist');
//       },
//       onError: () => {
//         toast.error('Failed to remove from wishlist');
//       },
//     });
//   };

//   const handleMoveToCart = (itemId: number, quantity: number) => {
//     moveToCart.mutate(
//       { wishlistItemId: itemId, quantity },
//       {
//         onSuccess: () => {
//           toast.success('Moved to cart!');
//         },
//         onError: () => {
//           toast.error('Failed to move to cart');
//         },
//       }
//     );
//   };

//   if (isLoading) {
//     return <div>Loading wishlist...</div>;
//   }

//   if (!wishlistItems || wishlistItems.length === 0) {
//     return (
//       <div className="empty-wishlist">
//         <p>Your wishlist is empty</p>
//         <button onClick={() => window.location.href = '/shop'}>
//           Start Shopping
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="wishlist">
//       <h2>My Wishlist ({wishlistItems.length} items)</h2>
//       <div className="wishlist-items">
//         {wishlistItems.map((item) => (
//           <div key={item.id} className="wishlist-item">
//             <div className="item-info">
//               <h3>{item.product.name}</h3>
//               {item.variant && <p>Variant: {item.variant.name}</p>}
//               <p className="price">
//                 Rs {item.variant?.basePrice || item.product.basePrice}
//               </p>
//             </div>
//             <div className="item-actions">
//               <button
//                 onClick={() => handleMoveToCart(item.id, 1)}
//                 disabled={moveToCart.isPending}
//               >
//                 {moveToCart.isPending ? 'Moving...' : 'Move to Cart'}
//               </button>
//               <button
//                 onClick={() => handleRemoveFromWishlist(item.id)}
//                 disabled={removeFromWishlist.isPending}
//                 className="remove-btn"
//               >
//                 {removeFromWishlist.isPending ? 'Removing...' : 'Remove'}
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// /**
//  * Example 6: Product card with wishlist toggle
//  */
// export function ProductCardWithWishlistExample({
//   productId,
//   productName,
//   price,
// }: {
//   productId: number;
//   productName: string;
//   price: number;
// }) {
//   const { data: wishlistItems } = useWishlist();
//   const addToWishlist = useAddToWishlist();
//   const removeFromWishlist = useRemoveFromWishlist();

//   // Check if product is in wishlist
//   const wishlistItem = wishlistItems?.find(
//     (item) => item.productId === productId
//   );
//   const isInWishlist = !!wishlistItem;

//   const handleToggleWishlist = () => {
//     if (isInWishlist && wishlistItem) {
//       removeFromWishlist.mutate(wishlistItem.id);
//     } else {
//       addToWishlist.mutate({ productId });
//     }
//   };

//   return (
//     <div className="product-card">
//       <h3>{productName}</h3>
//       <p>Rs {price}</p>
//       <button
//         onClick={handleToggleWishlist}
//         className={`wishlist-btn ${isInWishlist ? 'active' : ''}`}
//         disabled={addToWishlist.isPending || removeFromWishlist.isPending}
//       >
//         {isInWishlist ? '❤️ In Wishlist' : '🤍 Add to Wishlist'}
//       </button>
//     </div>
//   );
// }

// /**
//  * Example 7: Combining multiple hooks
//  */
// export function DashboardExample() {
//   const { data: orders } = useOrders();
//   const { data: wishlistItems } = useWishlist();

//   const totalOrders = orders?.length || 0;
//   const totalWishlistItems = wishlistItems?.length || 0;
//   const pendingOrders =
//     orders?.filter((order) => order.status === 'PENDING').length || 0;

//   return (
//     <div className="dashboard">
//       <h1>My Dashboard</h1>
//       <div className="stats">
//         <div className="stat-card">
//           <h3>Total Orders</h3>
//           <p className="stat-value">{totalOrders}</p>
//         </div>
//         <div className="stat-card">
//           <h3>Pending Orders</h3>
//           <p className="stat-value">{pendingOrders}</p>
//         </div>
//         <div className="stat-card">
//           <h3>Wishlist Items</h3>
//           <p className="stat-value">{totalWishlistItems}</p>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default CustomHooksExample;
