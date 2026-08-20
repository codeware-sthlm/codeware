import type { LinkComponent } from './types';

export type MailFailureRowProps = {
  /** Parent form title, or a fallback when the form is gone */
  formTitle: string;
  /** Which workspace the submission belongs to */
  owner: string;
  /** Pre-formatted relative time, e.g. `2 hours ago` */
  receivedLabel: string;
  /** ISO timestamp behind `receivedLabel`, for the `<time>` element */
  receivedAt: string;
  /** Admin url of the submission */
  href: string;
  linkComponent?: LinkComponent;
};

/**
 * One undelivered form submission, linking straight to it.
 *
 * Mirrors `DomainStatusRow`'s layout — a title and a muted subline on the
 * left, a fact on the right — so the two sheets this dashboard opens read as
 * one family rather than two different tables.
 */
export function MailFailureRow({
  formTitle,
  owner,
  receivedLabel,
  receivedAt,
  href,
  linkComponent: LinkComp = 'a'
}: MailFailureRowProps) {
  return (
    <LinkComp
      href={href}
      className="hover:bg-muted/60 focus-visible:ring-ring flex items-center gap-3 rounded-md px-2 py-2 focus-visible:ring-2 focus-visible:outline-none"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{formTitle}</p>
        <p className="text-muted-foreground truncate text-xs">{owner}</p>
      </div>
      <time
        dateTime={receivedAt}
        className="text-muted-foreground shrink-0 text-xs"
      >
        {receivedLabel}
      </time>
    </LinkComp>
  );
}
