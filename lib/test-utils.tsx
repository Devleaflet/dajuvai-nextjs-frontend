import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a custom render function that includes providers
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface AllTheProvidersProps {
  children: ReactNode;
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  const testQueryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { customRender as render };

// Mock data factories for testing
export const mockProduct = {
  id: 1,
  name: 'Test Product',
  title: 'Test Product',
  description: 'Test product description',
  basePrice: 1000,
  price: 800,
  discount: 20,
  discountType: 'PERCENTAGE' as const,
  stock: 10,
  image: '/test-image.jpg',
  productImages: ['/test-image-1.jpg', '/test-image-2.jpg'],
  rating: 4.5,
  ratingCount: 10,
  isBestSeller: false,
  category: {
    id: 1,
    name: 'Test Category',
    slug: 'test-category',
  },
  subcategory: {
    id: 1,
    name: 'Test Subcategory',
    slug: 'test-subcategory',
  },
  vendor: {
    id: 1,
    name: 'Test Vendor',
    email: 'vendor@test.com',
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

export const mockCartItem = {
  id: 1,
  product: mockProduct,
  quantity: 2,
  price: 800,
};

export const mockCart = {
  id: 1,
  items: [mockCartItem],
  totalItems: 2,
  totalPrice: 1600,
};

export const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  phone: '1234567890',
  role: 'USER' as const,
  createdAt: '2024-01-01T00:00:00.000Z',
};

export const mockAddress = {
  id: 1,
  street: '123 Test Street',
  city: 'Test City',
  district: 'Test District',
  postalCode: '12345',
  isDefault: true,
};

export const mockOrder = {
  id: 1,
  orderNumber: 'ORD-001',
  user: mockUser,
  items: [
    {
      id: 1,
      product: mockProduct,
      quantity: 2,
      price: 800,
    },
  ],
  totalAmount: 1600,
  status: 'PENDING' as const,
  paymentMethod: 'COD' as const,
  paymentStatus: 'PENDING' as const,
  shippingAddress: mockAddress,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

// Helper function to create mock products with custom data
export function createMockProduct(overrides?: Partial<typeof mockProduct>) {
  return {
    ...mockProduct,
    ...overrides,
  };
}

// Helper function to create mock cart items
export function createMockCartItem(overrides?: Partial<typeof mockCartItem>) {
  return {
    ...mockCartItem,
    ...overrides,
  };
}

// Helper function to create mock users
export function createMockUser(overrides?: Partial<typeof mockUser>) {
  return {
    ...mockUser,
    ...overrides,
  };
}

// Helper function to create mock orders
export function createMockOrder(overrides?: Partial<typeof mockOrder>) {
  return {
    ...mockOrder,
    ...overrides,
  };
}
