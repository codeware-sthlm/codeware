import { z } from 'zod';

export const ActionInputsSchema = z.object({
  previewLabel: z.string().min(1),
  token: z.string().min(1)
});

export type ActionInputs = z.infer<typeof ActionInputsSchema>;
