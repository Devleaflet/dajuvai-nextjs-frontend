'use client';

import React from 'react';
import '@/styles/ProductCardSkeleton.css';

/**
 * Improved skeleton component for product cards loading state
 * Matches the final UI structure with proper animations
 */
const ProductCardSkeleton: React.FC<{ count: number }> = ({ count }) => {
  return (
    <>
      {Array(count).fill(null).map((_, index) => (
        <div key={index} className="product-card-skeleton">
          <div className="skeleton-image shimmer" />
          <div className="skeleton-content">
            <div className="skeleton-category shimmer" />
            <div className="skeleton-title shimmer" />
            <div className="skeleton-price-row">
              <div className="skeleton-price shimmer" />
              <div className="skeleton-discount shimmer" />
            </div>
            <div className="skeleton-rating shimmer" />
            <div className="skeleton-actions">
              <div className="skeleton-button shimmer" />
              <div className="skeleton-icon shimmer" />
            </div>
          </div>

          <style jsx>{`
            .product-card-skeleton {
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              transition: transform 0.3s ease, box-shadow 0.3s ease;
            }

            .product-card-skeleton:hover {
              transform: translateY(-4px);
              box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
            }

            .skeleton-image {
              width: 100%;
              height: 250px;
            }

            .skeleton-content {
              padding: 1rem;
            }

            .skeleton-category {
              height: 14px;
              width: 80px;
              border-radius: 4px;
              margin-bottom: 0.5rem;
            }

            .skeleton-title {
              height: 20px;
              width: 90%;
              border-radius: 4px;
              margin-bottom: 0.75rem;
            }

            .skeleton-price-row {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              margin-bottom: 0.75rem;
            }

            .skeleton-price {
              height: 24px;
              width: 80px;
              border-radius: 4px;
            }

            .skeleton-discount {
              height: 20px;
              width: 50px;
              border-radius: 4px;
            }

            .skeleton-rating {
              height: 16px;
              width: 100px;
              border-radius: 4px;
              margin-bottom: 1rem;
            }

            .skeleton-actions {
              display: flex;
              gap: 0.5rem;
              align-items: center;
            }

            .skeleton-button {
              flex: 1;
              height: 40px;
              border-radius: 8px;
            }

            .skeleton-icon {
              width: 40px;
              height: 40px;
              border-radius: 8px;
            }

            .shimmer {
              background: linear-gradient(
                90deg,
                #f0f0f0 25%,
                #e0e0e0 50%,
                #f0f0f0 75%
              );
              background-size: 200% 100%;
              animation: shimmer 1.5s infinite;
            }

            @keyframes shimmer {
              0% {
                background-position: 200% 0;
              }
              100% {
                background-position: -200% 0;
              }
            }

            @media (max-width: 768px) {
              .skeleton-image {
                height: 180px;
              }

              .skeleton-content {
                padding: 0.75rem;
              }
            }
          `}</style>
        </div>
      ))}
    </>
  );
};

export default ProductCardSkeleton;
