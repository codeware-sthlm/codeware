import * as github from '@actions/github';

import { parseNameEmail } from './parse-name-email';
import type { ActionInputs, MigrateConfig } from './types';

export const getMigrateConfig = async (
  inputs: ActionInputs
): Promise<MigrateConfig> => {
  const {
    author,
    autoMerge,
    committer,
    dryRun,
    mainBranch,
    packagePatterns,
    prAssignees,
    token
  } = inputs;

  const octokit = github.getOctokit(token);

  const {
    data: { default_branch }
  } = await octokit.rest.repos.get({
    ...github.context.repo
  });

  if (!mainBranch && !default_branch) {
    throw new Error(
      'No main branch specified and unable to determine default branch'
    );
  }

  return {
    author: parseNameEmail(author),
    autoMerge,
    committer: parseNameEmail(committer),
    dryRun,
    mainBranch: mainBranch || default_branch,
    packagePatterns: packagePatterns.length
      ? packagePatterns
      : ['packages/**/package.json'],
    prAssignees: prAssignees.split(',').filter(Boolean),
    token
  };
};
