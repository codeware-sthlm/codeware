import { logDebug } from '@codeware/core/utils';
import { dockerCommand } from 'docker-cli-js';

type DockerRaw = { raw: string };

/**
 * Ensure containers used during tests have been shut down and removed
 */
export const ensureCleanupDockerContainers = async () => {
  for (const name of ['mongodb', 'postgres']) {
    const { raw: pid }: DockerRaw = await dockerCommand(
      `container ls -aq -f "NAME=${name}"`,
      {
        echo: false
      }
    );

    if (pid.match(/\S+/)) {
      logDebug(
        `Stop and remove Docker container '${name}' before running tests`
      );
      await dockerCommand(`container rm -fv ${name}`, {
        echo: false
      });
    }
  }
};
