import type { AccessArgs } from 'payload';

/**
 * Allows access if the user is authenticated.
 */
export const authenticatedAccess = ({ req: { user } }: AccessArgs) =>
  Boolean(user);
