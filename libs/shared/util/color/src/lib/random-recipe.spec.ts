import { describe, expect, it } from 'vitest';

import { DEFAULT_RECIPE, buildThemeTokens } from './build-theme-tokens';
import { contrastFailures } from './contrast';
import { fontById, isRestrictedFont } from './fonts';
import { NEUTRAL_FAMILIES } from './palette';
import { randomRecipe } from './random-recipe';

const failuresFor = (recipe: ReturnType<typeof randomRecipe>) => {
  const { light, dark } = buildThemeTokens(recipe);
  return [
    ...contrastFailures(light).map((f) => `light ${f.usage}`),
    ...contrastFailures({ ...light, ...dark }).map((f) => `dark ${f.usage}`)
  ];
};

describe('randomRecipe', () => {
  // The point of rolling against the checker: the button can never hand back a
  // theme the studio would then refuse to save
  it('always returns a readable theme', () => {
    for (let roll = 0; roll < 50; roll++) {
      expect(failuresFor(randomRecipe())).toEqual([]);
    }
  });

  it('picks a neutral base and a coloured brand', () => {
    for (let roll = 0; roll < 20; roll++) {
      const { baseFamily, brandFamily } = randomRecipe();
      expect(NEUTRAL_FAMILIES).toContain(baseFamily);
      expect(NEUTRAL_FAMILIES).not.toContain(brandFamily);
    }
  });

  it('varies', () => {
    const rolled = new Set(
      Array.from({ length: 30 }, () => randomRecipe().brandFamily)
    );
    expect(rolled.size).toBeGreaterThan(1);
  });

  it('is deterministic for a given source of randomness', () => {
    const fixed = () => 0.5;
    expect(randomRecipe(fixed)).toEqual(randomRecipe(fixed));
  });

  // Never hand back a failing theme just because the dice were unkind
  it('falls back when nothing passes', () => {
    // Always picks the last candidate, exhausting every attempt identically
    const recipe = randomRecipe(() => 0.999999);
    expect(failuresFor(recipe)).toEqual([]);
    expect([recipe, DEFAULT_RECIPE]).toContainEqual(recipe);
  });

  // A licensed family would give the author a theme the collection refuses to
  // save — a dead end reached by pressing the fun button. Asserted through the
  // registry rather than against a known id, so renaming or replacing the
  // licensed face cannot quietly turn this into a test of nothing.
  it('never rolls a restricted font', () => {
    const rolled = Array.from({ length: 50 }, () => randomRecipe());

    expect(
      rolled
        .flatMap((r) => [r.fontBody, r.fontHeading])
        .filter((id) => isRestrictedFont(id))
    ).toEqual([]);
  });

  it('rolls a font each slot actually offers', () => {
    const recipe = randomRecipe();

    expect(fontById(recipe.fontBody)?.slots).toContain('body');
    expect(fontById(recipe.fontHeading)?.slots).toContain('heading');
  });
});
