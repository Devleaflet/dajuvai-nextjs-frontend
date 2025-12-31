# Form Validation Usage Examples

## Quick Start

### 1. Basic Form with Validation

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/validations/auth.schema';

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      // Your login logic here
      console.log('Valid data:', data);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && (
          <p className="text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          {...register('password')}
          className={errors.password ? 'border-red-500' : ''}
        />
        {errors.password && (
          <p className="text-red-600">{errors.password.message}</p>
        )}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Log In'}
      </button>
    </form>
  );
}
```

### 2. Using Pre-built Validated Components

```tsx
'use client';

import { ValidatedLoginForm } from '@/components/Components/Form/ValidatedAuthForms';
import { useAuth } from '@/lib/context/AuthContext';
import { useState } from 'react';

export default function LoginPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      // Redirect or show success
    } catch (error) {
      // Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      <ValidatedLoginForm
        onSubmit={handleLogin}
        isLoading={isLoading}
      />
    </div>
  );
}
```

### 3. Product Form with Dynamic Fields

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, ProductFormData } from '@/lib/validations/product.schema';
import { useState, useEffect } from 'react';

export default function ProductForm() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  const selectedCategory = watch('categoryId');
  const hasDiscount = watch('discount');

  // Load subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      // Fetch subcategories for selected category
      fetchSubcategories(selectedCategory).then(setSubcategories);
    }
  }, [selectedCategory]);

  const onSubmit = async (data: ProductFormData) => {
    console.log('Valid product data:', data);
    // Submit to API
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Product Name */}
      <div>
        <label>Product Name</label>
        <input {...register('name')} />
        {errors.name && <p className="text-red-600">{errors.name.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label>Description</label>
        <textarea {...register('description')} rows={4} />
        {errors.description && <p className="text-red-600">{errors.description.message}</p>}
      </div>

      {/* Price */}
      <div>
        <label>Base Price</label>
        <input
          type="number"
          step="0.01"
          {...register('basePrice', { valueAsNumber: true })}
        />
        {errors.basePrice && <p className="text-red-600">{errors.basePrice.message}</p>}
      </div>

      {/* Stock */}
      <div>
        <label>Stock</label>
        <input
          type="number"
          {...register('stock', { valueAsNumber: true })}
        />
        {errors.stock && <p className="text-red-600">{errors.stock.message}</p>}
      </div>

      {/* Discount (Optional) */}
      <div>
        <label>Discount</label>
        <input
          type="number"
          {...register('discount', { valueAsNumber: true })}
        />
        {errors.discount && <p className="text-red-600">{errors.discount.message}</p>}
      </div>

      {/* Discount Type (Conditional) */}
      {hasDiscount && (
        <div>
          <label>Discount Type</label>
          <select {...register('discountType')}>
            <option value="">Select type</option>
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED">Fixed Amount</option>
          </select>
          {errors.discountType && <p className="text-red-600">{errors.discountType.message}</p>}
        </div>
      )}

      {/* Category */}
      <div>
        <label>Category</label>
        <select {...register('categoryId', { valueAsNumber: true })}>
          <option value="">Select category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        {errors.categoryId && <p className="text-red-600">{errors.categoryId.message}</p>}
      </div>

      {/* Subcategory */}
      <div>
        <label>Subcategory</label>
        <select {...register('subcategoryId', { valueAsNumber: true })}>
          <option value="">Select subcategory</option>
          {subcategories.map(sub => (
            <option key={sub.id} value={sub.id}>{sub.name}</option>
          ))}
        </select>
        {errors.subcategoryId && <p className="text-red-600">{errors.subcategoryId.message}</p>}
      </div>

      <button type="submit">Save Product</button>
    </form>
  );
}
```

### 4. Checkout Form with Nested Validation

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutSchema, CheckoutFormData } from '@/lib/validations/order.schema';

