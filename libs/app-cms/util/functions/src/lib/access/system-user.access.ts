import type { Access } from 'payload';

import { hasRole } from '../has-role';

/**
 * Access control reading the request for the logged in user.
 *
 * Allows access if the user has the `system-user` role.
 */
export const systemUserAccess: Access = ({ req: { user } }) =>
  hasRole(user, 'system-user');
