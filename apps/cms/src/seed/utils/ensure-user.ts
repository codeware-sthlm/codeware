import type { User } from '@codeware/shared/util/payload';
import type { Payload } from 'payload';
import type { TypeWithID } from 'payload/types';

export type UserData = Pick<
  User,
  'description' | 'email' | 'name' | 'password' | 'role' | 'tenants'
>;

const collection = 'users';

/**
 * Ensure that a user exist with the given email.
 *
 * @param payload - Payload instance
 * @param data - User data
 * @returns The user ID if exists or created, otherwise undefined
 * @throws Never - just logs errors
 */
export async function ensureUser(
  payload: Payload,
  data: UserData
): Promise<TypeWithID['id'] | undefined> {
  try {
    const { description, email, name, password, role, tenants } = data;

    // Check if the user exists with the given email
    const users = await payload.find({
      collection,
      where: {
        email: { equals: email }
      },
      depth: 0,
      limit: 1
    });

    if (users.totalDocs) {
      payload.logger.info(`[SEED] Skip: User '${email}' exist`);
      return users.docs[0].id;
    }

    // No user found, create one

    const { id } = await payload.create({
      collection,
      data: {
        description,
        email,
        name,
        password,
        role,
        tenants
      } satisfies Partial<User>
    });

    payload.logger.info(
      `[SEED] User '${email}' was created with ${tenants?.length ?? 0} tenants`
    );

    return id;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
