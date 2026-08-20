import { z } from 'zod';

/**
 * Any SMTP relay — a local catcher, a hosted sandbox, or a real one.
 *
 * Deliberately generic rather than named after a provider: `SENDGRID_*` locks
 * a deployment to whichever service happens to be behind it, so swapping
 * providers means renaming variables everywhere they're read. Auth is
 * optional because Mailpit (`nx dx:mail cms`), the development default,
 * needs none — a hosted catcher such as Mailtrap, or a real relay, supplies
 * both.
 */
export const SmtpSchema = z.object({
  SMTP_FROM_ADDRESS: z
    .string({ description: 'Default from address' })
    .email()
    .optional()
    .or(z.literal('')),
  SMTP_FROM_NAME: z.string({ description: 'Default from name' }).optional(),
  SMTP_HOST: z.string({ description: 'SMTP host' }),
  SMTP_PORT: z.number({ coerce: true, description: 'SMTP port' }),
  SMTP_USERNAME: z.string({ description: 'SMTP username' }).optional(),
  SMTP_PASSWORD: z.string({ description: 'SMTP password' }).optional()
});

export type Smtp = z.infer<typeof SmtpSchema>;
