'use client';

import React from 'react';

/**
 * Skeleton component for admin dashboard loading state
 * Displays placeholder cards and charts while data is being fetched
 */
const DashboardSkeleton: React.FC = () => {
  return (
    <div className="dashboard-skeleton">
      {/* Stats Cards Row */}
      <div className="stats-grid">
        {Array(4).fill(null).map((_, index) => (
          <div key={index} className="stat-card-skeleton">
            <div className="skeleton-stat-icon shimmer" />
            <div className="skeleton-stat-content">
              <div className="skeleton-stat-label shimmer" />
              <div className="skeleton-stat-value shimmer" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        <div className="chart-skeleton">
          <div className="skeleton-chart-title shimmer" />
          <div className="skeleton-chart-body shimmer" />
        </div>
        <div className="chart-skeleton">
          <div className="skeleton-chart-title shimmer" />
          <div className="skeleton-chart-body shimmer" />
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="table-skeleton">
        <div className="skeleton-table-header shimmer" />
        {Array(5).fill(null).map((_, index) => (
          <div key={index} className="skeleton-table-row shimmer" />
        ))}
      </div>

      <style jsx>{`
        .dashboard-skeleton {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card-skeleton {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .skeleton-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
        }

        .skeleton-stat-content {
          flex: 1;
        }

        .skeleton-stat-label {
          height: 14px;
          width: 80px;
          border-radius: 4px;
          margin-bottom: 8px;
        }

        .skeleton-stat-value {
          height: 24px;
          width: 120px;
          border-radius: 4px;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .chart-skeleton {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .skeleton-chart-title {
          height: 20px;
          width: 150px;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .skeleton-chart-body {
          height: 300px;
          border-radius: 8px;
        }

        .table-skeleton {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .skeleton-table-header {
          height: 40px;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .skeleton-table-row {
          height: 60px;
          border-radius: 4px;
          margin-bottom: 0.5rem;
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

export default DashboardSkeleton;
