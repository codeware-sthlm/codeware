import { type Tree, readJson, updateJson } from '@nx/devkit';
import type { PackageJson } from 'nx/src/utils/package-json';

import { extractVersion } from '../../../utils/extract-version';

import type { NormalizedSchema } from './normalize-options';

/**
 * Read the major version of the `typescript` dependency declared in the
 * workspace `package.json`, or `undefined` when it cannot be determined.
 *
 * Runs after the Nx Next app generator has added `typescript`, so the pin is
 * present at this point. The pin is a range (e.g. `~5.9.0`, `^6.0.0`), so the
 * leading number is the major it installs.
 */
function getTypeScriptMajor(tree: Tree): number | undefined {
  const { dependencies, devDependencies } = readJson<PackageJson>(
    tree,
    'package.json'
  );
  const version = devDependencies?.typescript ?? dependencies?.typescript;
  return version === undefined ? undefined : extractVersion(version).major;
}

/**
 * Add `'@payload-config'` as a path alias to the Payload config file
 * when the path is not already added.
 *
 * It's required to follow Payload design pattern in `src/app` files.
 *
 * TypeScript 5 keeps the conventional `baseUrl`-relative, unprefixed alias -
 * `baseUrl` is required so both webpack's TsConfigPathsPlugin and get-tsconfig
 * (used by tsx/Payload CLI) resolve the target without a leading `./`.
 *
 * TypeScript 6 deprecates `baseUrl`, so the alias is stored with an explicit
 * leading `./` and no `baseUrl` instead. This is required because:
 * - get-tsconfig rejects non-relative targets when `baseUrl` is absent, so the
 *   `./` keeps CLI resolution working.
 * - Next.js rewrites path aliases when it strips the deprecated `baseUrl` on
 *   TypeScript 6, and a `./`-prefixed target is left untouched — an unprefixed
 *   one gets a wrong relative offset when the alias lives in a root
 *   `tsconfig.base.json` consumed by an app in a subdirectory, breaking
 *   `next build` type checking.
 *
 * When the TypeScript version cannot be determined the safer TypeScript 6
 * layout is used, since the plugin defaults to Next 16 and the `./` form also
 * resolves correctly on TypeScript 5.
 */
export function addPathAlias(tree: Tree, options: NormalizedSchema): void {
  const tsConfig = readJson(tree, 'tsconfig.base.json');
  if ('@payload-config' in (tsConfig?.compilerOptions?.paths ?? {})) {
    return;
  }

  const tsMajor = getTypeScriptMajor(tree);
  const isTs5 = tsMajor !== undefined && tsMajor < 6;

  updateJson(tree, 'tsconfig.base.json', (json) => {
    json.compilerOptions ??= {};
    json.compilerOptions.paths ??= {};

    if (isTs5) {
      json.compilerOptions.baseUrl ??= '.';
      json.compilerOptions.paths['@payload-config'] = [
        `${options.directory}/src/payload.config.ts`
      ];
    } else {
      json.compilerOptions.paths['@payload-config'] = [
        `./${options.directory}/src/payload.config.ts`
      ];
    }

    return json;
  });
}
