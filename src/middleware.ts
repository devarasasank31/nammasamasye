import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'nammasamasye2024';
const SESSION_COOKIE = 'ns_admin_auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes
  if (pathname.startsWith('/admin')) {
    // Check if already authenticated
    const authCookie = request.cookies.get(SESSION_COOKIE)?.value;

    if (authCookie === ADMIN_PASSWORD) {
      return NextResponse.next();
    }

    // Check for login form submission
    if (request.method === 'POST') {
      const formData = request.formData();
      // Handled by the login page API route
    }

    // Check if this is the login page itself
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    // Redirect to login
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
