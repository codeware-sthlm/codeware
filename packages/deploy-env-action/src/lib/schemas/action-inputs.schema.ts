import { z } from 'zod';

export const ActionInputsSchema = z.object({
  mainBranch: z.string(),
  token: z.string()
});
