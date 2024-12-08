import { z } from 'zod';

/**
 * A url that can be empty
 */
export const AllowEmptyUrlSchema = z.string().url().or(z.literal(''));

/**
 * A valid Fly app name
 */
export const NameSchema = z
  .string({ message: 'App name must be a valid slug' })
  .regex(/^[a-z0-9-]+$/);
