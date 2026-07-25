import * as github from '@actions/github';

import { withGitHub } from './with-github';

/**
 * Add a comment to a pull request.
 *
 * @param token - The GitHub token
 * @param pullRequest - The pull request number
 * @param comment - The comment to add
 * @returns The comment ID
 * @throws If the comment cannot be added
 */
export const addPullRequestComment = async (
  token: string,
  pullRequest: number,
  comment: string
): Promise<number> => {
  const octokit = github.getOctokit(token);

  const {
    data: { id }
  } = await withGitHub(() =>
    octokit.rest.issues.createComment({
      ...github.context.repo,
      issue_number: pullRequest,
      body: comment
    })
  );

  return id;
};
