import type { CollectionSlug, Where } from 'payload';

import type { PayloadRuntime } from '../payload-runtime.types';

import { countDocs } from './count-docs';

/**
 * A collection is tenant-scoped iff its config declares a top-level `tenant`
 * field (added by the multi-tenant plugin). Detected from config rather than a
 * hardcoded list so it stays in sync with the plugin's `collections` map.
 */
function isTenantScoped(
  runtime: PayloadRuntime,
  slug: CollectionSlug
): boolean {
  const collection = runtime.payload.config.collections.find(
    (c) => c.slug === slug
  );
  return Boolean(
    collection?.fields.some(
      (field) => 'name' in field && field.name === 'tenant'
    )
  );
}

/**
 * Count documents across multiple collections, respecting access control.
 *
 * The `tenantWhere` scope is applied only to tenant-scoped collections; non-
 * tenant collections (e.g. `faq`) are counted without it, so their counts
 * don't vanish when a workspace is selected.
 *
 * @param runtime - Authenticated Payload runtime instance
 * @param slugs - Collection slugs to count
 * @param options - Optional tenant scope applied to tenant-scoped collections
 * @returns Map of slug → count, omitting collections whose count failed
 */
export async function getCollectionCounts(
  runtime: PayloadRuntime,
  slugs: CollectionSlug[],
  options: { tenantWhere?: Where } = {}
): Promise<Record<string, number>> {
  const { tenantWhere } = options;

  const entries = await Promise.all(
    slugs.map(async (slug) => {
      const where =
        tenantWhere && isTenantScoped(runtime, slug) ? tenantWhere : undefined;
      return [slug, await countDocs(runtime, slug, { where })] as const;
    })
  );

  const counts: Record<string, number> = {};
  for (const [slug, total] of entries) {
    if (total !== null) {
      counts[slug] = total;
    }
  }
  return counts;
}
