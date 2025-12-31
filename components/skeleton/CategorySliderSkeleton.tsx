'use client';

import React from 'react';

/**
 * Skeleton component for CategorySlider loading state
 */
const CategorySliderSkeleton: React.FC = () => {
  return (
    <div className="category-slider-skeleton">
      <div className="skeleton-title shimmer" />
      <div className="skeleton-categories">
        {Array(8).fill(null).map((_, index) => (
          <div key={index} className="skeleton-category">
            <div className="skeleton-category-icon shimmer" />
            <div className="skeleton-category-name shimmer" />
          </div>
        ))}
      </div>

      <style jsx>{`
        .category-slider-skeleton {
          padding: 2rem 1rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .skeleton-title {
          height: 32px;
          width: 200px;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .skeleton-categories {
          display: flex;
          gap: 1rem;
          overflow-x: auto;
          padding-bottom: 1rem;
        }

        .skeleton-category {
          flex: 0 0 auto;
          width: 120px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .skeleton-category-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
        }

        .skeleton-category-name {
          height: 16px;
          width: 100px;
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
      `}</style>
    </div>
  );
};

export default CategorySliderSkeleton;
