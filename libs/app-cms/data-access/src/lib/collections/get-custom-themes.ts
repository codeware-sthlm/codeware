import type { CustomThemeConfig } from '@codeware/shared/util/payload-types';

import type { PayloadRuntime } from '../payload-runtime.types';

/** Payload types a `json` field as anything JSON can hold. */
const asTokens = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

/**
 * Fetch the themes this tenant authored.
 *
 * Unlike the built-in themes, these are not in the CSS bundle — the site has to
 * inject their tokens, so the token maps travel with the name.
 *
 * Access control scopes the result to the tenant, so a theme never leaks into
 * another tenant's stylesheet.
 *
 * @param runtime - Authenticated Payload runtime instance
 * @returns The tenant's themes, or an empty array when there are none
 */
export async function getCustomThemes(
  runtime: PayloadRuntime
): Promise<Array<CustomThemeConfig>> {
  const { payload } = runtime;
  const overrideAccess = payload.authenticatedUser === null;

  const result = await payload.find({
    collection: 'custom-themes',
    depth: 0,
    // Every theme, not a page of them: a missing one renders an unthemed site
    limit: 0,
    overrideAccess,
    user: payload.authenticatedUser,
    disableErrors: true
  });

  return result.docs.map(({ slug, name, tokensLight, tokensDark }) => ({
    slug,
    name,
    tokensLight: asTokens(tokensLight),
    tokensDark: asTokens(tokensDark)
  }));
}
