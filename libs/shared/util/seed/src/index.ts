export { manageSeedData, type SeedOptions } from './lib/manage-seed-data';
export { resolveTenantSeedFromSlug } from './lib/resolve-tenant-from-slug';
export type {
  CategoryLookup,
  TagLookup,
  TenantLookup,
  UserLookup
} from './lib/schema';

import { TenantSlug } from './lib/static-data/seed.development';
export type TenantSlugDev = TenantSlug;
