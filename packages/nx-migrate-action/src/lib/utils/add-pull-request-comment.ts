import * as github from '@actions/github';
import { withGitHub } from '@codeware/core';

import type { MigrateConfig } from './types';

/**
 * Add a comment to a pull request.
 *
 * @param config - The migration configuration
 * @param pullRequest - The pull request number
 * @param comment - The comment to add
 */
export const addPullRequestComment = async (
  config: MigrateConfig,
  pullRequest: number,
  comment: string
): Promise<void> => {
  const { token } = config;
  const octokit = github.getOctokit(token);

  await withGitHub(() =>
    octokit.rest.issues.createComment({
      ...github.context.repo,
      issue_number: pullRequest,
      body: comment
    })
  );
};
