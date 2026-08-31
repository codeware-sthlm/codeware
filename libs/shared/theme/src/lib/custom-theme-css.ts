/**
 * A tenant-authored theme, as it reaches the stylesheet.
 *
 * Structural rather than the generated Payload type, so this stays a leaf that
 * both the site layout and the studio can use.
 */
export type CustomThemeInput = {
  /** The `data-theme` value */
  slug: string;
  tokensLight: Record<string, unknown>;
  tokensDark: Record<string, unknown>;
};

/** Same shape the built-in themes are generated with: `--core-link`, `--brand-50`. */
const TOKEN_NAME = /^--[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Everything a colour, length or alias needs and nothing more.
 *
 * Covers `oklch(0.7 0.14 182)`, `#fff`, `var(--brand-600)`,
 * `calc(var(--radius) - 0.125rem)` and `color-mix(in oklab, …)`. Notably
 * absent: `;` `{` `}` (which would end the declaration or the block early),
 * `<` `>` `&` (which would leave CSS altogether), `@` (`@import`), `!`
 * (`!important`) and `:` (`url(data:…)`).
 */
const TOKEN_VALUE = /^[a-zA-Z0-9\s.,%#()/_-]+$/;

/** A theme name goes straight into a selector, so it gets the same treatment. */
const THEME_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * A theme called `light` or `dark` is indistinguishable from the colour scheme
 * once it is on `data-theme`. `theme-sync` forbids it for the built-ins; the
 * same rule has to hold for authored ones.
 */
const RESERVED_SLUGS = ['light', 'dark'];

/** Long enough for any real value, short enough that nothing can be smuggled. */
const MAX_VALUE_LENGTH = 120;

/** Whether a token name may be written into a theme block. */
export const isValidTokenName = (name: string): boolean =>
  TOKEN_NAME.test(name);

/** Whether a token value may be written into a theme block. */
export const isValidTokenValue = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length > 0 &&
  value.length <= MAX_VALUE_LENGTH &&
  TOKEN_VALUE.test(value);

/** Whether a theme name may be used as a `data-theme` value. */
export const isValidThemeSlug = (slug: string): boolean =>
  THEME_SLUG.test(slug) && !RESERVED_SLUGS.includes(slug);

/**
 * Serialise a token map into declarations, dropping whatever fails the
 * whitelist above.
 *
 * Exported so anything else putting these tokens into a stylesheet — the studio
 * scopes them to a preview container rather than an attribute — applies the
 * same rules rather than a second copy of them.
 */
export function themeDeclarations(tokens: Record<string, unknown>): string {
  return Object.entries(tokens)
    .filter(
      ([name, value]) => isValidTokenName(name) && isValidTokenValue(value)
    )
    .map(([name, value]) => `${name}:${value as string}`)
    .join(';');
}

/**
 * Serialise tenant-authored themes into a stylesheet the site layout injects.
 *
 * Token names and values come from the database, so nothing is escaped on the
 * way out — it is whitelisted on the way in, and anything that fails is
 * dropped. Only the braces, colons and semicolons written here are structural.
 * That leaves a string free of `<`, `>` and `&`, which is what makes it safe as
 * a plain text child of `<style>` rather than raw HTML.
 *
 * Dark is scoped `[data-theme='x'].dark`, never `[data-theme=dark]`: once the
 * attribute carries the theme name, the attribute strategy can never match.
 *
 * @param themes - The themes this site offers, in any order.
 * @returns CSS text, or an empty string when there is nothing to inject.
 */
export function customThemeCss(themes: Array<CustomThemeInput>): string {
  return themes
    .filter(({ slug }) => isValidThemeSlug(slug))
    .flatMap(({ slug, tokensLight, tokensDark }) => {
      const light = themeDeclarations(tokensLight ?? {});
      const dark = themeDeclarations(tokensDark ?? {});

      // A theme with no light tokens has no base to cascade from, so a dark
      // block on its own would leave the light scheme unthemed
      if (!light) {
        return [];
      }

      const blocks = [`[data-theme='${slug}']{${light}}`];
      if (dark) {
        blocks.push(`[data-theme='${slug}'].dark{${dark}}`);
      }
      return blocks;
    })
    .join('\n');
}
