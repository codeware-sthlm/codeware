/**
 * Pick the theme a site renders.
 *
 * Neither the visitor's choice nor the tenant's configured default wins unless
 * the site still offers it — either can name a theme that was deselected long
 * afterwards, and an unoffered value puts a `data-theme` on the page matching
 * no CSS scope, leaving it with no tokens at all.
 *
 * Shared by both clients so the rule cannot drift between them.
 *
 * @param cookieValue - The theme the visitor chose, if any.
 * @param themes - The themes the site currently offers.
 * @param defaultTheme - The tenant's configured default.
 * @returns The theme to put on `data-theme`.
 */
export function resolveTheme(
  cookieValue: string | null | undefined,
  themes: Array<string>,
  defaultTheme: string
): string {
  if (cookieValue && themes.includes(cookieValue)) {
    return cookieValue;
  }
  if (themes.includes(defaultTheme)) {
    return defaultTheme;
  }

  // Nothing offered at all leaves the default as the only candidate
  return themes[0] ?? defaultTheme;
}
