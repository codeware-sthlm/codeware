import { coerceBoolean, withEnvVars } from '@codeware/shared/util/zod';
import { z } from 'zod';

import { EtherealSchema } from './ethereal.schema';
import { S3StorageSchema } from './s3-storage.schema';
import { SeedSourceSchema } from './seed-source.schema';
import { SeedStrategySchema } from './seed-strategy.schema';
import { SendGridSchema } from './sendgrid.schema';
import { SentrySchema } from './sentry.schema';

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

      // Tenant deployment (optional - only present when deployed for a specific tenant)
      TENANT_ID: z
        .string({ description: 'Tenant identifier for site deployments' })
        .optional(),
      PAYLOAD_API_KEY: z
        .string({ description: 'Tenant API key for site deployments' })
        .optional(),

      // URL configuration (opinionated and custom)
      FLY_URL: z
        .string({ description: 'Auto-generated Fly.io app URL' })
        .url()
        .optional(),
      CUSTOM_URL: z
        .string({ description: 'Custom domain URL for the application' })
        .url()
        .optional(),

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
      PAYLOAD_URL: z
        .string({ description: 'URL to the Payload CMS instance' })
        .min(1, { message: 'PAYLOAD_URL is required' }),

      // App deployment type (platform for multi-tenant admin, tenant for single-tenant client)
      APP_TYPE: z
        .enum(['platform', 'tenant'])
        .default('tenant')
        .describe(
          'Run app as cms host admin (platform) or single-tenant client (tenant)'
        ),

      // Api key request verification
      SIGNATURE_SECRET: z
        .string({ description: 'Secret key for API request signatures' })
        .optional(),

      // Seed configuration
      SEED_DATA_URL: z
        .string({ description: 'URL to public seed data files' })
        .optional(),
      SEED_SOURCE: SeedSourceSchema.default('cloud-local'),
      SEED_STRATEGY: SeedStrategySchema.default('delta'),

      // Internal
      DISABLE_DB_PUSH: coerceBoolean(false).describe(
        'Disable database schema push in development'
      ),
      NX_TASK_TARGET_TARGET: z
        .string({
          description:
            'NX environment variable set to the project target that run'
        })
        .default('')
    })
    // S3 storage is optional
    .merge(S3StorageSchema.partial())
    // Ethereal is optional
    .merge(EtherealSchema.partial())
    // SendGrid is optional
    .merge(SendGridSchema.partial())
    // Sentry is optional
    .merge(SentrySchema.partial())
    // Refine to validate SIGNATURE_SECRET when APP_TYPE is platform
    .refine(
      (data) => {
        // When app type is platform (headless CMS host), SIGNATURE_SECRET is required
        if (data.APP_TYPE === 'platform' && !data.SIGNATURE_SECRET) {
          return false;
        }
        return true;
      },
      {
        message: 'SIGNATURE_SECRET is required when APP_TYPE is platform',
        path: ['SIGNATURE_SECRET']
      }
    )
).transform(
  ({
    ETHEREAL_FROM_ADDRESS,
    ETHEREAL_FROM_NAME,
    ETHEREAL_HOST,
    ETHEREAL_PASSWORD,
    ETHEREAL_PORT,
    ETHEREAL_USERNAME,
    S3_ACCESS_KEY_ID,
    S3_BUCKET,
    S3_ENDPOINT,
    S3_FORCE_PATH_STYLE,
    S3_REGION,
    S3_SECRET_ACCESS_KEY,
    SENDGRID_API_KEY,
    SENDGRID_FROM_ADDRESS,
    SENDGRID_FROM_NAME,
    SENTRY_DSN,
    SENTRY_ORG,
    SENTRY_RELEASE,
    ...env
  }) => ({
    ...env,
    // Transform to storage object if S3 access key id is provided
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
      : undefined,
    EMAIL:
      // Transform to sendgrid object if sendgrid api key is provided
      SENDGRID_API_KEY
        ? {
            sendgrid: {
              apiKey: SENDGRID_API_KEY,
              defaultFromAddress: String(SENDGRID_FROM_ADDRESS),
              defaultFromName: String(SENDGRID_FROM_NAME)
            }
          }
        : // Transform to ethereal object if ethereal credentials are provided
          ETHEREAL_USERNAME && ETHEREAL_PASSWORD
          ? {
              ethereal: {
                defaultFromAddress: String(ETHEREAL_FROM_ADDRESS),
                defaultFromName: String(ETHEREAL_FROM_NAME),
                host: String(ETHEREAL_HOST),
                port: Number(ETHEREAL_PORT),
                user: ETHEREAL_USERNAME,
                pass: ETHEREAL_PASSWORD
              }
            }
          : undefined,
    SENTRY:
      SENTRY_DSN && SENTRY_ORG
        ? {
            dsn: SENTRY_DSN,
            org: SENTRY_ORG,
            release: SENTRY_RELEASE
          }
        : undefined
  })
);

export type Env = z.infer<typeof EnvSchema>;
