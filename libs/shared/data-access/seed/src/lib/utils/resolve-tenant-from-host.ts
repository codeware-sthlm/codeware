import type { SeedEnvironment } from '../seed-types';

import { manageSeedData } from './manage-seed-data';

/**
 * Resolve tenant seed data from host.
 *
 * Aimed at being used in development to simulate multi-tenancy.
 *
 * @param environment - The environment to resolve the tenant for.
 * @param host - The host to resolve the tenant from.
 */
export const resolveTenantFromHost = async (
  environment: SeedEnvironment,
  host: string
) => {
  if (!host) {
    throw new Error('Host is required to resolve tenant');
  }

  const seedData = manageSeedData.import({ environment });
  if (!seedData) {
    throw new Error(`Seed data not found for environment ${environment}`);
  }

  const tenant = seedData.tenants.find((tenant) => tenant.hosts.includes(host));
  if (!tenant) {
    throw new Error(`Tenant '${host}' not found`);
  }

  return tenant;
};
