import type { TailwindColor } from '@codeware/shared/util/tailwind';

import type { ColorShade } from './palette';

/**
 * Where a generated token gets its value.
 *
 * `base` names a step of the theme's neutral family, `palette` a fixed colour
 * anywhere in the Tailwind palette; both resolve to literals. `value` is
 * written out verbatim, which covers keywords and `var()` references to tokens
 * declared in the same block.
 *
 * Nothing here holds a raw `oklch(…)` string. Every colour in the committed
 * themes turned out to be a palette entry, so naming it keeps the table
 * readable and makes a mistyped digit impossible.
 */
export type TokenSource =
  | { base: ColorShade }
  | { palette: TailwindColor }
  | { value: string };

/**
 * The shadcn layer, light.
 *
 * Every neutral is a step of the chosen family — the mapping was read off the
 * committed `shadcn` and `codeware` themes, which agree on it exactly. That is
 * what makes any Tailwind family usable as a base, rather than only the five
 * shadcn publishes.
 */
export const BASE_LIGHT: Record<string, TokenSource> = {
  '--background': { palette: 'white' },
  '--foreground': { base: '950' },
  '--card': { palette: 'white' },
  '--card-foreground': { base: '950' },
  '--popover': { palette: 'white' },
  '--popover-foreground': { base: '950' },
  '--primary': { base: '900' },
  '--primary-foreground': { base: '50' },
  '--secondary': { base: '100' },
  '--secondary-foreground': { base: '900' },
  '--muted': { base: '100' },
  // 600, not shadcn's 500: on `--muted` that only reaches 4.34:1, just under AA
  '--muted-foreground': { base: '600' },
  '--accent': { base: '100' },
  '--accent-foreground': { base: '900' },
  '--destructive': { palette: 'red-600' },
  '--destructive-foreground': { palette: 'white' },
  '--border': { base: '200' },
  '--input': { base: '200' },
  // 500, not shadcn's 400: a focus ring is a UI component and owes 3:1, which
  // 400 misses on white at 2.59:1
  '--ring': { base: '500' },
  '--chart-1': { palette: 'orange-600' },
  '--chart-2': { palette: 'teal-600' },
  '--chart-3': { palette: 'cyan-900' },
  '--chart-4': { palette: 'amber-400' },
  '--chart-5': { palette: 'amber-500' },
  '--sidebar': { base: '50' },
  '--sidebar-foreground': { base: '950' },
  '--sidebar-primary': { base: '900' },
  '--sidebar-primary-foreground': { base: '50' },
  '--sidebar-accent': { base: '100' },
  '--sidebar-accent-foreground': { base: '900' },
  '--sidebar-border': { base: '200' },
  '--sidebar-ring': { base: '500' }
};

/**
 * The shadcn layer, dark.
 *
 * `--border` and `--input` are translucent white rather than a palette step —
 * a hairline that reads at any surface depth, which a fixed shade does not.
 */
export const BASE_DARK: Record<string, TokenSource> = {
  '--background': { base: '950' },
  '--foreground': { base: '50' },
  '--card': { base: '900' },
  '--card-foreground': { base: '50' },
  '--popover': { base: '900' },
  '--popover-foreground': { base: '50' },
  '--primary': { base: '200' },
  '--primary-foreground': { base: '900' },
  '--secondary': { base: '800' },
  '--secondary-foreground': { base: '50' },
  '--muted': { base: '800' },
  '--muted-foreground': { base: '400' },
  '--accent': { base: '800' },
  '--accent-foreground': { base: '50' },
  '--destructive': { palette: 'red-700' },
  '--destructive-foreground': { palette: 'white' },
  '--border': { value: 'oklch(1 0 0 / 10%)' },
  '--input': { value: 'oklch(1 0 0 / 15%)' },
  '--ring': { base: '500' },
  '--chart-1': { palette: 'blue-700' },
  '--chart-2': { palette: 'emerald-500' },
  '--chart-3': { palette: 'amber-500' },
  '--chart-4': { palette: 'purple-500' },
  '--chart-5': { palette: 'rose-500' },
  '--sidebar': { base: '900' },
  '--sidebar-foreground': { base: '50' },
  '--sidebar-primary': { base: '200' },
  '--sidebar-primary-foreground': { base: '900' },
  '--sidebar-accent': { base: '800' },
  '--sidebar-accent-foreground': { base: '50' },
  '--sidebar-border': { value: 'oklch(1 0 0 / 10%)' },
  '--sidebar-ring': { base: '500' }
};

