import { useRouteLoaderData } from '@remix-run/react';
import invariant from 'tiny-invariant';

import { type loader as rootLoader } from '../root';

/**
 * @returns the navigation tree from the root loader
 */
export function useNavigationTree() {
  const data = useRouteLoaderData<typeof rootLoader>('root');
  invariant(data?.navigationTree, 'No navigation tree found in root loader');

  return data.navigationTree;
}
