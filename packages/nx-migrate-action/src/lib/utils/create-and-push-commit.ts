import * as exec from '@actions/exec';

import { getFeatureBranchName } from './get-feature-branch-name';
import type { MigrateConfig } from './types';

/**
 * Create and push a commit containing the migration changes.
 * Commit with optional `--author` option and opinionated message.
 *
 * Any files not already staged will be staged and added to the commit.
 *
 * @param config Migration configuration
 * @param latestVersion Latest Nx version
 * @throws Error if no file changes are found in the workspace
 */
export const createAndPushCommit = async (
  config: MigrateConfig,
  latestVersion: string
): Promise<void> => {
  const { author } = config;

  const commitMessage = `build(repo): update nx workspace to ${latestVersion}`;

  const authorOption = author
    ? `--author="${author.name} <${author.email}>"`
    : '';

  const commitOptions = [
    authorOption,
    '-m',
    commitMessage,
    '--no-verify'
  ].filter(Boolean);

  const { stdout: fileChanges } = await exec.getExecOutput(
    'git',
    ['status', '--porcelain'],
    {
      silent: true
    }
  );

  if (fileChanges.trim() === '') {
    throw new Error('Expected to find file changes to commit');
  }

  // Create a commit with the changes
  await exec.exec('git', ['add', '.']);
  await exec.exec('git', ['commit', ...commitOptions]);

  // Push and setup tracking for the feature branch
  await exec.exec('git', [
    'push',
    '-u',
    'origin',
    getFeatureBranchName(latestVersion)
  ]);
};
