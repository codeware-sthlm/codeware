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
 * @param throwOnError Whether to throw on error (default: true)
 */
export async function flyDeployment(
  inputs: ActionInputs,
  throwOnError = true
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
        streamToConsole: config.fly.consoleLogs
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
      // For workflow_dispatch, get environment from DEPLOY_ENV variable set by pre-deploy action
      if (eventName === 'workflow_dispatch') {
        core.info(deployEnv.reason);
        const envFromPreDeploy = process.env['DEPLOY_ENV'];
        if (
          envFromPreDeploy === 'preview' ||
          envFromPreDeploy === 'production'
        ) {
          context.environment = envFromPreDeploy;
          core.info(
            `Using environment '${context.environment}' from pre-deploy action`
          );
        } else {
          throw new Error(
            `Invalid or missing DEPLOY_ENV from pre-deploy action: ${envFromPreDeploy}`
          );
        }
      } else {
        throw new Error(deployEnv.reason);
      }
    }

    if (context.environment) {
      core.info(`Using environment '${context.environment}'`);
    }

    // Handle workflow_dispatch separately as it's not a WebhookEventName
    if (eventName === 'workflow_dispatch') {
      context.action = 'deploy';

      // Extract PR number from payload if present (for manual preview deployments)
      const payloadNumber = (payload as { number?: number })?.number;
      if (payloadNumber) {
        context.pullRequest = payloadNumber;
      }
    } else {
      switch (eventName as WebhookEventName) {
        case 'pull_request':
          {
            const { number, pull_request } = payload as PullRequestEvent;

            context.action =
              pull_request.state === 'open' ? 'deploy' : 'destroy';
            context.pullRequest = number;
          }
          break;

        case 'push':
          context.action = 'deploy';
          break;
      }
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
    if (results.environment === 'preview' && context.pullRequest) {
      core.startGroup('Add pull request preview comment');

      const deployed = results.projects.filter((p) => p.action === 'deploy');
      const skipped = results.projects.filter((p) => p.action === 'skip');

      const comment: string[] = [];

      // Add deployment status header
      if (deployed.length > 0) {
        comment.push(
          `:sparkles: Your pull request project${
            deployed.length > 1 ? 's are' : ' is'
          } ready for preview`
        );
      } else {
        comment.push(':information_source: Deployment status');
      }

      // Add deployed projects table
      if (deployed.length > 0) {
        comment.push(
          '',
          '| Project | App name | Preview |',
          '| --- | --- | --- |'
        );

        for (const project of deployed) {
          comment.push(
            `| ${project.name} | ${project.app} | [${project.url}](${project.url}) |`
          );
        }
      }

      // Add skipped projects information
      if (skipped.length > 0) {
        comment.push(
          '',
          `⏭️ Skipped ${skipped.length} project${skipped.length > 1 ? 's' : ''}: ${skipped.map((p) => `\`${p.appOrProject}\``).join(', ')}`
        );
      }

      // If nothing was deployed or skipped
      if (deployed.length === 0 && skipped.length === 0) {
        comment.push('', 'No affected projects to deploy.');
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

      // Try to post failure comment to PR if possible
      const prNumber = github.context.payload.pull_request?.number as
        | number
        | undefined;
      const isPreview =
        github.context.eventName === 'pull_request' &&
        github.context.payload.pull_request?.['state'] === 'open';

      if (isPreview && prNumber) {
        try {
          const config = await getDeploymentConfig(inputs);
          const comment = [
            ':x: Deployment failed',
            '',
            '```',
            error.message,
            '```',
            '',
            'Please check the workflow logs for more details.'
          ].join('\n');

          await addPullRequestComment(config.token, prNumber, comment);
          core.info(`Posted failure comment to PR #${prNumber}`);
        } catch (commentError) {
          core.warning(
            `Failed to add error comment to PR: ${commentError instanceof Error ? commentError.message : 'Unknown error'}`
          );
        }
      }

      if (throwOnError) {
        throw error;
      }
    }

    return ActionOutputsSchema.parse({
      environment: null,
      projects: []
    });
  }
}
