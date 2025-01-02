import { withInfisical } from '@codeware/core/secrets';
import { Payload } from 'payload';

import type { Env } from '../../../env-resolver/env.schema';
import {
  type SystemAdminEnv,
  SystemAdminEnvSchema
} from '../../schemas/system-admin.schema';

/**
 * Fetch a system user from Infisical.
 *
 * @param env - Resolved environment
 * @param payload - Payload instance
 * @returns System user details
 */
export const fetchSystemUser = async (
  env: Env,
  payload: Payload
): Promise<SystemAdminEnv | null> => {
  payload.logger.info('[SEED] Fetching system user from Infisical');

  // Try to load secrets from Infisical
  const secrets = await withInfisical({
    environment: env.DEPLOY_ENV,
    filter: { path: '/cms' },
    silent: true,
    site: 'eu'
  });

  if (!secrets) {
    // Infisical is not available
    return null;
  }

  if (!secrets.length) {
    throw '[SEED] No system user found in Infisical';
  }

  // Create a system user object from the secrets
  const systemUser = secrets.reduce(
    (acc, secret) => {
      const { secretKey, secretValue } = secret;
      acc[secretKey] = secretValue;
      return acc;
    },
    {} as Record<string, string>
  );

  const response = SystemAdminEnvSchema.safeParse(systemUser);

  if (!response.success) {
    payload.logger.info(response.error.message);
    payload.logger.info(response.error.flatten().fieldErrors);
    throw '[SEED] System user has invalid data from Infisical';
  }

  payload.logger.info('[SEED] System user fetched from Infisical');

  return response.data;
};
