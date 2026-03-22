'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Components/Sidebar';
import VendorHeader from '@/components/Components/VendorHeader';
import '@/styles/Dashboard.css';

interface VendorLayoutProps {
  children: ReactNode;
}

const getVendorTitle = (pathname: string): string => {
  if (pathname.startsWith('/vendor/dashboard')) return 'Dashboard';
  if (pathname.startsWith('/vendor/products')) return 'Product Management';
  if (pathname.startsWith('/vendor/orders')) return 'Order Management';
  if (pathname.startsWith('/vendor/notifications')) return 'Notification';
  if (pathname.startsWith('/vendor/profile')) return 'Profile Management';
  return 'Vendor Panel';
};

export default function VendorLayout({ children }: VendorLayoutProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateViewport = () => {
      setIsMobile(window.innerWidth < 768);
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const title = useMemo(() => getVendorTitle(pathname), [pathname]);

  return (
    <div className="vendor-dash-container">
      <Sidebar />
      <div className={`dashboard ${isMobile ? 'dashboard--mobile' : ''}`}>
        <VendorHeader title={title} showSearch={false} />
        {children}
      </div>
    </div>
  );
}
