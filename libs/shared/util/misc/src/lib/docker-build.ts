import { existsSync } from 'fs';
import { join } from 'path';

import { dockerCommand } from 'docker-cli-js';
import invariant from 'tiny-invariant';

import { logError, logInfo } from './log-utils';

/**
 * Image build configuration
 */
type ImageConfig = {
  /** Context path */
  context: string;

  /** Dockerfile path relative to `context` */
  dockerfile: string;

  /** Image name */
  name: string;

  /**
   * Image tag
   * @default 'latest'
   */
  tag?: string;

  /**
   * Build arguments
   * @default {}
   */
  args?: Record<string, string>;
};

/**
 * Docker build response data
 */
type BuildData = {
  command: string;
  raw: string;
  response: Array<ImageConfig>;
};

/**
 * Build image using local Docker installation
 *
 * @param image Image build configuration
 * @param quiet Suppress all output
 *
 * @throws When configuration details missing
 * @throws When Dockerfile isn't found
 * @throws When image fails to build
 */
export const dockerBuild = async (image: ImageConfig, quiet?: boolean) => {
  const { context, dockerfile, name, tag, args } = image;
  const dockerfilePath = join(context, dockerfile);

  invariant(!!context?.length, 'Context path must be provided');
  invariant(!!dockerfile?.length, 'Doockerfile path must be provided');
  invariant(!!name?.length, 'Image name must be provided');

  invariant(
    existsSync(join(dockerfilePath)),
    `Dockerfile not found: ${dockerfilePath}`
  );

  const buildTag = `${name}:${tag}`;

  if (!quiet) {
    logInfo(`[${buildTag}] Context: '${image.context}'`);
    logInfo(`[${buildTag}] Dockerfile: '${image.dockerfile}'`);
    logInfo(
      `[${buildTag}] Args: ${image?.args ? JSON.stringify(image.args) : '{}'}`
    );
  }

  const buildArgs =
    (args &&
      Object.keys(args)
        .map((key) => `--build-arg ${key}=${args[key]}`)
        .join(' ')) ||
    '';

  const cmd = `build -f ${dockerfilePath} -t ${buildTag} ${buildArgs} ${quiet ? '-q' : ''} ${context}`;

  if (!quiet) {
    logInfo(`[${buildTag}] Building image...`);
  }

  // Throws native error logs when build fails
  try {
    const data: BuildData = await dockerCommand(cmd, { echo: !quiet });
    if (!quiet) {
      logInfo(`[${buildTag}] Build success: ${data.response[0]}`);
    }
  } catch (error) {
    logError(`[${buildTag}] Build failed`);
    logError(`[${buildTag}] Command: '${cmd}'`);
    throw error;
  }
};
