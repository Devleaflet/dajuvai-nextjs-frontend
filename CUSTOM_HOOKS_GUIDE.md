# Custom React Hooks Guide

This guide explains how to use the custom React hooks created for data fetching in the Dajuvai frontend application.

## Overview

Custom hooks simplify component logic by encapsulating data fetching, caching, and state management. They use React Query under the hood for optimal performance and developer experience.

## Available Hooks

### Product Hooks

#### `useProducts(filters?: ProductFilters)`

Fetches a list of products with optional filters.

**Parameters:**
- `filters` (optional): Object containing filter criteria
  - `category?: number` - Filter by category ID
  - `subcategory?: number` - Filter by subcategory ID
  - `vendor?: number` - Filter by vendor ID
  - `search?: string` - Search query
  - `minPrice?: number` - Minimum price
  - `maxPrice?: number` - Maximum price
  - `sortBy?: string` - Sort field (e.g., 'price', 'createdAt')
  - `sortOrder?: 'asc' | 'desc'` - Sort direction

**Returns:**
- `data: Product[]` - Array of products
- `isLoading: boolean` - Loading state
- `error: Error | null` - Error object if request failed
- `refetch: () => void` - Function to manually refetch data

**Cache Duration:** 5 minutes

**Example:**
```tsx
import { useProducts } from '@/lib/hooks/useProducts';

function ProductList() {
  const { data: products, isLoading, error } = useProducts({
    category: 1,
    sortBy: 'price',
    sortOrder: 'asc',
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading products</div>;

  return (
    <div>
      {products?.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

#### `useProduct(id: number | string | undefined)`

Fetches a single product by ID.

**Parameters:**
- `id` - Product ID (can be number, string, or undefined)

**Returns:**
- `data: Product | undefined` - Product object
- `isLoading: boolean` - Loading state
- `error: Error | null` - Error object if request failed

**Cache Duration:** 10 minutes

**Note:** Query is disabled when `id` is undefined, preventing unnecessary API calls.

**Example:**
```tsx
import { useProduct } from '@/lib/hooks/useProducts';

function ProductDetail({ productId }: { productId: number }) {
  const { data: product, isLoading } = useProduct(productId);

  if (isLoading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p>Price: Rs {product.price}</p>
    </div>
  );
}
```

### Order Hooks

#### `useOrders()`

Fetches all orders for the current user.

**Returns:**
- `data: Order[]` - Array of orders
- `isLoading: boolean` - Loading state
- `error: Error | null` - Error object if request failed

**Cache Duration:** 2 minutes

**Example:**
```tsx
import { useOrders } from '@/lib/hooks/useOrders';

function OrderList() {
  const { data: orders, isLoading } = useOrders();

  if (isLoading) return <div>Loading orders...</div>;

  return (
    <div>
      {orders?.map(order => (
        <div key={order.id}>
          Order #{order.orderNumber} - {order.status}
        </div>
      ))}
    </div>
  );
}
```

#### `useOrder(id: number | string | undefined)`

Fetches a single order by ID.

**Parameters:**
- `id` - Order ID

**Returns:**
- `data: Order | undefined` - Order object
- `isLoading: boolean` - Loading state
- `error: Error | null` - Error object if request failed

**Cache Duration:** 1 minute

**Example:**
```tsx
import { useOrder } from '@/lib/hooks/useOrders';

function OrderDetail({ orderId }: { orderId: number }) {
  const { data: order, isLoading } = useOrder(orderId);

  if (isLoading) return <div>Loading...</div>;
  if (!order) return <div>Order not found</div>;

  return (
    <div>
      <h2>Order #{order.orderNumber}</h2>
      <p>Status: {order.status}</p>
      <p>Total: Rs {order.totalAmount}</p>
    </div>
  );
}
```

### Wishlist Hooks

#### `useWishlist()`

Fetches all wishlist items for the current user.

**Returns:**
- `data: WishlistItem[]` - Array of wishlist items
- `isLoading: boolean` - Loading state
- `error: Error | null` - Error object if request failed

**Cache Duration:** 2 minutes

**Example:**
```tsx
import { useWishlist } from '@/lib/hooks/useWishlist';

function Wishlist() {
  const { data: items, isLoading } = useWishlist();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2>My Wishlist ({items?.length || 0} items)</h2>
      {items?.map(item => (
        <div key={item.id}>{item.product.name}</div>
      ))}
    </div>
  );
}
```

#### `useAddToWishlist()`

Mutation hook for adding items to wishlist with optimistic updates.

**Returns:**
- `mutate: (data: { productId: number; variantId?: number }) => void` - Function to add item
- `isPending: boolean` - Loading state
- `isError: boolean` - Error state
- `isSuccess: boolean` - Success state

**Features:**
- Optimistic UI updates (item appears immediately)
- Automatic rollback on error
- Cache invalidation on success

**Example:**
```tsx
import { useAddToWishlist } from '@/lib/hooks/useWishlist';
import { toast } from 'react-hot-toast';

function AddToWishlistButton({ productId }: { productId: number }) {
  const addToWishlist = useAddToWishlist();

  const handleAdd = () => {
    addToWishlist.mutate(
      { productId },
      {
        onSuccess: () => toast.success('Added to wishlist!'),
        onError: () => toast.error('Failed to add to wishlist'),
      }
    );
  };

  return (
    <button onClick={handleAdd} disabled={addToWishlist.isPending}>
      {addToWishlist.isPending ? 'Adding...' : 'Add to Wishlist'}
    </button>
  );
}
```

#### `useRemoveFromWishlist()`

Mutation hook for removing items from wishlist with optimistic updates.

**Returns:**
- `mutate: (itemId: number) => void` - Function to remove item
- `isPending: boolean` - Loading state
- `isError: boolean` - Error state
- `isSuccess: boolean` - Success state

**Example:**
```tsx
import { useRemoveFromWishlist } from '@/lib/hooks/useWishlist';

