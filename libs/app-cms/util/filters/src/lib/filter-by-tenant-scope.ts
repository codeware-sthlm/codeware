import { hasRole } from '@codeware/app-cms/util/misc';
import { getTenantListFilter } from '@payloadcms/plugin-multi-tenant/utilities';
import type { CollectionSlug, PayloadRequest } from 'payload';

/**
 * Filter collection by the current tenant scope.
 *
 * @param req - The request object.
 * @param collection - The collection slug to filter.
 * @returns The filter options or an empty object if the collection is not tenant scoped.
 */
export const filterByTenantScope = (
  req: PayloadRequest,
  collection: CollectionSlug
) => {
  const context = req.context;

  // Skip filtering when seeding
  if (context?.['seedAction']) {
    return {};
  }

  // TODO: Type safe way to get the tenant field name
  const filterFieldName = collection === 'users' ? 'tenants.tenant' : 'tenant';

  return (
    getTenantListFilter({
      req,
      filterFieldName,
      tenantsCollectionSlug: collection,
      userHasAccessToAllTenants: (user) => hasRole(user, 'system-user')
    }) ?? {}
  );
};
