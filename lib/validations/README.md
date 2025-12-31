# Form Validation with Zod and React Hook Form

This directory contains Zod validation schemas for form validation throughout the application. These schemas are integrated with React Hook Form using the `@hookform/resolvers/zod` package.

## Available Schemas

### Product Validation (`product.schema.ts`)

Validates product creation and editing forms.

**Fields:**
- `name`: String (min 3, max 200 characters)
- `description`: String (min 10, max 5000 characters)
- `basePrice`: Positive number
- `stock`: Non-negative integer
- `discount`: Optional number (0-100)
- `discountType`: Optional enum ('PERCENTAGE' | 'FIXED')
- `categoryId`: Positive number
- `subcategoryId`: Positive number

**Usage:**
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, ProductFormData } from '@/lib/validations/product.schema';

const MyForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  const onSubmit = (data: ProductFormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      {/* ... other fields */}
    </form>
  );
};
```

### Authentication Validation (`auth.schema.ts`)

Validates login, registration, and password reset forms.

**Schemas:**
- `loginSchema`: Email and password validation
- `registerSchema`: Full registration with password strength requirements
- `forgotPasswordSchema`: Email validation for password reset request
- `resetPasswordSchema`: New password validation with confirmation

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

**Usage:**
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/validations/auth.schema';

const LoginForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    // Handle login
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input type="email" {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}
      
      <button type="submit">Login</button>
    </form>
  );
};
```

### Order Validation (`order.schema.ts`)

Validates order creation, checkout, and address forms.

**Schemas:**
- `addressSchema`: Shipping/billing address validation
- `orderItemSchema`: Individual order item validation
- `orderSchema`: Complete order with items, address, and payment
- `checkoutSchema`: Simplified checkout form validation
- `paymentMethodSchema`: Payment method enum validation

**Usage:**
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutSchema, CheckoutFormData } from '@/lib/validations/order.schema';

const CheckoutForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  const onSubmit = async (data: CheckoutFormData) => {
    // Process checkout
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Address fields */}
      <input {...register('shippingAddress.street')} />
      {errors.shippingAddress?.street && <span>{errors.shippingAddress.street.message}</span>}
      
      {/* Payment method */}
      <select {...register('paymentMethod')}>
        <option value="COD">Cash on Delivery</option>
        <option value="ESEWA">eSewa</option>
        <option value="KHALTI">Khalti</option>
      </select>
      {errors.paymentMethod && <span>{errors.paymentMethod.message}</span>}
      
      {/* Terms agreement */}
      <input type="checkbox" {...register('agreeToTerms')} />
      {errors.agreeToTerms && <span>{errors.agreeToTerms.message}</span>}
      
      <button type="submit">Place Order</button>
    </form>
  );
};
```

## Pre-built Validated Form Components

For convenience, pre-built form components with validation are available:

### ValidatedProductForm
Located at: `components/Components/Form/ValidatedProductForm.tsx`

```tsx
import { ValidatedProductForm } from '@/components/Components/Form/ValidatedProductForm';

<ValidatedProductForm
  onSubmit={(data) => console.log(data)}
  initialData={{ name: 'Existing Product' }}
  isLoading={false}
/>
```

### ValidatedLoginForm & ValidatedRegisterForm
Located at: `components/Components/Form/ValidatedAuthForms.tsx`

```tsx
import { ValidatedLoginForm, ValidatedRegisterForm } from '@/components/Components/Form/ValidatedAuthForms';

<ValidatedLoginForm
  onSubmit={async (data) => {
    // Handle login
  }}
  isLoading={false}
/>

<ValidatedRegisterForm
  onSubmit={async (data) => {
    // Handle registration
  }}
  isLoading={false}
/>
```

## Benefits

1. **Type Safety**: All form data is fully typed with TypeScript
2. **Validation**: Client-side validation with user-friendly error messages
3. **Consistency**: Validation rules are centralized and reusable
4. **Developer Experience**: IntelliSense support for form fields
5. **User Experience**: Immediate feedback on form errors

## Adding New Schemas

To add a new validation schema:

1. Create a new file in this directory (e.g., `myfeature.schema.ts`)
2. Import Zod: `import { z } from 'zod';`
3. Define your schema: `export const mySchema = z.object({ ... });`
4. Export the inferred type: `export type MyFormData = z.infer<typeof mySchema>;`
5. Use it with React Hook Form as shown in the examples above

## Testing

Validation schemas can be tested directly:

```tsx
import { productSchema } from '@/lib/validations/product.schema';

// Valid data
const result = productSchema.safeParse({
  name: 'Test Product',
  description: 'A test product description',
  basePrice: 100,
  stock: 10,
  categoryId: 1,
  subcategoryId: 1,
});

if (result.success) {
  console.log('Valid:', result.data);
} else {
  console.log('Errors:', result.error.errors);
}
```
