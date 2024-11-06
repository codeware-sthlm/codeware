import * as core from '@actions/core';
import * as github from '@actions/github';
import { withGitHub } from '@codeware/core';

import { PULL_REQUEST_LABEL } from './definitions';
import type { MigrateConfig } from './types';

/**
 * Add label from `PULL_REQUEST_LABEL` to a pull request.
 *
 * @param config - The migration configuration
 * @param pullRequest - The pull request number
 */
export const addPullRequestLabel = async (
  config: MigrateConfig,
  pullRequest: number
): Promise<void> => {
  const { token } = config;
  const labels = [PULL_REQUEST_LABEL];

  const octokit = github.getOctokit(token);

  await withGitHub(() =>
    octokit.rest.issues.addLabels({
      ...github.context.repo,
      issue_number: pullRequest,
      labels
    })
  );

  core.info(
    `Added labels '${labels.join(',')}' to pull request #${pullRequest}`
  );
};
