import killPort from 'kill-port';

import { isPortInUse } from './is-port-in-use';

/**
 * This script stops a running local registry and can be invoked standalone.
 *
 * ```sh
 * nx run e2e-utils:registry-stop
 * ```
 */

const runStopLocalRegistry = async () => {
  const port = Number(process.env['PORT']);
  if (!port) {
    return '[ ERROR ] PORT environment variable is not set';
  }

  if (!(await isPortInUse(port))) {
    return `[ SKIP ] Local registry on port ${port} is not in use`;
  }

  console.log(`Kill registry on port ${port}...`);
  await killPort(port);

  console.log('Local registry process stopped');

  // Extra cleanup when local registry config is left behind
  const { execSync } = require('child_process');
  try {
    // Get current npm config
    const npmConfig = execSync('npm config list').toString();

    // Only clean up if the configs exist
    if (npmConfig.includes(`0.0.0.0:${port}`)) {
      execSync(`npm config delete //0.0.0.0:${port}/:_authToken`);
      console.log(`Cleaned up 0.0.0.0:${port} registry auth token`);
    }
    if (npmConfig.includes(`localhost:${port}`)) {
      execSync(`npm config delete //localhost:${port}/:_authToken`);
      console.log(`Cleaned up localhost:${port} registry auth token`);
    }
  } catch (error) {
    console.warn('Failed to clean up local registry config:', error);
  }

  return '[ OK ] Local registry stopped and cleaned up';
};

// main
runStopLocalRegistry()
  .then((msg) => console.log(`\n${msg}`))
  .catch(console.error);
