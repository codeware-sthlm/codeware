import type { Form, FormSubmission } from '@codeware/shared/util/payload-types';
import { resolveSubmissionFields } from '@codeware/shared/util/payload-utils';

import type { SubmissionListItem } from './types';

/**
 * Flatten submissions for display, labelling each value from its parent form.
 *
 * Submissions are fetched at `depth: 0`, so the form relation is an id — the
 * caller passes the forms it already loaded for the filter rather than paying
 * a populate per row. A submission whose form is missing from that set keeps a
 * null title; the client renders the translated fallback.
 *
 * @param submissions - Submissions as stored
 * @param forms - Forms the caller can read
 */
export function toSubmissionRows(
  submissions: Array<FormSubmission>,
  forms: Array<Form>
): Array<SubmissionListItem> {
  const formsById = new Map(forms.map((form) => [form.id, form]));

  return submissions.map((submission) => {
    const formId =
      typeof submission.form === 'number'
        ? submission.form
        : submission.form.id;
    const form = formsById.get(formId) ?? null;

    return {
      id: submission.id,
      formId: form ? formId : null,
      formTitle: form?.title ?? null,
      receivedAt: submission.createdAt,
      read: Boolean(submission.readAt),
      notificationFailed: submission.notificationStatus === 'failed',
      fields: resolveSubmissionFields(form, submission.submissionData)
    };
  });
}
