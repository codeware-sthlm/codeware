import {
  type AppDeploymentDetails,
  AppDetailsSchema,
  DeployableAppSchema
} from '@codeware/core/actions-internal';
import { z } from 'zod';

export const ActionInputsSchema = z.object({
  apps: z.array(DeployableAppSchema),
  buildArgs: z.array(z.string()).optional(),
  environment: z.enum(['preview', 'production']).optional(),
  flyApiToken: z.string().optional(),
  flyOrg: z.string().optional(),
  flyTraceCli: z.boolean().optional(),
  flyConsoleLogs: z.boolean().optional(),
  mainBranch: z.string().optional(),
  optOutDepotBuilder: z.boolean().optional(),
  appDetails: AppDetailsSchema.optional(),
  token: z.string().min(1, 'A GitHub token is required')
});

export type { AppDeploymentDetails };
export type ActionInputs = z.infer<typeof ActionInputsSchema>;
