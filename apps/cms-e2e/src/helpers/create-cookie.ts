import type { Cookie } from '@playwright/test';

/**
 * Create a cookie for the given name and value.
 *
 * @param name Name of the cookie ('payload-token' or 'payload-tenant')
 * @param value Value to set in the cookie
 */
export function createCookie(
  name: 'payload-token' | 'payload-tenant',
  value: number | string
): Cookie {
  return {
    name,
    value: String(value),
    domain: 'localhost',
    path: '/',
    sameSite: 'Lax',
    httpOnly: false,
    secure: false,
    expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 1 week from now
  };
}
