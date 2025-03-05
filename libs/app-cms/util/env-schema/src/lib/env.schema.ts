import { withEnvVars } from '@codeware/shared/util/zod';
import { z } from 'zod';

import { S3StorageSchema } from './s3-storage.schema';
import { SeedSourceSchema } from './seed-source.schema';
import { SeedStrategySchema } from './seed-strategy.schema';

/**
 * Environment base schema with environment variable lookup.
 */
export const EnvSchema = withEnvVars(
  z
    .object({
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
      DISABLE_DB_PUSH: z
        .string({ description: 'Disable database schema push in development' })
        .transform((s) => s.toLowerCase() === 'true')
        .default('false'),
      NX_TASK_TARGET_TARGET: z
        .string({
          description:
            'NX environment variable set to the project target that run'
        })
        .default('')
    })
    // S3 storage is optional
    .merge(S3StorageSchema.partial())
).transform(
  ({
    S3_ACCESS_KEY_ID,
    S3_BUCKET,
    S3_ENDPOINT,
    S3_FORCE_PATH_STYLE,
    S3_REGION,
    S3_SECRET_ACCESS_KEY,
    ...env
  }) => ({
    ...env,
    // Transform to storage object if access key id is provided
    S3_STORAGE: S3_ACCESS_KEY_ID
      ? {
          bucket: String(S3_BUCKET),
          endpoint: String(S3_ENDPOINT),
          forcePathStyle: S3_FORCE_PATH_STYLE ?? false,
          region: String(S3_REGION),
          credentials: {
            accessKeyId: S3_ACCESS_KEY_ID,
            secretAccessKey: String(S3_SECRET_ACCESS_KEY)
          }
        }
      : undefined
  })
);

export type Env = z.infer<typeof EnvSchema>;
