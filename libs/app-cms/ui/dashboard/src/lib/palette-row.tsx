import { StatusBadge } from './status-badge';
import type { IconComponent } from './types';

export type PaletteRowProps = {
  title: string;
  /** Pre-composed meta line, e.g. `Pages · 12 min ago`. */
  meta?: string;
  icon: IconComponent;
  badgeLabel?: string;
};

/**
 * Compact document row for command palette results.
 *
 * Unlike `DocRow` it renders no link — the surrounding `CommandItem` owns
 * interaction and selection styling.
 */
export function PaletteRow({
  title,
  meta,
  icon: Icon,
  badgeLabel
}: PaletteRowProps) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div className="bg-accent flex size-8 shrink-0 items-center justify-center rounded-lg">
        <Icon className="size-4 text-(--link)" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-medium">{title}</p>
        {meta && (
          <p className="text-muted-foreground truncate text-xs">{meta}</p>
        )}
      </div>
      {badgeLabel && <StatusBadge label={badgeLabel} />}
    </div>
  );
}
