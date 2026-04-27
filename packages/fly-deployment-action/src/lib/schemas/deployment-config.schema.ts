import {
  AppDetailsSchema,
  DeployableAppSchema
} from '@codeware/core/actions-internal';
import { z } from 'zod';

import { ActionInputsSchema } from './action-inputs.schema';

export const DeploymentConfigSchema = z.object({
  env: z.record(z.string(), z.string()).optional(),
  fly: z.object({
    token: z.string().min(1, 'Fly API token is required'),
    org: z.string(),
    region: z.string(),
    optOutDepotBuilder: z.boolean(),
    traceCLI: z.boolean(),
    consoleLogs: z.boolean()
  }),
  secrets: z.record(z.string(), z.string()).optional(),
  apps: z.array(DeployableAppSchema),
  appDetails: AppDetailsSchema,
  token: ActionInputsSchema.shape.token
});

export type DeploymentConfig = z.infer<typeof DeploymentConfigSchema>;
