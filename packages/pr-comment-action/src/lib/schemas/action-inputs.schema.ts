import { EnvironmentSchema } from '@codeware/core/actions-internal';
import { z } from 'zod';

export const ActionInputsSchema = z.object({
  pullRequest: z.number().int().positive(),
  environment: EnvironmentSchema,
  deployed: z.record(z.string(), z.string()).optional(),
  failed: z.array(z.string()).optional(),
  token: z.string().min(1, 'A GitHub token is required')
});

export type ActionInputs = z.infer<typeof ActionInputsSchema>;
