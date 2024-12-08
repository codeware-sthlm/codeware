import { z } from 'zod';

/**
 * Deploy application response
 */
export const DeployResponseSchema = z.object({
  app: z.string(),
  hostname: z.string(),
  url: z.string().url()
});
