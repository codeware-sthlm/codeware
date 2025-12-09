/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * This script stops the local registry for testing purposes.
 *
 * For e2e it is meant to be called in jest's `globalTeardown`.
 */

module.exports = () => {
  if (!(global as any).stopLocalRegistry) {
    console.log('Local registry is not started');
    return;
  }

  try {
    (global as any).stopLocalRegistry();
    console.log('Killed local registry process');

    // Extra cleanup when local registry config is left behind
    const { execSync } = require('child_process');
    // Get current npm config
    const npmConfig = execSync('npm config list').toString();

    // Only clean up if the configs exist
    if (npmConfig.includes('0.0.0.0:4873')) {
      execSync('npm config delete //0.0.0.0:4873/:_authToken');
      console.log('Cleaned up 0.0.0.0:4873 registry auth token');
    }
    if (npmConfig.includes('localhost:4873')) {
      execSync('npm config delete //localhost:4873/:_authToken');
      console.log('Cleaned up localhost:4873 registry auth token');
    }
  } catch (error) {
    console.warn('Failed to stop and clean up local registry config:', error);
  }
};
