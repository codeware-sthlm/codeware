import {
  type AppDeploymentDetails,
  AppDetailsSchema,
  DeployableAppSchema,
  EnvironmentSchema
} from '@codeware/core/actions-internal';
import { z } from 'zod';

export const ActionInputsSchema = z.object({
  apps: z.array(DeployableAppSchema),
  env: z.array(z.string()).optional(),
  environment: EnvironmentSchema,
  flyApiToken: z.string().optional(),
  flyOrg: z.string().optional(),
  flyRegion: z.string().optional(),
  flyTraceCli: z.boolean().optional(),
  flyConsoleLogs: z.boolean().optional(),
  images: z.record(z.string(), z.string()).optional(),
  optOutDepotBuilder: z.boolean().optional(),
  secrets: z.array(z.string()).optional(),
  appDetails: AppDetailsSchema.optional(),
  token: z.string().min(1, 'A GitHub token is required')
});

export type { AppDeploymentDetails };
export type ActionInputs = z.infer<typeof ActionInputsSchema>;
