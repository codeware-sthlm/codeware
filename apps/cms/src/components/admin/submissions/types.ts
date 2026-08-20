import type { ResolvedSubmissionField } from '@codeware/shared/util/payload-utils';

/** One submission, flattened for display. */
export type SubmissionListItem = {
  id: number;
  /** Both null when the parent form is gone; the client labels that case */
  formId: number | null;
  formTitle: string | null;
  /** ISO timestamp the submission was received */
  receivedAt: string;
  read: boolean;
  /** The notification email for this submission failed to send */
  notificationFailed: boolean;
  /** Values in the parent form's field order, labelled by it */
  fields: Array<ResolvedSubmissionField>;
};

/** A form offered in the list view's filter. */
export type SubmissionFormOption = {
  id: number;
  title: string;
};

/** Filters the list view reads from, and writes back to, the URL. */
export type SubmissionsFilter = {
  /** Selected form id, or null for "all forms" */
  formId: number | null;
  unreadOnly: boolean;
  page: number;
};
