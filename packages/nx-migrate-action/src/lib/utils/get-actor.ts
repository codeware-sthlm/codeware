import * as core from '@actions/core';
import * as github from '@actions/github';
import { withGitHub } from '@cx/core';

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
    core.info(`No user was found for actor '${username}'`);
    return undefined;
  }

  return actor.data.id;
};