import { type Tree, addDependenciesToPackageJson } from '@nx/devkit';

import {
  graphqlVersion,
  payloadVersion,
  testingLibraryDomVersion,
  testingLibraryJestDomVersion,
  testingLibraryReactVersion
} from '../../../utils/versions';

/**
 * Add required Payload dependencies to workspace `package.json`.
 *
 * @link https://github.com/payloadcms/payload/tree/main/packages
 */
export function updateDependencies(tree: Tree) {
  //ensureNxDependencies();

  return addDependenciesToPackageJson(
    tree,
    {
      '@payloadcms/db-mongodb': payloadVersion,
      '@payloadcms/db-postgres': payloadVersion,
      '@payloadcms/next': payloadVersion,
      '@payloadcms/richtext-lexical': payloadVersion,
      payload: payloadVersion,
      graphql: graphqlVersion
    },
    {
      '@payloadcms/graphql': payloadVersion,
      '@testing-library/dom': testingLibraryDomVersion,
      '@testing-library/jest-dom': testingLibraryJestDomVersion,
      '@testing-library/react': testingLibraryReactVersion
    }
  );
}
