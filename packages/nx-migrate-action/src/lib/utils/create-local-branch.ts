import * as core from '@actions/core';
import * as exec from '@actions/exec';

import { getFeatureBranchName } from './get-feature-branch-name';
import type { MigrateConfig } from './types';

/**
 * Create a local feature branch for the migration.
 *
 * The branch is created on the main branch remote HEAD commit,
 * discarding local state.
 *
 * No tracking is set for the branch, which must be considered when
 * pushing changes to the remote.
 *
 * @param config Migration configuration
 * @param latestVersion Latest Nx version
 */
export const createLocalBranch = async (
  config: MigrateConfig,
  latestVersion: string
): Promise<void> => {
  const { mainBranch } = config;

  const featureBranch = getFeatureBranchName(latestVersion);

  // Create feature branch on main remote HEAD, discarding local state,
  // without tracking the main branch
  await exec.exec('git', [
    'checkout',
    '--no-track',
    '-B',
    featureBranch,
    `origin/${mainBranch}`
  ]);

  core.info(`Created local branch '${featureBranch}'`);
};