/**
 * The core and prose layers, light.
 *
 * Taken from the committed themes, where 38 of these 40 tokens are
 * byte-identical between `shadcn` and `codeware` — they are plumbing from the
 * renderer's vocabulary onto the shadcn one, not a design surface. The two that
 * do vary, `--core-link` and `--core-surface-invert`, come from the recipe and
 * are added by the builder.
 */
export const ALIAS_LIGHT: Record<string, TokenSource> = {
  '--core-action-btn-foreground': { value: 'var(--muted-foreground)' },
  '--core-action-btn-foreground-hover': { value: 'var(--foreground)' },
  '--core-action-btn-background': { value: 'var(--background)' },
  '--core-action-btn-border': { value: 'var(--border)' },
  '--core-action-btn-border-hover': { value: 'var(--border)' },
  '--core-action-btn-icon-fill': { value: 'var(--muted)' },
  '--core-action-btn-shadow': { value: 'transparent' },
  '--core-background-body': { value: 'var(--background)' },
  '--core-background-content': { value: 'var(--background)' },
  '--core-content-border': { value: 'var(--border)' },
  '--core-header': { value: 'var(--foreground)' },
  '--core-headline': { value: 'var(--foreground)' },
  '--core-navbar': { value: 'var(--background)' },
  '--core-navbar-border': { value: 'var(--border)' },
  '--core-navbar-shadow': { value: 'transparent' },
  '--core-nav-link': { value: 'var(--foreground)' },
  '--core-nav-link-active': { value: 'var(--primary)' },
  '--core-nav-link-hover': { value: 'var(--primary)' },
  '--core-text': { value: 'var(--foreground)' },
  '--body': { value: 'var(--foreground)' },
  '--bold': { value: 'var(--foreground)' },
  '--bullets': { value: 'var(--primary)' },
  '--captions': { value: 'var(--muted-foreground)' },
  '--code': { value: 'var(--foreground)' },
  '--code-bg': { value: 'var(--muted)' },
  '--counters': { value: 'var(--primary)' },
  '--headings': { value: 'var(--foreground)' },
  '--hr': { value: 'var(--border)' },
  '--links': { value: 'var(--primary)' },
  '--links-hover': { value: 'var(--primary)' },
  '--pre-bg': { value: 'var(--secondary)' },
  '--pre-border': { value: 'var(--border)' },
  '--pre-code': { value: 'var(--foreground)' },
  '--quote-borders': { value: 'var(--border)' },
  '--td-borders': { value: 'var(--border)' },
  '--th-borders': { value: 'var(--border)' },
  '--underline': { value: 'var(--primary)' },
  '--underline-hover': { value: 'var(--primary)' }
};

/**
 * Text on tinted surfaces — badge, alert and button soft variants.
 *
 * Outside the generator's contract but used by the shadcn components, so a
 * theme without them loses colour on those variants.
 */
export const SUBTLE_LIGHT: Record<string, TokenSource> = {
  '--destructive-subtle': { palette: 'red-700' },
  '--success-subtle': { palette: 'green-700' },
  '--warning-subtle': { palette: 'amber-700' }
};

export const SUBTLE_DARK: Record<string, TokenSource> = {
  '--destructive-subtle': { palette: 'red-400' },
  '--success-subtle': { palette: 'green-400' },
  '--warning-subtle': { palette: 'amber-400' }
};
