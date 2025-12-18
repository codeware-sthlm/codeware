import { z } from 'zod';

const AppDeploymentDetailsSchema = z.object({
  tenant: z.string().optional(),
  env: z.record(z.string(), z.string()).optional(),
  secrets: z.record(z.string(), z.string()).optional()
});

export const ActionInputsSchema = z.object({
  env: z.array(z.string()),
  flyApiToken: z.string(),
  flyOrg: z.string(),
  flyRegion: z.string(),
  mainBranch: z.string(),
  optOutDepotBuilder: z.boolean(),
  secrets: z.array(z.string()),
  appDetails: z.record(z.string(), z.array(AppDeploymentDetailsSchema)),
  token: z.string().min(1, 'A GitHub token is required')
});

export type AppDeploymentDetails = z.infer<typeof AppDeploymentDetailsSchema>;
export type ActionInputs = z.infer<typeof ActionInputsSchema>;
