import { describe, it, expect } from 'vitest';
import { calculateDiscountedPrice } from './pricing';

describe('calculateDiscountedPrice', () => {
  describe('Percentage discount', () => {
    it('should calculate percentage discount correctly', () => {
      const result = calculateDiscountedPrice(1000, 20, 'PERCENTAGE');
      expect(result.currentPrice).toBe(800);
      expect(result.originalPrice).toBe(1000);
      expect(result.discountLabel).toBe('20%');
    });

    it('should handle 50% discount', () => {
      const result = calculateDiscountedPrice(1000, 50, 'PERCENTAGE');
      expect(result.currentPrice).toBe(500);
      expect(result.originalPrice).toBe(1000);
      expect(result.discountLabel).toBe('50%');
    });

    it('should handle 100% discount', () => {
      const result = calculateDiscountedPrice(1000, 100, 'PERCENTAGE');
      expect(result.currentPrice).toBe(0);
      expect(result.originalPrice).toBe(1000);
      expect(result.discountLabel).toBe('100%');
    });

    it('should handle decimal percentage discount', () => {
      const result = calculateDiscountedPrice(1000, 15.5, 'PERCENTAGE');
      expect(result.currentPrice).toBe(845);
      expect(result.originalPrice).toBe(1000);
      expect(result.discountLabel).toBe('15.5%');
    });
  });

  describe('Fixed discount', () => {
    it('should calculate fixed discount correctly', () => {
      const result = calculateDiscountedPrice(1000, 100, 'FIXED');
      expect(result.currentPrice).toBe(900);
      expect(result.originalPrice).toBe(1000);
      expect(result.discountLabel).toBe('Rs 100');
    });

    it('should handle FLAT discount type (alias for FIXED)', () => {
      const result = calculateDiscountedPrice(1000, 100, 'FLAT');
      expect(result.currentPrice).toBe(900);
      expect(result.originalPrice).toBe(1000);
      expect(result.discountLabel).toBe('Rs 100');
    });

    it('should handle decimal fixed discount', () => {
      const result = calculateDiscountedPrice(1000, 150.75, 'FIXED');
      expect(result.currentPrice).toBe(849.25);
      expect(result.originalPrice).toBe(1000);
      expect(result.discountLabel).toBe('Rs 150.75');
    });
  });

  describe('No discount', () => {
    it('should return base price when discount is 0', () => {
      const result = calculateDiscountedPrice(1000, 0, 'PERCENTAGE');
      expect(result.currentPrice).toBe(1000);
      expect(result.originalPrice).toBe(1000);
      expect(result.discountLabel).toBeNull();
    });

    it('should return base price when discount is null', () => {
      const result = calculateDiscountedPrice(1000, null, 'PERCENTAGE');
      expect(result.currentPrice).toBe(1000);
      expect(result.originalPrice).toBe(1000);
      expect(result.discountLabel).toBeNull();
    });

    it('should return base price when discountType is null', () => {
      const result = calculateDiscountedPrice(1000, 20, null);
      expect(result.currentPrice).toBe(1000);
      expect(result.originalPrice).toBe(1000);
      expect(result.discountLabel).toBeNull();
    });

    it('should return base price when both discount and discountType are null', () => {
      const result = calculateDiscountedPrice(1000, null, null);
      expect(result.currentPrice).toBe(1000);
      expect(result.originalPrice).toBe(1000);
      expect(result.discountLabel).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should handle negative discount (should be ignored)', () => {
      const result = calculateDiscountedPrice(1000, -20, 'PERCENTAGE');
      expect(result.currentPrice).toBe(1000);
      expect(result.originalPrice).toBe(1000);
      expect(result.discountLabel).toBeNull();
    });

    it('should not allow price to go below 0 with large percentage discount', () => {
      const result = calculateDiscountedPrice(1000, 150, 'PERCENTAGE');
      expect(result.currentPrice).toBe(0);
      expect(result.originalPrice).toBe(1000);
      expect(result.discountLabel).toBe('150%');
    });

    it('should not allow price to go below 0 with large fixed discount', () => {
      const result = calculateDiscountedPrice(1000, 1500, 'FIXED');
      expect(result.currentPrice).toBe(0);
      expect(result.originalPrice).toBe(1000);
      expect(result.discountLabel).toBe('Rs 1500');
    });

    it('should handle string basePrice', () => {
      const result = calculateDiscountedPrice('1000', 20, 'PERCENTAGE');
      expect(result.currentPrice).toBe(800);
      expect(result.originalPrice).toBe(1000);
      expect(result.discountLabel).toBe('20%');
    });

    it('should handle string discount', () => {
      const result = calculateDiscountedPrice(1000, '20', 'PERCENTAGE');
      expect(result.currentPrice).toBe(800);
      expect(result.originalPrice).toBe(1000);
      expect(result.discountLabel).toBe('20%');
    });

    it('should handle invalid basePrice (NaN)', () => {
      const result = calculateDiscountedPrice('invalid', 20, 'PERCENTAGE');
      expect(result.currentPrice).toBeNaN();
      expect(result.originalPrice).toBeNaN();
      expect(result.discountLabel).toBe('20%');
    });

    it('should handle invalid discount (NaN)', () => {
      const result = calculateDiscountedPrice(1000, 'invalid', 'PERCENTAGE');
      expect(result.currentPrice).toBeNaN();
      expect(result.originalPrice).toBe(1000);
      expect(result.discountLabel).toBe('NaN%');
    });

    it('should handle unknown discount type', () => {
      const result = calculateDiscountedPrice(1000, 20, 'UNKNOWN');
      expect(result.currentPrice).toBe(1000);
      expect(result.originalPrice).toBe(1000);
      expect(result.discountLabel).toBeNull();
    });

    it('should handle zero base price', () => {
      const result = calculateDiscountedPrice(0, 20, 'PERCENTAGE');
      expect(result.currentPrice).toBe(0);
      expect(result.originalPrice).toBe(0);
      expect(result.discountLabel).toBe('20%');
    });

    it('should handle very small prices', () => {
      const result = calculateDiscountedPrice(0.5, 20, 'PERCENTAGE');
      expect(result.currentPrice).toBe(0.4);
      expect(result.originalPrice).toBe(0.5);
      expect(result.discountLabel).toBe('20%');
    });

    it('should handle very large prices', () => {
      const result = calculateDiscountedPrice(1000000, 20, 'PERCENTAGE');
      expect(result.currentPrice).toBe(800000);
      expect(result.originalPrice).toBe(1000000);
      expect(result.discountLabel).toBe('20%');
    });
  });
});
