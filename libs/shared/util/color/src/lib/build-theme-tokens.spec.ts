import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_RECIPE,
  type ThemeRecipe,
  buildThemeTokens
} from './build-theme-tokens';
import { parseColor } from './oklch';

const coreFile = (name: string) =>
  readFileSync(
    new URL(`../../../../theme/src/lib/_core/${name}`, import.meta.url),
    'utf8'
  );

/**
 * The token contract, derived the way `theme-sync` derives it.
 *
 * Read from the contract files rather than restated, so a token added to
 * `@theme inline` or the prose plugin fails this suite instead of shipping a
 * theme that silently misses it.
 */
const contract = () => {
  const setupCss = coreFile('tailwind-setup.css');
  const proseJs = coreFile('typography-prose.js');

  const setup = new Set<string>();
  for (const block of setupCss.matchAll(/@theme\s+inline\s*\{([\s\S]*?)\}/g)) {
    for (const ref of block[1].matchAll(/var\(\s*(--[\w-]+)\s*\)/g)) {
      setup.add(ref[1]);
    }
  }
  const prose = new Set(
    [...proseJs.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)].map((m) => m[1])
  );

  return {
    light: new Set([...setup, ...prose]),
    // Brand, core and radius cascade from the light block
    dark: new Set(
      [...setup].filter(
        (token) =>
          !token.startsWith('--brand-') &&
          !token.startsWith('--core-') &&
          token !== '--radius'
      )
    )
  };
};

const recipe = (overrides: Partial<ThemeRecipe> = {}): ThemeRecipe => ({
  ...DEFAULT_RECIPE,
  ...overrides
});

describe('buildThemeTokens', () => {
  describe('satisfies the generator contract', () => {
    const { light, dark } = contract();
    const built = buildThemeTokens(recipe({ brandFamily: 'teal' }));

    it('defines every required light token', () => {
      const missing = [...light].filter((token) => !built.light[token]).sort();
      expect(missing).toEqual([]);
    });

    it('defines every required dark token', () => {
      const missing = [...dark].filter((token) => !built.dark[token]).sort();
      expect(missing).toEqual([]);
    });

    // Guards the test itself: a contract that parsed to nothing would pass the
    // two above without checking anything
    it('reads a contract of the expected size', () => {
      expect(light.size).toBe(84);
      expect(dark.size).toBe(32);
    });
  });

  describe('emits values a stylesheet can use', () => {
    const built = buildThemeTokens(recipe({ brandFamily: 'blue' }));

    // Tailwind emits only the palette shades referenced at build time, so an
    // injected theme aliasing one would resolve to nothing
    it('never references the Tailwind palette', () => {
      const values = [
        ...Object.values(built.light),
        ...Object.values(built.dark)
      ];
      expect(values.filter((value) => value.includes('--color-'))).toEqual([]);
    });

    it('resolves the brand ramp to literals', () => {
      expect(parseColor(built.light['--brand-600'])).not.toBeNull();
      expect(built.light['--brand-600']).toBe(
        built.light['--brand-600'].trim()
      );
    });

    it('keeps the core and prose layers as aliases', () => {
      expect(built.light['--core-text']).toBe('var(--foreground)');
      expect(built.light['--body']).toBe('var(--foreground)');
    });
  });

  describe('the recipe', () => {
    it('drives every neutral from the base family', () => {
      const zinc = buildThemeTokens(recipe({ baseFamily: 'zinc' }));
      const stone = buildThemeTokens(recipe({ baseFamily: 'stone' }));

      expect(zinc.light['--foreground']).not.toBe(stone.light['--foreground']);
      expect(zinc.light['--muted']).not.toBe(stone.light['--muted']);
      expect(zinc.dark['--background']).not.toBe(stone.dark['--background']);
    });

    it('drives the brand ramp from the brand family', () => {
      const teal = buildThemeTokens(recipe({ brandFamily: 'teal' }));
      const rose = buildThemeTokens(recipe({ brandFamily: 'rose' }));

      expect(teal.light['--brand-500']).not.toBe(rose.light['--brand-500']);
      // The neutral layer is untouched by the brand choice
      expect(teal.light['--foreground']).toBe(rose.light['--foreground']);
    });

    it('points links at the chosen brand step, per scheme', () => {
      const built = buildThemeTokens(
        recipe({ linkShade: { light: '700', dark: '300' } })
      );

      expect(built.light['--core-link']).toBe('var(--brand-700)');
      expect(built.dark['--core-link']).toBe('var(--brand-300)');
    });

    it('applies the radius', () => {
      expect(buildThemeTokens(recipe({ radius: '0' })).light['--radius']).toBe(
        '0'
      );
    });
  });

  describe('overrides', () => {
    it('win over the generated value', () => {
      const built = buildThemeTokens(recipe(), {
        light: { '--core-link': 'oklch(0.5 0.2 20)' },
        dark: { '--background': '#000' }
      });

      expect(built.light['--core-link']).toBe('oklch(0.5 0.2 20)');
      expect(built.dark['--background']).toBe('#000');
    });

    it('can add a token the template does not carry', () => {
      const built = buildThemeTokens(recipe(), {
        light: { '--custom-thing': 'red' }
      });

      expect(built.light['--custom-thing']).toBe('red');
    });
  });

  // Every theme block is scoped to its own attribute and nothing sits at bare
  // `:root`, so the light map has to stand alone
  it('builds a complete light map and a dark map of only what changes', () => {
    const built = buildThemeTokens(recipe());

    expect(Object.keys(built.light).length).toBeGreaterThan(
      Object.keys(built.dark).length
    );
    expect(built.dark['--body']).toBeUndefined();
    expect(built.light['--body']).toBeDefined();
  });
});
