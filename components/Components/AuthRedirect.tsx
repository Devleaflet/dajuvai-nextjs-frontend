'use client';

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { useVendorAuth } from "@/lib/context/VendorAuthContext";

const AuthRedirect: React.FC = () => {
  const { isAuthenticated: isAuthAuthenticated, isLoading: authLoading } = useAuth();
  const { authState: vendorAuthState, isLoading: vendorLoading } = useVendorAuth();
  const isVendorAuthenticated = vendorAuthState.isAuthenticated;
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const publicRoutes = [
      "/",
      "/contact",
      "/login",
      "/vendor/login",
      "/vendor/signup",
      "/wishlist",
      "/user-profile",
      "/shop",
      "/checkout",
      "/vendor/", // Allows /vendor/{id}
    ];

    const isPublicRoute = publicRoutes.some(route =>
      pathname === route ||
      pathname.startsWith('/product-page/') ||
      pathname.startsWith('/shop/') ||
      pathname.startsWith('/vendor/')
    );

    const isLoading = authLoading || vendorLoading;
    const isAuthenticated = isAuthAuthenticated || isVendorAuthenticated;

    if (!isAuthenticated && !isLoading && !isPublicRoute && pathname !== '/') {
      //("User logged out, redirecting to home from:", pathname);
      router.push("/");
    }
  }, [isAuthAuthenticated, isVendorAuthenticated, authLoading, vendorLoading, pathname, router]);

  return null;
};

export default AuthRedirect;