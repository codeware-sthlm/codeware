import { type Tree, addDependenciesToPackageJson, readJson } from '@nx/devkit';
import {
  PackageJson,
  getDependencyVersionFromPackageJson
} from 'nx/src/utils/package-json';

import {
  graphqlVersion,
  next15Version,
  payloadCommonJSVersion,
  payloadESMVersion
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

  const version =
    readJson<PackageJson>(tree, 'package.json').type === 'module'
      ? payloadESMVersion
      : payloadCommonJSVersion;

  return addDependenciesToPackageJson(
    tree,
    {
      '@payloadcms/db-mongodb': version,
      '@payloadcms/db-postgres': version,
      '@payloadcms/next': version,
      '@payloadcms/richtext-lexical': version,
      ...nextDep,
      payload: version,
      graphql: graphqlVersion
    },
    {
      '@payloadcms/graphql': version
    }
  );
}
