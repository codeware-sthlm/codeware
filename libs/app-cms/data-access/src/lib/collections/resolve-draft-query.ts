import { isUser } from '@codeware/app-cms/util/misc';
import type { Where } from 'payload';

import type { PayloadRuntime } from '../payload-runtime.types';

type DraftQuery = {
  /** Whether Payload access control must be bypassed for this query. */
  overrideAccess: boolean;
  /** The provided `where` combined with the draft-mode tenant constraint. */
  where: Where | undefined;
};

/**
 * Resolve the access and scoping concerns shared by the draft-aware
 * collection functions (`getPage`, `getPages`, `getPost`, `getPosts`).
 *
 * - `overrideAccess` — access control is bypassed for unauthenticated fetches,
 *   and in draft mode for non-admin identities (the access function restricts
 *   API key clients to published documents, which draft previews must bypass).
 *   Authenticated admin users keep access control: they may read drafts
 *   already, and bypassing would leak other tenants' content in the admin UI.
 * - `where` — in draft mode an explicit tenant constraint is added to
 *   preserve tenant isolation, since `overrideAccess` also bypasses the
 *   tenant filter from the access control function.
 */
export function resolveDraftQuery(
  runtime: PayloadRuntime,
  draft: boolean | undefined,
  where?: Where
): DraftQuery {
  const { payload, tenantConfig } = runtime;

  const overrideAccess =
    payload.authenticatedUser === null ||
    (draft === true && !isUser(payload.authenticatedUser));

  const tenantWhere: Where | undefined =
    draft && tenantConfig
      ? { tenant: { equals: tenantConfig.tenant.id } }
      : undefined;

  const scopedWhere: Where | undefined = tenantWhere
    ? { and: [...(where ? [where] : []), tenantWhere] }
    : where;

  return { overrideAccess, where: scopedWhere };
}
