import { isTenant } from '@codeware/app-cms/util/misc';
import type { Access } from 'payload';

/**
 * Create access control for form submissions.
 *
 * Submissions are always created on behalf of a tenant API key client, either
 * from the cms site route or from an external client. The `ensureTenant` hook
 * needs that identity to populate the required tenant field, so any other
 * caller would only end up with a failed validation.
 */
export const submissionCreateAccess: Access = ({ req: { user } }) =>
  isTenant(user);
