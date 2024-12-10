/**
 * Type-safe environment configuration with Infisical secrets injection
 */

import { withInfisical } from '@codeware/core/secrets';
import { z } from 'zod';

/**
 * Required environment variables
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'preview', 'production']),
  PAYLOAD_API_KEY: z
    .string({ description: 'Payload tenant API key' })
    .min(1, { message: 'PAYLOAD_API_KEY is required' }),
  PAYLOAD_URL: z
    .string({ description: 'Payload URL' })
    .url({ message: 'PAYLOAD_URL must be a valid URL' }),
  PORT: z.coerce.number({ description: 'Port to run the server on' })
});
type Env = z.infer<typeof EnvSchema>;

//
// Pre-check environment variables as they can be injected from CLI.
// Then there is no reason to connect to Infisical using the SDK.
//
if (!EnvSchema.safeParse(process.env).success) {
  // Get tenant ID, normally from deployment
  let tenantId = process.env.TENANT_ID;
  if (!tenantId) {
    tenantId = 'default';
    console.warn(
      `⚠️ TENANT_ID is not provided, using tenant '${tenantId}' [ TEMP WORKAROUND ]`
    );
  }

  // Connect to Infisical and get the secrets for the tenant into process.env
  await withInfisical({
    environment: process.env.DEPLOY_ENV,
    filter: { path: `/web/tenants/${tenantId}` },
    onConnect: 'inject',
    silent: true,
    site: 'eu'
  });
}

// Validate resolved environment variables
// TODO: Probably want to let errors pass to provide UI error pages
const { success, data: env, error } = EnvSchema.safeParse(process.env);

if (!success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export default env as Env;
