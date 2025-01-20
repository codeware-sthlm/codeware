import { z } from 'zod';

export const SeedSourceSchema = z.enum(
  ['cloud', 'cloud-local', 'local', 'off'],
  {
    description:
      'Source of seed data: cloud = only from cloud, cloud-local = first cloud, fallback to local, local = only from local, off = do not seed'
  }
);

export type SeedSource = z.infer<typeof SeedSourceSchema>;
