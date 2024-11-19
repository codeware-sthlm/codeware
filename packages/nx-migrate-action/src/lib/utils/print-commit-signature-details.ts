import * as core from '@actions/core';
import * as github from '@actions/github';
import { withGitHub } from '@codeware/core';

import { getCurrentCommitSha } from './get-current-commit-sha';
import type { MigrateConfig } from './types';

/**
 * Get last commit signature and print verification and committer details
 *
 * @param config - The migration configuration
 */
export const printCommitSignatureDetails = async (
  config: MigrateConfig
): Promise<void> => {
  const { token } = config;

  const octokit = github.getOctokit(token);

  const ref = await getCurrentCommitSha();

  // Get the commit details including verification information
  const {
    data: { commit, committer, sha }
  } = await withGitHub(() =>
    octokit.rest.repos.getCommit({
      ...github.context.repo,
      ref
    })
  );

  core.info(`Verification status for commit ${sha}`);
  core.info(`- Verified: ${commit.verification?.verified}`);
  core.info(`- Reason: ${commit.verification?.reason}`);
  core.info(`- Committer: ${committer?.name}`);
};
