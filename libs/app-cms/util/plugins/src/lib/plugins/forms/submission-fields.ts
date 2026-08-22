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
 * Whether the submission's notification email was expected, and if so, what
 * happened to it.
 *
 * | value | meaning |
 * | -- | -- |
 * | `not-configured` | the form has no notification emails — nothing was expected |
 * | `no-recipient` | a notification was configured but resolved to no address |
 * | `sent` | delivered to the transport |
 * | `failed` | the transport rejected it |
 *
 * Null means only "predates this field" — every submission from here on
 * gets one of the four values above, so a correctly-quiet form is no longer
 * indistinguishable from one nothing was ever recorded for.
 *
 * Hidden from the admin form for the same reason as `readAt`: submissions are
 * immutable, and this is set by `recordDeliveryStatus`, never by hand.
 */
const notificationStatus: Field = {
  name: 'notificationStatus',
  type: 'select',
  options: ['not-configured', 'no-recipient', 'sent', 'failed'],
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
