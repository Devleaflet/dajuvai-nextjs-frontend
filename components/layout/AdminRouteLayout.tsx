'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/Components/AdminSidebar';
import { useAuth } from '@/lib/context/AuthContext';

interface AdminRouteLayoutProps {
  children: ReactNode;
}

const getAdminTitle = (pathname: string): string => {
  if (pathname.includes('/dashboard')) return 'Dashboard';
  if (pathname.includes('/catalog')) return 'Catalog';
  if (pathname.includes('/products')) return 'Products';
  if (pathname.includes('/categories')) return 'Categories';
  if (pathname.includes('/deals')) return 'Deals';
  if (pathname.includes('/promo')) return 'Promo Codes';
  if (pathname.includes('/banner')) return 'Banner Management';
  if (pathname.includes('/orders')) return 'Orders';
  if (pathname.includes('/notifications')) return 'Notifications';
  if (pathname.includes('/customers')) return 'Customers';
  if (pathname.includes('/vendors')) return 'Vendors';
  if (pathname.includes('/district')) return 'Districts';
  if (pathname.includes('/staff')) return 'Staff Management';
  if (pathname.includes('/profile')) return 'Profile';
  return 'Admin Panel';
};

export default function AdminRouteLayout({ children }: AdminRouteLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const title = getAdminTitle(pathname);
  const initials = user?.username
    ? user.username
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : (user?.email?.[0] || 'A').toUpperCase();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-shell__main">
        <header className="admin-topbar">
          <h1 className="admin-topbar__title">{title}</h1>

          <div className="admin-topbar__profile-wrap" ref={profileRef}>
            <button
              type="button"
              className="admin-topbar__profile"
              aria-label="Open profile menu"
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              <div className="admin-topbar__user-chip">
                <div className="admin-topbar__avatar">{initials}</div>
                <div className="admin-topbar__meta">
                  <span className="admin-topbar__name">{user?.username || user?.email || 'Admin'}</span>
                </div>
              </div>
              <span className={`admin-topbar__chevron ${isMenuOpen ? 'admin-topbar__chevron--open' : ''}`}>
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  aria-hidden="true"
                >
                  <path
                    d="M6 9l6 6 6-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>

            {isMenuOpen && (
              <div className="admin-topbar__menu" role="menu" aria-label="Profile menu">
                <button
                  type="button"
                  className="admin-topbar__menu-item"
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push('/');
                  }}
                >
                  Home
                </button>
                <button
                  type="button"
                  className="admin-topbar__menu-item"
                  onClick={() => {
                    setIsMenuOpen(false);
                    logout();
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>
        <div className="admin-shell__page">{children}</div>
      </div>
    </div>
  );
}
