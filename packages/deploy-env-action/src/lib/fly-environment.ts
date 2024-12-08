import * as core from '@actions/core';
import * as github from '@actions/github';
import { getDeployEnv, printGitHubContext } from '@codeware/core/actions';

import { getEnvironmentConfig } from './utils/get-environment-config';
import type { ActionInputs, ActionOutputs, Environment } from './utils/types';

/**
 * Run fly environment process
 *
 * @param inputs Deployment options
 * @param throwOnError Whether to throw on error
 */
export async function flyEnvironment(
  inputs: ActionInputs,
  throwOnError = false
): Promise<ActionOutputs> {
  try {
    let environment: Environment | '' = '';

    core.info('Starting fly environment process');

    core.startGroup('GitHub context details');
    printGitHubContext();
    core.endGroup();

    core.startGroup('Get environment configuration');
    const config = await getEnvironmentConfig(inputs);
    core.endGroup();

    core.startGroup('Analyze event');
    const response = getDeployEnv(github.context, config.mainBranch);
    if (response.environment) {
      environment = response.environment;
    } else {
      core.warning(response.reason);
    }
    core.info(`Environment: ${environment}`);
    core.endGroup();

    return { environment };
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);

      if (throwOnError) {
        throw error.message;
      }
    }

    return {} as ActionOutputs;
  }
}
