import { withEnvVars } from '@codeware/core/zod';
import { z } from 'zod';

/**
 * Required environment variables
 */
export const EnvSchema = z.object({
  DEPLOY_ENV: z.enum(['development', 'preview', 'production']),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PAYLOAD_API_KEY: z
    .string({ description: 'Payload tenant API key' })
    .min(1, { message: 'PAYLOAD_API_KEY is required' }),
  // Replace `{PR_NUMBER}` with the current PR number when possible
  PAYLOAD_URL: withEnvVars(
    z
      .string({ description: 'Payload URL' })
      .url({ message: 'PAYLOAD_URL must be a valid URL' })
  ),
  PORT: z.coerce.number({ description: 'Port to run the server on' }),
  TENANT_ID: z
    .string({ description: 'Application identifier' })
    .min(1, { message: 'TENANT_ID is required' })
});

export type Env = z.infer<typeof EnvSchema>;
