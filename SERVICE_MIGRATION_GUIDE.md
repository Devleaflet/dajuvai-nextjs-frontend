# Service Class Migration Guide

This guide shows how to migrate from direct axios calls to the new service classes.

## Table of Contents
1. [Authentication](#authentication)
2. [Products](#products)
3. [Cart](#cart)
4. [Orders](#orders)
5. [Error Handling](#error-handling)

---

## Authentication

### Before: Direct axios call
```typescript
// components/Components/AuthModal.tsx (line 607)
await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
```

### After: Using AuthService
```typescript
import { AuthService } from '@/lib/services/auth.service';
import { handleApiError } from '@/lib/utils/errorHandler';

try {
  // Note: AuthService doesn't have forgotPassword yet, but here's how it would work:
  await apiClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  setSuccess("Password reset email sent! Check your inbox.");
} catch (error) {
  const appError = handleApiError(error);
  setError(appError.message);
}
```

### Before: Password reset
```typescript
// components/Components/AuthModal.tsx (line 632)
await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
  newPass: newPassword,
  confirmPass: confirmNewPassword,
  token: resetToken,
});
```

### After: Using apiClient with endpoints
```typescript
import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';

try {
  await apiClient.post(ENDPOINTS.AUTH.RESET_PASSWORD, {
    newPass: newPassword,
    confirmPass: confirmNewPassword,
    token: resetToken,
  });
  setSuccess("Password reset successful!");
} catch (error) {
  const appError = handleApiError(error);
  setError(appError.message);
}
```

### Before: Login
```typescript
const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
  email,
  password
});
const { token, user } = response.data;
```

### After: Using AuthService
```typescript
import { AuthService } from '@/lib/services/auth.service';

try {
  const { token, user } = await AuthService.login(email, password);
  // Store token and update state
  localStorage.setItem('token', token);
  setUser(user);
} catch (error) {
  const appError = handleApiError(error);
  setError(appError.message);
}
```

---

## Products

### Before: Fetch all products
```typescript
// components/Pages/Shop.tsx
const response = await axios.get(`${API_BASE_URL}/api/products`);
const products = response.data;
```

### After: Using ProductService
```typescript
import { ProductService } from '@/lib/services/product.service';

try {
  const products = await ProductService.getAll();
  setProducts(products);
} catch (error) {
  const appError = handleApiError(error);
  console.error('Failed to fetch products:', appError.message);
}
```

### Before: Fetch products with filters
```typescript
const response = await axios.get(
  `${API_BASE_URL}/api/products?category=${categoryId}&minPrice=${minPrice}`
);
```

### After: Using ProductService with filters
```typescript
import { ProductService } from '@/lib/services/product.service';

const products = await ProductService.getAll({
  category: categoryId,
  minPrice: minPrice,
  sortBy: 'price',
  sortOrder: 'asc'
});
```

### Before: Fetch single product
```typescript
const response = await axios.get(`${API_BASE_URL}/api/products/${id}`);
const product = response.data;
```

### After: Using ProductService
```typescript
import { ProductService } from '@/lib/services/product.service';

const product = await ProductService.getById(id);
```

### Before: Update product
```typescript
// components/Components/Modal/AdminEditProductModal.tsx (line 176)
await axios.put(`/api/products/${product.id}`, productData);
```

### After: Using ProductService
```typescript
import { ProductService } from '@/lib/services/product.service';

await ProductService.update(product.id, productData);
toast.success('Product updated successfully');
```

---

## Cart

### Before: Add to cart
```typescript
const response = await axios.post(`${API_BASE_URL}/api/cart/add`, {
  productId,
  quantity,
  variantId
});
```

### After: Using CartService
```typescript
import { CartService } from '@/lib/services/cart.service';

try {
  const cartItem = await CartService.add(productId, quantity, variantId);
  toast.success('Added to cart!');
  return cartItem;
} catch (error) {
  const appError = handleApiError(error);
  toast.error(appError.message);
}
```

### Before: Get cart items
```typescript
const response = await axios.get(`${API_BASE_URL}/api/cart/items`);
const items = response.data;
```

### After: Using CartService
```typescript
import { CartService } from '@/lib/services/cart.service';

const items = await CartService.getItems();
```

### Before: Update quantity
```typescript
await axios.put(`${API_BASE_URL}/api/cart/items/${itemId}`, {
  quantity: newQuantity
});
```

### After: Using CartService
```typescript
import { CartService } from '@/lib/services/cart.service';

await CartService.updateQuantity(itemId, newQuantity);
```

### Before: Remove from cart
```typescript
await axios.delete(`${API_BASE_URL}/api/cart/items/${itemId}`);
```

### After: Using CartService
```typescript
import { CartService } from '@/lib/services/cart.service';

await CartService.remove(itemId);
```

---

## Orders

### Before: Create order
```typescript
const response = await axios.post(`${API_BASE_URL}/api/orders/create`, {
  items: cartItems,
  shippingAddressId: addressId,
  paymentMethod: 'COD'
});
```

### After: Using OrderService
```typescript
import { OrderService } from '@/lib/services/order.service';

const order = await OrderService.create({
  items: cartItems.map(item => ({
    productId: item.product.id,
    variantId: item.variant?.id,
    quantity: item.quantity
  })),
  shippingAddressId: addressId,
  paymentMethod: 'COD'
});
```

### Before: Get user orders
```typescript
const response = await axios.get(`${API_BASE_URL}/api/orders/user`);
const orders = response.data;
```

### After: Using OrderService
```typescript
import { OrderService } from '@/lib/services/order.service';

const orders = await OrderService.getAll();
```

### Before: Track order
```typescript
const response = await axios.get(`${API_BASE_URL}/api/orders/${orderId}/track`);
const tracking = response.data;
```

### After: Using OrderService
```typescript
import { OrderService } from '@/lib/services/order.service';

const tracking = await OrderService.track(orderId);
```

---

## Error Handling

### Before: Generic error handling
```typescript
try {
  await axios.post(url, data);
} catch (error: any) {
  console.error(error.message);
  setError(error.response?.data?.message || 'An error occurred');
}
```

### After: Using AppError
```typescript
import { handleApiError, AppError } from '@/lib/utils/errorHandler';

try {
  await apiClient.post(url, data);
} catch (error) {
  const appError = handleApiError(error);
  
  // Access structured error information
  console.error(appError.message);
  console.error('Status:', appError.statusCode);
  console.error('Code:', appError.code);
  
  // Display user-friendly message
  setError(appError.message);
  
  // Handle specific error codes
  if (appError.statusCode === 401) {
    router.push('/login');
  } else if (appError.statusCode === 400) {
    // Handle validation errors
    toast.error(appError.message);
  }
}
```

---

## Using with React Query

### Before: Manual state management
```typescript
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products`);
      setProducts(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  fetchProducts();
}, []);
```

### After: Using React Query with service
```typescript
import { useQuery } from '@tanstack/react-query';
import { ProductService } from '@/lib/services/product.service';
import { queryKeys } from '@/lib/api/queryKeys';

const { data: products, isLoading, error } = useQuery({
  queryKey: queryKeys.products.all,
  queryFn: () => ProductService.getAll(),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### With filters
```typescript
const filters = { category: categoryId, minPrice: 1000 };

const { data: products } = useQuery({
  queryKey: queryKeys.products.list(filters),
  queryFn: () => ProductService.getAll(filters),
});
```

---

## Components to Migrate (Priority Order)

### High Priority (Core functionality)
1. ✅ **AuthModal.tsx** - Login, signup, password reset
2. ✅ **Shop.tsx** - Product listing
3. ✅ **ProductPage.tsx** - Product details
4. ✅ **Cart.tsx** - Cart operations
5. ✅ **CheckOut.tsx** - Order creation

### Medium Priority (Admin/Vendor)
6. ✅ **AdminProduct.tsx** - Product management
7. ✅ **AdminCategories.tsx** - Category management
8. ✅ **VendorProduct.tsx** - Vendor product management
9. ✅ **ProfilePage.tsx** - User/vendor profile
10. ✅ **AdminEditProductModal.tsx** - Product editing

### Low Priority (Less frequent operations)
11. GoogleAuthBackend.tsx - OAuth callback
12. VendorSignup.tsx - Vendor registration
13. VendorLogin.tsx - Vendor authentication
14. AddVendorModal.tsx - Vendor creation

---

## Benefits of Migration

### Type Safety
```typescript
// Before: No type checking
const response = await axios.get(url);
const data = response.data; // any type

// After: Full type safety
const products: Product[] = await ProductService.getAll();
// TypeScript knows the exact shape of products
```

### Centralized Error Handling
```typescript
// Before: Repeated error handling
try {
  await axios.post(url, data);
} catch (error: any) {
  // Same error handling code repeated everywhere
}

// After: Automatic error transformation
try {
  await ProductService.create(data);
} catch (error) {
  // Error is already transformed to AppError
  const appError = handleApiError(error);
}
```

### Automatic Token Management
```typescript
// Before: Manual token attachment
await axios.get(url, {
  headers: {
    Authorization: `Bearer ${token}`
  }
});

// After: Automatic via interceptor
await ProductService.getAll();
// Token automatically attached by apiClient
```

### Automatic Retry on Network Errors
```typescript
// Before: No retry logic
await axios.get(url);

// After: Automatic retry once on network errors
await ProductService.getAll();
// Automatically retries once if network fails
```

### Consistent Endpoint URLs
```typescript
// Before: String concatenation prone to errors
await axios.get(`${API_BASE_URL}/api/products/${id}`);

// After: Type-safe endpoint construction
await apiClient.get(ENDPOINTS.PRODUCTS.BY_ID(id));
// TypeScript ensures correct URL format
```

---

## Migration Checklist

For each component:

- [ ] Import the appropriate service class
- [ ] Import `handleApiError` for error handling
- [ ] Replace `axios.get/post/put/delete` with service methods
- [ ] Remove `API_BASE_URL` imports (handled by apiClient)
- [ ] Update error handling to use `AppError`
- [ ] Remove manual token attachment (handled by interceptor)
- [ ] Test the component thoroughly
- [ ] Update any related tests

---

## Testing After Migration

```typescript
// Test that the service is called correctly
import { ProductService } from '@/lib/services/product.service';

jest.mock('@/lib/services/product.service');

test('fetches products on mount', async () => {
  const mockProducts = [{ id: 1, name: 'Test Product' }];
  (ProductService.getAll as jest.Mock).mockResolvedValue(mockProducts);
  
  render(<Shop />);
  
  await waitFor(() => {
    expect(ProductService.getAll).toHaveBeenCalled();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });
});
```

---

## Need Help?

If you encounter issues during migration:

1. Check the service class implementation in `lib/services/`
2. Review the endpoint constants in `lib/api/endpoints.ts`
3. Look at the error handling in `lib/utils/errorHandler.ts`
4. Refer to the examples in this guide
5. Test incrementally - migrate one component at a time

---

## Summary

The new service layer provides:
- ✅ Type safety throughout
- ✅ Centralized error handling
- ✅ Automatic token management
- ✅ Network error retry logic
- ✅ Consistent API patterns
- ✅ Better testability
- ✅ Reduced code duplication

Migrate components gradually, test thoroughly, and enjoy the improved developer experience!
