import type { Tree } from '@nx/devkit';

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
        `[data-sb-theme="${theme}"][data-theme="dark"]`,
        extractBlock(darkCss)
      )
    );
    lines.push('');
  }

  return lines.join('\n');
}

export async function syncGenerator(tree: Tree) {
  tree.write(OUTPUT_PATH, generateThemesCss(tree));

  return {
    outOfSyncMessage: `'${OUTPUT_PATH}' is out of sync with theme token files. Run 'pnpm nx sync' to update.`
  };
}

export default syncGenerator;
