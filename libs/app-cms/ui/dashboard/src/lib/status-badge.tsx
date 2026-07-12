import { Badge } from '@codeware/shared/ui/shadcn/components/badge';
import { cn } from '@codeware/shared/util/ui';

export type StatusBadgeProps = {
  label: string;
  className?: string;
};

/**
 * Brand-tinted status pill (Published / Draft / New / …).
 * One style for all values — the label carries the meaning.
 */
export function StatusBadge({ label, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'border-brand-200 bg-brand-50 text-brand-700 shrink-0 font-medium',
        'dark:border-brand-800 dark:bg-brand-950 dark:text-brand-200',
        className
      )}
    >
      {label}
    </Badge>
  );
}
