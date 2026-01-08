import { z } from 'zod';

/**
 * Sentry environment schema with necessary configuration variables
 * for server-side error tracking.
 */
export const SentrySchema = z.object({
  SENTRY_DSN: z.string({
    description: 'Data Source Name - Sentry project identifier'
  }),
  SENTRY_ORG: z.string({
    description: 'Sentry organization slug'
  }),
  SENTRY_RELEASE: z
    .string({
      description: 'Sentry release version identifier when available'
    })
    .optional()
});

export type Sentry = z.infer<typeof SentrySchema>;
