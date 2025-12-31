'use client';

import React from 'react';

/**
 * Skeleton component for HomepageSections loading state
 */
const HomepageSectionsSkeleton: React.FC = () => {
  return (
    <div className="homepage-sections-skeleton">
      {Array(3).fill(null).map((_, sectionIndex) => (
        <div key={sectionIndex} className="skeleton-section">
          <div className="skeleton-section-header">
            <div className="skeleton-section-title shimmer" />
            <div className="skeleton-view-all shimmer" />
          </div>
          <div className="skeleton-products-grid">
            {Array(4).fill(null).map((_, productIndex) => (
              <div key={productIndex} className="skeleton-product-card">
                <div className="skeleton-product-image shimmer" />
                <div className="skeleton-product-info">
                  <div className="skeleton-product-name shimmer" />
                  <div className="skeleton-product-price shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <style jsx>{`
        .homepage-sections-skeleton {
          padding: 2rem 1rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .skeleton-section {
          margin-bottom: 3rem;
        }

        .skeleton-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .skeleton-section-title {
          height: 28px;
          width: 250px;
          border-radius: 8px;
        }

        .skeleton-view-all {
          height: 20px;
          width: 80px;
          border-radius: 4px;
        }

        .skeleton-products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .skeleton-product-card {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .skeleton-product-image {
          width: 100%;
          height: 250px;
        }

        .skeleton-product-info {
          padding: 1rem;
        }

        .skeleton-product-name {
          height: 20px;
          width: 80%;
          border-radius: 4px;
          margin-bottom: 0.5rem;
        }

        .skeleton-product-price {
          height: 24px;
          width: 60%;
          border-radius: 4px;
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
          .skeleton-products-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 1rem;
          }

          .skeleton-product-image {
            height: 150px;
          }
        }
      `}</style>
    </div>
  );
};

export default HomepageSectionsSkeleton;
