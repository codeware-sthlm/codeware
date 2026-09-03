import { describe, expect, it } from 'vitest';

import { DEFAULT_RECIPE, buildThemeTokens } from './build-theme-tokens';
import { normaliseRecipe } from './normalise-recipe';

describe('normaliseRecipe', () => {
  it('keeps a whole recipe untouched', () => {
    expect(normaliseRecipe(DEFAULT_RECIPE)).toEqual(DEFAULT_RECIPE);
  });

  // The case that crashed the studio: a theme saved before `surface` existed
  it('fills a field the stored recipe predates', () => {
    const legacy = {
      baseFamily: 'zinc',
      brandFamily: 'teal',
      radius: '1rem',
      linkShade: { light: '700', dark: '300' }
    };

    expect(normaliseRecipe(legacy)).toEqual({
      ...legacy,
      surface: DEFAULT_RECIPE.surface
    });
  });

  it('builds a theme from a recipe missing a field', () => {
    expect(() =>
      buildThemeTokens({
        baseFamily: 'zinc',
        brandFamily: 'teal',
        radius: '1rem',
        linkShade: { light: '700', dark: '300' }
      } as never)
    ).not.toThrow();
  });

  it.each([undefined, null, 'nonsense', 42, []])(
    'falls back entirely for %s',
    (value) => expect(normaliseRecipe(value)).toEqual(DEFAULT_RECIPE)
  );

  // One bad field should not cost the others
  it('falls back per field', () => {
    const normalised = normaliseRecipe({
      baseFamily: 'not-a-colour',
      brandFamily: 'teal',
      surface: 'sideways',
      radius: '2rem',
      linkShade: { light: '999', dark: '300' }
    });

    expect(normalised).toEqual({
      baseFamily: DEFAULT_RECIPE.baseFamily,
      brandFamily: 'teal',
      surface: DEFAULT_RECIPE.surface,
      radius: '2rem',
      linkShade: { light: DEFAULT_RECIPE.linkShade.light, dark: '300' }
    });
  });

  it('rejects white and black as families', () => {
    expect(normaliseRecipe({ brandFamily: 'white' }).brandFamily).toBe(
      DEFAULT_RECIPE.brandFamily
    );
  });

  // Silent when it goes wrong: a rejected family reads back as the default, so
  // the studio would offer a base it then refused to build
  it.each(['mauve', 'olive', 'mist', 'taupe'])(
    'keeps %s, which Tailwind does not ship',
    (family) => {
      expect(normaliseRecipe({ baseFamily: family }).baseFamily).toBe(family);
      expect(normaliseRecipe({ brandFamily: family }).brandFamily).toBe(family);
    }
  );

  it('rejects a family neither source ships', () => {
    expect(normaliseRecipe({ baseFamily: 'sand' }).baseFamily).toBe(
      DEFAULT_RECIPE.baseFamily
    );
  });
});
