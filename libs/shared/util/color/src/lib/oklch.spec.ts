import { describe, expect, it } from 'vitest';

import { contrastRatio, parseColor, relativeLuminance } from './oklch';

const color = (value: string) => {
  const parsed = parseColor(value);
  if (!parsed) {
    throw new Error(`Expected ${value} to parse`);
  }
  return parsed;
};

describe('parseColor', () => {
  it('reads the oklch notation the palette uses', () => {
    expect(parseColor('oklch(0.704 0.14 182.503)')).toEqual({
      l: 0.704,
      c: 0.14,
      h: 182.503,
      alpha: 1
    });
  });

  // Both forms appear across the committed themes
  it('reads lightness as a percentage', () => {
    expect(parseColor('oklch(70.4% 0.14 182.503)')?.l).toBeCloseTo(0.704, 5);
  });

  it('reads the alpha channel', () => {
    expect(parseColor('oklch(1 0 0 / 10%)')?.alpha).toBeCloseTo(0.1, 5);
    expect(parseColor('oklch(1 0 0 / 0.15)')?.alpha).toBeCloseTo(0.15, 5);
  });

  it.each(['#fff', '#ffffff', '#FFFFFF'])('reads the hex form %s', (value) => {
    expect(relativeLuminance(color(value))).toBeCloseTo(1, 5);
  });

  // A token can hold an alias or an expression; neither has a value to check
  it.each(['var(--brand-600)', 'calc(var(--radius) - 0.125rem)', 'red', ''])(
    'returns null for %s',
    (value) => expect(parseColor(value)).toBeNull()
  );
});

describe('relativeLuminance', () => {
  it('puts white at 1 and black at 0', () => {
    expect(relativeLuminance(color('oklch(1 0 0)'))).toBeCloseTo(1, 5);
    expect(relativeLuminance(color('oklch(0 0 0)'))).toBeCloseTo(0, 5);
  });
});

describe('contrastRatio', () => {
  // The published WCAG landmarks — black on white is the maximum, and #767676
  // is the grey that sits exactly on the 4.5:1 AA boundary
  it('matches the published WCAG values', () => {
    expect(contrastRatio(color('#000000'), color('#ffffff'))).toBeCloseTo(
      21,
      4
    );
    expect(contrastRatio(color('#767676'), color('#ffffff'))).toBeCloseTo(
      4.54,
      2
    );
    expect(contrastRatio(color('#0000ff'), color('#ffffff'))).toBeCloseTo(
      8.59,
      2
    );
  });

  it('is symmetric', () => {
    const a = color('#1d2951');
    const b = color('#d0d2d3');
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 10);
  });

  it('bottoms out at 1 for a colour against itself', () => {
    expect(contrastRatio(color('#588bae'), color('#588bae'))).toBeCloseTo(
      1,
      10
    );
  });

  // Checking a translucent foreground at full strength reports contrast no
  // visitor sees — dark themes set `--border` to `oklch(1 0 0 / 10%)`
  it('composites a translucent foreground over the background', () => {
    const faint = color('oklch(1 0 0 / 0.1)');
    const dark = color('oklch(0 0 0)');

    expect(contrastRatio(faint, dark)).toBeLessThan(
      contrastRatio(color('oklch(1 0 0)'), dark)
    );
    expect(contrastRatio(faint, dark)).toBeCloseTo(3, 0);
  });
});
