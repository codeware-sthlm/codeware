import * as core from '@actions/core';
import { getPullRequest } from '@codeware/core/actions';
import { Fly } from '@codeware/fly-node';

/**
 * Destroy deprecated apps, which means apps that are associated with a closed pull request.
 *
 * Pull request number is extracted from the app name,
 * which is in the format of `<app>-pr-<pull-request-number>`.
 *
 * @param token - GitHub token for API access
 * @param fly - Fly instance
 * @returns Destroyed and skipped app names
 */
export const runDestroyApps = async (
  token: string,
  fly: Fly
): Promise<{ destroyed: string[]; skipped: string[] }> => {
  const destroyed: string[] = [];
  const skipped: string[] = [];

  const apps = await fly.apps.list();

  const appPromises = apps.map(async (app) => {
    const prNumber = app.name.match(/-pr-(\d+)/)?.[1];
    if (!prNumber) {
      return null;
    }

    const pullRequest = await getPullRequest(token, Number(prNumber));
    if (!pullRequest) {
      core.warning(`Pull request #${prNumber} not found, skip destroy`);
      return null;
    }

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
      destroyed.push(name);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      core.warning(`[${name}] ❌ Failed to destroy app: ${msg}`);
      skipped.push(name);
    }
  }

  core.info(`Destroyed ${destroyed.length} apps`);

  return { destroyed, skipped };
};
