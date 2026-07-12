import type { ServerProps, Where } from 'payload';
import React from 'react';

import {
  QueryMultipleOptions,
  getCollectionCounts,
  getCountableSlugs,
  getPages,
  getPosts,
  getPreference,
  mapToRuntime
} from '@codeware/app-cms/data-access';
import type { RecentDoc } from '@codeware/app-cms/ui/dashboard';
import type { SupportedLocale } from '@codeware/shared/util/i18n';
import type {
  CollectionSlug,
  Page,
  Post
} from '@codeware/shared/util/payload-types';

import { getTenantWhere } from '../utils/tenant-where';

import { AdminDashboard } from './AdminDashboard.client';
import {
  DASHBOARD_PREFERENCES_KEY,
  DEFAULT_DASHBOARD_TAB,
  type DashboardPreferences,
  isDashboardTab
} from './dashboard-preferences';
import { PANEL_MAX_LIMIT } from './panel-limits';

const SKIPPED_COUNT_SLUGS: Set<CollectionSlug> = new Set([
  // Multi-tenant globals only have one document by design
  'navigation',
  'site-settings'
] satisfies CollectionSlug[]);

const toRecentDoc = (
  doc: Post | Page,
  collectionSlug: 'posts' | 'pages'
): RecentDoc => ({
  id: String(doc.id),
  // New unpublished drafts may not have a name/title yet
  title: ('title' in doc ? doc.title : doc.name) ?? '',
  collectionSlug,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
  status: doc._status ?? undefined
});

const byUpdatedAtDesc = (a: RecentDoc, b: RecentDoc) =>
  new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();

/**
 * Server-component wrapper for the custom admin dashboard.
 *
 * Fetches all data through the shared data-access layer (Payload local API,
 * access control applied via the authenticated runtime) and passes plain
 * serializable props to the client component.
 *
 * Payload passes non-serializable props (locale config with toString methods)
 * here — we consume them without forwarding them.
 */
const AdminDashboardView: React.FC<ServerProps> = async ({
  payload,
  user,
  locale
}) => {
  const runtime = mapToRuntime(payload, user);
  const tenantWhere = await getTenantWhere(user);
  const draftsWhere: Where = {
    and: [
      ...(tenantWhere ? [tenantWhere] : []),
      { _status: { equals: 'draft' } }
    ]
  };

  // Query with `draft: true` so filters, sorting and returned data reflect
  // each document's newest version. Never-published documents keep their
  // creation state in the main table (e.g. `tenant` may still be null there),
  // so main-table queries would miss them once a workspace is selected.
  //
  // Each panel merges two collections, so fetch the panel maximum from both —
  // the client slices the merged list to the user's selected limit.
  const listOptions: QueryMultipleOptions<'pages' | 'posts'> = {
    draft: true,
    locale: locale?.code as SupportedLocale,
    where: tenantWhere,
    limit: PANEL_MAX_LIMIT,
    sort: '-updatedAt',
    depth: 0
  };
  const draftOptions: QueryMultipleOptions<'pages' | 'posts'> = {
    ...listOptions,
    where: draftsWhere
  };

  // Count only the collections visible to this user (respecting access control).
  // The tenant scope is applied per-collection inside `getCollectionCounts`, so
  // non-tenant collections (faq) keep their count when a workspace is selected.
  const slugsToCount = getCountableSlugs(payload, user, {
    skip: SKIPPED_COUNT_SLUGS
  });

  // Resolve the last-used tab server-side so the client seeds `useState` with
  // it directly — no mount-time effect, so no flash to the default tab.
  const resolveActiveTab = async () => {
    const preferences = await getPreference<DashboardPreferences>(
      runtime,
      DASHBOARD_PREFERENCES_KEY
    );
    return isDashboardTab(preferences?.activeTab)
      ? preferences.activeTab
      : DEFAULT_DASHBOARD_TAB;
  };

  const [counts, recentPosts, recentPages, draftPosts, draftPages, activeTab] =
    await Promise.all([
      getCollectionCounts(runtime, slugsToCount, { tenantWhere }),
      getPosts(runtime, listOptions),
      getPages(runtime, listOptions),
      getPosts(runtime, draftOptions),
      getPages(runtime, draftOptions),
      resolveActiveTab()
    ]);

  const recentDocs = [
    ...(recentPosts?.docs ?? []).map((doc) => toRecentDoc(doc, 'posts')),
    ...(recentPages?.docs ?? []).map((doc) => toRecentDoc(doc, 'pages'))
  ]
    .sort(byUpdatedAtDesc)
    .slice(0, PANEL_MAX_LIMIT);

  const drafts = [
    ...(draftPosts?.docs ?? []).map((doc) => toRecentDoc(doc, 'posts')),
    ...(draftPages?.docs ?? []).map((doc) => toRecentDoc(doc, 'pages'))
  ]
    .sort(byUpdatedAtDesc)
    .slice(0, PANEL_MAX_LIMIT);

  const userName = user?.name ?? '';

  return (
    <AdminDashboard
      userName={userName}
      counts={counts}
      recentDocs={recentDocs}
      drafts={drafts}
      initialActiveTab={activeTab}
    />
  );
};

export default AdminDashboardView;
