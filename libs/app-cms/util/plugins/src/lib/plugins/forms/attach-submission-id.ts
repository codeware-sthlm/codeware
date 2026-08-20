import type { BeforeEmail } from '@payloadcms/plugin-form-builder/types';

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
 *
 * The plugin's own type for this hook understates its runtime shape:
 * `beforeEmail` is wired as the FormSubmissions `afterChange` hook and always
 * passes a `doc`, even though the declared param type is its `beforeChange`
 * (data-only) shape — see `sendEmail.js` in `@payloadcms/plugin-form-builder`.
 */
export const attachSubmissionId: BeforeEmail = (emails, params) => {
  const submissionId = (params as unknown as { doc?: { id?: unknown } }).doc
    ?.id;

  if (submissionId == null) {
    return emails;
  }

  return emails.map((email) => ({
    ...email,
    headers: { [SUBMISSION_ID_HEADER]: String(submissionId) }
  }));
};
