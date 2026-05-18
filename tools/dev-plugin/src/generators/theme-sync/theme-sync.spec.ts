import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { describe, expect, it } from 'vitest';

import themeSyncGenerator from './theme-sync';

const THEME_LIB = 'libs/shared/theme/src/lib';
const CORE_PATH = `${THEME_LIB}/_core`;
const OUTPUT_CSS = 'apps/storybook/.storybook/themes.css';
const OUTPUT_META = 'apps/storybook/.storybook/themes-meta.ts';
const THEMES = ['shadcn', 'payload-admin', 'spotlight', 'codeware'] as const;

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
    tree.write(`${THEME_LIB}/${theme}/theme-light.css`, COMPLETE_LIGHT_CSS);
    tree.write(`${THEME_LIB}/${theme}/theme-dark.css`, DARK_CSS);
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

  it('throws when a token is absent from theme-light.css', async () => {
    const tree = setupTree();
    tree.write(
      `${THEME_LIB}/shadcn/theme-light.css`,
      `:root {
  --background: oklch(1 0 0);
  --primary: oklch(0.5 0.2 240);
}`
    );
    await expect(themeSyncGenerator(tree)).rejects.toThrow(
      'shadcn/theme-light.css missing'
    );
    await expect(themeSyncGenerator(tree)).rejects.toThrow('--body');
  });

  it('throws when a commented-out token is missing from theme-light.css', async () => {
    const tree = setupTree();
    tree.write(`${THEME_LIB}/spotlight/theme-light.css`, COMMENTED_LIGHT_CSS);
    await expect(themeSyncGenerator(tree)).rejects.toThrow(
      'spotlight/theme-light.css missing'
    );
    await expect(themeSyncGenerator(tree)).rejects.toThrow('--body');
  });

  it('throws when a token is absent from theme-dark.css', async () => {
    const tree = setupTree();
    tree.write(
      `${THEME_LIB}/shadcn/theme-dark.css`,
      `.dark {
  --background: oklch(0.1 0 0);
}`
    );
    await expect(themeSyncGenerator(tree)).rejects.toThrow(
      'shadcn/theme-dark.css missing'
    );
    await expect(themeSyncGenerator(tree)).rejects.toThrow('--primary');
  });

  it('throws when a commented-out token is missing from theme-dark.css', async () => {
    const tree = setupTree();
    tree.write(
      `${THEME_LIB}/shadcn/theme-dark.css`,
      `.dark {
  --background: oklch(0.1 0 0);
  /* --primary: oklch(0.6 0.2 240); */
}`
    );
    await expect(themeSyncGenerator(tree)).rejects.toThrow(
      'shadcn/theme-dark.css missing'
    );
    await expect(themeSyncGenerator(tree)).rejects.toThrow('--primary');
  });
});
