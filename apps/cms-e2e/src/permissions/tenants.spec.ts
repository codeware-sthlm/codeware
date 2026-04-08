/**
 * Tenants collection — permission tests
 * Scenarios: [T-01] [T-03] [T-04] from PERMISSIONS.md
 *
 * Only system users may create, update, or delete tenants.
 * All other authenticated users are denied regardless of their tenant role.
 */

import { Tenant } from '@codeware/shared/util/payload-types';

import { expect, test } from '../fixtures';
import { loginAs } from '../helpers/login';

// Minimal valid tenant payload (slug auto-generated from name)
const newTenant = (scope: 'create' | 'update' | 'delete') => {
  const keyId = Date.now();
  return {
    name: `E2E ${scope} ${keyId}`,
    apiKey: `api-key-${keyId}`,
    supportedLocales: ['en']
  } as Tenant;
};

test.describe('Tenants — create [T-01]', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('system user can create a tenant', async ({ page }) => {
    await loginAs(page, 'systemUser');
    const res = await page.request.post('/api/tenants', {
      data: newTenant('create')
    });
    expect(res.status()).toBe(201);
  });

  test('tenant admin cannot create a tenant', async ({ page }) => {
    await loginAs(page, 'tenantAdmin');
    const res = await page.request.post('/api/tenants', {
      data: newTenant('create')
    });
    expect(res.status()).toBe(403);
  });

  test('tenant user cannot create a tenant', async ({ page }) => {
    await loginAs(page, 'tenantUser');
    const res = await page.request.post('/api/tenants', {
      data: newTenant('create')
    });
    expect(res.status()).toBe(403);
  });
});

test.describe('Tenants — update [T-03]', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let tenantId: number;

  test.beforeAll(async ({ browser }) => {
    // Create a throwaway tenant to update/delete in these tests
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    await loginAs(page, 'systemUser');
    const res = await page.request.post('/api/tenants', {
      data: newTenant('update')
    });
    expect(res.status()).toBe(201);

    const body = await res.json();
    tenantId = body.doc.id;
    await ctx.close();
  });

  test('system user can update a tenant', async ({ page }) => {
    await loginAs(page, 'systemUser');
    const res = await page.request.patch(`/api/tenants/${tenantId}`, {
      data: { description: 'updated by system user' }
    });
    expect(res.status()).toBe(200);
  });

  test('tenant admin cannot update a tenant', async ({ page }) => {
    await loginAs(page, 'tenantAdmin');
    const res = await page.request.patch(`/api/tenants/${tenantId}`, {
      data: { description: 'should be denied' }
    });
    expect(res.status()).toBe(403);
  });

  test('tenant user cannot update a tenant', async ({ page }) => {
    await loginAs(page, 'tenantUser');
    const res = await page.request.patch(`/api/tenants/${tenantId}`, {
      data: { description: 'should be denied' }
    });
    expect(res.status()).toBe(403);
  });
});

test.describe('Tenants — delete [T-04]', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let tenantId: number;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    await loginAs(page, 'systemUser');
    const res = await page.request.post('/api/tenants', {
      data: newTenant('delete')
    });
    expect(res.status()).toBe(201);

    const body = await res.json();
    tenantId = body.doc.id;
    await ctx.close();
  });

  test('tenant admin cannot delete a tenant', async ({ page }) => {
    await loginAs(page, 'tenantAdmin');
    const res = await page.request.delete(`/api/tenants/${tenantId}`);
    expect(res.status()).toBe(403);
  });

  test('tenant user cannot delete a tenant', async ({ page }) => {
    await loginAs(page, 'tenantUser');
    const res = await page.request.delete(`/api/tenants/${tenantId}`);
    expect(res.status()).toBe(403);
  });

  test('system user can delete a tenant', async ({ page }) => {
    await loginAs(page, 'systemUser');
    const res = await page.request.delete(`/api/tenants/${tenantId}`);
    expect(res.status()).toBe(200);
  });
});
