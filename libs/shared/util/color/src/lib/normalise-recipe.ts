import { DEFAULT_RECIPE, type ThemeRecipe } from './build-theme-tokens';
import { type FontSlot, fontById } from './fonts';
import { COLOR_SHADES, type ColorShade, isColorFamily } from './palette';

const isShade = (value: unknown): value is ColorShade =>
  typeof value === 'string' &&
  (COLOR_SHADES as ReadonlyArray<string>).includes(value);

const isSurface = (value: unknown): value is ThemeRecipe['surface'] =>
  value === 'flat' || value === 'layered';

/** One of a fixed set of choices, checked against the set itself. */
const isOneOf =
  <T extends string>(...allowed: ReadonlyArray<T>) =>
  (value: unknown): value is T =>
    typeof value === 'string' &&
    (allowed as ReadonlyArray<string>).includes(value);

const isPrimarySource = isOneOf('brand', 'base');
const isChartSource = isOneOf('brand', 'shadcn', 'base');
const isLinkSource = isOneOf('brand', 'primary');

/** A family the registry still carries, and still offers for that slot. */
const isFont = (slot: FontSlot, value: unknown): value is string =>
  typeof value === 'string' && (fontById(value)?.slots.includes(slot) ?? false);

/**
 * Make a whole recipe out of whatever was stored.
 *
 * A recipe is typed where it is authored but arrives as a JSON column, so the
 * type is a claim about the past rather than a guarantee about the value. A
 * theme saved before a field existed simply does not carry it, and reading it
 * back as `undefined` used to take the studio down on open — one field short is
 * the normal state of stored data, not a corruption.
 *
 * Each field falls back on its own, so an unrecognised brand does not also cost
 * the radius.
 *
 * @param value - Anything, typically a `recipe` JSON column
 * @returns A recipe every field of which is usable
 */
export function normaliseRecipe(value: unknown): ThemeRecipe {
  const stored = (
    value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  ) as Partial<ThemeRecipe>;

  const linkShade =
    stored.linkShade && typeof stored.linkShade === 'object'
      ? stored.linkShade
      : DEFAULT_RECIPE.linkShade;

  return {
    baseFamily: isColorFamily(stored.baseFamily)
      ? stored.baseFamily
      : DEFAULT_RECIPE.baseFamily,
    brandFamily: isColorFamily(stored.brandFamily)
      ? stored.brandFamily
      : DEFAULT_RECIPE.brandFamily,
    surface: isSurface(stored.surface)
      ? stored.surface
      : DEFAULT_RECIPE.surface,
    radius:
      typeof stored.radius === 'string' && stored.radius.length > 0
        ? stored.radius
        : DEFAULT_RECIPE.radius,
    fontBody: isFont('body', stored.fontBody)
      ? stored.fontBody
      : DEFAULT_RECIPE.fontBody,
    fontHeading: isFont('heading', stored.fontHeading)
      ? stored.fontHeading
      : DEFAULT_RECIPE.fontHeading,
    // Every theme stored before these existed predates the choice, so it falls
    // to the default — which is what it was already being built with
    primarySource: isPrimarySource(stored.primarySource)
      ? stored.primarySource
      : DEFAULT_RECIPE.primarySource,
    chartSource: isChartSource(stored.chartSource)
      ? stored.chartSource
      : DEFAULT_RECIPE.chartSource,
    linkSource: isLinkSource(stored.linkSource)
      ? stored.linkSource
      : DEFAULT_RECIPE.linkSource,
    linkShade: {
      light: isShade(linkShade.light)
        ? linkShade.light
        : DEFAULT_RECIPE.linkShade.light,
      dark: isShade(linkShade.dark)
        ? linkShade.dark
        : DEFAULT_RECIPE.linkShade.dark
    }
  };
}
