import { hasRole } from '@codeware/app-cms/util/misc';
import type { PayloadRequest } from 'payload';

/**
 * Access control supporting both collection and field level.
 *
 * Allows access if the user has the `system-user` role.
 */
export const systemUserAccess = <T extends { req: PayloadRequest }>({
  req: { user }
}: T): boolean => hasRole(user, 'system-user');
