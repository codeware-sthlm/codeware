import { type Tree, addDependenciesToPackageJson } from '@nx/devkit';

import { anthropicSdkVersion } from '../../../utils/versions';

/**
 * Add `@anthropic-ai/sdk` as a dev dependency to the workspace `package.json`.
 *
 * Installed as devDependency because it is only needed at runtime by the
 * analyze executor, not bundled into any application output.
 */
export function updateDependencies(tree: Tree) {
  return addDependenciesToPackageJson(
    tree,
    {},
    {
      '@anthropic-ai/sdk': anthropicSdkVersion
    }
  );
}
