import * as core from '@actions/core';
import * as github from '@actions/github';

/**
 * Print GitHub context to the console
 * - All string properties (first level)
 * - Repo owner and name
 *
 * Handles errors gracefully when called outside of a GitHub Actions environment.
 */
export const printGitHubContext = () => {
  try {
    core.info('== Repo ==');
    core.info(`- owner: ${github.context.repo.owner}`);
    core.info(`- repo: ${github.context.repo.repo}`);

    core.info('== Misc ==');
    for (const [key, value] of Object.entries(github.context)) {
      if (typeof value === 'string') {
        core.info(`- ${key}: ${value}`);
      }
    }
  } catch (error) {
    core.info(
      `GitHub context details unavailable:\n${error instanceof Error ? error.message : String(error)}`
    );
  }
};
