import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';
import { getPackageManagerCommand } from '@nx/devkit';

import { addPullRequestAssignees } from './utils/add-pull-request-assignees';
import { addPullRequestLabels } from './utils/add-pull-request-labels';
import { cleanupPullRequests } from './utils/cleanup-pull-requests';
import { createMigrationGitCommit } from './utils/create-migration-git-commit';
import { createPullRequest } from './utils/create-pull-request';
import { PULL_REQUEST_LABEL } from './utils/definitions';
import { enablePullRequestAutoMerge } from './utils/enable-pull-request-auto-merge';
import { getFeatureBranchName } from './utils/get-feature-branch-name';
import { getMigrateConfig } from './utils/get-migrate-config';
import { getNxVersionInfo } from './utils/get-nx-version-info';
import {
  type TokenInfo,
  getTokenPermissions
} from './utils/get-token-permissions';
import { revertToLatestGitCommit } from './utils/revert-to-latest-git-commit';
import { runNxE2e } from './utils/run-nx-e2e';
import { runNxTests } from './utils/run-nx-tests';
import { ActionInputs, ActionOutputs } from './utils/types';
import { updatePackageVersions } from './utils/update-package-versions';

const printTokenPermissions = (token: TokenInfo) => {
  core.startGroup('Token permissions');
  core.info(`type: ${token.type}`);
  core.info(`isValid: ${token.isValid}`);
  core.info(`username: ${token.username}`);
  core.info(`expiration: ${token.expiration}`);
  core.info(`scopes: ${token.scopes?.join(', ')}`);
  core.info('== Repo permissions ==');
  for (const [key, value] of Object.entries(token.repoPermissions)) {
    core.info(`- ${key}: ${value}`);
  }
  core.info('== Resolved permissions ==');
  for (const [key, value] of Object.entries(token.resolvedPermissions)) {
    core.info(`- ${key}: ${value}`);
  }
  core.endGroup();
};

export async function nxMigrate(
  inputs: ActionInputs,
  throwOnError = false
): Promise<ActionOutputs> {
  try {
    core.startGroup('Starting nx migration process');
    core.info(`owner: ${github.context.repo.owner}`);
    core.info(`repo: ${github.context.repo.repo}`);
    for (const [key, value] of Object.entries(github.context)) {
      if (typeof value === 'string') {
        core.info(`${key}: ${value}`);
      }
    }
    core.endGroup();

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

    const pmc = getPackageManagerCommand();

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

    // Create temporary feature branch
    if (config.dryRun) {
      core.info('Skip nx migration [dry-run]');
    } else {
      core.startGroup('Migrate nx workspace');

      await exec.exec('git', [
        'checkout',
        '-b',
        getFeatureBranchName(latestVersion)
      ]);

      // Update dependencies
      await exec.exec(pmc.exec, ['nx', 'migrate', latestVersion]);
      await exec.exec(pmc.exec, [
        'nx',
        'add',
        `create-nx-workspace@${latestVersion}`
      ]);
      await exec.exec(pmc.install);

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

      core.endGroup();
    }

    let pullRequest: number | undefined;
    let testsPass = true;
    let e2ePass = true;

    if (config.dryRun) {
      core.info('Skip tests [dry-run]');
    } else {
      core.startGroup('Tests migration changes');

      // Commit before testing the changes
      await createMigrationGitCommit(
        config.token,
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

      core.endGroup();
    }

    if (config.dryRun) {
      core.info('Skip pull request [dry-run]');
    } else {
      core.startGroup('Create pull request');

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

      core.endGroup();
    }

    core.info('Nx migration done');

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
