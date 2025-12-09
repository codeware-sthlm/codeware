/**
 * Custom implementation to start a local Verdaccio registry for e2e testing.
 *
 * ## Why This Custom Implementation?
 *
 * After migrating to Nx 22, the built-in `startLocalRegistry` helper from
 * `@nx/js/plugins/jest/local-registry` stopped working correctly. The forked
 * Nx process that was supposed to keep Verdaccio running would exit immediately
 * with code 0, causing the registry to never actually start.
 *
 * ## The Problem
 *
 * The Nx helper uses `fork()` to spawn an Nx CLI process that runs the verdaccio
 * executor. In Nx 22, this process exits immediately instead of remaining alive
 * to keep Verdaccio running. The exit handler in the Nx code would then resolve
 * with an empty cleanup function, leaving no running registry.
 *
 * ## The Solution
 *
 * This custom implementation:
 * 1. Directly forks the Verdaccio binary (bypassing the Nx CLI layer)
 * 2. Actively polls the registry endpoint until it responds successfully
 * 3. Configures all package managers (npm, yarn, bun) to use the local registry
 * 4. Returns a proper cleanup function that kills the Verdaccio process
 *
 * This approach ensures the registry stays alive throughout the test execution
 * and is properly cleaned up during teardown.
 *
 * @see https://github.com/nrwl/nx/issues - Related to Nx 22 migration
 */

import { ChildProcess, execSync, fork } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';

export interface StartLocalRegistryOptions {
  /** Storage path for the registry (relative to workspace root) */
  storage: string;

  /** Port number for the registry to listen on */
  port: number;

  /** Listen address (localhost for CI, 0.0.0.0 for local development) */
  listenAddress: string;

  /** Enable verbose logging */
  verbose: boolean;
}

/**
 * Starts a local Verdaccio registry for e2e testing.
 *
 * @param options - Configuration options for the registry
 * @returns Promise that resolves to a cleanup function to stop the registry
 *
 * @example
 * ```typescript
 * const stopRegistry = await startCustomLocalRegistry({
 *   storage: './tmp/local-registry/storage',
 *   port: 4873,
 *   listenAddress: '0.0.0.0',
 *   verbose: false
 * });
 *
 * // Later, in teardown:
 * stopRegistry();
 * ```
 */
export async function startCustomLocalRegistry(
  options: StartLocalRegistryOptions
): Promise<() => void> {
  const { storage, port, listenAddress, verbose } = options;

  // Clear storage if it exists
  const storagePath = join(process.cwd(), storage);
  if (existsSync(storagePath)) {
    rmSync(storagePath, { recursive: true, force: true });
    if (verbose) {
      console.log(`Cleared storage: ${storagePath}`);
    }
  }

  return new Promise((resolve, reject) => {
    // Start verdaccio directly
    const verdaccioPath = require.resolve('verdaccio/bin/verdaccio');
    const configPath = join(process.cwd(), '.verdaccio/config.yml');

    const childProcess: ChildProcess = fork(
      verdaccioPath,
      ['--config', configPath, '--listen', `${listenAddress}:${port}`],
      {
        env: {
          ...process.env,
          VERDACCIO_HANDLE_KILL_SIGNALS: 'true',
          VERDACCIO_STORAGE_PATH: storagePath
        },
        stdio: verbose ? 'inherit' : 'pipe'
      }
    );

    let resolved = false;

    // Poll the registry endpoint until it's ready
    const checkRegistry = setInterval(async () => {
      try {
        const registry = `http://${listenAddress}:${port}`;
        const response = await fetch(registry);
        if (response.ok && !resolved) {
          resolved = true;
          clearInterval(checkRegistry);

          console.log(`Local registry started on ${registry}`);

          // Configure npm registry
          const authToken = 'secretVerdaccioToken';
          process.env.npm_config_registry = registry;
          execSync(
            `npm config set //${listenAddress}:${port}/:_authToken "${authToken}" --location user`,
            { windowsHide: false }
          );

          // Configure bun
          process.env.BUN_CONFIG_REGISTRY = registry;
          process.env.BUN_CONFIG_TOKEN = authToken;

          // Configure yarn v1
          process.env.YARN_REGISTRY = registry;

          // Configure yarn v2+
          process.env.YARN_NPM_REGISTRY_SERVER = registry;
          process.env.YARN_UNSAFE_HTTP_WHITELIST = listenAddress;

          console.log('Set npm, bun, and yarn config registry to ' + registry);

          // Return cleanup function
          resolve(() => {
            if (childProcess && !childProcess.killed) {
              childProcess.kill('SIGTERM');
            }
            try {
              execSync(
                `npm config delete //${listenAddress}:${port}/:_authToken --location user`,
                { windowsHide: false }
              );
            } catch {
              // Ignore cleanup errors
            }
          });
        }
      } catch {
        // Registry not ready yet, keep checking
      }
    }, 250);

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!resolved) {
        clearInterval(checkRegistry);
        if (childProcess && !childProcess.killed) {
          childProcess.kill('SIGTERM');
        }
        reject(new Error('Local registry failed to start within 30 seconds'));
      }
    }, 30000);

    childProcess.on('error', (err) => {
      if (!resolved) {
        clearInterval(checkRegistry);
        reject(err);
      }
    });

    childProcess.on('exit', (code) => {
      if (!resolved && code !== 0) {
        clearInterval(checkRegistry);
        reject(new Error(`Verdaccio exited with code ${code}`));
      }
    });
  });
}
