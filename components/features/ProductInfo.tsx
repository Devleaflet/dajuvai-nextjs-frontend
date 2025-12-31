'use client';

import React from 'react';
import Image from 'next/image';
import { PricingResult } from '@/lib/utils/pricing';
import { sanitizeHtml } from '@/lib/utils/sanitize';

interface ProductInfoProps {
  product: {
    title: string;
    description?: string;
    rating?: number;
    ratingCount?: number;
    discount?: number | string;
    vendor?: {
      name?: string;
    } | string;
  };
  pricing: PricingResult;
}

/**
 * ProductInfo component displays product details including name, price, discount, and vendor
 */
const ProductInfo: React.FC<ProductInfoProps> = ({ product, pricing }) => {
  const { title, description, rating, ratingCount, discount, vendor } = product;
  const { currentPrice, originalPrice, discountLabel } = pricing;

  return (
    <div className="product__info">
      <div className="product-card__rating">
        <span className="product-card__rating-star">
          <Image
            src="/assets/star.png"
            alt="Rating"
            width={16}
            height={16}
          />
        </span>
        <div className="product-card__rating-info">
          <span className="product-card__rating-score">{rating || 0} |</span>
          <span className="product-card__rating-count"> ({ratingCount || 0})</span>
        </div>
      </div>

      <div className="product-card__info">
        <h3 className="product-card__title" title={title}>
          {title}
        </h3>
        {description && (
          <p className="product-card__description" dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }} />
        )}
        <div className="product-card__price">
          <span className="product-card__current-price">
            Rs {currentPrice.toFixed(2)}
          </span>
          <div className="product-card__price-details">
            {originalPrice > currentPrice && (
              <span className="product-card__original-price">
                {originalPrice.toFixed(2)}
              </span>
            )}
            {discountLabel && Number(discount) !== 0 && discount !== '0' && (
              <span className="product-card__discount">{discountLabel}</span>
            )}
          </div>
        </div>
        {vendor && typeof vendor === 'object' && vendor.name && (
          <p className="product-card__vendor">by {vendor.name}</p>
        )}
      </div>
    </div>
  );
};

export default ProductInfo;
