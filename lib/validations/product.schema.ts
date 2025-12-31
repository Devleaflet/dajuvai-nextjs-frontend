import { z } from 'zod';

/**
 * Product validation schema for form validation
 * Ensures all product data meets business requirements
 */
export const productSchema = z.object({
  name: z
    .string()
    .min(3, 'Product name must be at least 3 characters')
    .max(200, 'Product name must not exceed 200 characters'),
  
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must not exceed 5000 characters'),
  
  basePrice: z
    .number({
      message: 'Base price is required',
    })
    .positive('Base price must be greater than 0'),
  
  stock: z
    .number({
      message: 'Stock is required',
    })
    .int('Stock must be a whole number')
    .nonnegative('Stock cannot be negative'),
  
  discount: z
    .number()
    .min(0, 'Discount cannot be negative')
    .max(100, 'Discount cannot exceed 100')
    .optional(),
  
  discountType: z
    .enum(['PERCENTAGE', 'FIXED'], {
      message: 'Discount type must be either PERCENTAGE or FIXED',
    })
    .optional(),
  
  categoryId: z
    .number({
      message: 'Category is required',
    })
    .positive('Please select a valid category'),
  
  subcategoryId: z
    .number({
      message: 'Subcategory is required',
    })
    .positive('Please select a valid subcategory'),
});

/**
 * Inferred TypeScript type from the product schema
 * Use this type for form data throughout the application
 */
export type ProductFormData = z.infer<typeof productSchema>;
