# Cart Migration Guide: Context to React Query

This guide explains how to migrate from the old CartContext to the new React Query-based cart hooks.

## Overview

The new cart implementation provides:
- ✅ **Optimistic updates** - UI updates immediately before server confirmation
- ✅ **Debounced quantity changes** - API calls delayed by 500ms to prevent spam
- ✅ **Automatic error handling** - Failed updates automatically rollback
- ✅ **Better caching** - React Query manages cache with 30-second stale time
- ✅ **Loading states** - Built-in pending states for all mutations
- ✅ **Type safety** - Full TypeScript support

## Installation

The required dependencies are already installed:
- `@tanstack/react-query` - For data fetching and caching
- `use-debounce` - For debouncing quantity updates

## Migration Steps

### 1. Import the New Hooks

**Old (CartContext):**
```typescript
import { useCart } from '@/lib/context/CartContext';

const { 
  cartItems, 
  handleCartOnAdd, 
  handleCartItemOnDelete,
  handleIncreaseQuantity,
  handleDecreaseQuantity 
} = useCart();
```

**New (React Query):**
```typescript
import {
  useCart,
  useAddToCart,
  useRemoveFromCart,
  useIncreaseCartQuantity,
  useDecreaseCartQuantity,
} from '@/lib/hooks/useCart';

const { data: cartItems, isLoading, error } = useCart();
const addToCart = useAddToCart();
const removeFromCart = useRemoveFromCart();
const increaseQuantity = useIncreaseCartQuantity();
const decreaseQuantity = useDecreaseCartQuantity();
```

### 2. Update Add to Cart

**Old:**
```typescript
<button onClick={() => handleCartOnAdd(product, 1)}>
  Add to Cart
</button>
```

**New:**
```typescript
<button 
  onClick={() => addToCart.mutate({ productId: product.id, quantity: 1 })}
  disabled={addToCart.isPending}
>
  {addToCart.isPending ? 'Adding...' : 'Add to Cart'}
</button>
```

### 3. Update Remove from Cart

**Old:**
```typescript
<button onClick={() => handleCartItemOnDelete(cartItem)}>
  Remove
</button>
```

**New:**
```typescript
<button 
  onClick={() => removeFromCart.mutate(cartItem.id)}
  disabled={removeFromCart.isPending}
>
  {removeFromCart.isPending ? 'Removing...' : 'Remove'}
</button>
```

### 4. Update Quantity Changes

**Old:**
```typescript
<button onClick={() => handleIncreaseQuantity(cartItem.id, 1)}>+</button>
<button onClick={() => handleDecreaseQuantity(cartItem.id, 1)}>-</button>
```

**New:**
```typescript
<button onClick={() => increaseQuantity(cartItem.id, 1)}>+</button>
<button onClick={() => decreaseQuantity(cartItem.id, 1)}>-</button>
```

Note: The new hooks automatically debounce API calls by 500ms!

### 5. Handle Loading States

**Old:**
```typescript
// Loading states were managed with Set<number>
const isAdding = addingItems.has(product.id);
const isDeleting = deletingItems.has(cartItem.id);
```

**New:**
```typescript
// React Query provides built-in loading states
const isAdding = addToCart.isPending;
const isRemoving = removeFromCart.isPending;
```

### 6. Handle Errors

**Old:**
```typescript
// Errors were handled inside the context with toast notifications
```

**New:**
```typescript
// Errors are still handled automatically with toast notifications
// But you can also access error state:
if (addToCart.isError) {
  console.error('Failed to add to cart:', addToCart.error);
}
```

## Complete Example

Here's a complete before/after example:

### Before (CartContext)

```typescript
'use client';

import { useCart } from '@/lib/context/CartContext';

export default function ProductCard({ product }) {
  const { 
    cartItems,
    handleCartOnAdd,
    addingItems 
  } = useCart();

  const isAdding = addingItems.has(product.id);

  return (
    <div>
      <h3>{product.name}</h3>
      <p>Rs {product.price}</p>
      <button 
        onClick={() => handleCartOnAdd(product, 1)}
        disabled={isAdding}
      >
        {isAdding ? 'Adding...' : 'Add to Cart'}
      </button>
    </div>
  );
}
```

### After (React Query)

```typescript
'use client';

import { useAddToCart } from '@/lib/hooks/useCart';

export default function ProductCard({ product }) {
  const addToCart = useAddToCart();

  return (
    <div>
      <h3>{product.name}</h3>
      <p>Rs {product.price}</p>
      <button 
        onClick={() => addToCart.mutate({ 
          productId: product.id, 
          quantity: 1 
        })}
        disabled={addToCart.isPending}
      >
        {addToCart.isPending ? 'Adding...' : 'Add to Cart'}
      </button>
    </div>
  );
}
```

## Key Differences

| Feature | Old (Context) | New (React Query) |
|---------|--------------|-------------------|
| **Data fetching** | Manual with useEffect | Automatic with useQuery |
| **Optimistic updates** | Manual state updates | Built-in with onMutate |
| **Error handling** | Manual rollback | Automatic rollback |
| **Debouncing** | Not implemented | Built-in 500ms delay |
| **Loading states** | Set<number> tracking | isPending flag |
| **Caching** | Manual refresh | Automatic with staleTime |
| **Type safety** | Partial | Full TypeScript support |

## Benefits

1. **Better UX**: Optimistic updates make the UI feel instant
2. **Less API spam**: Debouncing prevents excessive API calls
3. **Automatic error recovery**: Failed updates automatically rollback
4. **Better performance**: React Query caches data efficiently
5. **Simpler code**: Less boilerplate, more declarative
6. **Better testing**: Easier to test with React Query's testing utilities

## Backward Compatibility

The old CartContext is still available and functional. You can migrate components gradually:

1. Keep CartContext provider in `app/providers.tsx`
2. Migrate components one at a time to use new hooks
3. Once all components are migrated, remove CartContext

## Testing

See `components/examples/CartHooksExample.tsx` for a complete working example demonstrating all features.

## Troubleshooting

### Issue: "useCart must be used within a CartContextProvider"

**Solution**: Make sure you're importing from the correct location:
```typescript
// Old - will throw error if not in CartContext
import { useCart } from '@/lib/context/CartContext';

// New - works anywhere with QueryClientProvider
import { useCart } from '@/lib/hooks/useCart';
```

### Issue: Cart not updating after mutation

**Solution**: React Query automatically invalidates the cache. If you need manual refresh:
```typescript
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queryKeys';

const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: queryKeys.cart.items() });
```

### Issue: Debouncing not working

**Solution**: Make sure you're using the increase/decrease hooks, not the update hook directly:
```typescript
// ✅ Correct - uses debouncing
const increaseQuantity = useIncreaseCartQuantity();
increaseQuantity(itemId, 1);

// ❌ Wrong - no debouncing
const { mutate } = useUpdateCartQuantity();
mutate({ itemId, quantity: newQuantity });
```

## Next Steps

1. Review the example component: `components/examples/CartHooksExample.tsx`
2. Start migrating high-traffic components first (ProductCard, Cart page)
3. Test thoroughly in development before deploying
4. Monitor error logs for any issues

## Support

For questions or issues, refer to:
- React Query docs: https://tanstack.com/query/latest
- use-debounce docs: https://github.com/xnimorz/use-debounce
