import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'nammasamasye2024';
const SESSION_COOKIE = 'ns_admin_auth';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes
  if (pathname.startsWith('/admin')) {
    const authCookie = request.cookies.get(SESSION_COOKIE)?.value;

    if (authCookie === ADMIN_PASSWORD) {
      return NextResponse.next();
    }

    // Login page itself must stay reachable
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
