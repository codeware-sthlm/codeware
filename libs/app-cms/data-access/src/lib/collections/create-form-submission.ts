import type { FormSubmission } from '@codeware/shared/util/payload-types';

import type { AuthenticatedPayload } from '../get-authenticated-payload';

/**
 * Create a new form submission with proper access control.
 *
 * @param payload - Authenticated Payload instance
 * @param data - Form submission data
 * @returns The created form submission document
 * @throws Error if creating the form submission fails
 */
export async function createFormSubmission(
  payload: AuthenticatedPayload,
  data: FormSubmission
) {
  const { form, submissionData } = data;

  return await payload.create({
    collection: 'form-submissions',
    data: {
      form,
      submissionData
    },
    overrideAccess: false,
    user: payload.authenticatedUser
  });
}
