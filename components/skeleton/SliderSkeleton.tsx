'use client';

import React from 'react';
import '@/styles/SliderSkeleton.css';

/**
 * Improved skeleton component for slider loading state
 * Matches the final UI structure with proper animations
 */
const SliderSkeleton: React.FC = () => {
  return (
    <div className="slider-skeleton">
      <div className="skeleton-slide shimmer" />
      <div className="skeleton-navigation">
        <div className="skeleton-nav-button shimmer" />
        <div className="skeleton-nav-button shimmer" />
      </div>
      <div className="skeleton-indicators">
        {Array(3).fill(null).map((_, index) => (
          <div key={index} className="skeleton-indicator shimmer" />
        ))}
      </div>

      <style jsx>{`
        .slider-skeleton {
          width: 100%;
          height: 500px;
          background: #f5f5f5;
          position: relative;
          overflow: hidden;
          border-radius: 8px;
        }

        .skeleton-slide {
          width: 100%;
          height: 100%;
        }

        .skeleton-navigation {
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          transform: translateY(-50%);
          display: flex;
          justify-content: space-between;
          padding: 0 1rem;
        }

        .skeleton-nav-button {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.8);
        }

        .skeleton-indicators {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 10px;
        }

        .skeleton-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.6);
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
          .slider-skeleton {
            height: 300px;
          }

          .skeleton-nav-button {
            width: 32px;
            height: 32px;
          }
        }
      `}</style>
    </div>
  );
};

export default SliderSkeleton;
