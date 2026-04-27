import {
  AppDetailsSchema,
  DeployableAppSchema
} from '@codeware/core/actions-internal';
import { z } from 'zod';

import { ActionInputsSchema } from './action-inputs.schema';

export const BuildConfigSchema = z.object({
  buildArgs: z.record(z.string(), z.string()).optional(),
  fly: z.object({
    token: z.string().min(1, 'Fly API token is required'),
    org: z.string(),
    optOutDepotBuilder: z.boolean(),
    traceCLI: z.boolean(),
    consoleLogs: z.boolean()
  }),
  mainBranch: z.string().min(1, 'main branch is required'),
  apps: z.array(DeployableAppSchema),
  appDetails: AppDetailsSchema,
  token: ActionInputsSchema.shape.token
});

export type BuildConfig = z.infer<typeof BuildConfigSchema>;
