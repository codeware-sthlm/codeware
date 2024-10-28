import * as core from '@actions/core';
import * as github from '@actions/github';

export const printGitHubContext = () => {
  core.startGroup('GitHub context details');

  core.info('== Repo ==');
  core.info(`- owner: ${github.context.repo.owner}`);
  core.info(`- repo: ${github.context.repo.repo}`);

  core.info('== Misc ==');
  for (const [key, value] of Object.entries(github.context)) {
    if (typeof value === 'string') {
      core.info(`- ${key}: ${value}`);
    }
  }

  core.endGroup();
};
