import { withEnvVars } from '@codeware/shared/util/zod';
import { z } from 'zod';

/**
 * Required environment variables
 */
export const EnvSchema = z.object({
  // Standard Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']),

  // Injected at deployment
  DEPLOY_ENV: z.enum(['development', 'preview', 'production']),
  TENANT_ID: z
    .string({ description: 'Application identifier' })
    .min(1, { message: 'TENANT_ID is required' }),

  // Loaded at run-time
  PAYLOAD_API_KEY: z
    .string({ description: 'Payload tenant API key' })
    .min(1, { message: 'PAYLOAD_API_KEY is required' }),
  // Replace `{PR_NUMBER}` with the current PR number when possible
  PAYLOAD_URL: withEnvVars(
    z.string({ description: 'Fully qualified URL to the Payload app host' })
    //.url({ message: 'PAYLOAD_URL must be a valid URL' })
  ),
  PORT: z.coerce.number({ description: 'Port to run the server on' }),
  SIGNATURE_SECRET: z
    .string({ description: 'Secret key for API request signatures' })
    .min(1, {
      message: 'SIGNATURE_SECRET is required'
    }),
  DEBUG: z
    .string({ description: 'Debug mode' })
    .transform((d) => d === 'true')
    .default('false')
});

export type Env = z.infer<typeof EnvSchema>;
