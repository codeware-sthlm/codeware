import { getTenantContext } from '@codeware/app-cms/data-access';
import { isUser } from '@codeware/app-cms/util/misc';
import type { User } from '@codeware/shared/util/payload-types';
import type { Access } from 'payload';

import { findTenantByApiKey } from '../../../security/find-tenant-by-api-key';

/**
 * Restrict access to the tenant matching the current deployment's API key in tenant mode.
 *
 * This will ensure that the multi-tenant plugin only allows access to the single tenant in tenant mode.
 * Otherwise the plugin would detect all tenants the user has access to.
 */
export const restrictToTenantInTenantMode: Access<User> = async ({
  data,
  req: { payload, user }
}) => {
  // Must be authenticated
  if (!isUser(user)) {
    return false;
  }

  // Check if we're in tenant mode, restricting to a single tenant
  const tenantContext = await getTenantContext();

  if (tenantContext) {
    // Fetch tenant ID from API key
    const tenant = await findTenantByApiKey(
      payload,
      tenantContext.tenantApiKey
    );
    // Restrict to this tenant only
    return {
      id: { equals: tenant?.id }
    };
  }

  // Authenticated, allow access
  return true;
};
