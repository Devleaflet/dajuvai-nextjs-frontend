'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string | ((props: { isActive: boolean }) => string);
  style?: React.CSSProperties | ((props: { isActive: boolean }) => React.CSSProperties);
  onClick?: (e: React.MouseEvent) => void;
  end?: boolean;
}

export default function NavLink({ to, children, className, style, onClick, end = false }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = end ? pathname === to : pathname.startsWith(to);

  const computedClassName = typeof className === 'function' ? className({ isActive }) : className;
  const computedStyle = typeof style === 'function' ? style({ isActive }) : style;

  return (
    <Link
      href={to}
      className={computedClassName}
      style={computedStyle}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
