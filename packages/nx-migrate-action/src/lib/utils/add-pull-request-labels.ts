import * as github from '@actions/github';
import { withGitHub } from '@cx/core';

export const addPullRequestLabels = async (
  token: string,
  pullRequest: number,
  labels: string | Array<string>
): Promise<void> => {
  const octokit = github.getOctokit(token);

  await withGitHub(() =>
    octokit.rest.issues.addLabels({
      ...github.context.repo,
      issue_number: pullRequest,
      labels: Array.isArray(labels) ? labels : [labels]
    })
  );
};
