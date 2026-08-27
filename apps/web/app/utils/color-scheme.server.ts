import { createCookie } from '@remix-run/node';

export type ColorScheme = 'light' | 'dark';

// Owner-prefixed kebab-case, matching the `payload-*` cookies already in play.
const cookieName = 'cdwr-color-scheme';

const cookie = createCookie(cookieName);

/**
 * Get the color scheme from the 'cdwr-color-scheme' cookie if present.
 *
 * Without the cookie there is no explicit user choice, so the caller falls
 * back to the client hint (the OS preference) and ultimately to light.
 *
 * @param request The incoming request
 *
 * @returns The user selected color scheme or null if it is not set
 */
export async function getColorScheme(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  const parsed: ColorScheme | null = cookieHeader
    ? await cookie.parse(cookieHeader)
    : null;
  if (parsed === 'light' || parsed === 'dark') {
    return parsed;
  }

  return null;
}

/**
 * Set the color scheme cookie with the given value.
 *
 * @param colorScheme The color scheme to set
 *
 * @returns The serialized cookie header
 */
export async function setColorScheme(colorScheme: ColorScheme | 'system') {
  if (colorScheme === 'system') {
    // Set the new max age to -1, which will remove the cookie and
    // default to using the client hint value.
    return await cookie.serialize('', { path: '/', maxAge: -1 });
  } else {
    // Set the new max age to one year.
    return await cookie.serialize(colorScheme, {
      path: '/',
      maxAge: 31536000
    });
  }
}
