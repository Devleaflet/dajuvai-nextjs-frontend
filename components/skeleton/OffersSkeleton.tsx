'use client';

import React from 'react';

/**
 * Improved skeleton component for special offers loading state
 * Matches the final UI structure with proper animations
 */
const OffersSkeleton: React.FC = () => {
  return (
    <div className="offers-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-title shimmer" />
        <div className="skeleton-subtitle shimmer" />
      </div>
      <div className="offers-grid">
        {Array(6).fill(null).map((_, index) => (
          <div key={index} className="offer-card-skeleton">
            <div className="skeleton-image shimmer" />
            <div className="skeleton-content">
              <div className="skeleton-offer-title shimmer" />
              <div className="skeleton-offer-desc shimmer" />
              <div className="skeleton-offer-price shimmer" />
              <div className="skeleton-offer-button shimmer" />
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .offers-skeleton {
          padding: 2rem 1rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .skeleton-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .skeleton-title {
          height: 36px;
          width: 300px;
          margin: 0 auto 1rem;
          border-radius: 8px;
        }

        .skeleton-subtitle {
          height: 20px;
          width: 400px;
          margin: 0 auto;
          border-radius: 4px;
        }

        .offers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .offer-card-skeleton {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .skeleton-image {
          width: 100%;
          height: 200px;
        }

        .skeleton-content {
          padding: 1.5rem;
        }

        .skeleton-offer-title {
          height: 24px;
          width: 80%;
          border-radius: 4px;
          margin-bottom: 0.75rem;
        }

        .skeleton-offer-desc {
          height: 16px;
          width: 100%;
          border-radius: 4px;
          margin-bottom: 0.5rem;
        }

        .skeleton-offer-price {
          height: 28px;
          width: 60%;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .skeleton-offer-button {
          height: 40px;
          width: 100%;
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
          .skeleton-subtitle {
            width: 90%;
          }

          .offers-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 1rem;
          }

          .skeleton-image {
            height: 150px;
          }
        }
      `}</style>
    </div>
  );
};

export default OffersSkeleton;
