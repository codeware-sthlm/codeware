import type { Access } from 'payload/types';

import type { User } from '../../../generated/payload-types';
import { getId } from '../../../utils/get-id';
import { hasRole } from '../../../utils/has-role';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const canMutateTenant: Access<any, User> = (args) => {
  const {
    req: { user }
  } = args;

  if (!user) {
    return false;
  }

  // System users can mutate docs for any tenant
  if (hasRole(user, 'system-user')) {
    return true;
  }

  // Tenant admins can mutate docs for their own tenant
  return {
    id: {
      in:
        user?.tenants
          ?.map(({ role, tenant }) =>
            role === 'admin' ? tenant && getId(tenant) : null
          )
          .filter(Boolean) || []
    }
  };
};
