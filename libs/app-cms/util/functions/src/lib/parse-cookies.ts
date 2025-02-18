/**
 * Parse cookies from the request headers.
 *
 * @param header - The request headers.
 * @returns The parsed cookies.
 */
export const parseCookies = (header: Headers) => {
  const cookies = header
    .get('cookie')
    ?.split(';')
    .reduce(
      (acc, cookie) => {
        const [key, value] = cookie.split('=').map((c) => c.trim());
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string>
    );

  return cookies ?? {};
};
