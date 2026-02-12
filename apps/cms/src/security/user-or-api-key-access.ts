import type { Access } from 'payload';

import { getEnv } from '@codeware/app-cms/feature/env-loader';
import { isUser } from '@codeware/app-cms/util/misc';
import { verifySignature } from '@codeware/shared/util/signature';

/**
 * Collection access control supporting both user access and
 * tenant API key access with conditional signature verification.
 *
 * Ensures authenticated user or a tenant via API key.
 * When a tenant is detected, access is restricted to the tenant scope.
 *
 * Use this read access control for all tenant enabled collections.
 *
 * **Normal users**
 *
 * Allows access when authenticated.
 *
 * **Tenant users**
 *
 * Besides requiring authentication, additionally verifies request signature based on
 *
 * - `APP_TYPE=platform`: Signature verification is **enabled** (CMS host)
 * - `APP_TYPE=tenant`: Signature verification is **disabled** (Next.js internal client)
 *
 * Returns access filter for the tenant permissions, which will be merged
 * with the multi-tenant plugin's tenant access control.
 *
 * @returns Access control function with user and tenant scope support.
 */
export const userOrApiKeyAccess = (): Access => (args) => {
  const {
    req: { headers, payload, user }
  } = args;

  // Restrict to authenticated users only
  if (!user) {
    return false;
  }

  // Allow access for normal users
  if (isUser(user)) {
    return true;
  }

  // For tenant users, verify signature if app type is platform (headless CMS host)
  const { APP_TYPE, SIGNATURE_SECRET } = getEnv();

  if (APP_TYPE === 'platform') {
    if (!SIGNATURE_SECRET) {
      payload.logger.error(
        `Denied, missing signature secret for ${user.slug} tenant`
      );
      return false;
    }

    // Verify client request signature
    const { success, error } = verifySignature({
      headers,
      secret: SIGNATURE_SECRET
    });

    if (!success) {
      payload.logger.info(`Tenant denied, invalid signature:\n${error}`);
      return false;
    }
  }

  // Restrict access to the tenant scope
  return {
    tenant: { equals: user.id }
  };
};
