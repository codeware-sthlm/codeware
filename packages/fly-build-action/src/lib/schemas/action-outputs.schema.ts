import { EnvironmentSchema } from '@codeware/shared/util/nx-deploy';
import { z } from 'zod';

export const ActionOutputsSchema = z.object({
  environment: EnvironmentSchema.or(z.null()),
  images: z.record(z.string(), z.string())
});

export type ActionOutputs = z.infer<typeof ActionOutputsSchema>;
