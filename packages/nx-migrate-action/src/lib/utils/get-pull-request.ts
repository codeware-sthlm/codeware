import * as core from '@actions/core';
import * as github from '@actions/github';
import { withGitHub } from '@codeware/core';

/**
 * Get a pull request.
 *
 * @param token GitHub token
 * @param pullRequest Pull request number
 * @returns Pull request or `undefined` if not found
 */
export const getPullRequest = async (token: string, pullRequest: number) => {
  const octokit = github.getOctokit(token);

  core.debug(`Get pull request from number #${pullRequest}`);

  const pr = await withGitHub(
    () =>
      octokit.rest.pulls.get({
        ...github.context.repo,
        pull_number: pullRequest
      }),
    'not-found-returns-null'
  );

  if (!pr) {
    core.debug(`Pull request #${pullRequest} could not be found`);
    return undefined;
  }

  return pr.data;
};
