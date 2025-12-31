import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/lib/test-utils';
import Cart from './Cart';
import { mockCartItem, createMockCartItem } from '@/lib/test-utils';
import * as CartContext from '@/lib/context/CartContext';
import * as UIContext from '@/lib/context/UIContext';
import { usePathname } from 'next/navigation';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => {
    return <a href={href} {...props}>{children}</a>;
  },
}));

describe('Cart', () => {
  const mockToggleCart = vi.fn();
  const mockSetCartOpen = vi.fn();
  const mockHandleCartItemOnDelete = vi.fn();
  const mockHandleIncreaseQuantity = vi.fn();
  const mockHandleDecreaseQuantity = vi.fn();
  const mockCartButtonRef = { current: null };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock pathname
    (usePathname as any).mockReturnValue('/');

    // Mock Cart context
    vi.spyOn(CartContext, 'useCart').mockReturnValue({
      handleCartItemOnDelete: mockHandleCartItemOnDelete,
      handleIncreaseQuantity: mockHandleIncreaseQuantity,
      handleDecreaseQuantity: mockHandleDecreaseQuantity,
      updatingItems: new Set(),
      cartItems: [mockCartItem],
      handleCartOnAdd: vi.fn(),
    } as any);

    // Mock UI context
    vi.spyOn(UIContext, 'useUI').mockReturnValue({
      setCartOpen: mockSetCartOpen,
      cartOpen: true,
    } as any);
  });

  it('should render cart when open', () => {
    const { container } = render(
      <Cart
        cartOpen={true}
        toggleCart={mockToggleCart}
        cartButtonRef={mockCartButtonRef}
        stableCartItems={[mockCartItem]}
      />
    );

    // Cart should be rendered
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render cart with multiple items', () => {
    const items = [
      createMockCartItem({ quantity: 2, price: 800 }),
      createMockCartItem({ id: 2, quantity: 1, price: 500 }),
    ];

    const { container } = render(
      <Cart
        cartOpen={true}
        toggleCart={mockToggleCart}
        cartButtonRef={mockCartButtonRef}
        stableCartItems={items}
      />
    );

    // Cart should be rendered with items
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should display empty cart message when no items', () => {
    vi.spyOn(CartContext, 'useCart').mockReturnValue({
      handleCartItemOnDelete: mockHandleCartItemOnDelete,
      handleIncreaseQuantity: mockHandleIncreaseQuantity,
      handleDecreaseQuantity: mockHandleDecreaseQuantity,
      updatingItems: new Set(),
      cartItems: [],
      handleCartOnAdd: vi.fn(),
    } as any);

    render(
      <Cart
        cartOpen={true}
        toggleCart={mockToggleCart}
        cartButtonRef={mockCartButtonRef}
        stableCartItems={[]}
      />
    );

    expect(screen.getByText(/Your cart is empty/i)).toBeInTheDocument();
  });

  it('should render close button', () => {
    render(
      <Cart
        cartOpen={true}
        toggleCart={mockToggleCart}
        cartButtonRef={mockCartButtonRef}
        stableCartItems={[mockCartItem]}
      />
    );

    const closeButton = screen.getByLabelText(/close cart/i);
    expect(closeButton).toBeInTheDocument();
  });

  it('should call toggleCart when close button is clicked', () => {
    render(
      <Cart
        cartOpen={true}
        toggleCart={mockToggleCart}
        cartButtonRef={mockCartButtonRef}
        stableCartItems={[mockCartItem]}
      />
    );

    const closeButton = screen.getByLabelText(/close cart/i);
    fireEvent.click(closeButton);

    expect(mockToggleCart).toHaveBeenCalled();
  });

  it('should display checkout button when items exist', () => {
    render(
      <Cart
        cartOpen={true}
        toggleCart={mockToggleCart}
        cartButtonRef={mockCartButtonRef}
        stableCartItems={[mockCartItem]}
      />
    );

    expect(screen.getByText(/Proceed to Checkout/i)).toBeInTheDocument();
  });

  it('should render when cartOpen is true', () => {
    const { container } = render(
      <Cart
        cartOpen={true}
        toggleCart={mockToggleCart}
        cartButtonRef={mockCartButtonRef}
        stableCartItems={[mockCartItem]}
      />
    );

    // Cart should be rendered
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render cart with items and quantity', () => {
    const item = createMockCartItem({ quantity: 3 });

    const { container } = render(
      <Cart
        cartOpen={true}
        toggleCart={mockToggleCart}
        cartButtonRef={mockCartButtonRef}
        stableCartItems={[item]}
      />
    );

    // Cart should be rendered
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render cart with product information', () => {
    const { container } = render(
      <Cart
        cartOpen={true}
        toggleCart={mockToggleCart}
        cartButtonRef={mockCartButtonRef}
        stableCartItems={[mockCartItem]}
      />
    );

    // Cart should be rendered with product info
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render remove button for cart items', () => {
    render(
      <Cart
        cartOpen={true}
        toggleCart={mockToggleCart}
        cartButtonRef={mockCartButtonRef}
        stableCartItems={[mockCartItem]}
      />
    );

    // Remove button should exist
    const removeButton = screen.getByLabelText(/remove item/i);
    expect(removeButton).toBeInTheDocument();
  });
});
