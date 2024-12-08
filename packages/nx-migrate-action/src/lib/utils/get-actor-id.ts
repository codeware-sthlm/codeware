import * as core from '@actions/core';
import * as github from '@actions/github';
import { withGitHub } from '@codeware/core/actions';

/**
 * Get actor id from current actor user name.
 *
 * @param token GitHub token
 * @returns Actor id or `undefined` if not found
 */
export const getActorId = async (token: string) => {
  const octokit = github.getOctokit(token);

  const username = github.context.actor;

  core.debug(`Get user from actor '${username}'`);

  const actor = await withGitHub(
    async () =>
      await octokit.rest.users.getByUsername({
        username
      }),
    'not-found-returns-null'
  );

  if (!actor) {
    core.debug(`User '${username}' could not be found`);
    return undefined;
  }

  return actor.data.id;
};
