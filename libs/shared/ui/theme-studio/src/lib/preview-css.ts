import { themeDeclarations } from '@codeware/shared/theme';
import type { ThemeTokens } from '@codeware/shared/util/color';

/** The ids the preview panes carry; the stylesheet is written against them. */
export const previewScope = (scope: string) => ({
  light: `${scope}-light`,
  dark: `${scope}-dark`
});

/**
 * Scope draft tokens to the preview panes instead of the page.
 *
 * On a real site both blocks land on the same element — `[data-theme='x']` and
 * `[data-theme='x'].dark` — so the dark one only has to carry what changes and
 * the rest cascades. Two side-by-side panes have no such shared element, so the
 * dark pane is given the light map with the dark one merged over it. Emitting
 * the dark map alone would leave that pane with only the handful of tokens dark
 * overrides and nothing else.
 *
 * Values reach here from the recipe and from whatever the author typed into an
 * override, so they go through the same whitelist that guards the live site.
 *
 * @param scope - Unique id prefix for this studio instance
 * @param light - The complete light token map
 * @param dark - Only the tokens dark changes
 * @returns CSS text for a `<style>` element
 */
export function previewCss(
  scope: string,
  light: ThemeTokens,
  dark: ThemeTokens
): string {
  const ids = previewScope(scope);

  return [
    `#${ids.light}{${themeDeclarations(light)}}`,
    `#${ids.dark}{${themeDeclarations({ ...light, ...dark })}}`
  ].join('\n');
}
