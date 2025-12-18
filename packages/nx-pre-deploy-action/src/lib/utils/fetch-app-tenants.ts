import * as core from '@actions/core';
import { withInfisical } from '@codeware/shared/feature/infisical';

import type { InfisicalConfig } from '../schemas/config.schema';
export type AppTenantDetails = {
  tenant: string;
  env?: Record<string, string>;
  secrets?: Record<string, string>;
};

export type AppTenantsMap = {
  [appName: string]: AppTenantDetails[];
};

/**
 * Fetch tenant configuration for apps from Infisical.
 *
 * This function connects to Infisical and discovers which tenants use which apps
 * by scanning the `/tenants/<tenant-id>/apps/<app-name>/` folder structure.
 *
 * Expected Infisical structure:
 * - `/tenants/<tenant-id>/apps/<app-name>/...` = tenant-app-specific secrets (PUBLIC_URL, CMS_URL, etc.)
 * - `/apps/<app-name>/*` = app-level secrets (non-tenant-specific)
 *
 * Example:
 * - `/tenants/tenant1/apps/web/PUBLIC_URL = "https://tenant1.example.com"`
 * - `/tenants/tenant1/apps/web/CMS_URL = "https://cms.example.com"`
 * - `/tenants/tenant2/apps/web/PUBLIC_URL = "https://custom-domain.com"`
 * - `/apps/cms/DATABASE_URL = "..."` (cms is not multi-tenant)
 *
 * @param config - Infisical configuration
 * @param appNames - List of app names to fetch tenant configuration for
 * @returns Map of app names to their tenants' deployment details
 */
export async function fetchAppTenants(
  { environment, clientId, clientSecret, projectId, site }: InfisicalConfig,
  appNames: string[]
): Promise<AppTenantsMap> {
  const appTenantsMap: AppTenantsMap = {};

  if (appNames.length === 0) {
    core.info('[fetch-app-tenants] No apps provided, skipping tenant fetch');
    return appTenantsMap;
  }

  try {
    const folderSecrets = await withInfisical({
      clientId,
      clientSecret,
      projectId,
      site,
      environment,
      filter: {
        path: '/tenants',
        recurse: true
      },
      groupByFolder: true
    });

    core.info('[fetch-app-tenants] Connected successfully');
    core.info(
      '[fetch-app-tenants] Discovering tenant-app relationships from /tenants/ structure...'
    );

    // Initialize all apps with empty arrays (single-tenant by default)
    for (const appName of appNames) {
      appTenantsMap[appName] = [];
    }

    if (folderSecrets && folderSecrets.length > 0) {
      core.info(
        `[fetch-app-tenants] Found ${folderSecrets.length} folder(s) under /tenants/`
      );

      // Parse folder paths to discover tenant-app relationships
      // Expected pattern: /tenants/<tenant-id>/apps/<app-name>
      const tenantAppPattern = /^\/tenants\/([^/]+)\/apps\/([^/]+)$/;

      for (const folder of folderSecrets) {
        const match = folder.path.match(tenantAppPattern);

        if (!match) {
          // Not a tenant-app folder, skip
          continue;
        }

        const [, tenantId, appName] = match;

        // Only track tenants for apps we care about
        if (!appNames.includes(appName)) {
          continue;
        }

        // Check if tenant already exists for this app
        const existingTenant = appTenantsMap[appName].find(
          (t) => t.tenant === tenantId
        );

        if (!existingTenant) {
          // Parse secrets and classify by metadata
          const env: Record<string, string> = {};
          const secrets: Record<string, string> = {};

          // Distribute secrets based on 'env' metadata
          for (const secret of folder.secrets) {
            const isEnvVar = secret.secretMetadata.some(
              (meta) => meta['env'] === true
            );
            const target = isEnvVar ? env : secrets;
            target[secret.secretKey] = secret.secretValue;
          }

          const envCount = Object.keys(env).length;
          const secretsCount = Object.keys(secrets).length;

          appTenantsMap[appName].push({
            tenant: tenantId,
            ...(envCount > 0 && { env }),
            ...(secretsCount > 0 && { secrets })
          });

          core.info(
            `[fetch-app-tenants] Discovered: tenant '${tenantId}' uses app '${appName}' (${envCount} env, ${secretsCount} secrets)`
          );
        }
      }

      // Sort tenant lists by tenant name for consistent output
      for (const appName of appNames) {
        appTenantsMap[appName].sort((a, b) => a.tenant.localeCompare(b.tenant));
      }
    } else {
      // No folders found, treat all apps as single-tenant
      core.info(
        '[fetch-app-tenants] No tenant structure found, treating all apps as single-tenant'
      );
    }

    const totalTenants = Object.values(appTenantsMap).flat().length;
    const multiTenantApps = Object.entries(appTenantsMap).filter(
      ([, tenants]) => tenants.length > 0
    );

    core.info('[fetch-app-tenants] Configuration summary:');
    for (const [appName, tenantDetails] of Object.entries(appTenantsMap)) {
      if (tenantDetails.length > 0) {
        const tenantNames = tenantDetails.map((t) => t.tenant).join(', ');
        core.info(
          `  - ${appName}: ${tenantDetails.length} tenant(s) [${tenantNames}]`
        );
      } else {
        core.info(`  - ${appName}: single-tenant (no multi-tenancy)`);
      }
    }
    core.info(
      `[fetch-app-tenants] Total: ${multiTenantApps.length} multi-tenant app(s), ${totalTenants} tenant deployment(s)`
    );

    return appTenantsMap;
  } catch (error) {
    if (error instanceof Error) {
      core.error(`[fetch-app-tenants] Error: ${error.message}`);
      if (error.cause) {
        core.error(`[fetch-app-tenants] Cause: ${JSON.stringify(error.cause)}`);
      }
    } else {
      core.error(`[fetch-app-tenants] Unknown error: ${JSON.stringify(error)}`);
    }
    throw error;
  }
}
