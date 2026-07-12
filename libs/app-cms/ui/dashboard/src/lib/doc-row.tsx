import { StatusBadge } from './status-badge';
import type { IconComponent, LinkComponent } from './types';

export type DocRowProps = {
  href: string;
  title: string;
  /** Pre-composed meta line, e.g. `Posts · 12 min ago`. */
  meta: string;
  icon: IconComponent;
  badgeLabel?: string;
  linkComponent?: LinkComponent;
};

/** Compact linked row for activity and draft lists. */
export function DocRow({
  href,
  title,
  meta,
  icon: Icon,
  badgeLabel,
  linkComponent: LinkComp = 'a'
}: DocRowProps) {
  return (
    <LinkComp
      href={href}
      className="hover:bg-accent focus-visible:bg-accent flex items-center gap-3 rounded-lg px-2 py-2 transition-colors duration-150 focus-visible:outline-none"
    >
      <div className="bg-accent flex size-8 shrink-0 items-center justify-center rounded-lg">
        <Icon className="size-4 text-(--link)" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-medium">{title}</p>
        <p className="text-muted-foreground truncate text-xs">{meta}</p>
      </div>
      {badgeLabel && <StatusBadge label={badgeLabel} />}
    </LinkComp>
  );
}
