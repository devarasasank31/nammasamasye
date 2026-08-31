import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'nammasamasye2024';
const SESSION_COOKIE = 'ns_admin_auth';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
