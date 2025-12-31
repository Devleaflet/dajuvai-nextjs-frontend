import React from 'react';
import ProductPageSkeleton from '@/components/skeleton/ProductPageSkeleton';

/**
 * Loading state for individual product pages
 * Displays a skeleton that matches the product page layout
 */
export default function ProductPageLoading() {
  return <ProductPageSkeleton />;
}
