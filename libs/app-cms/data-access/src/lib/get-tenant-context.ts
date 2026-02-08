import { getEnv } from '@codeware/app-cms/feature/env-loader';
import { resolveTenantSeedFromHost } from '@codeware/shared/util/seed';
import { headers } from 'next/headers';
import { cache } from 'react';

type TenantContext = {
  tenantApiKey: string;
  tenantId: string | undefined;
};

/**
 * Get tenant context for the current request.
 *
 * - Looks for `TENANT_ID` and `PAYLOAD_API_KEY` from environment
 * - In development with `X-Tenant-Host` header, tenant API key is resolved from seed data.
 *
 * Uses React cache() for per-request memoization to avoid redundant lookups.
 *
 * @returns Tenant context or null if not available (admin-only deployment)
 */
export const getTenantContext = cache(
  async (): Promise<TenantContext | null> => {
    const { DEPLOY_ENV, TENANT_ID, PAYLOAD_API_KEY } = getEnv();

    // Check for tenant details from environment (expected for a deployed tenant app)
    if (TENANT_ID && PAYLOAD_API_KEY) {
      // Running tenant app with api key authentication
      return {
        tenantApiKey: PAYLOAD_API_KEY,
        tenantId: TENANT_ID
      };
    }

    // In development, check for X-Tenant-Host header
    if (DEPLOY_ENV === 'development') {
      const headersList = await headers();
      const tenantHost = headersList.get('x-tenant-host');

      if (tenantHost) {
        const tenant = await resolveTenantSeedFromHost(tenantHost);
        if (tenant) {
          // Found tenant from host, return its seeded API key
          return {
            tenantApiKey: tenant.apiKey,
            tenantId: undefined
          };
        } else {
          console.error(
            `Failed to resolve tenant from X-Tenant-Host header: ${tenantHost}`
          );
          return null;
        }
      }
    }

    // Running as headless CMS host
    return null;
  }
);
