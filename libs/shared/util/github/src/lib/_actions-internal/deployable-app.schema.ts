import { z } from 'zod';

const ResolvedGithubConfigSchema = z.object({
  flyPostgresPreview: z.string().nullish(),
  flyPostgresProduction: z.string().nullish(),
  flyPostgresDatabaseName: z.string().nullish()
});

export const DeployableAppSchema = z.object({
  name: z.string(),
  flyConfigFile: z.string(),
  githubConfig: ResolvedGithubConfigSchema
});

export type DeployableApp = z.infer<typeof DeployableAppSchema>;
