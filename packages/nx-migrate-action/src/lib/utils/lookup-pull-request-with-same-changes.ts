import * as core from '@actions/core';
import * as exec from '@actions/exec';

import { getFeatureBranchName } from './get-feature-branch-name';
import { lookupPullRequest } from './lookup-pull-request';
import type { MigrateConfig } from './types';

/**
 * Lookup if there is a pull request branch with the same changes
 * as we have in the current workspace.
 *
 * This is useful to avoid creating a pull request when it's not needed.
 *
 * @param config Migration configuration
 * @param latestVersion Latest Nx version
 * @returns Pull request number if found, otherwise `undefined`
 */
export const lookupPullRequestWithSameChanges = async (
  config: MigrateConfig,
  latestVersion: string
): Promise<number | undefined> => {
  const branchName = getFeatureBranchName(latestVersion);

  // Stage changes to index
  await exec.exec('git', ['add', '.']);

  // Get hash of staged changes from index
  const { stdout: newTreeHash } = await exec.getExecOutput('git', [
    'write-tree'
  ]);

  // Get hash of PR branch tree
  const { stdout: prTreeHash } = await exec.getExecOutput('git', [
    'rev-parse',
    `origin/${branchName}^{tree}`
  ]);

  // Compare tree hashes
  if (newTreeHash.trim() !== prTreeHash.trim()) {
    return undefined;
  }

  // The same changes are already in the remote feature branch
  // Just verify that feature branch also has an open pull request
  core.info(
    `Remote branch ${branchName} has the same changes as the workspace`
  );

  const prNumber = await lookupPullRequest(config, latestVersion);
  if (!prNumber) {
    throw new Error(`Expected to find a pull request for branch ${branchName}`);
  }

  return prNumber;
};
