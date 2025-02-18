import { Access } from 'payload';

import { hasRole } from '@codeware/app-cms/util/functions';

/**
 * Access control reading the request for the logged in user.
 *
 * Allows access if the user has the `system-user` role.
 */
export const systemUser: Access = ({ req: { user } }) =>
  hasRole(user, 'system-user');
