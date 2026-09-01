import { describe, expect, it } from 'vitest';

import { DEFAULT_RECIPE, buildThemeTokens } from './build-theme-tokens';
import { brokenReferences } from './references';

describe('brokenReferences', () => {
  const { light, dark } = buildThemeTokens(DEFAULT_RECIPE);

  it('passes a generated theme', () => {
    expect(brokenReferences(light)).toEqual([]);
    expect(brokenReferences({ ...light, ...dark })).toEqual([]);
  });

  // The value whitelist judges characters, so this is well-formed CSS that
  // resolves to nothing and leaves the surface unpainted
  it('catches a reference to a token that does not exist', () => {
    expect(
      brokenReferences({
        ...light,
        '--core-background-content': 'var(--backgroundx)'
      })
    ).toEqual([
      {
        token: '--core-background-content',
        reference: '--backgroundx',
        reason: 'undefined'
      }
    ]);
  });

  it('catches a reference inside a function', () => {
    const broken = brokenReferences({
      ...light,
      '--radius-md': 'calc(var(--radiusx) - 2px)'
    });

    expect(broken.map((b) => b.reference)).toEqual(['--radiusx']);
  });

  it('catches a cycle', () => {
    const broken = brokenReferences({
      ...light,
      '--core-text': 'var(--foreground)',
      '--foreground': 'var(--core-text)'
    });

    expect(broken.length).toBeGreaterThan(0);
    expect(broken.every((b) => b.reason === 'cycle')).toBe(true);
  });

  it('accepts an alias chain that terminates', () => {
    expect(
      brokenReferences({
        '--a': 'var(--b)',
        '--b': 'var(--c)',
        '--c': 'oklch(1 0 0)'
      })
    ).toEqual([]);
  });

  // A dark map alone aliases tokens only light defines
  it('is meant to run on the merged map for dark', () => {
    expect(brokenReferences(dark).length).toBeGreaterThan(0);
    expect(brokenReferences({ ...light, ...dark })).toEqual([]);
  });
});
