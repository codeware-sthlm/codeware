import { z } from 'zod';

/**
 * Infisical system admin schema.
 *
 * Path: `/cms`
 *
 * TODO: Name conversion
 */
export const SystemAdminEnvSchema = z.object({
  SYSTEM_ADMIN_EMAIL: z
    .string({ description: 'Email of a system admin user' })
    .email({ message: 'SYSTEM_ADMIN_EMAIL must be a valid email address' }),
  SYSTEM_ADMIN_NAME: z
    .string({ description: 'Name of a system admin user' })
    .min(1, { message: 'SYSTEM_ADMIN_NAME is required' }),
  SYSTEM_ADMIN_PASSWORD: z
    .string({ description: 'Password of a system admin user' })
    .min(1, { message: 'SYSTEM_ADMIN_PASSWORD is required' })
});

export type SystemAdminEnv = z.infer<typeof SystemAdminEnvSchema>;
