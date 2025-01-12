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
  ALLOWED_URLS: z
    .string({ description: 'List of allowed URLs for CORS' })
    .or(z.literal('*'))
    .default('*'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  PAYLOAD_SECRET_KEY: z
    .string({ description: 'Payload secret key' })
    .min(1, { message: 'PAYLOAD_SECRET_KEY is required' }),
  PORT: z.coerce
    .number({ description: 'Port to run the server on' })
    .default(3000),
  MIGRATE_FORCE_ACTION: z
    .enum(['migrate', 'recreate', 'default'], {
      description: 'Force a migration action regardsless of the current state'
    })
    .optional(),
  // Current working directory is required in payload.config.ts when using Docker.
  // Since that file is also used for the client side, process.cwd() is not allowed
  // to be used. Instead, we pass it via environment variable.
  CWD: z
    .string({ description: 'Current working directory' })
    .default(process.cwd())
});

export type Env = z.infer<typeof EnvSchema>;
