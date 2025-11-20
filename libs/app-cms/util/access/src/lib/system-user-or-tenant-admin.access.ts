import { hasRole } from '@codeware/app-cms/util/misc';
import type {
  FieldAccessArgs,
  FieldAccessResponse
} from '@codeware/shared/util/payload-types';
import type { AccessArgs, AccessResult } from 'payload';

import { tenantAdminAccess } from './tenant-admin.access';

/**
 * Access control supporting both collection and field level.
 *
 * This function combines `systemUserAccess` and `tenantAdminAccess`
 * for better DX.
 */
export function systemUserOrTenantAdminAccess(args: AccessArgs): AccessResult;
export function systemUserOrTenantAdminAccess(
  args: FieldAccessArgs
): FieldAccessResponse;
export function systemUserOrTenantAdminAccess(
  args: AccessArgs | FieldAccessArgs
): AccessResult | FieldAccessResponse {
  const {
    req: { user }
  } = args;

  // System user always has access
  if (hasRole(user, 'system-user')) {
    return true;
  }

  return tenantAdminAccess(args);
}
