import { Access } from 'payload/types';

import type { User } from '../generated/payload-types';

/**
 * Check if the user has the admin role
 *
 * @param user - The user to check
 * @returns true if the user is an admin, false otherwise
 */
export const isAdmin: Access<boolean, User> = ({ req: { user } }) =>
  user?.role === 'admin';
