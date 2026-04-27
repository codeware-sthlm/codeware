import { z } from 'zod';

export const BuildResponseSchema = z.object({
  appName: z.string(),
  imageRef: z.string()
});
