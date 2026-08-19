import { Badge } from '@codeware/shared/ui/shadcn/components/badge';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

/** What a domain's certificate is doing, as the ui needs to tell it apart */
export type DomainCertificateStatus =
  | 'not-requested'
  | 'pending'
  | 'active'
  | 'paused';

export type DomainStatusBadgeProps = {
  status: DomainCertificateStatus;
  /**
   * Fly's own wording for a pending certificate, which names the step it is
   * waiting on better than the generic label
   */
  detail?: string | null;
  labels: {
    active: string;
    pending: string;
    notRequested: string;
    paused: string;
  };
};

/**
 * One domain's certificate state, as a pill.
 *
 * Tinted rather than one style for every value, unlike the dashboard's
 * `StatusBadge`: here the colour *is* the signal — the whole point of the
 * domains surfaces is spotting the one row that is not green.
 *
 * `destructive` comes from the shadcn variant; the success tint is applied as
 * classes over `outline`, following `status-badge.tsx`, so the shadcn lib keeps
 * no local patch to preserve across registry updates.
 */
export function DomainStatusBadge({
  status,
  detail,
  labels
}: DomainStatusBadgeProps) {
  if (status === 'active') {
    return (
      <Badge
        variant="outline"
        className="border-(--success-subtle)/30 bg-(--success-subtle)/10 text-(--success-subtle)"
      >
        <CheckCircleIcon />
        {labels.active}
      </Badge>
    );
  }

  if (status === 'paused') {
    return (
      <Badge variant="destructive">
        <ExclamationTriangleIcon />
        {labels.paused}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-muted-foreground">
      <ClockIcon />
      {status === 'pending' ? (detail ?? labels.pending) : labels.notRequested}
    </Badge>
  );
}
