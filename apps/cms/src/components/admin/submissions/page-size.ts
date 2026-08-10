/**
 * Submissions per page in the list view.
 *
 * Kept at or below the mark-as-read endpoint's `MAX_IDS`, so "mark all read"
 * on a full page is always a single call.
 */
export const PAGE_SIZE = 25;
