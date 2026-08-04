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
  req,
  user
}) => {
  const { payload } = req;

  // Login runs in a transaction and the preference field derives its owner from
  // `req.user`, which login hasn't set yet. A copy carries the transaction into
  // every call below — writing outside it deadlocks against the open login —
  // while keeping the added identity off the request Payload is still using.
  const localReq = { ...req, user: { ...user, collection: 'users' as const } };

  try {
    const scopedTenant = await resolveScopedTenant(payload);
    const tenantId = scopedTenant?.id ?? getUserTenantIDs(user)[0];
    if (!tenantId) {
      return user;
    }

    const { docs: settings } = await payload.find({
      collection: 'site-settings',
      where: { tenant: { equals: tenantId } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req: localReq
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
      overrideAccess: true,
      req: localReq
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
        overrideAccess: true,
        req: localReq
      });
    } else {
      await payload.create({
        collection: 'payload-preferences',
        data: {
          key: 'locale',
          // Overwritten from `req.user` by the field's own hook, but required
          user: { relationTo: 'users', value: user.id },
          value: locale
        },
        overrideAccess: true,
        req: localReq
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
