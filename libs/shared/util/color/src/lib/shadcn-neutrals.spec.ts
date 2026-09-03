import { describe, expect, it } from 'vitest';

import { parseColor } from './oklch';
import { COLOR_SHADES } from './palette';
import { shadcnNeutrals } from './shadcn-neutrals';

/**
 * `tailwindColors` is guarded by diffing it against `tailwindcss/colors`. These
 * four have no upstream package to diff against, so the guard is structural
 * instead: it catches a mistyped digit or a step transcribed out of order,
 * which is the failure mode hand-entered colour data actually has.
 */
const families = Object.entries(shadcnNeutrals);

/** Above every family here and above `slate`'s 0.046, the tinted Tailwind neutral. */
const MAX_NEUTRAL_CHROMA = 0.05;

describe.each(families)('%s', (_family, ramp) => {
  it('defines every step, in order', () => {
    expect(Object.keys(ramp)).toEqual([...COLOR_SHADES]);
  });

  it('is readable by the parser every other check goes through', () => {
    const unparsed = Object.entries(ramp)
      .filter(([, value]) => parseColor(value) === null)
      .map(([step]) => step);

    expect(unparsed).toEqual([]);
  });

  it('darkens at every step', () => {
    const lightness = Object.values(ramp).map((value) => parseColor(value)?.l);

    expect(lightness.every((l) => l !== undefined && l >= 0 && l <= 1)).toBe(
      true
    );
    expect(lightness).toEqual(
      [...lightness].sort((a, b) => Number(b) - Number(a))
    );
    expect(new Set(lightness).size).toBe(lightness.length);
  });

  it('stays neutral enough to carry text and surfaces', () => {
    const tinted = Object.entries(ramp).filter(
      ([, value]) => (parseColor(value)?.c ?? 0) > MAX_NEUTRAL_CHROMA
    );

    expect(tinted).toEqual([]);
  });
});
