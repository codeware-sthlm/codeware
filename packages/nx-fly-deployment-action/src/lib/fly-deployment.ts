import { join } from 'path';

import * as core from '@actions/core';
import * as github from '@actions/github';
import {
  addPullRequestComment,
  getDeployEnv,
  printGitHubContext
} from '@codeware/core/actions';
import { type DeployAppOptions, Fly } from '@codeware/fly-node';
import type {
  PullRequestEvent,
  WebhookEventName
} from '@octokit/webhooks-types';

import { type ActionInputs } from './schemas/action-inputs.schema';
import { ActionOutputsSchema } from './schemas/action-outputs.schema';
import { type ActionOutputs } from './schemas/action-outputs.schema';
import { type BuildingContext, ContextSchema } from './schemas/context.schema';
import { getDeployableProjects } from './utils/get-deployable-projects';
import { getDeploymentConfig } from './utils/get-deployment-config';
import { getPreviewAppName } from './utils/get-preview-app-name';
import { getProjectConfiguration } from './utils/get-project-configuration';
import { lookupGitHubConfigFile } from './utils/lookup-github-config-file';

/**
 * Run fly deployment process
 *
 * @param inputs Deployment options
 * @param throwOnError Whether to throw on error
 */
export async function flyDeployment(
  inputs: ActionInputs,
  throwOnError = false
): Promise<ActionOutputs> {
  try {
    core.info('Starting fly deployment process');

    // Deployment context
    const context: BuildingContext = {};

    const {
      context: { eventName, payload, ref }
    } = github;
    const currentBranch = ref.split('/').at(-1);

    core.startGroup('GitHub context details');
    printGitHubContext();
    core.endGroup();

    core.startGroup('Get deployment configuration');
    const config = await getDeploymentConfig(inputs);
    // Add environment variables to context
    context.env = config.env;
    core.endGroup();

    core.startGroup('Initialize Fly client');
    const fly = new Fly({
      token: config.fly.token,
      org: config.fly.org,
      region: config.fly.region,
      logger: {
        info: (msg) => core.info(msg),
        error: (msg, params) => core.error(msg, params)
      }
    });

    await fly.isReady('assert');
    core.info('Fly client is ready 🚀');
    core.endGroup();

    core.startGroup('Analyze event');
    core.info(
      `Get deployment environment for '${eventName}' on '${currentBranch}'`
    );
    const deployEnv = getDeployEnv(github.context, config.mainBranch);
    if (deployEnv.environment) {
      // Add target environment to context
      context.environment = deployEnv.environment;
    } else {
      throw new Error(deployEnv.reason);
    }
    core.info(`Using environment '${context.environment}'`);
    switch (eventName as WebhookEventName) {
      case 'pull_request':
        {
          const { number, pull_request } = payload as PullRequestEvent;

          context.action = pull_request.state === 'open' ? 'deploy' : 'destroy';
          context.pullRequest = number;
        }
        break;

      case 'push':
        context.action = 'deploy';
        break;
    }
    core.endGroup();

    // Initialize action results
    const results: ActionOutputs = {
      environment: context.environment,
      projects: []
    };

    // Destroy deployments based on pull request number
    if (context.action === 'destroy') {
      // Verify context data before destroying deployments
      ContextSchema.parse(context);

      core.startGroup('Analyze fly apps to destroy');
      const apps = await fly.apps.list();
      for (const app of apps) {
        if (app.name.endsWith(`-pr-${context.pullRequest}`)) {
          core.info(`Destroy preview app '${app.name}'`);

          try {
            await fly.apps.destroy(app.name);
            results.projects.push({ action: 'destroy', app: app.name });
          } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            core.warning(msg);
            results.projects.push({
              action: 'skip',
              appOrProject: app.name,
              reason: 'Failed to destroy application'
            });
          }
        }
      }
      core.endGroup();

      return ActionOutputsSchema.parse(results);
    }

    // Add secrets to context available for deployment
    context.secrets = config.secrets;

    // Create deployments based on affected projects
    core.startGroup('Analyze affected projects to deploy');
    const projectNames = await getDeployableProjects();
    core.info(`Deployable projects: ${projectNames.join(', ')}`);
    core.endGroup();

    if (projectNames.length === 0) {
      core.info('No projects to deploy, skipping deployment');
      return ActionOutputsSchema.parse(results);
    }

    // Analyze each project
    for (const projectName of projectNames) {
      core.startGroup(`Analyze project '${projectName}' before deployment`);

      // Get project configuration
      core.info(`Get project configuration for '${projectName}'`);
      const projectConfig = await getProjectConfiguration(projectName);
      if (!projectConfig) {
        const reason = 'Project configuration not found';
        core.warning(`${reason}, not possible to deploy`);
        results.projects.push({
          appOrProject: projectName,
          action: 'skip',
          reason
        });
        continue;
      }
      core.info(
        `Found project configuration with root '${projectConfig.root}'`
      );

      // Find github.json
      core.info(`Lookup GitHub configuration file in '${projectConfig.root}'`);
      const gcResponse = await lookupGitHubConfigFile(projectConfig.root);
      if (!gcResponse) {
        const reason = 'GitHub configuration file not found for the project';
        core.info(`${reason}, skipping`);
        results.projects.push({
          appOrProject: projectName,
          action: 'skip',
          reason
        });
        continue;
      }
      const { configFile, content: githubConfig } = gcResponse;
      core.info(`Found GitHub configuration file '${configFile}'`);

      if (!githubConfig.deploy) {
        const reason =
          'Deployment is disabled in GitHub configuration for the project';
        core.info(`${reason}, skipping`);
        results.projects.push({
          appOrProject: projectName,
          action: 'skip',
          reason
        });
        continue;
      }

      // Verify and get app name from fly.toml
      core.info(
        `Deployment is enabled, lookup Fly configuration file '${githubConfig.flyConfig}'`
      );
      const resolvedFlyConfig = join(
        projectConfig.root,
        githubConfig.flyConfig
      );
      let configAppName: string;
      try {
        const flyConfig = await fly.config.show({
          config: resolvedFlyConfig,
          local: true
        });
        configAppName = flyConfig.app;
        core.info(
          `Resolved app name '${configAppName}' from Fly configuration '${resolvedFlyConfig}'`
        );
      } catch {
        const reason = `Fly configuration file not found '${resolvedFlyConfig}'`;
        core.warning(`${reason}, not possible to deploy`);
        results.projects.push({
          appOrProject: projectName,
          action: 'skip',
          reason
        });
        continue;
      }
      core.endGroup();

      // Verify context data before deploying
      ContextSchema.parse(context);

      // Requirements are met, ready to deploy

      core.startGroup(`Project '${projectName}' ready to fly`);
      const options: DeployAppOptions = {
        app:
          context.environment === 'preview'
            ? getPreviewAppName(configAppName, Number(context.pullRequest))
            : configAppName,
        config: resolvedFlyConfig,
        env: context.env,
        environment: context.environment,
        secrets: context.secrets
      };
      core.info(`Deploy '${options.app}' to '${options.environment}'...`);
      try {
        const result = await fly.deploy(options);
        core.info(`Deployed to '${result.url}'`);
        results.projects.push({
          action: 'deploy',
          app: result.app,
          name: projectName,
          url: result.url
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        core.warning(msg);
        results.projects.push({
          appOrProject: projectName,
          action: 'skip',
          reason: 'Failed to deploy project'
        });
      }

      core.endGroup();
    }

    // Preview deployments should add a comment to the pull request
    if (results.environment === 'preview') {
      core.startGroup('Pull request preview comment');
      core.info('Analyze deployed projects');
      const deployed = results.projects.filter((p) => p.action === 'deploy');
      const comment = [
        `:sparkles: Your pull request project${
          deployed.length > 1 ? 's are' : ' is'
        } ready for preview`,
        '| Project | App name | Preview |',
        '| --- | --- | --- |'
      ];
      for (const project of deployed) {
        comment.push(
          `| ${project.name} | ${project.app} | [${project.url}](${project.url}) |`
        );
      }
      core.info(`Add comment to pull request ${context.pullRequest}`);
      await addPullRequestComment(
        config.token,
        Number(context.pullRequest),
        comment.join('\n')
      );
    }

    return ActionOutputsSchema.parse(results);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);

      if (throwOnError) {
        throw error.message;
      }
    }

    return ActionOutputsSchema.parse({
      environment: null,
      projects: []
    });
  }
}
