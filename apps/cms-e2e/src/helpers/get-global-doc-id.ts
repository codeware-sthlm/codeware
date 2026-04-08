import type { CollectionTenantScopedSlug } from '@codeware/shared/util/payload-types';
import type { ExtractTypes } from '@codeware/shared/util/typesafe';
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Find the document ID for a plugin-managed global collection scoped to a tenant.
 *
 * Filters by tenantId explicitly so that system users (who have no payload-tenant
 * cookie) always retrieve the correct tenant's document rather than whichever
 * tenant happens to come first in the result set.
 */
export async function getGlobalDocId(
  page: Page,
  slug: ExtractTypes<
    CollectionTenantScopedSlug,
    'navigation' | 'site-settings'
  >,
  tenantId: number
): Promise<number> {
  const res = await page.request.get(
    `/api/${slug}?where[tenant][equals]=${tenantId}&limit=1`
  );
  expect(res.status()).toBe(200);
  const id = (await res.json())?.docs?.[0]?.id as number | undefined;
  if (!id) throw new Error(`No ${slug} document found for tenant ${tenantId}`);
  return id;
}
