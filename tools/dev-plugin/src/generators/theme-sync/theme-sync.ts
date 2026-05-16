import { type Tree } from '@nx/devkit';
import type { SyncGeneratorResult } from 'nx/src/utils/sync-generators';
import { format, resolveConfig } from 'prettier';

const THEME_LIB_PATH = 'libs/shared/theme/src/lib';
const OUTPUT_PATH = 'apps/storybook/.storybook/themes.css';

/**
 * Themes included in the Storybook switcher.
 * payload-admin is the :root default so needs no scoped override.
 */
const STORYBOOK_THEMES = ['payload-admin', 'spotlight', 'codeware'] as const;

function extractBlock(css: string): string {
  const start = css.indexOf('{');
  const end = css.lastIndexOf('}');
  if (start === -1 || end === -1) return '';
  return css.slice(start + 1, end).trim();
}

function scopedBlock(selector: string, vars: string): string {
  const indented = vars
    .split('\n')
    .map((line) => (line.trim() ? `  ${line.trim()}` : ''))
    .join('\n');
  return `${selector} {\n${indented}\n}`;
}

/**
 * Generate the content of the themes.css file by reading the light and dark CSS files for each theme,
 * extracting the variable blocks, and wrapping them in selectors that match the Storybook theme switcher configuration.
 */
function generateThemesCss(tree: Tree): string {
  const lines: string[] = [
    '/* AUTO-GENERATED — do not edit manually. Run `pnpm nx sync` to update. */',
    ''
  ];

  for (const theme of STORYBOOK_THEMES) {
    const lightCss =
      tree.read(`${THEME_LIB_PATH}/${theme}/theme-light.css`, 'utf-8') ?? '';
    const darkCss =
      tree.read(`${THEME_LIB_PATH}/${theme}/theme-dark.css`, 'utf-8') ?? '';

    lines.push(`/* ${theme} */`);
    lines.push(
      scopedBlock(`[data-sb-theme="${theme}"]`, extractBlock(lightCss))
    );
    lines.push(
      scopedBlock(
        `[data-sb-theme='${theme}'][data-theme='dark']`,
        extractBlock(darkCss)
      )
    );
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Sync the generated themes.css file with the source theme token files.
 *
 * If the generated content differs from the existing file,
 * overwrite it and return a message indicating that it was synced.
 *
 * If the content is the same, do nothing.
 */
export async function themeSyncGenerator(
  tree: Tree
): Promise<SyncGeneratorResult> {
  const existingCss = tree.read(OUTPUT_PATH, 'utf-8') ?? '';
  const rawCss = generateThemesCss(tree);
  const prettierConfig = await resolveConfig(OUTPUT_PATH);
  const cssContent = await format(rawCss, { ...prettierConfig, parser: 'css' });

  if (existingCss === cssContent) {
    return;
  }

  tree.write(OUTPUT_PATH, cssContent);

  return {
    outOfSyncMessage: `'${OUTPUT_PATH}' is now synced with theme token files.`
  };
}

export default themeSyncGenerator;
