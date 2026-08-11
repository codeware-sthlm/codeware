import { isTenant, isUser } from '@codeware/app-cms/util/misc';
import type { Access } from 'payload';

/**
 * Create access control for tour signups.
 *
 * Two callers are legitimate: a tenant api key, when a customer signs up on the
 * site, and an admin user, when the guide takes a signup over the phone. Any
 * other caller is denied here rather than left to fail later on the required
 * tenant field — `ensureTenantFromApiKey` only populates it for a tenant
 * identity, and an admin user picks the tenant through the multi-tenant plugin.
 *
 * Which tour the signup may reference is enforced by `verifyTourTenant`.
 */
export const signupCreateAccess: Access = ({ req: { user } }) =>
  isTenant(user) || isUser(user);
