import * as core from '@actions/core';
import * as exec from '@actions/exec';

import type { MigrateConfig } from './types';

// TODO: Need to check if pending migration branch exists to prevent duplicate commits
export const createMigrationGitCommit = async (
  author: MigrateConfig['author'],
  committer: MigrateConfig['committer'],
  latestVersion: string
): Promise<void> => {
  const committerOptions =
    committer.email && committer.name
      ? [
          '-c',
          `user.name='${committer.name}'`,
          '-c',
          `user.email='${committer.email}'`
        ]
      : [];

  const authorOptions =
    author.email && author.name
      ? `--author='${author.name} <${author.email}>'`
      : '';

  core.info('Affected files:');
  await exec.exec('git', ['status', '--short']);

  // Add all changes
  await exec.exec('git', ['add', '.']);

  // Commit
  const gitOptions = [
    ...committerOptions,
    'commit',
    authorOptions,
    '-m',
    `"build(repo): 📦 update nx workspace to ${latestVersion}"`,
    '--no-verify'
  ].filter(Boolean);
  await exec.exec('git', gitOptions);
};
