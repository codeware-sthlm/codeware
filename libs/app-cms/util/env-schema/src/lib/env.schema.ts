import { withEnvVars } from '@codeware/shared/util/zod';
import { z } from 'zod';

import { SeedSourceSchema } from './seed-source.schema';
import { SeedStrategySchema } from './seed-strategy.schema';

/**
 * Environment base schema with environment variable lookup.
 */
export const EnvSchema = withEnvVars(
  z.object({
    // Environment (injected by deployment action)
    APP_NAME: z.string({ description: 'Name of the application' }),
    DEPLOY_ENV: z.enum(['development', 'preview', 'production']),
    PR_NUMBER: z.string({ description: 'Number of the pull request' }),

    // Applied by Next.js
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),

    // Payload configuration
    CORS_URLS: z
      .string({ description: 'List of allowed URLs for CORS' })
      .or(z.literal('*'))
      .default('*'),
    CSRF_URLS: z
      .string({
        description:
          'List of allowed URLs to accept cookie-based authentication from'
      })
      .default(''),
    DATABASE_URL: z
      .string({
        description: 'Database connection string including database name'
      })
      .min(1, { message: 'DATABASE_URL is required' }),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    PAYLOAD_SECRET_KEY: z
      .string({ description: 'Payload secret key' })
      .min(1, { message: 'PAYLOAD_SECRET_KEY is required' }),

    // Api key request verification
    SIGNATURE_SECRET: z
      .string({ description: 'Secret key for API request signatures' })
      .min(1, {
        message: 'SIGNATURE_SECRET is required'
      }),

    // Seed configuration
    SEED_SOURCE: SeedSourceSchema.default('cloud-local'),
    SEED_STRATEGY: SeedStrategySchema.default('delta'),

    // Internal
    DISABLE_DB_PUSH: z.coerce
      .boolean({ description: 'Disable database schema push in development' })
      .default(false)
  })
);

export type Env = z.infer<typeof EnvSchema>;
