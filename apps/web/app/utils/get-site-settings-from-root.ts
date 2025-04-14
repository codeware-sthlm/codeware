import type { SiteSetting } from '@codeware/shared/util/payload-types';
import type { MetaFunction } from '@remix-run/react';

/**
 * Server side utility to get the site settings from the root loader data.
 *
 * @param matches - The `matches` object from the root loader.
 * @returns The site settings or `null` if not found.
 */
export const getSiteSettingsFromRoot = (
  matches: Parameters<MetaFunction>[0]['matches']
) => {
  const rootData = matches.find((match) => match.id === 'root')?.data as
    | Record<'siteSettings', SiteSetting>
    | undefined;

  return rootData?.siteSettings ?? null;
};
