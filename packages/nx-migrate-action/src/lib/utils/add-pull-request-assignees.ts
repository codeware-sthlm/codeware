import * as github from '@actions/github';
import { withGitHub } from '@cx/core';

export const addPullRequestAssignees = async (
  token: string,
  pullRequest: number,
  assignees: string | Array<string>
): Promise<void> => {
  if (!assignees.length) {
    return;
  }

  const octokit = github.getOctokit(token);

  await withGitHub(() =>
    octokit.rest.issues.addAssignees({
      ...github.context.repo,
      issue_number: pullRequest,
      assignees: Array.isArray(assignees) ? assignees : [assignees]
    })
  );
};
