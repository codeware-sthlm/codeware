import { type Env, EnvSchema } from '@codeware/app-cms/util/env-schema';
import { withInfisical } from '@codeware/shared/feature/infisical';

/**
 * Load and validate environment variables.
 *
 * When expected data isn't available locally, the function will connect to Infisical
 * and load the secrets into `process.env`.
 *
 * @returns The parsed environment variables or `undefined` if the data is insufficient or invalid.
 */
export const loadEnv = async (): Promise<Env | undefined> => {
  // Pre-check environment variables as they can be injected from CLI.
  // Then there is no reason to connect to Infisical using the SDK.
  const preResponse = EnvSchema.safeParse(process.env);
  if (preResponse.success) {
    console.log(
      '[ENV] Environment variables already loaded, skipping Infisical connection'
    );
    return preResponse.data;
  }

  // Connect to Infisical and get the secrets for the app into process.env
  const statusPath = await withInfisical({
    environment: process.env['DEPLOY_ENV'],
    filter: { path: '/cms' },
    injectEnv: true,
    silent: true,
    site: 'eu'
  });

  // and other required secrets for the cms app
  const statusTag = await withInfisical({
    environment: process.env['DEPLOY_ENV'],
    filter: { tags: ['cms'], recurse: true },
    injectEnv: true,
    silent: true,
    site: 'eu'
  });

  if (!statusPath || !statusTag) {
    console.warn(
      '[ENV] Could not load secrets from Infisical',
      preResponse.error.flatten().fieldErrors
    );
    return;
  }

  // Validate loaded environment variables
  const { success, error, data } = EnvSchema.safeParse(process.env);

  if (!success) {
    console.error('[ENV] Invalid environment variables:');
    console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));
    return;
  }

  return data;
};
