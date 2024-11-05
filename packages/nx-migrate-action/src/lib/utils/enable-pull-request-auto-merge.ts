import * as core from '@actions/core';
import * as github from '@actions/github';
import { withGitHub } from '@cx/core';

import { addPullRequestComment } from './add-pull-request-comment';
import type { MigrateConfig } from './types';

/**
 * Enable auto-merge for a pull request using rebase merge method.
 *
 * Requires auto-merge to be enabled in the repository settings.
 *
 * @param config - The migration configuration
 * @param isMajorUpdate - Whether the migration is a major update
 * @param pullRequest - The pull request number
 */
export const enablePullRequestAutoMerge = async (
  config: MigrateConfig,
  isMajorUpdate: boolean,
  pullRequest: number
): Promise<void> => {
  const { token } = config;

  const octokit = github.getOctokit(token);

  // Check if auto-merge is available for the repository
  const {
    data: { allow_auto_merge }
  } = await withGitHub(() =>
    octokit.rest.repos.get({
      ...github.context.repo
    })
  );

  // Skip auto-merge when not allowed
  if (!allow_auto_merge) {
    await addPullRequestComment(
      config,
      pullRequest,
      'Auto-merge is not enabled for this repository'
    );
    core.info('Auto-merge is not enabled for this repository');
    return;
  }

  // Skip auto-merge for major version updates
  if (isMajorUpdate) {
    await addPullRequestComment(
      config,
      pullRequest,
      'Auto-merge is disabled for major version migrations'
    );
    core.info('Auto-merge is disabled for major version migrations');
    return;
  }

  // Enable auto-merge only possible via request
  await withGitHub(() =>
    octokit.request({
      ...github.context.repo,
      url: '/repos/{owner}/{repo}/pulls/{pull_number}/auto-merge',
      pull_number: pullRequest,
      merge_method: 'rebase'
    })
  );

  core.info('Auto-merge is enabled with rebase merge method');
};
