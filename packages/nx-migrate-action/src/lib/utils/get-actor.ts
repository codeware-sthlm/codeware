import * as github from '@actions/github';

/**
 * Get actor user information.
 *
 * @param token GitHub token
 * @returns Actor user information
 */
export const getActor = async (token: string) => {
  const octokit = github.getOctokit(token);

  const { data } = await octokit.rest.users.getByUsername({
    username: github.context.actor
  });

  return data;
};
