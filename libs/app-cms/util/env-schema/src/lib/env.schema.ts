import { coerceBoolean, withEnvVars } from '@codeware/shared/util/zod';
import { z } from 'zod';

import { EtherealSchema } from './ethereal.schema';
import { S3StorageSchema } from './s3-storage.schema';
import { SeedSourceSchema } from './seed-source.schema';
import { SeedStrategySchema } from './seed-strategy.schema';
import { SendGridSchema } from './sendgrid.schema';
import { SentrySchema } from './sentry.schema';

type AppModeCommon = {
  /** Fully qualified URL to the cms app */
  serverURL: string;
};
type AppModeHost = AppModeCommon & { type: 'host'; signatureSecret: string };
type AppModeTenant = AppModeCommon & {
  type: 'tenant';
  apiKey: string;
  tenantId: string;
};

/**
 * Environment base schema with environment variable lookup.
 */
export const EnvSchema = withEnvVars(
  z
    .object({
      // Environment (injected by deployment action)
      APP_NAME: z.string({ description: 'Name of the application' }),
      DEPLOY_ENV: z.enum(['development', 'preview', 'production']),
      FLY_URL: z.string({ description: 'Auto-generated Fly.io app URL' }),
      PR_NUMBER: z.string({ description: 'Number of the pull request' }),

      // Tenant deployment (optional - only present when deployed for a specific tenant)
      TENANT_ID: z
        .string({ description: 'Tenant identifier for site deployments' })
        .optional(),
      PAYLOAD_API_KEY: z
        .string({ description: 'Tenant API key for site deployments' })
        .optional(),

      // Custom URL
      CUSTOM_URL: z
        .string({ description: 'Custom domain URL for the application' })
        .url()
        .or(z.literal(''))
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
        .string({
          description: 'Fallback URL to the Payload CMS instance'
        })
        .optional()
        .default('http://localhost:3000'),

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
        .enum(['build', 'dev', 'gen', 'lint', 'payload', 'serve', 'test'], {
          description:
            'NX environment variable set to the project target that run'
        })
        .or(z.literal(''))
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
    // SIGNATURE_SECRET is required for non-tenant deployments (CMS host)
    .refine(
      (data) => {
        if (!data.TENANT_ID && !data.SIGNATURE_SECRET) {
          return false;
        }
        return true;
      },
      {
        message:
          'SIGNATURE_SECRET is required for CMS host (TENANT_ID is not specified)',
        path: ['SIGNATURE_SECRET']
      }
    )
    // PAYLOAD_API_KEY is required for tenant deployments
    .refine(
      (data) => {
        if (data.DEPLOY_ENV === 'development') {
          // In development, PAYLOAD_API_KEY is optional since it can be resolved from seed data
          return true;
        }
        if (data.TENANT_ID && !data.PAYLOAD_API_KEY) {
          return false;
        }
        return true;
      },
      {
        message:
          'PAYLOAD_API_KEY is required for tenant mode (TENANT_ID is specified)',
        path: ['PAYLOAD_API_KEY']
      }
    )
).transform(
  // Transform environment variables to internal and structured format
  ({
    CUSTOM_URL,
    ETHEREAL_FROM_ADDRESS,
    ETHEREAL_FROM_NAME,
    ETHEREAL_HOST,
    ETHEREAL_PASSWORD,
    ETHEREAL_PORT,
    ETHEREAL_USERNAME,
    FLY_URL,
    NX_TASK_TARGET_TARGET,
    PAYLOAD_API_KEY,
    PAYLOAD_URL,
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
    SIGNATURE_SECRET,
    TENANT_ID,
    ...env
  }) => ({
    ...env,
    /**
     * How the cms app is configured and running.
     * Either as cms host (`host`) or tenant-scoped client (`tenant`).
     */
    APP_MODE: TENANT_ID
      ? ({
          type: 'tenant',
          serverURL: CUSTOM_URL || FLY_URL || PAYLOAD_URL,
          apiKey: PAYLOAD_API_KEY ?? '', // guarded by related refine above
          tenantId: TENANT_ID
        } satisfies AppModeTenant)
      : ({
          type: 'host',
          serverURL: CUSTOM_URL || FLY_URL || PAYLOAD_URL,
          signatureSecret: SIGNATURE_SECRET ?? '' // guarded by related refine above
        } satisfies AppModeHost),
    // Expose Fly url for e.g. dynamic cors configuration
    FLY_URL,
    // Rename to declarative variable for easier use in codebase
    NX_RUN_TARGET: NX_TASK_TARGET_TARGET ?? '',
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
