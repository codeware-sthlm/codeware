import { TenantSelector } from '@payloadcms/plugin-multi-tenant/rsc';
import { cookies } from 'next/headers';
import type { CollectionSlug, ServerProps } from 'payload';
import React from 'react';

import {
  type PayloadRuntime,
  getCollectionCounts,
  getCountableSlugs,
  mapToRuntime
} from '@codeware/app-cms/data-access';
import type { TenantIconConfig } from '@codeware/shared/util/payload-types';

import { AdminNav } from './AdminNav.client';
import { getTenantWhere } from './utils/tenant-where';

const SKIPPED_COUNT_SLUGS: Set<CollectionSlug> = new Set([
  // Not displayed in the nav
  'users',
  'tenants',
  // Multi-tenant globals only have one document by design
  'navigation',
  'site-settings'
] satisfies CollectionSlug[]);

/**
 * Resolve the icon for each tenant the user can access into a serializable
 * `tenantId → iconConfig` map (access-controlled via the runtime). The nav
 * header looks it up by the selected tenant, so switching is instant and there
 * is no client fetch / avatar flash. Icons come from the virtual `iconConfig`
 * field, populated in the tenants collection's `afterRead` hook.
 */
async function getTenantIcons(
  runtime: PayloadRuntime
): Promise<Record<string, TenantIconConfig | null>> {
  const { payload } = runtime;
  const icons: Record<string, TenantIconConfig | null> = {};
  try {
    const { docs } = await payload.find({
      collection: 'tenants',
      depth: 0,
      limit: 0,
      overrideAccess: payload.authenticatedUser === null,
      user: payload.authenticatedUser
    });
    for (const tenant of docs) {
      icons[String(tenant.id)] =
        (tenant.iconConfig as TenantIconConfig | null) ?? null;
    }
  } catch {
    // Non-fatal — the header falls back to the initial avatar / cloud mark
  }
  return icons;
}

/**
 * Server-component wrapper for the custom admin sidebar.
 *
 * Fetches collection counts through the shared data-access layer (Payload
 * local API, access control applied via the authenticated runtime) and
 * passes them as plain serializable props to the client Nav component.
 *
 * The multi-tenant plugin's `TenantSelector` is rendered here and handed to
 * the client Nav as a ReactNode slot: its `/rsc` export pulls in server-only
 * modules (payload → undici → `node:` schemes) that must never enter the
 * client bundle. Its type demands the full `beforeNav` slot contract, but the
 * implementation only reads `label` and `viewType` — the rest is satisfied by
 * spreading the `ServerProps` we already received.
 */
const AdminNavWrapper: React.FC<ServerProps> = async (serverProps) => {
  const { payload, user } = serverProps;

  const runtime = mapToRuntime(payload, user);
  const tenantWhere = await getTenantWhere(user);

  // Count only the collections visible to this user (respecting access control).
  // The tenant scope is applied per-collection inside `getCollectionCounts`, so
  // non-tenant collections (faq) keep their count when a workspace is selected.
  const slugsToCount = getCountableSlugs(payload, user, {
    skip: SKIPPED_COUNT_SLUGS
  });

  const [initialCounts, tenantIcons] = await Promise.all([
    getCollectionCounts(runtime, slugsToCount, { tenantWhere }),
    getTenantIcons(runtime)
  ]);

  // Read the shadcn Sidebar's own persisted state cookie server-side so the
  // correct expanded/collapsed layout is present on first paint (no flash).
  const cookieStore = await cookies();
  const sidebarOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  return (
    <AdminNav
      initialCounts={initialCounts}
      tenantIcons={tenantIcons}
      sidebarOpen={sidebarOpen}
      tenantSelector={
        <TenantSelector
          {...serverProps}
          enabledSlugs={[]}
          label={{ en: 'Workspace scope', sv: 'Vald arbetsyta' }}
        />
      }
    />
  );
};

export default AdminNavWrapper;
