import * as core from '@actions/core';

import { nxMigrate } from './nx-migrate';
import { ActionInputsSchema } from './utils/schema';

/**
 * Main action function
 */
export async function run(): Promise<void> {
  try {
    const inputs = ActionInputsSchema.parse({
      token: core.getInput('token', { required: true }),
      autoMerge: core.getBooleanInput('auto-merge'),
      committer: core.getInput('committer'),
      author: core.getInput('author'),
      mainBranch: core.getInput('main-branch'),
      packagePatterns: core.getMultilineInput('package-patterns'),
      prAssignees: core.getInput('pull-request-assignees'),
      dryRun: core.getBooleanInput('dry-run')
    });

    core.debug(`Inputs:\n${JSON.stringify(inputs, null, 2)}`);

    // Run nx migration
    const {
      currentVersion,
      isMajorUpdate,
      isMigrated,
      latestVersion,
      pullRequest
    } = await nxMigrate(inputs);

    // Set action outputs
    core.setOutput('current-version', currentVersion);
    core.setOutput('latest-version', latestVersion);
    core.setOutput('is-major-update', isMajorUpdate);
    core.setOutput('is-migrated', isMigrated);
    core.setOutput('pull-request', pullRequest);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}
