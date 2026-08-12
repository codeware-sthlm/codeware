import { Badge } from '@codeware/shared/ui/shadcn/components/badge';
import { cn } from '@codeware/shared/util/ui';
import type { ReactNode } from 'react';

export type TourSignupStatus = 'booked' | 'waiting' | 'cancelled';

export type TourSignupRowProps = {
  name: string;
  email: string;
  phone?: string | null;
  /** People this signup is for */
  people: number;
  status: TourSignupStatus;
  /** Place in the waiting list, shown only while queued */
  queuePosition?: number | null;
  /** ISO timestamp the customer signed up */
  signedUpAt: string;
  /** Pre-formatted signup time, e.g. `3 Aug 14:02` */
  signedUpLabel: string;
  /** What the signup time means, shown on hover and to a screen reader */
  signedUpTitle?: string;
  /** Pre-formatted time the status last moved, when it has */
  statusChangedLabel?: string | null;
  /** What that second time means — the two are easily confused */
  statusChangedTitle?: string;
  /** Personal data cleared by retention */
  anonymized?: boolean;
  labels: {
    status: Record<TourSignupStatus, string>;
    /** Party size, e.g. `4 people` */
    people: (count: number) => string;
    /** Prefix for the signup time, e.g. `signed up` */
    signedUp: string;
    anonymized: string;
  };
  /** Buttons the panel supplies — promote, cancel, open */
  actions?: ReactNode;
  /** Drag handle for a queued row */
  dragHandle?: ReactNode;
  onClick?: () => void;
};

const statusTone: Record<TourSignupStatus, 'default' | 'secondary' | 'ghost'> =
  {
    booked: 'default',
    waiting: 'secondary',
    cancelled: 'ghost'
  };

/**
 * One signup: who, how many, where they stand, and when they arrived.
 *
 * Both times are on the row on purpose. The queue is the guide's to reorder,
 * so position alone would quietly imply arrival order — showing when someone
 * signed up next to when their status last moved makes a promoted or reordered
 * row legible rather than mysterious.
 *
 * Presentational: the panel owns the actions and the drag behaviour, and hands
 * them in as slots.
 */
export function TourSignupRow({
  name,
  email,
  phone,
  people,
  status,
  queuePosition,
  signedUpAt,
  signedUpLabel,
  signedUpTitle,
  statusChangedLabel,
  statusChangedTitle,
  anonymized = false,
  labels,
  actions,
  dragHandle,
  onClick
}: TourSignupRowProps) {
  const contact = [email, phone].filter(Boolean).join(' · ');

  return (
    <div
      className={cn(
        'hover:bg-muted/50 flex items-center gap-3 px-4 py-3',
        status === 'cancelled' && 'opacity-60'
      )}
    >
      {dragHandle}
      {typeof queuePosition === 'number' && status === 'waiting' && (
        <span className="text-muted-foreground w-6 shrink-0 text-sm tabular-nums">
          #{queuePosition}
        </span>
      )}
      <button
        type="button"
        onClick={onClick}
        className="focus-visible:ring-ring flex min-w-0 flex-1 flex-col gap-0.5 text-left focus-visible:ring-2 focus-visible:outline-none"
      >
        <span className="flex items-center gap-2">
          <span
            className={cn(
              'truncate text-sm font-medium',
              status === 'cancelled' && 'line-through'
            )}
          >
            {name}
          </span>
          <span className="text-muted-foreground shrink-0 text-sm">
            {labels.people(people)}
          </span>
        </span>
        <span className="text-muted-foreground truncate text-sm">
          {anonymized ? labels.anonymized : contact}
        </span>
      </button>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <Badge variant={statusTone[status]}>{labels.status[status]}</Badge>
        {/* Two timestamps that look alike and mean different things, so each
            says which it is on hover and to a screen reader */}
        <span className="text-muted-foreground text-xs whitespace-nowrap">
          <time dateTime={signedUpAt} title={signedUpTitle}>
            {signedUpTitle && (
              <span className="sr-only">{signedUpTitle}: </span>
            )}
            {signedUpLabel}
          </time>
          {statusChangedLabel && (
            <>
              {' · '}
              <span title={statusChangedTitle}>
                {statusChangedTitle && (
                  <span className="sr-only">{statusChangedTitle}: </span>
                )}
                {statusChangedLabel}
              </span>
            </>
          )}
        </span>
      </div>
      {actions}
    </div>
  );
}
