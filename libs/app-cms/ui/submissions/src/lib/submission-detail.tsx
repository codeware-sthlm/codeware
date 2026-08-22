import {
  Alert,
  AlertDescription
} from '@codeware/shared/ui/shadcn/components/alert';
import type { ResolvedSubmissionField } from '@codeware/shared/util/payload-utils';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export type SubmissionDetailProps = {
  fields: Array<ResolvedSubmissionField>;
  /** Shown when the submission carries no values at all */
  emptyLabel: string;
  /** Tooltip explaining a value whose form field no longer exists */
  orphanedLabel: string;
  /**
   * The submission's notification email did not go as expected — undelivered
   * by the transport, or misconfigured with nowhere to go. Undefined when
   * nothing was expected or it went fine.
   */
  notificationIssue?: 'failed' | 'no-recipient';
  /** Shown in the alert when `notificationIssue` is set */
  notificationIssueMessage?: string;
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
  orphanedLabel,
  notificationIssue,
  notificationIssueMessage
}: SubmissionDetailProps) {
  const notice = notificationIssue && (
    <Alert variant="destructive">
      <ExclamationTriangleIcon />
      <AlertDescription>{notificationIssueMessage}</AlertDescription>
    </Alert>
  );

  if (!fields.length) {
    return (
      <div className="flex flex-col gap-3">
        {notice}
        <p className="text-muted-foreground text-sm">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {notice}
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
              {field.orphaned && (
                <>
                  {/* `title` is not reliably announced, so the meaning needs a
                    text node of its own for anyone not hovering a pointer */}
                  <span aria-hidden="true"> *</span>
                  <span className="sr-only"> ({orphanedLabel})</span>
                </>
              )}
            </dt>
            {/* Textarea values keep their line breaks; long words must wrap
              rather than widen the sheet */}
            <dd className="text-foreground text-sm break-words whitespace-pre-wrap">
              {field.value || '—'}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
