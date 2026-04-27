import * as core from '@actions/core';

import { flyBuild } from './fly-build';
import {
  type ActionInputs,
  ActionInputsSchema
} from './schemas/action-inputs.schema';

/**
 * Main action function
 */
export async function run(): Promise<void> {
  try {
    const appDetailsInput = core.getInput('app-details');
    const appDetails = appDetailsInput ? JSON.parse(appDetailsInput) : {};

    const inputs = ActionInputsSchema.parse({
      apps: JSON.parse(core.getInput('apps') || '[]'),
      buildArgs: core.getMultilineInput('build-args'),
      environment: (core.getInput('environment') ||
        undefined) as ActionInputs['environment'],
      flyApiToken: core.getInput('fly-api-token'),
      flyOrg: core.getInput('fly-org'),
      flyTraceCli: core.getBooleanInput('fly-trace-cli'),
      flyConsoleLogs: core.getBooleanInput('fly-console-logs'),
      mainBranch: core.getInput('main-branch'),
      optOutDepotBuilder: core.getBooleanInput('opt-out-depot-builder'),
      appDetails,
      token: core.getInput('token', { required: true })
    } satisfies ActionInputs);

    core.debug(`Inputs:\n${JSON.stringify(inputs, null, 2)}`);

    const { environment, images } = await flyBuild(inputs);

    core.setOutput('environment', environment);
    core.setOutput('images', JSON.stringify(images));
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}
