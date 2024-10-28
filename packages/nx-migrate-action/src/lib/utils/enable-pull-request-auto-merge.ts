import * as github from '@actions/github';

import { addPullRequestComment } from './add-pull-request-comment';

export const enablePullRequestAutoMerge = async (
  token: string,
  isMajorUpdate: boolean,
  pullRequest: number
): Promise<void> => {
  const octokit = github.getOctokit(token);

  // Check if auto-merge is available for the repository
  const {
    data: { allow_auto_merge }
  } = await octokit.rest.repos.get({
    ...github.context.repo
  });

  // Skip auto-merge when not allowed
  if (!allow_auto_merge) {
    await addPullRequestComment(
      token,
      pullRequest,
      'Auto-merge is not enabled for this repository',
      'check-unique'
    );
    return;
  }

  // Skip auto-merge for major version updates
  if (isMajorUpdate) {
    await addPullRequestComment(
      token,
      pullRequest,
      'Auto-merge is disabled for major version migrations',
      'check-unique'
    );
    return;
  }

  // Enable auto-merge only possible via request
  await octokit.request({
    ...github.context.repo,
    url: '/repos/{owner}/{repo}/pulls/{pull_number}/auto-merge',
    pull_number: pullRequest,
    merge_method: 'rebase'
  });
};
