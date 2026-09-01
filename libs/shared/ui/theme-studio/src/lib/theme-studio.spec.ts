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

  // Exporting writes platform theme files, which is a system-admin action —
  // a tenant admin authoring their own site's theme must not be offered it
  it('gates the export behind canExport', () => {
    const trigger = source.indexOf('Export theme files');
    const guard = source.indexOf('{canExport && (');

    expect(trigger).toBeGreaterThan(-1);
    expect(guard).toBeGreaterThan(-1);
    expect(guard).toBeLessThan(trigger);
  });

  it('denies the export unless the host allows it', () => {
    expect(source).toContain('canExport = false');
  });

  // Radix portals to document.body by default, which in the admin puts a sheet
  // beside the studio's overlay rather than inside it — where it opens, and is
  // painted underneath. Every sheet has to be handed the studio's own root.
  it('portals every sheet into the studio', () => {
    const sheets = source.match(/<SheetContent[\s\S]*?>/g) ?? [];

    expect(sheets.length).toBeGreaterThan(0);
    expect(
      sheets.filter((sheet) => !sheet.includes('container={root}'))
    ).toEqual([]);
  });
});
