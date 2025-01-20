import type { User } from '@codeware/shared/util/payload';
import { getId, hasRole } from '@codeware/shared/util/payload';
import type { Access } from 'payload/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const canMutateTenant: Access<any, User> = (args) => {
  const {
    req: { payload, user }
  } = args;

  if (!user) {
    payload.logger.info('Deny mutation: No user authenticated');
    return false;
  }

  // System users can mutate docs for any tenant
  if (hasRole(user, 'system-user')) {
    payload.logger.debug('Allow mutation: System user');
    return true;
  }

  payload.logger.debug(
    'Mutate permission is resolved using server-side query...'
  );

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
