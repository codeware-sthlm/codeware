import { withEnvVars } from '@codeware/core/zod';
import { z } from 'zod';

/**
 * Infisical tenant schema.
 *
 * Path: `/web/tenants/<tenantKey>`
 *
 * TODO: Name conversion
 */
export const TenantEnvSchema = withEnvVars(
  z.object({
    PAYLOAD_ADMIN_EMAIL: z
      .string({ description: 'Email of a tenant admin user' })
      .email({ message: 'PAYLOAD_ADMIN_EMAIL must be a valid email address' }),
    PAYLOAD_ADMIN_NAME: z
      .string({ description: 'Name of a tenant admin user' })
      .min(1, { message: 'PAYLOAD_ADMIN_NAME is required' }),
    PAYLOAD_ADMIN_PASSWORD: z
      .string({ description: 'Password of a tenant admin user' })
      .min(1, { message: 'PAYLOAD_ADMIN_PASSWORD is required' }),
    PAYLOAD_API_DESCRIPTION: z
      .string({ description: 'Description of the tenant' })
      .optional(),
    PAYLOAD_API_HOST: z
      .string({ description: 'Client host for the tenant' })
      .min(1, { message: 'PAYLOAD_API_HOST is required' }),
    PAYLOAD_API_KEY: z
      .string({ description: 'API key for tenant' })
      .min(1, { message: 'PAYLOAD_API_KEY is required' }),
    PAYLOAD_API_NAME: z
      .string({ description: 'Name of the tenant' })
      .min(1, { message: 'PAYLOAD_API_NAME is required' })
  })
);

export type TenantEnv = z.infer<typeof TenantEnvSchema>;
