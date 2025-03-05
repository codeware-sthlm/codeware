import { z } from 'zod';

export const S3StorageSchema = z.object({
  S3_ACCESS_KEY_ID: z.string(),
  S3_BUCKET: z.string(),
  S3_ENDPOINT: z.string(),
  S3_FORCE_PATH_STYLE: z.string().transform((s) => s.toLowerCase() === 'true'),
  S3_REGION: z.string(),
  S3_SECRET_ACCESS_KEY: z.string()
});

export type S3Storage = z.infer<typeof S3StorageSchema>;
