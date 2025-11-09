import { releasePublish } from 'nx/src/command-line/release';
import { releaseVersion } from 'nx/src/command-line/release';

import { isPortInUse } from './is-port-in-use';

/**
 * This script publish to a running local registry and can be invoked standalone.
 *
 * ```sh
 * nx run e2e-utils:registry-publish --projects [projects]
 * ```
 */

const runPublishLocalRegistry = async () => {
  const port = Number(process.env['PORT']);
  if (!port) {
    return '[ DONE ] PORT environment variable is not set';
  }

  if (!(await isPortInUse(port))) {
    return `[ DONE ] Local registry on port ${port} is not started`;
  }

  const verbose = process.env['NX_VERBOSE_LOGGING'] === 'true';

  const projects = process.argv
    .slice(2)
    .filter((a) => a !== 'true') // flag without projects
    .join(',') // support comma separated list
    .split(',')
    .filter(Boolean); // remove empty strings

  console.log(`Prepare to publish: ${projects.join(', ')}`);

  try {
    await releaseVersion({
      specifier: `0.0.${Date.now()}-e2e`,
      stageChanges: false,
      gitCommit: false,
      gitTag: false,
      firstRelease: true,
      versionActionsOptionsOverrides: {
        skipLockFileUpdate: true
      },
      projects,
      verbose
    });

    await releasePublish({
      tag: 'e2e',
      firstRelease: true,
      projects,
      verbose
    });

    return `[ DONE ] Published packages: ${projects.join(', ') || 'all'}`;
  } catch (error) {
    return `[ DONE ] Failed to publish packages: ${error}`;
  }
};

// main
runPublishLocalRegistry()
  .then((msg) => console.log(`\n${msg}`))
  .catch(console.error);
