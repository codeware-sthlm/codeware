import * as core from '@actions/core';

import { preDeploy } from './pre-deploy';
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
      mainBranch: core.getInput('main-branch'),
      token: core.getInput('token'),
      infisicalClientId: core.getInput('infisical-client-id') || undefined,
      infisicalClientSecret:
        core.getInput('infisical-client-secret') || undefined,
      infisicalProjectId: core.getInput('infisical-project-id') || undefined,
      infisicalSite: (core.getInput('infisical-site') ||
        undefined) as ActionInputs['infisicalSite'],
      manualApp: core.getInput('manual-app') || undefined,
      manualTenant: core.getInput('manual-tenant') || undefined,
      manualEnvironment: (core.getInput('manual-environment') ||
        undefined) as ActionInputs['manualEnvironment']
    } satisfies ActionInputs);

    core.debug(`Inputs:\n${JSON.stringify(inputs, null, 2)}`);

    const { apps, environment, appTenants } = await preDeploy(inputs);

    // Set the deploy environment variable
    core.exportVariable('DEPLOY_ENV', environment);

    // Set action outputs
    core.setOutput('apps', apps);
    core.setOutput('environment', environment);
    core.setOutput('app-tenants', JSON.stringify(appTenants));
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}
