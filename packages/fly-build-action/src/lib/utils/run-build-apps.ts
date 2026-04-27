import * as core from '@actions/core';
import { type Environment, getAppName } from '@codeware/core/actions-internal';
import { Fly } from '@codeware/fly-node';

import type { BuildConfig } from '../schemas/build-config.schema';

/**
 * Build Docker images for all apps that would be deployed and push them to
 * the Fly registry without deploying. Returns a map of project name to image
 * reference for use in a subsequent deploy phase.
 *
 * Building once before deploying provides two benefits:
 * - Build failures surface before touching live machines
 * - Multi-tenant apps that share an image build it once instead of N times
 *
 * @param options - Build options
 * @returns Map of project name to image reference
 */
export const runBuildApps = async (options: {
  config: BuildConfig;
  environment: Environment;
  fly: Fly;
  pullRequest: number | undefined;
}): Promise<Record<string, string>> => {
  const images: Record<string, string> = {};

  const { config, environment, fly, pullRequest } = options;

  core.info(`Found ${config.apps.length} apps to build`);

  for (const app of config.apps) {
    const { flyConfigFile, name: projectName } = app;

    let configAppName: string;

    core.info(`[${projectName}] Read Fly config file: ${flyConfigFile}`);
    try {
      const flyConfig = await fly.config.show({
        config: flyConfigFile,
        local: true
      });
      configAppName = flyConfig.app;
    } catch {
      throw new Error(
        `[${projectName}] Fly config file could not be resolved, cannot build image`
      );
    }

    // Build using the base app name (no tenant suffix) — one image shared across all tenants
    const appName = getAppName({
      configAppName,
      environment,
      pullRequest
    });

    core.info(`[${projectName}] Building image for app '${appName}'...`);

    const buildArgs = config.buildArgs || {};

    const { imageRef } = await fly.build({
      app: appName,
      buildArgs,
      config: flyConfigFile,
      optOutDepotBuilder: config.fly.optOutDepotBuilder,
      preferRemoteConfig: true
    });

    core.info(`[${projectName}] Image built: ${imageRef}`);
    images[projectName] = imageRef;
  }

  core.info(`Built images for ${Object.keys(images).length} apps`);

  return images;
};
