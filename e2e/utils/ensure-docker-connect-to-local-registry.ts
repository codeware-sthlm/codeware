import { writeFileSync } from 'fs';

import { tmpProjPath, updateFile } from '@nx/plugin/testing';

/**
 * Ensure the generated application can connect to the local registry
 * and fetch the project plugins from a Docker build process.
 *
 * Support `npm`.
 *
 * @param appName Application name
 * @throws Error if `CDWR_E2E_VERDACCIO_HOST` is not set
 */
export const ensureDockerConnectToLocalRegistry = (appName: string): void => {
  const registry = {
    host: process.env['CDWR_E2E_VERDACCIO_HOST'],
    port: 4873,
    token: 'secretVerdaccioToken'
  };

  if (!registry.host) {
    throw new Error('CDWR_E2E_VERDACCIO_HOST is not set');
  }

  writeFileSync(
    `${tmpProjPath()}/.npmrc`,
    `
registry=http://${registry.host}:${registry.port}
//${registry.host}:${registry.port}/:_authToken=${registry.token}
  `
  );

  // `.npmrc` is normally not required in `Dockerfile`
  updateFile(`apps/${appName}/Dockerfile`, (content) =>
    content.replace(/^COPY package\.json \.\/$/m, 'COPY .npmrc package.json ./')
  );
};
