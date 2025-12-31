/**
 * Pricing utility functions for calculating discounted prices
 */

export interface PricingResult {
  currentPrice: number;
  originalPrice: number;
  discountLabel: string | null;
}

/**
 * Calculate the discounted price for a product
 * 
 * @param basePrice - The original price before discount
 * @param discount - The discount value (percentage or fixed amount)
 * @param discountType - The type of discount ('PERCENTAGE', 'FIXED', or 'FLAT')
 * @returns Object containing currentPrice, originalPrice, and discountLabel
 * 
 * @example
 * // Percentage discount
 * calculateDiscountedPrice(1000, 20, 'PERCENTAGE')
 * // Returns: { currentPrice: 800, originalPrice: 1000, discountLabel: '20%' }
 * 
 * @example
 * // Fixed discount
 * calculateDiscountedPrice(1000, 100, 'FIXED')
 * // Returns: { currentPrice: 900, originalPrice: 1000, discountLabel: 'Rs 100' }
 * 
 * @example
 * // No discount
 * calculateDiscountedPrice(1000, 0, null)
 * // Returns: { currentPrice: 1000, originalPrice: 1000, discountLabel: null }
 */
export function calculateDiscountedPrice(
  basePrice: number | string,
  discount?: number | string | null,
  discountType?: string | null
): PricingResult {
  // Parse base price
  const base = typeof basePrice === 'string' 
    ? parseFloat(basePrice) 
    : Number(basePrice) || 0;

  // If no discount or invalid discount, return base price
  if (!discount || !discountType) {
    return {
      currentPrice: base,
      originalPrice: base,
      discountLabel: null
    };
  }

  // Parse discount value
  const discountValue = typeof discount === 'string' 
    ? parseFloat(discount) 
    : Number(discount) || 0;

  // If discount is 0 or negative, return base price
  if (discountValue <= 0) {
    return {
      currentPrice: base,
      originalPrice: base,
      discountLabel: null
    };
  }

  let currentPrice = base;
  let discountLabel: string | null = null;

  // Calculate based on discount type
  if (discountType === 'PERCENTAGE') {
    currentPrice = base * (1 - discountValue / 100);
    discountLabel = `${discountValue}%`;
  } else if (discountType === 'FIXED' || discountType === 'FLAT') {
    currentPrice = base - discountValue;
    discountLabel = `Rs ${discountValue}`;
  } else {
    // Unknown discount type, return base price
    return {
      currentPrice: base,
      originalPrice: base,
      discountLabel: null
    };
  }

  // Ensure current price never goes below 0
  currentPrice = Math.max(0, currentPrice);

  return {
    currentPrice,
    originalPrice: base,
    discountLabel
  };
}
