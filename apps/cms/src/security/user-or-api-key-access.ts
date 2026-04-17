import type { Access, Where } from 'payload';

import { getEnv } from '@codeware/app-cms/feature/env-loader';
import { isUser } from '@codeware/app-cms/util/misc';
import { verifySignature } from '@codeware/shared/util/signature';

import { resolveScopedTenant } from './resolve-scoped-tenant';

/**
 * Read access control for tenant-enabled collections.
 *
 * Unauthenticated requests are always denied. Authenticated behavior differs
 * by identity type:
 *
 * **Admin users**
 *
 * - Tenant mode: scoped to the active tenant so users with multi-tenant
 *   memberships only see content for the running deployment. Combined with the
 *   multi-tenant plugin's own constraint, results are narrowed to the active
 *   tenant only. The tenant is resolved from `APP_MODE.apiKey` (or seed data
 *   in development).
 * - Host mode: unrestricted — the multi-tenant plugin handles scoping via the
 *   `payload-tenant` cookie.
 *
 * Admin users are never restricted by draft status. They see all documents
 * regardless of `_status` so the admin panel can show drafts freely.
 *
 * **Tenant (API key) clients**
 *
 * Always scoped to the tenant. When `hasStatus` is `true` (draft-enabled
 * collections), results are further filtered to `_status = 'published'` or
 * documents without a status (legacy documents created before versioning was
 * enabled). This prevents clients from inadvertently reading draft content.
 *
 * In host mode, external REST requests are additionally verified with a
 * request signature. Internal Local API calls (no `host` header) skip
 * verification — they run in-process and cannot be spoofed.
 *
 * @param hasStatus - Set to `true` for draft-enabled collections to restrict
 *   API key clients to published documents only.
 */
export const userOrApiKeyAccess =
  (hasStatus = false): Access =>
  async (args) => {
    const {
      req: { headers, payload, user }
    } = args;

    // Restrict to authenticated users only
    if (!user) {
      return false;
    }

    const { APP_MODE } = getEnv();

    // Allow access to admin panel for normal users, scoped to active tenant in tenant mode.
    if (isUser(user)) {
      if (APP_MODE.type === 'tenant') {
        const tenant = await resolveScopedTenant(payload);

        // Ensure the authenticated user docs are also scoped to the resolved tenant.
        // No restrictions on draft/published status - the admin UI should be able to read all docs in the active tenant.
        if (tenant) {
          return { tenant: { equals: tenant.id } };
        }

        // If we can't resolve a tenant, deny access to be safe (shouldn't happen in tenant mode)
        payload.logger.warn(
          '[userOrApiKeyAccess] Could not resolve tenant for tenant-mode user, denying access'
        );
        return false;
      }

      return true;
    }

    // cms host mode
    if (APP_MODE.type === 'host') {
      // Detect if this is an external REST API request vs internal Local API operation
      const isExternalRequest = headers.has('host');

      // Only verify signature for external REST API requests
      if (isExternalRequest) {
        const { success, error } = verifySignature({
          headers,
          secret: APP_MODE.signatureSecret
        });

        if (!success) {
          payload.logger.info(`Tenant denied, invalid signature:\n${error}`);
          return false;
        }
      }
      // Internal Local API operations (no 'host' header) skip signature verification
    }

    // Restrict access to the tenant scope
    const tenantConstraint: Where = { tenant: { equals: user.id } };

    if (!hasStatus) {
      return tenantConstraint;
    }

    // For draft-enabled collections: clients only see published docs or legacy null-status docs
    return {
      and: [
        tenantConstraint,
        {
          or: [
            { _status: { equals: 'published' } },
            { _status: { exists: false } }
          ]
        }
      ]
    };
  };
