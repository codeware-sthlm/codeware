import { type Tree, addDependenciesToPackageJson } from '@nx/devkit';
import { getDependencyVersionFromPackageJson } from 'nx/src/utils/package-json';

import {
  graphqlVersion,
  next15Version,
  payloadVersion,
  testingLibraryDomVersion,
  testingLibraryJestDomVersion,
  testingLibraryReactVersion
} from '../../../utils/versions';

/**
 * Add required Payload dependencies to workspace `package.json`.
 *
 * Add Next v15 as dependency when not already installed.
 *
 * @link https://github.com/payloadcms/payload/tree/main/packages
 */
export function updateDependencies(tree: Tree) {
  // Prefer Next.js v15 when not already installed
  let nextDep = {};
  if (getDependencyVersionFromPackageJson(tree, 'next') === null) {
    nextDep = { next: next15Version };
  }

  return addDependenciesToPackageJson(
    tree,
    {
      '@payloadcms/db-mongodb': payloadVersion,
      '@payloadcms/db-postgres': payloadVersion,
      '@payloadcms/next': payloadVersion,
      '@payloadcms/richtext-lexical': payloadVersion,
      ...nextDep,
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
