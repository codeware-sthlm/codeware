import { z } from 'zod';

import { ActionInputsSchema } from './action-inputs.schema';

export const DeploymentConfigSchema = z.object({
  env: z.record(z.string(), z.string()).optional(),
  fly: z.object({
    token: z.string().min(1, 'Fly API token is required'),
    org: z.string(),
    region: z.string(),
    optOutDepotBuilder: z.boolean()
  }),
  mainBranch: z.string().min(1, 'main branch is required'),
  secrets: z.record(z.string(), z.string()).optional(),
  tenants: z.array(z.string()),
  token: ActionInputsSchema.shape.token
});

export type DeploymentConfig = z.infer<typeof DeploymentConfigSchema>;
