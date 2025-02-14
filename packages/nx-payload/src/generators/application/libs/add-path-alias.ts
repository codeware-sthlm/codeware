import { type Tree, readJson } from '@nx/devkit';
import { addTsConfigPath } from '@nx/js';

import type { NormalizedSchema } from './normalize-options';

/**
 * Add `'@payload-config'` as a path alias to the Payload config file
 * when the path is not already added.
 *
 * It's required to follow Payload design pattern in `src/app` files.
 */
export function addPathAlias(tree: Tree, options: NormalizedSchema): void {
  const tsConfig = readJson(tree, 'tsconfig.base.json');
  if ('@payload-config' in (tsConfig?.compilerOptions?.paths ?? {})) {
    return;
  }

  addTsConfigPath(tree, '@payload-config', [
    `${options.directory}/src/payload.config.ts`
  ]);
}
