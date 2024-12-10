import { z } from 'zod';

/**
 * Infisical client credentials from environment variables
 */
export const ClientSchema = z.object({
  INFISICAL_CLIENT_ID: z
    .string({ description: 'Infisical Machine Client ID' })
    .min(1, 'Environment variable INFISICAL_CLIENT_ID is required'),
  INFISICAL_CLIENT_SECRET: z
    .string({ description: 'Infisical Machine Client Secret' })
    .min(1, 'Environment variable INFISICAL_CLIENT_SECRET is required')
});

/**
 * Infisical project environment values
 */
export const EnvironmentSchema = z.enum(
  ['development', 'preview', 'production'],
  {
    description: 'The environment to get the secrets from'
  }
);

/**
 * Infisical configuration from `.infisical.json`
 */
export const ConfigSchema = z.object({
  workspaceId: z
    .string({
      description: 'The ID of the project to connect to'
    })
    .min(1, {
      message: 'Workspace ID is required'
    }),
  defaultEnvironment: EnvironmentSchema.optional(),
  gitBranchToEnvironmentMapping: z
    .record(z.string(), z.string(), {
      description: 'The mapping of git branches to environments'
    })
    .nullable()
    .optional()
});

export type Client = z.infer<typeof ClientSchema>;
export type Config = z.infer<typeof ConfigSchema>;
export type Environment = z.infer<typeof EnvironmentSchema>;
