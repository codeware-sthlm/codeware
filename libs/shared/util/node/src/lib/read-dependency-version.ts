import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { cwd } from 'process';

import { type VersionParts, extractVersion } from '@codeware/shared/util/pure';

type ReadDependencyVersionOptions = {
  /**
   * Directory that contains the `package.json` to read.
   *
   * @default process.cwd()
   */
  cwd?: string;
};

/**
 * Read a dependency's declared version from a `package.json` on disk.
 *
 * Locates `package.json` in the current working directory (override with `cwd` option)
 * and returns the dependency version together with its extracted parts.
 *
 * Prefers `devDependencies` over `dependencies`.
 *
 * @param packageName - Name of the dependency to look up.
 * @param options - Read options.
 * @returns The version details, or `undefined` when the `package.json` or the dependency is absent.
 * @throws When the `package.json` is malformed.
 */
export const readDependencyVersion = (
  packageName: string,
  options?: ReadDependencyVersionOptions
): VersionParts | undefined => {
  const packageJsonPath = join(options?.cwd ?? cwd(), 'package.json');
  if (!existsSync(packageJsonPath)) {
    return undefined;
  }

  const { dependencies, devDependencies } = JSON.parse(
    readFileSync(packageJsonPath, 'utf-8')
  );
  const version = devDependencies?.[packageName] ?? dependencies?.[packageName];

  return version === undefined ? undefined : extractVersion(version);
};
