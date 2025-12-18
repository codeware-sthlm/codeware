import { z } from 'zod';

export const ActionInputsSchema = z.object({
  mainBranch: z.string(),
  token: z.string(),
  // Infisical configuration for tenant fetching
  infisicalClientId: z.string().optional(),
  infisicalClientSecret: z.string().optional(),
  infisicalProjectId: z.string().optional(),
  infisicalSite: z.enum(['eu', 'us']).optional()
});

export type ActionInputs = z.infer<typeof ActionInputsSchema>;
