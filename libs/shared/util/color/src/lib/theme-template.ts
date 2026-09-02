import type { TailwindColor } from '@codeware/shared/util/tailwind';

import type { ColorShade } from './palette';

/**
 * Where a generated token gets its value.
 *
 * `base` names a step of the theme's neutral family and `brand` a step of its
 * brand family; `palette` is a fixed colour anywhere in the Tailwind palette.
 * All three resolve to literals. `value` is written out verbatim, which covers
 * keywords and `var()` references to tokens declared in the same block.
 *
 * Nothing here holds a raw `oklch(…)` string. Every colour in the committed
 * themes turned out to be a palette entry, so naming it keeps the table
 * readable and makes a mistyped digit impossible.
 */
export type TokenSource =
  | { base: ColorShade }
  | { brand: ColorShade }
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
  // 700, not 600: white text clears 4.5:1 on every family at 700, but fails on
  // nine of them at 600 — yellow, lime and amber worst
  '--primary': { brand: '700' },
  '--primary-foreground': { palette: 'white' },
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
  // Follows the primary, so a focused control is recognisably the brand
  '--ring': { brand: '700' },
  '--sidebar': { base: '50' },
  '--sidebar-foreground': { base: '950' },
  '--sidebar-primary': { brand: '700' },
  '--sidebar-primary-foreground': { palette: 'white' },
  '--sidebar-accent': { base: '100' },
  '--sidebar-accent-foreground': { base: '900' },
  '--sidebar-border': { base: '200' },
  '--sidebar-ring': { brand: '700' }
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
  // 400 over 950 clears 4.5:1 on every family; the light pair is inverted here
  '--primary': { brand: '400' },
  '--primary-foreground': { brand: '950' },
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
  '--ring': { brand: '400' },
  '--sidebar': { base: '900' },
  '--sidebar-foreground': { base: '50' },
  '--sidebar-primary': { brand: '400' },
  '--sidebar-primary-foreground': { brand: '950' },
  '--sidebar-accent': { base: '800' },
  '--sidebar-accent-foreground': { base: '50' },
  '--sidebar-border': { value: 'oklch(1 0 0 / 10%)' },
  '--sidebar-ring': { brand: '400' }
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
  // Prose links and `--core-link` are the same thing to a reader; the committed
  // themes point these at `--primary`, which only agrees while the primary is
  // itself the link colour
  '--links': { value: 'var(--core-link)' },
  '--links-hover': { value: 'var(--core-link)' },
  '--pre-bg': { value: 'var(--secondary)' },
  '--pre-border': { value: 'var(--border)' },
  '--pre-code': { value: 'var(--foreground)' },
  '--quote-borders': { value: 'var(--border)' },
  '--td-borders': { value: 'var(--border)' },
  '--th-borders': { value: 'var(--border)' },
  '--underline': { value: 'var(--core-link)' },
  '--underline-hover': { value: 'var(--core-link)' }
};

/**
 * How the page separates its content column from the shell around it.
 *
 * `flat` paints body, content and footer the same — what `shadcn` and
 * `codeware` do. `layered` sits the content on a lighter card over a tinted
 * body, so the margins and footer read as a frame; that is `spotlight`'s look
 * and the reason it feels less uniform than the others.
 */
export const SURFACE_LIGHT: Record<
  'flat' | 'layered',
  Record<string, TokenSource>
> = {
  flat: {
    '--core-background-body': { value: 'var(--background)' },
    '--core-background-content': { value: 'var(--background)' },
    '--core-content-border': { value: 'var(--border)' }
  },
  layered: {
    '--core-background-body': { base: '50' },
    '--core-background-content': { value: 'var(--background)' },
    '--core-content-border': { base: '100' }
  }
};

/**
 * Dark has to restate these: the light block sets them to a light colour, and
 * `--core-*` cascades rather than being re-derived per scheme.
 */
export const SURFACE_DARK: Record<
  'flat' | 'layered',
  Record<string, TokenSource>
> = {
  flat: {
    '--core-background-body': { value: 'var(--background)' },
    '--core-background-content': { value: 'var(--background)' },
    '--core-content-border': { value: 'var(--border)' }
  },
  layered: {
    // The raised surface in dark is the card, the same relationship inverted
    '--core-background-body': { value: 'var(--background)' },
    '--core-background-content': { value: 'var(--card)' },
    '--core-content-border': { value: 'var(--border)' }
  }
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
