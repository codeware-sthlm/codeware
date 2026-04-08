import type { TenantRuntimeConfig } from '@codeware/shared/util/payload-types';
import type { MetaFunction } from '@remix-run/react';

/**
 * Server side utility to get the tenant configuration from the root loader data.
 *
 * @param matches - The `matches` object from the root loader.
 * @returns The tenant configuration or `null` if not found.
 */
export const getTenantConfigFromRoot = (
  matches: Parameters<MetaFunction>[0]['matches']
) => {
  const rootData = matches.find((match) => match.id === 'root')?.data as
    | Record<'tenantConfig', TenantRuntimeConfig>
    | undefined;

  return rootData?.tenantConfig ?? null;
};
