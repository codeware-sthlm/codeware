import { z } from 'zod';

import { ActionInputsSchema } from './action-inputs.schema';

export const DeploymentConfigSchema = z.object({
  fly: z.object({
    token: z.string().min(1, 'Fly API token is required'),
    org: z.string(),
    region: z.string()
  }),
  mainBranch: z.string().min(1, 'main branch is required'),
  token: ActionInputsSchema.shape.token
});

export type DeploymentConfig = z.infer<typeof DeploymentConfigSchema>;
