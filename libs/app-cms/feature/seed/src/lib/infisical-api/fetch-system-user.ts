import { withInfisical } from '@codeware/shared/feature/infisical';
import { Payload } from 'payload';

import {
  type SystemAdminEnv,
  SystemAdminEnvSchema
} from '../schemas/system-admin.schema';

/**
 * Fetch a system user from Infisical.
 *
 * @param payload - Payload instance
 * @param environment - Current environment
 * @returns System user details
 */
export const fetchSystemUser = async (
  payload: Payload,
  environment: string
): Promise<SystemAdminEnv | null> => {
  payload.logger.debug('Try to fetch system user from Infisical');

  // Try to load secrets from Infisical
  const secrets = await withInfisical({
    environment,
    filter: { path: '/cms' },
    silent: true
  });

  if (!secrets) {
    // Infisical is not available
    return null;
  }

  if (!secrets.length) {
    throw 'No system user found in Infisical';
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
    throw 'System user has invalid data from Infisical';
  }

  payload.logger.info('System user fetched from Infisical');

  return response.data;
};
