import type { User } from '@codeware/shared/util/payload-types';
import type { Payload, PayloadRequest } from 'payload';

export type UserData = Pick<
  User,
  'description' | 'email' | 'name' | 'password' | 'role' | 'tenants'
>;

/**
 * Ensure that a user exist with the given email.
 *
 * @param payload - Payload instance
 * @param req - Payload request with transaction ID when supported by the database
 * @param data - User data
 * @returns The user ID if exists or created, otherwise undefined
 * @throws Never - just logs errors
 */
export async function ensureUser(
  payload: Payload,
  req: PayloadRequest,
  data: UserData
): Promise<User | string | number> {
  const { description, email, name, password, role, tenants } = data;

  // Check if the user exists with the given email
  const users = await payload.find({
    req,
    collection: 'users',
    where: {
      email: { equals: email }
    },
    depth: 0,
    limit: 1
  });

  if (users.totalDocs) {
    return users.docs[0].id;
  }

  // No user found, create one

  const user = await payload.create({
    req,
    collection: 'users',
    data: {
      description,
      email,
      name,
      password,
      role,
      tenants
    }
  });

  return user;
}
