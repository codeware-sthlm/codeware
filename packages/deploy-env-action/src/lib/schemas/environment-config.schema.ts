import { z } from 'zod';

export const EnvironmentConfigSchema = z.object({
  mainBranch: z.string().min(1, 'main branch is required'),
  token: z.string().min(1, 'GitHub token is required')
});
