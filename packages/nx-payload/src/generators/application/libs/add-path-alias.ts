import { type Tree, readJson, updateJson } from '@nx/devkit';

import type { NormalizedSchema } from './normalize-options';

/**
 * Add `'@payload-config'` as a path alias to the Payload config file
 * when the path is not already added.
 *
 * It's required to follow Payload design pattern in `src/app` files.
 *
 * Also ensures `baseUrl` is set — required so that both webpack's
 * TsConfigPathsPlugin and get-tsconfig (used by tsx/Payload CLI) can resolve
 * the path correctly without a leading `./`.
 */
export function addPathAlias(tree: Tree, options: NormalizedSchema): void {
  const tsConfig = readJson(tree, 'tsconfig.base.json');
  if ('@payload-config' in (tsConfig?.compilerOptions?.paths ?? {})) {
    return;
  }

  updateJson(tree, 'tsconfig.base.json', (json) => {
    json.compilerOptions ??= {};
    json.compilerOptions.baseUrl ??= '.';
    json.compilerOptions.paths ??= {};
    json.compilerOptions.paths['@payload-config'] = [
      `${options.directory}/src/payload.config.ts`
    ];
    return json;
  });
}
