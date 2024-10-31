import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';

import { getFeatureBranchName } from './get-feature-branch-name';
import type { MigrateConfig } from './types';

// TODO: Need to check if pending migration branch exists to prevent duplicate commits
export const createMigrationGitCommit = async (
  token: string,
  author: MigrateConfig['author'],
  committer: MigrateConfig['committer'],
  latestVersion: string
): Promise<void> => {
  core.info('Affected files to add to commit');
  await exec.exec('git', ['status']);

  // Add all changes
  await exec.exec('git', ['add', '.']);

  // Set committer
  await exec.exec('git', ['config', 'user.name', committer.name]);
  await exec.exec('git', ['config', 'user.email', committer.email]);

  // Commit
  const gitOptions = [
    author ? `--author="${author.name} <${author.email}>"` : '',
    '-m',
    `"build(repo): 📦 update nx workspace to ${latestVersion}"`,
    '--no-verify'
  ];
  await exec.exec('git', ['commit', ...gitOptions].filter(Boolean));

  // Set proper SSH authentication to allow push.
  // Note! Needed for local testing, but works for all use cases.
  const { owner, repo } = github.context.repo;
  await exec.exec('git', [
    'remote',
    'set-url',
    'origin',
    `https://${token}@github.com/${owner}/${repo}.git`
  ]);

  // FIXME: What if the branch exist on remote?
  await exec.exec('git', [
    'push',
    'origin',
    getFeatureBranchName(latestVersion)
  ]);
};
