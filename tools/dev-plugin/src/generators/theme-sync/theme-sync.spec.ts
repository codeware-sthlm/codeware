import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { describe, expect, it } from 'vitest';

import themeSyncGenerator, { validateThemeRegistry } from './theme-sync';

const THEME_LIB = 'libs/shared/theme/src/lib';
const CORE_PATH = `${THEME_LIB}/_core`;
const OUTPUT_CSS = 'apps/storybook/.storybook/themes.css';
const OUTPUT_META = 'apps/storybook/.storybook/themes-meta.ts';
const OUTPUT_SITE_CSS = `${CORE_PATH}/themes.css`;
const OUTPUT_SITE_THEMES = 'libs/shared/theme/src/lib/site-themes.ts';
const THEMES = ['shadcn', 'payload-admin', 'spotlight', 'codeware'] as const;
const SITE_THEMES = ['shadcn', 'spotlight', 'codeware'] as const;

// Payload's admin convention — valid for a Storybook theme, unsatisfiable for
// a site theme whose name already occupies data-theme
const ATTRIBUTE_DARK_CSS = `[data-theme='dark'] {
  --background: oklch(0.1 0 0);
  --primary: oklch(0.6 0.2 240);
}`;

// Minimal contract: 2 shadcn tokens + 1 prose token (--body)
const TAILWIND_SETUP_CSS = `
@theme inline {
  --color-background: var(--background);
  --color-primary: var(--primary);
}
`;

const TYPOGRAPHY_PROSE_JS = `
module.exports = { '--tw-prose-body': 'var(--body)' };
`;

const COMPLETE_LIGHT_CSS = `:root {
  --background: oklch(1 0 0);
  --primary: oklch(0.5 0.2 240);
  --body: oklch(0.1 0 0);
}`;

// --body is commented out — this is the bug scenario
const COMMENTED_LIGHT_CSS = `:root {
  --background: oklch(1 0 0);
  --primary: oklch(0.5 0.2 240);
  /* --body: oklch(0.1 0 0); */
}`;

const DARK_CSS = `.dark {
  --background: oklch(0.1 0 0);
  --primary: oklch(0.6 0.2 240);
}`;

function setupTree() {
  const tree = createTreeWithEmptyWorkspace();
  tree.write(`${CORE_PATH}/tailwind-setup.css`, TAILWIND_SETUP_CSS);
  tree.write(`${CORE_PATH}/typography-prose.js`, TYPOGRAPHY_PROSE_JS);
  for (const theme of THEMES) {
    tree.write(`${THEME_LIB}/${theme}/tokens-light.css`, COMPLETE_LIGHT_CSS);
    tree.write(`${THEME_LIB}/${theme}/tokens-dark.css`, DARK_CSS);
  }
  tree.write(OUTPUT_CSS, '');
  tree.write(OUTPUT_META, '');
  return tree;
}

describe('theme-sync generator — completeness check', () => {
  it('passes when all required tokens are defined', async () => {
    const tree = setupTree();
    await expect(themeSyncGenerator(tree)).resolves.not.toThrow();
  });

  it('throws when a token is absent from tokens-light.css', async () => {
    const tree = setupTree();
    tree.write(
      `${THEME_LIB}/shadcn/tokens-light.css`,
      `:root {
  --background: oklch(1 0 0);
  --primary: oklch(0.5 0.2 240);
}`
    );
    await expect(themeSyncGenerator(tree)).rejects.toThrow(
      'shadcn/tokens-light.css missing'
    );
    await expect(themeSyncGenerator(tree)).rejects.toThrow('--body');
  });

  it('throws when a commented-out token is missing from tokens-light.css', async () => {
    const tree = setupTree();
    tree.write(`${THEME_LIB}/spotlight/tokens-light.css`, COMMENTED_LIGHT_CSS);
    await expect(themeSyncGenerator(tree)).rejects.toThrow(
      'spotlight/tokens-light.css missing'
    );
    await expect(themeSyncGenerator(tree)).rejects.toThrow('--body');
  });

  it('throws when a token is absent from tokens-dark.css', async () => {
    const tree = setupTree();
    tree.write(
      `${THEME_LIB}/shadcn/tokens-dark.css`,
      `.dark {
  --background: oklch(0.1 0 0);
}`
    );
    await expect(themeSyncGenerator(tree)).rejects.toThrow(
      'shadcn/tokens-dark.css missing'
    );
    await expect(themeSyncGenerator(tree)).rejects.toThrow('--primary');
  });

  it('throws when a commented-out token is missing from tokens-dark.css', async () => {
    const tree = setupTree();
    tree.write(
      `${THEME_LIB}/shadcn/tokens-dark.css`,
      `.dark {
  --background: oklch(0.1 0 0);
  /* --primary: oklch(0.6 0.2 240); */
}`
    );
    await expect(themeSyncGenerator(tree)).rejects.toThrow(
      'shadcn/tokens-dark.css missing'
    );
    await expect(themeSyncGenerator(tree)).rejects.toThrow('--primary');
  });
});

