import type { ResolvedSubmissionField } from '@codeware/shared/util/payload-utils';

export type SubmissionDetailProps = {
  fields: Array<ResolvedSubmissionField>;
  /** Shown when the submission carries no values at all */
  emptyLabel: string;
  /** Tooltip explaining a value whose form field no longer exists */
  orphanedLabel: string;
};

/**
 * A submission's values as read-only label/value pairs.
 *
 * Deliberately not form inputs: submissions are immutable, and Payload's
 * default array-of-inputs rendering invites edits that can never be saved.
 *
 * Hook-free so it renders in both the list view's sheet (client) and the
 * document view (server).
 */
export function SubmissionDetail({
  fields,
  emptyLabel,
  orphanedLabel
}: SubmissionDetailProps) {
  if (!fields.length) {
    return <p className="text-muted-foreground text-sm">{emptyLabel}</p>;
  }

  return (
    <dl className="divide-border divide-y">
      {fields.map((field) => (
        <div
          key={field.name}
          className="grid gap-1 py-3 sm:grid-cols-[minmax(0,12rem)_1fr] sm:gap-4"
        >
          <dt
            className="text-muted-foreground text-sm font-medium"
            title={field.orphaned ? orphanedLabel : undefined}
          >
            {field.label}
            {field.orphaned && <span aria-hidden="true"> *</span>}
          </dt>
          {/* Textarea values keep their line breaks; long words must wrap
              rather than widen the sheet */}
          <dd className="text-foreground text-sm break-words whitespace-pre-wrap">
            {field.value || '—'}
          </dd>
        </div>
      ))}
    </dl>
  );
}
