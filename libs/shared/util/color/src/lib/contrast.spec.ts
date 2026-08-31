import { describe, expect, it } from 'vitest';

import { DEFAULT_RECIPE, buildThemeTokens } from './build-theme-tokens';
import {
  THEME_CONTRAST_PAIRS,
  WCAG_AA_NORMAL,
  checkContrast,
  contrastFailures
} from './contrast';

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
