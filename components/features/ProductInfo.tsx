'use client';

import React from 'react';
import { PricingResult } from '@/lib/utils/pricing';
import { sanitizeHtml } from '@/lib/utils/sanitize';

interface ProductInfoProps {
  product: {
    title: string;
    description?: string;
    rating?: number;
    ratingCount?: number | string;
    discount?: number | string;
    vendor?: {
      name?: string;
    } | string;
  };
  pricing: PricingResult;
}

const ProductInfo: React.FC<ProductInfoProps> = ({ product, pricing }) => {     
  const { title, description, rating, ratingCount } = product;
  const { currentPrice, originalPrice } = pricing;
  const hasDiscount = originalPrice > currentPrice;
  const savedAmount = Math.max(0, originalPrice - currentPrice);
  const safeRating = Number.isFinite(Number(rating)) ? Number(rating) : 0;
  const safeRatingCount = Number.isFinite(Number(ratingCount)) ? Number(ratingCount) : 0;
  const safeCurrentPrice = Number.isFinite(Number(currentPrice)) ? Number(currentPrice) : 0;
  const safeOriginalPrice = Number.isFinite(Number(originalPrice)) ? Number(originalPrice) : 0;

  const formatPrice = (value: number) =>
    value.toLocaleString('en-IN', { maximumFractionDigits: 2 });

  return (
    <div className="product__info pt-2">
      <div className="product-card__rating mb-1">
        <span className="product-card__rating-star text-[#16a34a] leading-none">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.88L18.18 22 12 18.77 5.82 22 7 14.15l-5-4.88 6.91-1.01L12 2z" />
          </svg>
        </span>
        <div className="product-card__rating-info text-[12px]">
          <span className="product-card__rating-score">{safeRating}</span>
          <span className="mx-1 text-gray-400">|</span>
          <span className="product-card__rating-count">({safeRatingCount})</span>
        </div>
      </div>

      <div className="product-card__info">
        <h3 className="product-card__title text-[14px]" title={title}>
          {title}
        </h3>
        {description && (
          <p
            className="product-card__description"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(description.replace(/<[^>]*>?/gm, '')) }}
          />
        )}

        <div className="product-card__price mt-2">
          <span className="product-card__current-price">
            Rs {formatPrice(safeCurrentPrice)}
          </span>
          {hasDiscount && (
            <div className="product-card__price-details">
              <span className="product-card__original-price">Rs {formatPrice(safeOriginalPrice)}</span>
              <span className="product-card__discount">Save Rs {savedAmount.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
