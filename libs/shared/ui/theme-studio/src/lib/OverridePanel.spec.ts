import { DEFAULT_RECIPE, buildThemeTokens } from '@codeware/shared/util/color';
import { describe, expect, it } from 'vitest';

import { type ThemeOverrides, applyTokenEdit } from './OverridePanel';

const generated = buildThemeTokens(DEFAULT_RECIPE);
const none: ThemeOverrides = { light: {}, dark: {} };

describe('applyTokenEdit', () => {
  it('stores a value that differs from the recipe', () => {
    const next = applyTokenEdit(
      none,
      generated,
      'light',
      '--primary',
      '#123456'
    );
    expect(next.light).toEqual({ '--primary': '#123456' });
  });

  // Storing it would pin the token, and a later brand change would skip it
  // with nothing on screen to say why
  it('removes an edit back to the generated value', () => {
    const pinned = applyTokenEdit(
      none,
      generated,
      'light',
      '--primary',
      '#123456'
    );
    const next = applyTokenEdit(
      pinned,
      generated,
      'light',
      '--primary',
      generated.light['--primary']
    );

    expect(next.light).toEqual({});
  });

  it('removes an edit that is cleared', () => {
    const pinned = applyTokenEdit(
      none,
      generated,
      'light',
      '--primary',
      '#123456'
    );
    expect(
      applyTokenEdit(pinned, generated, 'light', '--primary', '').light
    ).toEqual({});
  });

  it('keeps the other scheme untouched', () => {
    const withDark = applyTokenEdit(
      none,
      generated,
      'dark',
      '--primary',
      '#000'
    );
    const next = applyTokenEdit(
      withDark,
      generated,
      'light',
      '--primary',
      '#fff'
    );

    expect(next.dark).toEqual({ '--primary': '#000' });
    expect(next.light).toEqual({ '--primary': '#fff' });
  });

  it('does not mutate what it was given', () => {
    applyTokenEdit(none, generated, 'light', '--primary', '#123456');
    expect(none.light).toEqual({});
  });
});
