import { z } from 'zod';

export const ActionInputsSchema = z.object({
  mainBranch: z.string(),
  token: z.string(),
  // Infisical configuration for tenant fetching
  infisicalClientId: z.string().optional(),
  infisicalClientSecret: z.string().optional(),
  infisicalProjectId: z.string().optional(),
  infisicalSite: z.enum(['eu', 'us']).optional(),
  // Preview lane the release versions are resolved within. Digits only — it
  // reaches `nx release` as a prerelease id, where anything else is invalid.
  prNumber: z
    .string()
    .regex(/^\d+$/, 'PR number must contain digits only')
    .optional(),
  // Manual deployment overrides
  manualApp: z.string().optional(),
  manualTenant: z.string().optional(),
  manualEnvironment: z.enum(['preview', 'production']).optional()
});

export type ActionInputs = z.infer<typeof ActionInputsSchema>;
