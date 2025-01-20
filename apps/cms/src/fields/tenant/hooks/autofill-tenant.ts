import { getTenantAccessIDs } from '@codeware/shared/util/payload';
import type { FieldHook } from 'payload/types';

import { resolveTenant } from '../../../utils/resolve-tenant';

/**
 * Autofills the tenant field when there's no value.
 *
 * 1. Use the scoped tenant when there is one
 * 2. Use the tenant when the user only has one tenant
 */
export const autofillTenant: FieldHook = async ({
  req: { headers, payload, user },
  value
}) => {
  if (value) {
    return value;
  }

  const response = await resolveTenant({
    headers,
    payload,
    userOrTenant: user
  });

  if (response && response.tenantID) {
    return response.tenantID;
  }

  const tenantIDs = getTenantAccessIDs(user);
  if (tenantIDs.length === 1) {
    return tenantIDs[0];
  }
};
