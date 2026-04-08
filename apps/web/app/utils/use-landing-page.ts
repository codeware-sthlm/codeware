import { Page } from '@codeware/shared/util/payload-types';
import { useRouteLoaderData } from '@remix-run/react';
import invariant from 'tiny-invariant';

import { type loader as rootLoader } from '../root';

/**
 * @returns the landing page from the root loader
 */
export function useLandingPage() {
  const data = useRouteLoaderData<typeof rootLoader>('root');
  invariant(data, 'No data found in root loader');

  const landingPage = data.landingPage as Page | null;

  invariant(
    typeof landingPage === 'object',
    'Expected landing page to be an object'
  );

  return landingPage;
}
