import * as core from '@actions/core';
import { type Environment, getAppName } from '@codeware/core/actions-internal';
import { Fly } from '@codeware/fly-node';

import type { ActionOutputs } from '../schemas/action-outputs.schema';
import type { DeploymentConfig } from '../schemas/deployment-config.schema';

import { addOpinionatedEnv } from './add-opinionated-env';

/**
 * Deploy provided apps or apps that are affected by code changes
 * and have Fly configuration available.
 *
 * When `imageMap` is provided, each app is deployed using the pre-built image
 * reference instead of triggering a Docker build inside the deploy command.
 *
 * @param options - Deployment options
 * @returns List of deploy statuses of apps
 */
export const runDeployApps = async (options: {
  config: DeploymentConfig;
  environment: Environment;
  fly: Fly;
  pullRequest: number | undefined;
  imageMap?: Record<string, string>;
}): Promise<ActionOutputs['projects']> => {
  const projects: ActionOutputs['projects'] = [];

  const { config, environment, fly, imageMap, pullRequest } = options;

  // Track apps whose host deployment failed so tenant deployments can be skipped.
  // Deploying tenants against an incompatible schema would cause runtime failures.
  const failedHostApps = new Set<string>();

  core.info(`Found ${config.apps.length} apps to deploy`);

  for (const app of config.apps) {
    const { flyConfigFile, githubConfig, name: projectName } = app;

    core.startGroup(`Deploy ${projectName}`);

    // Read the base app name from local config
    let configAppName: string;

    core.info(`Read Fly config file: ${flyConfigFile}`);
    try {
      const flyConfig = await fly.config.show({
        config: flyConfigFile,
        local: true
      });
      configAppName = flyConfig.app;
    } catch {
      core.endGroup();
      throw new Error(
        `Fly config file could not be resolved, cannot deploy ${projectName}`
      );
    }

    core.info(`Resolved app name: ${configAppName}`);
    core.info(`Ready to fly >>>`);

    // Get deployment details for this specific app
    // If app not in appDetails map or has empty array, deploy once without deployment-specific config
    const appDeploymentDetails = config.appDetails[projectName] || [];
    // Host deployment (no tenant or _default) must run first so migrations
    // complete before tenant apps start.
    const deploymentsToRun = (
      appDeploymentDetails.length > 0 ? appDeploymentDetails : [{}]
    ).sort((a, b) => {
      const aIsHost = !a.tenant || a.tenant === '_default';
      const bIsHost = !b.tenant || b.tenant === '_default';
      return aIsHost === bIsHost ? 0 : aIsHost ? -1 : 1;
    });

    if (appDeploymentDetails.length > 0) {
      const tenantNames = appDeploymentDetails
        .map((d) => d.tenant || 'default')
        .join(', ');
      core.info(
        `Multi-deployment app with ${appDeploymentDetails.length} deployment(s): ${tenantNames}`
      );
    } else {
      core.info(`Single deployment app`);
    }

    // Deploy once for each deployment configuration
    for (const deploymentDetails of deploymentsToRun) {
      const tenantId = deploymentDetails.tenant;
      const isHostDeployment = !tenantId || tenantId === '_default';
      const tenantLabel = tenantId
        ? tenantId === '_default'
          ? ' (headless mode)'
          : ` for tenant '${tenantId}'`
        : '';

      if (!isHostDeployment && failedHostApps.has(configAppName)) {
        core.warning(
          `Skipping${tenantLabel}: host deployment for '${configAppName}' failed — tenant would run against an incompatible schema`
        );
        projects.push({
          appOrProject: `${projectName} (${tenantId})`,
          action: 'failed',
          error: `Skipped: host deployment failed`
        });
        continue;
      }

      core.info(`Deploying${tenantLabel}...`);

      const appName = getAppName({
        configAppName,
        environment,
        pullRequest,
        tenantId
      });

      const preBuiltImage = imageMap?.[projectName];
      if (preBuiltImage) {
        core.info(`Using pre-built image: ${preBuiltImage}`);
      }

      // Merge secrets: global -> deployment-specific (deployment wins)
      const mergedSecrets = {
        ...config.secrets,
        ...deploymentDetails.secrets
      };

      // Merge environment variables: global -> deployment-specific (deployment wins)
      const mergedEnv = {
        ...config.env,
        ...deploymentDetails.env
      };

      // Add opinionated environment variables
      const envVars = addOpinionatedEnv(
        { appName, prNumber: pullRequest, tenantId },
        mergedEnv
      );

      // Get postgres connection string
      const postgres =
        environment === 'preview'
          ? githubConfig.flyPostgresPreview
          : githubConfig.flyPostgresProduction;

      // Get database name (shared across all apps)
      const databaseName = githubConfig.flyPostgresDatabaseName;

      core.info(`Deploy app '${appName}' to '${environment}'${tenantLabel}...`);

      // Deploy app
      try {
        const result = await fly.deploy({
          app: appName,
          config: flyConfigFile,
          databaseName: databaseName || undefined, // rather undefined than empty string
          env: envVars,
          environment,
          image: preBuiltImage,
          optOutDepotBuilder: config.fly.optOutDepotBuilder,
          postgres: postgres || undefined, // rather undefined than empty string
          preferRemoteConfig: true,
          secrets: mergedSecrets
        });

        core.info(`🚀 Deployed to '${result.url}'${tenantLabel}`);

        projects.push({
          action: 'deploy',
          app: result.app,
          name: tenantId ? `${projectName} (${tenantId})` : projectName,
          url: result.url
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);

        core.error(`❌ Failed to deploy project${tenantLabel}: ${msg}`);

        projects.push({
          appOrProject: tenantId ? `${projectName} (${tenantId})` : projectName,
          action: 'failed',
          error: msg
        });

        if (isHostDeployment) {
          failedHostApps.add(configAppName);
        }
      }
    }

    core.endGroup();
  }

  core.info(
    `Deployed ${projects.filter((p) => p.action === 'deploy').length} apps`
  );

  return projects;
};
