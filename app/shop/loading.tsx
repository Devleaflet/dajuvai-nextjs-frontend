import React from 'react';
import ProductCardSkeleton from '@/components/skeleton/ProductCardSkeleton';

/**
 * Loading state for the shop page
 * Displays a grid of product card skeletons while data is being fetched
 */
export default function ShopLoading() {
  return (
    <div className="shop-loading-container">
      <div className="product-grid">
        <ProductCardSkeleton count={12} />
      </div>
    </div>
  );
}
