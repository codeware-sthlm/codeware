import type { Browser, Page } from '@playwright/test';

import { loginAs } from './login';

/**
 * Open a temporary browser context logged in as systemUser, run a callback,
 * then close the context. Useful in beforeAll hooks when setup requires
 * privileges that the test's own user doesn't have.
 */
export async function withSystemUser<T>(
  browser: Browser,
  fn: (page: Page) => Promise<T>
): Promise<T> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await loginAs(page, 'systemUser', { navigate: false });
  try {
    return await fn(page);
  } finally {
    await ctx.close();
  }
}
