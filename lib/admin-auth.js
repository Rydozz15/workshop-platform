/**
 * Server-side admin authentication.
 * Stateless signed cookie: "<expiresAtMs>.<hmac-sha256>". The HMAC key is derived
 * from SESSION_SECRET (or ADMIN_PASSWORD), so rotating the password invalidates sessions.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export const ADMIN_COOKIE = 'ps_admin';
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const DEV_DEFAULT_PASSWORD = 'workshop2025';

/** Configured admin password, or null when the admin area must stay locked. */
export function getAdminPassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  // The well-known default only exists outside production.
  return process.env.NODE_ENV === 'production' ? null : DEV_DEFAULT_PASSWORD;
}

function secretKey() {
  return `${process.env.SESSION_SECRET || ''}|${getAdminPassword() || ''}`;
}

function sign(payload) {
  return createHmac('sha256', secretKey()).update(payload).digest('hex');
}

export function passwordMatches(candidate) {
  const expected = getAdminPassword();
  if (!expected || typeof candidate !== 'string') return false;
  const a = createHmac('sha256', 'cmp').update(candidate).digest();
  const b = createHmac('sha256', 'cmp').update(expected).digest();
  return timingSafeEqual(a, b);
}

export function createSessionToken(now = Date.now()) {
  const exp = String(now + SESSION_TTL_MS);
  return `${exp}.${sign(exp)}`;
}

export function verifySessionToken(token, now = Date.now()) {
  if (!getAdminPassword() || typeof token !== 'string') return false;
  const [exp, mac] = token.split('.');
  if (!exp || !mac || !/^\d+$/.test(exp) || Number(exp) < now) return false;
  const expected = Buffer.from(sign(exp));
  const given = Buffer.from(mac);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  };
}
