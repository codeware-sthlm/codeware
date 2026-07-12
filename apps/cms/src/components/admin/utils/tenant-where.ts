import { getTenantFromCookie } from '@payloadcms/plugin-multi-tenant/utilities';
import { headers } from 'next/headers';
import type { TypedUser, Where } from 'payload';

import { getUserTenantIDs, hasRole } from '@codeware/app-cms/util/misc';

/**
 * Scopes a collection query to the tenant selected via the nav's workspace
 * switcher (`payload-tenant` cookie), falling back to the user's assigned
 * tenants. Returns `undefined` for users with access to all tenants who
 * haven't selected one, so callers can spread it straight into `where`.
 *
 * Mirrors `@payloadcms/plugin-multi-tenant`'s own `filterDocumentsByTenants`,
 * reimplemented here because that helper needs a full `PayloadRequest` —
 * Nav/Dashboard server components only ever receive `payload` and `user`
 * (confirmed: `req` is `undefined` on `ServerProps` for these view slots).
 */
export function getTenantWhereFromHeaders(
  headersList: Headers,
  user: TypedUser | null | undefined
): Where | undefined {
  const selectedTenant = getTenantFromCookie(headersList, 'text');

  if (selectedTenant) {
    return { tenant: { equals: selectedTenant } };
  }

  if (hasRole(user ?? null, 'system-user')) {
    return undefined;
  }

  const userTenantIds = getUserTenantIDs(user ?? null);
  return userTenantIds.length > 0
    ? { tenant: { in: userTenantIds } }
    : undefined;
}

/**
 * Request-context wrapper around {@link getTenantWhereFromHeaders} for server
 * components, where headers come from `next/headers`. Endpoint handlers have
 * `req.headers` and should call the headers variant directly.
 */
export async function getTenantWhere(
  user: TypedUser | null | undefined
): Promise<Where | undefined> {
  return getTenantWhereFromHeaders(await headers(), user);
}
