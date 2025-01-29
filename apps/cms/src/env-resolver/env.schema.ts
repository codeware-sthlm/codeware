import {
  SeedSourceSchema,
  SeedStrategySchema
} from '@codeware/shared/data-access/seed';
import { z } from 'zod';

/**
 * Environment base schema without environment variable lookup.
 *
 * Should not be used without `withEnvVars` on server side, only for client side.
 */
export const EnvSchema = z.object({
  // Database
  DATABASE_URL: z
    .string({
      description: 'Database connection string including database name'
    })
    .min(1, { message: 'DATABASE_URL is required' }),

  // Environment (injected by deployment action)
  APP_NAME: z.string({ description: 'Name of the application' }),
  DEPLOY_ENV: z.enum(['development', 'preview', 'production']),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PR_NUMBER: z.string({ description: 'Number of the pull request' }),

  // Server
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
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  PAYLOAD_SECRET_KEY: z
    .string({ description: 'Payload secret key' })
    .min(1, { message: 'PAYLOAD_SECRET_KEY is required' }),
  PORT: z.coerce
    .number({ description: 'Port to run the server on' })
    .default(3000),
  SIGNATURE_SECRET: z
    .string({ description: 'Secret key for API request signatures' })
    .min(1, {
      message: 'SIGNATURE_SECRET is required'
    }),

  // Current working directory is required in payload.config.ts when using Docker.
  // Since that file is also used for the client side, process.cwd() is not allowed
  // to be used. Instead, we pass it via environment variable.
  CWD: z
    .string({ description: 'Current working directory' })
    .default(process.cwd()),
  MIGRATE_ACTION: z
    .enum(['migrate', 'fresh', 'default'], {
      description: 'Force a migration action regardsless of the current state'
    })
    .optional(),
  REQUEST_DEBUG: z.coerce
    .boolean({
      description: 'Print debug log for Express middleware incoming requests'
    })
    .optional(),
  SEED_SOURCE: SeedSourceSchema.default('cloud-local'),
  SEED_STRATEGY: SeedStrategySchema.default('delta')
});

export type Env = z.infer<typeof EnvSchema>;
