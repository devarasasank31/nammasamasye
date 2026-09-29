import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createAdminSessionToken,
  timingSafeStringEqual,
} from '@/lib/security';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'nammasamasye2024';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!timingSafeStringEqual(password, ADMIN_PASSWORD)) {
      return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_TTL_SECONDS,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
