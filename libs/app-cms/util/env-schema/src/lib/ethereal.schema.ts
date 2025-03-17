import { z } from 'zod';

export const EtherealSchema = z.object({
  ETHEREAL_FROM_ADDRESS: z
    .string({ description: 'Default from address' })
    .email()
    .optional()
    .or(z.literal('')),
  ETHEREAL_FROM_NAME: z.string({ description: 'Default from name' }),
  ETHEREAL_HOST: z.string({ description: 'Ethereal SMTP host' }),
  ETHEREAL_PORT: z.number({ coerce: true, description: 'Ethereal SMTP port' }),
  ETHEREAL_USERNAME: z.string({ description: 'Ethereal SMTP username' }),
  ETHEREAL_PASSWORD: z.string({ description: 'Ethereal SMTP password' })
});

export type Ethereal = z.infer<typeof EtherealSchema>;
