import type { Page } from '@codeware/shared/util/payload-types';
import type { MetaFunction } from '@remix-run/react';

/**
 * Server side utility to get the landing page from the root loader data.
 *
 * @param matches - The `matches` object from the root loader.
 * @returns The landing page or `null` if not found.
 */
export const getLandingPageFromRoot = (
  matches: Parameters<MetaFunction>[0]['matches']
) => {
  const rootData = matches.find((match) => match.id === 'root')?.data as
    | Record<'landingPage', Page>
    | undefined;

  return rootData?.landingPage ?? null;
};
