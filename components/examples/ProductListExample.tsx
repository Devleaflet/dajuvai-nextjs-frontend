// /**
//  * Example component showing how to use the new custom hooks
//  * This demonstrates the migration from direct service calls to custom hooks
//  *
//  * Compare this with older components to see the improvements:
//  * - Type safety
//  * - Cleaner error handling
//  * - No manual token management
//  * - React Query integration via custom hooks
//  * - Simplified component logic
//  */

// 'use client';

// import React from 'react';
// import { useProducts } from '@/lib/hooks/useProducts';
// import type { ProductFilters } from '@/lib/types';
// import { handleApiError } from '@/lib/utils/errorHandler';
// import { toast } from 'react-hot-toast';

// interface ProductListExampleProps {
//   categoryId?: number;
//   searchQuery?: string;
// }

// /**
//  * Example component demonstrating custom hook usage
//  */
// export function ProductListExample({ categoryId, searchQuery }: ProductListExampleProps) {
//   // Build filters object
//   const filters: ProductFilters = {
//     category: categoryId,
//     search: searchQuery,
//     sortBy: 'createdAt',
//     sortOrder: 'desc',
//   };

//   // Use custom hook - much simpler than before!
//   const {
//     data: products,
//     isLoading,
//     error,
//     refetch,
//   } = useProducts(filters);

//   // Handle errors
//   React.useEffect(() => {
//     if (error) {
//       const appError = handleApiError(error);
//       toast.error(appError.message);
//     }
//   }, [error]);

//   // Loading state
//   if (isLoading) {
//     return (
//       <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
//         {[...Array(8)].map((_, i) => (
//           <div key={i} className="animate-pulse">
//             <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
//             <div className="bg-gray-200 h-4 rounded mb-2"></div>
//             <div className="bg-gray-200 h-4 rounded w-2/3"></div>
//           </div>
//         ))}
//       </div>
//     );
//   }

//   // Error state
//   if (error) {
//     const appError = handleApiError(error);
//     return (
//       <div className="text-center py-12">
//         <p className="text-red-600 mb-4">{appError.message}</p>
//         <button
//           onClick={() => refetch()}
//           className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
//         >
//           Try Again
//         </button>
//       </div>
//     );
//   }

//   // Empty state
//   if (!products || products.length === 0) {
//     return (
//       <div className="text-center py-12">
//         <p className="text-gray-600">No products found</p>
//       </div>
//     );
//   }

//   // Success state
//   return (
//     <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
//       {products.map((product) => (
//         <div key={product.id} className="border rounded-lg p-4 hover:shadow-lg transition">
//           <img
//             src={product.image}
//             alt={product.name}
//             className="w-full h-48 object-cover rounded mb-4"
//           />
//           <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
//           <div className="flex items-center justify-between">
//             <span className="text-orange-500 font-bold">
//               Rs {product.price.toLocaleString()}
//             </span>
//             {product.discount && (
//               <span className="text-sm text-gray-500 line-through">
//                 Rs {product.basePrice.toLocaleString()}
//               </span>
//             )}
//           </div>
//           <p className="text-sm text-gray-600 mt-2">
//             by {product.vendor.name}
//           </p>
//         </div>
//       ))}
//     </div>
//   );
// }

// /**
//  * Example of using ProductService directly (without React Query)
//  * Note: Prefer using custom hooks (useProducts, useProduct) in components
//  */
// export async function fetchProductsDirectly() {
//   try {
//     const { ProductService } = await import('@/lib/services/product.service');

//     // Simple fetch
//     const allProducts = await ProductService.getAll();
//     console.log('All products:', allProducts);

//     // Fetch with filters
//     const filteredProducts = await ProductService.getAll({
//       category: 1,
//       minPrice: 1000,
//       maxPrice: 5000,
//       sortBy: 'price',
//       sortOrder: 'asc',
//     });
//     console.log('Filtered products:', filteredProducts);

//     // Fetch single product
//     const product = await ProductService.getById(123);
//     console.log('Single product:', product);

//     return allProducts;
//   } catch (error) {
//     const appError = handleApiError(error);
//     console.error('Error fetching products:', appError.message);

