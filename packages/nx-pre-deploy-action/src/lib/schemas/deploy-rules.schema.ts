import { z } from 'zod';

export const DeployRulesSchema = z.object({
  /**
   * App filter rule. Use '*' for all apps or comma-separated app names.
   * Required field.
   */
  apps: z.string().nonempty('apps rule is required'),

  /**
   * Tenant filter rule. Use '*' for all tenants or comma-separated tenant IDs.
   * Required field.
   */
  tenants: z.string().nonempty('tenants rule is required')
});

export type DeployRules = z.infer<typeof DeployRulesSchema>;
