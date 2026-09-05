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
      surface: DEFAULT_RECIPE.surface,
      fontBody: DEFAULT_RECIPE.fontBody,
      fontHeading: DEFAULT_RECIPE.fontHeading,
      primarySource: DEFAULT_RECIPE.primarySource,
      chartSource: DEFAULT_RECIPE.chartSource,
      linkSource: DEFAULT_RECIPE.linkSource
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
      linkShade: { light: DEFAULT_RECIPE.linkShade.light, dark: '300' },
      fontBody: DEFAULT_RECIPE.fontBody,
      fontHeading: DEFAULT_RECIPE.fontHeading,
      primarySource: DEFAULT_RECIPE.primarySource,
      chartSource: DEFAULT_RECIPE.chartSource,
      linkSource: DEFAULT_RECIPE.linkSource
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

  // A family offered for headings only must not stick in the body slot
  it('falls back for a font used in the wrong slot', () => {
    expect(normaliseRecipe({ fontBody: 'nasalization' }).fontBody).toBe(
      DEFAULT_RECIPE.fontBody
    );
  });

  it('keeps a font the registry offers for that slot', () => {
    expect(normaliseRecipe({ fontHeading: 'system' }).fontHeading).toBe(
      'system'
    );
  });

  // Normalising is not the licence gate — that is the collection's job. A
  // restricted family has to survive here, or a system user could never
  // reopen the theme they saved
  it('keeps a restricted font, leaving the gate to refuse it', () => {
    expect(normaliseRecipe({ fontHeading: 'nasalization' }).fontHeading).toBe(
      'nasalization'
    );
  });
});
