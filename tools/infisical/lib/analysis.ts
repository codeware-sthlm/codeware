import path from 'path';
import { fileURLToPath } from 'url';

import {
  type InfisicalConfig,
  fetchAppTenants,
  fetchDeployRules,
  filterByDeployRules
} from '@codeware/nx-pre-deploy-action';
import {
  type Environment,
  withInfisical
} from '@codeware/shared/feature/infisical';
import * as dotenv from 'dotenv';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

dotenv.config({ path: `${dirname}/../.env.infisical` });

const runForApps = ['cms', 'web'];

(async () => {
  const preDeploy = new Map<
    Environment,
    ReturnType<typeof filterByDeployRules>
  >();
  const appSecrets = new Map<
    Environment,
    Record<string, Record<string, string>>
  >();
  const tenantSecrets = new Map<
    Environment,
    Record<string, Record<string, string>>
  >();

  for (const environment of ['preview', 'production'] satisfies Environment[]) {
    console.log(`\n--- Analyzing for environment: ${environment} ---`);

    const config: InfisicalConfig = {
      environment,
      clientId: process.env.INFISICAL_CLIENT_ID ?? '',
      clientSecret: process.env.INFISICAL_CLIENT_SECRET ?? '',
      projectId: process.env.INFISICAL_PROJECT_ID ?? '',
      site: 'eu'
    };

    try {
      // Fetch deployment rules
      const deployRules = await fetchDeployRules(config);

      // Fetch all tenant-app relationships
      const allAppTenants = await fetchAppTenants(config, runForApps);

      // Apply deployment rules to filter tenants
      const appTenants = filterByDeployRules(allAppTenants, deployRules);

      preDeploy.set(environment, appTenants);

      // Fetch all apps' secrets
      const aggr: Record<string, Record<string, string>> = {};
      for (const app of runForApps) {
        const secrets = await withInfisical({
          ...config,
          filter: { path: `/apps/${app}`, recurse: true }
        });
        aggr[app] = secrets.reduce(
          (acc, { secretKey, secretValue }) => {
            acc[secretKey] = secretValue;
            return acc;
          },
          {} as Record<string, string>
        );
      }
      appSecrets.set(environment, aggr);
    } catch (error) {
      console.error(
        `Error running analysis for ${environment}:\n`,
        error instanceof Error ? error.message : error
      );
    }
  }
  console.log(
    '\n=== Final Results ===\n\nAnalyzed apps:',
    runForApps.join(', ')
  );
  for (const [environment, details] of preDeploy.entries()) {
    console.log(`\n--- Environment: ${environment} ---`);
    console.log(
      'Runtime:\n',
      JSON.stringify(appSecrets.get(environment), null, 2)
    );
    console.log(JSON.stringify(details, null, 2));
  }
})();
