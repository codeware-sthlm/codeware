/**
 * Content collections — update permission tests
 * Scenarios: [C-03] [C-04] from PERMISSIONS.md
 *
 * navigation and site-settings require system-user or tenant admin.
 * Tenant users and users without moon access are denied.
 *
 * These are plugin-managed "global" collections (one doc per tenant).
 * Tests look up the moon document ID before running assertions.
 *
 * Important: the system user has no payload-tenant cookie, so a plain
 * GET /api/navigation?limit=1 returns docs from all tenants in arbitrary
 * order. We must filter by moon tenant ID explicitly, otherwise the test
 * may grab a star/sun document and the tenant-admin patch correctly returns
 * 403 (the WHERE constraint { tenant: { in: [moon_id] } } wouldn't match).
 */
import { expect, test } from '../fixtures';
import { getGlobalDocId } from '../helpers/get-global-doc-id';
import { getTenantId } from '../helpers/get-tenant-id';
import { loginAs } from '../helpers/login';
import { withSystemUser } from '../helpers/with-system-user';

// ---------------------------------------------------------------------------
// [C-03] Navigation update
// ---------------------------------------------------------------------------

test.describe('Content — update navigation [C-03]', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let navigationId: number;

  test.beforeAll(async ({ browser }) => {
    navigationId = await withSystemUser(browser, async (page) => {
      const moonTenantId = await getTenantId(page, 'moon');
      return getGlobalDocId(page, 'navigation', moonTenantId);
    });
  });

  test('system user can update navigation', async ({ page }) => {
    await loginAs(page, 'systemUser');
    const res = await page.request.patch(`/api/navigation/${navigationId}`, {
      data: {}
    });
    expect(res.status()).toBe(200);
  });

  test('tenant admin can update navigation', async ({ page }) => {
    await loginAs(page, 'tenantAdmin');
    const res = await page.request.patch(`/api/navigation/${navigationId}`, {
      data: {}
    });
    expect(res.status()).toBe(200);
  });

  test('tenant user cannot update navigation', async ({ page }) => {
    await loginAs(page, 'tenantUser');
    const res = await page.request.patch(`/api/navigation/${navigationId}`, {
      data: {}
    });
    expect(res.status()).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// [C-04] Site settings update
// ---------------------------------------------------------------------------

test.describe('Content — update site-settings [C-04]', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let siteSettingsId: number;

  test.beforeAll(async ({ browser }) => {
    siteSettingsId = await withSystemUser(browser, async (page) => {
      const moonTenantId = await getTenantId(page, 'moon');
      return getGlobalDocId(page, 'site-settings', moonTenantId);
    });
  });

  test('system user can update site-settings', async ({ page }) => {
    await loginAs(page, 'systemUser');
    const res = await page.request.patch(
      `/api/site-settings/${siteSettingsId}`,
      {
        data: {}
      }
    );
    expect(res.status()).toBe(200);
  });

  test('tenant admin can update site-settings', async ({ page }) => {
    await loginAs(page, 'tenantAdmin');
    const res = await page.request.patch(
      `/api/site-settings/${siteSettingsId}`,
      {
        data: {}
      }
    );
    expect(res.status()).toBe(200);
  });

  test('tenant user cannot update site-settings', async ({ page }) => {
    await loginAs(page, 'tenantUser');
    const res = await page.request.patch(
      `/api/site-settings/${siteSettingsId}`,
      {
        data: {}
      }
    );
    expect(res.status()).toBe(403);
  });
});
