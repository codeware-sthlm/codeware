import { tailwind } from '@codeware/shared/util/tailwind';
import { describe, expect, it } from 'vitest';

import {
  COLOR_SHADES,
  brandRamp,
  paletteAlias,
  paletteColor,
  shade
} from './palette';
import { shadcnNeutrals } from './shadcn-neutrals';

describe('paletteColor', () => {
  it('resolves a Tailwind family', () => {
    expect(paletteColor('zinc-500')).toBe(tailwind.color('zinc-500'));
  });

  it('resolves a family Tailwind does not ship', () => {
    expect(paletteColor('mauve-500')).toBe(shadcnNeutrals.mauve['500']);
  });

  it('resolves the colours without a ramp', () => {
    expect(paletteColor('white')).toBe('#fff');
  });

  // Both dispatches index a plain object, where `toString` is a hit and a
  // function. Reachable only from an unvalidated string, which is what these
  // exports take once anything outside the recipe path calls them
  it.each(['toString', 'constructor', 'hasOwnProperty'])(
    'does not read %s off the prototype',
    (key) => {
      expect(paletteColor(key as 'mauve-500')).toBeUndefined();
      expect(paletteAlias(key as 'mauve-500')).toBe(`var(--color-${key})`);
    }
  );
});

describe('shade', () => {
  // Every base-driven token goes through here, so a family the dispatch cannot
  // reach would render as an empty value rather than fail
  it.each(Object.keys(shadcnNeutrals))('covers every step of %s', (family) => {
    const missing = COLOR_SHADES.filter(
      (step) => !shade(family as 'mauve', step)
    );

    expect(missing).toEqual([]);
  });
});

describe('brandRamp', () => {
  it('carries literals for a family Tailwind does not ship', () => {
    expect(brandRamp('olive')['--brand-600']).toBe(shadcnNeutrals.olive['600']);
  });
});
