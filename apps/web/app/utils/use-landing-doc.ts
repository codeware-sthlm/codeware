import type { LandingDoc } from '@codeware/shared/util/payload-utils';
import { useRouteLoaderData } from '@remix-run/react';
import invariant from 'tiny-invariant';

import { type loader as rootLoader } from '../root';

/**
 * @returns the landing document from the root loader
 */
export function useLandingDoc() {
  const data = useRouteLoaderData<typeof rootLoader>('root');
  invariant(data, 'No data found in root loader');

  const landingDoc = data.landingDoc as LandingDoc | null;

  invariant(
    typeof landingDoc === 'object',
    'Expected landing document to be an object'
  );

  return landingDoc;
}
