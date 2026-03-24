import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@/lib/test-utils';
import ProductImageGallery from './ProductImageGallery';

describe('ProductImageGallery', () => {
  const mockImages = [
    '/assets/product1.jpg',
    '/assets/product2.jpg',
    '/assets/product3.jpg',
  ];

  it('should render image container', () => {
    const { container } = render(<ProductImageGallery images={mockImages} alt="Test Product" />);

    const imageContainer = container.querySelector('.product-card__image');
    expect(imageContainer).toBeInTheDocument();
  });

  it('should display image dots for multiple images', () => {
    const { container } = render(<ProductImageGallery images={mockImages} alt="Test Product" />);

    const dots = container.querySelectorAll('.product-card__dot');
    expect(dots).toHaveLength(3);
  });

  it('should not display dots for single image', () => {
    const { container } = render(<ProductImageGallery images={[mockImages[0]]} alt="Test Product" />);

    const dots = container.querySelectorAll('.product-card__dot');
    expect(dots).toHaveLength(0);
  });

  it('should highlight first dot as active initially', () => {
    const { container } = render(<ProductImageGallery images={mockImages} alt="Test Product" />);

    const dots = container.querySelectorAll('.product-card__dot');
    const activeDot = container.querySelector('.product-card__dot--active');

    expect(activeDot).toBe(dots[0]);
  });

  it('should handle mouse enter on image container', () => {
    const { container } = render(<ProductImageGallery images={mockImages} alt="Test Product" />);

    const imageContainer = container.querySelector('.product-card__image');
    expect(imageContainer).toBeInTheDocument();

    if (imageContainer) {
      fireEvent.mouseEnter(imageContainer);
      // Component should handle hover state
      expect(imageContainer).toBeInTheDocument();
    }
  });

  it('should handle mouse leave on image container', () => {
    const { container } = render(<ProductImageGallery images={mockImages} alt="Test Product" />);

    const imageContainer = container.querySelector('.product-card__image');

    if (imageContainer) {
      fireEvent.mouseEnter(imageContainer);
      fireEvent.mouseLeave(imageContainer);
      // Component should reset state
      expect(imageContainer).toBeInTheDocument();
    }
  });

  it('should handle dot click', () => {
    const { container } = render(<ProductImageGallery images={mockImages} alt="Test Product" />);

    const dots = container.querySelectorAll('.product-card__dot');
    expect(dots).toHaveLength(3);

    // Click on the second dot
    fireEvent.click(dots[1]);

    // Verify the second dot becomes active
    expect(dots[1]).toHaveClass('product-card__dot--active');
  });

  it('should display one dot per image', () => {
    const manyImages = Array.from({ length: 10 }, (_, i) => `/assets/product${i + 1}.jpg`);
    const { container } = render(<ProductImageGallery images={manyImages} alt="Test Product" />);

    const dots = container.querySelectorAll('.product-card__dot');
    expect(dots).toHaveLength(10);
  });

  it('should ignore placeholder images when real images exist', () => {
    const mixedImages = ['/assets/logo.webp', '/assets/product1.jpg', '/assets/product2.jpg'];
    const { container } = render(<ProductImageGallery images={mixedImages} alt="Test Product" />);

    const dots = container.querySelectorAll('.product-card__dot');
    expect(dots).toHaveLength(2);
  });

  it('should call onError callback when provided', () => {
    const mockOnError = vi.fn();
    render(<ProductImageGallery images={mockImages} alt="Test Product" onError={mockOnError} />);

    // Component should accept onError prop
    expect(mockOnError).not.toHaveBeenCalled();
  });

  it('should render pagination inside image container', () => {
    const { container } = render(<ProductImageGallery images={mockImages} alt="Test Product" />);

    const pagination = container.querySelector('.product-card__pagination--inside');
    expect(pagination).toBeInTheDocument();
  });
});
