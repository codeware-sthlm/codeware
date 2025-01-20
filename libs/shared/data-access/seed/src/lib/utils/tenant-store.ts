import type { TenantRole } from '@codeware/shared/util/payload';
import type { Payload } from 'payload';

import type { TenantLookup } from '../seed-types';

type TenantId = { tenant: number };
type TenantIdRole = { tenant: number; role: TenantRole };
type TenantLookupApiKey = Pick<TenantLookup, 'lookupApiKey'>;

// Mapper api key to tenant id
const tenantMap = new Map<string, number>();

/**
 * Tenant store.
 *
 * This is used to store and lookup tenant api keys and ids.
 * The tenant id's are not known to collection seed data until tenants have been seeded.
 */
export const tenantStore = {
  /**
   * Store tenant api key and tenant id in map.
   *
   * @param apiKey - The api key of the tenant.
   * @param tenantId - The id of the tenant.
   */
  store: (apiKey: string, tenantId: number) => {
    tenantMap.set(apiKey, tenantId);
  },
  /**
   * Lookup tenant id by api key.
   *
   * @param payload - The payload instance.
   * @param tenants - The tenant api keys to lookup.
   * @returns Tenant entities with tenant id.
   */
  lookup: (payload: Payload, tenants: Array<TenantLookupApiKey>) => {
    return lookupTenant(payload, tenants, tenantMap);
  },
  /**
   * Lookup tenant id and role by api key.
   *
   * @param payload - The payload instance.
   * @param tenants - The tenant api keys to lookup.
   * @returns Tenant entities with tenant id and role.
   */
  lookupWithRole: (payload: Payload, tenants: Array<TenantLookup>) => {
    return lookupWithRole(payload, tenants, tenantMap);
  }
};

function lookupTenant(
  payload: Payload,
  tenants: Array<TenantLookupApiKey>,
  tenantMap: Map<string, number>
): Array<TenantId> {
  const result = tenants.reduce((acc, tenant) => {
    const tenantId = tenantMap.get(tenant.lookupApiKey);
    if (!tenantId) {
      payload.logger.error(`Skip: Tenant '${tenant.lookupApiKey}' not found`);
      return acc;
    }
    acc.push({ tenant: tenantId });
    return acc;
  }, [] as Array<TenantId>);

  return result;
}

function lookupWithRole(
  payload: Payload,
  tenants: Array<TenantLookup>,
  tenantMap: Map<string, number>
): Array<TenantIdRole> {
  const result = tenants.reduce((acc, tenant) => {
    const tenantId = tenantMap.get(tenant.lookupApiKey);
    if (!tenantId) {
      payload.logger.error(`Skip: Tenant '${tenant.lookupApiKey}' not found`);
      return acc;
    }
    acc.push({ tenant: tenantId, role: tenant.role });
    return acc;
  }, [] as Array<TenantIdRole>);

  return result;
}
