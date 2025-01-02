import { withInfisical } from '@codeware/core/secrets';
import { Payload } from 'payload';

import type { Env } from '../../../env-resolver/env.schema';
import { type TenantEnv, TenantEnvSchema } from '../../schemas/tenant.schema';

type Response = {
  /**
   * Tenant keys and their validated secrets
   */
  tenants: Record<string, TenantEnv>;
  /**
   * Total number of tenants fetched from Infisical
   */
  total: number;
};

/**
 * Fetch tenants from Infisical.
 *
 * Every tenant secret is validated before provided to the response.
 *
 * @param env - Resolved environment
 * @param payload - Payload instance
 * @returns Tenant keys and their validated secrets, total is 0 if Infisical is not available
 */
export const fetchTenants = async (
  env: Env,
  payload: Payload
): Promise<Response> => {
  try {
    payload.logger.info('[SEED] Fetching tenants from Infisical');

    // Try to load secrets from Infisical
    const secrets = await withInfisical({
      environment: env.DEPLOY_ENV,
      filter: { path: '/web/tenants', recurse: true },
      silent: true,
      site: 'eu'
    });

    if (!secrets) {
      // Infisical is not available
      return { tenants: {}, total: 0 };
    }

    // Group secrets by tenant, identified by the path `/web/tenants/<tenantKey>`
    const tenants = secrets.reduce(
      (acc, secret) => {
        const { secretKey, secretValue, secretPath = '' } = secret;
        const match = secretPath.match(/^\/web\/tenants\/(.*)$/);

        if (!match) {
          payload.logger.warn(
            `[SEED] Infisical path '${secretPath}' is not a tenant, skip`
          );
          return acc;
        }

        // Add secret to the tenant
        const tenantKey = match[1];
        acc[tenantKey] = {
          ...acc[tenantKey],
          [secretKey]: secretValue
        };

        return acc;
      },
      {} as Record<string, TenantEnv>
    );

    const validTenants: Record<string, TenantEnv> = {};

    // Ensure tenant secrets are valid
    for (const tenantKey in tenants) {
      const tenantApi = TenantEnvSchema.safeParse(tenants[tenantKey]);

      if (!tenantApi.success) {
        payload.logger.info(tenantApi.error.message);
        payload.logger.info(tenantApi.error.flatten().fieldErrors);
        payload.logger.warn(
          `[SEED] SKIP: Tenant '${tenantKey}' has invalid data from Infisical`
        );
        continue;
      }

      validTenants[tenantKey] = tenantApi.data;
    }

    const valid = Object.keys(validTenants).length;
    const total = Object.keys(tenants).length;

    payload.logger.info(`[SEED] Fetched ${valid}/${total} valid tenants`);

    return { tenants: validTenants, total };
  } catch (error) {
    payload.logger.error(error);
    throw '[SEED] Something broke while fetching tenants from Infisical';
  }
};
