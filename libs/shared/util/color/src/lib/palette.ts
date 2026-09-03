import { type TailwindColor, tailwind } from '@codeware/shared/util/tailwind';

import { type ShadcnNeutralFamily, shadcnNeutrals } from './shadcn-neutrals';

type FamilyOf<T> = T extends `${infer Family}-${string}` ? Family : never;

/**
 * A family Tailwind itself ships.
 *
 * Derived from the palette rather than listed, so a family added upstream
 * becomes available here without an edit — and one removed stops compiling.
 * `white` and `black` have no ramp and are excluded by construction.
 *
 * Kept apart from {@link ColorFamily} because anything filtering
 * `tailwind.names` can only ever narrow to this half.
 */
export type TailwindFamily = FamilyOf<TailwindColor>;

/** A colour family carrying a 50–950 ramp, from either source. */
export type ColorFamily = TailwindFamily | ShadcnNeutralFamily;

/** The steps every family defines. */
export const COLOR_SHADES = [
  '50',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
  '950'
] as const;

export type ColorShade = (typeof COLOR_SHADES)[number];

/**
 * The families that work as a theme's base.
 *
 * Any family is accepted — the type is open — but a chromatic one tints every
 * surface and border, and several of the contrast pairs stop passing. These are
 * the five shadcn offers, and the ones a studio should put first.
 */
export const NEUTRAL_FAMILIES = [
  'neutral',
  'zinc',
  'slate',
  'gray',
  'stone'
] as const satisfies ReadonlyArray<ColorFamily>;

/** Any colour either source can name, `white` and `black` included. */
export type PaletteColor =
  | TailwindColor
  | `${ShadcnNeutralFamily}-${ColorShade}`;

const shadcnNeutralColors: Record<string, string> = Object.fromEntries(
  Object.entries(shadcnNeutrals).flatMap(([family, ramp]) =>
    Object.entries(ramp).map(([step, value]) => [`${family}-${step}`, value])
  )
);

/**
 * Resolve a palette entry from whichever source owns its family.
 *
 * The one place that knows there are two, so nothing downstream has to ask.
 */
export const paletteColor = (name: PaletteColor): string =>
  shadcnNeutralColors[name] ?? tailwind.color(name as TailwindColor);

/**
 * Resolve one palette step to its literal value.
 *
 * Always a literal, never `var(--color-…)`: Tailwind emits only the shades
 * referenced at build time, so an injected theme aliasing a shade nothing else
 * uses would resolve to nothing at all.
 */
export const shade = (family: ColorFamily, step: ColorShade): string =>
  paletteColor(`${family}-${step}` as PaletteColor);

/**
 * The `--brand-50` … `--brand-950` ramp for a family.
 *
 * The rest of the theme reaches the brand through these rather than the palette
 * directly, so a single recipe change re-colours every reference.
 */
export const brandRamp = (
  family: ColorFamily,
  format: 'literal' | 'alias' = 'literal'
): Record<string, string> =>
  Object.fromEntries(
    COLOR_SHADES.map((step) => [
      `--brand-${step}`,
      format === 'alias'
        ? `var(--color-${family}-${step})`
        : shade(family, step)
    ])
  );
