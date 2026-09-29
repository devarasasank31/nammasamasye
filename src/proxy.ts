import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  clientIp,
  isValidAdminSessionToken,
  rateLimit,
} from '@/lib/security';

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const API_WINDOW_MS = 60 * 1000;
const API_MAX_REQUESTS = 120;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Abuse control: brute-force protection on the admin login and a general
  // per-IP budget on every API route (429 instead of a meltdown).
  if (pathname.startsWith('/api')) {
    const ip = clientIp(request.headers);
    const isLogin = pathname === '/api/admin/auth';
    const allowed = rateLimit(
      isLogin ? `login:${ip}` : `api:${ip}`,
      isLogin ? LOGIN_MAX_ATTEMPTS : API_MAX_REQUESTS,
      isLogin ? LOGIN_WINDOW_MS : API_WINDOW_MS
    );

    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((isLogin ? LOGIN_WINDOW_MS : API_WINDOW_MS) / 1000)) } }
      );
    }
  }

  // Only protect /admin routes
  if (pathname.startsWith('/admin')) {
    const authCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

    if (isValidAdminSessionToken(authCookie)) {
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
  matcher: ['/admin/:path*', '/api/:path*'],
};
