import type { Tenant } from '@codeware/shared/util/payload-types';
import type { CollectionBeforeValidateHook, TypeWithID } from 'payload';

import { isTenant } from './is-tenant';

type WithTenant = TypeWithID & {
  tenant?: number | Tenant | null;
};

/**
 * Stamp a new document with the tenant of the api key that created it.
 *
 * Public writes always arrive on a tenant api key, and the tenant has to come
 * from the identity rather than the request body — a caller that could pick its
 * own tenant could write into another workspace.
 *
 * Anything else is left alone: an admin user picks the tenant through the
 * multi-tenant plugin, which applies its own membership check.
 */
export const ensureTenantFromApiKey = <
  T extends WithTenant
>(): CollectionBeforeValidateHook<T> => {
  return ({ data, operation, req: { user } }) => {
    if (operation !== 'create' || !data) {
      return data;
    }

    if (!isTenant(user)) {
      return data;
    }

    data.tenant = user.id;
    return data;
  };
};
