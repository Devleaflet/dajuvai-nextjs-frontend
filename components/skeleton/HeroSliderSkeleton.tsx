'use client';

import React from 'react';
import '@/styles/Skeleton.css';

/**
 * Skeleton component for HeroSlider loading state
 */
const HeroSliderSkeleton: React.FC = () => {
  return (
    <div className="hero-slider-skeleton">
      <div className="skeleton-slide shimmer" />
      <div className="skeleton-dots">
        {Array(3).fill(null).map((_, index) => (
          <div key={index} className="skeleton-dot shimmer" />
        ))}
      </div>

      <style jsx>{`
        .hero-slider-skeleton {
          width: 100%;
          height: 500px;
          background: #f5f5f5;
          position: relative;
          overflow: hidden;
        }

        .skeleton-slide {
          width: 100%;
          height: 100%;
        }

        .skeleton-dots {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 10px;
        }

        .skeleton-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
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
          .hero-slider-skeleton {
            height: 300px;
          }
        }
      `}</style>
    </div>
  );
};

export default HeroSliderSkeleton;
