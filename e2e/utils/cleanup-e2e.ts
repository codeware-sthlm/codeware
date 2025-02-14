import { existsSync } from 'fs';
import { platform } from 'os';

import { logInfo, logWarning } from '@codeware/core/utils';
import { cleanup, tmpProjPath } from '@nx/plugin/testing';
import { rimraf } from 'rimraf';

/**
 * Cleans up the e2e test path with retries and extended options for Windows.
 *
 * @param e2ePath - The path to delete (defaults to `tmpProjPath()`)
 * @throws If cleanup fails also after repeated attempts
 */
export const cleanupE2E = async (e2ePath = tmpProjPath()) => {
  try {
    // Nx default cleanup
    cleanup();
  } catch (error) {
    logWarning('Failed to cleanup e2e temp path', (error as Error).message);
    logWarning('Trying evil cleanup with retries...');

    // Try rimraf with retries and extended options
    const status = await rimraf(e2ePath, {
      maxRetries: 5,
      retryDelay: 500,
      // Important for Windows - don't lock the directory
      preserveRoot: platform() === 'win32' ? true : undefined
    });

    if (existsSync(e2ePath)) {
      logWarning(
        `Cleanup returned status ${status}, folder still exist. Contunue anyway...`,
        e2ePath
      );
    } else {
      logInfo('Cleanup successful');
    }
  }
};
