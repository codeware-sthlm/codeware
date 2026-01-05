import { existsSync, writeFileSync } from 'fs';

import { logWarning } from '@codeware/core/utils';
import type { PackageManager } from '@nx/devkit';
import { tmpProjPath, updateFile } from '@nx/plugin/testing';

/**
 * Ensure npm install use legacy peer dependencies.
 *
 * Creates or updates the `.npmrc` file in the temporary project
 * to include the `legacy-peer-deps=true` setting.
 *
 * **Only applies to `npm` package manager.**
 *
 * @param packageManager Package manager
 */
export const ensureLegacyPeerDeps = (packageManager: PackageManager): void => {
  if (packageManager !== 'npm') {
    return;
  }

  // Ensure `.npmrc` exists
  const npmrcFile = `${tmpProjPath()}/.npmrc`;
  if (!existsSync(npmrcFile)) {
    writeFileSync(npmrcFile, '');
  }

  updateFile(
    '.npmrc',
    (content) => `${content}
legacy-peer-deps=true
`
  );

  logWarning(
    'Enabled npm legacy-peer-deps (remove when not required anymore)',
    npmrcFile
  );
};
