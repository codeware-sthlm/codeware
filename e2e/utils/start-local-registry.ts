/**
 * This script starts a local registry for testing purposes.
 *
 * For e2e it is meant to be called in jest's `globalSetup`.
 */

import { registerTsProject } from '@nx/js/src/internal';
import { releasePublish, releaseVersion } from 'nx/release';

import { isCI } from './is-ci';
import { startCustomLocalRegistry } from './start-custom-local-registry';

module.exports = async () => {
  registerTsProject('./tsconfig.base.json');
  const verbose = process.env['NX_VERBOSE_LOGGING'] === 'true';

  // Listen address depending on run environment.
  const listenAddress = isCI() ? 'localhost' : '0.0.0.0';
  const port = 4873;

  console.log(
    `\nStart local registry with listen address '${listenAddress}' (CI=${isCI()})`
  );

  // storage folder for the local registry
  const storage = './tmp/local-registry/storage';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).stopLocalRegistry = await startCustomLocalRegistry({
    storage,
    port,
    listenAddress,
    verbose
  });

  await releaseVersion({
    specifier: `0.0.${Date.now()}-e2e`,
    stageChanges: false,
    gitCommit: false,
    gitTag: false,
    firstRelease: true,
    versionActionsOptionsOverrides: {
      skipLockFileUpdate: true
    },
    verbose
  });

  await releasePublish({
    tag: 'e2e',
    firstRelease: true,
    verbose
  });
};
