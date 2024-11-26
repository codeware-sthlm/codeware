import { useRouteLoaderData } from '@remix-run/react';
import invariant from 'tiny-invariant';

import { type loader as rootLoader } from '../root';

/**
 * @returns the pages from the root loader
 */
export function usePages() {
  const data = useRouteLoaderData<typeof rootLoader>('root');
  invariant(data?.pages, 'No pages found in root loader');

  return data.pages;
}
