import type { BeforeEmail } from '@payloadcms/plugin-form-builder/types';

import { getSubmissionId } from './submission-id';

/** Header carrying the submission id from `beforeEmail` to the transport */
export const SUBMISSION_ID_HEADER = 'x-cdwr-form-submission-id';

/**
 * Stamp the submission id onto every outgoing message.
 *
 * `beforeEmail` is the only place this plugin exposes before the send, and
 * `withSubmissionDeliveryTracking` (wrapped around the email adapter, not a
 * plugin hook — the plugin has no after-send hook and swallows its own send
 * error) is the only place that later knows whether it worked. A header is
 * the one channel between the two.
 */
export const attachSubmissionId: BeforeEmail = (emails, params) => {
  const submissionId = getSubmissionId(params);

  if (submissionId == null) {
    return emails;
  }

  return emails.map((email) => ({
    ...email,
    // Merged rather than replaced: nothing sets headers ahead of this today,
    // but a second `beforeEmail` that did would otherwise be dropped silently
    headers: {
      ...(email as { headers?: Record<string, string> }).headers,
      [SUBMISSION_ID_HEADER]: String(submissionId)
    }
  }));
};
