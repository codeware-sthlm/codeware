import { withEnvVars } from '@codeware/core/zod';
import { z } from 'zod';

export const GitHubConfigSchema = z.object({
  deploy: z.boolean(),
  flyConfig: z.string().regex(/fly\.toml$/, 'fly.toml file is required'),
  flyPostgresPreview: withEnvVars(
    z
      .string()
      .regex(/^[a-zA-Z0-9_-]*$/, 'flyPostgresPreview pattern is invalid')
      .optional(),
    { throwOnMissing: true, undefinedIsEmpty: true }
  ),
  flyPostgresProduction: withEnvVars(
    z
      .string()
      .regex(/^[a-zA-Z0-9_-]*$/, 'flyPostgresProduction pattern is invalid')
      .optional(),
    { throwOnMissing: true, undefinedIsEmpty: true }
  )
});

export type GitHubConfig = z.infer<typeof GitHubConfigSchema>;
