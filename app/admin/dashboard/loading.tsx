import React from 'react';
import DashboardSkeleton from '@/components/skeleton/DashboardSkeleton';

/**
 * Loading state for the admin dashboard
 * Displays skeleton components for stats, charts, and tables
 */
export default function AdminDashboardLoading() {
  return <DashboardSkeleton />;
}
