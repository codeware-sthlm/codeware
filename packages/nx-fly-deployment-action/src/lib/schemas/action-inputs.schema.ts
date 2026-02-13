import { z } from 'zod';

const AppDeploymentDetailsSchema = z.object({
  tenant: z.string().optional(),
  env: z.record(z.string(), z.string()).optional(),
  secrets: z.record(z.string(), z.string()).optional()
});

export const ActionInputsSchema = z.object({
  buildArgs: z.array(z.string()).optional(),
  env: z.array(z.string()).optional(),
  environment: z.enum(['preview', 'production']).optional(),
  flyApiToken: z.string().optional(),
  flyOrg: z.string().optional(),
  flyRegion: z.string().optional(),
  flyTraceCli: z.boolean().optional(),
  flyConsoleLogs: z.boolean().optional(),
  mainBranch: z.string().optional(),
  optOutDepotBuilder: z.boolean().optional(),
  secrets: z.array(z.string()).optional(),
  appDetails: z
    .record(z.string(), z.array(AppDeploymentDetailsSchema))
    .optional(),
  token: z.string().min(1, 'A GitHub token is required')
});

export type AppDeploymentDetails = z.infer<typeof AppDeploymentDetailsSchema>;
export type ActionInputs = z.infer<typeof ActionInputsSchema>;
