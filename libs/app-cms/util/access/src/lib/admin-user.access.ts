import { isUser } from '@codeware/app-cms/util/misc';
import type { AccessArgs } from 'payload';

/**
 * Allows access if the authenticated identity is an admin user.
 *
 * Denies tenant API key clients, which the multi-tenant plugin never constrains
 * to a tenant — an identity check is the only thing standing between a key and
 * every tenant's documents.
 */
export const adminUserAccess = ({ req: { user } }: AccessArgs) => isUser(user);
