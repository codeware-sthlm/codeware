import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/** GET /api/users/me and return the authenticated user object. */
export async function getMe(
  page: Page
): Promise<{ id: number; role: string; email: string }> {
  const res = await page.request.get('/api/users/me');
  expect(res.status()).toBe(200);
  return (await res.json()).user as { id: number; role: string; email: string };
}
