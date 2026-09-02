import { DEFAULT_RECIPE } from '@codeware/shared/util/color';
import { describe, expect, it } from 'vitest';

// `?raw` rather than reading the file: under jsdom `import.meta.url` is not a
// file URL, and the module graph resolves this the same way in any environment
import source from './ThemeStudio.tsx?raw';

/**
 * Read as source rather than rendered: the point is that a control exists for
 * every recipe field, and a field added to the recipe without one leaves the
 * studio quietly unable to change it — which is how `surface` shipped with no
 * way to pick it.
 */
describe('ThemeStudio', () => {
  it('finds the source', () => {
    expect(source).toContain('export function ThemeStudio');
  });

  it.each(Object.keys(DEFAULT_RECIPE))('has a control for %s', (field) => {
    expect(source).toMatch(new RegExp(`update\\(\\{\\s*${field}`));
  });
});
