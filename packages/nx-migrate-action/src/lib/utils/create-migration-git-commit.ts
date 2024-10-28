import * as exec from '@actions/exec';

import type { NameEmail } from './types';

// TODO: Need to check if pending migration branch exists to prevent duplicate commits
export const createMigrationGitCommit = async (
  author: NameEmail,
  committer: NameEmail,
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

  await exec.exec('git', [
    ...committerOptions,
    'commit',
    authorOptions,
    '-am',
    `build(repo): 📦 update nx workspace to ${latestVersion}`,
    '--no-verify'
  ]);
};
