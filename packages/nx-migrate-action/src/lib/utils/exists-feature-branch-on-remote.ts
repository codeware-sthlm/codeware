import * as core from '@actions/core';
import * as exec from '@actions/exec';

import { getFeatureBranchName } from './get-feature-branch-name';

/**
 * Check if the feature branch exists on the remote.
 *
 * @param latestVersion Latest Nx version
 * @returns `true` if the branch exists, otherwise `false`
 */
export const existsFeatureBranchOnRemote = async (
  latestVersion: string
): Promise<boolean> => {
  const branchName = getFeatureBranchName(latestVersion);

  // No output means the branch does not exist
  const { stdout: prBranch } = await exec.getExecOutput('git', [
    'ls-remote',
    '--heads',
    'origin',
    branchName
  ]);

  if (prBranch.trim() !== '') {
    core.info(`Feature branch '${branchName}' exists on remote`);
    return true;
  }

  return false;
};
