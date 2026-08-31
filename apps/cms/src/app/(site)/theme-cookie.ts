/**
 * Where the visitor's theme choice is kept.
 *
 * A cookie rather than `localStorage` so the server can render the right theme
 * on first paint — reading it on the client would flash the default first.
 *
 * Owner-prefixed kebab-case, matching `cdwr-color-scheme` in apps/web and
 * Payload's own `payload-token` / `payload-tenant`.
 */
export const THEME_COOKIE = 'cdwr-theme';

/** One year, matching the color scheme cookie in apps/web. */
export const THEME_COOKIE_MAX_AGE = 31536000;
