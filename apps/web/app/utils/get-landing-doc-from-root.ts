import type { LandingDoc } from '@codeware/shared/util/payload-utils';
import type { MetaFunction } from '@remix-run/react';

/**
 * Server side utility to get the landing document from the root loader data.
 *
 * @param matches - The `matches` object from the root loader.
 * @returns The landing document or `null` if not found.
 */
export const getLandingDocFromRoot = (
  matches: Parameters<MetaFunction>[0]['matches']
) => {
  const rootData = matches.find((match) => match.id === 'root')?.data as
    | Record<'landingDoc', LandingDoc | null>
    | undefined;

  return rootData?.landingDoc ?? null;
};
