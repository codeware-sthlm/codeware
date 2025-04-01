import { useRouteLoaderData } from '@remix-run/react';
import invariant from 'tiny-invariant';

import { type loader as rootLoader } from '../root';

/**
 * @returns the site settings from the root loader
 */
export function useSiteSettings() {
  const data = useRouteLoaderData<typeof rootLoader>('root');
  invariant(data?.siteSettings, 'No site settings found in root loader');
  const {
    general: { landingPage }
  } = data.siteSettings;
  invariant(
    typeof landingPage !== 'number',
    'No landing page found in site settings'
  );

  return {
    landingPage
  };
}
