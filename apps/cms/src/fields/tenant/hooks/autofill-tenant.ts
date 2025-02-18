import { type FieldHook, ValidationError } from 'payload';

import { getUserTenantIDs } from '@codeware/app-cms/util/functions';
import { Tenant } from '@codeware/shared/util/payload-types';

import { resolveTenant } from '../../../utils/resolve-tenant';
import { tenantName } from '../tenant.field';

/**
 * Autofills the tenant field when there's no value.
 *
 * 1. Use the scoped tenant when there is one
 * 2. Use the tenant when the user only has one tenant
 * 3. Throw an error if the user must select a tenant manually
 */
export const autofillTenant: FieldHook<Tenant> = async ({
  collection,
  data,
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

  const tenantIDs = getUserTenantIDs(user);
  if (tenantIDs.length === 1) {
    return tenantIDs[0];
  }

  // Since it's not possible to set the field as required,
  // we throw an error to the user
  throw new ValidationError({
    collection: collection?.slug,
    errors: [
      {
        message: 'Workspace is required.',
        path: tenantName
      }
    ],
    id: data?.id
  });
};
