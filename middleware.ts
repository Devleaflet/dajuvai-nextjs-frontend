import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('authToken')?.value;
  const vendorToken = request.cookies.get('vendorToken')?.value;
  const pathname = request.nextUrl.pathname;

  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    if (!authToken) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Note: Role-based checks (admin vs staff) would need to decode the token
    // For now, we just check if authToken exists
  }

  // Vendor routes protection
  if (pathname.startsWith('/vendor') && !pathname.startsWith('/vendor-store')) {
    if (!vendorToken) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/vendor/:path*'],
};
