import { z } from 'zod';

export const GitHubConfigSchema = z.object({
  deploy: z.boolean(),
  flyConfig: z.string().regex(/fly\.toml$/, 'fly.toml file is required')
});

export type GitHubConfig = z.infer<typeof GitHubConfigSchema>;
