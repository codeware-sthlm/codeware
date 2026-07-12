import { useConfig, useEntityVisibility } from '@payloadcms/ui';
import { CollectionSlug } from 'payload';
import { useMemo } from 'react';

import { adminGroups } from '@codeware/app-cms/util/definitions';

import { localize } from './localize';

type Options = {
  /** Collection slugs to exclude from the results. */
  exclude?: CollectionSlug[];
};

/**
 * Opinionated group ordering — by importance, not alphabetically.
 *
 * Derived from the key order in `adminGroups` so the group definition stays the
 * single source of truth. Both `en` and `sv` labels map to the same rank, so a
 * lookup works regardless of which locale the group was resolved to.
 */
const groupRank = new Map<string, number>();
Object.values(adminGroups).forEach((labels, index) => {
  groupRank.set(labels.en, index);
  groupRank.set(labels.sv, index);
});

/**
 * Opinionated within-group collection ordering — by importance to editors.
 *
 * Slugs omitted here sort after the ranked ones (then alphabetically by slug),
 * so a newly added collection still shows up — just at the end of its group —
 * until it earns a place in this list.
 */
const collectionOrder: CollectionSlug[] = [
  // Your Content
  'pages',
  'posts',
  'categories',
  'tags',
  'reusable-content',
  // Photos & Files
  'media',
  // Site Setup
  'site-settings',
  'navigation',
  'faq',
  'tenants',
  'users'
];
const collectionRank = new Map(
  collectionOrder.map((slug, index) => [slug, index])
);

const rankOf = (map: Map<string, number>, key: string) =>
  map.get(key) ?? Number.MAX_SAFE_INTEGER;

/**
 * Returns the list of collections that are visible to the current user,
 * excluding any collection whose slug starts with `payload-`.
 *
 * Optionally excludes any collection slugs provided in the `exclude` option.
 *
 * Visibility is determined by the `admin.hidden` property of each collection,
 * which is resolved per user server-side.
 *
 * Results are sorted by opinionated importance — first by admin group, then by
 * collection — so consumers that re-group into an insertion-ordered `Map` get
 * both the group and within-group order for free.
 *
 * @returns An object containing the list of visible collections.
 */
export function useVisibleCollections() {
  const { config } = useConfig();
  const { isEntityVisible } = useEntityVisibility();

  const visibleCollections = useMemo(
    () =>
      (options: Options = {}) =>
        config.collections
          .filter(
            (col) =>
              !options.exclude?.includes(col.slug) &&
              !col.slug.startsWith('payload-') &&
              // `admin.hidden` is resolved per user server-side
              isEntityVisible({ collectionSlug: col.slug })
          )
          .sort((a, b) => {
            const groupDiff =
              rankOf(groupRank, localize(a.admin.group, 'en')) -
              rankOf(groupRank, localize(b.admin.group, 'en'));
            if (groupDiff !== 0) {
              return groupDiff;
            }

            const collectionDiff =
              rankOf(collectionRank, a.slug) - rankOf(collectionRank, b.slug);
            if (collectionDiff !== 0) {
              return collectionDiff;
            }

            return a.slug.localeCompare(b.slug);
          }),
    [config.collections, isEntityVisible]
  );

  return visibleCollections;
}
