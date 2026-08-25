/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * This script stops the local registry for testing purposes.
 *
 * For e2e it is meant to be called in jest's `globalTeardown`.
 */

import { restorePackageJsonFiles } from './package-json-backup';

module.exports = () => {
  restorePackageJsonFiles();

  if (!(global as any).stopLocalRegistry) {
    console.log('Local registry is not started');
    return;
  }

  try {
    // Nx's own cleanup closure (from `@nx/js/plugins/jest/local-registry`)
    // already deletes the npm auth token for whichever port it actually
    // used - it can differ from the requested one if that port was busy.
    (global as any).stopLocalRegistry();
    console.log('Killed local registry process');
  } catch (error) {
    console.warn('Failed to stop and clean up local registry config:', error);
  }
};
