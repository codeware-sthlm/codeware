import { describe, expect, it } from 'vitest';

import { DEFAULT_RECIPE, buildThemeTokens } from './build-theme-tokens';
import {
  THEME_CONTRAST_PAIRS,
  WCAG_AA_NORMAL,
  checkContrast,
  contrastFailures
} from './contrast';
import { COLOR_FAMILIES, NEUTRAL_FAMILIES } from './palette';

/**
 * Every family a theme can be branded with.
 *
 * The studio offers the neutrals as brands too, so a hand-kept list here would
 * quietly stop covering what the studio can actually produce.
 */
const BRAND_FAMILIES = COLOR_FAMILIES;

/** Dark holds only what changes, so it is checked as the browser cascades it. */
const schemes = (recipe = DEFAULT_RECIPE) => {
  const { light, dark } = buildThemeTokens(recipe);
  return { light, dark: { ...light, ...dark } };
};

describe('checkContrast', () => {
  it('resolves aliases before comparing', () => {
    // `--core-link` and `--core-background-content` are both aliases; a checker
    // that compared the literal `var(…)` strings would report nothing at all
    const results = checkContrast(schemes().light);
    const link = results.find(({ usage }) => usage === 'Links in body copy');

    expect(link).toBeDefined();
    expect(link?.ratio).toBeGreaterThan(1);
  });

  it('leaves out a pair whose colour cannot be read', () => {
    const results = checkContrast({ '--foreground': 'oklch(0 0 0)' });

    // Only tokens present and parseable are reported — never as passes
    expect(results).toEqual([]);
  });

  it('drops a pair rather than looping on a circular alias', () => {
    const results = checkContrast({
      '--foreground': 'var(--background)',
      '--background': 'var(--foreground)'
    });

    expect(results).toEqual([]);
  });

  it('reports every pair it can read', () => {
    const results = checkContrast(schemes().light);
    expect(results.length).toBe(THEME_CONTRAST_PAIRS.length);
  });

  it('flags a pair that fails its minimum', () => {
    const barely = {
      ...schemes().light,
      '--foreground': 'oklch(0.95 0 0)'
    };
    const failures = contrastFailures(barely);

    expect(failures.map(({ usage }) => usage)).toContain('Body text');
    expect(failures[0].minimum).toBe(WCAG_AA_NORMAL);
  });
});

describe('the default recipe', () => {
  it.each(['light', 'dark'] as const)('passes WCAG AA in %s', (scheme) => {
    const failures = contrastFailures(schemes()[scheme]);

    expect(failures.map((f) => `${f.usage}: ${f.ratio.toFixed(2)}`)).toEqual(
      []
    );
  });
});

// The brand now drives buttons, rings and links, so a family that cannot carry
// them would ship an unreadable theme by default rather than on an odd choice
describe('every brand family', () => {
  it.each(BRAND_FAMILIES)('passes WCAG AA with %s', (brandFamily) => {
    const built = schemes({ ...DEFAULT_RECIPE, brandFamily });
    const failures = [
      ...contrastFailures(built.light).map((f) => `light ${f.usage}`),
      ...contrastFailures(built.dark).map((f) => `dark ${f.usage}`)
    ];

    expect(failures).toEqual([]);
  });
});

// A tinted neutral moves every surface, border and secondary text at once, so
// a base that cannot carry them is as unshippable as a brand that cannot
describe('every base family', () => {
  it.each(NEUTRAL_FAMILIES)('passes WCAG AA with %s', (baseFamily) => {
    const built = schemes({ ...DEFAULT_RECIPE, baseFamily });
    const failures = [
      ...contrastFailures(built.light).map((f) => `light ${f.usage}`),
      ...contrastFailures(built.dark).map((f) => `dark ${f.usage}`)
    ];

    expect(failures).toEqual([]);
  });
});