export default function CheckoutForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  const onSubmit = async (data: CheckoutFormData) => {
    console.log('Checkout data:', data);
    // Process order
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Shipping Address */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Shipping Address</h2>
        
        <div>
          <label>Street Address</label>
          <input {...register('shippingAddress.street')} />
          {errors.shippingAddress?.street && (
            <p className="text-red-600">{errors.shippingAddress.street.message}</p>
          )}
        </div>

        <div>
          <label>City</label>
          <input {...register('shippingAddress.city')} />
          {errors.shippingAddress?.city && (
            <p className="text-red-600">{errors.shippingAddress.city.message}</p>
          )}
        </div>

        <div>
          <label>District</label>
          <input {...register('shippingAddress.district')} />
          {errors.shippingAddress?.district && (
            <p className="text-red-600">{errors.shippingAddress.district.message}</p>
          )}
        </div>

        <div>
          <label>Postal Code (Optional)</label>
          <input {...register('shippingAddress.postalCode')} />
          {errors.shippingAddress?.postalCode && (
            <p className="text-red-600">{errors.shippingAddress.postalCode.message}</p>
          )}
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <h2 className="text-xl font-semibold">Payment Method</h2>
        <select {...register('paymentMethod')}>
          <option value="">Select payment method</option>
          <option value="COD">Cash on Delivery</option>
          <option value="ESEWA">eSewa</option>
          <option value="KHALTI">Khalti</option>
        </select>
        {errors.paymentMethod && (
          <p className="text-red-600">{errors.paymentMethod.message}</p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label>Order Notes (Optional)</label>
        <textarea {...register('notes')} rows={3} />
        {errors.notes && <p className="text-red-600">{errors.notes.message}</p>}
      </div>

      {/* Promo Code */}
      <div>
        <label>Promo Code (Optional)</label>
        <input {...register('promoCode')} />
        {errors.promoCode && <p className="text-red-600">{errors.promoCode.message}</p>}
      </div>

      {/* Terms Agreement */}
      <div>
        <label className="flex items-center">
          <input type="checkbox" {...register('agreeToTerms')} />
          <span className="ml-2">I agree to the terms and conditions</span>
        </label>
        {errors.agreeToTerms && (
          <p className="text-red-600">{errors.agreeToTerms.message}</p>
        )}
      </div>

      <button type="submit" className="w-full bg-orange-500 text-white py-2 rounded">
        Place Order
      </button>
    </form>
  );
}
```

### 5. Manual Validation (Without Forms)

```tsx
import { productSchema } from '@/lib/validations/product.schema';

// Validate data manually
const validateProductData = (data: unknown) => {
  const result = productSchema.safeParse(data);
  
  if (result.success) {
    // Data is valid
    console.log('Valid product:', result.data);
    return { valid: true, data: result.data };
  } else {
    // Data is invalid
    console.log('Validation errors:', result.error.errors);
    return { valid: false, errors: result.error.errors };
  }
};

// Usage
const productData = {
  name: 'Test Product',
  description: 'A test product',
  basePrice: 100,
  stock: 10,
  categoryId: 1,
  subcategoryId: 1,
};

const validation = validateProductData(productData);
if (validation.valid) {
  // Proceed with valid data
}
```

### 6. Server-Side Validation (API Route)

```tsx
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { productSchema } from '@/lib/validations/product.schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = productSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }
    
    // Data is valid, proceed with creation
    const product = await createProduct(validation.data);
    
    return NextResponse.json({ success: true, product });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Common Patterns

### Default Values

```tsx
const { register, handleSubmit } = useForm<ProductFormData>({
  resolver: zodResolver(productSchema),
  defaultValues: {
    name: '',
    description: '',
    basePrice: 0,
    stock: 0,
    categoryId: 0,
    subcategoryId: 0,
  },
});
```

### Reset Form After Submission

```tsx
const { register, handleSubmit, reset } = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
});

const onSubmit = async (data: LoginFormData) => {
  await login(data);
  reset(); // Clear form
};
```

### Watch Multiple Fields

```tsx
const { watch } = useForm<ProductFormData>({
  resolver: zodResolver(productSchema),
});

const [discount, discountType] = watch(['discount', 'discountType']);

// Show discount type only when discount is entered
{discount && (
  <div>
    <label>Discount Type</label>
    <select {...register('discountType')}>
      <option value="PERCENTAGE">Percentage</option>
      <option value="FIXED">Fixed Amount</option>
    </select>
  </div>
)}
```

### Custom Error Messages

```tsx
{errors.email && (
  <div className="flex items-center gap-2 text-red-600">
    <FaExclamationCircle />
    <span>{errors.email.message}</span>
  </div>
)}
```

## Tips

1. **Always use `valueAsNumber`** for number inputs:
   ```tsx
   <input type="number" {...register('price', { valueAsNumber: true })} />
   ```

2. **Handle optional fields** properly:
   ```tsx
   // Schema
   discount: z.number().optional()
   
   // Form
   <input type="number" {...register('discount', { valueAsNumber: true })} />
   ```

3. **Nested objects** use dot notation:
   ```tsx
   <input {...register('shippingAddress.street')} />
   {errors.shippingAddress?.street && <p>{errors.shippingAddress.street.message}</p>}
   ```

4. **Conditional validation** can be added to schemas:
   ```tsx
   .refine((data) => {
     if (data.discount && !data.discountType) {
       return false;
     }
     return true;
   }, 'Discount type is required when discount is provided')
   ```

5. **Loading states** should disable submit:
   ```tsx
   <button type="submit" disabled={isSubmitting}>
     {isSubmitting ? 'Saving...' : 'Save'}
   </button>
   ```
