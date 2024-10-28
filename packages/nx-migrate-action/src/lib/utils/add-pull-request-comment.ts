import { debug } from '@actions/core';
import * as github from '@actions/github';

export const addPullRequestComment = async (
  token: string,
  pullRequest: number,
  comment: string,
  guard?: 'check-unique'
): Promise<void> => {
  const octokit = github.getOctokit(token);

  if (guard === 'check-unique') {
    const { data: comments } = await octokit.rest.issues.listComments({
      ...github.context.repo,
      issue_number: pullRequest
    });

    if (comments.find((c) => c.body === comment)) {
      debug(`Comment already exists in PR ${pullRequest}: '${comment}'`);
      return;
    }
  }

  await octokit.rest.issues.createComment({
    ...github.context.repo,
    issue_number: pullRequest,
    body: comment
  });
};