describe('theme-sync generator — site themes', () => {
  it('scopes each site theme to data-theme, light and dark', async () => {
    const tree = setupTree();
    await themeSyncGenerator(tree);

    const css = tree.read(OUTPUT_SITE_CSS, 'utf-8') ?? '';
    for (const theme of SITE_THEMES) {
      expect(css).toContain(`[data-theme='${theme}']`);
      expect(css).toContain(`[data-theme='${theme}'].dark`);
    }
  });

  it('excludes payload-admin from the site stylesheet and registry', async () => {
    const tree = setupTree();
    await themeSyncGenerator(tree);

    expect(tree.read(OUTPUT_SITE_CSS, 'utf-8')).not.toContain('payload-admin');
    expect(tree.read(OUTPUT_SITE_THEMES, 'utf-8')).not.toContain(
      'payload-admin'
    );
  });

  it('emits the site theme registry', async () => {
    const tree = setupTree();
    await themeSyncGenerator(tree);

    const registry = tree.read(OUTPUT_SITE_THEMES, 'utf-8') ?? '';
    // Prettier-formatted, so single quotes
    expect(registry).toContain(
      `export const SITE_THEMES = [${SITE_THEMES.map((t) => `'${t}'`).join(', ')}] as const`
    );
    expect(registry).toContain(
      'export type SiteTheme = (typeof SITE_THEMES)[number]'
    );
  });

  it('leaves the Storybook stylesheet scoped to data-sb-theme', async () => {
    const tree = setupTree();
    await themeSyncGenerator(tree);

    const css = tree.read(OUTPUT_CSS, 'utf-8') ?? '';
    expect(css).toContain("[data-sb-theme='shadcn']");
    expect(css).toContain("[data-sb-theme='payload-admin']");
    // the site attribute must never leak into the Storybook output
    expect(css).not.toContain("[data-theme='shadcn']");
  });

  it('throws when a site theme declares dark by attribute', async () => {
    const tree = setupTree();
    tree.write(`${THEME_LIB}/spotlight/tokens-dark.css`, ATTRIBUTE_DARK_CSS);
    await expect(themeSyncGenerator(tree)).rejects.toThrow(
      'unsatisfiable once data-theme carries the theme name'
    );
  });

  it('allows payload-admin to declare dark by attribute', async () => {
    const tree = setupTree();
    tree.write(
      `${THEME_LIB}/payload-admin/tokens-dark.css`,
      ATTRIBUTE_DARK_CSS
    );
    await expect(themeSyncGenerator(tree)).resolves.not.toThrow();
  });
});

describe('theme-sync generator — registry validation', () => {
  it('accepts the shipped lists', () => {
    expect(() => validateThemeRegistry(THEMES, SITE_THEMES)).not.toThrow();
  });

  it('rejects a theme named light or dark', () => {
    expect(() =>
      validateThemeRegistry([...THEMES, 'dark'], SITE_THEMES)
    ).toThrow('reserved');
  });

  it('rejects a site theme absent from the Storybook list', () => {
    expect(() => validateThemeRegistry(THEMES, ['brand-new'])).toThrow(
      'missing from STORYBOOK_THEMES'
    );
  });
});
