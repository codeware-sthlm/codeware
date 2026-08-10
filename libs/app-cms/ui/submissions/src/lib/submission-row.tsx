import { Badge } from '@codeware/shared/ui/shadcn/components/badge';

export type SubmissionRowProps = {
  /** Parent form title, or a fallback when the form is gone */
  formTitle: string;
  /** Pre-composed one-line summary of the values */
  preview: string;
  /** Pre-formatted relative time, e.g. `2 hours ago` */
  receivedLabel: string;
  /** ISO timestamp behind `receivedLabel`, for the `<time>` element */
  receivedAt: string;
  read: boolean;
  /** Badge text on an unread row */
  unreadLabel: string;
  onClick?: () => void;
};

/**
 * One submission in the list: unread marker, form, value preview, received.
 *
 * A button rather than a link — the detail opens in a sheet, so there is no
 * navigation to hand to the browser.
 */
export function SubmissionRow({
  formTitle,
  preview,
  receivedLabel,
  receivedAt,
  read,
  unreadLabel,
  onClick
}: SubmissionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hover:bg-muted/50 focus-visible:ring-ring relative flex w-full items-center gap-3 py-3 pr-4 pl-5 text-left focus-visible:ring-2 focus-visible:outline-none"
    >
      {/* Sits in the row's left padding rather than a column of its own: an
          in-flow marker would have to stay (invisible) on read rows to keep
          both kinds aligned, indenting every row for the sake of some */}
      {!read && (
        <span
          className="absolute top-1/2 left-1.5 size-2 -translate-y-1/2 rounded-full bg-(--link)"
          aria-hidden="true"
        />
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={
            read ? 'truncate text-sm' : 'truncate text-sm font-semibold'
          }
        >
          {formTitle}
        </span>
        <span className="text-muted-foreground truncate text-sm">
          {preview}
        </span>
      </span>
      {!read && <Badge variant="secondary">{unreadLabel}</Badge>}
      <time
        dateTime={receivedAt}
        className="text-muted-foreground shrink-0 text-sm"
      >
        {receivedLabel}
      </time>
    </button>
  );
}
