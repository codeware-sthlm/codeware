import type { EmailAdapter, Payload } from 'payload';

import { SUBMISSION_ID_HEADER } from './attach-submission-id';

const parseSubmissionId = (headers: unknown): number | null => {
  if (!headers || typeof headers !== 'object') {
    return null;
  }
  const value = (headers as Record<string, unknown>)[SUBMISSION_ID_HEADER];
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const recordDelivery = async (
  payload: Payload,
  id: number,
  notificationStatus: 'sent' | 'failed'
): Promise<void> => {
  try {
    await payload.update({
      collection: 'form-submissions',
      id,
      data: { notificationStatus },
      depth: 0,
      overrideAccess: true
    });
  } catch (err) {
    // A failure to record the outcome must never mask the outcome itself —
    // the caller of sendEmail has already been given the real result
    payload.logger.error({
      err,
      msg: `[email] Could not record notificationStatus for form submission ${id}`
    });
  }
};

/**
 * Record whether a form submission's notification email actually sent.
 *
 * Submissions are immutable to editors (`update: () => false`), so this
 * writes with `overrideAccess` — the same pattern as the `readAt` marker.
 * Wraps the resolved email adapter rather than a plugin hook, because the
 * form builder plugin has no after-send hook and swallows the send error
 * itself: the transport's own `sendEmail` is the only place the outcome is
 * ever known (COD-288 went unnoticed for 17 months for exactly this reason).
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
            await recordDelivery(args.payload, submissionId, 'sent');
          }
          return result;
        } catch (err) {
          if (submissionId) {
            await recordDelivery(args.payload, submissionId, 'failed');
          }
          throw err;
        }
      }
    };
  };

  return adapter instanceof Promise ? adapter.then(wrap) : wrap(adapter);
};
