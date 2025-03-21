/**
 * This script starts a local registry for testing purposes.
 *
 * For e2e it is meant to be called in jest's `globalSetup`.
 */

import { startLocalRegistry } from '@nx/js/plugins/jest/local-registry';
import { releasePublish, releaseVersion } from 'nx/release';

import { isCI } from './is-ci';

export default async () => {
  const verbose = process.env['NX_VERBOSE_LOGGING'] === 'true';

  // Listen address depending on run environment.
  // Must be in sync with workspace project.json.
  const listenAddress = isCI() ? 'localhost' : '0.0.0.0';

  // local registry target to run
  const localRegistryTarget = `codeware:local-registry${isCI() ? ':ci' : ''}`;

  console.log(
    `\nStart local registry with listen address '${listenAddress}' (CI=${isCI()})`
  );

  // storage folder for the local registry
  const storage = './tmp/local-registry/storage';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).stopLocalRegistry = await startLocalRegistry({
    listenAddress,
    localRegistryTarget,
    storage,
    verbose
  });

  await releaseVersion({
    specifier: `0.0.${Date.now()}-e2e`,
    stageChanges: false,
    gitCommit: false,
    gitTag: false,
    firstRelease: true,
    generatorOptionsOverrides: {
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
