import type { Page } from '@playwright/test';

import { createCookie } from './create-cookie';

/**
 * Set the tenant cookie `payload-tenant` for the given tenant ID or slug.
 *
 * @param page Playwright Page object to set the cookie on
 * @param tenantId Tenant ID or slug to set in the cookie
 */
export async function setTenantCookie(
  page: Page,
  tenantId: number | string
): Promise<void> {
  const cookie = createCookie('payload-tenant', tenantId);
  await page.context().addCookies([cookie]);
}
