import * as core from '@actions/core';
import * as github from '@actions/github';
import {
  addPullRequestComment,
  getDeployEnv,
  printGitHubContext
} from '@codeware/core/actions';
import { Fly } from '@codeware/fly-node';
import type {
  PullRequestEvent,
  WebhookEventName
} from '@octokit/webhooks-types';

import { type ActionInputs } from './schemas/action-inputs.schema';
import { ActionOutputsSchema } from './schemas/action-outputs.schema';
import { type ActionOutputs } from './schemas/action-outputs.schema';
import { type BuildingContext, ContextSchema } from './schemas/context.schema';
import { getDeploymentConfig } from './utils/get-deployment-config';
import { runDeployApps } from './utils/run-deploy-apps';
import { runDestroyApps } from './utils/run-destroy-apps';

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
    core.endGroup();

    core.startGroup('Initialize Fly client');
    const fly = new Fly({
      token: config.fly.token,
      org: config.fly.org,
      region: config.fly.region,
      logger: {
        info: (msg) => core.info(msg),
        error: (msg, params) => core.error(msg, params),
        traceCLI: config.fly.traceCLI,
        // TEMPORARY: Enable verbose logging to help debug action issues
        streamToConsole: true
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

    // Verify context data before actions
    ContextSchema.parse(context);

    // Initialize action results
    const results: ActionOutputs = {
      environment: context.environment,
      projects: []
    };

    // Action: Destroy and exit
    if (context.action === 'destroy') {
      core.startGroup('Destroy deprecated applications');
      results.projects = await runDestroyApps(config, fly);
      core.endGroup();

      return ActionOutputsSchema.parse(results);
    }
    // Action: Deploy
    else if (context.action === 'deploy') {
      core.startGroup('Deploy affected applications');
      results.projects = await runDeployApps({
        config,
        environment: context.environment,
        fly,
        pullRequest: context.pullRequest
      });
      core.endGroup();
    }

    // Preview deployments should add a comment to the pull request
    const deployed = results.projects.filter((p) => p.action === 'deploy');
    if (deployed.length && results.environment === 'preview') {
      core.startGroup('Add pull request preview comment');

      // Create a table with deployed projects
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
      core.endGroup();
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
