import * as core from '@actions/core';

import { flyPrComment } from './fly-pr-comment';
import { ActionInputsSchema } from './schemas/action-inputs.schema';

/**
 * Main action function
 */
export async function run(): Promise<void> {
  try {
    const deployedInput = core.getInput('deployed');
    const failedInput = core.getInput('failed');

    const inputs = ActionInputsSchema.parse({
      pullRequest: Number(core.getInput('pull-request', { required: true })),
      environment: core.getInput('environment', { required: true }),
      deployed: deployedInput ? JSON.parse(deployedInput) : undefined,
      failed: failedInput ? JSON.parse(failedInput) : undefined,
      token: core.getInput('token', { required: true })
    });

    core.debug(`Inputs:\n${JSON.stringify(inputs, null, 2)}`);

    await flyPrComment(inputs);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}
