import * as github from '@actions/github';

export const addPullRequestLabels = async (
  token: string,
  pullRequest: number,
  labels: string | Array<string>
): Promise<void> => {
  const octokit = github.getOctokit(token);

  await octokit.rest.issues.addLabels({
    ...github.context.repo,
    issue_number: pullRequest,
    labels: Array.isArray(labels) ? labels : [labels]
  });
};
