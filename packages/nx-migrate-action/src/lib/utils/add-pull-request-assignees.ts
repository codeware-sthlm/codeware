import * as core from '@actions/core';
import * as github from '@actions/github';
import { withGitHub } from '@codeware/core/actions';

import type { MigrateConfig } from './types';

/**
 * Add assignees to a pull request.
 *
 * @param config - The migration configuration
 * @param pullRequest - The pull request number
 */
export const addPullRequestAssignees = async (
  config: MigrateConfig,
  pullRequest: number
): Promise<void> => {
  const { prAssignees, token } = config;

  if (!prAssignees.length) {
    return;
  }
  const assignees = Array.isArray(prAssignees) ? prAssignees : [prAssignees];

  const octokit = github.getOctokit(token);

  await withGitHub(() =>
    octokit.rest.issues.addAssignees({
      ...github.context.repo,
      issue_number: pullRequest,
      assignees
    })
  );

  core.info(
    `Added assignees '${assignees.join(',')}' to pull request #${pullRequest}`
  );
};
