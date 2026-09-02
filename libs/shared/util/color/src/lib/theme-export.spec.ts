import { describe, expect, it } from 'vitest';

import { DEFAULT_RECIPE, buildThemeTokens } from './build-theme-tokens';
import { themeFiles } from './theme-export';

const recipe = { ...DEFAULT_RECIPE, brandFamily: 'teal' as const };

describe('themeFiles', () => {
  const files = themeFiles('ocean', recipe);

  it('writes the three files a theme folder holds', () => {
    expect(Object.keys(files)).toEqual([
      'tokens-light.css',
      'tokens-dark.css',
      'tailwind-base.css'
    ]);
  });

  it('scopes light to :root and dark to .dark', () => {
    expect(files['tokens-light.css'].startsWith(':root {')).toBe(true);
    expect(files['tokens-dark.css'].startsWith('.dark {')).toBe(true);
  });

  // `[data-theme='x'][data-theme='dark']` can never match, and theme-sync
  // rejects a site theme written that way
  it('never uses the attribute strategy for dark', () => {
    expect(files['tokens-dark.css']).not.toContain('data-theme');
  });

  // These files are compiled, so the alias survives and says which step was
  // chosen — the opposite of the runtime rule
  it('writes palette colours as aliases, not literals', () => {
    expect(files['tokens-light.css']).toContain(
      '--brand-600: var(--color-teal-600);'
    );
    expect(files['tokens-light.css']).not.toMatch(/--brand-600: oklch/);
  });

  it('keeps the runtime form literal', () => {
    const runtime = buildThemeTokens(recipe);
    expect(runtime.light['--brand-600']).toMatch(/^oklch\(/);
    expect(runtime.light['--brand-600']).not.toContain('--color-');
  });

  it('carries every token into the file', () => {
    const { light } = buildThemeTokens(recipe, {}, 'alias');
    const declarations = files['tokens-light.css']
      .split('\n')
      .filter((line) => line.trim().startsWith('--'));

    expect(declarations).toHaveLength(Object.keys(light).length);
  });

  it('applies overrides', () => {
    const withOverride = themeFiles('ocean', recipe, {
      light: { '--core-link': 'oklch(0.5 0.2 20)' }
    });

    expect(withOverride['tokens-light.css']).toContain(
      '--core-link: oklch(0.5 0.2 20);'
    );
  });

  it('imports both token files from the base', () => {
    expect(files['tailwind-base.css']).toContain(
      "@import './tokens-light.css'"
    );
    expect(files['tailwind-base.css']).toContain("@import './tokens-dark.css'");
    expect(files['tailwind-base.css']).toContain(
      "@import '../_core/tailwind-setup.css'"
    );
  });
});
