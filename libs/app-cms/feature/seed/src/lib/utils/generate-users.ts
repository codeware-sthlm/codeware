import { randNumber, randUser } from '@ngneat/falso';

import type { SeedData, SeedRules } from '../seed-types';

/**
 * Generate users seed data for tenants.
 *
 * Password is intentionally left blank to keep it away from the JSON files.
 * They are set when the user is created via **payload local api**.
 *
 * The passwords are no security problem since it's not for production use.
 * By setting a known password we get a decent balance between security and DX.
 */
export const generateUsers = (args: {
  systemUsersRange: NonNullable<SeedRules['systemUsers']>;
  tenantUsersRange: NonNullable<SeedRules['tenantUsers']>;
  tenants: SeedData['tenants'];
}): SeedData['users'] => {
  const { systemUsersRange, tenantUsersRange, tenants } = args;

  // Generate system users
  const length = randNumber({
    min: systemUsersRange.min,
    max: systemUsersRange.max
  });
  const systemUsers: SeedData['users'] = randUser({ length }).map(
    ({ firstName, lastName, email }) =>
      ({
        name: `${firstName} ${lastName}`,
        description: 'Access to manage the system',
        email,
        password: '',
        role: 'system-user',
        tenants: []
      }) satisfies SeedData['users'][number]
  );

  // Generate tenant users
  const tenantUsers: SeedData['users'] = tenants.reduce(
    (users, tenant) => {
      const numberOfAdmins = randNumber({
        min: tenantUsersRange.roleAdmin.min,
        max: tenantUsersRange.roleAdmin.max
      });
      const numberOfUsers = randNumber({
        min: tenantUsersRange.roleUser.min,
        max: tenantUsersRange.roleUser.max
      });

      // Generate admin users for tenant
      const admins: SeedData['users'] = randUser({
        length: numberOfAdmins
      }).map(
        ({ firstName, lastName, email }) =>
          ({
            name: `${firstName} ${lastName}`,
            description: `Administrator access to ${tenant.name}`,
            email,
            password: '',
            role: 'user',
            tenants: [{ lookupApiKey: tenant.apiKey, role: 'admin' }]
          }) satisfies SeedData['users'][number]
      );
      users.push(...admins);

      // Generate normal users for tenant
      const normalUsers: SeedData['users'] = randUser({
        length: numberOfUsers
      }).map(
        ({ firstName, lastName, email }) =>
          ({
            name: `${firstName} ${lastName}`,
            description: `User access to ${tenant.name}`,
            email,
            password: '',
            role: 'user',
            tenants: [{ lookupApiKey: tenant.apiKey, role: 'user' }]
          }) satisfies SeedData['users'][number]
      );
      users.push(...normalUsers);

      return users;
    },
    [] as SeedData['users']
  );

  return [...systemUsers, ...tenantUsers];
};
