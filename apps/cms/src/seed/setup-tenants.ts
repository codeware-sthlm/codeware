import { Payload } from 'payload';

import { withInfisical } from '../_workaround/with-infisical';
import { Env } from '../env-resolver/env.schema';

import { ensureTenant } from './ensure-tenant';
import { TenantEnv, TenantEnvSchema, localDevTenant } from './tenant.schema';

/**
 * Load all tenants and their secrets from Infisical
 * and ensure tenants exists and has an API key created.
 *
 * If Infisical is not available, setup local tenant only.
 */
export const setupTenants = async (
  payload: Payload,
  env: Env
): Promise<void> => {
  try {
    payload.logger.info('[SEED] Fetch tenants from Infisical');

    const secrets = await withInfisical({
      environment: env.DEPLOY_ENV,
      filter: { path: '/web/tenants', recurse: true },
      silent: true,
      site: 'eu'
    });

    if (!secrets) {
      payload.logger.warn(
        '[SEED] Could not load secrets from Infisical, setup local tenant only'
      );
      const {
        PAYLOAD_API_DESCRIPTION: description,
        PAYLOAD_API_KEY: apiKey,
        PAYLOAD_API_NAME: name
      } = localDevTenant;

      await ensureTenant(payload, {
        name,
        description,
        apiKey
      });
      return;
    }

    // Group secrets by tenant, identified by the path `/web/tenants/<tenantId>`
    const tenants = secrets.reduce(
      (acc, secret) => {
        const { secretKey, secretValue, secretPath = '' } = secret;
        const match = secretPath.match(/^\/web\/tenants\/(.*)$/);

        if (!match) {
          payload.logger.warn(
            `[SEED] Skip unsupported tenants path '${secretPath}'`
          );
          return acc;
        }

        // Add secret to the tenant
        const tenantId = match[1];
        acc[tenantId] = {
          ...acc[tenantId],
          [secretKey]: secretValue
        };

        return acc;
      },
      {} as Record<string, TenantEnv>
    );

    // Ensure API key exists for each tenant
    for (const tenantName in tenants) {
      const tenantApi = TenantEnvSchema.safeParse(tenants[tenantName]);

      if (!tenantApi.success) {
        payload.logger.error(
          `[SEED] Skip tenant '${tenantName}' with invalid data:`
        );
        payload.logger.info(tenantApi.error.message);
        payload.logger.info(tenantApi.error.flatten().fieldErrors);
        continue;
      }

      const {
        PAYLOAD_API_NAME: name,
        PAYLOAD_API_DESCRIPTION: description,
        PAYLOAD_API_KEY: apiKey
      } = tenantApi.data;

      payload.logger.info(
        `[SEED] Ensure tenant '${tenantName}' exists and has an API key created`
      );
      await ensureTenant(payload, {
        name,
        description,
        apiKey
      });
    }
  } catch (error) {
    console.error(error);
    payload.logger.error('[SEED] Something broke while setting up tenants');
  }
};
