/**
 * Unit tests: server-side admin session tokens.
 * Run with: node test/admin-auth.test.js
 */
import assert from 'node:assert/strict';
import {
  getAdminPassword,
  passwordMatches,
  createSessionToken,
  verifySessionToken,
  sessionCookieOptions,
  SESSION_TTL_MS,
} from '../lib/admin-auth.js';

let passed = 0;
function check(name, fn) {
  fn();
  passed++;
  console.log(`  [PASS] ${name}`);
}

process.env.ADMIN_PASSWORD = 'correct-horse';
delete process.env.SESSION_SECRET;

check('accepts the configured password only', () => {
  assert.equal(passwordMatches('correct-horse'), true);
  assert.equal(passwordMatches('wrong'), false);
  assert.equal(passwordMatches(undefined), false);
});

check('valid token verifies; tampered or malformed tokens do not', () => {
  const token = createSessionToken();
  assert.equal(verifySessionToken(token), true);
  const [exp, mac] = token.split('.');
  assert.equal(verifySessionToken(`${Number(exp) + 1000}.${mac}`), false);
  assert.equal(verifySessionToken(`${exp}.${'0'.repeat(mac.length)}`), false);
  assert.equal(verifySessionToken('garbage'), false);
  assert.equal(verifySessionToken(undefined), false);
});

check('token expires after the TTL', () => {
  const now = Date.now();
  const token = createSessionToken(now);
  assert.equal(verifySessionToken(token, now + SESSION_TTL_MS - 1), true);
  assert.equal(verifySessionToken(token, now + SESSION_TTL_MS + 1), false);
});

check('changing the password invalidates existing sessions', () => {
  const token = createSessionToken();
  process.env.ADMIN_PASSWORD = 'another-password';
  assert.equal(verifySessionToken(token), false);
  process.env.ADMIN_PASSWORD = 'correct-horse';
});

check('production without ADMIN_PASSWORD keeps the admin locked', () => {
  const token = createSessionToken();
  delete process.env.ADMIN_PASSWORD;
  const prevEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  assert.equal(getAdminPassword(), null);
  assert.equal(passwordMatches('workshop2025'), false);
  assert.equal(verifySessionToken(token), false);
  process.env.NODE_ENV = prevEnv;
  process.env.ADMIN_PASSWORD = 'correct-horse';
});

check('cookie is Secure in production, except in local mode over plain HTTP', () => {
  const prevEnv = process.env.NODE_ENV;
  const prevLocal = process.env.LOCAL_MODE;
  process.env.NODE_ENV = 'production';
  delete process.env.LOCAL_MODE;
  assert.equal(sessionCookieOptions().secure, true);
  process.env.LOCAL_MODE = '1';
  assert.equal(sessionCookieOptions().secure, false);
  process.env.NODE_ENV = 'development';
  delete process.env.LOCAL_MODE;
  assert.equal(sessionCookieOptions().secure, false);
  process.env.NODE_ENV = prevEnv;
  if (prevLocal === undefined) delete process.env.LOCAL_MODE;
  else process.env.LOCAL_MODE = prevLocal;
});

console.log(`\nadmin-auth: ${passed} tests passed`);
