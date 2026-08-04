import { getUserTenantIDs } from '@codeware/app-cms/util/misc';
import type { User } from '@codeware/shared/util/payload-types';
import type { CollectionAfterLoginHook } from 'payload';

import { resolveScopedTenant } from '../../../security/resolve-scoped-tenant';

/**
 * Selects the tenant's default locale in the admin UI on every login.
 *
 * Payload resolves the content locale from `?locale=` -> the user's `locale`
 * preference -> the config default, so writing the preference here opens the
 * admin in the same locale the client renders.
 *
 * The tenant is the scoped one in tenant mode, otherwise the user's first
 * tenant, which is what the tenant selector defaults to. Users without tenants
 * keep the config default.
 *
 * Failures are non-fatal — a login must never break on a preference write.
 */
export const applyTenantLocaleHook: CollectionAfterLoginHook<User> = async ({
  req: { payload },
  user
}) => {
  try {
    const scopedTenant = await resolveScopedTenant(payload);
    const tenantId = scopedTenant?.id ?? getUserTenantIDs(user)[0];
    if (!tenantId) {
      return user;
    }

    // Access control needs `req.user`, which isn't set during login
    const { docs: settings } = await payload.find({
      collection: 'site-settings',
      where: { tenant: { equals: tenantId } },
      limit: 1,
      depth: 0,
      overrideAccess: true
    });

    const locale = settings[0]?.general?.defaultLocale;
    if (!locale) {
      return user;
    }

    const { docs: preferences } = await payload.find({
      collection: 'payload-preferences',
      where: {
        and: [
          { key: { equals: 'locale' } },
          { 'user.relationTo': { equals: 'users' } },
          { 'user.value': { equals: user.id } }
        ]
      },
      limit: 1,
      depth: 0,
      overrideAccess: true
    });

    const preference = preferences[0];
    if (preference?.value === locale) {
      return user;
    }

    if (preference) {
      await payload.update({
        collection: 'payload-preferences',
        id: preference.id,
        data: { value: locale },
        overrideAccess: true
      });
    } else {
      await payload.create({
        collection: 'payload-preferences',
        data: {
          key: 'locale',
          user: { relationTo: 'users', value: user.id },
          value: locale
        },
        overrideAccess: true
      });
    }
  } catch (error) {
    payload.logger.warn(
      `[applyTenantLocale] Could not apply tenant locale for '${user.email}': ${
        error instanceof Error ? error.message : error
      }`
    );
  }

  return user;
};
