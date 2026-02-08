import { manageSeedData } from './manage-seed-data';

/**
 * Resolve tenant seed data from host.
 *
 * Aimed at being used in **development** to simulate multi-tenancy.
 *
 * @param host - The tenant host to resolve the tenant from.
 * @returns Tenant seed data or `null` if tenant not found.
 */
export const resolveTenantSeedFromHost = async (host: string) => {
  if (!host) {
    console.error('Host is required to resolve tenant');
    return null;
  }

  // Load seed data for development
  const seedData = manageSeedData.load('development');
  if (!seedData) {
    console.error('No seed data available to resolve tenant');
    return null;
  }

  // Lookup tenant by matching host against tenant domains
  const tenant = seedData.tenants.find((t) =>
    t.domains.some((d) => d.domain === host)
  );
  if (!tenant) {
    console.error(`Tenant not found for host ${host}, verify seed data setup`);
    return null;
  }

  return tenant;
};
