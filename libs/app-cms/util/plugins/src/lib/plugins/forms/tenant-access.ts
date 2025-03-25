import { getUserTenantIDs, hasRole } from '@codeware/app-cms/util/misc';
import type { Access } from 'payload';
import { parseCookies } from 'payload';

/**
 * Custom tenant read access control for form submissions.
 *
 * Form submissions collection doesn't have a tenant field
 * as the documents are created by the client via fetch request
 * without any tenant context.
 *
 * Instead we lookup the connected forms, which have tenant details
 * and compare with the user's tenant IDs.
 *
 * @deprecated Use `ensureTenant` instead.
 *
 * Kept as a valuable function that might be usable elsewhere.
 */
export const tenantAccess: Access = async ({
  req: { headers, payload, user }
}) => {
  // Get tenant if scoped via cookie
  const tenantCookieName = `${payload.config.cookiePrefix}-tenant`;
  const selectedTenant = parseCookies(headers).get(tenantCookieName);

  // Get tenant IDs for the user
  const userTenantIDs = getUserTenantIDs(user);

  let tenantIDs: Array<number> = [];

  if (selectedTenant) {
    // Only allow access to the selected tenant forms
    tenantIDs = [Number(selectedTenant)];
  } else if (hasRole(user, 'system-user')) {
    // System user can access all when no tenant is selected
    return true;
  } else {
    // User can access all forms for their tenant IDs
    tenantIDs = userTenantIDs;
  }

  // Get all forms for the tenant IDs
  const forms = await payload.find({
    collection: 'forms',
    where: { tenant: { in: tenantIDs } },
    depth: 0,
    pagination: false
  });

  if (forms.totalDocs === 0) {
    return false;
  }

  const formIds = forms.docs.map((form) => form.id);

  // Query form submissions for the form ids
  return {
    form: {
      in: formIds
    }
  };
};
