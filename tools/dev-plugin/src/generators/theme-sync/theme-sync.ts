import { type Tree } from '@nx/devkit';
import type { SyncGeneratorResult } from 'nx/src/utils/sync-generators';
import { format, resolveConfig } from 'prettier';

const THEME_LIB_PATH = 'libs/shared/theme/src/lib';
const CORE_PATH = `${THEME_LIB_PATH}/_core`;
const OUTPUT_CSS = 'apps/storybook/.storybook/themes.css';
const OUTPUT_META = 'apps/storybook/.storybook/themes-meta.ts';

/**
 * Themes included in the Storybook switcher.
 * Each must have theme-light.css, theme-dark.css and tailwind-base.css.
 */
const STORYBOOK_THEMES = [
  'shadcn',
  'payload-admin',
  'spotlight',
  'codeware'
] as const;

type SbTheme = (typeof STORYBOOK_THEMES)[number];
type DarkStrategy = 'class' | 'attribute';

/**
 * Detect whether a theme-dark.css uses the .dark class or [data-theme=dark] attribute
 * strategy by reading the first selector before the opening brace.
 */
function detectDarkStrategy(css: string): DarkStrategy {
  const selector = css.slice(0, css.indexOf('{')).trim();
  return selector === '.dark' ? 'class' : 'attribute';
}

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
 * Build the scoped dark selector for themes.css based on the detected strategy.
 *   class     → [data-sb-theme='x'].dark
 *   attribute → [data-sb-theme='x'][data-theme='dark']
 */
function darkSelector(theme: string, strategy: DarkStrategy): string {
  return strategy === 'class'
    ? `[data-sb-theme='${theme}'].dark`
    : `[data-sb-theme='${theme}'][data-theme='dark']`;
}

/** Extract all CSS custom property names defined in a block of CSS text. */
function extractDefinedTokens(css: string): Set<string> {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const tokens = new Set<string>();
  for (const match of stripped.matchAll(/(--[\w-]+)\s*:/g)) {
    tokens.add(match[1]);
  }
  return tokens;
}

/** Extract CSS variable names referenced inside the @theme inline { } block. */
function extractThemeInlineTokens(css: string): Set<string> {
  const match = css.match(/@theme\s+inline\s*\{([\s\S]*?)\}/);
  const block = match?.[1] ?? '';
  return new Set(
    [...block.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)].map((m) => m[1])
  );
}

/** Extract CSS variable names referenced in the prose plugin values. */
function extractProseTokens(js: string): Set<string> {
  return new Set([...js.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)].map((m) => m[1]));
}

function generateThemesCss(
  tree: Tree,
  strategies: Record<SbTheme, DarkStrategy>
): string {
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
      scopedBlock(darkSelector(theme, strategies[theme]), extractBlock(darkCss))
    );
    lines.push('');
  }

  return lines.join('\n');
}

function generateThemesMeta(
  strategies: Record<SbTheme, DarkStrategy>,
  setupTokens: Set<string>,
  proseTokens: Set<string>
): string {
  const entries = STORYBOOK_THEMES.map(
    (t) => `  '${t}': '${strategies[t]}'`
  ).join(',\n');

  const setupArr = [...setupTokens];
  const shadcnTokens = setupArr.filter(
    (t) =>
      !t.startsWith('--brand-') &&
      !t.startsWith('--core-') &&
      !t.startsWith('--sidebar-') &&
      t !== '--radius'
  );
  const sidebarTokens = setupArr.filter((t) => t.startsWith('--sidebar-'));
  const brandTokens = setupArr.filter((t) => t.startsWith('--brand-'));
  const coreTokens = setupArr.filter((t) => t.startsWith('--core-'));
  const prose = [...proseTokens];

  return [
    '/* AUTO-GENERATED — do not edit manually. Run `pnpm nx sync` to update. */',
    '',
    'export type SbTheme = (typeof STORYBOOK_THEMES)[number];',
    "export type ThemeDarkStrategy = 'class' | 'attribute';",
    '',
    `export const STORYBOOK_THEMES = ${JSON.stringify(STORYBOOK_THEMES)} as const;`,
    '',
    'export const THEME_DARK_STRATEGIES = {',
    entries,
    '} as const satisfies Record<SbTheme, ThemeDarkStrategy>;',
    '',
    `export const SHADCN_TOKENS = ${JSON.stringify(shadcnTokens)} as const;`,
    `export const SIDEBAR_TOKENS = ${JSON.stringify(sidebarTokens)} as const;`,
    `export const BRAND_TOKENS = ${JSON.stringify(brandTokens)} as const;`,
    `export const CORE_TOKENS = ${JSON.stringify(coreTokens)} as const;`,
    `export const PROSE_TOKENS = ${JSON.stringify(prose)} as const;`,
    ''
  ].join('\n');
}

