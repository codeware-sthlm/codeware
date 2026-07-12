import type { CollectionSlug } from 'payload';

/**
 * Collections to be registered as multi-tenant "globals" — a single document per
 * tenant, edited in place rather than created (they have no create page).
 */
export const globalCollectionSlugs = [
  'navigation',
  'site-settings'
] as const satisfies readonly CollectionSlug[];

export type GlobalCollectionSlug = (typeof globalCollectionSlugs)[number];

/**
 * Whether a collection slug is a multi-tenant global.
 *
 * @see {@link globalCollectionSlugs}
 */
export const isGlobalCollectionSlug = (slug: string): boolean =>
  (globalCollectionSlugs as readonly string[]).includes(slug);
