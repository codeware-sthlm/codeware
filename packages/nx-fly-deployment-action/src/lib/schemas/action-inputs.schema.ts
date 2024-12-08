import { z } from 'zod';

export const ActionInputsSchema = z.object({
  flyApiToken: z.string(),
  flyOrg: z.string(),
  flyRegion: z.string(),
  mainBranch: z.string(),
  token: z.string().min(1, 'A GitHub token is required')
});

export type ActionInputs = z.infer<typeof ActionInputsSchema>;
