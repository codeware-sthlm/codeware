import { tailwind } from '@codeware/shared/util/tailwind';

import { parseColor } from './oklch';
import { type ColorFamily, NEUTRAL_FAMILIES, shade } from './palette';

/** Five points around the wheel, the brand first. */
const HUE_OFFSETS = [0, 72, 144, 216, 288];

/** Charts want colours that separate, which the neutrals cannot do. */
const CHROMATIC_FAMILIES = tailwind.names.filter(
  (name): name is ColorFamily =>
    name !== 'white' &&
    name !== 'black' &&
    !(NEUTRAL_FAMILIES as ReadonlyArray<string>).includes(name)
);

/** What a neutral brand falls back to — shadcn's own series. */
const DEFAULT_CHART_FAMILIES: Array<ColorFamily> = [
  'orange',
  'teal',
  'cyan',
  'amber',
  'blue'
];

const hueOf = (family: ColorFamily): number =>
  parseColor(shade(family, '600'))?.h ?? 0;

const hueDistance = (a: number, b: number): number => {
  const delta = Math.abs(a - b) % 360;
  return delta > 180 ? 360 - delta : delta;
};

/**
 * Pick the five families a theme's charts use, anchored on its brand.
 *
 * Real palette families rather than colours computed by rotating the brand's
 * hue: a rotated hue at the brand's chroma can land outside sRGB, where it
 * would be silently clipped to something other than what the maths said.
 * Every family here is a value the palette already ships.
 *
 * Chart one is the brand itself, and the rest are spaced around the wheel so a
 * series stays distinguishable. A neutral brand keeps the default series
 * instead of five greys — tested against the neutral list rather than a chroma
 * threshold, since `slate` and `gray` carry enough of a tint to pass one.
 *
 * @param brandFamily - The theme's brand family
 * @returns Five distinct families, chart 1 through 5
 */
export function chartFamilies(brandFamily: ColorFamily): Array<ColorFamily> {
  const isNeutral = (NEUTRAL_FAMILIES as ReadonlyArray<string>).includes(
    brandFamily
  );
  const anchor = parseColor(shade(brandFamily, '600'));

  if (isNeutral || !anchor) {
    return DEFAULT_CHART_FAMILIES;
  }

  const taken = new Set<ColorFamily>();

  return HUE_OFFSETS.map((offset) => {
    const target = (anchor.h + offset) % 360;
    const nearest = CHROMATIC_FAMILIES.filter(
      (family) => !taken.has(family)
    ).reduce((best, family) =>
      hueDistance(hueOf(family), target) < hueDistance(hueOf(best), target)
        ? family
        : best
    );

    taken.add(nearest);
    return nearest;
  });
}
