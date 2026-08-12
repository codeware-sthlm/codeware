import { z } from 'zod';

/**
 * A plain SMTP host with no credentials — a local mail catcher.
 *
 * Mailpit (`nx dx:mail cms`) is what this is for in development: it never
 * expires, needs no account, and keeps every message in one inbox the whole
 * team can reason about. Kept separate from the Ethereal variables because
 * those carry credentials that go stale.
 */
export const SmtpSchema = z.object({
  SMTP_FROM_ADDRESS: z
    .string({ description: 'Default from address' })
    .email()
    .optional()
    .or(z.literal('')),
  SMTP_FROM_NAME: z.string({ description: 'Default from name' }).optional(),
  SMTP_HOST: z.string({ description: 'SMTP host' }),
  SMTP_PORT: z.number({ coerce: true, description: 'SMTP port' })
});

export type Smtp = z.infer<typeof SmtpSchema>;
