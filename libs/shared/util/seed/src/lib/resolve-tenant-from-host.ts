import { manageSeedData } from './manage-seed-data';

/**
 * Resolve tenant seed data from host.
 *
 * Aimed at being used in **development** to simulate multi-tenancy.
 *
 * @param environment - The environment to resolve the tenant for.
 * @param host - The host to resolve the tenant from.
 */
export const resolveTenantFromHost = async (host: string) => {
  if (!host) {
    throw new Error('Host is required to resolve tenant');
  }

  const seedData = manageSeedData.load('development');
  if (!seedData) {
    throw new Error('Seed data for development not found');
  }

  const tenant = seedData.tenants.find((tenant) => tenant.hosts.includes(host));
  if (!tenant) {
    throw new Error(`Tenant '${host}' not found`);
  }

  return tenant;
};
