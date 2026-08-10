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
 * Extend the plugin's submission fields with our own.
 */
export const submissionFields = ({
  defaultFields
}: {
  defaultFields: Field[];
}): Field[] => [...defaultFields, readAt];