export async function themeSyncGenerator(
  tree: Tree
): Promise<SyncGeneratorResult> {
  // Detect dark strategy per theme from the actual CSS selector
  const strategies = {} as Record<SbTheme, DarkStrategy>;
  for (const theme of STORYBOOK_THEMES) {
    const darkCss =
      tree.read(`${THEME_LIB_PATH}/${theme}/theme-dark.css`, 'utf-8') ?? '';
    strategies[theme] = detectDarkStrategy(darkCss);
  }

  // Derive required token sets from the contract files rather than a reference theme.
  // tailwind-setup.css @theme inline defines which CSS variables Tailwind maps.
  // typography-prose.js defines which prose variables the typography plugin uses.
  const tailwindSetupCss =
    tree.read(`${CORE_PATH}/tailwind-setup.css`, 'utf-8') ?? '';
  const proseJs = tree.read(`${CORE_PATH}/typography-prose.js`, 'utf-8') ?? '';
  const setupTokens = extractThemeInlineTokens(tailwindSetupCss);
  const proseTokens = extractProseTokens(proseJs);

  // Light: must define all @theme inline tokens + all prose tokens
  const lightRequired = new Set([...setupTokens, ...proseTokens]);

  // Dark: only the shadcn UI tokens — brand/core don't change in dark mode and
  // cascade correctly from :root. Radius is excluded for the same reason.
  const darkRequired = new Set(
    [...setupTokens].filter(
      (t) =>
        !t.startsWith('--brand-') &&
        !t.startsWith('--core-') &&
        t !== '--radius'
    )
  );

  const completenessIssues: string[] = [];
  for (const theme of STORYBOOK_THEMES) {
    const lightCss =
      tree.read(`${THEME_LIB_PATH}/${theme}/theme-light.css`, 'utf-8') ?? '';
    const darkCss =
      tree.read(`${THEME_LIB_PATH}/${theme}/theme-dark.css`, 'utf-8') ?? '';

    const themeLight = extractDefinedTokens(lightCss);
    const themeDark = extractDefinedTokens(darkCss);

    const missingLight = [...lightRequired]
      .filter((t) => !themeLight.has(t))
      .sort();
    const missingDark = [...darkRequired]
      .filter((t) => !themeDark.has(t))
      .sort();

    if (missingLight.length > 0) {
      completenessIssues.push(
        `  ${theme}/theme-light.css missing: ${missingLight.join(', ')}`
      );
    }
    if (missingDark.length > 0) {
      completenessIssues.push(
        `  ${theme}/theme-dark.css missing: ${missingDark.join(', ')}`
      );
    }
  }

  if (completenessIssues.length > 0) {
    throw new Error(
      `Theme completeness issues (compare against tailwind-setup.css and typography-prose.js):\n${completenessIssues.join('\n')}`
    );
  }

  const prettierConfig = await resolveConfig(OUTPUT_CSS);

  // Generate themes.css
  const rawCss = generateThemesCss(tree, strategies);
  const cssContent = await format(rawCss, { ...prettierConfig, parser: 'css' });
  const existingCss = tree.read(OUTPUT_CSS, 'utf-8') ?? '';

  // Generate themes-meta.ts
  const rawTs = generateThemesMeta(strategies, setupTokens, proseTokens);
  const tsContent = await format(rawTs, {
    ...prettierConfig,
    parser: 'typescript'
  });
  const existingTs = tree.read(OUTPUT_META, 'utf-8') ?? '';

  const cssChanged = existingCss !== cssContent;
  const tsChanged = existingTs !== tsContent;

  if (!cssChanged && !tsChanged) {
    return;
  }

  if (cssChanged) tree.write(OUTPUT_CSS, cssContent);
  if (tsChanged) tree.write(OUTPUT_META, tsContent);

  return {
    outOfSyncMessage: `'${OUTPUT_CSS}' and '${OUTPUT_META}' synced with theme token files.`
  };
}

export default themeSyncGenerator;
