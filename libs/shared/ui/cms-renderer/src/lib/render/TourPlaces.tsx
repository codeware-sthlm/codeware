'use client';

import { HeroIcon, type HeroIconName } from '@codeware/shared/ui/primitives';
import type { Place } from '@codeware/shared/util/payload-types';

type Props = {
  /** Places for one itinerary day, already resolved by Payload `depth` */
  places: Array<number | Place> | null | undefined;
};

/**
 * The wineries, hotels and stops of a single itinerary day, as chips.
 *
 * Places carrying a url become links; the rest render as plain chips so an
 * editor can list a stop before its web site is known.
 */
export function TourPlaces({ places }: Props) {
  const resolved = (places ?? []).filter(
    (place): place is Place => typeof place === 'object'
  );

  if (!resolved.length) {
    return null;
  }

  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {resolved.map((place) => {
        // The icon travels with the kind, so a new kind needs no code change
        const icon =
          typeof place.kind === 'object' ? place.kind?.icon : undefined;
        const content = (
          <>
            {icon && (
              <HeroIcon
                icon={icon as HeroIconName}
                className="size-3.5 shrink-0"
              />
            )}
            {place.name}
          </>
        );

        return (
          <li key={place.id}>
            {place.url ? (
              <a
                href={place.url}
                target="_blank"
                rel="noopener noreferrer"
                title={place.note ?? undefined}
                className="border-border/40 text-core-text hover:border-core-link hover:text-core-link inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors"
              >
                {content}
              </a>
            ) : (
              <span
                title={place.note ?? undefined}
                className="border-border/40 text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
              >
                {content}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
