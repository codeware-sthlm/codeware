import { z } from 'zod';

export const ConfigSchema = z.object({
  mainBranch: z.string().min(1, 'main branch is required'),
  token: z.string().min(1, 'GitHub token is required'),
  infisical: z
    .object({
      clientId: z.string().nonempty('Infisical client ID is required'),
      clientSecret: z.string().nonempty('Infisical client secret is required'),
      projectId: z.string().nonempty('Infisical project ID is required'),
      site: z.enum(['eu', 'us'], {
        message: 'Infisical site must be either "eu" or "us"'
      })
    })
    .optional()
});

export type Config = z.infer<typeof ConfigSchema>;
