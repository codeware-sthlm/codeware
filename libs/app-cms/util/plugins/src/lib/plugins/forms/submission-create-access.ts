import { isTenant } from '@codeware/app-cms/util/misc';
import type { Access } from 'payload';

/**
 * Create access control for form submissions.
 *
 * Submissions are always created on behalf of a tenant API key client, either
 * from the cms site route or from an external client. Any other caller is
 * denied here, rather than left to fail later on the required tenant field —
 * `ensureTenantFromApiKey` only populates it for a tenant identity.
 *
 * Which tenant the submission may reference is enforced by `verifyFormTenant`.
 */
export const submissionCreateAccess: Access = ({ req: { user } }) =>
  isTenant(user);
