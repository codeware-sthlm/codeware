import * as core from '@actions/core';
import * as github from '@actions/github';

/**
 * Print GitHub context to the console
 * - All string properties (first level)
 * - Repo owner and name
 */
export const printGitHubContext = () => {
  core.info('== Repo ==');
  core.info(`- owner: ${github.context.repo.owner}`);
  core.info(`- repo: ${github.context.repo.repo}`);

  core.info('== Misc ==');
  for (const [key, value] of Object.entries(github.context)) {
    if (typeof value === 'string') {
      core.info(`- ${key}: ${value}`);
    }
  }
};
