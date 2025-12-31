'use client';

import dynamic from 'next/dynamic';
import PageLoader from '@/components/Components/PageLoader';

const AdminDashboard = dynamic(() => import('@/components/Pages/AdminDashboard').then(mod => mod.AdminDashboard), {
  loading: () => <PageLoader />,
  ssr: false
});

export default function Page() {
  return <AdminDashboard />;
}
