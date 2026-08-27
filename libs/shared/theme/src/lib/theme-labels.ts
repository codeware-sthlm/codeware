import type { SiteTheme } from './site-themes';

/**
 * Display names for the built-in themes.
 *
 * Typed against the generated registry, so adding a theme to `SITE_THEMES`
 * fails the build here until it is given a name rather than showing its slug.
 *
 * Proper nouns, so they are not localised — `shadcn` is lowercase on purpose.
 *
 * Callers must fall back to the raw value for anything not listed: a theme
 * authored at runtime is not known here.
 */
export const THEME_LABELS: Record<SiteTheme, string> = {
  shadcn: 'shadcn',
  spotlight: 'Spotlight',
  codeware: 'Codeware'
};

/** Display name for a theme, falling back to its own value when unknown. */
export function themeLabel(theme: string): string {
  return THEME_LABELS[theme as SiteTheme] ?? theme;
}
