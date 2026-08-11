import { Badge } from '@codeware/shared/ui/shadcn/components/badge';
import { cn } from '@codeware/shared/util/ui';

export type TourFillBarProps = {
  /** People holding a seat */
  booked: number;
  /** Seats the tour has, or `null` when it takes anyone */
  maxCustomers?: number | null;
  /** People on the waiting list, shown as a badge when there are any */
  waiting?: number;
  /** Localized labels; the component formats no copy of its own */
  labels: {
    full: string;
    overbooked: string;
    /** Takes the waiting count, e.g. `+3 waiting` */
    waiting: (count: number) => string;
    /** Screen reader summary, e.g. `12 of 20 places taken` */
    summary: string;
  };
  /** Compact enough for a list cell; the default suits a page */
  size?: 'sm' | 'md';
};

/**
 * How full a tour is: a bar, the numbers beside it, and the awkward states.
 *
 * A bar rather than a pie because this has to survive a list cell — at that
 * size an angle is unreadable, while a bar keeps its meaning at 60 pixels
 * wide. It also has to be honest about the two states a naive fraction hides:
 * a tour can be **overbooked** past its maximum (the guide's call when
 * promoting), and it can be full while people wait behind it.
 *
 * With no maximum set there is nothing to be a fraction of, so it shows the
 * headcount alone rather than implying a limit that does not exist.
 */
export function TourFillBar({
  booked,
  maxCustomers,
  waiting = 0,
  labels,
  size = 'md'
}: TourFillBarProps) {
  const hasLimit = typeof maxCustomers === 'number' && maxCustomers > 0;
  const ratio = hasLimit ? booked / maxCustomers : 0;
  const overbooked = hasLimit && booked > maxCustomers;
  const full = hasLimit && booked >= maxCustomers;

  const tone = overbooked
    ? 'bg-destructive'
    : full
      ? 'bg-primary'
      : 'bg-(--link)';

  return (
    <div className="flex items-center gap-2">
      {hasLimit && (
        <div
          className={cn(
            'bg-muted relative overflow-hidden rounded-full',
            size === 'sm' ? 'h-1.5 w-16' : 'h-2 w-40'
          )}
          role="img"
          aria-label={labels.summary}
        >
          <div
            className={cn('h-full rounded-full transition-[width]', tone)}
            // Clamped so an overbooked tour fills the bar rather than
            // overflowing it — the count and the badge carry the excess
            style={{ width: `${Math.min(ratio, 1) * 100}%` }}
          />
        </div>
      )}
      <span
        className={cn(
          'shrink-0 tabular-nums',
          size === 'sm' ? 'text-xs' : 'text-sm',
          overbooked ? 'font-medium text-(--destructive-subtle)' : undefined
        )}
      >
        {hasLimit ? `${booked} / ${maxCustomers}` : booked}
      </span>
      {overbooked && <Badge variant="destructive">{labels.overbooked}</Badge>}
      {full && !overbooked && <Badge variant="secondary">{labels.full}</Badge>}
      {waiting > 0 && (
        <span className="text-muted-foreground shrink-0 text-xs">
          {labels.waiting(waiting)}
        </span>
      )}
    </div>
  );
}
