import { ValidationError } from 'payload/errors';
import { FieldHook } from 'payload/types';

import type { CollectionSlug } from '../../../utils/custom-types';
import { getTenantAccessIDs } from '../../../utils/get-tenant-access-ids';
import { hasRole } from '../../../utils/has-role';

export const ensureUniqueSlug = (collection: CollectionSlug): FieldHook => {
  return async ({ data, originalDoc, req: { user, payload }, value }) => {
    // Only validate collections scoped to tenants
    if (collection === 'tenants' || collection === 'users') {
      return value;
    }

    // if value is unchanged, skip validation
    if (originalDoc.slug === value) {
      return value;
    }

    const incomingTenantID =
      typeof data?.tenant === 'object' ? data.tenant.id : data?.tenant;
    const currentTenantID =
      typeof originalDoc?.tenant === 'object'
        ? originalDoc.tenant.id
        : originalDoc?.tenant;
    const tenantIDToMatch = incomingTenantID || currentTenantID;

    const findDuplicatePages = await payload.find({
      collection: collection,
      where: {
        and: [
          {
            tenant: {
              equals: tenantIDToMatch
            }
          },
          {
            slug: {
              equals: value
            }
          }
        ]
      }
    });

    if (findDuplicatePages.docs.length > 0 && user) {
      const tenantIDs = getTenantAccessIDs(user);

      // if the user is an admin or has access to more than 1 tenant
      // provide a more specific error message
      if (hasRole(user, 'system-user') || tenantIDs.length > 1) {
        const attemptedTenantChange = await payload.findByID({
          id: tenantIDToMatch,
          collection: 'tenants'
        });
        throw new ValidationError([
          {
            message: `The "${attemptedTenantChange.name}" tenant already has a page with the slug "${value}". Slugs must be unique per tenant.`,
            field: 'slug'
          }
        ]);
      }

      throw new ValidationError([
        {
          message: `A page with the slug ${value} already exists. Slug must be unique per tenant.`,
          field: 'slug'
        }
      ]);
    }

    return value;
  };
};
