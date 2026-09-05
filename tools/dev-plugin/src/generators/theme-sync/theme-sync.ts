import { type Tree } from '@nx/devkit';
import type { SyncGeneratorResult } from 'nx/src/utils/sync-generators';
import { format, resolveConfig } from 'prettier';

import {
  CORE_PATH,
  RESERVED_THEME_NAMES,
  SITE_THEMES,
  STORYBOOK_THEMES,
  type SbTheme,
  type SiteTheme,
  THEME_LIB_PATH
} from '../themes.js';

const OUTPUT_CSS = 'apps/storybook/.storybook/themes.css';
const OUTPUT_META = 'apps/storybook/.storybook/themes-meta.ts';
const OUTPUT_SHARED_THEMES =
  'libs/shared/util/storybook/src/lib/storybook-themes.ts';
const OUTPUT_SITE_CSS = `${CORE_PATH}/themes.css`;
const OUTPUT_SITE_THEMES = `${THEME_LIB_PATH}/site-themes.ts`;
const OUTPUT_BUILT_IN_TOKENS = `${THEME_LIB_PATH}/built-in-tokens.ts`;

type DarkStrategy = 'class' | 'attribute';

/**
 * Detect whether a tokens-dark.css uses the .dark class or [data-theme=dark] attribute
 * strategy by reading the first selector before the opening brace.
 */
function detectDarkStrategy(css: string): DarkStrategy {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const selector = stripped.slice(0, stripped.indexOf('{')).trim();
  return /^\.dark(\s|,|$)/.test(selector) ? 'class' : 'attribute';
}

function extractBlock(css: string): string {
  const start = css.indexOf('{');
  if (start === -1) return '';
  let depth = 0;
  for (let i = start; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') {
      depth--;
      if (depth === 0) return css.slice(start + 1, i).trim();
    }
  }
  return '';
}

function scopedBlock(selector: string, vars: string): string {
  const indented = vars
    .split('\n')
    .map((line) => (line.trim() ? `  ${line.trim()}` : ''))
    .join('\n');
  return `${selector} {\n${indented}\n}`;
}

/**
 * Build the scoped dark selector for a generated themes.css, based on the
 * attribute that carries the theme name and the theme's own dark strategy.
 *   class     → [<attr>='x'].dark
 *   attribute → [<attr>='x'][data-theme='dark']
 *
 * The attribute strategy is only expressible while `<attr>` is not itself
 * `data-theme` — one attribute cannot hold both the theme and the scheme.
 * Site themes are validated to use the class strategy for that reason.
 */
function darkSelector(
  attr: string,
  theme: string,
  strategy: DarkStrategy
): string {
  return strategy === 'class'
    ? `[${attr}='${theme}'].dark`
    : `[${attr}='${theme}'][data-theme='dark']`;
}

/**
 * Extract the declarations themselves, not only their names.
 *
 * Whitespace is collapsed because a value may wrap across lines — the mono font
 * stack does — and a token map is compared by value, never by how it was laid
 * out.
 */
