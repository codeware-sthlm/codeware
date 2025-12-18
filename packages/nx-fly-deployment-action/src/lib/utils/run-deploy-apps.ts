import * as core from '@actions/core';
import type { Environment } from '@codeware/core/actions';
import { analyzeAppsToDeploy } from '@codeware/core/actions-internal';
import { Fly } from '@codeware/fly-node';

import type { ActionOutputs } from '../schemas/action-outputs.schema';
import type { DeploymentConfig } from '../schemas/deployment-config.schema';

import { addOpinionatedEnv } from './add-opinionated-env';
import { getAppName } from './get-app-name';

/**
 * Deploy apps that are affected by code changes
 * and are configured to be deployed via GitHub config file.
 *
 * @param options - Deployment options
 * @returns List of deploy statuses of apps
 */
export const runDeployApps = async (options: {
  config: DeploymentConfig;
  environment: Environment;
  fly: Fly;
  pullRequest: number | undefined;
}): Promise<ActionOutputs['projects']> => {
  const projects: ActionOutputs['projects'] = [];

  const { config, environment, fly, pullRequest } = options;

  core.info('Analyze apps to deploy');

  const apps = await analyzeAppsToDeploy();

  core.info(`Found ${apps.length} possible apps`);

  for (const app of apps) {
    if (app.status !== 'deploy') {
      core.info(`[${app.projectName}] Skipped: ${app.reason}`);
      projects.push({
        appOrProject: app.projectName,
        action: 'skip',
        reason: app.reason
      });
      continue;
    }

    const { flyConfigFile, githubConfig, projectName } = app;

    let configAppName: string;

    core.info(`[${projectName}] Verify Fly config file`);
    try {
      const flyConfig = await fly.config.show({
        config: flyConfigFile,
        local: true
      });
      configAppName = flyConfig.app;
    } catch {
      core.warning(
        `[${projectName}] Fly config file could not be resolved, not possible to deploy`
      );
      projects.push({
        appOrProject: projectName,
        action: 'skip',
        reason: `Fly config file could not be resolved`
      });
      continue;
    }

    core.info(`[${projectName}] Resolved app name: ${configAppName}`);

    // Requirements are met, ready to deploy
    core.info(`[${projectName}] Ready to fly >>>`);

    // Get deployment details for this specific app
    // If app not in appDetails map or has empty array, deploy once without deployment-specific config
    const appDeploymentDetails = config.appDetails[projectName] || [];
    const deploymentsToRun =
      appDeploymentDetails.length > 0 ? appDeploymentDetails : [{}];

    if (appDeploymentDetails.length > 0) {
      const tenantNames = appDeploymentDetails
        .map((d) => d.tenant || 'default')
        .join(', ');
      core.info(
        `[${projectName}] Multi-deployment app with ${appDeploymentDetails.length} deployment(s): ${tenantNames}`
      );
    } else {
      core.info(`[${projectName}] Single deployment app`);
    }

    // Deploy once for each deployment configuration
    for (const deploymentDetails of deploymentsToRun) {
      const tenantId = deploymentDetails.tenant;
      const tenantLabel = tenantId ? ` for tenant '${tenantId}'` : '';
      core.info(`[${projectName}] Deploying${tenantLabel}...`);

      const appName = getAppName({
        configAppName,
        environment,
        pullRequest,
        tenantId
      });

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

      core.info(
        `[${projectName}] Deploy app '${appName}' to '${environment}'${tenantLabel}...`
      );

      // Deploy app
      try {
        const result = await fly.deploy({
          app: appName,
          config: flyConfigFile,
          env: envVars,
          environment,
          optOutDepotBuilder: config.fly.optOutDepotBuilder,
          postgres: postgres || undefined, // rather undefined than empty string
          secrets: mergedSecrets
        });

        core.info(
          `[${projectName}] 🚀 Deployed to '${result.url}'${tenantLabel}`
        );

        projects.push({
          action: 'deploy',
          app: result.app,
          name: tenantId ? `${projectName} (${tenantId})` : projectName,
          url: result.url
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);

        core.warning(
          `[${projectName}] ❌ Failed to deploy project${tenantLabel}: ${msg}`
        );

        projects.push({
          appOrProject: tenantId ? `${projectName} (${tenantId})` : projectName,
          action: 'skip',
          reason: `Failed to deploy project${tenantLabel}`
        });
      }
    }
  }

  core.info(
    `Deployed ${projects.filter((p) => p.action === 'deploy').length} apps`
  );

  return projects;
};