function RemoveButton({ itemId }: { itemId: number }) {
  const removeFromWishlist = useRemoveFromWishlist();

  return (
    <button
      onClick={() => removeFromWishlist.mutate(itemId)}
      disabled={removeFromWishlist.isPending}
    >
      Remove
    </button>
  );
}
```

#### `useMoveToCart()`

Mutation hook for moving wishlist items to cart.

**Returns:**
- `mutate: (data: { wishlistItemId: number; quantity: number }) => void`
- `isPending: boolean` - Loading state

**Features:**
- Invalidates both wishlist and cart caches
- Ensures UI stays in sync

**Example:**
```tsx
import { useMoveToCart } from '@/lib/hooks/useWishlist';

function MoveToCartButton({ itemId }: { itemId: number }) {
  const moveToCart = useMoveToCart();

  return (
    <button
      onClick={() => moveToCart.mutate({ wishlistItemId: itemId, quantity: 1 })}
      disabled={moveToCart.isPending}
    >
      Move to Cart
    </button>
  );
}
```

#### `useClearWishlist()`

Mutation hook for clearing the entire wishlist.

**Returns:**
- `mutate: () => void` - Function to clear wishlist
- `isPending: boolean` - Loading state

**Example:**
```tsx
import { useClearWishlist } from '@/lib/hooks/useWishlist';

function ClearWishlistButton() {
  const clearWishlist = useClearWishlist();

  return (
    <button
      onClick={() => clearWishlist.mutate()}
      disabled={clearWishlist.isPending}
    >
      Clear Wishlist
    </button>
  );
}
```

## Best Practices

### 1. Use Hooks in Components

Always use hooks at the top level of your component:

```tsx
// ✅ Good
function MyComponent() {
  const { data, isLoading } = useProducts();
  // ... rest of component
}

// ❌ Bad - don't use hooks conditionally
function MyComponent() {
  if (someCondition) {
    const { data } = useProducts(); // This will cause errors!
  }
}
```

### 2. Handle Loading and Error States

Always handle loading and error states for better UX:

```tsx
function ProductList() {
  const { data: products, isLoading, error } = useProducts();

  if (isLoading) {
    return <ProductListSkeleton />;
  }

  if (error) {
    return (
      <div>
        <p>Error loading products</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  return <div>{/* Render products */}</div>;
}
```

### 3. Use Optimistic Updates

Mutation hooks provide optimistic updates out of the box:

```tsx
function WishlistToggle({ productId }: { productId: number }) {
  const { data: wishlistItems } = useWishlist();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const wishlistItem = wishlistItems?.find(item => item.productId === productId);
  const isInWishlist = !!wishlistItem;

  const handleToggle = () => {
    if (isInWishlist && wishlistItem) {
      // UI updates immediately, then syncs with server
      removeFromWishlist.mutate(wishlistItem.id);
    } else {
      addToWishlist.mutate({ productId });
    }
  };

  return (
    <button onClick={handleToggle}>
      {isInWishlist ? '❤️' : '🤍'}
    </button>
  );
}
```

### 4. Combine Multiple Hooks

You can use multiple hooks in the same component:

```tsx
function Dashboard() {
  const { data: orders } = useOrders();
  const { data: wishlistItems } = useWishlist();
  const { data: products } = useProducts({ featured: true });

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Orders: {orders?.length || 0}</p>
      <p>Wishlist: {wishlistItems?.length || 0}</p>
      <p>Featured Products: {products?.length || 0}</p>
    </div>
  );
}
```

### 5. Use Callbacks for Side Effects

Use mutation callbacks for side effects like showing toasts:

```tsx
function AddToWishlistButton({ productId }: { productId: number }) {
  const addToWishlist = useAddToWishlist();

  const handleAdd = () => {
    addToWishlist.mutate(
      { productId },
      {
        onSuccess: () => {
          toast.success('Added to wishlist!');
          // Navigate or perform other actions
        },
        onError: (error) => {
          toast.error('Failed to add to wishlist');
          console.error(error);
        },
      }
    );
  };

  return <button onClick={handleAdd}>Add to Wishlist</button>;
}
```

## Migration Guide

### From Direct API Calls

**Before:**
```tsx
function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const response = await fetch('/api/products');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // ... render logic
}
```

**After:**
```tsx
function ProductList() {
  const { data: products, isLoading } = useProducts();

  // ... render logic
}
```

### From Service Classes

**Before:**
```tsx
function ProductList() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => ProductService.getAll(),
  });

  // ... render logic
}
```

**After:**
```tsx
function ProductList() {
  const { data: products, isLoading } = useProducts();

  // ... render logic
}
```

## Troubleshooting

### Hook returns undefined data

Make sure you're using the hook inside a component wrapped with `QueryClientProvider`:

```tsx
// In app/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### Stale data issues

If you need fresher data, you can manually refetch:

```tsx
const { data, refetch } = useProducts();

// Refetch on button click
<button onClick={() => refetch()}>Refresh</button>
```

Or adjust the `staleTime` in the hook definition.

### Authentication errors

Make sure the user is authenticated before using hooks that require authentication:

```tsx
import { useAuth } from '@/lib/context/AuthContext';

function MyComponent() {
  const { isAuthenticated } = useAuth();
  const { data: orders } = useOrders();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  // ... render orders
}
```

## See Also

- [React Query Documentation](https://tanstack.com/query/latest)
- [Service Migration Guide](./SERVICE_MIGRATION_GUIDE.md)
- [Custom Hooks Examples](./components/examples/CustomHooksExample.tsx)
