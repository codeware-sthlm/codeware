import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { getPackageManagerCommand } from '@nx/devkit';

import { addPullRequestAssignees } from './utils/add-pull-request-assignees';
import { addPullRequestLabels } from './utils/add-pull-request-labels';
import { cleanupPullRequests } from './utils/cleanup-pull-requests';
import { createMigrationGitCommit } from './utils/create-migration-git-commit';
import { createPullRequest } from './utils/create-pull-request';
import { PULL_REQUEST_LABEL } from './utils/definitions';
import { enablePullRequestAutoMerge } from './utils/enable-pull-request-auto-merge';
import { getBranchName } from './utils/get-branch-name';
import { getMigrateConfig } from './utils/get-migrate-config';
import { getNxVersionInfo } from './utils/get-nx-version-info';
import { revertToLatestGitCommit } from './utils/revert-to-latest-git-commit';
import { runNxE2e } from './utils/run-nx-e2e';
import { runNxTests } from './utils/run-nx-tests';
import { ActionInputs, ActionOutputs } from './utils/types';
import { updatePackageVersions } from './utils/update-package-versions';

export async function nxMigrate(
  inputs: ActionInputs,
  throwOnError = false
): Promise<ActionOutputs> {
  try {
    const pmc = getPackageManagerCommand();

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

    // Create temporary branch
    if (config.dryRun) {
      core.info('Skip nx migration [dry-run]');
    } else {
      await exec.exec('git', ['checkout', '-b', getBranchName(latestVersion)]);

      // Update dependencies
      await exec.exec(pmc.exec, ['nx', 'migrate', latestVersion]);
      await exec.exec(pmc.exec, [
        'add',
        `create-nx-workspace@${latestVersion}`
      ]);
      await exec.exec(pmc.exec, ['install', '--no-immutable']);

      // Check for and run migrations
      const migrationsExist =
        (await exec.exec('test', ['-f', 'migrations.json'], {
          ignoreReturnCode: true
        })) === 0;

      if (migrationsExist) {
        await exec.exec(pmc.exec, ['nx', 'migrate', '--run-migrations']);
      }

      // Update version references in package.json files
      await updatePackageVersions(latestVersion, config.packagePatterns);
    }

    let pullRequest: number | undefined;
    let testsPass = true;
    let e2ePass = true;

    if (config.dryRun) {
      core.info('Skip tests [dry-run]');
    } else {
      // Commit before testing the changes
      await createMigrationGitCommit(
        config.author,
        config.committer,
        latestVersion
      );

      testsPass = await runNxTests();

      // Skip e2e when previous tests failed
      if (testsPass) {
        e2ePass = await runNxE2e();
      }

      // Cleanup test changes
      await revertToLatestGitCommit();
    }

    if (config.dryRun) {
      core.info('Skip pull request [dry-run]');
    } else {
      const pr = await createPullRequest(
        config.token,
        config.mainBranch,
        { currentVersion, latestVersion },
        {
          e2ePass,
          testsPass
        }
      );

      pullRequest = pr.data.number;

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
    }

    core.debug('Nx migration done');

    return {
      currentVersion,
      isMajorUpdate,
      isMigrated: !!pullRequest,
      latestVersion,
      pullRequest
    };
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
