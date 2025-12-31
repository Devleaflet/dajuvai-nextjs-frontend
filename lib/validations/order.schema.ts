import { z } from 'zod';

/**
 * Address validation schema
 * Validates shipping/billing address information
 */
export const addressSchema = z.object({
  street: z
    .string()
    .min(1, 'Street address is required')
    .min(5, 'Street address must be at least 5 characters')
    .max(200, 'Street address must not exceed 200 characters'),
  
  city: z
    .string()
    .min(1, 'City is required')
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must not exceed 100 characters'),
  
  district: z
    .string()
    .min(1, 'District is required')
    .min(2, 'District must be at least 2 characters')
    .max(100, 'District must not exceed 100 characters'),
  
  postalCode: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[0-9]{5}$/.test(val),
      'Postal code must be 5 digits'
    ),
  
  isDefault: z.boolean().optional().default(false),
});

/**
 * Payment method validation
 */
export const paymentMethodSchema = z.enum(['COD', 'ESEWA', 'KHALTI'], {
  message: 'Please select a valid payment method',
});

/**
 * Order item validation schema
 */
export const orderItemSchema = z.object({
  productId: z
    .number({
      message: 'Product ID is required',
    })
    .positive('Invalid product ID'),
  
  variantId: z
    .number()
    .positive('Invalid variant ID')
    .optional(),
  
  quantity: z
    .number({
      message: 'Quantity is required',
    })
    .int('Quantity must be a whole number')
    .positive('Quantity must be at least 1'),
  
  price: z
    .number({
      message: 'Price is required',
    })
    .positive('Price must be greater than 0'),
});

/**
 * Order validation schema
 * Validates complete order information including items, address, and payment
 */
export const orderSchema = z.object({
  items: z
    .array(orderItemSchema)
    .min(1, 'Order must contain at least one item')
    .max(100, 'Order cannot exceed 100 items'),
  
  shippingAddress: addressSchema,
  
  paymentMethod: paymentMethodSchema,
  
  notes: z
    .string()
    .max(500, 'Notes must not exceed 500 characters')
    .optional(),
  
  promoCode: z
    .string()
    .max(50, 'Promo code must not exceed 50 characters')
    .optional(),
});

/**
 * Checkout form validation schema
 * Simplified schema for checkout page form
 */
export const checkoutSchema = z.object({
  shippingAddress: addressSchema,
  paymentMethod: paymentMethodSchema,
  notes: z.string().max(500, 'Notes must not exceed 500 characters').optional(),
  promoCode: z.string().max(50, 'Promo code must not exceed 50 characters').optional(),
  agreeToTerms: z
    .boolean()
    .refine((val) => val === true, 'You must agree to the terms and conditions'),
});

/**
 * Inferred TypeScript types from the order schemas
 */
export type AddressFormData = z.infer<typeof addressSchema>;
export type OrderItemFormData = z.infer<typeof orderItemSchema>;
export type OrderFormData = z.infer<typeof orderSchema>;
export type CheckoutFormData = z.infer<typeof checkoutSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
