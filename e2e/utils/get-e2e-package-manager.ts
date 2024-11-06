import { logDebug, logWarning } from '@codeware/core';
import {
  type PackageManager,
  detectPackageManager,
  getPackageManagerCommand
} from '@nx/devkit';

/**
 * Get package manager from `CDWR_E2E_PACKAGE_MANAGER` or fallback to the current workspace
 *
 * @returns Package manager
 */
export function getE2EPackageManager(): PackageManager {
  let pm = process.env['CDWR_E2E_PACKAGE_MANAGER'] as PackageManager;

  if (!pm) {
    return detectPackageManager();
  }

  if (pm === 'bun') {
    logWarning(
      `'${pm}' is not supported, fallback to workspace package manager`
    );
    return detectPackageManager();
  }

  try {
    // Verify a valid package manager and fallback to workspace
    getPackageManagerCommand(pm);
  } catch (error) {
    logDebug('getPackageManagerCommand()', String(error));
    logWarning(`'${pm}' is not valid, fallback to workspace package manager`);
    pm = detectPackageManager();
  }

  return pm;
}
