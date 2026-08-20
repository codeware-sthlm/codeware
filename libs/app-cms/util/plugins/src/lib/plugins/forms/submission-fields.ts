import type { Field } from 'payload';

/**
 * Timestamp of when an editor first opened the submission.
 *
 * Null means unread, which is what the dashboard message count and the list
 * view's unread marker read. Indexed because the list filters on it.
 *
 * Hidden from the admin: submissions are immutable (`update: () => false`) and
 * the value is set by the `form-submissions-read` endpoint, never by hand.
 */
const readAt: Field = {
  name: 'readAt',
  type: 'date',
  index: true,
  admin: { hidden: true }
};

/**
 * Whether the submission's notification email was actually delivered.
 *
 * Null on a submission that predates this field, and on one whose form has
 * no notification emails configured at all — neither is a failure.
 *
 * Hidden from the admin form for the same reason as `readAt`: submissions are
 * immutable, and this is set by `withSubmissionDeliveryTracking`, wrapped
 * around the email adapter, never by hand.
 */
const notificationStatus: Field = {
  name: 'notificationStatus',
  type: 'select',
  options: ['sent', 'failed'],
  admin: { hidden: true }
};

/**
 * Extend the plugin's submission fields with our own.
 */
export const submissionFields = ({
  defaultFields
}: {
  defaultFields: Field[];
}): Field[] => [...defaultFields, readAt, notificationStatus];
