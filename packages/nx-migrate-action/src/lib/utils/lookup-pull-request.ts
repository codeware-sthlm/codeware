import * as github from '@actions/github';
import { withGitHub } from '@codeware/core/actions';

import { getFeatureBranchName } from './get-feature-branch-name';
import type { MigrateConfig } from './types';

/**
 * Lookup open pull request from feature branch name.
 *
 * @param config Migration configuration
 * @param latestVersion Latest Nx version
 * @returns pull request number if found, otherwise `undefined`
 */
export const lookupPullRequest = async (
  config: MigrateConfig,
  latestVersion: string
): Promise<number | undefined> => {
  const { token } = config;
  const branchName = getFeatureBranchName(latestVersion);

  const octokit = github.getOctokit(token);

  // Check for an open PR for the owner and branch
  const { data: pullRequests } = await withGitHub(() =>
    octokit.rest.pulls.list({
      ...github.context.repo,
      state: 'open',
      head: `${github.context.repo.owner}:${branchName}`
    })
  );

  if (pullRequests.length > 1) {
    throw new Error(`Multiple pull requests found for branch ${branchName}`);
  }

  return pullRequests.length === 1 ? pullRequests[0].number : undefined;
};
