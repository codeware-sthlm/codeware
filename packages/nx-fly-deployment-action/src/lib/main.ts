import * as core from '@actions/core';

import { flyDeployment } from './fly-deployment';
import {
  type ActionInputs,
  ActionInputsSchema
} from './schemas/action-inputs.schema';

/**
 * Main action function
 */
export async function run(): Promise<void> {
  try {
    const inputs = ActionInputsSchema.parse({
      env: core.getMultilineInput('env'),
      flyApiToken: core.getInput('fly-api-token'),
      flyOrg: core.getInput('fly-org'),
      flyRegion: core.getInput('fly-region'),
      mainBranch: core.getInput('main-branch'),
      optOutDepotBuilder: core.getBooleanInput('opt-out-depot-builder'),
      secrets: core.getMultilineInput('secrets'),
      token: core.getInput('token', { required: true })
    } satisfies ActionInputs);

    core.debug(`Inputs:\n${JSON.stringify(inputs, null, 2)}`);

    // Run fly deployment
    const { environment, projects } = await flyDeployment(inputs);

    core.info(
      `Set outputs from response\n${JSON.stringify(projects, null, 2)}`
    );

    // Output: Environment
    core.setOutput('environment', environment);
    // Output: List of destroyed project names
    core.setOutput(
      'destroyed',
      projects.filter((p) => p.action === 'destroy').map((p) => p.app)
    );
    // Output: List of skipped project names
    core.setOutput(
      'skipped',
      projects.filter((p) => p.action === 'skip').map((p) => p.appOrProject)
    );
    // Output: Record of deployed project names and urls
    core.setOutput(
      'deployed',
      projects
        .filter((p) => p.action === 'deploy')
        .reduce((acc, p) => ({ ...acc, [`${p.name}`]: p.url }), {})
    );
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}
