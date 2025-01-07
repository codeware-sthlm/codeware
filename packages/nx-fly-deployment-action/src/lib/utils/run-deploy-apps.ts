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

    // Get app name
    const appName =
      environment === 'preview'
        ? getPreviewAppName(configAppName, pullRequest ?? 0)
        : configAppName;

    // Add environment variables
    const env = addOpinionatedEnv(
      { appName, prNumber: pullRequest },
      config.env
    );

    // Get postgres connection string
    const postgres =
      environment === 'preview'
        ? githubConfig.flyPostgresPreview
        : githubConfig.flyPostgresProduction;

    core.info(
      `[${projectName}] Deploy app '${appName}' to '${environment}'...`
    );

    // Deploy app
    try {
      const result = await fly.deploy({
        app: appName,
        config: resolvedFlyConfig,
        env,
        environment,
        postgres: postgres || undefined, // rather undefined than empty string
        secrets: config.secrets
      });

      core.info(`[${projectName}] 🚀 Deployed to '${result.url}'`);

      projects.push({
        action: 'deploy',
        app: result.app,
        name: projectName,
        url: result.url
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);

      core.warning(`[${projectName}] ❌ Failed to deploy project: ${msg}`);

      projects.push({
        appOrProject: projectName,
        action: 'skip',
        reason: 'Failed to deploy project'
      });
    }
  }

  core.info(
    `Deployed ${projects.filter((p) => p.action === 'deploy').length} apps`
  );

  return projects;
};
