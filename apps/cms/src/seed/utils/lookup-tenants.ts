import type { Payload } from 'payload';

import type { TenantRole } from '../../utils/custom-types';
import type { TenantLookup } from '../data/seed.types';

type TenantId = { tenant: number };
type TenantIdRole = { tenant: number; role: TenantRole };
type TenantLookupName = Pick<TenantLookup, 'lookupName'>;

export function lookupTenant(
  payload: Payload,
  tenant: TenantLookupName,
  tenantMap: Map<string, number>
): TenantId;
export function lookupTenant(
  payload: Payload,
  tenant: Array<TenantLookupName>,
  tenantMap: Map<string, number>
): Array<TenantId>;
export function lookupTenant(
  payload: Payload,
  tenant: TenantLookupName | Array<TenantLookupName>,
  tenantMap: Map<string, number>
): TenantId | Array<TenantId> {
  const tenants = Array.isArray(tenant) ? tenant : [tenant];

  const result = tenants.reduce((acc, tenant) => {
    const tenantId = tenantMap.get(tenant.lookupName);
    if (!tenantId) {
      payload.logger.error(
        `[SEED] SKIP: Tenant '${tenant.lookupName}' not found`
      );
      return acc;
    }
    acc.push({ tenant: tenantId });
    return acc;
  }, [] as Array<TenantId>);

  return Array.isArray(tenant) ? result : result[0];
}

export function lookupTenantRole(
  payload: Payload,
  tenant: TenantLookup,
  tenantMap: Map<string, number>
): TenantIdRole;
export function lookupTenantRole(
  payload: Payload,
  tenant: Array<TenantLookup>,
  tenantMap: Map<string, number>
): Array<TenantIdRole>;
export function lookupTenantRole(
  payload: Payload,
  tenant: TenantLookup | Array<TenantLookup>,
  tenantMap: Map<string, number>
): TenantIdRole | Array<TenantIdRole> {
  const tenants = Array.isArray(tenant) ? tenant : [tenant];

  const result = tenants.reduce((acc, tenant) => {
    const tenantId = tenantMap.get(tenant.lookupName);
    if (!tenantId) {
      payload.logger.error(
        `[SEED] SKIP: Tenant '${tenant.lookupName}' not found`
      );
      return acc;
    }
    acc.push({ tenant: tenantId, role: tenant.role });
    return acc;
  }, [] as Array<TenantIdRole>);

  return Array.isArray(tenant) ? result : result[0];
}
