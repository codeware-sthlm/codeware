import * as core from '@actions/core';

import { addPullRequestAssignees } from './utils/add-pull-request-assignees';
import { addPullRequestLabels } from './utils/add-pull-request-labels';
import { cleanupPullRequests } from './utils/cleanup-pull-requests';
import { createAndPushCommit } from './utils/create-and-push-commit';
import { createOrUpdatePullRequest } from './utils/create-or-update-pull-request';
import { PULL_REQUEST_LABEL } from './utils/definitions';
import { discardUnstagedChanges } from './utils/discard-unstaged-changes';
import { enablePullRequestAutoMerge } from './utils/enable-pull-request-auto-merge';
import { getMigrateConfig } from './utils/get-migrate-config';
import { getNxVersionInfo } from './utils/get-nx-version-info';
import { getTokenPermissions } from './utils/get-token-permissions';
import { lookupPullRequestWithSameChanges } from './utils/lookup-pull-request-with-same-changes';
import { prepareWorkspace } from './utils/prepare-workspace';
import { printGitHubContext } from './utils/print-github-context';
import { printTokenPermissions } from './utils/print-token-permissions';
import { runMigration } from './utils/run-migration';
import { runNxE2e } from './utils/run-nx-e2e';
import { runNxTests } from './utils/run-nx-tests';
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

    printGitHubContext();

    if (inputs.checkToken) {
      core.info('Check token is valid and has proper permissions');
      const response = await getTokenPermissions(inputs.token);
      const { isValid, resolvedPermissions } = response;

      printTokenPermissions(response);

      if (!isValid) {
        throw new Error('Token is invalid or expired');
      }
      if (Object.values(resolvedPermissions).some((value) => value === false)) {
        throw new Error('Token is missing some required permissions');
      }
    } else {
      core.info('Skip token check');
    }

    core.startGroup('Analyze nx version state');

    // Get migration configuration from action inputs
    const config = await getMigrateConfig(inputs);

    // Check versions
    const versionInfo = await getNxVersionInfo();

    const { currentVersion, isMajorUpdate, isOutdated, latestVersion } =
      versionInfo;

    if (!isOutdated) {
      core.info('Nx workspace is up to date');

      return {
        currentVersion,
        latestVersion,
        isMajorUpdate,
        isMigrated: false,
        pullRequest: undefined
      };
    }
    core.endGroup();

    if (!config.dryRun) {
      await prepareWorkspace(config, latestVersion);

      await runMigration(config, latestVersion);

      const existingPullRequest = await lookupPullRequestWithSameChanges(
        config,
        latestVersion
      );
      if (existingPullRequest) {
        core.info('Active pull request exists, no need to continue');

        return {
          currentVersion,
          isMajorUpdate,
          isMigrated: false,
          latestVersion,
          pullRequest: existingPullRequest
        };
      }

      core.startGroup('Tests migration changes');

      // Base tests
      const testsPass = await runNxTests();

      // Skip e2e when previous tests failed or from action inputs
      let e2ePass: boolean | undefined = undefined;
      if (testsPass && !config.skipE2E) {
        e2ePass = await runNxE2e();
      }

      // Cleanup changes affected by tests
      await discardUnstagedChanges();

      core.endGroup();

      core.startGroup('Handle pull request');

      await createAndPushCommit(config, latestVersion);

      const pullRequest = await createOrUpdatePullRequest(
        config,
        { currentVersion, latestVersion },
        {
          e2ePass,
          testsPass
        }
      );

      await addPullRequestLabels(config.token, pullRequest, PULL_REQUEST_LABEL);

      await addPullRequestAssignees(
        config.token,
        pullRequest,
        config.prAssignees
      );

      if (config.autoMerge) {
        await enablePullRequestAutoMerge(
          config.token,
          isMajorUpdate,
          pullRequest
        );
      }

      await cleanupPullRequests(config.token, pullRequest);

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
