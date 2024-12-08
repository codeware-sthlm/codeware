import * as core from '@actions/core';
import * as github from '@actions/github';
import { withGitHub } from '@codeware/core/actions';

import { PULL_REQUEST_LABEL } from './definitions';
import type { MigrateConfig } from './types';

/**
 * Close deprecated open pull requests
 * having a label from `PULL_REQUEST_LABEL`
 *
 * @param config - The migration configuration
 * @param pullRequest - The pull request number
 */
export const cleanupPullRequests = async (
  config: MigrateConfig,
  pullRequest: number
): Promise<void> => {
  core.info('Cleaning up deprecated open pull requests');

  const { token } = config;

  const octokit = github.getOctokit(token);

  const { data: openPullRequests } = await withGitHub(() =>
    octokit.rest.pulls.list({
      ...github.context.repo,
      state: 'open'
    })
  );

  if (!openPullRequests.length) {
    core.info('No open pull requests found');
    return;
  }

  for (const openPR of openPullRequests) {
    if (
      openPR.labels.find((label) => label.name === PULL_REQUEST_LABEL) &&
      openPR.number !== pullRequest
    ) {
      await withGitHub(() =>
        octokit.rest.pulls.update({
          ...github.context.repo,
          pull_number: openPR.number,
          state: 'closed'
        })
      );

      core.info(`Closed deprecated pull request #${openPR.number}`);

      await withGitHub(() =>
        octokit.rest.issues.createComment({
          ...github.context.repo,
          issue_number: openPR.number,
          body: `Auto-closed - replaced by new pull request #${pullRequest}`
        })
      );

      core.info(`Added comment to deprecated pull request #${openPR.number}`);

      await withGitHub(() =>
        octokit.rest.git.deleteRef({
          ...github.context.repo,
          ref: `heads/${openPR.head.ref}`
        })
      );

      core.info(
        `Deleted branch ${openPR.head.ref} of pull request #${openPR.number}`
      );
    }
  }
};
