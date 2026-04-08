import { manageSeedData } from './manage-seed-data';

/**
 * Resolve tenant seed data from slug.
 *
 * Aimed at being used in **development** to simulate multi-tenancy.
 *
 * @param slug - The tenant slug to resolve the tenant from.
 * @returns Tenant seed data or `null` if tenant not found.
 */
export const resolveTenantSeedFromSlug = async (slug: string) => {
  if (!slug) {
    console.error('Slug is required to resolve tenant');
    return null;
  }

  // Load seed data for development
  const seedData = manageSeedData.load('development');
  if (!seedData) {
    console.error('No seed data available to resolve tenant');
    return null;
  }

  // Lookup tenant by matching against tenant slugs
  const tenant = seedData.tenants.find((t) => t.slug === slug);
  if (!tenant) {
    console.error(`Tenant not found for slug ${slug}, verify seed data setup`);
    return null;
  }

  return tenant;
};
