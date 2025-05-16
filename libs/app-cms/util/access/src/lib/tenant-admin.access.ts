import { getUserTenantIDs, hasRole } from '@codeware/app-cms/util/misc';
import type {
  FieldAccessArgs,
  FieldAccessResponse
} from '@codeware/shared/util/payload-types';
import type { AccessArgs, AccessResult } from 'payload';

/**
 * Access control supporting both collection and field level.
 *
 * Allow access to tenant admins for the tenant the document belongs to.
 * This is determined by looking for the `tenant` property in the document data.
 *
 * Otherwise, allow access if the user is a tenant admin for any tenant.
 */
export function tenantAdminAccess(args: AccessArgs): AccessResult;
export function tenantAdminAccess(args: FieldAccessArgs): FieldAccessResponse;
export function tenantAdminAccess(
  args: AccessArgs | FieldAccessArgs
): AccessResult | FieldAccessResponse {
  const {
    req: { user }
  } = args;

  // Get tenant IDs where the user is a tenant admin
  const tenantIDs = getUserTenantIDs(user, 'admin');

  // If tenant property exists in data or doc, we can verify tenant admin access for the document
  if (
    // doc is original document data for field access on update
    ('doc' in args && args.doc?.tenant) ||
    // data is only null on list requests
    (args.data && args.data?.tenant)
  ) {
    // Fields access doesn't support query constraints
    // https://payloadcms.com/docs/access-control/fields
    if ('doc' in args) {
      const tenant = args.doc?.tenant ?? args.data?.['tenant'];
      if (!tenant) {
        throw new Error('Expected to find tenant in fields doc or data');
      }
      return tenantIDs.includes(tenant);
    }

    return {
      tenant: {
        in: tenantIDs
      }
    };
  }

  // Otherwise, just check if the user is a tenant admin for any tenant
  return tenantIDs.length > 0;
}
