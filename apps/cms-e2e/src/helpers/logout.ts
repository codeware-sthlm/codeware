import type { Page } from '@playwright/test';

/**
 * Log out of the Payload admin panel.
 * Navigates to /admin/logout and waits until redirected to /admin/login.
 */
export async function logout(page: Page): Promise<void> {
  await page.goto('/admin/logout');
  await page.waitForURL((url) => url.pathname.includes('/login'));
}
