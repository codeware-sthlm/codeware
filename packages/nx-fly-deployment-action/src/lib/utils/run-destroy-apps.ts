import * as core from '@actions/core';
import { getPullRequest } from '@codeware/core/actions';
import { Fly } from '@codeware/fly-node';

import type { ActionOutputs } from '../schemas/action-outputs.schema';
import { DeploymentConfig } from '../schemas/deployment-config.schema';

/**
 * Destroy deprecated apps, which means apps that are associated with a closed pull request.
 *
 * Pull request number is extracted from the app name,
 * which is in the format of `app-pr-<pull-request-number>`.
 *
 * @param config - Deployment configuration
 * @param fly - Fly instance
 * @returns List of destroy statuses of deprecated apps
 */
export const runDestroyApps = async (
  config: DeploymentConfig,
  fly: Fly
): Promise<ActionOutputs['projects']> => {
  const projects: ActionOutputs['projects'] = [];

  // Get all deployed apps
  const apps = await fly.apps.list();

  // Filter deprecated apps to destroy
  const appPromises = apps.map(async (app) => {
    // Extract pull request number from app name
    const prNumber = app.name.match(/-pr-(\d+)/)?.[1];
    if (!prNumber) {
      return null;
    }

    const pullRequest = await getPullRequest(config.token, Number(prNumber));
    if (!pullRequest) {
      core.warning(`Pull request #${prNumber} not found, skip destroy`);
      return null;
    }

    // App should be destroyed when PR is closed
    return pullRequest.state === 'closed' ? app : null;
  });

  const result = await Promise.all(appPromises);
  const appsToDestroy = result.filter((app) => app !== null);

  core.info(`Found ${appsToDestroy.length} apps to destroy`);

  for (const { name } of appsToDestroy) {
    core.info(`[${name}] About to destroy app...`);

    try {
      await fly.apps.destroy(name);
      core.info(`[${name}] 🗑️ App destroyed`);
      projects.push({ action: 'destroy', app: name });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      core.warning(`[${name}] ❌ Failed to destroy app: ${msg}`);
      projects.push({
        action: 'skip',
        appOrProject: name,
        reason: 'Failed to destroy application'
      });
    }
  }

  core.info(
    `Destroyed ${projects.filter((p) => p.action === 'destroy').length} apps`
  );

  return projects;
};
