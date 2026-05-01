import * as github from '@actions/github';

import { withGitHub } from './with-github';

/**
 * Create or update a pull request comment identified by a hidden marker.
 *
 * Searches existing comments for one containing `marker`. If found, updates it
 * in place; otherwise creates a new comment. The marker is prepended as an
 * invisible HTML comment so the rendered output stays clean.
 *
 * @param token - The GitHub token
 * @param pullRequest - The pull request number
 * @param body - The comment body (marker will be prepended automatically)
 * @param marker - A unique string used to identify the managed comment
 * @returns The comment ID
 * @throws If the comment cannot be created or updated
 */
export const upsertPullRequestComment = async (
  token: string,
  pullRequest: number,
  body: string,
  marker: string
): Promise<number> => {
  const octokit = github.getOctokit(token);
  const repo = github.context.repo;
  const markerTag = `<!-- ${marker} -->`;
  const fullBody = `${markerTag}\n${body}`;

  const { data: comments } = await withGitHub(() =>
    octokit.rest.issues.listComments({
      ...repo,
      issue_number: pullRequest,
      per_page: 100
    })
  );

  const existing = comments.find((c) => c.body?.includes(markerTag));

  if (existing) {
    const {
      data: { id }
    } = await withGitHub(() =>
      octokit.rest.issues.updateComment({
        ...repo,
        comment_id: existing.id,
        body: fullBody
      })
    );
    return id;
  }

  const {
    data: { id }
  } = await withGitHub(() =>
    octokit.rest.issues.createComment({
      ...repo,
      issue_number: pullRequest,
      body: fullBody
    })
  );

  return id;
};
