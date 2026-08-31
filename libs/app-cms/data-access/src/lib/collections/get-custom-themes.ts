import type { CustomThemeConfig } from '@codeware/shared/util/payload-types';

import type { PayloadRuntime } from '../payload-runtime.types';

/** Payload types a `json` field as anything JSON can hold. */
const asTokens = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

/**
 * Fetch the authored themes a site offers.
 *
 * Unlike the built-in themes, these are not in the CSS bundle — the site has to
 * inject their tokens, so the token maps travel with the name.
 *
 * Scoped to the ids selected in site settings rather than everything the tenant
 * has written: an unfinished theme should not reach a visitor. Access control
 * scopes it to the tenant on top of that.
 *
 * @param runtime - Authenticated Payload runtime instance
 * @param ids - The themes selected in site settings
 * @returns The selected themes, or an empty array when none are selected
 */
export async function getCustomThemes(
  runtime: PayloadRuntime,
  ids: Array<number>
): Promise<Array<CustomThemeConfig>> {
  if (!ids.length) {
    return [];
  }

  const { payload } = runtime;
  const overrideAccess = payload.authenticatedUser === null;

  const result = await payload.find({
    collection: 'custom-themes',
    depth: 0,
    // Every selected theme, not a page of them: a missing one leaves the site
    // offering a theme it cannot render
    limit: 0,
    where: { id: { in: ids } },
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
