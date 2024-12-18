/**
 * Type-safe environment configuration with Infisical secrets injection
 */

import { withInfisical } from '@codeware/core/secrets';

import { type Env, EnvSchema } from './env.schema';

let resolvedEnv: Env;

// Pre-check environment variables as they can be injected from CLI.
// Then there is no reason to connect to Infisical using the SDK.
const response = EnvSchema.safeParse(process.env);
if (response.success) {
  resolvedEnv = response.data;
} else {
  // Connect to Infisical and get the secrets for the tenant into process.env
  await withInfisical({
    environment: process.env.DEPLOY_ENV,
    filter: { path: `/web/tenants/${process.env.TENANT_ID}` },
    injectEnv: true,
    silent: true,
    site: 'eu'
  });

  // Validate resolved environment variables
  // TODO: Probably want to let errors pass to provide UI error pages
  const { success, data, error } = EnvSchema.safeParse(process.env);

  if (!success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));
    process.exit(1);
  }

  resolvedEnv = data;
}

export default resolvedEnv;
