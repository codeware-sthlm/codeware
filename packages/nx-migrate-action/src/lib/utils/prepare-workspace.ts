import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';

import { getFeatureBranchName } from './get-feature-branch-name';
import type { MigrateConfig } from './types';

/**
 * Prepare the workspace for migration by
 *
 * - Setting git committer
 * - Updating remote URL to use token authentication
 * - Fetching latest changes on remote
 * - Creating or updating feature branch to main head commit
 * - Discarding any local changes on the feature branch
 *
 * @param config Migration configuration
 * @param latestVersion Latest Nx version
 */
export const prepareWorkspace = async (
  config: MigrateConfig,
  latestVersion: string
): Promise<void> => {
  core.startGroup('Prepare workspace');

  const { committer, mainBranch, token } = config;

  const { repo, owner } = github.context.repo;
  const featureBranch = getFeatureBranchName(latestVersion);

  // Set git committer
  await exec.exec('git', ['config', 'user.name', committer.name]);
  await exec.exec('git', ['config', 'user.email', committer.email]);

  // Update remote URL to use token authentication
  // Note! Needed for local testing, but works for all use cases.
  const remoteUrl = `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;
  await exec.exec('git', ['remote', 'set-url', 'origin', remoteUrl]);

  // Fetch latest changes on remote
  await exec.exec('git', ['fetch', 'origin']);

  // Create feature branch on main remote HEAD, discarding local state
  await exec.exec('git', [
    'checkout',
    '-B',
    featureBranch,
    `origin/${mainBranch}`
  ]);

  core.endGroup();
};
