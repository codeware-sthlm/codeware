import * as core from '@actions/core';
import * as github from '@actions/github';
import { getPullRequest } from '@codeware/core/actions';
import type {
  MutationEnablePullRequestAutoMergeArgs,
  PullRequestMergeMethod
} from '@octokit/graphql-schema';

/**
 * Enable auto-merge for a pull request.
 *
 * Pre-requisite: auto-merge must be enabled in the repository settings.
 *
 * @param token - GitHub token
 * @param pullRequest - The pull request number
 * @param mergeMethod - The merge method to use, defaults to `REBASE`
 */
export const enablePullRequestAutoMerge = async (
  token: string,
  pullRequest: number,
  mergeMethod: PullRequestMergeMethod = 'REBASE'
): Promise<void> => {
  const octokit = github.getOctokit(token);

  // First get the pull request node ID which is required for the mutation
  const pullRequestData = await getPullRequest(token, pullRequest);
  if (!pullRequestData) {
    core.error(
      `Pull request #${pullRequest} could not be found, aborting auto-merge`
    );
    return;
  }

  // Enable auto-merge using GraphQL mutation
  await octokit.graphql<MutationEnablePullRequestAutoMergeArgs>(
    /* GraphQL */ `
      mutation EnablePullRequestAutoMerge(
        $pullRequestId: ID!
        $mergeMethod: PullRequestMergeMethod!
      ) {
        enablePullRequestAutoMerge(
          input: { pullRequestId: $pullRequestId, mergeMethod: $mergeMethod }
        ) {
          pullRequest {
            autoMergeRequest {
              enabledAt
            }
          }
        }
      }
    `,
    {
      pullRequestId: pullRequestData.node_id,
      mergeMethod
    } satisfies MutationEnablePullRequestAutoMergeArgs['input']
  );

  core.info(
    `Auto-merge is enabled for pull request #${pullRequest} with '${mergeMethod}'`
  );
};
