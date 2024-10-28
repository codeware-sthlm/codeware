import * as github from '@actions/github';

import { getActor } from './get-actor';
import { getRepositoryDefaultBranch } from './get-repository-default-branch';
import { parseNameEmail } from './parse-name-email';
import { MigrateConfigSchema } from './schema';
import type { ActionInputs, MigrateConfig } from './types';

/**
 * Get migrate configuration from action inputs,
 * including default values and validation.
 *
 * @param inputs Action inputs
 * @returns Migrate configuration
 * @throws If configuration is invalid
 */
export const getMigrateConfig = async (
  inputs: ActionInputs
): Promise<MigrateConfig> => {
  const {
    author: authorInput,
    autoMerge,
    committer: committerInput,
    dryRun,
    mainBranch: mainBranchInput,
    packagePatterns,
    prAssignees: prAssigneesInput,
    token
  } = inputs;

  // Check main branch; if not provided, get default branch
  const mainBranch =
    mainBranchInput || (await getRepositoryDefaultBranch(token));

  // Check author; if not provided, use actor
  let author = parseNameEmail(authorInput);
  if (!author.email) {
    const { id } = await getActor(token);
    author = {
      name: github.context.actor,
      email: `${id}+${github.context.actor}@users.noreply.github.com`
    };
  }

  // Check committer; if not provided, use github official bot
  let committer = parseNameEmail(committerInput);
  if (!committer.email) {
    committer = {
      name: 'github-actions[bot]',
      email: '41898282+github-actions[bot]@users.noreply.github.com'
    };
  }

  // Check package patterns; if not provided, use default pattern
  if (!packagePatterns.length) {
    packagePatterns.push('packages/**/package.json');
  }

  // Check PR assignees; optional
  const prAssignees = prAssigneesInput.split(',').filter(Boolean);

  // Validate and return migrate configuration
  return MigrateConfigSchema.parse({
    author,
    autoMerge,
    committer,
    dryRun,
    mainBranch,
    packagePatterns,
    prAssignees,
    token
  });
};
