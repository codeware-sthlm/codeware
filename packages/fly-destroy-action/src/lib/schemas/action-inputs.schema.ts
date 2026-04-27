import { z } from 'zod';

export const ActionInputsSchema = z.object({
  flyApiToken: z.string().optional(),
  flyTraceCli: z.boolean().optional(),
  flyConsoleLogs: z.boolean().optional(),
  token: z.string().min(1, 'A GitHub token is required')
});

export type ActionInputs = z.infer<typeof ActionInputsSchema>;
