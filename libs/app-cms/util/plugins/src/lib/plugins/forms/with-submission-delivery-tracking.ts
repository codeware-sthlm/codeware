import type { EmailAdapter } from 'payload';

import { SUBMISSION_ID_HEADER } from './attach-submission-id';
import { recordOutcome } from './delivery-outcomes';

const parseSubmissionId = (headers: unknown): number | null => {
  if (!headers || typeof headers !== 'object') {
    return null;
  }
  const value = (headers as Record<string, unknown>)[SUBMISSION_ID_HEADER];
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

/**
 * Note whether a form submission's notification email actually sent.
 *
 * Wraps the resolved email adapter rather than a plugin hook, because the form
 * builder plugin has no after-send hook and swallows the send error itself:
 * the transport's own `sendEmail` is the only place the outcome is ever known
 * (COD-288 went unnoticed for 17 months for exactly this reason).
 *
 * The outcome is only *noted* here, never written. An adapter has no `req`, so
 * a write from here would run outside the transaction that is still creating
 * the submission and fail with a 404 on a row that does not exist yet — which
 * is precisely what it did before. `recordDeliveryStatus`, a collection hook
 * with a `req`, does the writing.
 *
 * Correlates via {@link SUBMISSION_ID_HEADER}, stamped on the message by
 * `attachSubmissionId`. A message with no such header (every other mail this
 * deployment sends) passes straight through untouched.
 */
export const withSubmissionDeliveryTracking = (
  adapter: EmailAdapter | Promise<EmailAdapter>
): EmailAdapter | Promise<EmailAdapter> => {
  const wrap: (factory: EmailAdapter) => EmailAdapter = (factory) => (args) => {
    const inner = factory(args);

    return {
      ...inner,
      sendEmail: async (message) => {
        const submissionId = parseSubmissionId(message.headers);

        try {
          const result = await inner.sendEmail(message);
          if (submissionId) {
            recordOutcome(submissionId, 'sent');
          }
          return result;
        } catch (err) {
          if (submissionId) {
            recordOutcome(submissionId, 'failed');
          }
          throw err;
        }
      }
    };
  };

  return adapter instanceof Promise ? adapter.then(wrap) : wrap(adapter);
};
