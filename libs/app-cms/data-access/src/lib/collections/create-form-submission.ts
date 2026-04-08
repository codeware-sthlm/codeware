import type { FormSubmission } from '@codeware/shared/util/payload-types';

import type { PayloadRuntime } from '../payload-runtime.types';

import type { QuerySingleOptions } from './types';

/**
 * Create a new form submission.
 *
 * This function respects access control when `authenticatedUser` is present.
 *
 * @param runtime - Authenticated Payload runtime instance
 * @param data - Form submission data
 * @returns The created form submission document
 * @throws Error if creating the form submission fails
 */
export async function createFormSubmission(
  runtime: PayloadRuntime,
  data: FormSubmission,
  options: Pick<QuerySingleOptions, 'locale'> = {}
) {
  const { payload, tenantConfig } = runtime;
  const { form, submissionData } = data;
  const { locale } = options;
  const overrideAccess = payload.authenticatedUser === null;

  return await payload.create({
    collection: 'form-submissions',
    data: {
      form,
      submissionData
    },
    locale: locale ?? tenantConfig?.locale,
    overrideAccess,
    user: payload.authenticatedUser
  });
}
