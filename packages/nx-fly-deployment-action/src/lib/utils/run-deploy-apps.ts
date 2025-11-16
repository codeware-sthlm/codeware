import { join } from 'path';

import * as core from '@actions/core';
import type { Environment } from '@codeware/core/actions';
import { Fly } from '@codeware/fly-node';

import type { ActionOutputs } from '../schemas/action-outputs.schema';
import type { DeploymentConfig } from '../schemas/deployment-config.schema';

import { addOpinionatedEnv } from './add-opinionated-env';
import { getDeployableProjects } from './get-deployable-projects';
import { getPreviewAppName } from './get-preview-app-name';
import { getProjectConfiguration } from './get-project-configuration';
import { getTenantAppName } from './get-tenant-app-name';
import { lookupGitHubConfigFile } from './lookup-github-config-file';

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

  // Create deployments based on affected projects
  core.info('Analyze affected projects to deploy');
  const projectNames = await getDeployableProjects();

  core.info(`Found ${projectNames.length} projects`);

  // Analyze each project
  for (const projectName of projectNames) {
    core.info(`[${projectName}] Analyze project before deployment`);

    // Get project configuration
    core.info(`[${projectName}] Get project config`);
    const projectConfig = await getProjectConfiguration(projectName);

    if (!projectConfig) {
      const reason = 'Project config not found';
      core.warning(`[${projectName}] ${reason}, not possible to deploy`);
      projects.push({
        appOrProject: projectName,
        action: 'skip',
        reason
      });
      continue;
    }

    // Find github.json
    core.info(
      `[${projectName}] Lookup GitHub config file in '${projectConfig.root}'`
    );

    const gcResponse = await lookupGitHubConfigFile(projectConfig.root);

    if (!gcResponse) {
      core.info(`[${projectName}] GitHub config file not found, skipping`);
      projects.push({
        appOrProject: projectName,
        action: 'skip',
        reason: 'GitHub config file not found for the project'
      });
      continue;
    }

    const { configFile, content: githubConfig } = gcResponse;

    core.info(`[${projectName}] Found '${configFile}'`);

    if (!githubConfig.deploy) {
      core.info(`[${projectName}] Deployment is disabled, skipping`);
      projects.push({
        appOrProject: projectName,
        action: 'skip',
        reason: 'Deployment is disabled in GitHub config for the project'
      });
      continue;
    }

    // Verify and get app name from fly.toml
    core.info(
      `[${projectName}] Lookup Fly config file '${githubConfig.flyConfig}'`
    );

    const resolvedFlyConfig = join(projectConfig.root, githubConfig.flyConfig);
    let configAppName: string;

    try {
      const flyConfig = await fly.config.show({
        config: resolvedFlyConfig,
        local: true
      });
      configAppName = flyConfig.app;
      core.info(`[${projectName}] Found '${resolvedFlyConfig}'`);
      core.info(
        `[${projectName}] Got app name '${configAppName}' from Fly config`
      );
    } catch {
      core.warning(
        `[${projectName}] Fly config file not found, not possible to deploy`
      );
      projects.push({
        appOrProject: projectName,
        action: 'skip',
        reason: `Fly config file not found '${resolvedFlyConfig}'`
      });
      continue;
    }

    // Requirements are met, ready to deploy
    core.info(`[${projectName}] Ready to fly >>>`);

    // Determine which tenants to deploy for
    // If no tenants provided, deploy once without tenant suffix
    const tenantsToDeployFor = config.tenants.length > 0 ? config.tenants : [''];

    // Deploy once for each tenant
    for (const tenantId of tenantsToDeployFor) {
      const tenantLabel = tenantId ? ` for tenant '${tenantId}'` : '';
      core.info(`[${projectName}] Deploying${tenantLabel}...`);

      // Get app name with tenant suffix
      let appName: string;
      if (environment === 'preview') {
        appName = getPreviewAppName(configAppName, pullRequest ?? 0);
        // Add tenant suffix for preview if tenant specified
        if (tenantId) {
          appName = getTenantAppName(appName, tenantId);
        }
      } else {
        // For production, add tenant suffix if tenant specified
        appName = tenantId ? getTenantAppName(configAppName, tenantId) : configAppName;
      }

      // Add environment variables
      const envVars = addOpinionatedEnv(
        { appName, prNumber: pullRequest },
        config.env
      );

      // Add TENANT_ID environment variable if tenant is specified
      if (tenantId) {
        envVars['TENANT_ID'] = tenantId;
      }

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
          config: resolvedFlyConfig,
          env: envVars,
          environment,
          optOutDepotBuilder: config.fly.optOutDepotBuilder,
          postgres: postgres || undefined, // rather undefined than empty string
          secrets: config.secrets
        });

        core.info(`[${projectName}] 🚀 Deployed to '${result.url}'${tenantLabel}`);

        projects.push({
          action: 'deploy',
          app: result.app,
          name: tenantId ? `${projectName} (${tenantId})` : projectName,
          url: result.url
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);

        core.warning(`[${projectName}] ❌ Failed to deploy project${tenantLabel}: ${msg}`);

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
