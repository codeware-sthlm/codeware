import * as core from '@actions/core';

import { flyEnvironment } from './fly-environment';
import { ActionInputsSchema } from './schemas/action-inputs.schema';
import type { ActionInputs } from './utils/types';

/**
 * Main action function
 */
export async function run(): Promise<void> {
  try {
    const inputs = ActionInputsSchema.parse({
      mainBranch: core.getInput('main-branch'),
      token: core.getInput('token')
    } satisfies ActionInputs);

    core.debug(`Inputs:\n${JSON.stringify(inputs, null, 2)}`);

    // Run fly environment
    const { environment } = await flyEnvironment(inputs);

    // Set action outputs
    core.setOutput('environment', environment);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}
