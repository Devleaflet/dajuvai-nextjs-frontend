import type { ReactNode } from 'react';
import AdminRouteLayout from '@/components/layout/AdminRouteLayout';
import './layout.css';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <AdminRouteLayout>{children}</AdminRouteLayout>;
}
