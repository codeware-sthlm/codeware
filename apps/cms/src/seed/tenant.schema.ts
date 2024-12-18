import { z } from 'zod';

/**
 * Tenant environment variables schema.
 */
export const TenantEnvSchema = z.object({
  PAYLOAD_API_DESCRIPTION: z.string({
    description: 'Description of the tenant'
  }),
  PAYLOAD_API_KEY: z
    .string({ description: 'API key for tenant' })
    .min(1, { message: 'PAYLOAD_API_KEY is required' }),
  PAYLOAD_API_NAME: z
    .string({ description: 'Name of the tenant' })
    .min(1, { message: 'PAYLOAD_API_NAME is required' })
});

export type TenantEnv = z.infer<typeof TenantEnvSchema>;

/**
 * Default values for local development.
 */
export const localDevTenant: TenantEnv = {
  PAYLOAD_API_DESCRIPTION: 'Service account for the default tenant',
  PAYLOAD_API_KEY: 'default-tenant-api-key',
  PAYLOAD_API_NAME: 'Default tenant'
};
