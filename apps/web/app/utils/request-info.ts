import { useRouteLoaderData } from '@remix-run/react';
import invariant from 'tiny-invariant';

import { type loader as rootLoader } from '../root';

/**
 * @returns the request info from the root loader
 */
export function useRequestInfo() {
  const data = useRouteLoaderData<typeof rootLoader>('root');

  if (!data?.requestInfo) {
    console.error('No request info found in root loader');
    return null;
  }

  return data.requestInfo;
}
