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

  // A tenant may have no landing page, and a loader failure leaves it null —
  // RenderLandingPage renders its own message for that
  return (data.landingDoc as LandingDoc | null) ?? null;
}
