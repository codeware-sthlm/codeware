import { createCookie } from '@remix-run/node';

export type Theme = 'light' | 'dark';

const cookieName = 'en_theme';

const cookie = createCookie(cookieName);

/**
 * Get the theme from the 'en_theme' cookie if present.
 *
 * @param request The incoming request
 *
 * @returns The user selected theme or null if the theme is not set
 */
export async function getTheme(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  const parsed: Theme | null = cookieHeader
    ? await cookie.parse(cookieHeader)
    : 'light';
  if (parsed === 'light' || parsed === 'dark') {
    return parsed;
  }

  return null;
}

/**
 * Set the theme cookie with the given theme.
 *
 * @param theme The theme to set
 *
 * @returns The serialized cookie header
 */
export async function setTheme(theme: Theme | 'system') {
  if (theme === 'system') {
    // Set the new max age to -1, which will remove the cookie and
    // default to using the client hint value.
    return await cookie.serialize('', { path: '/', maxAge: -1 });
  } else {
    // Set the new max age to one year.
    return await cookie.serialize(theme, { path: '/', maxAge: 31536000 });
  }
}
