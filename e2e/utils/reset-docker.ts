import { dockerCommand } from 'docker-cli-js';

/**
 * Reset Docker after tests to make sure temporary containers are shut down
 */
export const resetDocker = async (appName: string) => {
  const containers = [appName, 'mongodb', 'postgres'];

  await dockerCommand(`container rm -fv ${containers.join(' ')}`, {
    echo: false
  });
};
