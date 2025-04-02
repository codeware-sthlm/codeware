import { useRouteLoaderData } from '@remix-run/react';
import invariant from 'tiny-invariant';

import { type loader as rootLoader } from '../root';

/**
 * @returns the site settings from the root loader
 */
export function useSiteSettings() {
  const data = useRouteLoaderData<typeof rootLoader>('root');
  invariant(data, 'No data found in root loader');

  // Don't break the site when site settings haven't been configured yet.
  // Provide some useful information to the visitor.
  // TODO: Let the cms handle this with client render components?

  const landingPage = data.siteSettings?.general?.landingPage ?? undefined;

  // TODO: Type narrowing should be handled by the cms api
  invariant(
    typeof landingPage !== 'number',
    'Expected landing page to be an object'
  );

  return {
    landingPage
  };
}
