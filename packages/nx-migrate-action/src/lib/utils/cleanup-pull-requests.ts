import * as github from '@actions/github';

import { PULL_REQUEST_LABEL } from './definitions';

/**
 * Close deprecated open pull requests
 * having a label from `PULL_REQUEST_LABEL`
 */
export const cleanupPullRequests = async (
  token: string,
  pullRequest: number
): Promise<void> => {
  const octokit = github.getOctokit(token);

  const { data: openPullRequests } = await octokit.rest.pulls.list({
    ...github.context.repo,
    state: 'open'
  });

  for (const openPR of openPullRequests) {
    if (
      openPR.labels.find((label) => label.name === PULL_REQUEST_LABEL) &&
      openPR.number !== pullRequest
    ) {
      await octokit.rest.pulls.update({
        ...github.context.repo,
        pull_number: openPR.number,
        state: 'closed'
      });

      await octokit.rest.issues.createComment({
        ...github.context.repo,
        issue_number: openPR.number,
        body: `Autoclosed - Replaced by a PR #${pullRequest}`
      });
    }
  }
};
