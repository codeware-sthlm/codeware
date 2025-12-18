import * as core from '@actions/core';
import * as github from '@actions/github';
import { getDeployEnv, printGitHubContext } from '@codeware/core/actions';
import { analyzeAppsToDeploy } from '@codeware/core/actions-internal';

import type { ActionInputs } from './schemas/action-inputs.schema';
import {
  type ActionOutputs,
  ActionOutputsSchema,
  type Environment
} from './schemas/action-outputs.schema';
import type { InfisicalConfig } from './schemas/config.schema';
import { fetchAppTenants } from './utils/fetch-app-tenants';
import { fetchDeployRules } from './utils/fetch-deploy-rules';
import { filterByDeployRules } from './utils/filter-by-deploy-rules';
import { normalizeInputs } from './utils/normailze-inputs';

/**
 * Run pre-deploy process
 *
 * @param inputs Options
 * @param throwOnError Whether to throw on error
 */
export async function preDeploy(
  inputs: ActionInputs,
  throwOnError = false
): Promise<ActionOutputs> {
  try {
    let environment: Environment = '';

    core.info('Starting pre-deploy process');

    core.startGroup('GitHub context details');
    printGitHubContext();
    core.endGroup();

    core.startGroup('Get normalized configuration');
    const config = await normalizeInputs(inputs);
    core.endGroup();

    core.startGroup('Analyze environment');
    const response = getDeployEnv(github.context, config.mainBranch);
    if (response.environment) {
      environment = response.environment;
    } else {
      core.warning(response.reason);
    }
    core.info(`Deploy to environment: ${environment || '<none>'}`);
    core.endGroup();

    core.startGroup('Determine applications to deploy');
    const apps = (await analyzeAppsToDeploy())
      .filter((apps) => {
        if (apps.status === 'deploy') {
          core.info(`Deploy: ${apps.projectName}`);
          return true;
        } else {
          core.info(`Skip: ${apps.projectName} - ${apps.reason}`);
          return false;
        }
      })
      .map((app) => app.projectName);
    core.endGroup();

    core.info(`Applications to deploy: ${apps.join(', ') || '<none>'}`);

    if (!config.infisical) {
      core.info(
        'Infisical configuration not provided, skipping tenant fetching'
      );
      return ActionOutputsSchema.parse({ apps, environment, appTenants: {} });
    }

    // Fetch app-specific tenant configuration from Infisical if credentials are provided
    if (!environment) {
      core.info('Skipping tenant fetching (no valid environment)');
      return ActionOutputsSchema.parse({ apps, environment, appTenants: {} });
    }

    if (apps.length === 0) {
      core.info('Skipping tenant fetching (no apps to deploy)');
      return ActionOutputsSchema.parse({ apps, environment, appTenants: {} });
    }

    core.startGroup('Fetch app-specific tenant configuration from Infisical');

    const { clientId, clientSecret, projectId, site } = config.infisical;

    const infisicalConfig: InfisicalConfig = {
      environment,
      clientId,
      clientSecret,
      projectId,
      site
    };

    // Fetch deployment rules
    const deployRules = await fetchDeployRules(infisicalConfig);

    // Fetch all tenant-app relationships
    const allAppTenants = await fetchAppTenants(infisicalConfig, apps);

    // Apply deployment rules to filter tenants
    const appTenants = filterByDeployRules(allAppTenants, deployRules);

    // Number of tenants per app for logging
    const appsCount = Object.entries(appTenants).reduce(
      (aggr, [app, tenants]) => aggr.set(app, tenants.length),
      new Map<string, number>()
    );

    core.info(
      `Multi-tenant apps: ${Array.from(appsCount)
        .filter(([, count]) => count)
        .map(([app, count]) => `${app} (${count})`)
        .join(', ')}`
    );
    core.info(
      `Single-tenant apps: ${Array.from(appsCount)
        .filter(([, count]) => !count)
        .map(([app]) => app)
        .join(', ')}`
    );
    core.endGroup();

    return ActionOutputsSchema.parse({ apps, environment, appTenants });
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
