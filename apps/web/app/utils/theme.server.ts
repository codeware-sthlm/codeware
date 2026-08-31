import { createCookie } from '@remix-run/node';

/**
 * Where the visitor's theme choice is kept.
 *
 * A cookie rather than `localStorage` so the server can render the right theme
 * on first paint — reading it on the client would flash the default first.
 *
 * Owner-prefixed kebab-case, matching `cdwr-color-scheme` and the name
 * `apps/cms` already uses for the same choice.
 */
const cookieName = 'cdwr-theme';

const cookie = createCookie(cookieName);

/**
 * Get the theme from the 'cdwr-theme' cookie if present.
 *
 * @param request The incoming request
 *
 * @returns The visitor's chosen theme or null if it is not set
 */
export async function getTheme(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  const parsed: string | null = cookieHeader
    ? await cookie.parse(cookieHeader)
    : null;

  return typeof parsed === 'string' && parsed ? parsed : null;
}

/**
 * Set the theme cookie with the given value.
 *
 * @param theme The theme to set
 *
 * @returns The serialized cookie header
 */
export async function setTheme(theme: string) {
  // One year, matching the color scheme cookie.
  return await cookie.serialize(theme, { path: '/', maxAge: 31536000 });
}

/**
 * Pick the theme to render.
 *
 * Neither the cookie nor the configured default wins unless the site still
 * offers it — either can name a theme that was deselected later, and an
 * unoffered value puts a `data-theme` on the page that matches no CSS scope,
 * leaving it with no tokens at all.
 *
 * @param cookieValue The theme from the cookie, if any
 * @param themes The themes the site currently offers, never empty
 * @param defaultTheme The tenant's configured default
 *
 * @returns The theme to put on `data-theme`
 */
export function resolveTheme(
  cookieValue: string | null | undefined,
  themes: Array<string>,
  defaultTheme: string
): string {
  if (cookieValue && themes.includes(cookieValue)) {
    return cookieValue;
  }

  return themes.includes(defaultTheme) ? defaultTheme : themes[0];
}
