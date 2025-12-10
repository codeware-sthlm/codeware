/**
 * Setup file for integration tests
 * Validates environment variables before running tests
 */

import dotenv from 'dotenv';
import isCI from 'is-ci';
import { z } from 'zod';

const IntegrationTestEnvSchema = z
  .object({
    INFISICAL_TEST_PROJECT_ID: z.string().min(1),
    INFISICAL_TEST_CLIENT_ID: z.string().min(1),
    INFISICAL_TEST_CLIENT_SECRET: z.string().min(1),
    INFISICAL_TEST_SITE: z.enum(['eu', 'us']).optional()
  })
  .or(
    z.object({
      INFISICAL_TEST_PROJECT_ID: z.string().min(1),
      INFISICAL_TEST_SERVICE_TOKEN: z.string().min(1),
      INFISICAL_TEST_SITE: z.enum(['eu', 'us']).optional()
    })
  );

console.log('🔧 Setting up Infisical integration tests...');

if (!isCI) {
  console.log('💡 Running in local environment, loading env file...');
  const status = dotenv.config({ path: `${__dirname}/../.env.test.local` });
  if (status.error) {
    console.warn(
      '⚠️  .env.test.local file not found. Make sure to create it for local testing.'
    );
  }
}

// Validate environment
const envValidation = IntegrationTestEnvSchema.safeParse(process.env);

if (!envValidation.success) {
  console.error(
    `❌ Missing required environment variables for integration tests
Required: INFISICAL_TEST_PROJECT_ID
And either:
  - INFISICAL_TEST_CLIENT_ID + INFISICAL_TEST_CLIENT_SECRET
  - INFISICAL_TEST_SERVICE_TOKEN
Optional: INFISICAL_TEST_SITE (eu or us)
Errors:
${JSON.stringify(envValidation.error.flatten().fieldErrors, null, 2)}
`
  );
  process.exit(1);
}

const testEnv = envValidation.data;

// Map test env vars to expected format
if ('INFISICAL_TEST_SERVICE_TOKEN' in testEnv) {
  process.env['INFISICAL_SERVICE_TOKEN'] = testEnv.INFISICAL_TEST_SERVICE_TOKEN;
} else {
  process.env['INFISICAL_CLIENT_ID'] = testEnv.INFISICAL_TEST_CLIENT_ID;
  process.env['INFISICAL_CLIENT_SECRET'] = testEnv.INFISICAL_TEST_CLIENT_SECRET;
}
process.env['INFISICAL_PROJECT_ID'] = testEnv.INFISICAL_TEST_PROJECT_ID;
process.env['INFISICAL_SITE'] = testEnv.INFISICAL_TEST_SITE;