//     // Handle specific error codes
//     if (appError.statusCode === 404) {
//       console.log('Products not found');
//     } else if (appError.statusCode === 500) {
//       console.log('Server error');
//     }

//     throw appError;
//   }
// }

// /**
//  * Example component using useProduct hook for single product
//  */
// export function SingleProductExample({ productId }: { productId: number }) {
//   const { useProduct } = require('@/lib/hooks/useProducts');
//   const { data: product, isLoading, error } = useProduct(productId);

//   if (isLoading) return <div>Loading product...</div>;
//   if (error) return <div>Error loading product</div>;
//   if (!product) return <div>Product not found</div>;

//   return (
//     <div>
//       <h2>{product.name}</h2>
//       <p>{product.description}</p>
//       <p>Price: Rs {product.price}</p>
//     </div>
//   );
// }

// /**
//  * Example component using useOrders hook
//  */
// export function OrderListExample() {
//   const { useOrders } = require('@/lib/hooks/useOrders');
//   const { data: orders, isLoading, error } = useOrders();

//   if (isLoading) return <div>Loading orders...</div>;
//   if (error) return <div>Error loading orders</div>;

//   return (
//     <div>
//       <h2>My Orders</h2>
//       {orders?.map((order) => (
//         <div key={order.id}>
//           <p>Order #{order.orderNumber}</p>
//           <p>Status: {order.status}</p>
//           <p>Total: Rs {order.totalAmount}</p>
//         </div>
//       ))}
//     </div>
//   );
// }

// /**
//  * Example component using useWishlist hook
//  */
// export function WishlistExample() {
//   const { useWishlist, useAddToWishlist, useRemoveFromWishlist } = require('@/lib/hooks/useWishlist');
//   const { data: wishlistItems, isLoading } = useWishlist();
//   const addToWishlist = useAddToWishlist();
//   const removeFromWishlist = useRemoveFromWishlist();

//   const handleAdd = (productId: number) => {
//     addToWishlist.mutate({ productId });
//   };

//   const handleRemove = (itemId: number) => {
//     removeFromWishlist.mutate(itemId);
//   };

//   if (isLoading) return <div>Loading wishlist...</div>;

//   return (
//     <div>
//       <h2>My Wishlist</h2>
//       {wishlistItems?.map((item) => (
//         <div key={item.id}>
//           <p>{item.product.name}</p>
//           <button onClick={() => handleRemove(item.id)}>Remove</button>
//         </div>
//       ))}
//     </div>
//   );
// }

// /**
//  * Example of creating a product (admin/vendor only)
//  */
// export async function createProductExample() {
//   try {
//     const { ProductService } = await import('@/lib/services/product.service');
//     const newProduct = await ProductService.create({
//       name: 'New Product',
//       description: 'Product description',
//       basePrice: 1000,
//       price: 900,
//       discount: 10,
//       discountType: 'PERCENTAGE',
//       stock: 50,
//       image: 'https://example.com/image.jpg',
//       // ... other fields
//     });

//     toast.success('Product created successfully!');
//     return newProduct;
//   } catch (error) {
//     const appError = handleApiError(error);
//     toast.error(appError.message);
//     throw appError;
//   }
// }

// /**
//  * Example of updating a product
//  */
// export async function updateProductExample(productId: number) {
//   try {
//     const { ProductService } = await import('@/lib/services/product.service');
//     const updatedProduct = await ProductService.update(productId, {
//       price: 850,
//       stock: 45,
//     });

//     toast.success('Product updated successfully!');
//     return updatedProduct;
//   } catch (error) {
//     const appError = handleApiError(error);
//     toast.error(appError.message);
//     throw appError;
//   }
// }

// /**
//  * Example of deleting a product
//  */
// export async function deleteProductExample(productId: number) {
//   try {
//     const { ProductService } = await import('@/lib/services/product.service');
//     await ProductService.delete(productId);
//     toast.success('Product deleted successfully!');
//   } catch (error) {
//     const appError = handleApiError(error);
//     toast.error(appError.message);
//     throw appError;
//   }
// }

// export default ProductListExample;
