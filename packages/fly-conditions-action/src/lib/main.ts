import * as core from '@actions/core';

import { flyConditions } from './fly-conditions';
import {
  type ActionInputs,
  ActionInputsSchema
} from './schemas/action-inputs.schema';

export async function run(): Promise<void> {
  try {
    const inputs = ActionInputsSchema.parse({
      previewLabel: core.getInput('preview-label', { required: true }),
      token: core.getInput('token', { required: true })
    } satisfies ActionInputs);

    core.debug(`Inputs:\n${JSON.stringify(inputs, null, 2)}`);

    const { skip } = await flyConditions(inputs);

    core.setOutput('skip', skip ? 'true' : 'false');
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}
