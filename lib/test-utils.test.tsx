import { describe, it, expect } from 'vitest';
import { render, screen, mockProduct, createMockProduct } from './test-utils';

describe('Test Utilities', () => {
  it('should render a simple component', () => {
    const TestComponent = () => <div>Hello Test</div>;
    render(<TestComponent />);
    expect(screen.getByText('Hello Test')).toBeInTheDocument();
  });

  it('should provide mock product data', () => {
    expect(mockProduct).toBeDefined();
    expect(mockProduct.name).toBe('Test Product');
    expect(mockProduct.price).toBe(800);
  });

  it('should create custom mock products', () => {
    const customProduct = createMockProduct({ name: 'Custom Product', price: 500 });
    expect(customProduct.name).toBe('Custom Product');
    expect(customProduct.price).toBe(500);
    expect(customProduct.id).toBe(mockProduct.id); // Other fields should remain
  });
});
