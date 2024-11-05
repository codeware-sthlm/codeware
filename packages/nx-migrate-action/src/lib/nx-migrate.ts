import * as core from '@actions/core';

import { addPullRequestAssignees } from './utils/add-pull-request-assignees';
import { addPullRequestLabel } from './utils/add-pull-request-label';
import { cleanupPullRequests } from './utils/cleanup-pull-requests';
import { createAndPushCommit } from './utils/create-and-push-commit';
import { createLocalBranch } from './utils/create-local-branch';
import { createPullRequest } from './utils/create-pull-request';
import { discardUnstagedChanges } from './utils/discard-unstaged-changes';
import { enablePullRequestAutoMerge } from './utils/enable-pull-request-auto-merge';
import { existsFeatureBranchOnRemote } from './utils/exists-feature-branch-on-remote';
import { fetchRemoteChanges } from './utils/fetch-remote-changes';
import { getMigrateConfig } from './utils/get-migrate-config';
import { getNxVersionInfo } from './utils/get-nx-version-info';
import { getTokenPermissions } from './utils/get-token-permissions';
import { lookupPullRequest } from './utils/lookup-pull-request';
import { printGitHubContext } from './utils/print-github-context';
import { printTokenPermissions } from './utils/print-token-permissions';
import { runMigration } from './utils/run-migration';
import { runNxE2e } from './utils/run-nx-e2e';
import { runNxTests } from './utils/run-nx-tests';
import { setGitCredentials } from './utils/set-git-credentials';
import { stageAllChanges } from './utils/stage-all-changes';
import type { ActionInputs, ActionOutputs } from './utils/types';

/**
 * Run nx migration process and create a pull request
 * when the workspace is outdated
 *
 * @param inputs Migration options
 * @param throwOnError Whether to throw on error
 * @returns Migration results
 */
export async function nxMigrate(
  inputs: ActionInputs,
  throwOnError = false
): Promise<ActionOutputs> {
  try {
    core.info('Starting nx migration process');

    core.startGroup('GitHub context details');
    printGitHubContext();
    core.endGroup();

    core.startGroup('Get migration configuration');
    const config = await getMigrateConfig(inputs);
    core.endGroup();

    core.startGroup('Set git credentials');
    await setGitCredentials(config);
    core.endGroup();

    core.startGroup('Check token is valid and has proper permissions');
    if (inputs.checkToken) {
      try {
        const response = await getTokenPermissions(inputs.token);
        const { isValid, resolvedPermissions } = response;

        printTokenPermissions(response);

        if (!isValid) {
          throw new Error('Token is invalid or expired');
        }

        if (
          Object.values(resolvedPermissions).some((value) => value === false)
        ) {
          throw new Error('Token is missing some required permissions');
        }
      } catch (error) {
        if (error instanceof Error) {
          core.warning(`Token check failed: ${error.message}`);
        } else {
          core.warning('Token check failed');
          core.warning(error as string);
        }
        core.warning(
          'Could not determine token permissions, continue migration anyway'
        );
      }
    } else {
      core.info('Disabled by configuration');
    }
    core.endGroup();

    core.startGroup('Analyze current migration state');
    const { currentVersion, isMajorUpdate, isOutdated, latestVersion } =
      await getNxVersionInfo();

    // Exit early if workspace is up to date
    if (!isOutdated) {
      core.info('Nx workspace is up to date, skipping migration');
      return {
        currentVersion,
        latestVersion,
        isMajorUpdate,
        isMigrated: false,
        pullRequest: undefined
      };
    }

    // When feature branch exists on remote, there should be a pending migration
    if (await existsFeatureBranchOnRemote(latestVersion)) {
      // Also verify there's an open pull request for the feature branch
      const existingPullRequest = await lookupPullRequest(
        config,
        latestVersion
      );
      if (!existingPullRequest) {
        throw new Error(
          `Expected to find a pull request for branch '${latestVersion}'`
        );
      }
      core.info(
        `Active pull request #${existingPullRequest} exists, skipping migration`
      );
      return {
        currentVersion,
        isMajorUpdate,
        isMigrated: false,
        latestVersion,
        pullRequest: existingPullRequest
      };
    }
    core.endGroup();

    ///
    /// Initial verification is done, migration can be executed.
    ///
    /// Migration is required since workspace is outdated
    /// and no active pull request exists!
    ///

    if (!config.dryRun) {
      core.startGroup('Fetch remote changes');
      await fetchRemoteChanges();
      core.endGroup();

      core.startGroup('Create local branch');
      await createLocalBranch(config, latestVersion);
      core.endGroup();

      core.startGroup('Run migration');
      await runMigration(config, latestVersion);
      await stageAllChanges();
      core.endGroup();

      core.startGroup('Run tests on migration changes');
      // Base tests
      const testsPass = await runNxTests();
      core.endGroup();

      // Skip e2e when previous tests failed or from action inputs
      let e2ePass: boolean | undefined = undefined;
      if (testsPass && !config.skipE2E) {
        core.startGroup('Run tests on migration changes');
        e2ePass = await runNxE2e();
        core.endGroup();
      }

      core.startGroup('Cleanup changes affected by tests');
      await discardUnstagedChanges();
      core.endGroup();

      core.startGroup('Create commit on remote');
      await createAndPushCommit(config, latestVersion);
      core.endGroup();

      core.startGroup('Create pull request');
      const pullRequest = await createPullRequest(
        config,
        { currentVersion, latestVersion },
        {
          e2ePass,
          testsPass
        }
      );
      if (config.prAssignees.length > 0) {
        await addPullRequestAssignees(config, pullRequest);
      }
      await addPullRequestLabel(config, pullRequest);
      if (config.autoMerge) {
        await enablePullRequestAutoMerge(config, isMajorUpdate, pullRequest);
      }
      await cleanupPullRequests(config, pullRequest);
      core.endGroup();

      return {
        currentVersion,
        isMajorUpdate,
        isMigrated: true,
        latestVersion,
        pullRequest
      };
    } else {
      core.info('Skip nx migration [dry-run]');

      return {
        currentVersion,
        isMajorUpdate,
        isMigrated: false,
        latestVersion,
        pullRequest: undefined
      };
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);

      if (throwOnError) {
        throw error.message;
      }
    }

    return {} as ActionOutputs;
  }
}
