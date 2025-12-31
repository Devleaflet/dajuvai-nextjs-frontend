'use client';

import dynamic from 'next/dynamic';
import PageLoader from '@/components/Components/PageLoader';

const Vendor = dynamic(() => import('@/components/Pages/Vendor'), {
  loading: () => <PageLoader />,
  ssr: false
});

export default function Page() {
  return <Vendor />;
}
