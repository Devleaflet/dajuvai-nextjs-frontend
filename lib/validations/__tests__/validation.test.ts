import { describe, it, expect } from 'vitest';
import { productSchema } from '../product.schema';
import { loginSchema, registerSchema } from '../auth.schema';
import { orderSchema, addressSchema, checkoutSchema } from '../order.schema';

describe('Product Validation Schema', () => {
  it('should validate a valid product', () => {
    const validProduct = {
      name: 'Test Product',
      description: 'This is a test product description',
      basePrice: 100,
      stock: 10,
      categoryId: 1,
      subcategoryId: 1,
    };

    const result = productSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it('should reject product with short name', () => {
    const invalidProduct = {
      name: 'AB',
      description: 'This is a test product description',
      basePrice: 100,
      stock: 10,
      categoryId: 1,
      subcategoryId: 1,
    };

    const result = productSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });

  it('should reject product with negative price', () => {
    const invalidProduct = {
      name: 'Test Product',
      description: 'This is a test product description',
      basePrice: -10,
      stock: 10,
      categoryId: 1,
      subcategoryId: 1,
    };

    const result = productSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });

  it('should accept product with optional discount', () => {
    const validProduct = {
      name: 'Test Product',
      description: 'This is a test product description',
      basePrice: 100,
      stock: 10,
      discount: 20,
      discountType: 'PERCENTAGE' as const,
      categoryId: 1,
      subcategoryId: 1,
    };

    const result = productSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });
});

describe('Auth Validation Schemas', () => {
  describe('Login Schema', () => {
    it('should validate valid login credentials', () => {
      const validLogin = {
        email: 'test@example.com',
        password: 'Password123',
      };

      const result = loginSchema.safeParse(validLogin);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidLogin = {
        email: 'not-an-email',
        password: 'Password123',
      };

      const result = loginSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const invalidLogin = {
        email: 'test@example.com',
        password: 'short',
      };

      const result = loginSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
    });
  });

  describe('Register Schema', () => {
    it('should validate valid registration data', () => {
      const validRegister = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        name: 'John Doe',
      };

      const result = registerSchema.safeParse(validRegister);
      expect(result.success).toBe(true);
    });

    it('should reject weak password', () => {
      const invalidRegister = {
        email: 'test@example.com',
        password: 'password',
        confirmPassword: 'password',
        name: 'John Doe',
      };

      const result = registerSchema.safeParse(invalidRegister);
      expect(result.success).toBe(false);
    });

    it('should reject mismatched passwords', () => {
      const invalidRegister = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!',
        name: 'John Doe',
      };

      const result = registerSchema.safeParse(invalidRegister);
      expect(result.success).toBe(false);
    });

    it('should validate optional phone number', () => {
      const validRegister = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        name: 'John Doe',
        phone: '9812345678',
      };

      const result = registerSchema.safeParse(validRegister);
      expect(result.success).toBe(true);
    });
  });
});

describe('Order Validation Schemas', () => {
  describe('Address Schema', () => {
    it('should validate valid address', () => {
      const validAddress = {
        street: '123 Main Street',
        city: 'Kathmandu',
        district: 'Kathmandu',
      };

      const result = addressSchema.safeParse(validAddress);
      expect(result.success).toBe(true);
    });

    it('should reject short street address', () => {
      const invalidAddress = {
        street: 'St',
        city: 'Kathmandu',
        district: 'Kathmandu',
      };

      const result = addressSchema.safeParse(invalidAddress);
      expect(result.success).toBe(false);
    });
  });

  describe('Checkout Schema', () => {
    it('should validate valid checkout data', () => {
      const validCheckout = {
        shippingAddress: {
          street: '123 Main Street',
          city: 'Kathmandu',
          district: 'Kathmandu',
        },
        paymentMethod: 'COD' as const,
        agreeToTerms: true,
      };

      const result = checkoutSchema.safeParse(validCheckout);
      expect(result.success).toBe(true);
    });

    it('should reject checkout without terms agreement', () => {
      const invalidCheckout = {
        shippingAddress: {
          street: '123 Main Street',
          city: 'Kathmandu',
          district: 'Kathmandu',
        },
        paymentMethod: 'COD' as const,
        agreeToTerms: false,
      };

      const result = checkoutSchema.safeParse(invalidCheckout);
      expect(result.success).toBe(false);
    });

    it('should accept valid payment methods', () => {
      const paymentMethods = ['COD', 'ESEWA', 'KHALTI'] as const;

      paymentMethods.forEach((method) => {
        const checkout = {
          shippingAddress: {
            street: '123 Main Street',
            city: 'Kathmandu',
            district: 'Kathmandu',
          },
          paymentMethod: method,
          agreeToTerms: true,
        };

        const result = checkoutSchema.safeParse(checkout);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Order Schema', () => {
    it('should validate valid order', () => {
      const validOrder = {
        items: [
          {
            productId: 1,
            quantity: 2,
            price: 100,
          },
        ],
        shippingAddress: {
          street: '123 Main Street',
          city: 'Kathmandu',
          district: 'Kathmandu',
        },
        paymentMethod: 'COD' as const,
      };

      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it('should reject order with no items', () => {
      const invalidOrder = {
        items: [],
        shippingAddress: {
          street: '123 Main Street',
          city: 'Kathmandu',
          district: 'Kathmandu',
        },
        paymentMethod: 'COD' as const,
      };

      const result = orderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });
  });
});
