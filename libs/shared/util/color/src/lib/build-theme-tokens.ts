import { type TailwindColor, tailwind } from '@codeware/shared/util/tailwind';

import { chartFamilies } from './chart-ramp';
import { normaliseRecipe } from './normalise-recipe';
import { type ColorFamily, type ColorShade, brandRamp, shade } from './palette';
import {
  ALIAS_LIGHT,
  BASE_DARK,
  BASE_LIGHT,
  SUBTLE_DARK,
  SUBTLE_LIGHT,
  SURFACE_DARK,
  SURFACE_LIGHT,
  type TokenSource
} from './theme-template';

/** A resolved token map, ready to be written into a theme block. */
export type ThemeTokens = Record<string, string>;

/**
 * What a whole theme is decided by.
 *
 * Four choices, because the 38-token core and prose layer is fixed and the
 * shadcn layer is a set of steps off one family. Anything the recipe cannot
 * express is a per-token override on top, not another field here.
 */
export type ThemeRecipe = {
  /** Drives every neutral: surfaces, text, borders, rings */
  baseFamily: ColorFamily;
  /**
   * Drives the `--brand-*` ramp and everything that reads as the brand:
   * primary buttons, focus rings, links, active navigation.
   */
  brandFamily: ColorFamily;
  /**
   * Whether the content column sits on its own surface (`layered`) or shares
   * one with the page shell and footer (`flat`).
   */
  surface: 'flat' | 'layered';
  /** The `--radius` root value, e.g. `0.625rem` */
  radius: string;
  /** Which brand step links take, per scheme — dark needs a lighter one to read */
  linkShade: { light: ColorShade; dark: ColorShade };
};

/**
 * A neutral starting point, close to the built-in `shadcn` theme.
 *
 * `light: '700'` because that is the only brand step whose link clears 4.5:1 on
 * white for every family — 600 fails on nine of them.
 */
export const DEFAULT_RECIPE: ThemeRecipe = {
  baseFamily: 'neutral',
  brandFamily: 'neutral',
  surface: 'layered',
  radius: '0.625rem',
  linkShade: { light: '700', dark: '400' }
};

const resolve = (
  source: TokenSource,
  { baseFamily, brandFamily }: ThemeRecipe
): string => {
  if ('base' in source) {
    return shade(baseFamily, source.base);
  }
  if ('brand' in source) {
    return shade(brandFamily, source.brand);
  }
  if ('palette' in source) {
    return tailwind.color(source.palette as TailwindColor);
  }
  return source.value;
};

const resolveAll = (
  sources: Record<string, TokenSource>,
  recipe: ThemeRecipe
): ThemeTokens =>
  Object.fromEntries(
    Object.entries(sources).map(([name, source]) => [
      name,
      resolve(source, recipe)
    ])
  );

/**
 * Build a complete theme from a recipe.
 *
 * Complete, not a diff: every theme block is scoped to its own `[data-theme]`
 * and nothing sits at bare `:root`, so a partial token map leaves the page
 * with no base to inherit from.
 *
 * The light map carries everything; the dark map carries only what changes,
 * which the `.dark` block layers on top. That mirrors how the committed themes
 * are written, and how the generator's contract is defined.
 *
 * @param recipe - The four decisions
 * @param overrides - Per-token values applied last, for what a recipe cannot say
 * @returns Token maps for both schemes
 */
export function buildThemeTokens(
  storedRecipe: ThemeRecipe,
  overrides: { light?: ThemeTokens; dark?: ThemeTokens } = {}
): { light: ThemeTokens; dark: ThemeTokens } {
  // The type is a claim about where a recipe was authored, not about a value
  // read back from a JSON column — one saved before a field existed is short
  // of it, and every lookup below would then miss
  const recipe = normaliseRecipe(storedRecipe);
  const { baseFamily, brandFamily, radius, linkShade } = recipe;

  // Charts follow the brand rather than a fixed series, so a themed site does
  // not draw its data in someone else's colours
  const charts = chartFamilies(brandFamily);
  const chartTokens = (step: ColorShade): ThemeTokens =>
    Object.fromEntries(
      charts.map((family, index) => [
        `--chart-${index + 1}`,
        shade(family, step)
      ])
    );

  const light: ThemeTokens = {
    ...brandRamp(brandFamily),
    '--radius': radius,
    '--radius-md': 'calc(var(--radius) - 0.125rem)',
    ...resolveAll(BASE_LIGHT, recipe),
    ...chartTokens('600'),
    ...resolveAll(SUBTLE_LIGHT, recipe),
    ...resolveAll(ALIAS_LIGHT, recipe),
    ...resolveAll(SURFACE_LIGHT[recipe.surface], recipe),
    // Through the ramp rather than the palette, so re-branding is one change
    '--core-link': `var(--brand-${linkShade.light})`,
    '--core-surface-invert': shade(baseFamily, '900'),
    ...overrides.light
  };

  const dark: ThemeTokens = {
    ...resolveAll(BASE_DARK, recipe),
    // Lighter, so a series reads against a dark surface
    ...chartTokens('400'),
    ...resolveAll(SUBTLE_DARK, recipe),
    ...resolveAll(SURFACE_DARK[recipe.surface], recipe),
    '--core-link': `var(--brand-${linkShade.dark})`,
    // The inverted surface is the raised one once the page is already dark
    '--core-surface-invert': 'var(--card)',
    ...overrides.dark
  };

  return { light, dark };
}
