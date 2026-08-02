import { DeployableAppSchema } from '@codeware/shared/util/nx-deploy';
import { z } from 'zod';

export const ActionInputsSchema = z.object({
  apps: z.array(DeployableAppSchema),
  /** Names of the apps that actually deployed */
  released: z.array(z.string()),
  createRelease: z.boolean(),
  token: z.string().min(1, 'A GitHub token is required')
});

export type ActionInputs = z.infer<typeof ActionInputsSchema>;