function extractDeclarations(css: string): Record<string, string> {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const declarations: Record<string, string> = {};

  for (const [, name, value] of stripped.matchAll(
    /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi
  )) {
    declarations[name] = value.replace(/\s+/g, ' ').trim();
  }

  return declarations;
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

/**
 * Extract CSS variable names referenced inside the @theme inline { } block.
 *
 * Comments are stripped first, the way {@link extractDefinedTokens} does: a
 * comment naming a variable is prose about it, not a reference to it, and
 * counting one adds a token every theme is then required to define.
 *
 * A `var()` carrying a fallback still counts. The fallback says what to do when
 * a theme omits the token; it does not make the token optional, and reading it
 * as "not a reference" silently drops that token from every theme's contract.
 */
function extractThemeInlineTokens(css: string): Set<string> {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const tokens = new Set<string>();
  for (const match of stripped.matchAll(/@theme\s+inline\s*\{([\s\S]*?)\}/g)) {
    for (const varMatch of match[1].matchAll(/var\(\s*(--[\w-]+)\s*[,)]/g)) {
      tokens.add(varMatch[1]);
    }
  }
  return tokens;
}

/** Extract CSS variable names referenced in the prose plugin values. */
function extractProseTokens(js: string): Set<string> {
  return new Set(
    [...js.matchAll(/var\(\s*(--[\w-]+)\s*[,)]/g)].map((m) => m[1])
  );
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
      tree.read(`${THEME_LIB_PATH}/${theme}/tokens-light.css`, 'utf-8') ?? '';
    const darkCss =
      tree.read(`${THEME_LIB_PATH}/${theme}/tokens-dark.css`, 'utf-8') ?? '';

    lines.push(`/* ${theme} */`);
    lines.push(
      scopedBlock(`[data-sb-theme="${theme}"]`, extractBlock(lightCss))
    );
    lines.push(
      scopedBlock(
        darkSelector('data-sb-theme', theme, strategies[theme]),
        extractBlock(darkCss)
      )
    );
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Site themes.css — the same token blocks as Storybook's, rescoped to the
 * attribute the tenant site sets on `<html>`. One stylesheet carries every
 * selectable theme, because tenants share a single image and pick at runtime.
 */
function generateSiteThemesCss(
  tree: Tree,
  strategies: Record<SbTheme, DarkStrategy>
): string {
  const lines: string[] = [
    '/* AUTO-GENERATED — do not edit manually. Run `pnpm nx sync` to update. */',
    ''
  ];

  for (const theme of SITE_THEMES) {
    const lightCss =
      tree.read(`${THEME_LIB_PATH}/${theme}/tokens-light.css`, 'utf-8') ?? '';
    const darkCss =
      tree.read(`${THEME_LIB_PATH}/${theme}/tokens-dark.css`, 'utf-8') ?? '';

    lines.push(`/* ${theme} */`);
    lines.push(scopedBlock(`[data-theme="${theme}"]`, extractBlock(lightCss)));
    lines.push(
      scopedBlock(
        darkSelector('data-theme', theme, strategies[theme]),
        extractBlock(darkCss)
      )
    );
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Every built-in's tokens, as data the admin can read at runtime.
 *
 * The theme studio opens a built-in by fitting a recipe to its tokens, and the
 * source CSS is not on disk in a deployed image — only the compiled stylesheet
 * is. So the tokens are emitted here instead.
 *
 * Deliberately importless. `type:theme` is a dependency-free leaf, and reaching
 * for the recipe type to describe this would make it something else; a caller
 * that wants a recipe already depends on the colour library and can parse one.
 */
function generateBuiltInTokens(tree: Tree): string {
  const themes = Object.fromEntries(
    STORYBOOK_THEMES.map((theme) => [
      theme,
      {
        light: extractDeclarations(
          tree.read(`${THEME_LIB_PATH}/${theme}/tokens-light.css`, 'utf-8') ??
            ''
        ),
        dark: extractDeclarations(
          tree.read(`${THEME_LIB_PATH}/${theme}/tokens-dark.css`, 'utf-8') ?? ''
        )
      }
    ])
  );

  return [
    '/* AUTO-GENERATED — do not edit manually. Run `pnpm nx sync` to update. */',
    '',
    "/** One built-in theme's declarations, per colour scheme. */",
    'export type BuiltInThemeTokens = {',
    '  light: Record<string, string>;',
    '  dark: Record<string, string>;',
    '};',
    '',
    `export const BUILT_IN_TOKENS: Record<string, BuiltInThemeTokens> = ${JSON.stringify(themes)};`,
    ''
  ].join('\n');
}

function generateSiteThemesTs(): string {
  return [
    '/* AUTO-GENERATED — do not edit manually. Run `pnpm nx sync` to update. */',
    '',
    `export const SITE_THEMES = ${JSON.stringify(SITE_THEMES)} as const;`,
    '',
    'export type SiteTheme = (typeof SITE_THEMES)[number];',
    ''
  ].join('\n');
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
      t !== '--sidebar' &&
      !t.startsWith('--sidebar-') &&
      t !== '--radius'
  );
  const sidebarTokens = setupArr.filter(
    (t) => t === '--sidebar' || t.startsWith('--sidebar-')
  );
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

/**
 * Guard the theme lists themselves, independent of any file contents.
 *
 * Exported so the rules stay covered by tests — they run against module
 * constants, which a generator invocation cannot vary.
 */
export function validateThemeRegistry(
  storybookThemes: readonly string[],
  siteThemes: readonly string[]
): void {
  // A site theme is written into `data-theme`, where the shared dark variant
  // also matches `[data-theme=dark]`. A theme named `light` or `dark` would be
  // indistinguishable from the color scheme.
  const reserved = storybookThemes.filter((t) =>
    RESERVED_THEME_NAMES.includes(t)
  );
  if (reserved.length > 0) {
    throw new Error(
      `Theme names ${reserved.join(', ')} are reserved — they collide with ` +
        `the color scheme in the site's data-theme attribute. Rename the theme.`
    );
  }

  // Completeness is only checked for Storybook themes, so a site theme outside
  // that list would ship unvalidated.
  const unlisted = siteThemes.filter((t) => !storybookThemes.includes(t));
  if (unlisted.length > 0) {
    throw new Error(
      `Site themes ${unlisted.join(', ')} are missing from STORYBOOK_THEMES, ` +
        `so their tokens are never validated. Add them there too.`
    );
  }
}

export async function themeSyncGenerator(
  tree: Tree
): Promise<SyncGeneratorResult | void> {
  validateThemeRegistry(STORYBOOK_THEMES, SITE_THEMES);

  // Detect dark strategy per theme from the actual CSS selector
  const strategies = {} as Record<SbTheme, DarkStrategy>;
  for (const theme of STORYBOOK_THEMES) {
    const darkCss =
      tree.read(`${THEME_LIB_PATH}/${theme}/tokens-dark.css`, 'utf-8') ?? '';
    strategies[theme] = detectDarkStrategy(darkCss);
  }

  // `[data-theme='x'][data-theme='dark']` can never match — one attribute
  // cannot hold both the theme and the scheme.
  const attributeDark = SITE_THEMES.filter(
    (t: SiteTheme) => strategies[t] === 'attribute'
  );
  if (attributeDark.length > 0) {
    throw new Error(
      `Site themes ${attributeDark.join(', ')} declare dark with the ` +
        `[data-theme=dark] attribute strategy, which is unsatisfiable once ` +
        `data-theme carries the theme name. Use a '.dark' class selector in ` +
        `their tokens-dark.css.`
    );
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
      tree.read(`${THEME_LIB_PATH}/${theme}/tokens-light.css`, 'utf-8') ?? '';
    const darkCss =
      tree.read(`${THEME_LIB_PATH}/${theme}/tokens-dark.css`, 'utf-8') ?? '';

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
        `  ${theme}/tokens-light.css missing: ${missingLight.join(', ')}`
      );
    }
    if (missingDark.length > 0) {
      completenessIssues.push(
        `  ${theme}/tokens-dark.css missing: ${missingDark.join(', ')}`
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

  // Generate storybook-themes.ts (shared lib — theme names and SbTheme type only)
  const rawSharedThemes = [
    '/* AUTO-GENERATED — do not edit manually. Run `pnpm nx sync` to update. */',
    '',
    `export const STORYBOOK_THEMES = ${JSON.stringify(STORYBOOK_THEMES)} as const;`,
    '',
    'export type SbTheme = (typeof STORYBOOK_THEMES)[number];',
    ''
  ].join('\n');
  const sharedThemesContent = await format(rawSharedThemes, {
    ...prettierConfig,
    parser: 'typescript'
  });
  const existingSharedThemes = tree.read(OUTPUT_SHARED_THEMES, 'utf-8') ?? '';

  // Generate the site themes.css and its registry
  const rawSiteCss = generateSiteThemesCss(tree, strategies);
  const siteCssContent = await format(rawSiteCss, {
    ...prettierConfig,
    parser: 'css'
  });
  const existingSiteCss = tree.read(OUTPUT_SITE_CSS, 'utf-8') ?? '';

  const siteThemesContent = await format(generateSiteThemesTs(), {
    ...prettierConfig,
    parser: 'typescript'
  });
  const existingSiteThemes = tree.read(OUTPUT_SITE_THEMES, 'utf-8') ?? '';

  const builtInTokensContent = await format(generateBuiltInTokens(tree), {
    ...prettierConfig,
    parser: 'typescript'
  });
  const existingBuiltInTokens =
    tree.read(OUTPUT_BUILT_IN_TOKENS, 'utf-8') ?? '';

  const outputs: Array<[path: string, content: string, existing: string]> = [
    [OUTPUT_CSS, cssContent, existingCss],
    [OUTPUT_META, tsContent, existingTs],
    [OUTPUT_SHARED_THEMES, sharedThemesContent, existingSharedThemes],
    [OUTPUT_SITE_CSS, siteCssContent, existingSiteCss],
    [OUTPUT_SITE_THEMES, siteThemesContent, existingSiteThemes],
    [OUTPUT_BUILT_IN_TOKENS, builtInTokensContent, existingBuiltInTokens]
  ];

  const stale = outputs.filter(([, content, existing]) => content !== existing);
  if (stale.length === 0) {
    return;
  }

  for (const [path, content] of stale) {
    tree.write(path, content);
  }

  return {
    outOfSyncMessage: `${stale
      .map(([path]) => `'${path}'`)
      .join(', ')} synced with theme token files.`
  };
}

export default themeSyncGenerator;
