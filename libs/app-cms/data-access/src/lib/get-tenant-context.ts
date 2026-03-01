import { getEnv } from '@codeware/app-cms/feature/env-loader';
import { resolveTenantSeedFromHost } from '@codeware/shared/util/seed';
import { headers } from 'next/headers';
import { cache } from 'react';

type TenantContext = {
  tenantApiKey: string;
};

/**
 * Get tenant context when running in tenant mode.
 *
 * Uses React cache() for per-request memoization to avoid redundant lookups.
 *
 * ---
 *
 * **In development**, tenant API key is resolved from seed data via host:
 * - First tries `X-Tenant-Host` header
 * - Falling back to `${TENANT_ID}.localhost`
 *
 * @returns Tenant context or null if not available (cms host deployment)
 */
export const getTenantContext = cache(
  async (): Promise<TenantContext | null> => {
    const { APP_MODE, DEPLOY_ENV } = getEnv();

    if (APP_MODE.type === 'host') {
      // Running as headless CMS host, no tenant context available
      return null;
    }

    // Tenant details from environment is expected for a deployed tenant app
    if (DEPLOY_ENV !== 'development') {
      return {
        tenantApiKey: APP_MODE.apiKey
      };
    }

    // In development, get host from X-Tenant-Host header or the tenant
    const headersList = await headers();
    const tenantHost =
      headersList.get('x-tenant-host') || `${APP_MODE.tenantId}.localhost`;

    const tenant = await resolveTenantSeedFromHost(tenantHost);
    if (tenant) {
      // Found tenant from host, return its seeded API key
      return {
        tenantApiKey: tenant.apiKey
      };
    }

    console.error(`Failed to resolve tenant: ${tenantHost}`);
    return null;
  }
);
