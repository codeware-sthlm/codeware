import { z } from 'zod';

export const SendGridSchema = z.object({
  SENDGRID_API_KEY: z.string({ description: 'SendGrid API key' }),
  SENDGRID_FROM_ADDRESS: z
    .string({ description: 'Default from address' })
    .email()
    .optional()
    .or(z.literal('')),
  SENDGRID_FROM_NAME: z.string({ description: 'Default from name' })
});

export type SendGrid = z.infer<typeof SendGridSchema>;
