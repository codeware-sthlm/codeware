import { describe, expect, it } from 'vitest';

import { DEFAULT_RECIPE, buildThemeTokens } from './build-theme-tokens';
import { paletteColor } from './palette';
import { shadcnNeutrals } from './shadcn-neutrals';
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

/**
 * Tailwind declares `--color-*` for its own families only, so an alias to one
 * of shadcn's neutrals resolves to nothing and the token renders empty. The
 * file still compiles, which is what makes this worth pinning from both sides:
 * an alias where a literal belongs paints nothing, and a literal where an alias
 * belongs merely loses which step was chosen.
 */
describe('a family Tailwind does not ship', () => {
  const files = themeFiles('heather', {
    ...DEFAULT_RECIPE,
    baseFamily: 'mauve',
    brandFamily: 'mauve'
  });

  it('is exported as a literal, not a dangling alias', () => {
    expect(files['tokens-light.css']).toContain(
      `--brand-600: ${shadcnNeutrals.mauve['600']};`
    );
    expect(files['tokens-light.css']).not.toContain('--color-mauve');
  });

  it('leaves no reference a compiled theme cannot resolve', () => {
    const referenced = [
      ...[files['tokens-light.css'], files['tokens-dark.css']]
        .join('\n')
        .matchAll(/var\(--color-([a-z]+)-/g)
    ].map(([, family]) => family);

    expect(referenced.filter((family) => family in shadcnNeutrals)).toEqual([]);
  });

  it('still aliases the Tailwind colours in the same file', () => {
    // `--destructive` is a fixed palette entry, so it stays readable even when
    // the recipe's own families cannot
    expect(files['tokens-light.css']).toContain(
      '--destructive: var(--color-red-600);'
    );
  });
});

describe('overrides in a committed file', () => {
  // `parseTheme` literalises palette aliases so a runtime theme does not
  // reference `--color-*`. A committed file is compiled, where the alias is the
  // readable half — without this, writing a theme back turns every aliased
  // override into an oklch triple nobody can review
  it('writes a palette literal back as its alias', () => {
    const files = themeFiles('probe', DEFAULT_RECIPE, {
      light: { '--card': paletteColor('teal-600') }
    });

    expect(files['tokens-light.css']).toContain(
      '--card: var(--color-teal-600);'
    );
  });

  // `oklch(0.985 0 0)` is zinc-50, neutral-50 and mauve-50 at once — the only
  // colour in the palette with more than one name
  it('names an ambiguous colour after the theme own family', () => {
    const grey = paletteColor('zinc-50');
    const zinc = themeFiles(
      'probe',
      { ...DEFAULT_RECIPE, baseFamily: 'zinc' },
      { light: { '--card': grey } }
    );
    const mauve = themeFiles(
      'probe',
      { ...DEFAULT_RECIPE, baseFamily: 'mauve' },
      { light: { '--card': grey } }
    );

    expect(zinc['tokens-light.css']).toContain('--card: var(--color-zinc-50);');
    expect(mauve['tokens-light.css']).toContain('--card: oklch(0.985 0 0);');
  });

  // zinc-900 at five per cent is not zinc-900
  it('leaves a colour carrying alpha alone', () => {
    const translucent = 'oklch(0.21 0.006 285.885 / 5%)';
    const files = themeFiles('probe', DEFAULT_RECIPE, {
      light: { '--core-navbar': translucent }
    });

    expect(files['tokens-light.css']).toContain(
      `--core-navbar: ${translucent};`
    );
  });

  it('leaves a value that is not a colour alone', () => {
    const files = themeFiles('probe', DEFAULT_RECIPE, {
      light: { '--core-navbar-shadow': 'var(--eerie-black)' }
    });

    expect(files['tokens-light.css']).toContain(
      '--core-navbar-shadow: var(--eerie-black);'
    );
  });
});
