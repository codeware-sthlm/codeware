import type { User } from '@codeware/shared/util/payload';
import { hasRole } from '@codeware/shared/util/payload';

/**
 * Access control reading the request for the logged in user.
 *
 * Allows access if the user has the `system-user` role.
 */
export const systemUser = <T extends { req: { user: User } }>(args: T) =>
  hasRole(args.req.user, 'system-user');
