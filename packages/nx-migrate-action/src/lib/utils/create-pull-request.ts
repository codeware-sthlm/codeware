import * as core from '@actions/core';
import * as github from '@actions/github';
import { withGitHub } from '@codeware/core';

import { getFeatureBranchName } from './get-feature-branch-name';
import type { MigrateConfig, VersionInfo } from './types';

export const createPullRequest = async (
  config: MigrateConfig,
  versionInfo: Pick<VersionInfo, 'currentVersion' | 'latestVersion'>,
  status: { testsPass?: boolean; e2ePass?: boolean }
): Promise<number> => {
  const { mainBranch, token } = config;
  const octokit = github.getOctokit(token);

  const { currentVersion, latestVersion } = versionInfo;
  const { e2ePass, testsPass } = status;

  const branchName = getFeatureBranchName(latestVersion);

  const prTitle = `Update @nx/workspace to ${latestVersion}`;
  const prBody = `Update Nx from ${currentVersion} to ${latestVersion}

${testsPass === true ? '✅ Tests passed' : testsPass === false ? '⚠️ Tests failed during migration' : '⚫ No tests were run'}
${e2ePass === true ? '✅ E2E tests passed' : e2ePass === false ? '⚠️ E2E tests failed during migration' : '⚫ No E2E tests were run'}

> Auto-generated by [@cdwr/nx-migrate-action][1]

[1]: https://github.com/codeware-sthlm/codeware/packages/nx-migrate-action
`;

  // Create a new pull request
  const {
    data: { number }
  } = await withGitHub(() =>
    octokit.rest.pulls.create({
      ...github.context.repo,
      title: prTitle,
      body: prBody,
      head: branchName,
      base: mainBranch,
      draft: false
    })
  );

  core.info(`Created pull request #${number}`);

  return number;
};
