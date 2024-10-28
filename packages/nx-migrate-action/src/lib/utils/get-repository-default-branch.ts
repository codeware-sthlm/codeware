import * as github from '@actions/github';

/**
 * Get default branch of the repository.
 *
 * @param token GitHub token
 * @returns Default branch name
 */
export const getRepositoryDefaultBranch = async (
  token: string
): Promise<string> => {
  const octokit = github.getOctokit(token);

  const {
    data: { default_branch }
  } = await octokit.rest.repos.get({
    ...github.context.repo
  });

  return default_branch;
};
