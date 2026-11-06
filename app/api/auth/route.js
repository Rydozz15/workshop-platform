/**
 * Admin authentication endpoint.
 * POST   -> validates the password and sets a signed httpOnly session cookie.
 * GET    -> reports whether the current cookie is a valid admin session.
 * DELETE -> clears the session cookie.
 */
import { NextResponse } from 'next/server';
import {
  ADMIN_COOKIE,
  getAdminPassword,
  passwordMatches,
  createSessionToken,
  verifySessionToken,
  sessionCookieOptions,
} from '@/lib/admin-auth';

export async function POST(request) {
  try {
    if (!getAdminPassword()) {
      return NextResponse.json(
        { success: false, error: 'Administración no configurada en este servidor.' },
        { status: 503 }
      );
    }
    const { password } = await request.json();
    if (!passwordMatches(password)) {
      return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
    }
    const res = NextResponse.json({ success: true });
    res.cookies.set(ADMIN_COOKIE, createSessionToken(), sessionCookieOptions());
    return res;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET(request) {
  const authed = verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
  return NextResponse.json({ authed, configured: Boolean(getAdminPassword()) });
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
  return res;
}
