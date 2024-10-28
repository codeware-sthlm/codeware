import * as github from '@actions/github';

export const addPullRequestAssignees = async (
  token: string,
  pullRequest: number,
  assignees: string | Array<string>
): Promise<void> => {
  if (!assignees.length) {
    return;
  }

  const octokit = github.getOctokit(token);

  await octokit.rest.issues.addAssignees({
    ...github.context.repo,
    issue_number: pullRequest,
    assignees: Array.isArray(assignees) ? assignees : [assignees]
  });
};
