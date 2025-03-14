import { type CollectionBeforeValidateHook, ValidationError } from 'payload';

import { hasRole } from '@codeware/app-cms/util/misc';
import type { User } from '@codeware/shared/util/payload-types';

/**
 * Ensures that a collection user belongs to a workspace,
 * unless the logged in user is a system user.
 */
export const ensureTenantHook: CollectionBeforeValidateHook<User> = ({
  collection,
  context,
  data,
  req: { user }
}) => {
  // Providing a tenant is not required for system users or when seeding
  if (hasRole(user, 'system-user') || context?.seedAction) {
    return data;
  }

  if (data?.tenants?.length) {
    return data;
  }

  throw new ValidationError({
    collection: collection.slug,
    id: data?.id,
    errors: [
      {
        message: 'User must belong to a workspace.',
        path: 'tenants'
      }
    ]
  });
};
